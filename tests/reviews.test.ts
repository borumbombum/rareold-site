import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { insertReview, listReviews } from '$lib/server/reviews';
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

describe('reviews', () => {
	it('inserts a review and lists it with the author name joined from users', async () => {
		const client = await db();
		await upsertUser({ sub: 'r1', email: 'rev@example.com', name: 'Reviewer' }, client);
		const review = await insertReview(
			{
				product_id: 'p1',
				user_id: 'r1',
				user_name: 'Reviewer',
				score: 5,
				comment: 'Great',
				country: 'UY'
			},
			client
		);
		expect(review.id).toBeTruthy();
		expect(review.score).toBe(5);
		expect(review.country).toBe('UY');

		const list = await listReviews('p1', undefined, client);
		expect(list).toHaveLength(1);
		expect(list[0].user_name).toBe('Reviewer');
		expect(list[0].user_id).toBe('r1');
		expect(list[0].comment).toBe('Great');
		expect(list[0].country).toBe('UY');
	});

	it('allows a review without comment', async () => {
		const client = await db();
		await upsertUser({ sub: 'r2', email: 'r2@example.com', name: 'R2' }, client);
		const review = await insertReview(
			{
				product_id: 'p2',
				user_id: 'r2',
				user_name: 'R2',
				score: 3,
				country: 'BR'
			},
			client
		);
		expect(review.comment).toBeNull();
	});

	it('filters reviews by country and product', async () => {
		const client = await db();
		await upsertUser({ sub: 'r3', email: 'r3@example.com', name: 'R3' }, client);
		await insertReview(
			{
				product_id: 'p3',
				user_id: 'r3',
				user_name: 'R3',
				score: 5,
				country: 'UY'
			},
			client
		);
		await insertReview(
			{
				product_id: 'p3',
				user_id: 'r3',
				user_name: 'R3',
				score: 1,
				country: 'BR'
			},
			client
		);
		await insertReview(
			{
				product_id: 'p4',
				user_id: 'r3',
				user_name: 'R3',
				score: 4,
				country: 'UY'
			},
			client
		);
		expect(await listReviews('p3', undefined, client)).toHaveLength(2);
		expect(await listReviews('p3', 'UY', client)).toHaveLength(1);
		expect(await listReviews('p4', 'UY', client)).toHaveLength(1);
		expect(await listReviews('p4', 'BR', client)).toHaveLength(0);
	});
});
