# Rare Olds API reference

All URLs below are **relative** to the site origin — the same scheme + host the site runs on (production domain, Vercel preview, tailnet `http://100.70.242.65:5173`, or `localhost:5173`). Prepend the origin to any path, e.g. `http://100.70.242.65:5173/api/v1/public/whiskies`.

Three separate namespaces — never mix consumers:

- **Public API** (`/api/v1/public/*`) — for external consumers (AI agents, scraping, apps) to query products, distilleries, origins and data. Open and free, no auth, rate-limited by IP.
- **Frontend APIs** (`/api/*`) — the web app's own routes, called by the site's components. Session-aware (Google login) where marked; **not** for external consumers.
- **Admin APIs** (`/api/admin/*`) — admin-panel CRUD. Admin login required.

All JSON errors share the shape `{ "error": "string" }`.

---

## Public API — `/api/v1/public`

The only stable external contract. Serves from the site's build-time JSON export (`src/lib/data/*.json`), regenerated on every deploy — the API **never queries Turso**.

- **Rate limit:** default **60 requests per minute per IP**. Over the limit → `429` `{ "error": "rate_limited" }`, with a `Retry-After` header.
- **Abuse control:** admins can block an IP (→ `403` `{ "error": "blocked" }`) or override its limit in the admin panel (`/admin/api`). Controls apply within ~60s.
- **Localization:** `?lang=` — `en` (default), `es`, `pt`, `ja`, `fr`. Unknown values fall back to `en`. `name`, `description`, `origin.name` and distillery `name`/`description` resolve to the selected language and fall back to the base field.

### `GET /api/v1/public/whiskies` — catalog list

Optional query params:

- `?country=` — filter by origin id (e.g. `scotland`, `japan`) or distillery country, case-insensitive.
- `?distillery=` — filter by distillery id or slug, case-insensitive.
- `?q=` — search across name/description, case-insensitive substring.
- `?lang=` — response language.

Response: `{ "data": [ Whisky, ... ] }` where `Whisky` is:

```json
{
  "id": "1770-glasgow-peated",
  "slug": "1770-glasgow-peated",
  "name": "1770 Glasgow Peated",
  "description": "…",
  "image": "/data/images/1770-glasgow-peated.webp",
  "images": ["/data/images/1770-glasgow-peated.webp"],
  "origin": { "id": "scotland", "name": "Scotland", "flag": "🏴" },
  "region": "Lowlands",
  "age": null,
  "volume": null,
  "abv": 46,
  "cask": null,
  "distillery": {
    "id": "glasgow-1770",
    "slug": "glasgow-1770",
    "name": "The Glasgow Distillery Co.",
    "description": "…",
    "country": "Scotland",
    "region": "Lowlands",
    "founded": 2014,
    "image": null,
    "website": null,
    "latitude": null,
    "longitude": null
  },
  "videos": [
    { "language": "en", "platform": "youtube", "url": "https://youtube.com/watch?v=…", "label": "…" }
  ]
}
```

`distillery` is `null` when unset. `videos` is the full influencer-video list (not the truncated 4 shown on the site).

### `GET /api/v1/public/whiskies/{slug}` — single whisky

Slug or product id. `?lang=` as above. Unknown id → `404` `{ "error": "not_found" }`. Same shape as one item above.

### `GET /api/v1/public/origins` — origins list

`?lang=` supported. Response: `{ "data": [{ "id": "scotland", "name": "Scotland", "flag": "🏴" }, …] }`.

### `GET /api/v1/public/distilleries` — distilleries list

`?lang=` supported (localizes name + description). Response: `{ "data": [ Distillery, … ] }`, same shape as the embedded `distillery` above.

---

## Frontend APIs — `/api`

Routes the web app's own UI calls. They read/write Turso directly unless noted. **Not documented for external consumers** and not guaranteed stable. Session = Google-login cookie.

### Auth (Google OAuth + demo + nostr)

