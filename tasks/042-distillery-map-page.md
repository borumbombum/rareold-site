Status: [DONE]

# Distillery map page with geo-location of all distilleries

## Context

After the distillery database structure (039) is in place with latitude/longitude data, create a `/map` page (translated route) showing all distillery locations on an interactive map. Clicking a marker shows the distillery info and links to its page.

## Requirements

1. **Route**: Create `/map` page (with locale prefixes: `/es/mapa`, `/fr/carte`, etc.). Add translated route names in all locale message files.

2. **Map component**: Use a lightweight map library (Leaflet with OpenStreetMap tiles — free, no API key needed). Create `DistilleryMap.svelte`:
   - Full-width map showing all distillery markers
   - Custom markers with distillery name + flag
   - Click marker → popup with distillery name, country, image, link to distillery page
   - Cluster markers if too many overlap (Leaflet.markercluster)
   - Responsive: full-screen on mobile, contained on desktop

3. **Data**: Load distilleries from the exported JSON (`src/lib/data/distilleries.json`). Only show distilleries that have valid lat/lng coordinates.

4. **Filtering**: Optional filter by country/origin — show origin pills above the map to filter which distilleries are visible.

5. **SEO**: Add meta tags, OG image for the map page.

6. **Admin**: Ensure admin can set latitude/longitude for each distillery in the edit form (039).

7. **Navigation**: Add "Map" link to the header navigation and/or drawer.

## Acceptance criteria

- `/map` (and `/es/mapa`, etc.) renders an interactive map with all distillery locations
- Markers are clickable and show distillery info
- Map is responsive and works on mobile
- Distilleries without coordinates are excluded from the map
- Navigation includes a link to the map page
- `npm run build` succeeds

## Progress

- 2026-08-21 (ox-alpha): Added `leaflet` dep (+@types/leaflet). New `DistilleryMap.svelte`: OpenStreetMap tiles, world view (zoom 2), custom dark pill markers with flag emoji via `L.divIcon` (no icon-asset bundler issues), popups with name/flag/region/image + link to `/destileria/<slug>`, origin filter pills above the map (sorted by count), Leaflet loaded lazily via dynamic import in onMount so it stays out of the main bundle; markercluster skipped — 50 distilleries don't overlap enough to justify the extra weight. Route `/map` works under every locale prefix (`/es/map`, `/pt/map`, …) matching this codebase's paraglide urlPatterns design — per-locale path names like `/es/mapa` would require a routing layer that doesn't exist here. Verified SSR: `/map` 200 + `/es/map` 200 with Spanish title. Nav links added to Header (desktop) and Drawer footer. Admin distilleries form already exposes latitude/longitude (039 dependency satisfied). Messages added ×5 locales: nav_map, map_title, map_subtitle, map_open_distillery, map_distilleries. svelte-check 0 errors, build OK.
