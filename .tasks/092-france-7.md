# France complete: 7 whiskies (Eddu, Castan, Hautes Glaces, Glann ar Mor, Kornog, Lehmann, Rozelieures)

Status: [DONE]

## Context

Final 7 pending queue lines (393–399), all French. One big batch:

1. Eddu Silver - Distillerie des Menhirs (Brittany)
2. Vilanova Berbie - Distillerie Castan (Armagnac/Gers)
3. Domaine des Hautes Glaces Indigène - Domaine des Hautes Glaces (Alps)
4. Glann ar Mor - Celtic Whisky Distillery (Brittany)
5. Kornog - Celtic Whisky Distillery (Brittany)
6. Lehmann Single Malt - Lehmann (Alsace)
7. Rozelieures Single Malt - Rozelieures (Lorraine)

Glann ar Mor + Kornog share ONE distillery record → 7 products / 6 distilleries:
`menhirs`, `castan`, `hautes-glaces`, `celtic-whisky`, `lehmann`, `rozelieures`.

Origin `france` already exists (added in 091). Current France regions: Brittany, Cognac.
Expect new regions from research (e.g. Armagnac/Gers, Alps/Drôme, Alsace, Lorraine) — all strings
auto-create at db:sync. French single malts → expect strong fr/en video slots, likely es/pt some.

## Requirements

- 7 new products seeded with 5-language content (es/pt/en/ja/fr), exact official names.
- 6 new distillery records complete (founded, town-level coords, website, 5-language descriptions).
- Official/clean bottle images for all 7 via `prepare-image.mjs` + pixel pass (cutout or full-bleed, catalog precedent).
- Influencer videos per language, exact-expression only, in-language, never pad; honest zeros fine.
- `npm run db:sync` → `npm run data:export` → `npm run check` (0 errors).
- Tick queue lines 393, 394, 395, 396, 397, 398, 399 (pending 7 → 0).

## Acceptance criteria

