import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { insertReview, listReviews, getRatingMap, getUserReviewedSlugs, getReviewImage } from '$lib/server/reviews';
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
		await upsertUser({ sub: 'r4', email: 'r4@example.com', name: 'R4' }, client);
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
				user_id: 'r4',
				user_name: 'R4',
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

	it('upserts a review: updating existing review for same user+product', async () => {
		const client = await db();
		await upsertUser({ sub: 'r5', email: 'r5@example.com', name: 'R5' }, client);
		await insertReview(
			{
				product_id: 'p5',
				user_id: 'r5',
				user_name: 'R5',
				score: 3,
				comment: 'OK',
				country: 'UY'
			},
			client
		);
		await insertReview(
			{
				product_id: 'p5',
				user_id: 'r5',
				user_name: 'R5',
				score: 5,
				comment: 'Excellent!',
				country: 'UY'
			},
			client
		);
		const list = await listReviews('p5', undefined, client);
		expect(list).toHaveLength(1);
		expect(list[0].score).toBe(5);
		expect(list[0].comment).toBe('Excellent!');
	});

	it('getRatingMap returns avg_rating and review_count', async () => {
		const client = await db();
		await upsertUser({ sub: 'r6', email: 'r6@example.com', name: 'R6' }, client);
		await upsertUser({ sub: 'r7', email: 'r7@example.com', name: 'R7' }, client);
		await insertReview(
			{
				product_id: 'p6',
				user_id: 'r6',
				user_name: 'R6',
				score: 4,
				country: 'UY'
			},
			client
		);
		await insertReview(
			{
				product_id: 'p6',
				user_id: 'r7',
				user_name: 'R7',
				score: 2,
				country: 'UY'
			},
			client
		);
		const map = await getRatingMap(['p6'], client);
		expect(map.size).toBe(1);
		const entry = map.get('p6')!;
		expect(entry.avg_rating).toBe(3);
		expect(entry.review_count).toBe(2);
	});

	it('getUserReviewedSlugs returns product_ids the user reviewed', async () => {
		const client = await db();
		await upsertUser({ sub: 'r8', email: 'r8@example.com', name: 'R8' }, client);
		await insertReview(
			{
				product_id: 'p7',
				user_id: 'r8',
				user_name: 'R8',
				score: 5,
				country: 'UY'
			},
			client
		);
		await insertReview(
			{
				product_id: 'p8',
				user_id: 'r8',
				user_name: 'R8',
				score: 4,
				country: 'UY'
			},
			client
		);
		const slugs = await getUserReviewedSlugs('r8', undefined, client);
		expect(slugs).toContain('p7');
		expect(slugs).toContain('p8');
		expect(slugs).toHaveLength(2);
	});

	it('persists image and location, exposing image_url and coords on read', async () => {
		const client = await db();
		await upsertUser({ sub: 'r9', email: 'r9@example.com', name: 'R9' }, client);
		const photo = Buffer.from('fake-jpeg-bytes');
		const created = await insertReview(
			{
				product_id: 'p9',
				user_id: 'r9',
				user_name: 'R9',
				score: 4,
				comment: 'With photo',
				country: 'UY',
				image: { data: photo, type: 'image/jpeg' },
				lat: -34.90111,
				lng: -56.16453
			},
			client
		);

		const list = await listReviews('p9', undefined, client);
		expect(list[0].image_url).toBe(`/api/reviews/${created.id}/image`);
		expect(list[0].lat).toBeCloseTo(-34.90111);
		expect(list[0].lng).toBeCloseTo(-56.16453);

		const stored = await getReviewImage(created.id, client);
		expect(stored?.type).toBe('image/jpeg');
		expect(Buffer.compare(stored!.data, photo)).toBe(0);
		expect(await getReviewImage('nope', client)).toBeNull();
	});

	it('keeps the existing photo and location when a review is updated without them', async () => {
		const client = await db();
		await upsertUser({ sub: 'r10', email: 'r10@example.com', name: 'R10' }, client);
		await insertReview(
			{
				product_id: 'p10',
				user_id: 'r10',
				user_name: 'R10',
				score: 3,
				country: 'UY',
				image: { data: Buffer.from('one'), type: 'image/png' },
				lat: 1.5,
				lng: 2.5
			},
			client
		);
		await insertReview(
			{
				product_id: 'p10',
				user_id: 'r10',
				user_name: 'R10',
				score: 5,
				country: 'UY'
			},
			client
		);

		const list = await listReviews('p10', undefined, client);
		expect(list).toHaveLength(1);
		expect(list[0].score).toBe(5);
		expect(list[0].image_url).toBeTruthy();
		expect(list[0].lat).toBe(1.5);
		expect(list[0].lng).toBe(2.5);
	});
});
