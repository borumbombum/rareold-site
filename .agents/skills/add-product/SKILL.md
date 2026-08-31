---
name: add-product
description: Step-by-step guide for adding a new whisky product to the Old Rare catalog in all languages, driven by the user-maintained queue file. Covers picking from the queue, de-duplication checks, distillery creation when missing, research, images, influencer videos for all languages, seed data, DB sync, and export. Use whenever adding a new product to the catalog.
---

# Adding a new product

Complete checklist for adding a whisky to the catalog. Each step lists the exact file and what to do.

New products are **queue-driven**: the user writes one line per whisky in
`docs/whisky-brands-and-products-to-add.md` with the format:

```
[whisky_name] - [distillery]
```

You pick the first unticked line, do all the work, and tick it off at the end.

## How the data pipeline works

Understanding the data flow makes the process faster:

```
docs/whisky-brands-and-products-to-add.md  ← Queue: pick [whisky_name] - [distillery] (user-maintained)
        │
        ▼
data/seed/distilleries.json                ← Add distillery here FIRST if it doesn't exist yet
data/seed/whiskies.json                    ← You edit this (product entry + influencer_videos)
        │
        ▼
npm run db:sync                            ← Seeds into Turso; distilleries BEFORE products, then videos
        │
        ▼
Turso (database)                           ← Source of truth for all content
        │
        ▼
npm run data:export                        ← Exports Turso → src/lib/data/*.json
        │
        ▼
src/lib/data/*.json                        ← SvelteKit reads these at build time
```

**Key concepts:**

- **Turso is the source of truth.** The seed files bootstrap data that doesn't exist yet. Distilleries insert with `ON CONFLICT DO NOTHING` — so a distillery record must be complete at creation time. Products insert new rows and backfill locale columns on existing ones (`ON CONFLICT DO UPDATE` for `_pt`, `_en`, `_ja`, `_fr`). Influencer videos are `INSERT OR IGNORE`, keyed on `(product_id, language, url)`.
- **The JSON files are the fast path.** `data:export` pre-joins products with regions, resellers, distilleries and videos, so SvelteKit serves them without a DB query at request time.
- **Locale columns:** `name` and `description` are the base locale (Spanish — the DB base stays Spanish even though the UI `baseLocale` is English). Overrides exist per language: `_es` is implicit in the base, plus `name_pt`/`description_pt`, `name_en`/`description_en`, `name_ja`/`description_ja`, `name_fr`/`description_fr`. The `l10n(item, field)` utility resolves the active locale's field with fallback to base.
- **Images** are served from `data/images/<slug>.webp` via a prerendered SvelteKit route with 30-day cache headers.
- **Influencer videos** are per-language. At runtime, if a language has fewer than 4 videos, English videos fill the remaining slots (deduplicated by URL) — provide 4 per language when possible (hard floor of 2).

## Quick overview

0. **Pick & de-duplicate** — read the queue file, verify nothing already exists
1. **Research** — web search for product info
2. **Distillery** — create full record if it doesn't exist (all data + all translations)
3. **Image** — download + resize + convert to webp
4. **Seed data** — add entry to `data/seed/whiskies.json`
5. **Influencer videos** — real review videos for all 5 languages
6. **DB sync** — `npm run db:sync`
7. **Data export** — `npm run data:export`
8. **Verify & tick off** — `npm run check`, then ✅ the queue line

---

## Step 0: Pick from the queue & de-duplicate

**File:** `docs/whisky-brands-and-products-to-add.md`

Take the **first line without ✅** and parse it:

- `[whisky_name]` — the product/expression to add
- `[distillery]` — the producing distillery or brand

**Mandatory existence checks before doing anything:**

1. **Whisky:** search `[whisky_name]` (and its slugified form) against `src/lib/data/whiskies.json`. Also check `data/seed/whiskies.json`.
2. **Distillery:** search `[distillery]` against `src/lib/data/distilleries.json` and `data/seed/distilleries.json`.

Outcomes:

- Whisky already exists → tick the line ✅ (nothing to do) and move to the next line.
- Only the distillery exists → reuse it: find its `id` and skip Step 2.
- Neither exists → proceed with Steps 1–8 for both.

## Step 1: Research

Web search for the product to gather:

- **Product name** (official spelling of the expression)
- **Origin** — must be an existing key: `scotland`, `ireland`, `usa`, `japan`, `india`, `canada`, `argentina`, `other`
- **Region** — use a region name that already exists for that origin in `src/lib/data/regions.json` (e.g. Scotland: Speyside, Highlands, Islay, Islands, Lowlands, Blended Scotch). Unknown region strings don't break the sync but leave the product without a region group.
- **Description** in Spanish (base locale) — concise 2-3 sentence tasting note
- **ABV** (e.g. 43, 46, 50), **Volume** (e.g. "700 ml"), **Age** (years or null), **Cask type** ("Bourbon", "Sherry", "Mixed", or null)
- **Image URL** — bottle image (PNG/JPG, transparent or white background preferred)

## Step 2: Distillery record (only if missing)