- `GET /api/auth/login` — starts Google OAuth; optional `?next=` (safe internal path). Redirects to Google.
- `GET /api/auth/callback` — OAuth callback; sets the session cookie.
- `POST /api/auth/logout` — clears the session cookie.
- `GET /api/auth/me` — current session user, if any.
- `POST /api/auth/mock` — demo login (dev/test); sets the session cookie.
- `POST /api/auth/nostr` — nostr-login with a signed event.

### Community (session required)

- `POST /api/vote` — upsert a vote on a product (`entity_id`, `karma` ±1, optional `country`).
- `GET /api/favorites` — list of the user's favorite product slugs.
- `POST /api/favorites` — toggle favorite (`product_id`, `on` boolean).
- `GET /api/distillery-followers` — distillery ids the user follows.
- `POST /api/distillery-followers` — toggle follow (`distillery_id`, `on` boolean).

### Reviews

- `GET /api/reviews?productId=…&country=…` — cached reviews for a product. No login.
- `POST /api/reviews` — create a review (multipart form: `productId`, `country`, rating, text, image ≤3MB jpeg/png/webp). Session required.
- `GET /api/reviews/{id}/image` — serve a review's image. No login.

### Frontend data (no login)

- `GET /api/rating?slugs=a,b,c` — ratings for the given slugs; also returns `reviewed` slugs for the logged-in user, when any.
- `GET /api/karma?slugs=a,b,c` — karma for the given slugs; also returns `voted` slugs for the logged-in user, when any.
- `GET /api/prices?country=…` — current price list for that country's site (default `UY`), with `currency` and `symbol`.
- `GET /api/stores?product=…` — store lookup for a product: resolves the visitor's country from their IP and returns that country's stores (`country`, `currency`, `stores`); falls back to English stores.

### Download paywall (live SQLite dump — task 044, kept)

- `POST /api/download/request` — request the SQLite dump by submitting `{ "email" }`. Validates the email, rate-limited **5/min per IP**, then records the request in Turso for an admin to grant.
- `GET /api/data/download?token=…` — download `oldrare-<date>.db` (SQLite). The token is signed, single-use, ~1h TTL, minted via `/admin/downloads`. Redirects back to `/download` on missing/consumed/invalid tokens.

---

## Admin APIs — `/api/admin`

All require admin session (Google login with admin email). Return `403 { "error": "forbidden" }` otherwise. REST-style, keyed by an `id`. The admin UI pages are the primary clients.

- `GET/PUT/DELETE /api/admin/stores` — store records.
- `GET/PUT/DELETE /api/admin/store-countries` — per-country store pages.
- `GET/POST/PUT/DELETE /api/admin/products` — products.
- `GET/POST/PUT/DELETE /api/admin/distilleries` — distilleries.
- `GET/PUT/DELETE /api/admin/origins` — origins (delete blocked while referenced by products/distilleries/regions).
- `GET/DELETE /api/admin/reviews` — reviews.
- `GET/PUT/DELETE /api/admin/videos` — influencer videos.
- `GET/PUT/DELETE /api/admin/pages` — static pages.
- `GET/PUT/DELETE /api/admin/users` — users.
- `GET /api/admin/stats` — aggregate site stats.
- `GET/POST /api/admin/downloads` — list download requests; `POST` with `{ "id", "hours" }` grants a signed download link (returns `url`, `expiresAt`).
- `GET/PUT/DELETE /api/admin/api-ip-controls` — public-API abuse controls (block/unblock IP, per-IP `limit_per_min` override); backed by the Turso `api_ip_controls` table, applied within ~60s.

---

## Known limits

- Public-API rate limiting is an in-memory sliding window per warm serverless instance, with the Turso blocklist cached 60s — best-effort under burst traffic, not a hard global budget.
- `/api/v1/public/*` is excluded from all payment/credential flows by design (owner decision, 2026-09-23).
- Only `/api/v1/public/*` is a stable public contract; `/api/*` and `/api/admin/*` may change without notice.