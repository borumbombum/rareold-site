# Germany batch 3 (complete): Cigar Malt + Elsburn×2 + Störtebeker + Elch + Stork Club + Thousand Mountains

Status: [DONE]

## Context

Queue lines 7–13 (all remaining Germany lines):

1. St. Kilian Cigar Malt - St. Kilian          (distillery `st-kilian` EXISTS)
2. Elsburn The Journey - Hammerschmiede         (NEW `hammerschmiede`)
3. Elsburn The Ember - Hammerschmiede           (NEW)
4. Störtebeker Single Malt Reserve - Störtebeker (NEW `stortebeker`)
5. Elch Single Malt Whisky - Elch Whisky        (NEW `elch`)
6. Stork Club Rye - Spreewood Distillers        (NEW `spreewood`)
7. Thousand Mountains McRaven - Thousand Mountains (NEW `thousand-mountains`)

7 products, 6 new distilleries. Expect: new regions (Mecklenburg-Vorpommern, Brandenburg, NRW?), many honest-zero video slots (de-spoken-only coverage), harder image sourcing (craft distillers often have JS-only shops).

## Deliverable

- [x] 6 distillery records full (5 languages, coords, founded, region)
- [x] 7 products seeded (correct abv/vol/age/cask, 5-language descriptions) + images
- [x] Videos per product (exact-expression, in-language; honest zeros)
- [x] db:sync → data:export → npm run check (0 errors)
- [x] Tick queue lines 7–13 ✅ (Germany section complete)
- [ ] No commit/push unless explicitly ordered