import type { Client } from '@libsql/client';
import { turso } from './turso';
import { videosForLocale } from '$lib/utils/videos';
import type { ProductVideo } from '$lib/types';

function toVideo(r: Record<string, unknown>): ProductVideo {
	return {
		language: String(r.language),
		platform: (String(r.platform ?? 'youtube') === 'instagram' ? 'instagram' : 'youtube'),
		url: String(r.url),
		label: String(r.label ?? '')
	};
}

async function fetchAll(productId: string, db: Client): Promise<ProductVideo[]> {
	const res = await db.execute(
		'SELECT language, platform, url, label FROM influencer_videos WHERE product_id = ? ORDER BY language, created_at, id',
		[productId]
	);
	return res.rows.map(toVideo);
}

/** Raw list of every video for a product across all languages (admin). */
export async function listProductInfluencerVideos(
	productId: string,
	db: Client = turso
): Promise<ProductVideo[]> {
	return fetchAll(productId, db);
}

/**
 * Videos for a product in the given language. If the language has fewer than
 * MAX_VIDEOS entries, English videos top up the list (deduplicated by URL).
 */
export async function listInfluencerVideos(
	productId: string,
	language: string,
	db: Client = turso
): Promise<ProductVideo[]> {
	return videosForLocale(await fetchAll(productId, db), language);
}

export async function addInfluencerVideo(
	productId: string,
	language: string,
	platform: 'youtube' | 'instagram',
	url: string,
	label: string,
	db: Client = turso
): Promise<void> {
	await db.execute(
		'INSERT OR IGNORE INTO influencer_videos (product_id, language, platform, url, label) VALUES (?, ?, ?, ?, ?)',
		[productId, language, platform, url, label]
	);
}

export async function deleteInfluencerVideo(
	productId: string,
	language: string,
	url: string,
	db: Client = turso
): Promise<void> {
	await db.execute('DELETE FROM influencer_videos WHERE product_id = ? AND language = ? AND url = ?', [
		productId,
		language,
		url
	]);
}
