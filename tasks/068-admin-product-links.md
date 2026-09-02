Status: [TODO] Admin Product Links

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
- [ ] Product list shows clickable ExternalLink icon for each product
- [ ] Product edit form shows ExternalLink icon in header
- [ ] Links open public product page in new tab
- [ ] URLs are locale-aware using localizeHref
- [ ] No regressions in existing admin functionality

## Progress
- 2026-09-02: Task created