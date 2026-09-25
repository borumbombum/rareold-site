import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import {
	listApiIpControls,
	upsertApiIpControl,
	deleteApiIpControl
} from '$lib/server/api-ip-controls';
import {
	checkApiLimit,
	resetRateLimits,
	getApiUsageStats,
	invalidateControlsCache,
	DEFAULT_LIMIT_PER_MIN
} from '$lib/server/api-ratelimit';
import {
	resolveLang,
	serializeWhisky,
	findWhisky,
	filterWhiskies,
	listOrigins,
	listDistilleries
} from '$lib/server/api-v1';
import { WHISKIES } from '$lib/data/whiskies';

const dbs: Client[] = [];

beforeEach(() => resetRateLimits());

afterEach(async () => {
	for (const db of dbs.splice(0)) await db.close();
	resetRateLimits();
});

describe('public API serialization (064)', () => {
	it('resolveLang defaults to en and accepts known locales only', () => {
		expect(resolveLang(null)).toBe('en');
		expect(resolveLang('')).toBe('en');
		expect(resolveLang('de')).toBe('en');
		expect(resolveLang('ES')).toBe('es');
		expect(resolveLang('fr')).toBe('fr');
	});

	it('serializeWhisky localizes name/description with base fallback', () => {
		const w = WHISKIES.find((x) => x.id === '1770-glasgow-peated');
		expect(w).toBeTruthy();
		if (!w) return;

		const pt = serializeWhisky(w, 'pt');
		// products have no `_es` columns — base `name`/`description` ARE Spanish
		expect(serializeWhisky(w, 'es').name).toBe(w.name);
		expect(pt.description).toBe((w.description_pt ?? w.description) as string);
		expect(pt.videos).toEqual(w.videos ?? []);
		expect(pt.distillery?.id).toBe(w.distillery_id);
		expect(pt.origin.id).toBe('scotland');
		expect(pt.origin.name).toBe('Escócia');

		const es = serializeWhisky(w, 'es');
		expect(es.origin.name).toBe('Escocia');

		const en = serializeWhisky(w, 'en');
		expect(en.origin.name).toBe('Scotland');
	});

	it('findWhisky returns full localized product with videos, null for unknown', () => {
		const hit = findWhisky('1770-glasgow-peated', 'en');
		expect(hit).toBeTruthy();
		expect(hit?.id).toBe('1770-glasgow-peated');
		expect(Array.isArray(hit?.videos)).toBe(true);
		expect(hit?.videos?.length).toBeGreaterThan(0);

		expect(findWhisky('does-not-exist', 'en')).toBeNull();
	});

	it('filters: country, distillery, q', () => {
		const scotland = filterWhiskies({ country: 'scotland' }, 'en');
		expect(scotland.length).toBeGreaterThan(0);
		expect(scotland.every((w) => w.origin.id === 'scotland')).toBe(true);

		const dist = filterWhiskies({ distillery: 'glasgow-1770' }, 'en');
		expect(dist.length).toBeGreaterThan(0);
		expect(dist.every((w) => w.distillery?.id === 'glasgow-1770')).toBe(true);

		const all = filterWhiskies({}, 'en');
		expect(all.length).toBe(WHISKIES.length);
		const q = filterWhiskies({ q: 'Glasgow' }, 'en');
		expect(q.length).toBeGreaterThan(0);
		expect(q.length).toBeLessThan(all.length);
		expect(q.every((w) => w.name.toLowerCase().includes('glasgow') || (w.description ?? '').toLowerCase().includes('glasgow'))).toBe(true);
	});

	it('origins and distilleries lists localize', () => {
		const en = listOrigins('en');
		expect(en.length).toBeGreaterThan(0);
		expect(en.find((o) => o.id === 'scotland')?.name).toBe('Scotland');

		const es = listOrigins('es');
		expect(es.find((o) => o.id === 'scotland')?.name).toBe('Escocia');

		const distEn = listDistilleries('en');
		expect(distEn.length).toBeGreaterThan(0);
		const aber = distEn.find((d) => d.id === 'aber-falls');
		expect(aber?.name).toBe('Aber Falls Distillery');

		const ja = listDistilleries('ja');
		expect(ja.find((d) => d.id === 'aber-falls')?.name).toBe('アバー・フォールズ蒸溜所');
	});
});

