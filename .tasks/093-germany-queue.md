# Germany: research + queue first German whiskies

Status: [DONE]

## Context

`germany` origin exists in ORIGIN_META (bootstrapped) but has 0 products and 0 distilleries.
User ordered: research German whiskies and append the first `## Germany` section to the pending queue
(`docs/whisky-brands-and-products-to-add.md`) — one line per product, unticked, agents pick them up
via the `add-product` skill. User owns the queue file; this task only adds lines.

## Research (2026-09-16, web)

Anchor distilleries with international distribution and verified current bottlings:
- **Slyrs** (SLYRS Bavarian Whisky Distillery GmbH, Schliersee, Bavaria; est. 1999 as first German single
  malt 2002 sale, distillery 2004/2007; largest German whisky distillery; high-altitude maturation at
  1501m; WWA 2014 Best European Whisky under 12). Core: Classic 43%, 12 Years 43%, Fifty One 51%,
  Mountain Edition 45%, Bavarian Rye 41%, Bavarian Peat. Queue 4 core bottles.
- **St. Kilian** (St. Kilian Distillers GmbH, Rüdenau, Bavaria; est. 2012, production 2016 under David F.
  Hynes; first Germany distillery producing only whisky). Core: Classic Mild & Fruity 46%, Peated Rich &
  Smoky 46%, Cigar Malt 46%. Queue 3.
- **Elsburn** (Hammerschmiede, Zorge, Harz; formerly Glen Els, renamed 2019 after SWA lawsuit; beech/alder
  wood-smoke malting, no peat). Batch series: The Journey 43%, The Ember 45.9%. Queue 2.
- **Störtebeker Single Malt Reserve 48%** (Störtebeker Brennerei GmbH, Alt Reddevitz, Rügen, since 2009;
  Baltic/Ostsee maturation; WWA 2025 Best German Single Malt).
- **Elch Single Malt** (Elch Whisky, Gasthof Seitz, Thuisbrunn/Effeltrich, Franconia; German-peat peated
  single malt, NYT-featured).
- **Stork Club Rye** (Spreewood Distillers, Spreewald; rye that ranks with US ryes).
- **Thousand Mountains McRaven** (Sauerland; sweet fruity single malt) — optional trim line.

None exist in catalog (de-dup clean). Regions auto-create at db:sync: Bavaria, Franconia, Harz, Rügen,
Spreewald, Sauerland. Video note: de is NOT a UI locale — expect honest zeros; Slyrs/St. Kilian are the
realistic en/fr/es video sources. Uruguay remains the only other empty origin.

## Deliverable

13 unticked queue lines appended under `## Germany` (after France section), pending 0 → 13.

## Acceptance criteria

- [x] `## Germany` section in `docs/whisky-brands-and-products-to-add.md` with all unticked lines.
- [x] TASKS.md entry exists; this task marked [DONE].
- [x] No db/build changes; no commit/push (user owns queue; push only on explicit order).