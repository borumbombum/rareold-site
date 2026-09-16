# Slyrs Classic (first German whisky)

Status: [DONE]

## Context

First product from the new Germany section (queue line 1: `Slyrs Classic - Slyrs`).
Opens the `germany` origin in the catalog (origin exists in ORIGIN_META; 0 products / 0 distilleries).
Needs: new distillery `slyrs` + new region `Bavaria` + Slyrs Classic product + images + videos.

## Research snapshot (2026-09-16)

- **Slyrs Classic** — 43%, 70cl, NAS, single malt, American white oak (ex-bourbon) matured, Bavarian
  summer barley + Schliersee spring water, unpeated. Flagship of SLYRS Bavarian Whisky Distillery.
- **Distillery** — SLYRS Bavarian Whisky Distillery GmbH, Bayrischzeller Straße 13, 83727
  Schliersee-Neuhaus, Bavaria. First whisky distilled 1999, sold 2002, distillery built 2004/2007
  (largest in Germany; high-altitude warehouse at 1501m). Coords 47.70250 / 11.88556. slyrs.com.
- **Region** — Bavaria (NEW; auto-creates at db:sync, English name like other regions).

## Deliverable

- [x] Distillery `slyrs` (full record, 5 languages, coords, website) in data/seed/distilleries.json
- [x] Product `slyrs-classic` (43%, 70cl, NAS, cask null) in data/seed/whiskies.json + videos
- [x] data/images/slyrs-classic.webp (500×500 webp)
- [x] db:sync → data:export → npm run check (0 errors)
- [x] Queue line 1 ticked ✅ (Slyrs Classic - Slyrs)
- [x] Region Bavaria, 219→220 distilleries, 458→459 products, 4406 videos, 58 regions
- [x] No commit/push unless explicitly ordered

## Closeout (2026-09-16)

- Distillery `slyrs` (47.7027, 11.8854 — Nominatim-verified Bayrischzeller Str 13, Neuhaus am Schliersee; founded 1999; slyrs.com). Region `Bavaria` created (58 regions).
- Bottle shot: official Slyrs EU store BeMakers CDN (ucr.io proxy) → data/images/slyrs-classic.webp, 500×500, cutout (95.6% opaque, corners 0), 36.8 KB.
- Videos: EN ×3 exact Slyrs Classic (haOnucEOi7E Whisky.com, g40VCouKPWA Whisky Nerd, hTQiz_3BYQU The Whisky Rogues). es/pt/fr/ja honest zeros — Slyrs has no exact Classic reviews in those languages (HABLANDO DE WHISKY only covers Slyrs 12; Whisky.de/Die Taster/Literatur und Whisky are German); EN top-up covers at runtime. Whisky Wednesday 58ZTWBLcIzk dropped (Belgium, narration-language risk — consistent with the Hautes Glaces call).
- db:sync 58 regions / 220 distilleries / 459 products / 4406 videos; data:export ok; npm run check 0 errors / 29 warnings.
- Queue line 1 ticked ✅ (pending 12 remain). Germany catalog now has 1 product / 1 distillery.