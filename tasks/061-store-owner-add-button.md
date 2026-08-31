Status: [TODO]

# Store owners: add your store button (relates to stores functionality)

## Context

The site already has a per-country stores ("resellers") feature: Turso `resellers` rows (root = task 012, Resellers Turso source of truth) are exported into each product's `resellers_uy/_br/_usa`, resolved per visitor by `resellersFor()` from the user's detected country (`detectUserCountry()` in `src/lib/utils/geo-client.ts`), and rendered by `StoreList.svelte` on each whisky detail page (`src/routes/whisky/[slug]/+page.svelte`).

Today there is **no public way** for a store owner (or a visitor wanting a store included) to request that their store be listed. Stores only get added via seed/`db-sync` or by a full site-admin. This task adds a public "add your store" entry point that funnels a store submission for the visitor's country of operation.

## Prerequisites (must be in place before execution)

- Task 012 (Resellers Turso source of truth) and the current per-country store display (`StoreList.svelte`, `detectUserCountry()`, `resellersFor()`) must already be present and working. Verify this before writing any code.

## Required pre-execution decision (do this FIRST, before coding)

At execution time — not before — the executor must **assess the actual code and UI and decide/choose** where to put the button and what it should link to, and **make suggestions**. Do not assume a location; base the decision on what you find.

Concretely, before writing the component/route:

1. Locate where stores are shown (e.g. `StoreList.svelte`) and the app's other chrome (header, drawer, footers) and public routes.
2. Decide and document (in the `## Progress` log):
   - **Placement:** exactly where the "add your store" button/link goes (component file + spot), with reasoning.
   - **Link target:** exact destination (a route or an external form URL), with reasoning.
3. Record **2+ alternative placement/link options** and why the chosen one wins.
4. If the options are genuinely close and it matters to the product owner, ask me before proceeding.

This task's purpose is to add the button; the exact position and destination are your call made from the code, not prescribed here.

## Requirements

1. Add a visible, minimal "add your store" entry point for visitors/store owners, linked to the destination you decided in the pre-execution step.
2. The flow should let a visitor submit/store their store **for their country of operation**. If the destination is a form you surface, prefill/recommend the country from `detectUserCountry()`.
3. No new host-side DB writes or store-owner role are required in v1. This is a **submission/request** entry point; how the request is captured (e.g. an external Google Form spreadsheet, or a route) is decided in the pre-execution step. If you choose a host route, keep it read-only on the host except for whatever the chosen capture medium needs.
4. Message strings via Paraglide messages (`messages/*.json`, reuse/extend the `stores_*` keys). CSS with configured Tailwind classes only. User feedback via `ui.showToast` if feedback is needed.

## Acceptance criteria

- [ ] Prerequisite confirmed: per-country stores feature (task 012 ecosystem) present and working before any code is written.
- [ ] Pre-execution decision documented in `## Progress` **before** code: chosen placement + link target + 2+ alternatives with rationale. No location was assumed without looking at the code.
- [ ] A working "add your store" button/link is present at the chosen location and links to the chosen destination.
- [ ] Country of operation is derived/prefilled from `detectUserCountry()` wherever applicable.
- [ ] Paraglide messages + Tailwind classes only; toasts via `ui.showToast` where needed; minimal and fast.
- [ ] `npm run check` → 0 errors; build passes; the button/destination verified working.

## Progress

- (none yet — task created)