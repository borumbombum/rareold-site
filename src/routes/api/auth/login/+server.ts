import { redirect } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { buildAuthUrl, generatePkce, generateState, isSafeNext } from '$lib/server/oauth';
import { setAuthStateCookie } from '$lib/server/session';

export function GET({ url, cookies }) {
	const requested = url.searchParams.get('next');
	const next = isSafeNext(requested) ? requested as string : '/';

	if (!env.googleClientId) {
		redirect(302, next);
	}

	const state = generateState();
	const pkce = generatePkce();
	setAuthStateCookie(cookies, { state, next, verifier: pkce.verifier }, url.protocol === 'https:');

	const authUrl = buildAuthUrl({
		clientId: env.googleClientId,
		redirectUri: `${url.origin}/api/auth/callback`,
		state,
		codeChallenge: pkce.challenge
	});
	redirect(302, authUrl);
}
