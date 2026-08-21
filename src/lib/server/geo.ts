import type { LocaleKey } from '$lib/utils/locales';

/** IP -> country resolution, isolated behind this module so the provider can be swapped.
 *  Default provider: ipwho.is (HTTPS, no API key). Override with GEO_IP_ENDPOINT. */
const ENDPOINT = process.env.GEO_IP_ENDPOINT ?? 'https://ipwho.is/';

const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 10_000;
const TIMEOUT_MS = 1000;

/** Language-proximity map: country -> closest available locale.
 *  Unmapped countries fall back to English (the base locale) => no redirect. */
const COUNTRY_TO_LOCALE: Record<string, LocaleKey> = {
	// Portuguese
	PT: 'pt',
	BR: 'pt',
	AO: 'pt',
	MZ: 'pt',
	// Spanish
	ES: 'es',
	UY: 'es',
	AR: 'es',
	MX: 'es',
	CL: 'es',
	CO: 'es',
	PE: 'es',
	EC: 'es',
	VE: 'es',
	BO: 'es',
	PY: 'es',
	GT: 'es',
	HN: 'es',
	SV: 'es',
	NI: 'es',
	CR: 'es',
	PA: 'es',
	DO: 'es',
	CU: 'es',
	// French
	FR: 'fr',
	BE: 'fr',
	CH: 'fr',
	LU: 'fr',
	MC: 'fr',
	// Japanese
	JP: 'ja',
	// English
	US: 'en',
	GB: 'en',
	IE: 'en',
	AU: 'en',
	NZ: 'en',
	CA: 'en'
};

export function localeForCountry(country: string): LocaleKey | null {
	return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? null;
}

const BOT_PATTERN =
	/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|twitterbot|linkedin|embedly|quora link|pinterest|lighthouse|pagespeed|headless|preview/i;

export function isBot(userAgent: string | null): boolean {
	if (!userAgent) return true;
	return BOT_PATTERN.test(userAgent);
}

interface CacheEntry {
	country: string | null;
	at: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

function cacheGet(ip: string): string | null | undefined {
	const hit = cache.get(ip);
	if (!hit) return undefined;
	const ttl = hit.country ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
	if (Date.now() - hit.at > ttl) {
		cache.delete(ip);
		return undefined;
	}
	return hit.country;
}

function cacheSet(ip: string, country: string | null): void {
	if (cache.size >= CACHE_MAX) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(ip, { country, at: Date.now() });
}

function isPrivateIp(ip: string): boolean {
	return (
		ip === '' ||
		ip === '::1' ||
		ip.startsWith('127.') ||
		ip.startsWith('10.') ||
		ip.startsWith('192.168.') ||
		ip.startsWith('169.254.') ||
		ip.startsWith('fc') ||
		ip.startsWith('fd') ||
		ip.startsWith('fe80:') ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(ip)
	);
}

/** Resolve visitor IP -> ISO country code (uppercased), or null when unknown.
 *  Results are cached in-memory (positive ~24h, negative ~5min) and concurrent
 *  lookups for the same IP share a single in-flight promise. */
export async function resolveCountry(ip: string): Promise<string | null> {
	if (!ip || isPrivateIp(ip)) return null;
	const cached = cacheGet(ip);
	if (cached !== undefined) return cached;
	const pending = inflight.get(ip);
	if (pending) return pending;
	const promise = (async () => {
		try {
			const res = await fetch(`${ENDPOINT}${encodeURIComponent(ip)}`, {
				signal: AbortSignal.timeout(TIMEOUT_MS),
				headers: { accept: 'application/json' }
			});
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data: unknown = await res.json();
			const code =
				typeof data === 'object' && data !== null && 'country_code' in data
					? (data as { country_code?: unknown }).country_code
					: null;
			const country = typeof code === 'string' && code.length === 2 ? code.toUpperCase() : null;
			cacheSet(ip, country);
			return country;
		} catch {
			cacheSet(ip, null);
			return null;
		} finally {
			inflight.delete(ip);
		}
	})();
	inflight.set(ip, promise);
	return promise;
}
