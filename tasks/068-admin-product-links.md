Status: [DONE] Admin Product Links

# Admin Product Links

## Context
The admin products section currently lacks links to view public product pages. Origins and Pages admin sections already have this functionality using ExternalLink icons and localizeHref. This task adds the same convenience to products.

## Requirements
1. Add ExternalLink icon button in the product list table (next to product name)
2. Add ExternalLink icon in the product edit form header
3. Links should open in new tab (target="_blank" rel="noopener noreferrer")
4. Use localizeHref for proper locale-aware URLs
5. Follow existing patterns from origins and pages admin sections

## Acceptance criteria
- [x] Product list shows clickable ExternalLink icon for each product
- [x] Product edit form shows ExternalLink icon in header
- [x] Links open public product page in new tab
- [x] URLs are locale-aware using localizeHref
- [x] No regressions in existing admin functionality

## Progress
- 2026-09-02: Task created
- 2026-09-03: Implemented in `src/routes/admin/products/+page.svelte`. Added `ExternalLink` icon + `localizeHref`/`getLocale` import. (1) List table actions cell now shows an ExternalLink per row -> `/whisky/{id}`, opens new tab. (2) Edit form header shows ExternalLink next to the title for existing products (hidden for new products with no public URL). Mirrors the origins/pages admin pattern (`m.admin_pages_preview()` tooltip). UI-only, no data/server changes. `npm run check` = 0 errors / 25 baseline warnings.