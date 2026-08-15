import { error, redirect } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { AuthError } from '$lib/server/auth';
import { handleGoogleCallback, isSafeNext } from '$lib/server/oauth';
import {
	clearAuthStateCookie,
	clearSessionCookie,
	getAuthState,
	setSessionCookie
} from '$lib/server/session';

export async function GET({ url, cookies }) {
	const googleError = url.searchParams.get('error');
	const state = url.searchParams.get('state');
	const stored = getAuthState(cookies);

	const storedNext = stored?.next;
	const fallbackNext = isSafeNext(storedNext) ? (storedNext as string) : '/';

	if (googleError) {
		clearAuthStateCookie(cookies);
		clearSessionCookie(cookies);
		redirect(302, fallbackNext);
	}

	if (!stored || !state || stored.state !== state) {
		clearAuthStateCookie(cookies);
		error(400, 'invalid_auth_state');
	}

	const code = url.searchParams.get('code');
	if (!code) {
		clearAuthStateCookie(cookies);
		error(400, 'missing_auth_code');
	}

	let token: string;
	try {
		({ token } = await handleGoogleCallback({
			code,
			clientId: env.googleClientId,
			clientSecret: env.googleClientSecret,
			redirectUri: `${url.origin}/api/auth/callback`,
			verifier: stored.verifier
		}));
	} catch (err) {
		console.error('[auth] callback error', err);
		clearAuthStateCookie(cookies);
		error(400, err instanceof AuthError ? err.message : 'login_failed');
	}
	setSessionCookie(cookies, token, url.protocol === 'https:');
	clearAuthStateCookie(cookies);
	redirect(302, stored.next);
}
