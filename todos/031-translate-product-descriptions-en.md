Status: DONE

# Translate all product descriptions to English

## Context

All 156 products in `data/seed/whiskies.json` have `description_en: null`. The English locale (`/en`) shows Spanish descriptions as fallback. The `name_en` field exists and is populated (brand names are the same), but the long-form `description_en` is missing for every product.

Portuguese (`description_pt`) and Japanese (`description_ja`) are complete (156/156 each).

## Requirements

1. Translate every product's `description` (Spanish) to `description_en` in `data/seed/whiskies.json`
2. Translations should be natural English, not machine-literal — these are tasting notes and product descriptions for whisky enthusiasts
3. Preserve the HTML structure (e.g. `<p>` tags, tasting note sections like "Nariz/Nose", "Boca/Palate", "Final/Finish")
4. Maintain the same formatting conventions as the Spanish originals (accents, capitalization of tasting sections)

## Acceptance criteria

- All 156 products have non-empty `description_en` in `data/seed/whiskies.json`
- `npm run db:sync && npm run data:export` succeeds
- `/en/whisky/old-pulteney-12-yo` (and spot-check 5-10 others) show English descriptions, not Spanish
- No regressions in `/es`, `/br`, `/jp` locales
