Status: TODO

# Server-authoritative "voted" state (fixes yellow buttons after logout)

## Context

Bug reported: after logging out, the whiskies the user voted on still show the yellow "voted" state.

Root cause: `src/lib/components/VoteButton.svelte` keeps the "I voted" map in localStorage under a
**global, user-agnostic key** (`rareold.votes`), loaded on mount regardless of who is logged in.
Logout (`session.clear()`) clears the server cookie and `session.user` but never touches this
localStorage entry, so `isVoted` stays true after logout — and a different Google account on the same
browser would inherit the previous user's yellow state too.

The votes themselves are already per-user in Turso: `votes(entity_id, user_id, country, value)` in
`db/migrations/0001_init.sql`, upserted by `applyVote` in `src/lib/server/votes.ts`. Only the yellow
indicator is client-local. This task makes that indicator server-authoritative.

## Requirements

1. **Server query**: in `src/lib/server/votes.ts`, add `getUserVotedSlugs(userId, slugs?)` returning
   the entity_ids the user has a non-zero vote on (optionally filtered to a slug set).

2. **Endpoint**: extend `GET /api/karma` (`src/routes/api/karma/+server.ts`) so that, when the session
   user is authed (`getSessionUser`), the response also includes the user's voted entity_ids, e.g.
   `{ items, voted: string[] }`. Keep `Cache-Control: no-store`. Alternatively add a dedicated
   authed endpoint if that keeps the karma payload lean.

3. **Client store**: a small `voted.svelte.ts` store seeded on mount from that endpoint, following the
   `karmaStore.refresh`/`refreshKarma` pattern in `src/lib/stores/karma.svelte.ts`. Refetch on
   login/logout/account change (reactive to `session.user`).

4. **VoteButton**: `isVoted` reads server truth from the store (falls back to optimistic local update
   on click, then reconciles with the vote response — the existing `applyDelta`-style pattern). Remove
   the global `rareold.votes` localStorage usage.

5. Optionally clear the legacy `rareold.votes` key once (one-time migration) — old keys become orphaned
   after this change.

## Acceptance criteria

- After logout there are **no** yellow "voted" buttons (state follows `session.user`).
- Logging in on another device shows the correct voted state (server truth, not browser-local).
- Vote → reload → yellow persists (server-backed).
- Account switch on the same browser shows that account's own voted state.
- `npm run check`, `npm test`, and `npm run build` pass.

## Progress

- 2026-08-15: Task opened (owner chose Option B over the interim per-user localStorage key; deliberately
  not implemented now). Votes are confirmed per-user in Turso `votes`; only the yellow indicator leaks
  (`VoteButton.svelte` global `rareold.votes` key).
