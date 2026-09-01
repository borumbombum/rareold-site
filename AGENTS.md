## General Guidelines

* Use Plain Language for your answers.
* Be succinct: Answer directly. Skip greetings, sign-offs, restating the request, and narrative walkthroughs of what you did. Give the shortest explanation that fully answers unless I ask for more detail. This applies to prose only; code, commands, and data output aren’t trimmed for length.
* Active voice. Address the reader directly ("you").
* Keep necessary technical terms, but explain them briefly on first use.
* State actions, constraints, scope, and expected results explicitly.
* Cut filler, hedging, jargon, and repetition.
* If precision and natural phrasing conflict, precision wins.
* At the end of every important task or upon making an error you and correcting it you MUST update the docs/lessons-learned.md file.
* If you create a new tool like say `yt-search.mjs` document them in a docs/TOOLS.md file.
* New skills go into `.agents/skills/`.

# RULES

- Sites must always be ultra-fast, no shortcuts taken that is why we will use Turso and Sveltekit.
- Login will only be via Google Login.
- Css only with configured Tailwind classes.
- Images will be the only thing heavily cached at client cache with 30 days TTL. The rest of things (json files) will be cached at the sveltekit runtime level so we can control cache.
- Do one todo at a time. Study the task first and ask if you need any tokens.
- Do not take shortcuts. Make all efficient and minimal.
- For each new task make sure that the structure hasn't change, so you get an updated idea of the system.
- Stop after each todo completed and report back before continuing.
- If you consider some change might break current usage experience then query for confirmation.
- Never ask to commiit, and never push to remote without being explictly asked. Remote repo goes directly to production so its very risky to push to remote.
- Skills live only in `.agents/skills/`.
- Every time you finish a hard task write what you learned about in an docs/LEARNINGS.md file.

## Task workflow

Tasks follow the `tasks` skill (`.agents/skills/tasks/SKILL.md`). It defines where tasks live, the `[TODO]` / `[IN_PROGRESS]` / `[DONE]` markers, how to pick the next task (including the `HIGH PRIORITY` override), and handoff via the `## Progress` log. Use that skill when creating, picking up, or finishing a task.

- Task state is tracked only in the task files (`tasks/NNN-slug.md`) and the `## Tasks` list below — nothing else.
- **Status list sync (mandatory):** the `## Tasks` list below is THE authoritative record of task state for every agent. On every `Status:` change — starting, finishing, handing off, or superseding — update the matching list line in the same change. An agent that finds drift must fix it immediately.
- After a task is `[DONE]`, stop and report back. Do not auto-continue into the next task — wait for an explicit order.

## Localization (adding a new language)

All user-facing text is locale-aware. Two kinds of content exist, and a new language must be wired into **both**. To add a language:

1. **`src/lib/utils/locales.ts`** — add one entry to `LOCALE_CONFIG`. This is the **single source of truth**: `hooks.server.ts`, `LanguageModal`, `LanguageSwitcher`, `Header`, sitemaps, `origins.ts`, route loaders, and `types.ts` all derive from it. No other hardcoded locale maps need editing.
2. **UI strings** — create `messages/<new-locale>.json` and register the locale in `project.inlang/settings.json` (`locales` array + `urlPatterns`).
3. **Vite plugin** — add `['xx', ':protocol://:domain(.*)::port?/xx/:path(.*)?']` to both `urlPatterns` blocks in `vite.config.ts` (paraglide plugin). Add a mapping for any route-specific patterns (e.g. `/origen/` → `/xx/slug/`).
4. **DB columns** — add `<field>_<locale>` columns via migration in `db/migrations/` and bootstrap data in `ORIGIN_META` (`scripts/db-sync.mjs`) + `data/seed/whiskies.json`.

### 1. UI strings — Paraglide messages

- Messages live in `messages/<locale>.json` (e.g. `es.json`, `pt.json`). `project.inlang/settings.json` defines `baseLocale` (the default) and `locales`.
- Adding a language: create `messages/<new-locale>.json`, add it to `locales` and `urlPatterns` in `project.inlang/settings.json`. The build (Vite plugin) regenerates `src/lib/paraglide/` — never hand-edit those generated files.
- Do not add message keys that only hold data (e.g. origin names). Data goes in the DB (see below). Messages are for UI chrome only.

### 2. DB content — origins and product text (source of truth is Turso)

Origin labels and product names/descriptions are translated columns in Turso, exported to the frontend JSON (`src/lib/data/`). Never hardcode a label map in a component.

- **Turso is the sole source of truth for content.** The seed files (`data/seed/whiskies.json`, `resellers.json`) are bootstrap-only: `npm run db:sync` inserts rows that don't exist yet (`ON CONFLICT DO NOTHING`) and backfills locale columns on existing rows (`ON CONFLICT DO UPDATE` for `_pt`, `_en`, `_ja` fields). Content edits go to Turso via the admin UI (`/admin`) or SQL, then `npm run data:export` → build.
- Origins: `origins` table has `name` (English canonical), plus one override column per language (`name_es`, `name_pt`, ...). `ORIGIN_META` in `scripts/db-sync.mjs` is the bootstrap source for new origins; new override columns are added via a migration in `db/migrations/` (follow the pattern of `0005_localized_content.sql`).
- Products: `products` table has base `name`/`description` (fallback, Spanish — the DB base stays Spanish even though the UI `baseLocale` is English since task 032) and override columns `<field>_<locale>` (`name_pt`, `description_pt`, ...). New products/locale columns for new languages are bootstrapped from `data/seed/whiskies.json`; translations for existing products are edited in Turso.
- `src/lib/utils/l10n.ts` `l10n(item, field)` resolves `<field>_<locale>` for the active locale and falls back to the base field; `src/lib/utils/origins.ts` `originLabel()` does the same for origins. `LOCALE_FIELD` in `origins.ts` is auto-derived from `LOCALE_CONFIG` — no manual extension needed when adding a new locale.
- The pipeline is always: content in Turso (bootstrap via seed once, then edits via `/admin`) → `npm run data:export` (Turso → `src/lib/data/*.json`) → build. Every product must have `description_pt` (and any other language you add) or the localized content pass is incomplete.

