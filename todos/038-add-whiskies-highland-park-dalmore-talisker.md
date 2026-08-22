Status: DONE

# Add Highland Park, Dalmore, and Talisker product lines

## Context

Add full product lines for 3 major distillery brands. These brands have multiple expressions (12yo, 15yo, 18yo, etc.) so this is a larger task than 037. Follow existing seed data patterns.

## Requirements

### Highland Park (Orkney, Scotland)
- Add at minimum: Highland Park 12 Year Old, Highland Park 15 Year Old, Highland Park 18 Year Old
- Origin: scotland, Region: Islands (or "Highlands" if Islands doesn't exist)
- Find product images for each expression, convert to WebP

### The Dalmore (Highlands, Scotland)
- Add at minimum: The Dalmore 12 Year Old, The Dalmore 15 Year Old, The Dalmore 18 Year Old
- Origin: scotland, Region: Highlands
- Find product images, convert to WebP

### Talisker (Isle of Skye, Scotland)
- Add at minimum: Talisker 10 Year Old, Talisker 18 Year Old, Talisker Distiller's Edition
- Origin: scotland, Region: Islands
- Find product images, convert to WebP

For each product:
1. Create seed entries in `data/seed/whiskies.json` with all locale fields (es, en, pt, ja, fr)
2. Translate descriptions/tasting notes for all languages
3. Include accurate specs: age, ABV, volume, cask type
4. Download and convert images to WebP in `data/images/`
5. Verify `npm run db:sync && npm run data:export`

## Acceptance criteria

- 8-9 new products across 3 brands appear in the grid
- Each has image, full translations, correct origin/region
- Product pages render correctly
- `npm run db:sync && npm run data:export && npm run build` succeeds

## Progress

- 2026-08-21 (ox-alpha): Added 2 new distilleries (`highland-park` Orkney/Islands f.1798, `talisker` Isle of Skye/Islands f.1830) to `data/seed/distilleries.json` and 7 products to `data/seed/whiskies.json`: Highland Park 12/15/18 Year Old, Talisker 10 Year Old, Talisker 18 Year Old, Talisker Distiller's Edition (45.8%, amontillado finish), Dalmore 18 YO (43%, Matusalem oloroso; completes the Dalmore line since 12/15 already existed). All with bottle photos converted via prepare-image.mjs and structured tasting-note descriptions translated es/en/pt/ja/fr following the catalog's "Presentación de 700 ml… El perfil de sabor" format. db:sync + data:export OK (167 whiskies, 50 distilleries); queue lines ticked in docs/whisky-brands-and-products-to-add.md (Talisker Storm / HP Cask Strength left for later); build OK, svelte-check 0 errors.

- 2026-08-21 (ox-alpha): Audit done — Dalmore already has 12yo + 15yo + King Alexander III (only `dalmore-18-yo` missing); `Islands` region exists (`scotland-islands`). Highland Park + Talisker distilleries don't exist yet → will create full distillery records in `data/seed/distilleries.json` (ON CONFLICT DO NOTHING) plus 7 products: HP 12/15/18, Talisker 10/18/Distiller's Edition, Dalmore 18. Next: research images, write seeds, sync + export.
