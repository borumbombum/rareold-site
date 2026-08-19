import { buildFeedXml } from '$lib/server/sitemap';

const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

export const prerender = false;

export async function GET({ url }) {
	return new Response(buildFeedXml(url.origin), {
		headers: { 'Content-Type': 'application/rss+xml', 'Cache-Control': CACHE }
	});
}
