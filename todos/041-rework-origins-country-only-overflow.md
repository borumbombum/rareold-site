Status: TODO

# Rework origins: remove "Other", country-only, sort by product count, overflow modal

## Context

Currently there's an "Other" catch-all origin for non-standard countries (Taiwan, Wales, etc.). The user wants all origins to be proper countries. The first 7 origins (by product count) show as pills; any remaining origins go into an "Other" overflow dropdown/modal.

## Requirements

1. **Remove "other" as a special catch-all**: Every product must have a real country as its origin. Audit all products currently mapped to "other" and assign them to proper countries (e.g., Taiwan, Wales, etc.)

2. **Add new origins** as needed: Taiwan, Wales, or any other countries found in the data. Add them to `origins` table with flag and localized names.

3. **Sort origins by product count**: In `origins.ts`, sort `ORIGINS` by the number of products each origin has (descending). The top 7 origins show as filter pills on the homepage.

4. **Overflow for minor origins**: After the 7th origin, show an "Others" or "More" button that opens a modal/dropdown listing the remaining origins by product count. Clicking one navigates to that origin's page.

5. **Update `OriginFilters.svelte`**: Implement the split — first 7 pills visible, overflow trigger for the rest.

6. **Update `Drawer.svelte`**: Same split in the left-side navigation drawer.

7. **Update `origins.ts`**: Modify `originKey()` — since all origins are now real countries, the fallback to 'other' should be removed or changed to a sensible default.

8. **Update homepage and origin page**: Ensure the origin filter section handles the overflow correctly.

9. **Translations**: Add UI strings for the overflow trigger ("More origins", "Otros orígenes", etc.) in all locale files.

## Acceptance criteria

- No product has origin "other" — all have real country origins
- Homepage shows top 7 origins as pills + overflow trigger
- Overflow modal/dropdown shows remaining origins with product counts
- Origin pages still work for all origins
- Drawer navigation updated
- `npm run build` succeeds

## Progress
