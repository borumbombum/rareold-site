Status: TODO

# Canonical URLs, hreflang, Open Graph & meta SEO tags

## Context

The site serves 3 locales (es, pt, en) with path-prefix routing (`/`, `/br`, `/en`). Currently:

- **No `<link rel="canonical">` on any page** — Google may index duplicate content across locales
- **No Open Graph or Twitter Card tags** — social sharing shows no preview image, title, or description
- **hreflang alternates only exist on origin pages** (`origen/[slug]`), and they're **hardcoded to `borum.com.uy`** instead of using the request origin. Product pages, homepage, CMS pages, and favorites have zero hreflang
- The layout provides a global `<title>` and `<meta name="description">`, but page-level overrides only exist on a few pages and lack the full SEO tag set

## Requirements

### 1. SEO component (`src/lib/components/SEO.svelte`)

A reusable `<svelte:head>` wrapper that accepts props and renders the full tag set:

```svelte
<!-- Props -->
<title>{title}</title>

<!-- Canonical -->
<link rel="canonical" href="{origin}{canonicalPath}" />

<!-- Open Graph -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content="{origin}{canonicalPath}" />
<meta property="og:image" content={ogImage} />
<meta property="og:type" content={ogType} />
<meta property="og:site_name" content="Rare Old" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />

<!-- Hreflang alternates -->
<link rel="alternate" hreflang="x-default" href="{origin}/{canonicalPathEs}" />
{#each hreflangAlternates as alt}
  <link rel="alternate" hreflang={alt.lang} href={alt.href} />
{/each}

<!-- Robots (conditional) -->
{#if noindex}
  <meta name="robots" content="noindex, nofollow" />
{/if}
```

**Props interface:**

```ts
interface SEOProps {
  title: string;
  description: string;           // truncated to 160 chars
  canonicalPath: string;          // e.g. "/whisky/lagavulin-16"
  ogImage?: string;               // absolute URL, fallback to default OG image
  ogType?: "website" | "article";
  hreflangAlternates?: Array<{ lang: string; href: string }>;
  noindex?: boolean;
}
```

**Implementation notes:**
- The component reads the origin from `getUrlOrigin()` (paraglide runtime, works in both SSR and client)
- All `href` values must be absolute URLs (protocol + host + path)
- `description` is truncated to 160 characters with ellipsis if over
- `ogImage` defaults to `"{origin}/images/og-default.webp"` when not provided
- `ogType` defaults to `"website"`
- `hreflangAlternates` defaults to an empty array (no alternates rendered)
- The component wraps its output in `<svelte:head>` so callers just do `<SEO ... />`

### 2. Helper: build hreflang alternates

A pure function in `src/lib/utils/seo.ts`:

```ts
import { getLocale } from '$lib/paraglide/runtime';
import { localizeHref } from '$lib/paraglide/runtime';

/**
 * Build hreflang alternate links for the current page path across all locales.
 * @param basePath - the de-localized path (e.g. "/whisky/lagavulin-16")
 * @param origin - the site origin (e.g. "https://borum.com.uy")
 * @returns Array of { lang, href } objects
 */
export function buildHreflangAlternates(basePath: string, origin: string): Array<{ lang: string; href: string }> {
  const locales = ['es', 'pt', 'en'] as const;
  return locales.map((locale) => ({
    lang: locale,
    href: `${origin}${localizeHref(basePath, { locale })}`
  }));
}
```

The `x-default` hreflang (es, the base locale) is handled by the SEO component directly.

### 3. Page-by-page integration

| Page | canonicalPath | hreflang | ogType | ogImage | noindex |
|------|--------------|----------|--------|---------|---------|
| **Homepage** (`/`) | `localizeHref('/')` | All 3 locales | `website` | default | false |
| **Product** (`/whisky/[slug]`) | `localizeHref('/whisky/' + slug)` | All 3 locales (same slug) | `article` | product.image | false |
| **Origin** (`/origen/[slug]`) | `localizeHref('/origen/' + originSlug(id, locale))` | All 3 locales (translated slugs) | `website` | origin hero image or default | false |
| **CMS page** (`/[slug]`) | `localizeHref('/' + slug)` | All 3 locales | `article` | default | false |
| **Favorites** (`/user/[id]/favorites`) | N/A | none | — | — | **true** |
| **Admin** (`/admin/*`) | N/A | none | — | — | **true** |

### 4. Page changes detail

#### Homepage (`src/routes/+page.svelte`)
- Remove existing `<svelte:head>` block
- Add: `<SEO title={m.seo_home_title()} description={m.site_description()} canonicalPath={localizeHref('/')} hreflangAlternates={buildHreflangAlternates('/', origin)} />`

