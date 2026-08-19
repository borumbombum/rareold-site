# Old Rare

Community-ranked rare-whisky **info** site. No checkout, cart, or shipping: every product has a static list of retail/partner links ("Dónde comprar / Onde comprar") plus specs and user reviews/votes.

- `/` — Spanish (Uruguay)
- `/br` — Portuguese (Brazil)

## Stack

- SvelteKit 5 (Svelte 5 runes, `runes: true` everywhere)
- Tailwind CSS v4 (Vite plugin)
- Paraglide JS 2 (i18n, es/pt)
- lucide-svelte icons
- Vercel adapter

## Commands

```sh
npm install
npm run dev          # http://localhost:5173  (/ es, /br pt)
npm run db:sync      # migrations + additive upsert from data/seed/whiskies.json into Turso
npm run data:export  # regenerate src/lib/data/*.json from Turso
npm run data:images  # download + convert product images to webp (one-time; see Data)
npm run check        # typecheck (svelte-check)
npm run build        # db:sync + data:export + production build
npm run preview      # preview the build
```

Paraglide generates `src/lib/paraglide/` from `messages/*.json`. Run `npm run dev` or `npm run build` after editing messages, before `npm run check`.

## Data

**Turso is the source of truth.** The initial catalog was fetched once from the alambique.com.uy WooCommerce API; that one-time run is gone and we never hit the API again. The data now lives in the Turso database and the committed `src/lib/data/*.json` files are generated **from Turso at build time** so the front-end reads fast JSON, never the database at runtime:

