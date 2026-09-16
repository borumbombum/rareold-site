# Germany batch 2: Slyrs 12/Fifty One/Bavarian Rye + St. Kilian Classic/Peated

Status: [DONE]

## Closeout (2026-09-16)

- 5 products + distillery `st-kilian` added: 464 products / 221 distilleries / 58 regions / 4414 videos (8 new videos). db:sync OK, data:export OK, `npm run check` 0 errors / 29 warnings.
- **Queue ticked** ✅ lines 2–6 (Germany section); 7 Germany lines remain: St. Kilian Cigar Malt, Elsburn The Journey, Elsburn The Ember, Störtebeker Single Malt Reserve, Elch Single Malt, Stork Club Rye, Thousand Mountains McRaven.
- **Distillery**: St. Kilian Distillers (Rüdenau, Bavaria, founded 2012, first spirit St Patrick's Day 2016, Forsyths stills, Germany's largest). Coords 49.7117/9.1824 (Nominatim Rüdenau; whisky.com gives 49.7106/9.1862, both plausible). Region Bavaria reused.
- **Specs (verified from official pages)**:
  - Slyrs 12 Years Old: 43%/70cl, 12yo, refill American oak (reused casks that held Classic — whisky.com/Slyrs), release 2015 (2000 bottles), now annual.
  - Slyrs Fifty One: 51%/70cl NAS, new American oak + port/sherry/Sauternes casks ("Mixed").
  - Slyrs Bavarian Rye: 41%/70cl NAS, 3-grain (Urkorn rye majority + barley + wheat), first 2020.
  - St. Kilian Classic (Mild & Fruity) 46%/70cl NAS: 70% bourbon + 30% PX & Oloroso, natural colour, NCF, pot-still bottle €49.90.
  - St. Kilian Peated (Rich & Smoky) 46%/70cl NAS: same cask recipe, 54 ppm peat.
- **Images**: all official source renders, clean transparent-corner cutouts (corner alpha 0): slyrs-12-years (BeMakers S3 56qh…, 0.910 opaque), slyrs-fifty-one (ifj59…, 0.956), slyrs-bavarian-rye (9fr5…, 0.666; 19 MB source), st-kilian-classic (Shopify 63906…, 0.764), st-kilian-peated (Shopify 63908…, 0.764). 9.9–49.9 KB webp 500×500.
- **Videos (8):**
  - slyrs-12-years: en `YxEjFivkaWo` Whisky.com; es `O8UKJuNynFM` "HABLANDO DE WHISKY".
  - slyrs-fifty-one: en `ZGXV0AwIeK4` Whisky.com, `JfbZwDmO1Ok` Whiskey Vault, `BHb4wRdXKEw` Booze Reviews.
  - slyrs-bavarian-rye: NO videos — honest zero. EN candidates were German-spoken masks: WhiskyJason's Rye video (`4VCbrV04srg`) is his GERMAN channel ("Whisky aus der Sicht eines Amerikaners", "Verkostung"); Friendly Mr. Z (`GEFTccm8SgA`) is German; the rest were multi-whisky roundups (SLB Drinks "Best Rye EVER", Barrel Beast "Bottle Battle", Tier lists) — all rejected per exact-expression rule. German reviews exist but German is not a UI locale.
  - st-kilian-classic: en `S6zBkL30GXo` Whisky.com, `wo6mRLvRgQk` WhiskyJason.
  - st-kilian-peated: en `IngDgB5ZPIs` Whisky.com "We try a STRONGLY SMOKY St. Kilian" (the core-range Peated = the only flagship strongly smoky; Whisky.de mirrors the same review). Rejected: `zLFYc4ZJWrw`/`M58SaSfV2yI` Rebecca Han short (0:16) and German "Friendly/Frankly Mr. Z", `IZ73OhDLuVg` Whisky Plausch (de). Spanish `fH9X0ixhVmQ` Los Whiskochos rejected — generic "Probemos St. Kilian Whisky", not exact Classic/Peated.
- **Languages**: es/pt/fr/ja zeros except slyrs-12-years es. St. Kilian/Slyrs reviews concentrate EN + DE; DE isn't a UI locale so those don't fill slots.
- **Cask fields**: slyrs-12-years "Refill American oak", fifty-one "Mixed", rye "American oak", classic/peated "Bourbon & Sherry" (70/30). Slyrs Classic stays null (new American white oak, not bourbon) per 094 decision.