#### Product page (`src/routes/whisky/[slug]/+page.svelte`)
- Remove existing `<svelte:head>` block (title + meta description)
- Add: `<SEO title={m.seo_product_title({ name })} description={(description ?? '').slice(0, 160)} canonicalPath={localizeHref('/whisky/' + slug)} ogImage={product.image ? origin + product.image : undefined} ogType="article" hreflangAlternates={buildHreflangAlternates('/whisky/' + slug, origin)} />`

#### Origin page (`src/routes/origen/[slug]/+page.svelte`)
- **Remove** existing hardcoded `<svelte:head>` block (title + hardcoded hreflangs to borum.com.uy)
- Add: `<SEO title="{originName} — Rare Old" description={m.origin_page_subtitle({ origin: originName })} canonicalPath={localizeHref('/origen/' + originSlug(data.slug, locale))} ogImage={heroImageUrl} hreflangAlternates={buildHreflangAlternates('/origen/' + data.slug, origin)} />`
- Note: `buildHreflangAlternates` uses `localizeHref` which handles translated origin slugs automatically

#### CMS page (`src/routes/[slug]/+page.svelte`)
- Remove existing `<svelte:head>` block
- Add: `<SEO title="{data.title} — Rare Old" description={data.title} canonicalPath={localizeHref('/' + data.slug)} ogType="article" hreflangAlternates={buildHreflangAlternates('/' + data.slug, origin)} />`

#### Favorites (`src/routes/user/[userId]/favorites/+page.svelte`)
- Remove existing `<svelte:head>` block
- Add: `<SEO title={m.favorites_title()} canonicalPath="" noindex={true} />`

#### Admin pages (`src/routes/admin/*/+page.svelte`)
- Remove existing `<svelte:head>` blocks
- Add: `<SEO title="Admin — Rare Old" noindex={true} />` to each admin page

### 5. Default OG image

Create a placeholder `static/images/og-default.webp` (1200×630). For now use a simple solid-color placeholder or the existing `/images/whisky.webp` cropped. A proper branded OG image can be designed later.

### 6. Origin handling

The origin must be available to all pages. Options (pick one):
- **Option A**: Pass origin from `+layout.server.ts` load function via `data.origin` (already may exist)
- **Option B**: Use `getUrlOrigin()` from paraglide runtime in the SEO component

Check if `data.origin` is already passed in layout. If so, use it. If not, use `getUrlOrigin()`.

### 7. Messages

No new message keys needed — existing `seo_home_title`, `seo_product_title`, `site_description` are sufficient.

## Files affected

| File | Change |
|------|--------|
| `src/lib/components/SEO.svelte` | **New** — reusable SEO head component |
| `src/lib/utils/seo.ts` | **New** — `buildHreflangAlternates()` helper |
| `src/routes/+page.svelte` | Replace `<svelte:head>` with `<SEO />` |
| `src/routes/whisky/[slug]/+page.svelte` | Replace `<svelte:head>` with `<SEO />` |
| `src/routes/origen/[slug]/+page.svelte` | Replace hardcoded `<svelte:head>` + hreflangs with `<SEO />` |
| `src/routes/[slug]/+page.svelte` | Replace `<svelte:head>` with `<SEO />` |
| `src/routes/user/[userId]/favorites/+page.svelte` | Replace `<svelte:head>` with `<SEO noindex />` |
| `src/routes/admin/+page.svelte` | Replace `<svelte:head>` with `<SEO noindex />` |
| `src/routes/admin/products/+page.svelte` | Replace `<svelte:head>` with `<SEO noindex />` |
| `src/routes/admin/users/+page.svelte` | Replace `<svelte:head>` with `<SEO noindex />` |
| `src/routes/admin/reviews/+page.svelte` | Replace `<svelte:head>` with `<SEO noindex />` |
| `static/images/og-default.webp` | **New** — default OG image (1200×630) |

**Do NOT change:** `src/routes/+layout.svelte` (keep global title/description as fallback, SEO component overrides per-page). Actually, since each page now has its own `<SEO />` with title, the layout's `<title>` and `<meta description>` become redundant fallbacks. Remove them from the layout to avoid duplicate tags.

## Acceptance criteria

- Every public page has a `<link rel="canonical">` pointing to its own absolute URL
- Every public page has `<link rel="alternate" hreflang="...">` for es, pt, en, and x-default
- Every public page has Open Graph tags (title, description, url, image, type, site_name)
- Every public page has Twitter Card tags (summary_large_image)
- Product pages use the product image as og:image; other pages use the default
- Favorites and admin pages have `<meta name="robots" content="noindex, nofollow">`
- The hardcoded `borum.com.uy` hreflangs on origin pages are removed
- No duplicate `<title>` or `<meta name="description">` tags (layout cleaned up)
- `npm run check` passes with 0 errors
- `npm run build` passes

## Out of scope

- Schema.org structured data (task 025)
- Dynamic OG image generation (e.g. Satori) — future task
- Sitemap/robots changes (task 023)
- Localized OG descriptions (og:description in each language) — can be a follow-up

## Progress

