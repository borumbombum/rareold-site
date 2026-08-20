---
name: add-product
description: Step-by-step guide for adding a new whisky product to the Old Rare catalog in all languages. Covers research, image preparation, seed data, DB sync, and export. Use whenever adding a new product to the catalog.
---

# Adding a new product

Complete checklist for adding a whisky to the catalog. Each step lists the exact file and what to do.

## How the data pipeline works

Understanding the data flow makes the process faster:

```
data/seed/whiskies.json          ← You edit this (source of truth for bootstrap)
        │
        ▼
npm run db:sync                  ← Upserts seed data into Turso DB
        │
        ▼
Turso (database)                 ← Source of truth for all content
        │
        ▼
npm run data:export              ← Exports Turso → src/lib/data/*.json
        │
        ▼
src/lib/data/whiskies.json       ← SvelteKit reads this at build time
        │
        ▼
Browser                          ← l10n() resolves locale fields per request
```

**Key concepts:**

- **Turso is the source of truth.** The seed file bootstraps data that doesn't exist yet (`ON CONFLICT DO NOTHING`). Locale columns are backfilled on existing rows (`ON CONFLICT DO UPDATE` for `_pt`, `_en`, `_ja` fields). After bootstrap, content edits happen in Turso via admin UI or SQL.
- **The JSON files are the fast path.** `data:export` pre-joins products with regions and resellers, so SvelteKit serves them without a DB query at request time.
- **Locale columns:** `name` and `description` are the base locale (Spanish). `name_pt`/`description_pt` (Portuguese), `name_en`/`description_en` (English), `name_ja`/`description_ja` (Japanese) are overrides. The `l10n(item, field)` utility resolves the active locale's field with fallback to base.
- **Images** are served from `data/images/<slug>.webp` via a prerendered SvelteKit route with 30-day cache headers.

## Quick overview

1. **Research** — web search for brand info
2. **Image** — download + resize + convert to webp
3. **Seed data** — add entry to `data/seed/whiskies.json`
4. **DB sync** — `npm run db:sync`
5. **Data export** — `npm run data:export`
6. **Verify** — `npm run check`

---

## Step 1: Research

Web search for the brand to gather:

- **Brand name** (official spelling)
- **Product name** (specific expression)
- **Origin** (scotland, ireland, usa, japan, india, canada, argentina, other)
- **Region** (e.g. Speyside, Kentucky, etc.)
- **Description** in Spanish (base locale) — write a concise 2-3 sentence tasting note
- **ABV** (alcohol by volume, e.g. 43, 46, 50)
- **Volume** (e.g. "700 ml", "750 ml")
- **Age** (age statement in years, or null)
- **Cask type** (e.g. "Bourbon", "Sherry", "Mixed", or null)
- **Image URL** — find a bottle image (PNG/JPG with transparent or white background preferred)

## Step 2: Image

Download the source image and convert to standard format:

```sh
node scripts/prepare-image.mjs <image-url-or-local-path> <slug>
```

This:
- Downloads from URL (or reads local file)
- Resizes to 500×500px (fit inside, transparent background)
- Converts to WebP at quality 85
- Saves to `data/images/<slug>.webp`

The `<slug>` should be lowercase, hyphen-separated (e.g. `famous-grouse`).

**Standard image spec:** 500×500px, transparent background, WebP format, quality 85.

## Step 3: Seed data

**File:** `data/seed/whiskies.json`

Add a new entry to the `whiskies` array. Follow this exact structure:

```json
{
    "id": "<slug>",
    "slug": "<slug>",
    "name": "<Product Name in Spanish or brand name>",
    "brand": "<Brand>",
    "description": "<Description in Spanish (base locale)>",
    "image": "/data/images/<slug>.webp",
    "video": null,
    "origin": "<origin-key>",
    "region": "<Region>",
    "age": null,
    "volume": "700 ml",
    "abv": 43,
    "cask": null,
    "url": "",
    "resellers_uy": [],
    "resellers_br": [],
    "resellers_usa": [],
    "name_pt": "<Portuguese name>",
    "description_pt": "<Portuguese description>",
    "name_en": "<English name>",
    "description_en": "<English description>",
    "name_ja": "<Japanese name>",
    "description_ja": "<Japanese description>"
}
```

**Field rules:**

- `id` and `slug` must match, be lowercase, hyphen-separated, and unique
- `name` = base locale (Spanish). Use the official brand/product name
- `description` = Spanish. Write 2-3 sentences about taste, aroma, character
- `name_pt`, `name_en`, `name_ja` — brand names are usually universal; copy from `name` unless there's a known local variant
- `description_pt`, `description_en`, `description_ja` — translate from Spanish
- `image` = `/data/images/<slug>.webp` (must match the file from Step 2)
- `origin` = one of: `scotland`, `ireland`, `usa`, `japan`, `india`, `canada`, `argentina`, `other`
- `region` = specific region within the origin (e.g. "Speyside", "Kentucky")
- `abv` = number (e.g. `43`), not a string
- `volume` = string (e.g. `"700 ml"`)
- `age` = number or null
- `cask` = string or null
- `url` = empty string (legacy field, no longer used)
- `resellers_*` = empty arrays (populated later via Turso admin)

## Step 4: DB sync

```sh
npm run db:sync
```

This reads `data/seed/whiskies.json` and upserts to Turso:
- New products: `INSERT ... ON CONFLICT DO NOTHING` (won't overwrite existing edits)
- Locale columns: `ON CONFLICT DO UPDATE` (backfills translations)

Verify the output shows the correct product count.

## Step 5: Data export

```sh
npm run data:export
```

This reads from Turso and writes:
- `src/lib/data/whiskies.json` — full catalog with resellers
- `src/lib/data/origins.json` — origin metadata
- `src/lib/data/regions.json` — region list

Verify the new product appears in `src/lib/data/whiskies.json`.

## Step 6: Verify

```sh
npm run check
```

TypeScript check should pass with 0 errors.

Optional: `npm run dev` and visit the product page to verify rendering.

---

## Common pitfalls

- **Duplicate slug:** If the slug already exists in the seed file, `db:sync` will skip the insert (DO NOTHING) but will backfill locale columns. Check `data/seed/whiskies.json` for existing entries first.
- **Wrong origin key:** The origin must match an existing key in `ORIGIN_META` in `scripts/db-sync.mjs`. If adding a new origin, see the `add-language` skill for the full process.
- **Missing locale columns:** All `_pt`, `_en`, `_ja` fields must be present in the seed entry. Null is fine, but missing keys cause JSON parse issues.
- **Image path mismatch:** The `image` field must exactly match `/data/images/<slug>.webp` and the file must exist in `data/images/`.
- **Forgetting `data:export`:** If you only run `db:sync` without `data:export`, the frontend JSON won't include the new product.
