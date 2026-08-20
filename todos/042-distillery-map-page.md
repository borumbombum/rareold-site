Status: TODO

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
