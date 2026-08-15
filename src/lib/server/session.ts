import type { Cookies } from '@sveltejs/kit';
import type { Client } from '@libsql/client';
import { turso } from './turso';
import { getAuthedUser } from './auth';
import type { UserData } from '$lib/types';

export const SESSION_COOKIE = 'rareold.session';
export const AUTH_STATE_COOKIE = 'rareold.auth_state';
const SESSION_TTL = 60 * 60 * 24 * 30;
const AUTH_STATE_TTL = 60 * 10;

export function setSessionCookie(cookies: Cookies, token: string, secure: boolean): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: SESSION_TTL
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionToken(cookies: Cookies): string | null {
	return cookies.get(SESSION_COOKIE) ?? null;
}

/** Current user from the session cookie, or null when logged out / token invalid. */
export async function getSessionUser(
	cookies: Cookies,
	db: Client = turso
): Promise<UserData | null> {
	const token = getSessionToken(cookies);
	if (!token) return null;
	try {
		return await getAuthedUser(token, db);
	} catch {
		return null;
	}
}

export interface AuthState {
	state: string;
	next: string;
	verifier: string;
}

export function setAuthStateCookie(cookies: Cookies, value: AuthState, secure: boolean): void {
	cookies.set(AUTH_STATE_COOKIE, JSON.stringify(value), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: AUTH_STATE_TTL
	});
}

export function getAuthState(cookies: Cookies): AuthState | null {
	const raw = cookies.get(AUTH_STATE_COOKIE);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as AuthState;
	} catch {
		return null;
	}
}

export function clearAuthStateCookie(cookies: Cookies): void {
	cookies.delete(AUTH_STATE_COOKIE, { path: '/' });
}
