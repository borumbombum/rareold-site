import type { Client } from '@libsql/client';
import { turso } from './turso';
import type { CountryCode, ProductVideo } from '$lib/types';

export async function listProductVideos(productId: string, db: Client = turso): Promise<ProductVideo[]> {
	const res = await db.execute(
		'SELECT country, url, label FROM product_videos WHERE product_id = ? ORDER BY country, created_at DESC',
		[productId]
	);
	return res.rows.map((r) => ({
		country: String(r.country) as CountryCode,
		url: String(r.url),
		label: String(r.label ?? '')
	}));
}

export async function addProductVideo(
	productId: string,
	country: CountryCode,
	url: string,
	label: string,
	db: Client = turso
): Promise<void> {
	await db.execute(
		'INSERT OR IGNORE INTO product_videos (product_id, country, url, label) VALUES (?, ?, ?, ?)',
		[productId, country, url, label]
	);
}

export async function deleteProductVideo(
	productId: string,
	country: CountryCode,
	url: string,
	db: Client = turso
): Promise<void> {
	await db.execute('DELETE FROM product_videos WHERE product_id = ? AND country = ? AND url = ?', [
		productId,
		country,
		url
	]);
}
