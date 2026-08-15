import {
	createLocalJWKSet,
	exportJWK,
	generateKeyPair,
	SignJWT,
	type LocalJWKSet
} from 'jose';

export interface GoogleTokenOverrides {
	aud?: string;
	iss?: string;
	email?: string;
	email_verified?: boolean;
	sub?: string;
	name?: string;
	picture?: string;
	exp?: string | number;
}

export interface TestJwks {
	jwks: LocalJWKSet;
	/** Sign a Google-style RS256 ID token accepted by `verifyGoogleToken(opts.jwks)`. */
	sign: (overrides?: GoogleTokenOverrides) => Promise<string>;
}

export async function makeTestJwks(): Promise<TestJwks> {
	const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
	const jwk = await exportJWK(publicKey);
	jwk.kid = 'test-key';
	const jwks = createLocalJWKSet({ keys: [{ ...jwk }] });

	const sign = (overrides: GoogleTokenOverrides = {}): Promise<string> =>
		new SignJWT({
			email: overrides.email ?? 'user@example.com',
			email_verified: overrides.email_verified ?? true,
			name: overrides.name ?? 'Test User',
			picture: overrides.picture ?? ''
		})
			.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
			.setSubject(overrides.sub ?? 'google-sub-123')
			.setIssuer(overrides.iss ?? 'https://accounts.google.com')
			.setAudience(overrides.aud ?? 'test-client-id.apps.googleusercontent.com')
			.setIssuedAt()
			.setExpirationTime(overrides.exp ?? '1h')
			.sign(privateKey);

	return { jwks, sign };
}
