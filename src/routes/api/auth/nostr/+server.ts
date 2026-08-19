import { json, error } from '@sveltejs/kit';
import { loginWithNostr, AuthError } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { pubkey, event } = body;
	if (!pubkey || !event) throw error(400, 'pubkey and event required');

	try {
		const origin = new URL(request.url).origin;
		const result = await loginWithNostr(pubkey, event, origin);
		setSessionCookie(cookies, result.access_token, true);
		return json(result);
	} catch (e) {
		if (e instanceof AuthError) throw error(401, e.message);
		throw error(500, 'login_failed');
	}
};
