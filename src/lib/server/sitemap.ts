import { WHISKIES } from '$lib/data/whiskies';
import originData from '$lib/data/origins.json';
import { DISTILLERIES } from '$lib/data/distilleries';
import { LOCALE_CONFIG, LOCALES } from '$lib/utils/locales';

const LOCALE_PREFIX = Object.fromEntries(
	LOCALES.map((l) => [l, LOCALE_CONFIG[l].path])
) as Record<string, string>;

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function buildSitemapIndex(origin: string): string {
	const urls = LOCALES.map(
		(l) => `  <sitemap>
    <loc>${escapeXml(origin)}/sitemap-${l}.xml</loc>
  </sitemap>`
	).join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</sitemapindex>`;
}

export function buildLocaleSitemap(origin: string, locale: string): string {
	const prefix = LOCALE_PREFIX[locale] ?? '';

	const urls: string[] = [];

	// Homepage
	urls.push(makeUrl(`${origin}${prefix}/`, origin, locale));

	// Products
	for (const w of WHISKIES) {
		urls.push(makeUrl(`${origin}${prefix}/whisky/${w.slug}`, origin, locale));
	}

	// Origin pages
	for (const o of originData) {
		urls.push(makeUrl(`${origin}${prefix}/origen/${o.id}`, origin, locale));
	}

	// Distillery pages
	for (const d of DISTILLERIES) {
		urls.push(makeUrl(`${origin}${prefix}/destileria/${d.slug ?? d.id}`, origin, locale));
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

function makeUrl(loc: string, origin: string, locale: string): string {
	const alts = LOCALES.map((l) => {
		const p = LOCALE_PREFIX[l] ?? '';
		const path = loc.replace(`${origin}${LOCALE_PREFIX[locale] ?? ''}`, `${origin}${p}`);
		return `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(path)}" />`;
	}).join('\n');
	return `  <url>
    <loc>${escapeXml(loc)}</loc>
${alts}
  </url>`;
}

export function buildRobotsTxt(origin: string): string {
	return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /user/

Sitemap: ${origin}/sitemap.xml
Sitemap: ${origin}/feed.xml`;
}

export function buildFeedXml(origin: string): string {
	const items = WHISKIES.slice(0, 50).map((w) => {
		const desc = (w.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300);
		const pubDate = new Date().toUTCString();
		const enclosure = w.image
			? `    <enclosure url="${escapeXml(origin + w.image)}" type="image/webp" length="0" />`
			: '';
		return `  <item>
    <title>${escapeXml(w.name)} — Old Rare</title>
    <link>${escapeXml(origin)}/whisky/${escapeXml(w.slug)}</link>
    <description>${escapeXml(desc)}</description>
    <pubDate>${pubDate}</pubDate>
${enclosure}
  </item>`;
	}).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Old Rare</title>
  <link>${escapeXml(origin)}</link>
  <description>Rare whiskies. Voted by the community.</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link rel="self" href="${escapeXml(origin)}/feed.xml" type="application/rss+xml" />
${items}
</channel>
</rss>`;
}
