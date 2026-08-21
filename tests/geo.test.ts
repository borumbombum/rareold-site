import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBot, localeForCountry, resolveCountry } from '$lib/server/geo';

describe('localeForCountry', () => {
	it('maps Portuguese-speaking countries to pt (Portugal included)', () => {
		expect(localeForCountry('BR')).toBe('pt');
		expect(localeForCountry('PT')).toBe('pt');
		expect(localeForCountry('AO')).toBe('pt');
		expect(localeForCountry('MZ')).toBe('pt');
	});

	it('maps Hispanic America and Spain to es', () => {
		expect(localeForCountry('UY')).toBe('es');
		expect(localeForCountry('AR')).toBe('es');
		expect(localeForCountry('MX')).toBe('es');
		expect(localeForCountry('ES')).toBe('es');
		expect(localeForCountry('CO')).toBe('es');
	});

	it('maps French-speaking countries to fr', () => {
		expect(localeForCountry('FR')).toBe('fr');
		expect(localeForCountry('BE')).toBe('fr');
		expect(localeForCountry('CH')).toBe('fr');
	});

	it('maps Japan to ja', () => {
		expect(localeForCountry('JP')).toBe('ja');
	});

	it('maps English-speaking countries to en', () => {
		expect(localeForCountry('US')).toBe('en');
		expect(localeForCountry('GB')).toBe('en');
		expect(localeForCountry('AU')).toBe('en');
	});

	it('is case-insensitive and returns null for unmapped countries', () => {
		expect(localeForCountry('br')).toBe('pt');
		expect(localeForCountry('DE')).toBe(null);
		expect(localeForCountry('')).toBe(null);
	});
});

describe('isBot', () => {
	it('detects common crawlers', () => {
		expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
		expect(isBot('bingbot/2.0')).toBe(true);
		expect(isBot('facebookexternalhit/1.1')).toBe(true);
	});

	it('treats missing and regular user agents as not bots', () => {
		expect(isBot(null)).toBe(true);
		expect(isBot('Mozilla/5.0 (Macintosh) Chrome/126.0 Safari/537.36')).toBe(false);
	});
});

describe('resolveCountry', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('resolves a country from the provider', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				Response.json({ ip: '1.1.1.1', success: true, country_code: 'BR' })
			)
		);
		await expect(resolveCountry('1.1.1.1')).resolves.toBe('BR');
	});

	it('caches results — the provider is called once per IP', async () => {
		const fetchMock = vi.fn(async () => Response.json({ country_code: 'JP' }));
		vi.stubGlobal('fetch', fetchMock);
		await resolveCountry('2.2.2.2');
		await resolveCountry('2.2.2.2');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('dedupes concurrent lookups for the same IP', async () => {
		let calls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				calls++;
				await new Promise((r) => setTimeout(r, 10));
				return Response.json({ country_code: 'UY' });
			})
		);
		const [a, b] = await Promise.all([resolveCountry('3.3.3.3'), resolveCountry('3.3.3.3')]);
		expect(a).toBe('UY');
		expect(b).toBe('UY');
		expect(calls).toBe(1);
	});

	it('returns null on provider errors without throwing', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('rate limited', { status: 429 }))
		);
		await expect(resolveCountry('4.4.4.4')).resolves.toBe(null);
	});

	it('returns null for private/loopback IPs without calling the provider', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		await expect(resolveCountry('127.0.0.1')).resolves.toBe(null);
		await expect(resolveCountry('192.168.1.10')).resolves.toBe(null);
		await expect(resolveCountry('')).resolves.toBe(null);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
