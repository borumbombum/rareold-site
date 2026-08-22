import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { listOrigins, getOriginById, upsertOrigin, deleteOrigin } from '$lib/server/origins';

const dbs: Client[] = [];

afterEach(async () => {
	for (const db of dbs.splice(0)) await db.close();
});

describe('origins admin CRUD (045)', () => {
	it('upsert creates then updates; localized names nullable', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertOrigin({ id: 'taiwan', name: 'Taiwan', flag: '🇹🇼', sort_order: 9 }, db);
		const created = await getOriginById('taiwan', db);
		expect(created).toMatchObject({ id: 'taiwan', name: 'Taiwan', flag: '🇹🇼', sort_order: 9 });

		await upsertOrigin(
			{ id: 'taiwan', name: 'Taiwan', flag: '🇹🇼', sort_order: 2, name_es: 'Taiwán' },
			db
		);
		const updated = await getOriginById('taiwan', db);
		expect(updated?.sort_order).toBe(2);
		expect(updated?.name_es).toBe('Taiwán');
		expect(updated?.name_en).toBeNull();

		const list = await listOrigins(db);
		expect(list.find((o) => o.id === 'taiwan')?.product_count).toBe(0);
	});

	it('listOrigins counts products and sorts by sort_order', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertOrigin({ id: 'b', name: 'B', sort_order: 2 }, db);
		await upsertOrigin({ id: 'a', name: 'A', sort_order: 1 }, db);
		for (let i = 0; i < 3; i++) {
			await db.execute({
				sql: "INSERT INTO products (id, name, origin_id) VALUES (?, ?, 'a')",
				args: [`p${i}`, `P${i}`]
			});
		}

		const list = await listOrigins(db);
		expect(list.map((o) => o.id)).toEqual(['a', 'b']);
		expect(list[0].product_count).toBe(3);
	});

	it('deleteOrigin blocked by products/distilleries/regions, allowed when clean', async () => {
		const db = await createTestDb();
		dbs.push(db);

		await upsertOrigin({ id: 'x', name: 'X' }, db);

		// clean → deleted
		expect(await deleteOrigin('x', db)).toEqual({ ok: true });
		expect(await getOriginById('x', db)).toBeNull();

		// product reference blocks
		await upsertOrigin({ id: 'y', name: 'Y' }, db);
		await db.execute("INSERT INTO products (id, name, origin_id) VALUES ('p1', 'P', 'y')");
		expect(await deleteOrigin('y', db)).toEqual({ ok: false, reason: 'products' });
		await db.execute("DELETE FROM products WHERE id = 'p1'");

		// distillery country reference blocks
		await db.execute(
			"INSERT INTO distilleries (id, slug, name, country) VALUES ('d1', 'd1', 'D', 'y')"
		);
		expect(await deleteOrigin('y', db)).toEqual({ ok: false, reason: 'distilleries' });
		await db.execute("DELETE FROM distilleries WHERE id = 'd1'");

		// region reference blocks
		await db.execute("INSERT INTO regions (id, origin_id, name) VALUES ('r1', 'y', 'R')");
		expect(await deleteOrigin('y', db)).toEqual({ ok: false, reason: 'regions' });
		await db.execute("DELETE FROM regions WHERE id = 'r1'");

		expect(await deleteOrigin('y', db)).toEqual({ ok: true });
	});
});