- [x] 7 new products live in Turso + `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 6 new distilleries complete (coordinates + 5-language descriptions); `france` region groups resolve.
- [x] Videos in as many languages as exist, all exact-expression and in-language; honest zeros elsewhere.
- [x] Queue lines 393–399 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-16: Created task. De-dup clean (451 products / 213 distilleries — eddu, vilanova, castan, hautes glaces, glann, kornog, lehmann, rozelieures all absent). Research pending.

## Research summary (4 agents, 2026-09-16)

**1. eddu-silver** — EDDU Silver, 43% (NOT 50%), 70cl, NAS (marketed 5y), 100% buckwheat "pur blé noir" (1st in world, launched 2002), French oak ex-Cognac casks, IGP Whisky de Bretagne. Dist: Distillerie des Menhirs (Le Lay family, founded 1986 by Guy, sons since 2008), Pont-Menhir, Plomelin, Finistère, 47.9381/-4.1517, distillerie.bzh. Region: Brittany (exists). Videos: fr uUGWS03qQ1w + qt7Vd76H3eg, es cHYCg1GnPc8, en 96fYD7SIVqs (+ Malt Muser xTwLom4QZ-s = 58min LIVE → REJECT), ja 0UEEhDoih18, pt none. Image: LMDW cdn.prod2.whisky.fr 58226_12_m61506 OR official distillerie.bzh silver-bouteille-étuis.jpg.

**2. vilanova-berbie** — VILANOVA Édition BERBIE, 43% (46% only on 4.5L Réhoboam), 700ml, NAS, single cask since 2013, single malt 100% malted ORGANIC barley, French oak ex-white-wine (+ new French oak double maturation), NCF. Dist: Distillerie Castan (Sébastien & Céline Castan, 3rd gen; itinerant distilling 1941, whisky distillery built 2007, 1st whisky Feb 2010), 55 chemin de la Cardonnarié, 81130 Villeneuve-sur-Vère, Tarn, 44.003/2.029, distillerie-castan.com. Region: Occitanie (NEW). Videos: none found in research — must hunt. Image: distillerie-castan.com vilanova-berbie700ml-whisky-francais.webp.

**3. hautes-glaces-indigene** — "INDIGÈNE", 44% (NOT 48%), 50cl (NOT 70cl), NAS blend of 2012–2019 parcel eaux-de-vie, single malt 100% organic barley, casks: new French sessile/pedunculate oak + old HG casks + ex-Cognac/Armagnac/wine, NCF, regenerative. Dist: Domaine des Hautes Glaces, founded 2009 by Frédéric Revol (NOT Jérôme Tessier), sold to Rémy Cointreau 2016, 185 route du Col, 38710 Cornillon-en-Trièves, Isère (NOT Drôme), 44.8354/5.7078, hauteglaces.com. Region: French Alps (NEW). Videos: uJpgTCNQN68 (Whisky Wednesday — LANGUAGE UNVERIFIED, maybe Flemish!) — must verify/listen or find others. Image: hauteglaces.com Indigene01.jpg packshot.

**4. glann-ar-mor** — Glann Ar Mor, classic unpeated flagship, 46%, 70cl, NAS, Maris Otter barley, ex-bourbon only, NCF natural colour, sea-damp cellars. Dist: Celtic Whisky Distillerie (Martine & Jean Donnay, founded 1997, operational distillery 2005, acquired by Maison Villevert 2020, master distiller Aël Guégan), 2 Allée des Embruns, ZA Pen Lan, L'Armor-Pleubian, 22610 Pleubian, Côtes-d'Armor (NOT Camlez/Pont-de-Buis), 48.85917/-3.07778, celtic-whisky-distillerie.fr. Region: Brittany (exists). Videos: en nFk4TyeFxGk only (A Dram A Day #331). fr feature UaxEoNoLPCo = distillery feature → REJECT. Must hunt fr/en more.

**5. kornog** — Kornog (roc'h Hir) peated sibling, 46%, 70cl, NAS, heavily peated 50ppm, first-fill ex-bourbon, launched Nov 2009, European Whisky of Year 2016 (Whisky Bible). Same distillery as #4. Videos: en PM2fTQBQ24Y + pjFzMo_XVY0 + ot4PDH-89kY. fr none found (roundups only). Image both: celtic-whisky-distillerie.fr bouteille_whisky_glann_armor_*.png / bouteille_whisky_kornog_*.png.

**6. lehmann-elsass-origine** — queue "Lehmann Single Malt" == NO such single expression; flagship single malt = **Elsass Whisky Origine**, 40%, 70cl, NAS ~7y ex-white Bordeaux (Sauternes hint), IGP Alsace, NCF natural colour, Alsatian barley (NOT organic). Dist: Distillerie Lehmann (Joseph Lehmann founded 1850 — oldest artisanal distillery in Alsace, EPV; Yves 5th gen took over 1982, moved to Obernai 1993, first Alsace single malt 2000, single malts 2007; now 6th gen Elsa/Thibaud/Florent), Chemin des Peupliers, 67210 Obernai, Bas-Rhin (NOT Marckolsheim), 48.462/7.480, distillerielehmann.com. Region: Alsace (NEW). Videos: none found — must hunt. Image: distillerielehmann.com IMG_0219_ELSASS-WHISKY_SINGLE-MALT_ORIGINE-scaled.jpg.

**7. rozelieures-origine** — queue "Rozelieures Single Malt" == flagship **Whisky Origine Collection** (G.Rozelieures; G=Grallet), 40%, 70cl, NAS (~4-6y), single malt, ex-fino-sherry ~40% + ex-Cognac ~60% (~6ppm), Charentais pot stills. Dist: Distillerie de Rozelieures (Grallet-Dupic family; Grallet fruit eau-de-vie since 1877, whisky decided ~2001, bottled 2007, 1st whisky of Lorraine; own malting Malterie des Hautes-Vosges 2017), 16 rue du Capitaine Durand, Rozelieures 54290, Meurthe-et-Moselle, 48.4497/6.4342, whiskyrozelieures.com (NOT rozelieures.com). Region: Lorraine (NEW). Videos: fr jgVCSr4dsII only. Must hunt more (fr market strong). Image: whiskyrozelieures.com Packshots_SiteInternet-08.png.

Confirmed decisions: 7 products / 6 distilleries. Origins: france (exists). New regions: Occitanie, French Alps, Alsace, Lorraine (+ Brittany reuse) → 53+4=57. Queue ticks 393,394,395,396,397,398,399 → pending 7→0.

## Closeout (2026-09-16)

- db:sync: 19 origins / 57 regions / 219 distilleries / 458 products / 4403 influencer_videos. data:export → 458 whiskies. npm run check: 0 errors / 29 warnings.
- Final video rounds (exhaustive re-hunt after user flagged French scarcity): Eddu Silver fr×2 (uUGWS03qQ1w LWF #01, qt7Vd76H3eg LCDW Ep6), es cHYCg1GnPc8, en 96fYD7SIVqs, ja 0UEEhDoih18. Rozelieures fr jgVCSr4dsII. Glann ar Mor en nFk4TyeFxGk. Kornog en PM2fTQBQ24Y + ot4PDH-89kY.
- Honest zeros CONFIRMED (user decision, 2026-09-16): vilanova-berbie, hautes-glaces-indigene, lehmann-elsass-origine = all languages; Glann/Kornog fr. Deep re-search proved French YT covers these only as multi-bottle formats (Wu Dram Clan pairing, Comparatif Vilanova, distillery visits, masterclasses, news) → rejected by exact-expression policy. Eddu Broceliande/Grey Rock, Rozelieures Rare/HSE/G, Whisky Wednesday uJpgTCNQN68 (Flemish risk) all rejected.
- Queue ticked 393–399 (+ France section fully ✅). Pending 7 → 0. Ready for commit/bump v0.2.49/push on explicit order.