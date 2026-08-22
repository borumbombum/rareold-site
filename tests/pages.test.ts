import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { upsertPage, getPageBySlug, listPages, deletePage } from '$lib/server/pages';

const dbs: Client[] = [];

afterEach(async () => {
	for (const db of dbs.splice(0)) await db.close();
});

describe('pages CRUD (043)', () => {
	it('create → read → update → list → delete', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertPage({ id: 'test-043', slug: 'zz-cms-test', title: 'T', body: '<p>hello</p>', title_en: 'Hello' }, db);
		const created = await getPageBySlug('zz-cms-test', db);
		expect(created?.id).toBe('test-043');
		expect(created?.title_en).toBe('Hello');

		await upsertPage({ id: 'test-043', slug: 'zz-cms-test', title: 'T2', body: '<p>updated</p>' }, db);
		const updated = await getPageBySlug('zz-cms-test', db);
		expect(updated?.title).toBe('T2');
		expect(updated?.title_en).toBeNull();

		expect((await listPages(db)).map((p) => p.slug)).toContain('zz-cms-test');

		await deletePage('test-043', db);
		expect(await getPageBySlug('zz-cms-test', db)).toBeNull();
	});
});
