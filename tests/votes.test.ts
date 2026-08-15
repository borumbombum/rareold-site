import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { applyVote, getKarmaMap } from '$lib/server/votes';

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

const vote = (entity_id: string, user_id: string, value: number) => ({
	entity_id,
	user_id,
	country: 'UY' as const,
	value
});

describe('applyVote', () => {
	it('records a first vote and computes karma', async () => {
		const client = await db();
		await applyVote(vote('a', 'u1', 1), client);
		const map = await getKarmaMap(['a'], client);
		expect(map.get('a')).toEqual({ entity_id: 'a', karma: 1, vote_count: 1, rank: 1 });
	});

	it('sums votes from different users and recounts on re-vote', async () => {
		const client = await db();
		await applyVote(vote('a', 'u1', 1), client);
		await applyVote(vote('a', 'u2', 1), client);
		expect((await getKarmaMap(['a'], client)).get('a')?.karma).toBe(2);
		expect((await getKarmaMap(['a'], client)).get('a')?.vote_count).toBe(2);

		await applyVote(vote('a', 'u1', -1), client);
		const after = (await getKarmaMap(['a'], client)).get('a');
		expect(after?.karma).toBe(0);
		expect(after?.vote_count).toBe(2);

		await applyVote(vote('a', 'u2', -1), client);
		expect((await getKarmaMap(['a'], client)).get('a')?.karma).toBe(-2);
		expect((await getKarmaMap(['a'], client)).get('a')?.vote_count).toBe(2);
	});

	it('ranks entities by karma descending', async () => {
		const client = await db();
		await applyVote(vote('a', 'u1', 3), client);
		await applyVote(vote('b', 'u1', 1), client);
		await applyVote(vote('c', 'u1', 2), client);
		const map = await getKarmaMap(['a', 'b', 'c'], client);
		const entries = [...map.values()];
		expect(entries.map((e) => e.entity_id)).toEqual(['a', 'c', 'b']);
		expect(entries.map((e) => e.rank)).toEqual([1, 2, 3]);
	});

	it('returns an empty map for empty or unknown slugs', async () => {
		const client = await db();
		expect((await getKarmaMap([], client)).size).toBe(0);
		const map = await getKarmaMap(['missing'], client);
		expect(map.size).toBe(0);
	});
});
