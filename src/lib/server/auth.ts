import {
	SignJWT,
	jwtVerify,
	createRemoteJWKSet,
	type LocalJWKSet,
	type RemoteJWKSet,
	type JWTPayload
} from 'jose';
import { schnorr } from '@noble/curves/secp256k1.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import type { Client } from '@libsql/client';
import { env } from './env';
import { turso } from './turso';
import { getUserById, upsertUser, type GoogleClaims } from './users';
import type { UserData } from '$lib/types';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const TOKEN_TTL = '30d';
const HS256_ALGS = ['HS256'] as const;

export const isMockAuth = !env.googleClientId;

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export type JWKResolver = LocalJWKSet | RemoteJWKSet;

const googleJwks: JWKResolver = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

function secretKey(): Uint8Array {
	return new TextEncoder().encode(env.authSecret);
}

/**
 * Verify a Google ID token (signature + aud + iss + exp) and return the
 * verified identity claims. Pass `opts.jwks` in tests to use a local key set.
 */
export async function verifyGoogleToken(
	credential: string,
	opts: { jwks?: JWKResolver } = {}
): Promise<GoogleClaims> {
	if (isMockAuth) throw new AuthError('auth_not_configured');
	if (!credential) throw new AuthError('missing_credential');
	let payload: JWTPayload;
	try {
		const result = await jwtVerify(credential, opts.jwks ?? googleJwks, {
			audience: env.googleClientId,
			issuer: ['https://accounts.google.com', 'accounts.google.com'],
			algorithms: ['RS256', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512']
		});
		payload = result.payload;
	} catch (err) {
		console.error('[auth] id_token verification failed', err);
		throw new AuthError('invalid_google_token');
	}
	if (!payload.sub) throw new AuthError('invalid_google_token');
	if (!payload.email || payload.email_verified !== true) {
		console.error('[auth] id_token rejected: no verified email', {
			sub: payload.sub,
			email: payload.email,
			email_verified: payload.email_verified,
			aud: payload.aud,
			iss: payload.iss
		});
		throw new AuthError('invalid_google_token');
	}
	return {
		sub: String(payload.sub),
		email: String(payload.email),
		name: typeof payload.name === 'string' ? payload.name : undefined,
		picture: typeof payload.picture === 'string' ? payload.picture : undefined,
		login_type: 'google'
	};
}

/** Issue our own signed access token for a user id (HS256, ~30d). */
export function issueToken(userId: string): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime(TOKEN_TTL)
		.sign(secretKey());
}

/** Verify our own token and return the decoded payload (throws on any invalid token). */
export async function verifyToken(token: string): Promise<JWTPayload> {
	try {
		const { payload } = await jwtVerify(token, secretKey(), {
			algorithms: [...HS256_ALGS]
		});
		return payload;
	} catch {
		throw new AuthError('invalid_token');
	}
}

/** Verify a Bearer token and load the user from Turso; throws AuthError when unauthenticated. */
export async function getAuthedUser(
	token: string | null | undefined,
	db: Client = turso
): Promise<UserData> {
	if (!token) throw new AuthError('not_authed');
	const payload = await verifyToken(token);
	if (!payload.sub) throw new AuthError('invalid_token');
	const user = await getUserById(String(payload.sub), db);
	if (!user) throw new AuthError('invalid_token');
	return user;
}

const ADMIN_EMAILS = new Set(['borumbombum@proton.me']);

/** Google login: verify the ID token, persist the user, issue our JWT. */
export async function loginWithGoogle(
	credential: string,
	opts: { jwks?: JWKResolver; db?: Client; country?: string | null } = {}
): Promise<{ access_token: string; user: UserData }> {
	const claims = await verifyGoogleToken(credential, { jwks: opts.jwks });
	claims.role = ADMIN_EMAILS.has(claims.email) ? 'admin' : 'user';
	const user = await upsertUser(claims, opts.db ?? turso, opts.country);
	const access_token = await issueToken(user.id);
	return { access_token, user };
}

/** Demo login: persist the demo user and issue our JWT so it works against Turso. */
export async function loginWithDemo(
	db: Client = turso,
	country?: string | null
): Promise<{ access_token: string; user: UserData }> {
	const claims: GoogleClaims = {
		sub: 'demo',
		email: 'demo@rareold.app',
		name: 'Demo User',
		picture: '',
		login_type: 'mock'
	};
	const user = await upsertUser(claims, db, country);
	const access_token = await issueToken(user.id);
	return { access_token, user };
}

/** Nostr NIP-07 login: verify the signed event, persist the user, issue our JWT. */
export async function loginWithNostr(
	pubkey: string,
	signedEvent: any,
	origin: string,
	db: Client = turso,
	country?: string | null
): Promise<{ access_token: string; user: UserData }> {
	if (!pubkey || typeof pubkey !== 'string' || !/^[0-9a-f]{64}$/i.test(pubkey)) {
		throw new AuthError('invalid_nostr_pubkey');
	}
	if (!signedEvent || typeof signedEvent !== 'object') {
		throw new AuthError('invalid_nostr_event');
	}

	const { kind, created_at, tags, content, sig, id } = signedEvent;

	if (kind !== 27235) throw new AuthError('invalid_nostr_kind');
	if (!created_at || typeof created_at !== 'number') throw new AuthError('invalid_nostr_event');

	const nowSec = Math.floor(Date.now() / 1000);
	if (Math.abs(nowSec - created_at) > 300) throw new AuthError('stale_nostr_event');

	const uTag = tags?.find((t: any[]) => t[0] === 'u');
	const methodTag = tags?.find((t: any[]) => t[0] === 'method');
	if (!uTag || uTag[1] !== origin) throw new AuthError('invalid_nostr_tags');
	if (!methodTag || methodTag[1] !== 'GET') throw new AuthError('invalid_nostr_tags');

	if (signedEvent.pubkey !== pubkey) throw new AuthError('invalid_nostr_event');

	const validSig = schnorr.verify(hexToBytes(sig), hexToBytes(id), hexToBytes(pubkey));
	if (!validSig) throw new AuthError('invalid_nostr_signature');

	const claims: GoogleClaims = {
		sub: pubkey,
		email: '',
		name: content || 'Nostr User',
		picture: '',
		login_type: 'nostr'
	};
	const user = await upsertUser(claims, db, country);
	const access_token = await issueToken(user.id);
	return { access_token, user };}
