import type { Review, Whisky } from '$lib/types';

interface SchemaReview {
	'@type': 'Review';
	author: { '@type': 'Person'; name: string };
	reviewRating: { '@type': 'Rating'; ratingValue: number; bestRating: number };
	datePublished: string;
	reviewBody?: string;
	publisher: { '@type': 'Organization'; name: string };
}

interface ProductSchema {
	'@context': string;
	'@type': string;
	name: string;
	description?: string;
	image?: string;
	brand?: { '@type': string; name: string };
	category?: string;
	countryOfOrigin?: { '@type': string; name: string };
	url?: string;
	aggregateRating?: {
		'@type': string;
		ratingValue: number;
		bestRating: number;
		worstRating: number;
		ratingCount: number;
	};
	review?: SchemaReview[];
}

const MAX_SCHEMA_REVIEWS = 20;

export function buildProductSchema(
	product: Whisky,
	reviews: Review[],
	origin: string
): ProductSchema {
	const schema: ProductSchema = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		url: `${origin}/whisky/${product.slug}`
	};

	if (product.description) {
		schema.description = product.description.replace(/<[^>]*>/g, '').slice(0, 5000);
	}

	if (product.image) {
		schema.image = product.image.startsWith('http')
			? product.image
			: `${origin}${product.image}`;
	}

	if (product.distillery) {
		schema.brand = { '@type': 'Brand', name: product.distillery.name };
	}

	schema.category = 'Single Malt Whisky';

	if (product.origin) {
		const countryNames: Record<string, string> = {
			scotland: 'Scotland',
			ireland: 'Ireland',
			usa: 'United States',
			japan: 'Japan',
			india: 'India',
			canada: 'Canada',
			argentina: 'Argentina'
		};
		const countryName = countryNames[product.origin] ?? product.origin;
		schema.countryOfOrigin = { '@type': 'Country', name: countryName };
	}

	if (reviews.length > 0) {
		const scores = reviews.map((r) => r.score);
		const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
		schema.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: Math.round(avg * 10) / 10,
			bestRating: 5,
			worstRating: 1,
			ratingCount: reviews.length
		};

		const sorted = [...reviews]
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.slice(0, MAX_SCHEMA_REVIEWS);

		schema.review = sorted.map((r) => ({
			'@type': 'Review' as const,
			author: { '@type': 'Person' as const, name: r.user_name ?? 'Anonymous' },
			reviewRating: {
				'@type': 'Rating' as const,
				ratingValue: r.score,
				bestRating: 5
			},
			datePublished: r.created_at,
			...(r.comment ? { reviewBody: r.comment } : {}),
			publisher: { '@type': 'Organization' as const, name: 'Old Rare' }
		}));
	}

	return schema;
}
