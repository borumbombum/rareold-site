import { buildSitemapIndex } from '$lib/server/sitemap';

const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

export const prerender = false;

export async function GET({ url }) {
	const origin = url.origin;
	return new Response(buildSitemapIndex(origin), {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': CACHE }
	});
}
