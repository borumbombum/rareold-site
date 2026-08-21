import { describe, expect, it } from 'vitest';
import { buildProductSchema } from '$lib/server/schema';
import type { Review, Whisky } from '$lib/types';

const ORIGIN = 'https://borum.com.uy';

function makeProduct(overrides: Partial<Whisky> = {}): Whisky {
	return {
		id: 'abc123',
		slug: 'lagavulin-16-yo',
		name: 'Lagavulin 16 Years Old',
		distillery: {
			id: 'lagavulin',
			name: 'Lagavulin Distillery',
			name_es: null,
			name_pt: null,
			name_en: null,
			name_ja: null,
			name_fr: null
		},
		description: 'A rich and smoky Islay single malt.',
		image: '/data/images/lagavulin-16-yo.webp',
		video: null,
		origin: 'scotland',
		region: 'Islay',
		age: 16,
		volume: '700ml',
		abv: 43,
		cask: 'American Oak',
		distillery_id: null,
		name_pt: null,
		description_pt: null,
		name_en: null,
		description_en: null,
		name_ja: null,
		description_ja: null,
		name_fr: null,
		description_fr: null,
		resellers_uy: [],
		resellers_br: [],
		resellers_usa: [],
		...overrides
	};
}

function makeReview(overrides: Partial<Review> = {}): Review {
	return {
		id: 'rev1',
		product_id: 'abc123',
		user_id: 'u1',
		user_name: 'John Doe',
		score: 5,
		comment: 'Amazing whisky!',
		country: 'UY',
		created_at: '2026-08-15T10:00:00.000Z',
		is_verified_purchase: false,
		...overrides
	};
}

describe('buildProductSchema', () => {
	it('builds a valid Product schema with reviews', () => {
		const product = makeProduct();
		const reviews = [
			makeReview({ id: 'r1', score: 5 }),
			makeReview({ id: 'r2', score: 3, user_name: 'Jane' })
		];

		const schema = buildProductSchema(product, reviews, ORIGIN);

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('Product');
		expect(schema.name).toBe('Lagavulin 16 Years Old');
		expect(schema.url).toBe(`${ORIGIN}/whisky/lagavulin-16-yo`);
		expect(schema.description).toBe('A rich and smoky Islay single malt.');
		expect(schema.image).toBe(`${ORIGIN}/data/images/lagavulin-16-yo.webp`);
		expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Lagavulin Distillery' });
		expect(schema.countryOfOrigin).toEqual({ '@type': 'Country', name: 'Scotland' });
		expect(schema.category).toBe('Single Malt Whisky');
	});

	it('computes aggregateRating correctly', () => {
		const reviews = [
			makeReview({ id: 'r1', score: 4 }),
			makeReview({ id: 'r2', score: 2 }),
			makeReview({ id: 'r3', score: 5 })
		];

		const schema = buildProductSchema(makeProduct(), reviews, ORIGIN);

		expect(schema.aggregateRating).toBeDefined();
		expect(schema.aggregateRating!.ratingValue).toBe(3.7);
		expect(schema.aggregateRating!.ratingCount).toBe(3);
		expect(schema.aggregateRating!.bestRating).toBe(5);
		expect(schema.aggregateRating!.worstRating).toBe(1);
	});

	it('omits aggregateRating when no reviews', () => {
		const schema = buildProductSchema(makeProduct(), [], ORIGIN);
		expect(schema.aggregateRating).toBeUndefined();
	});

	it('handles single review correctly', () => {
		const schema = buildProductSchema(makeProduct(), [makeReview({ score: 4 })], ORIGIN);
		expect(schema.aggregateRating!.ratingValue).toBe(4);
		expect(schema.aggregateRating!.ratingCount).toBe(1);
	});

	it('caps review array at 20', () => {
		const reviews = Array.from({ length: 25 }, (_, i) =>
			makeReview({ id: `r${i}`, score: (i % 5) + 1 })
		);

		const schema = buildProductSchema(makeProduct(), reviews, ORIGIN);

		expect(schema.review).toBeDefined();
		expect(schema.review!.length).toBe(20);
	});

	it('maps reviews with author, rating, date, body', () => {
		const review = makeReview({
			id: 'r1',
			user_name: 'Alice',
			score: 4,
			comment: 'Very good',
			created_at: '2026-08-10T12:00:00.000Z'
		});

		const schema = buildProductSchema(makeProduct(), [review], ORIGIN);

		expect(schema.review).toHaveLength(1);
		const r = schema.review![0];
		expect(r['@type']).toBe('Review');
		expect(r.author).toEqual({ '@type': 'Person', name: 'Alice' });
		expect(r.reviewRating).toEqual({ '@type': 'Rating', ratingValue: 4, bestRating: 5 });
		expect(r.datePublished).toBe('2026-08-10T12:00:00.000Z');
		expect(r.reviewBody).toBe('Very good');
		expect(r.publisher).toEqual({ '@type': 'Organization', name: 'Old Rare' });
	});

	it('omits reviewBody when comment is null', () => {
		const review = makeReview({ comment: null });
		const schema = buildProductSchema(makeProduct(), [review], ORIGIN);
		expect(schema.review![0].reviewBody).toBeUndefined();
	});

	it('handles absolute image URLs', () => {
		const product = makeProduct({ image: 'https://cdn.example.com/img.webp' });
		const schema = buildProductSchema(product, [], ORIGIN);
		expect(schema.image).toBe('https://cdn.example.com/img.webp');
	});

	it('strips HTML from description', () => {
		const product = makeProduct({ description: '<p>Rich <b>smoky</b> flavor</p>' });
		const schema = buildProductSchema(product, [], ORIGIN);
		expect(schema.description).toBe('Rich smoky flavor');
	});

	it('handles unknown origin gracefully', () => {
		const product = makeProduct({ origin: 'unknown-country' });
		const schema = buildProductSchema(product, [], ORIGIN);
		expect(schema.countryOfOrigin).toEqual({ '@type': 'Country', name: 'unknown-country' });
	});

	it('omits image when null', () => {
		const product = makeProduct({ image: null });
		const schema = buildProductSchema(product, [], ORIGIN);
		expect(schema.image).toBeUndefined();
	});

	it('omits brand when no distillery', () => {
		const product = makeProduct({ distillery: null });
		const schema = buildProductSchema(product, [], ORIGIN);
		expect(schema.brand).toBeUndefined();
	});
});
