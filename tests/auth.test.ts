import { afterEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { makeTestJwks } from './helpers/google';
import {
	AuthError,
	getAuthedUser,
	issueToken,
	loginWithDemo,
	loginWithGoogle,
	verifyGoogleToken,
	verifyToken
} from '$lib/server/auth';
import { getUserById, upsertUser } from '$lib/server/users';

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

describe('own JWT tokens', () => {
	it('round-trips issueToken -> verifyToken with the same subject', async () => {
		const token = await issueToken('user-1');
		const payload = await verifyToken(token);
		expect(payload.sub).toBe('user-1');
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});

	it('rejects garbage tokens', async () => {
		await expect(verifyToken('not.a.jwt')).rejects.toThrow(AuthError);
		await expect(verifyToken('')).rejects.toThrow(AuthError);
	});

	it('rejects expired tokens', async () => {
		const expired = await new SignJWT({})
			.setProtectedHeader({ alg: 'HS256' })
			.setSubject('user-1')
			.setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
			.setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
			.sign(new TextEncoder().encode('test-secret-for-hs256-signing-0123456789abcdef'));
		await expect(verifyToken(expired)).rejects.toThrow(AuthError);
	});
});

describe('verifyGoogleToken', () => {
	it('accepts a valid Google ID token and returns claims', async () => {
		const { jwks, sign } = await makeTestJwks();
		const token = await sign();
		const claims = await verifyGoogleToken(token, { jwks });
		expect(claims).toEqual({
			sub: 'google-sub-123',
			email: 'user@example.com',
			name: 'Test User',
			picture: '',
			login_type: 'google'
		});
	});

	it('rejects a token with the wrong audience', async () => {
		const { jwks, sign } = await makeTestJwks();
		const token = await sign({ aud: 'other-app' });
		await expect(verifyGoogleToken(token, { jwks })).rejects.toThrow(AuthError);
	});

	it('rejects a token with the wrong issuer', async () => {
		const { jwks, sign } = await makeTestJwks();
		const token = await sign({ iss: 'https://evil.example.com' });
		await expect(verifyGoogleToken(token, { jwks })).rejects.toThrow(AuthError);
	});

	it('rejects a token without email_verified', async () => {
		const { jwks, sign } = await makeTestJwks();
		const token = await sign({ email_verified: false });
		await expect(verifyGoogleToken(token, { jwks })).rejects.toThrow(AuthError);
	});

	it('rejects an expired token', async () => {
		const { jwks, sign } = await makeTestJwks();
		const token = await sign({ exp: Math.floor(Date.now() / 1000) - 60 });
		await expect(verifyGoogleToken(token, { jwks })).rejects.toThrow(AuthError);
	});

	it('rejects a token signed by a different key (forgery)', async () => {
		const { jwks } = await makeTestJwks();
		const { sign: forge } = await makeTestJwks();
		const token = await forge();
		await expect(verifyGoogleToken(token, { jwks })).rejects.toThrow(AuthError);
	});
});

describe('getAuthedUser', () => {
	it('returns the Turso user for a valid token', async () => {
		const client = await db();
		const user = await upsertUser({ sub: 'u1', email: 'a@b.c', login_type: 'google' }, client);
		const token = await issueToken(user.id);
		const authed = await getAuthedUser(token, client);
		expect(authed.id).toBe('u1');
		expect(authed.email).toBe('a@b.c');
	});

	it('rejects a token for an unknown user', async () => {
		const client = await db();
		const token = await issueToken('nobody');
		await expect(getAuthedUser(token, client)).rejects.toThrow(AuthError);
	});

	it('rejects missing tokens', async () => {
		await expect(getAuthedUser(null)).rejects.toThrow(AuthError);
		await expect(getAuthedUser('')).rejects.toThrow(AuthError);
	});
});

describe('loginWithDemo', () => {
	it('persists the demo user and issues a working token', async () => {
		const client = await db();
		const { access_token, user } = await loginWithDemo(client);
		expect(user.id).toBe('demo');
		expect(user.name).toBe('Demo User');
		expect(user.login_type).toBe('mock');
		const stored = await getUserById('demo', client);
		expect(stored?.email).toBe('demo@rareold.app');
		const payload = await verifyToken(access_token);
		expect(payload.sub).toBe('demo');
	});
});

describe('loginWithGoogle', () => {
	it('verifies, persists the user and returns a working token', async () => {
		const client = await db();
		const { jwks, sign } = await makeTestJwks();
		const token = await sign();
		const { access_token, user } = await loginWithGoogle(token, { jwks, db: client });
		expect(user.email).toBe('user@example.com');
		expect(user.role).toBe('user');
		const stored = await getUserById(user.id, client);
		expect(stored?.name).toBe('Test User');
		const payload = await verifyToken(access_token);
		expect(payload.sub).toBe(user.id);
	});
});
