Status: DONE

# Add Famous Grouse, Bushmills, Woodford Reserve, and Elijah Craig whiskies

## Context

Add 4 new whisky brands/products to the database with images and translations in all languages (es, en, pt, ja, fr-after-034). Follow the existing seed data pattern in `data/seed/whiskies.json`.

## Requirements

1. **The Famous Grouse**: Add core expression(s) — at minimum "The Famous Grouse" (standard). Origin: scotland. Find/obtain product image, add to `data/images/`
2. **Bushmills**: Add core expression(s) — at minimum "Bushmills Original" (standard). Origin: ireland. Find/obtain product image
3. **Woodford Reserve**: Add "Woodford Reserve Distiller's Select". Origin: usa. Image: `https://www.woodfordreserve.com/wp-content/uploads/2019/12/Holiday-Bottle.png` (user-provided URL — download and convert to WebP)
4. **Elijah Craig**: Add "Elijah Craig Small Batch". Origin: usa. Image from `https://elijahcraig.com/` (find product image URL, download and convert to WebP)
5. For each product, create seed entries in `data/seed/whiskies.json` with:
   - `slug` (URL-friendly), `name` (Spanish), `brand`, `origin`, `region`
   - `name_en`, `name_pt`, `name_ja`, `name_fr` (brand names often same across languages)
   - `description`, `description_en`, `description_pt`, `description_ja`, `description_fr` — translate tasting notes/descriptions
   - `image` path pointing to the WebP in `data/images/`
   - Appropriate `age`, `abv`, `volume`, `cask` if known
6. Download and convert images to WebP using existing `scripts/prepare-image.mjs`
7. Run `npm run db:sync && npm run data:export` to verify pipeline

## Acceptance criteria

- 4+ new products appear in the homepage grid
- Each has an image, translations in all languages, and correct origin
- Product pages render correctly with descriptions and specs
- `npm run db:sync && npm run data:export && npm run build` succeeds

## Progress

- 2026-08-21 (ox-alpha): No work needed — all 4 requested products were already added to the catalog (via the add-product queue flow) and verified present in `src/lib/data/whiskies.json`: `famous-grouse` (scotland), `bushmills-original` (ireland), `woodford-reserve` (usa), `elijah-craig-small-batch` (usa, plus bonus `elijah-craig-rye`). Each has an image, name translations in es/en/pt/ja/fr, and full descriptions in all 5 locales.
