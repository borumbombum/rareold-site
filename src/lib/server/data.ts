import { invalidateCache } from './cache';
import { getKarmaMap as dbGetKarmaMap } from './votes';
import { listReviews as dbListReviews } from './reviews';
import { listProductVideos as dbListProductVideos } from './videos';
import { cached } from './cache';
import { WHISKIES, getWhiskyBySlug } from '$lib/data/whiskies';
import type { EntityKarma, ProductVideo, Review, SiteContext, Whisky } from '$lib/types';

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

/** Votes/karma for a set of entity slugs, read live from Turso. Cached ~60s. */
export async function getKarmaMap(slugs: string[]): Promise<Map<string, EntityKarma>> {
	const unique = [...new Set(slugs)].filter(Boolean);
	if (unique.length === 0) return new Map();
	return cached('karma', 60_000, () => dbGetKarmaMap(unique));
}

export function invalidateKarma(): void {
	invalidateCache('karma');
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

/** Product videos (sommelier country-specific). Cached ~5min. */
export async function getProductVideos(productId: string): Promise<ProductVideo[]> {
	return cached(`videos:${productId}`, 300_000, () => dbListProductVideos(productId));
}

export function invalidateProductVideos(productId: string): void {
	invalidateCache(`videos:${productId}`);
}

/** No online prices are published — always empty. */
export async function getFreshPrices(site: SiteContext): Promise<PriceEntry[]> {
	return [];
}
