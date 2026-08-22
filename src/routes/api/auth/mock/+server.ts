import { json } from '@sveltejs/kit';
import { loginWithDemo } from '$lib/server/auth';
import { resolveCountry } from '$lib/server/geo';
import { setSessionCookie } from '$lib/server/session';

export async function POST({ cookies, url, getClientAddress }) {
	let country: string | null = null;
	try {
		country = await resolveCountry(getClientAddress());
	} catch {
		country = null;
	}
	const { access_token, user } = await loginWithDemo(undefined, country);
	setSessionCookie(cookies, access_token, url.protocol === 'https:');
	return json({ ok: true, user }, { headers: { 'Cache-Control': 'no-store' } });
}
