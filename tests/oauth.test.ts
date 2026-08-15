import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { makeTestJwks } from './helpers/google';
import { getUserById } from '$lib/server/users';
import {
	buildAuthUrl,
	exchangeCode,
	generatePkce,
	generateState,
	GOOGLE_AUTH_URL,
	GOOGLE_TOKEN_URL,
	handleGoogleCallback,
	isSafeNext
} from '$lib/server/oauth';
import { AuthError, verifyToken } from '$lib/server/auth';

const dbs: Client[] = [];

async function db(): Promise<Client> {
	const client = await createTestDb();
	dbs.push(client);
	return client;
}

afterEach(async () => {
	for (const c of dbs) c.close();
	dbs.length = 0;
});

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:5173/api/auth/callback';

describe('generatePkce', () => {
	it('produces an S256 challenge matching the verifier', () => {
		const { verifier, challenge } = generatePkce();
		expect(verifier.length).toBeGreaterThanOrEqual(43);
		const expected = createHash('sha256').update(verifier).digest('base64url');
		expect(challenge).toBe(expected);
	});

	it('produces unique states', () => {
		expect(generateState()).not.toBe(generateState());
	});
});

describe('isSafeNext', () => {
	it('accepts internal paths', () => {
		expect(isSafeNext('/')).toBe(true);
		expect(isSafeNext('/whisky/macallan-18')).toBe(true);
		expect(isSafeNext('/br/whisky/x?tab=reviews#top')).toBe(true);
	});

	it('rejects open redirects and non-paths', () => {
		expect(isSafeNext('')).toBe(false);
		expect(isSafeNext(null)).toBe(false);
		expect(isSafeNext(undefined)).toBe(false);
		expect(isSafeNext('https://evil.com')).toBe(false);
		expect(isSafeNext('http://evil.com')).toBe(false);
		expect(isSafeNext('//evil.com')).toBe(false);
		expect(isSafeNext('/\\evil.com')).toBe(false);
		expect(isSafeNext('javascript:alert(1)')).toBe(false);
		expect(isSafeNext('foo/bar')).toBe(false);
	});
});

describe('buildAuthUrl', () => {
	it('builds a Google authorization URL with PKCE params', () => {
		const url = buildAuthUrl({
			clientId: CLIENT_ID,
			redirectUri: REDIRECT_URI,
			state: 'abc123',
			codeChallenge: 'challenge'
		});
		expect(url.startsWith(`${GOOGLE_AUTH_URL}?`)).toBe(true);
		const q = new URL(url).searchParams;
		expect(q.get('client_id')).toBe(CLIENT_ID);
		expect(q.get('redirect_uri')).toBe(REDIRECT_URI);
		expect(q.get('response_type')).toBe('code');
		expect(q.get('scope')).toBe('openid email profile');
		expect(q.get('state')).toBe('abc123');
		expect(q.get('code_challenge')).toBe('challenge');
		expect(q.get('code_challenge_method')).toBe('S256');
		expect(q.get('prompt')).toBe('select_account');
	});
});

describe('exchangeCode', () => {
	it('POSTs form-encoded PKCE params + client_secret and returns the id_token', async () => {
		const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
			const body = init?.body as string;
			expect(String(_url)).toBe(GOOGLE_TOKEN_URL);
			expect(init?.method).toBe('POST');
			expect(body).toContain('client_id=test-client-id');
			expect(body).toContain('code=the-code');
			expect(body).toContain('code_verifier=the-verifier');
			expect(body).toContain('client_secret=the-secret');
			expect(body).toContain('redirect_uri=');
			expect(body).toContain('grant_type=authorization_code');
			return new Response(JSON.stringify({ id_token: 'the-id-token', access_token: 'at' }), {
				status: 200
			});
		});
		const res = await exchangeCode({
			clientId: CLIENT_ID,
			clientSecret: 'the-secret',
			redirectUri: REDIRECT_URI,
			code: 'the-code',
			verifier: 'the-verifier',
			fetchImpl
		});
		expect(res.id_token).toBe('the-id-token');
		expect(res.access_token).toBe('at');
	});

	it('throws when Google rejects the exchange', async () => {
		const fetchImpl = vi.fn(async () => new Response('invalid_grant', { status: 400 }));
		await expect(
			exchangeCode({
				clientId: CLIENT_ID,
				redirectUri: REDIRECT_URI,
				code: 'bad',
				verifier: 'v',
				fetchImpl
			})
		).rejects.toThrow(AuthError);
	});
});

describe('handleGoogleCallback', () => {
	it('exchanges the code, upserts the user and issues our JWT', async () => {
		const client = await db();
		const { jwks, sign } = await makeTestJwks();
		const idToken = await sign();

		const fetchImpl = vi.fn(async () =>
			new Response(JSON.stringify({ id_token: idToken }), { status: 200 })
		);

		const { token, user } = await handleGoogleCallback({
			code: 'the-code',
			clientId: CLIENT_ID,
			redirectUri: REDIRECT_URI,
			verifier: 'the-verifier',
			jwks,
			db: client,
			fetchImpl
		});

		expect(user.email).toBe('user@example.com');
		expect(user.id).toBe('google-sub-123');
		const stored = await getUserById('google-sub-123', client);
		expect(stored?.name).toBe('Test User');

		const payload = await verifyToken(token);
		expect(payload.sub).toBe('google-sub-123');
	});

	it('fails when the id_token is forged (different key)', async () => {
		const client = await db();
		const { jwks } = await makeTestJwks();
		const { sign: forge } = await makeTestJwks();
		const idToken = await forge();

		const fetchImpl = vi.fn(async () =>
			new Response(JSON.stringify({ id_token: idToken }), { status: 200 })
		);

		await expect(
			handleGoogleCallback({
				code: 'c',
				clientId: CLIENT_ID,
				redirectUri: REDIRECT_URI,
				verifier: 'v',
				jwks,
				db: client,
				fetchImpl
			})
		).rejects.toThrow(AuthError);
	});
});
