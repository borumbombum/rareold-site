import type { Client } from '@libsql/client';
import { turso } from './turso';

/** A user's followed distillery ids, most recently followed first. */
export async function listFollowedDistilleryIds(userId: string, db: Client = turso): Promise<string[]> {
	const res = await db.execute(
		'SELECT distillery_id FROM distillery_followers WHERE user_id = ? ORDER BY created_at DESC, distillery_id',
		[userId]
	);
	return res.rows.map((row) => String(row.distillery_id));
}

/** Add or remove a follow. Idempotent. */
export async function toggleDistilleryFollow(
	userId: string,
	distilleryId: string,
	on: boolean,
	db: Client = turso
): Promise<void> {
	if (on) {
		await db.execute(
			'INSERT INTO distillery_followers (user_id, distillery_id) VALUES (?, ?) ON CONFLICT(user_id, distillery_id) DO NOTHING',
			[userId, distilleryId]
		);
	} else {
		await db.execute('DELETE FROM distillery_followers WHERE user_id = ? AND distillery_id = ?', [
			userId,
			distilleryId
		]);
	}
}