describe('api-ip-controls CRUD (064)', () => {
	it('upsert creates and updates; delete removes', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertApiIpControl({ ip: '1.2.3.4', blocked: true, reason: 'abuse', limit_per_min: 10 }, db);
		let rows = await listApiIpControls(db);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ ip: '1.2.3.4', blocked: true, reason: 'abuse', limit_per_min: 10 });

		await upsertApiIpControl({ ip: '1.2.3.4', blocked: false, limit_per_min: null, reason: '' }, db);
		rows = await listApiIpControls(db);
		expect(rows[0]).toMatchObject({ ip: '1.2.3.4', blocked: false, limit_per_min: null, reason: null });

		await deleteApiIpControl('1.2.3.4', db);
		expect(await listApiIpControls(db)).toHaveLength(0);
	});
});

describe('rate limiter + admin IP controls (064)', () => {
	it('allows DEFAULT_LIMIT_PER_MIN requests then 429s', async () => {
		const db = await createTestDb();
		dbs.push(db);

		for (let i = 0; i < DEFAULT_LIMIT_PER_MIN; i++) {
			expect(await checkApiLimit('10.0.0.1', '/api/v1/public/whiskies', db)).toBeNull();
		}
		const over = await checkApiLimit('10.0.0.1', '/api/v1/public/whiskies', db);
		expect(over?.status).toBe(429);
		expect(await over?.json()).toMatchObject({ error: 'rate_limited' });
		expect(over?.headers.get('Retry-After')).toBeTruthy();

		const other = await checkApiLimit('10.0.0.2', '/api/v1/public/whiskies', db);
		expect(other).toBeNull();
	});

	it('blocked IP gets 403 before counting', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertApiIpControl({ ip: '203.0.113.7', blocked: true, reason: 'test' }, db);
		invalidateControlsCache();

		const res = await checkApiLimit('203.0.113.7', '/api/v1/public/whiskies', db);
		expect(res?.status).toBe(403);
		expect(await res?.json()).toMatchObject({ error: 'blocked' });

		const clear = await checkApiLimit('8.8.8.8', '/api/v1/public/whiskies', db);
		expect(clear).toBeNull();
	});

	it('per-IP limit override replaces the default', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertApiIpControl({ ip: '198.51.100.9', blocked: false, limit_per_min: 2 }, db);
		invalidateControlsCache();

		expect(await checkApiLimit('198.51.100.9', '/api/v1/public/origins', db)).toBeNull();
		expect(await checkApiLimit('198.51.100.9', '/api/v1/public/origins', db)).toBeNull();
		const third = await checkApiLimit('198.51.100.9', '/api/v1/public/origins', db);
		expect(third?.status).toBe(429);
	});

	it('usage stats track requests, endpoints and denied count', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await checkApiLimit('192.0.2.1', '/api/v1/public/whiskies', db);
		await checkApiLimit('192.0.2.1', '/api/v1/public/whiskies', db);
		await checkApiLimit('192.0.2.1', '/api/v1/public/origins', db);

		const stats = getApiUsageStats();
		expect(stats.requestsInWindow).toBe(3);
		expect(stats.endpoints.find((e) => e.path === '/api/v1/public/whiskies')?.hits).toBe(2);
		expect(stats.endpoints.find((e) => e.path === '/api/v1/public/origins')?.hits).toBe(1);
		expect(stats.topIps.find((e) => e.ip === '192.0.2.1')?.hits).toBe(3);
	});
});