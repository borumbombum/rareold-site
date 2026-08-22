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
- Only add skills in .agents not in .opencode
- Every time you finish a hard task write what you learned about in an docs/LEARNINGS.md file.

## Task workflow

Tasks live as one markdown file per task in `/todos/`. Do not track tasks anywhere else.

- **File naming:** `NNN-slug.md`. The `NNN` prefix is a zero-padded 3-digit priority: lower number = higher importance = do it first. Prefixes must stay unique. Example: `todos/002-google-auth-own-turso-cubiq-detach.md`.
- **Status:** every task file MUST start with a `Status:` line, and it must be one of:
    - `Status: TODO` — not started, available to pick up.
    - `Status: WORKING-AGENT-<session>` — currently being implemented by an agent. Replace `<session>` with your own session identifier.
    - `Status: DONE` — implemented and verified. Do not touch again.
- **Picking the next task:** read `/todos/`, list the files sorted by `NNN`, and pick the lowest `NNN` whose status is `TODO`. **Exception:** if any task has `HIGH PRIORITY` in its status line, pick that one first regardless of NNN number. Never start a `DONE` task, and never start a `WORKING-AGENT-*` task unless you are taking it over (see Handoff below).
- **Starting a task:** set the file's status to `Status: WORKING-AGENT-<your-session>` and add a `## Progress` section at the end of the file with a dated entry: your session, what you are doing, and what comes next. Read the whole task file first (Context / Requirements / Acceptance criteria); ask for tokens if anything is unclear.
- **Progress log:** keep the `## Progress` section updated as you work, not just at the start or end. Every meaningful step gets a short entry: what was done, current state, and the next step. This is the handoff record.
- **Handoff / token exhaustion:** if you run out of tokens mid-task, your last `## Progress` entry MUST state exactly where you left off and what the next agent should do. A replacement agent taking over a `WORKING-AGENT-*` task reads the `## Progress` log, changes the status to `Status: WORKING-AGENT-<its-session>`, and appends a handoff entry saying it is continuing.
- **When finished:** once implemented and verified (build, lint, typecheck pass), set the status to `Status: DONE`, then pick the next `TODO` task and repeat.
- Do not reorder, rename, or delete task files unless explicitly asked.
- **Status list sync (mandatory):** the status list under `## Next tasks` below is THE authoritative record of task state for every agent. Whenever you change a task file's `Status:` line — starting, finishing, handing off, or superseding — you MUST update its entry in that list in the same change. Never leave the list stale; an agent that finds drift must fix it immediately.

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

## Next tasks

Current status of `/todos/` (authoritative — keep in sync with every `Status:` change, see Task workflow):

- `000-images-webp-script.md` — DONE
- `001-json-data-turso-migration.md` — DONE
- `002-google-auth-own-turso-cubiq-detach.md` — DONE
- `003-drawer-region-transition.md` — DONE
- `004-admin-section.md` — DONE
- `005-dark-mode-card-images-white-background.md` — DONE
- `006-product-videos-per-country-sommeliers.md` — DONE
- `007-desktop-search-bar-below-hero.md` — DONE
- `008-vote-image-upload-and-location.md` — DONE
- `009-share-button-product-page.md` — DONE
- `010-us-site-paraglide.md` — DONE
- `011-google-login-redirect-pkce-cookie.md` — DONE
- `012-resellers-turso-source-of-truth.md` — DONE
- `013-remove-public-base-url-detect-origin.md` — DONE
- `014-favorites-love-whiskies.md` — DONE
- `015-git-link-github-repo.md` — DONE
- `016-sitemaps-by-language.md` — SUPERSEDED by 023
- `017-pages-cms-about.md` — DONE
- `018-view-toggle-flick.md` — DONE
- `019-ranking-most-voted-first.md` — DONE
- `020-vote-state-server-authoritative.md` — DONE
- `021-youtube-video-search-skill.md` — DONE
- `022-nostr-login-nip07-desktop.md` — DONE
- `023-rss-robots-sitemap-link-verification.md` — DONE
- `024-compact-view-product-grid.md` — DONE
- `025-schema-org-product-reviews.md` — DONE
- `026-user-profile-favorites-voted-reviews.md` — DONE
- `027-homepage-latest-activity-feed.md` — DONE
- `028-unify-voting-star-ratings.md` — DONE
- `029-heart-animation-favorite-button.md` — DONE
- `030-canonical-hreflang-og-meta-seo-tags.md` — DONE
- `031-translate-product-descriptions-en.md` — DONE
- `032-change-main-language-to-english.md` — DONE
- `033-language-detector-ip-based.md` — DONE
- `034-add-french-language.md` — DONE
- `035-hero-video-background.md` — DONE
- `036-whisky-sorting-filters.md` — DONE
- `037-add-whiskies-famous-grouse-bushmills-woodford-elijah-craig.md` — DONE
- `038-add-whiskies-highland-park-dalmore-talisker.md` — DONE
- `039-distillery-brand-database.md` — DONE
- `040-influencer-videos-horizontal-list.md` — DONE
- `041-rework-origins-country-only-overflow.md` — DONE
- `042-distillery-map-page.md` — DONE
- `043-pages-cms-full-admin.md` — DONE
- `044-sqlite-download-paywall.md` — DONE
- `045-origins-admin-crud.md` — DONE
- `046-distillery-public-page.md` — DONE
- `047-remove-brand-use-distillery.md` — DONE
- `048-featured-whiskies-homepage.md` — TODO
- `049-follow-love-distillery.md` — TODO
- `050-product-specs-pills-above-description.md` — TODO
- `051-pin-origin-active-origin-first.md` — TODO
- `052-back-to-top-button.md` — TODO
