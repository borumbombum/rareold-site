import type { ProductVideo } from '$lib/types';

/** Max videos shown per product (desktop row fits 4). */
export const MAX_VIDEOS = 4;

/**
 * Videos for a product in the given language. If the language has fewer than
 * MAX_VIDEOS entries, English videos top up the list (deduplicated by URL).
 * Works on build-time JSON (`whisky.videos`) and DB rows alike.
 */
export function videosForLocale(
	all: ProductVideo[] | undefined | null,
	language: string
): ProductVideo[] {
	if (!all?.length) return [];
	const own = all.filter((v) => v.language === language);
	if (own.length >= MAX_VIDEOS) return own.slice(0, MAX_VIDEOS);
	const seen = new Set(own.map((v) => v.url));
	const filled = [...own];
	if (language !== 'en') {
		for (const v of all) {
			if (filled.length >= MAX_VIDEOS) break;
			if (v.language !== 'en' || seen.has(v.url)) continue;
			seen.add(v.url);
			filled.push(v);
		}
	}
	return filled;
}
