Status: TODO

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