## Adding whiskies

- New whiskies are added with the `add-product` skill, driven by the queue file `docs/whisky-brands-and-products-to-add.md` (format: `[whisky_name] - [distillery]`, one per line; agents take the first unticked line and tick ✅ when done).
- Never add a whisky or distillery that already exists — the skill includes the de-dup check.
- If the distillery doesn't exist yet, the agent creates the full record (all data via research + translations in all locales) as part of the same insert.
- Every new product ships with influencer videos for all languages and descriptions translated to es/pt/en/ja/fr.

## Toast notifications

Use `ui.showToast()` from `$lib/stores/ui.svelte` to show temporary user feedback. Toasts auto-dismiss after ~2.6 seconds.

- **Success:** `ui.showToast('Saved!')` — dark background, CheckCircle icon.
- **Error:** `ui.showToast('Something went wrong', true)` — red background, AlertCircle icon.

Already used in VoteButton, FavoriteButton, AuthButton, LanguageSwitcher, ShareButton, etc. Always prefer `showToast` over alerts or console.log for user-facing feedback.

## Tasks

Current status of `tasks/` (authoritative — kept in sync with every task file `Status:` change, see Task workflow):

- 066 [TODO] Database And Api Plans Page
- 065 [TODO] Api Paywall Consumer Credentials
- 064 [TODO] Public Api Rate Limiting
- 063 [DONE] Video Language Flag On Product Page
- 062 [TODO] Youtube Influencer Contact List
- 000 [DONE] Images Webp Script
- 001 [DONE] Json Data Turso Migration
- 002 [DONE] Google Auth Own Turso Cubiq Detach
- 003 [DONE] Drawer Region Transition
- 004 [DONE] Admin Section
- 005 [DONE] Dark Mode Card Images White Background
- 006 [DONE] Product Videos Per Country Sommeliers
- 007 [DONE] Desktop Search Bar Below Hero
- 008 [DONE] Vote Image Upload And Location
- 009 [DONE] Share Button Product Page
- 010 [DONE] Us Site Paraglide
- 011 [DONE] Google Login Redirect Pkce Cookie
- 012 [DONE] Resellers Turso Source Of Truth
- 013 [DONE] Remove Public Base Url Detect Origin
- 014 [DONE] Favorites Love Whiskies
- 015 [DONE] Git Link Github Repo
- 016 [DONE] Sitemaps By Language (superseded by 023)
- 017 [DONE] Pages Cms About
- 018 [DONE] View Toggle Flick
- 019 [DONE] Ranking Most Voted First
- 020 [DONE] Vote State Server Authoritative
- 021 [DONE] Youtube Video Search Skill
- 022 [DONE] Nostr Login Nip07 Desktop
- 023 [DONE] Rss Robots Sitemap Link Verification
- 024 [DONE] Compact View Product Grid
- 025 [DONE] Schema Org Product Reviews
- 026 [DONE] User Profile Favorites Voted Reviews
- 027 [DONE] Homepage Latest Activity Feed
- 028 [DONE] Unify Voting Star Ratings
- 029 [DONE] Heart Animation Favorite Button
- 030 [DONE] Canonical Hreflang Og Meta Seo Tags
- 031 [DONE] Translate Product Descriptions En
- 032 [DONE] Change Main Language To English
- 033 [DONE] Language Detector Ip Based
- 034 [DONE] Add French Language
- 035 [DONE] Hero Video Background
- 036 [DONE] Whisky Sorting Filters
- 037 [DONE] Add Whiskies Famous Grouse Bushmills Woodford Elijah Craig
- 038 [DONE] Add Whiskies Highland Park Dalmore Talisker
- 039 [DONE] Distillery Brand Database
- 040 [DONE] Influencer Videos Horizontal List
- 041 [DONE] Rework Origins Country Only Overflow
- 042 [DONE] Distillery Map Page
- 043 [DONE] Pages Cms Full Admin
- 044 [DONE] Sqlite Download Paywall
- 045 [DONE] Origins Admin Crud
- 046 [DONE] Distillery Public Page
- 047 [DONE] Remove Brand Use Distillery
- 048 [DONE] Featured Whiskies Homepage
- 049 [DONE] Follow Love Distillery
- 050 [DONE] Product Specs Pills Above Description
- 051 [DONE] Pin Origin Active Origin First
- 052 [DONE] Back To Top Button
- 053 [IN_PROGRESS] Backfill Videos 4 Per Language
- 054 [DONE] Add Whiskies Vat69 Scapa Tobermory Ledaig Torabhaig
- 055 [DONE] Add Whiskies Raasay Harris Abhainn Saxa Lagg
- 056 [TODO] Scalable Snapshot Loader Split Json Export
- 057 [TODO] Catalog Detail Pagination Slim Index
- 058 [TODO] Catalog Finer Shards Search
- 059 [TODO] Catalog Counts Ranking Snapshot Metadata
- 060 [DONE] Add 10 Speyside Whiskies Backfill Distillery Descriptions
- 061 [TODO] Store Owners Add Store Button