- `npm run db:sync` (`scripts/db-sync.mjs`) — connects to Turso **only at build time**, applies any pending `db/migrations/*.sql`, derives origins/regions from `data/seed/whiskies.json`, upserts resellers from `data/seed/resellers.json`, and **additively** upserts them. It never deletes rows, so anything added directly to Turso is preserved. The `users`, `karma`, `votes`, and `reviews` tables are created empty and filled at runtime.
- **Adding a product**: edit `data/seed/whiskies.json` (the seed catalog — never overwritten by the build) and run `npm run db:sync`, or insert into Turso directly. Either way it lives in Turso; do **not** hand-edit `src/lib/data/whiskies.json` because the build regenerates it from Turso.
- `npm run data:export` (`scripts/db-export.mjs`) — reads Turso back and rewrites `whiskies.json`, `origins.json`, `regions.json` for the front-end. Per-product `resellers_*` arrays are resolved from Turso (product-specific listings when present, else the country's default stores). The build runs `db:sync && data:export` before `vite build`, so the committed JSON is always a faithful export of the database.
- `scripts/download-images.mjs` (`npm run data:images`) — one-time: downloads every product image from the API into `data/images/raw/`, converts them to webp (quality 85, `-force`) with the `png2webp` Go tool (auto-cloned and built into `tools/` on first run), moves the `.webp` files into `data/images/`, and rewrites each whisky's `image` to `/data/images/<slug>.webp`. Both the webp files and the JSON are committed. `data/images/raw/` and `tools/` are gitignored.
- Images are served from `/data/images/*` by `src/routes/data/images/[file]/+server.ts`, which is **prerendered**: every webp becomes a static file in Vercel's CDN at build. The route sets `Cache-Control: public, max-age=2592000, immutable` and `vercel.json` re-applies the same header in production (prerendered responses drop their headers). Images are the only assets heavily cached on the client (30 days), per the project rules.
- `src/lib/data/whiskies.ts` — client-safe accessor (`WHISKIES`, `getWhiskyBySlug`). The global search bar imports this directly, so the full list ships in the client bundle at build time.
- Resellers (Turso `resellers` table) — stores per country (`product_id` NULL = country-wide defaults, seeded from `data/seed/resellers.json`; `product_id` set = per-product listing). `db:export` resolves each product's `resellers_uy/br/usa` (product-specific rows first, then country defaults), so the front-end reads Turso-derived JSON. `price` is NULL for now — the UI hides it; a future price bot will fill real prices and affiliate deep links.
- `src/lib/server/data.ts` — the seam that feeds pages/APIs (catalog from the build-time JSON, karma/reviews from Turso with short runtime caching).
- `src/lib/server/turso.ts` — runtime Turso client. **Live data only** (users, votes, reviews, karma). The catalog is never read from Turso at runtime.
- `src/lib/server/auth.ts` — own Google auth: verifies the Google ID token locally (jose against Google's JWKS), upserts the user into Turso, and signs our own JWT (`AUTH_SECRET`, 30d).
- `src/lib/server/oauth.ts` — PKCE helpers, the Google authorization URL builder, and the code→token exchange (injectable for tests).
- `src/lib/server/session.ts` — httpOnly cookie helpers for the session and the OAuth `state` cookie.
- `src/lib/server/users.ts`, `votes.ts`, `reviews.ts` — Turso read/write helpers for users, votes/karma, and reviews.

There are no online prices: `price` is null and `GET /api/prices` returns an empty list.

## Pages & flows

- **Home `/`**: origin filter pills (horizontally scrollable, with per-origin whisky counts), grid/list toggle, ranking sorted by karma. Voting updates the optimistic `karmaStore` and re-sorts live.
- **Detail `/whisky/[slug]`**: image, vote button + vote count, description, specs table (region, age, ABV, volume, cask when present), "Dónde comprar" store list (prices hidden until real data exists), and reviews.
- **Global search** (in the header): type-ahead over the build-time preloaded catalog (matches name, brand, origin + translated origin label, and region). Arrow keys move the selection, Enter opens the result, Esc closes. Results link to the current locale's detail URL.
- **APIs**:
    - `POST /api/vote` — vote (`+1`/`-1`) by `slug`; authenticates via the session cookie, upserts the vote and recomputes karma in Turso.
    - `GET /api/karma?slugs=a,b,c` — live karma from Turso, `no-store` (fetched client-side after page load).
    - `GET/POST /api/reviews` — Turso-backed, `no-store`; POST authenticates via the session cookie.
    - `GET /api/prices?country=UY|BR` — per-site prices, `no-store`.
    - `GET /api/auth/login?next=/…` — start Google login (redirects to Google).
    - `GET /api/auth/callback?code&state` — Google redirects back here; exchanges the code and sets the session cookie.
    - `GET /api/auth/me` — current user from the session cookie (`{user}` or `{user: null}`).
    - `POST /api/auth/logout` — clears the session cookie.
    - `POST /api/auth/mock` — demo login; sets a real session cookie for a `demo` user in Turso.

## i18n & routing

- Messages live in `messages/es.json` and `messages/pt.json`. Use **snake_case** keys only — Paraglide exports identifiers (`m.key()`) only for safe key names; dotted keys become string-only exports.
- URL prefixes are configured with `urlPatterns` in `vite.config.ts` (`/` = es, `/br` = pt). The unprefixed base-locale pattern (es) must come **last**.

## Auth

Login is a **full-page redirect** to Google — no popup, no GSI script. Flow:

1. `GET /api/auth/login?next=/whisky/x` validates `next` (internal path only) and redirects to Google with a random `state` and a PKCE (`S256`) `code_challenge`; the `state`/`verifier`/`next` live in a short-lived httpOnly `rareold.auth_state` cookie.
2. Google redirects back to `GET /api/auth/callback?code&state`. We verify `state`, exchange `code` + `code_verifier` (+ `client_secret`, which Google requires for web-app clients even with PKCE) for tokens at `oauth2.googleapis.com/token`, verify the returned ID token locally (jose, Google JWKS: signature, `aud`, `iss`, `exp`, `email_verified`), upsert the user into Turso `users`, and issue our own JWT signed with `AUTH_SECRET` (HS256, 30d) into an **httpOnly `rareold.session` cookie**. Then we redirect back to `next`.

- **Google Cloud Console (required once):** add `https://<your-domain>/api/auth/callback` to the OAuth client's **Authorized redirect URIs** (one exact URL per environment — dev `http://localhost:5173`, prod `https://<domain>`), or Google rejects the callback with `redirect_uri_mismatch`. The callback URL is **auto-detected from the request origin** — no `PUBLIC_BASE_URL` env var. The Client ID alone is not enough. Google requires the Client Secret at the token exchange, even with PKCE.
- The session token never reaches JavaScript: `src/routes/+layout.server.ts` hydrates the user from the cookie on every server load, protected APIs (`/api/vote`, `/api/reviews` POST, `/api/auth/me`) read the cookie, and the client store (`session.svelte.ts`) only holds the `user`.
- If `PUBLIC_GOOGLE_CLIENT_ID` is empty, the header shows a **demo login** button (sets a real session cookie for a `demo` user persisted in Turso). Voting/reviewing work fully in demo mode.
- **CSRF:** the session cookie is `SameSite=Lax` and the write endpoints only accept JSON bodies; the login flow is protected by the `state` check.

## Environment

Copy `.env.example` to `.env`. Variables:

| Var                             | Purpose                                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_GOOGLE_CLIENT_ID`       | Google OAuth client id (empty = Google login disabled). Authorized redirect URI: `https://<your-domain>/api/auth/callback` (auto-detected; set in Google Console)                   |
| `GOOGLE_CLIENT_SECRET`          | Google OAuth client secret (Google Console → Credentials → OAuth client → Client secret). Required at the token exchange even with PKCE. Empty = Google login disabled              |
| `AUTH_SECRET`                   | Secret that signs our JWTs (`openssl rand -base64 32`)                                                                                                                              |
| `PUBLIC_INSTAGRAM_URL`          | Instagram link in the header                                                                                                                                                        |
| `TURSO_URL`, `TURSO_AUTH_TOKEN` | Turso database URL + token. Used at build (`db:sync`/`data:export`) **and at runtime** for live data — set all three (`TURSO_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`) in Vercel too |

## Styling

- Tailwind v4 theme, animations, and base rules in `src/app.css` (`@theme`, `@layer base` — including the global `cursor: pointer` rule Tailwind v4 dropped, and the `no-scrollbar` utility).
- Dark mode via a `.dark` class on `<html>`; `src/lib/stores/theme.svelte.ts` reads `localStorage` and the layout calls `theme.init()` in a `$effect`.

## Components / stores / utils

- `src/lib/components/` — header (logo, search, Instagram, theme toggle, login), product card/row, vote button, origin filters, view toggle, review section, toast, login/video modals.
- `Modal.svelte` is the **single global modal** (centered dialog); login and video modals are thin wrappers around it and are mounted once in `+layout.svelte` alongside the toast.
- `src/lib/stores/` — `karma`, `session`, `theme`, `ui` (modal/toast state), `view` (grid/list).
- `src/lib/utils/` — `origins`, `affiliates`, `format`.
