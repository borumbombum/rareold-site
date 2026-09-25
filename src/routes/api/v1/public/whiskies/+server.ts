import { json } from '@sveltejs/kit';
import { checkApiLimit } from '$lib/server/api-ratelimit';
import { filterWhiskies, resolveLang } from '$lib/server/api-v1';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const err = await checkApiLimit(getClientAddress(), '/api/v1/public/whiskies');
	if (err) return err;
	const lang = resolveLang(url.searchParams.get('lang'));
	const data = filterWhiskies(
		{
			country: url.searchParams.get('country') ?? undefined,
			distillery: url.searchParams.get('distillery') ?? undefined,
			q: url.searchParams.get('q') ?? undefined
		},
		lang
	);
	return json({ data });
};