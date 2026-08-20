Status: TODO

# Pages CMS: full admin management with rich text editor

## Context

The pages CMS (`/admin/pages`) currently uses plain textareas for the body field. The user wants full admin management including a rich text editor (matching the product description Tiptap editor) and ensuring all CRUD operations work properly.

## Requirements

1. **Rich text editor**: Replace the plain `<textarea>` for page body fields with `TiptapEditor` component (already used in product admin for descriptions). This gives bold, italic, links, headings, lists, etc.

2. **All locales**: Ensure the form has fields for all 5 locales (es, en, pt, ja, fr) with both title and body (rich text) for each.

3. **CRUD verification**: Ensure create, read, update, delete all work via `/api/admin/pages`. Test edge cases: duplicate slugs, empty fields, long content.

4. **Preview**: Add a "Preview" button that opens the page in a new tab at `/<slug>` to see how it looks.

5. **List view improvements**: Show last updated date, word count, and locale completion status in the pages list table.

6. **Seed the about page** with French translation (if not already done in 034).

## Acceptance criteria

- Admin pages form uses TiptapEditor for body fields
- All 5 locale title+body fields are present
- Create/edit/delete work without errors
- Preview button opens the page in a new tab
- Pages list shows useful metadata
- `npm run build` succeeds

## Progress
