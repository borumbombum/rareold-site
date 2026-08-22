import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import {
	listFollowedDistilleryIds,
	toggleDistilleryFollow
} from '$lib/server/distillery-followers';

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

describe('distillery followers', () => {
	it('starts empty', async () => {
		const client = await db();
		expect(await listFollowedDistilleryIds('u1', client)).toEqual([]);
	});

	it('toggles follows on and off idempotently', async () => {
		const client = await db();
		await toggleDistilleryFollow('u1', 'd-a', true, client);
		await toggleDistilleryFollow('u1', 'd-b', true, client);
		await toggleDistilleryFollow('u1', 'd-a', true, client);
		expect((await listFollowedDistilleryIds('u1', client)).sort()).toEqual(['d-a', 'd-b']);

		await toggleDistilleryFollow('u1', 'd-b', false, client);
		expect(await listFollowedDistilleryIds('u1', client)).toEqual(['d-a']);

		// unfollowing again is a no-op
		await toggleDistilleryFollow('u1', 'd-b', false, client);
		expect(await listFollowedDistilleryIds('u1', client)).toEqual(['d-a']);
	});

	it('isolates users', async () => {
		const client = await db();
		await toggleDistilleryFollow('u1', 'd-a', true, client);
		await toggleDistilleryFollow('u2', 'd-b', true, client);
		expect(await listFollowedDistilleryIds('u1', client)).toEqual(['d-a']);
		expect(await listFollowedDistilleryIds('u2', client)).toEqual(['d-b']);
	});
});
