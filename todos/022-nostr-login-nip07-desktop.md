Status: DONE

# Nostr login via NIP-07 (desktop only)

## Context

The site has two login methods: Google OAuth (PKCE redirect, httpOnly cookie session) and Demo login. Auth lives in `src/lib/server/auth.ts` (verify + upsert + issue JWT), `src/lib/server/users.ts` (upsert into Turso `users` table), `src/lib/stores/session.svelte.ts` (client state, SSR-hydrated), and the session cookie flow in `src/routes/api/auth/*`. The users table uses Google's `sub` as the `id` and stores `email`, `name`, `avatar`, `role`, `login_type`.

Nostr NIP-07 is a browser extension API (Alby, nos2x, etc.) that exposes `window.nostr` with `getPublicKey()` and `signEvent()`. It lets users authenticate with their Nostr identity — no email required, privacy-first. Desktop-only because NIP-07 only works via desktop browser extensions.

## Requirements

### Server-side

1. **`src/lib/server/auth.ts`**: add `loginWithNostr(pubkey, signedEvent, db)`:
   - Verify the event signature using schnorr (`@noble/curves/secp256k1`)
   - Validate: `kind === 27235` (NIP-98 HTTP auth), `created_at` within ±5 minutes of server time, `tags` contain `["u", origin]` and `["method", "GET"]`
   - Extract pubkey from the event (must match the claimed pubkey)
   - Upsert user in Turso: `id` = hex pubkey, `email` = null, `name` from event `content` field or default `"Nostr User"`, `avatar` = null, `login_type` = `'nostr'`
   - Issue HS256 JWT + return `{ access_token, user }` (same shape as Google login)

2. **`src/routes/api/auth/nostr/+server.ts`**: new POST endpoint
   - Accepts `{ pubkey: string, event: object }`
   - Calls `loginWithNostr`
   - Sets the `rareold.session` httpOnly cookie (same as `/api/auth/callback`)
   - Returns `{ access_token, user }`

3. **`src/lib/server/users.ts`**: extend `upsertUser` / `GoogleClaims` type to accept Nostr claims (no email required, `login_type = 'nostr'`)

### Client-side

4. **`src/lib/utils/nostr.ts`**: new client-side helper
   - `isNip07Available()` — checks `typeof window !== 'undefined' && typeof window.nostr !== 'undefined'`
   - `getNostrPubkey()` — calls `window.nostr.getPublicKey()`
   - `signNostrChallenge(origin)` — builds a NIP-98 event (`kind: 27235`, `tags: [["u", origin], ["method", "GET"]]`, `content` = display name or empty), calls `window.nostr.signEvent(event)`, returns the signed event

5. **`src/lib/components/AuthButton.svelte`**: add "Login with Nostr" button
   - Visible only when `isNip07Available()` returns true (no mobile fallback)
   - On click: get pubkey → sign challenge → POST `/api/auth/nostr` → `session.setUser(user)` → redirect to `next` path
   - Style consistent with existing Google/Demo buttons
   - Show a tooltip/link explaining "Install Alby or nos2x extension" when no extension detected

6. **Messages**: add `login_nostr` key in `messages/es.json` and `messages/pt.json`

### Dependencies

7. **`@noble/curves`**: add to `package.json` dependencies (~2KB). Used for `schnorr.verify()` in the Nostr event signature check.

### Tests

8. **`tests/nostr.test.ts`**:
   - Valid NIP-98 event verification (schnorr signature check)
   - Wrong pubkey rejected
   - Wrong kind rejected (not 27235)
   - Stale event rejected (>5 min old)
   - Missing/wrong `tags` (`u`, `method`) rejected
   - Full loginWithNostr flow with in-memory DB

## Acceptance criteria

- Desktop users with a NIP-07 extension see a "Login with Nostr" button in the auth UI
- Clicking it signs a NIP-98 event → server verifies schnorr signature → session created → same UX as Google login
- Nostr users appear in Turso with `login_type = 'nostr'`, pubkey hex as `id`, no email
- Forged/invalid/stale signatures rejected with 401
- Google and Demo login still work, no regressions
- Nostr button hidden when no extension is installed (no errors, no broken UI)
- `npm run check`, `npm test`, `npm run build` pass

## Progress

