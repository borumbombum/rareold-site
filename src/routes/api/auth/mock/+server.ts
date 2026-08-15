import { json } from '@sveltejs/kit';
import { loginWithDemo } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/session';

export async function POST({ cookies, url }) {
	const { access_token, user } = await loginWithDemo();
	setSessionCookie(cookies, access_token, url.protocol === 'https:');
	return json({ ok: true, user }, { headers: { 'Cache-Control': 'no-store' } });
}
