import { createHash, randomBytes } from 'node:crypto';
import type { Client } from '@libsql/client';
import { AuthError, loginWithGoogle, type JWKResolver } from './auth';
import type { UserData } from '$lib/types';

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface PkcePair {
	verifier: string;
	challenge: string;
}

export function base64urlEncode(buf: Buffer): string {
	return buf.toString('base64url');
}

export function generatePkce(): PkcePair {
	const verifier = base64urlEncode(randomBytes(32));
	const challenge = base64urlEncode(createHash('sha256').update(verifier).digest());
	return { verifier, challenge };
}

export function generateState(): string {
	return base64urlEncode(randomBytes(32));
}

/** Only allow internal, same-origin relative paths. Rejects open redirects. */
export function isSafeNext(next: string | null | undefined): boolean {
	if (!next || next.length === 0) return false;
	if (next[0] !== '/') return false;
	const second = next[1];
	if (second === '/' || second === '\\') return false;
	if (next.includes('\\')) return false;
	return true;
}

export function buildAuthUrl(opts: {
	clientId: string;
	redirectUri: string;
	state: string;
	codeChallenge: string;
}): string {
	const q = new URLSearchParams({
		client_id: opts.clientId,
		redirect_uri: opts.redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state: opts.state,
		code_challenge: opts.codeChallenge,
		code_challenge_method: 'S256',
		prompt: 'select_account'
	});
	return `${GOOGLE_AUTH_URL}?${q.toString()}`;
}

export interface TokenExchangeResult {
	id_token: string;
	access_token?: string;
	expires_in?: number;
}

/** Exchange an authorization code for tokens (PKCE + client secret). */
export async function exchangeCode(opts: {
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	code: string;
	verifier: string;
	fetchImpl?: typeof fetch;
}): Promise<TokenExchangeResult> {
	const f = opts.fetchImpl ?? fetch;
	const body = new URLSearchParams({
		client_id: opts.clientId,
		code: opts.code,
		code_verifier: opts.verifier,
		redirect_uri: opts.redirectUri,
		grant_type: 'authorization_code'
	});
	if (opts.clientSecret) body.set('client_secret', opts.clientSecret);
	const res = await f(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString()
	});
	if (!res.ok) {
		console.error('[auth] token exchange failed', res.status, await res.text());
		throw new AuthError('token_exchange_failed');
	}
	const data = (await res.json().catch(() => ({}))) as Partial<TokenExchangeResult>;
	if (!data.id_token) {
		console.error('[auth] token exchange missing id_token', data);
		throw new AuthError('token_exchange_failed');
	}
	return data as TokenExchangeResult;
}

/**
 * Complete the Google callback: exchange the code, verify the id_token, upsert
 * the user and issue our own JWT. Deps are injectable for tests.
 */
export async function handleGoogleCallback(opts: {
	code: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	verifier: string;
	jwks?: JWKResolver;
	db?: Client;
	fetchImpl?: typeof fetch;
}): Promise<{ token: string; user: UserData }> {
	const { id_token } = await exchangeCode({
		clientId: opts.clientId,
		clientSecret: opts.clientSecret,
		redirectUri: opts.redirectUri,
		code: opts.code,
		verifier: opts.verifier,
		fetchImpl: opts.fetchImpl
	});
	const res = await loginWithGoogle(id_token, { jwks: opts.jwks, db: opts.db });
	return { token: res.access_token, user: res.user };
}
