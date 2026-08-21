import { invalidateCache } from './cache';
import { getKarmaMap as dbGetKarmaMap } from './votes';
import { getRatingMap as dbGetRatingMap } from './reviews';
import { listReviews as dbListReviews } from './reviews';
import { getLatestReviews as dbGetLatestReviews } from './reviews';
import { listInfluencerVideos as dbListInfluencerVideos } from './videos';
import { cached } from './cache';
import { WHISKIES, getWhiskyBySlug } from '$lib/data/whiskies';
import { DISTILLERIES, getDistilleryBySlug as lookupDistillery } from '$lib/data/distilleries';
import { LOCALES } from '$lib/utils/locales';
import type { Distillery, EntityKarma, EntityRating, ProductVideo, Review, SiteContext, Whisky } from '$lib/types';

export interface PriceEntry {
	slug: string;
	price: number;
	promotional_price: number | null;
	seller_id: string;
	seller_name: string;
	has_stock: boolean;
}

/** Catalog whiskies from the build-time JSON. Same list for every site. */
export function getCatalog(site: SiteContext): Promise<Whisky[]> {
	return Promise.resolve(WHISKIES);
}

export function invalidateCatalog(siteId: string): void {
	invalidateCache('catalog:' + siteId);
}

/** Look up a whisky by slug (or id) from the JSON catalog. */
export async function getProductBySlug(site: SiteContext, slug: string): Promise<Whisky | null> {
	return getWhiskyBySlug(slug);
}

/** All distilleries/brands from the build-time JSON. */
export function getDistilleries(): Promise<Distillery[]> {
	return Promise.resolve(DISTILLERIES);
}

/** Look up a distillery by slug (or id) from the JSON catalog. */
export async function getDistilleryBySlug(site: SiteContext, slug: string): Promise<Distillery | null> {
	return lookupDistillery(slug);
}

/** Votes/karma for a set of entity slugs, read live from Turso. Cached ~60s. */
export async function getKarmaMap(slugs: string[]): Promise<Map<string, EntityKarma>> {
	const unique = [...new Set(slugs)].filter(Boolean);
	if (unique.length === 0) return new Map();
	return cached('karma', 60_000, () => dbGetKarmaMap(unique));
}

export function invalidateKarma(): void {
	invalidateCache('karma');
}

/** Star ratings for a set of product IDs from the product_ratings view. Cached ~60s. */
export async function getRatingMap(productIds: string[]): Promise<Map<string, EntityRating>> {
	const unique = [...new Set(productIds)].filter(Boolean);
	if (unique.length === 0) return new Map();
	return cached('rating', 60_000, () => dbGetRatingMap(unique));
}

export function invalidateRating(): void {
	invalidateCache('rating');
}

/** Reviews for a product from Turso. Cached ~5min. */
export async function getReviews(productId: string, country: string): Promise<Review[]> {
	return cached(`reviews:${country}:${productId}`, 300_000, () =>
		dbListReviews(productId, country)
	);
}

export function invalidateReviews(country: string, productId: string): void {
	invalidateCache(`reviews:${country}:${productId}`);
}

/** Influencer videos for a product+language (English tops up to 4). Cached ~5min. */
export async function getInfluencerVideos(productId: string, language: string): Promise<ProductVideo[]> {
	return cached(`videos:${language}:${productId}`, 300_000, () =>
		dbListInfluencerVideos(productId, language)
	);
}

export function invalidateInfluencerVideos(productId: string): void {
	for (const lang of LOCALES) invalidateCache(`videos:${lang}:${productId}`);
}

/** No online prices are published — always empty. */
export async function getFreshPrices(site: SiteContext): Promise<PriceEntry[]> {
	return [];
}

export interface ActivityItem {
	review: Review;
	product: Whisky;
}

/** Latest reviews with comments joined with product data. Cached ~5min. */
export async function getLatestActivity(limit: number): Promise<ActivityItem[]> {
	return cached('activity', 300_000, async () => {
		const reviews = await dbGetLatestReviews(limit);
		return reviews
			.map((review) => {
				const product = getWhiskyBySlug(review.product_id);
				if (!product) return null;
				return { review, product };
			})
			.filter((item): item is ActivityItem => item !== null);
	});
}
