import { json } from '@sveltejs/kit';
import { checkApiLimit } from '$lib/server/api-ratelimit';
import { listOrigins, resolveLang } from '$lib/server/api-v1';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const err = await checkApiLimit(getClientAddress(), '/api/v1/public/origins');
	if (err) return err;
	return json({ data: listOrigins(resolveLang(url.searchParams.get('lang'))) });
};