If Step 0 found no distillery, create the **complete** record now. Web search everything — never leave placeholder values, because `db:sync` inserts distilleries with `ON CONFLICT DO NOTHING` and won't fill gaps later.

**File:** `data/seed/distilleries.json` — append to the `distilleries` array:

```json
{
    "id": "<distillery-slug>",
    "slug": "<distillery-slug>",
    "name": "<Official distillery/brand name>",
    "name_es": null,
    "name_pt": null,
    "name_en": null,
    "name_ja": null,
    "description": "<Short description, Spanish base locale>",
    "description_es": null,
    "description_pt": null,
    "description_en": null,
    "description_ja": null,
    "description_fr": null,
    "country": "<origin-key>",
    "region": "<Region/town>",
    "founded": <year or null>,
    "image": null,
    "website": "<official site URL or null>",
    "latitude": <REQUIRED: town-level lat — see rules below>,
    "longitude": <REQUIRED: town-level lng — see rules below>
}
```

Field rules:

- `id`/`slug`: lowercase hyphen-separated, unique (e.g. `talisker`)
- `country`: same origin key set as products
- **All translations required:** localized names (usually identical to `name` for brand names — put them in every `_xx` column rather than null) and a short description translated to es/pt/en/ja/fr
- `latitude`/`longitude`: **coordinates are required** — every new record must be plottable on `/map`. Research town-level coordinates of the real distillery. For blends/brands without their own stills, anchor them to a real physical home: the owner company's HQ or the brand's visitor/home distillery (e.g. The Famous Grouse → Glenturret, Crieff; Smokehead → Ian Macleod Distillers, Broxburn). Use `null` only as a last resort when genuinely no physical location can be identified for the brand or its owner.
- **Map verification:** after `db:sync` + `data:export`, confirm the new distillery renders as a marker on the `/map` page (it is filtered out silently when latitude/longitude are missing).
- `founded`: founding year of the distillery (not the brand owner)

## Step 3: Image

Download the source image and convert to standard format:

```sh
node scripts/prepare-image.mjs <image-url-or-local-path> <slug>
```

This:
- Downloads from URL (or reads local file)
- Resizes to 500×500px (fit inside, transparent background)
- Converts to WebP at quality 85
- Saves to `data/images/<slug>.webp`

The `<slug>` should be lowercase, hyphen-separated (e.g. `talisker-10-yo`).

**Standard image spec:** 500×500px, transparent background, WebP format, quality 85.

## Step 4: Seed data

**File:** `data/seed/whiskies.json`

Add a new entry to the `whiskies` array. Follow this exact structure:

```json
{
    "id": "<slug>",
    "slug": "<slug>",
    "name": "<Product name>",
    "description": "<Description in Spanish (base locale)>",
    "image": "/data/images/<slug>.webp",
    "origin": "<origin-key>",
    "region": "<Region>",
    "age": null,
    "volume": "700 ml",
    "abv": 43,
    "cask": null,
    "resellers_uy": [],
    "resellers_br": [],
    "resellers_usa": [],
    "distillery_id": "<distillery-id from Step 0 or 2>",
    "name_pt": "<Portuguese name>",
    "description_pt": "<Portuguese description>",
    "name_en": "<English name>",
    "description_en": "<English description>",
    "name_ja": "<Japanese name>",
    "description_ja": "<Japanese description>",
    "name_fr": "<French name>",
    "description_fr": "<French description>"
}
```

**Field rules:**

- `id` and `slug` must match, be lowercase, hyphen-separated, and unique. `id` becomes the DB primary key.
- `name` = base locale (Spanish). Use the official product name
- `description` = Spanish. Write 2-3 sentences about taste, aroma, character
- `distillery_id` must reference the `id` of an existing or freshly created distillery (Step 0/2)
- All five description translations are mandatory: base (es) + `_pt`, `_en`, `_ja`, `_fr`
- `origin` = one of: `scotland`, `ireland`, `usa`, `japan`, `india`, `canada`, `argentina`, `other`
- `abv` = number (e.g. `43`), not a string; `volume` = string (e.g. `"700 ml"`); `age` = number or null; `cask` = string or null
- Do NOT add `brand` or `video` fields — both were removed from the schema (brand lives on the distillery now)
- `resellers_*` = empty arrays (populated later via Turso admin)

## Step 5: Influencer videos — 4 per language

Target **4 videos per language** × 5 languages (`es | en | pt | ja | fr`, ≤20 per product). The runtime shows `MAX_VIDEOS = 4` per language (`src/lib/utils/videos.ts`) and slices anything beyond.

**Localize the videos themselves.** Videos are paired with a locale at runtime, so each one must be a genuine tasting/review **in that language** — the spoken/narrated language is what matters, not just the country or channel. A Spanish review goes in the `es` slot, a Portuguese one in `pt`, a Japanese one in `ja`, a French one in `fr`, an English one in `en`. Do not put an English-language video in a non-English slot just because the channel "covers" that region. Localize the `label` too where possible so the caption shown is in the viewer's language.

**If honest searching can't find quality in-language videos for a language: ship fewer for that language, or none if truly absent.** The runtime automatically tops up remaining slots with English videos (deduplicated by URL) — never pad with irrelevant videos just to hit 4.

