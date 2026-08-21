Status: TODO

# Public distillery page (/destileria/[slug])

## Context

Distilleries are now real entities (039: `distilleries` table, `products.distillery_id`, exported `src/lib/data/distilleries.json` with localized name/description columns) but have no public page. Create an SEO-friendly distillery page following the tasteatlas.com/lombardy layout: hero header (same pattern as the origin pages), left sticky table of contents, and a main content column with the distillery's products plus a history section.

## Requirements

### 1. Route

- Physical route `/destileria/[slug]/+page.server.ts` + `+page.svelte` (Spanish-first, same convention as `/origen/[slug]`).
- Localized URL patterns in `vite.config.ts` (both urlPatterns blocks):
  - pt: `/br/destilaria/:slug`
  - en: `/en/distillery/:slug`
  - ja: `/jp/destileria/:slug`
  - es: `/destileria/:slug` (canonical)
- Server load: `getDistilleryBySlug()` from `$lib/server/data.ts`; 404 via `error(404)` when not found. Products: filter `WHISKIES` by `distillery_id === distillery.id`, pass ratings/karma like the origin page does.

### 2. Header (same as origins)

- Reuse the `Hero.svelte` component pattern from `src/routes/origen/[slug]/+page.svelte`: full-width hero image (distillery `image` field; fallback `/images/whisky.webp`), back link to home, country flag + label (via `origins.ts` using `distillery.country`), distillery name as `<h1>` (localized: `name_<locale>` fallback to `name` — extend or mirror `l10n()` for distilleries).
- Meta line under the name: founded year (`m.destillery_founded({ year })`) + region + website link (external, `rel="noopener noreferrer"`, only when present).

### 3. Layout (tasteatlas style)

- Desktop (≥lg): two columns — left sticky table of contents (~240px, `sticky top-24 self-start`), right main content.
- TOC anchor links: "Products" (`#productos`) and "History" (`#historia`, only when description exists). Smooth scroll, active section highlight optional (IntersectionObserver, no dependency).
- Mobile: TOC hidden or rendered as horizontal pill row above content.

### 4. Main content — products only

- Section id `productos`: grid of the distillery's whiskies reusing `ProductCard` / view modes consistent with origin page (rating store seeding + sorting by avg_rating desc like origen).
- Section title with product count. Empty state should not happen today (all 47 distilleries have products) but render gracefully anyway.

### 5. History section

- Section id `historia`: localized HTML from `description_<locale>` fallback `description` (same `@html` sanitization approach as product detail page). Rendered from the exported JSON — no runtime DB reads.
- Hidden entirely when all description fields are empty.

### 6. SEO

- `<title>` + meta description (localized name + country + product count fallback).
- Optional JSON-LD `Organization` block (name, url, logo/image, founding date) — follow the schema builder pattern from 025 (`src/lib/server/schema.ts`).
- Include distillery pages in sitemap generation if sitemap infrastructure covers dynamic slugs easily; otherwise note follow-up.

### 7. Messages

- New keys ×4 locales (es/en/pt/ja): `destillery_products`, `destillery_history`, `destillery_founded`, `destillery_website`, `destillery_not_found` (or reuse existing generic patterns where equivalent).

## Acceptance criteria

- `/destileria/tomatin` (and `/br/destilaria/tomatin`, `/en/distillery/tomatin`, `/jp/destileria/tomatin`) renders Tomatin Distillery with its 7 products.
- All 47 distilleries resolve; unknown slug → 404 page.
- Hero header matches origin pages visually; TOC anchors scroll to Products/History.
- History section hidden when no description; products grid sorted by rating.
- Language switcher works on the new route (paraglide urlPatterns).
- `npm run check`, `npm test`, `npm run build` pass.

## Progress
