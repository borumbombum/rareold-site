import { error } from '@sveltejs/kit';
import { buildLocaleSitemap } from '$lib/server/sitemap';

const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';
const VALID = new Set(['es', 'pt', 'en']);

export const prerender = false;

export async function GET({ params, url }) {
	if (!VALID.has(params.lang)) throw error(404, 'Unknown sitemap language');
	return new Response(buildLocaleSitemap(url.origin, params.lang), {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': CACHE }
	});
}
