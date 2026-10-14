import { json } from '@sveltejs/kit';
import { checkApiLimit } from '$lib/server/api-ratelimit';
import { findWhisky, findWhiskyAll, resolveLang } from '$lib/server/api-v1';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, url, getClientAddress }) => {
	const err = await checkApiLimit(getClientAddress(), '/api/v1/public/whiskies/[slug]');
	if (err) return err;
	if (url.searchParams.get('lang')?.trim().toLowerCase() === 'all') {
		const all = findWhiskyAll(params.slug);
		if (!all) return json({ error: 'not_found' }, { status: 404 });
		return json({ data: all });
	}
	const lang = resolveLang(url.searchParams.get('lang'));
	const data = findWhisky(params.slug, lang);
	if (!data) return json({ error: 'not_found' }, { status: 404 });
	return json({ data });
};