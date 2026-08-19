import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import {
	createProduct,
	updateProduct,
	deleteProduct,
	listProducts,
	getProduct,
	listReviews,
	deleteReview,
	getStats,
	listUsers,
	setUserRole
} from '$lib/server/admin';
import { upsertUser } from '$lib/server/users';

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

const baseProduct = {
	id: 'test-whisky',
	name: 'Test Whisky',
	brand: 'Test Distillery',
	description: 'A test whisky',
	image: null,
	video: null,
	origin_id: 'scotland',
	region_id: null,
	age: 12,
	volume: '700 ml',
	abv: 46,
	cask: 'Ex-Bourbon',
	name_pt: null,
	description_pt: null,
	name_en: null,
	description_en: null
};

describe('admin products', () => {
	it('creates, updates, and deletes a product', async () => {
		const client = await db();
		expect(await listProducts(client)).toEqual([]);

		await createProduct(baseProduct, client);
		expect((await listProducts(client)).map((p) => p.id)).toEqual(['test-whisky']);

		await updateProduct(
			'test-whisky',
			{ ...baseProduct, name: 'Renamed Whisky', abv: 48 },
			client
		);
		const updated = await getProduct('test-whisky', client);
		expect(updated?.name).toBe('Renamed Whisky');
		expect(updated?.abv).toBe(48);

		await deleteProduct('test-whisky', client);
		expect(await listProducts(client)).toEqual([]);
		expect(await getProduct('test-whisky', client)).toBeNull();
	});

	it('create is an upsert (idempotent for the same id)', async () => {
		const client = await db();
		await createProduct(baseProduct, client);
		await createProduct({ ...baseProduct, name: 'Overwritten' }, client);
		const product = await getProduct('test-whisky', client);
		expect(product?.name).toBe('Overwritten');
		expect((await listProducts(client)).length).toBe(1);
	});
});

describe('admin reviews', () => {
	it('lists and deletes reviews with filters', async () => {
		const client = await db();
		await client.execute(
			`INSERT INTO reviews (id, product_id, user_name, score, comment, country) VALUES (?, ?, ?, ?, ?, ?)`,
			['r1', 'whisky-a', 'Alice', 5, 'Love it', 'UY']
		);
		await client.execute(
			`INSERT INTO reviews (id, product_id, user_name, score, comment, country) VALUES (?, ?, ?, ?, ?, ?)`,
			['r2', 'whisky-b', 'Bob', 3, 'Meh', 'BR']
		);

		expect((await listReviews({}, client)).length).toBe(2);
		expect((await listReviews({ q: 'Alice' }, client)).map((r) => r.id)).toEqual(['r1']);
		expect((await listReviews({ country: 'BR' }, client)).map((r) => r.id)).toEqual(['r2']);

		await deleteReview('r1', client);
		expect((await listReviews({}, client)).map((r) => r.id)).toEqual(['r2']);
	});
});

describe('admin stats', () => {
	it('reports counts and top products by karma', async () => {
		const client = await db();
		await createProduct(baseProduct, client);
		await client.execute('INSERT INTO karma (entity_id, karma, vote_count) VALUES (?, ?, ?)', [
			'test-whisky',
			10,
			3
		]);
		await upsertUser(
			{ sub: 'u1', email: 'a@x.com', name: 'A' },
			client
		);

		const stats = await getStats(client);
		expect(stats.counts.products).toBe(1);
		expect(stats.counts.users).toBe(1);
		expect(stats.top[0].slug).toBe('test-whisky');
		expect(stats.top[0].karma).toBe(10);
		expect(stats.top[0].vote_count).toBe(3);
	});
});

describe('admin users', () => {
	it('lists users and updates roles', async () => {
		const client = await db();
		await upsertUser({ sub: 'u1', email: 'a@x.com', name: 'A' }, client);
		await upsertUser({ sub: 'u2', email: 'b@x.com', name: 'B' }, client);

		expect((await listUsers(client)).map((u) => u.id).sort()).toEqual(['u1', 'u2']);
		expect((await listUsers(client))[0].role).toBe('user');

		await setUserRole('u1', 'admin', client);
		const admin = (await listUsers(client)).find((u) => u.id === 'u1');
		expect(admin?.role).toBe('admin');
	});
});
