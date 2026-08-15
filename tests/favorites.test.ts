import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { listFavoriteIds, toggleFavorite } from '$lib/server/favorites';

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

describe('favorites', () => {
	it('starts empty', async () => {
		const client = await db();
		expect(await listFavoriteIds('u1', client)).toEqual([]);
	});

	it('toggles favorites on and off idempotently', async () => {
		const client = await db();
		await toggleFavorite('u1', 'whisky-a', true, client);
		await toggleFavorite('u1', 'whisky-b', true, client);
		await toggleFavorite('u1', 'whisky-a', true, client);
		expect((await listFavoriteIds('u1', client)).sort()).toEqual(['whisky-a', 'whisky-b']);

		await toggleFavorite('u1', 'whisky-a', false, client);
		await toggleFavorite('u1', 'whisky-a', false, client);
		expect(await listFavoriteIds('u1', client)).toEqual(['whisky-b']);
	});

	it('keeps favorites isolated per user', async () => {
		const client = await db();
		await toggleFavorite('u1', 'whisky-a', true, client);
		await toggleFavorite('u2', 'whisky-b', true, client);
		expect(await listFavoriteIds('u1', client)).toEqual(['whisky-a']);
		expect(await listFavoriteIds('u2', client)).toEqual(['whisky-b']);
	});
});
