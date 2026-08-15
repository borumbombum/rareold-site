import { afterEach, describe, expect, it } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { issueToken } from '$lib/server/auth';
import { upsertUser } from '$lib/server/users';
import {
	clearAuthStateCookie,
	clearSessionCookie,
	SESSION_COOKIE,
	setAuthStateCookie,
	setSessionCookie,
	getAuthState,
	getSessionToken,
	getSessionUser
} from '$lib/server/session';

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

interface FakeCookies extends Cookies {
	store: Map<string, string>;
	meta: Map<string, Record<string, unknown>>;
}

function fakeCookies(initial: Record<string, string> = {}): FakeCookies {
	const store = new Map<string, string>();
	const meta = new Map<string, Record<string, unknown>>();
	for (const [k, v] of Object.entries(initial)) store.set(k, v);
	return {
		store,
		meta,
		get(name: string) {
			return store.get(name) ?? null;
		},
		set(name: string, value: string, opts: Record<string, unknown> = {}) {
			store.set(name, value);
			meta.set(name, opts);
		},
		delete(name: string) {
			store.delete(name);
		}
	} as unknown as FakeCookies;
}

describe('session cookie helpers', () => {
	it('sets the session cookie httpOnly/lax with a 30d TTL', () => {
		const c = fakeCookies();
		setSessionCookie(c, 'jwt-token', false);
		expect(c.store.get(SESSION_COOKIE)).toBe('jwt-token');
		const opts = c.meta.get(SESSION_COOKIE)!;
		expect(opts.httpOnly).toBe(true);
		expect(opts.sameSite).toBe('lax');
		expect(opts.path).toBe('/');
		expect(opts.secure).toBe(false);
		expect(opts.maxAge).toBe(60 * 60 * 24 * 30);
	});

	it('reads and clears the session token', () => {
		const c = fakeCookies({ [SESSION_COOKIE]: 'abc' });
		expect(getSessionToken(c)).toBe('abc');
		clearSessionCookie(c);
		expect(getSessionToken(c)).toBeNull();
	});
});

describe('getSessionUser', () => {
	it('returns null with no cookie', async () => {
		const client = await db();
		expect(await getSessionUser(fakeCookies(), client)).toBeNull();
	});

	it('returns null for an invalid token', async () => {
		const client = await db();
		const c = fakeCookies({ [SESSION_COOKIE]: 'garbage.token.here' });
		expect(await getSessionUser(c, client)).toBeNull();
	});

	it('returns the user for a valid session cookie', async () => {
		const client = await db();
		await upsertUser({ sub: 's1', email: 's@example.com', name: 'Session User' }, client);
		const token = await issueToken('s1');
		const c = fakeCookies({ [SESSION_COOKIE]: token });
		const user = await getSessionUser(c, client);
		expect(user?.id).toBe('s1');
		expect(user?.email).toBe('s@example.com');
	});

	it('returns null when the token sub is not a user', async () => {
		const client = await db();
		const token = await issueToken('nobody');
		const c = fakeCookies({ [SESSION_COOKIE]: token });
		expect(await getSessionUser(c, client)).toBeNull();
	});
});

describe('auth state cookie', () => {
	it('round-trips state, next and verifier', () => {
		const c = fakeCookies();
		setAuthStateCookie(c, { state: 'st', next: '/whisky/x', verifier: 'vf' }, true);
		expect(getAuthState(c)).toEqual({ state: 'st', next: '/whisky/x', verifier: 'vf' });
		clearAuthStateCookie(c);
		expect(getAuthState(c)).toBeNull();
	});

	it('returns null for a malformed cookie', () => {
		const c = fakeCookies({ 'rareold.auth_state': 'not-json' });
		expect(getAuthState(c)).toBeNull();
	});
});
