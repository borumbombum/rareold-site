import type { Client } from '@libsql/client';
import { turso } from './turso';

/** A user's saved product ids (catalog slugs), most recently saved first. */
export async function listFavoriteIds(userId: string, db: Client = turso): Promise<string[]> {
	const res = await db.execute(
		'SELECT product_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, product_id',
		[userId]
	);
	return res.rows.map((row) => String(row.product_id));
}

/** Add or remove a favorite. Idempotent. */
export async function toggleFavorite(
	userId: string,
	productId: string,
	on: boolean,
	db: Client = turso
): Promise<void> {
	if (on) {
		await db.execute(
			'INSERT INTO favorites (user_id, product_id) VALUES (?, ?) ON CONFLICT(user_id, product_id) DO NOTHING',
			[userId, productId]
		);
	} else {
		await db.execute('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [
			userId,
			productId
		]);
	}
}