**Hard rule — exact whisky only.** A video may be added ONLY if it reviews/tastes the EXACT whisky (the specific expression) on the product. Never use another version, another age, another distillery, another brand, or a same-style/brand/region substitute. Do not "widen". Examples of what to REJECT: a Royal Salute 21 review on a Royal Salute 25 (or Peated) product; a Glenfiddich 12 review on a Glenfiddich 15 product; an "Islay single malts" roundup on a single Islay product's page. If no exact-expression review exists in a language, that language gets no entry for that product (English top-up covers the gap at runtime).

For each video verify:
- The URL is real and playable — check via YouTube oEmbed before seeding (no API key needed):
  ```sh
  curl -s "https://www.youtube.com/oembed?url=<VIDEO_URL>&format=json"
  ```
  A 200 returns title + author_name (use them for `label`); a 404/401 means dead or embed-blocked → discard.
- It's a genuine review/tasting of THIS exact expression (not just the brand, not a different version/age, not a different whisky)
- The spoken language matches the slot you're adding it to (sanity-check from title/channel)

Add them as `influencer_videos` on the product's seed entry:

```json
"influencer_videos": [
    { "language": "en", "platform": "youtube", "url": "https://www.youtube.com/watch?v=...", "label": "Whisky.com review", "created_at": "2000-01-01T00:00:00.000Z" },
    { "language": "es", "platform": "youtube", "url": "https://www.youtube.com/watch?v=...", "label": "Bourboneros — cata", "created_at": "2000-01-01T00:00:00.000Z" },
    { "language": "ja", "platform": "youtube", "url": "https://www.youtube.com/watch?v=...", "label": "", "created_at": "2000-01-01T00:00:00.000Z" }
]
```

Rules:

- `language` ∈ `es | en | pt | ja | fr`; 4 per language when possible, hard floor of 2 (English top-up covers the gap at runtime)
- **MUST be the exact whisky/expression** — never another version, another age, another brand, or a same-style/brand/distillery substitute. A video for a different expression does NOT belong on this product (see the hard rule above).
- **The video's spoken language MUST match its `language` slot** — verified from the title/channel. A video only counts toward the count for the language it's actually narrated in (a Spanish review is *not* an `en` or `pt` video even if the distillery is Scottish).
- A URL may appear **once per product, ever** — never list an English URL under another language's slot (the runtime dedups by URL, so duplicates silently waste slots)
- Prefer 3–20 minute videos (typical review length)
- `platform` ∈ `youtube | instagram`
- `label` optional short title (empty string fine); use the fixed timestamp `"2000-01-01T00:00:00.000Z"` for every `created_at` so rebuilds stay deterministic

## Step 6: DB sync

```sh
npm run db:sync
```

Requires `TURSO_URL` / `TURSO_AUTH_TOKEN` in `.env`. One run seeds, in order:
1. Distilleries (`ON CONFLICT DO NOTHING`) — your new distillery lands first
2. Products (insert new, backfill locale columns on existing)
3. Influencer videos (`INSERT OR IGNORE`)

Verify the output summary shows increased `distilleries`, `products` and `influencer_videos` counts.

## Step 7: Data export

```sh
npm run data:export
```

Writes from Turso to `src/lib/data/`: `whiskies.json` (with embedded videos), `origins.json`, `regions.json`, `distilleries.json`, `influencer_videos.json`, pages.

Verify the new product appears in `src/lib/data/whiskies.json` with its `distillery_id` resolved and videos embedded.

## Step 8: Verify & tick off

```sh
npm run check
```

TypeScript check should pass (document any pre-existing baseline failures).

Optional: `npm run dev` and visit the product page to verify rendering (image, videos strip, distillery link).

Verify the new product in `src/lib/data/whiskies.json` has its `distillery_id` resolved, videos embedded, and at least 2 videos per language (4 for en when available).

Finally: open `docs/whisky-brands-and-products-to-add.md` and prefix the processed line with ✅. Never tick before sync/export/check pass.

---

## Common pitfalls

- **Existing whisky/distillery:** always run the Step 0 checks first. A duplicate slug won't error loudly — `db:sync` skips inserts (`DO NOTHING`) and only backfills locale columns.
- **Incomplete distillery record:** because of `ON CONFLICT DO NOTHING`, a distillery inserted with null translations stays broken until edited via `/admin` or SQL. Fill everything in Step 2.
- **Wrong origin key:** must match a key in `ORIGIN_META` in `scripts/db-sync.mjs`.
- **Unknown region:** prefer existing region names per origin from `src/lib/data/regions.json`; unknown strings silently produce `null` region_id.
- **Missing locale fields:** all five description/name locales must be present in the seed entry. Missing keys cause incomplete localized content.
- **Image path mismatch:** the `image` field must exactly match `/data/images/<slug>.webp` and the file must exist in `data/images/`.
- **Forgetting `data:export`:** without it, the frontend JSON won't include the new product/videos/distillery.
- **Ticking the queue line too early:** only after db:sync + data:export + check succeed.
