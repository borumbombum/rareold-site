import { randomUUID } from 'node:crypto';
import type { Client } from '@libsql/client';
import { turso } from './turso';
import type { CountryCode, Review } from '$lib/types';

export interface NewReview {
	product_id: string;
	user_id: string;
	user_name: string;
	score: number;
	comment?: string;
	country: CountryCode;
}

export async function listReviews(
	productId: string,
	country?: string,
	db: Client = turso
): Promise<Review[]> {
	const res = await db.execute(
		`SELECT r.id, r.product_id, r.user_id, u.name AS user_name, u.avatar AS user_avatar,
		        r.score, r.comment, r.country, r.created_at
		 FROM reviews r
		 LEFT JOIN users u ON u.id = r.user_id
		 WHERE r.product_id = ? AND (? IS NULL OR r.country = ?)
		 ORDER BY r.created_at DESC`,
		[productId, country ?? null, country ?? null]
	);
	return res.rows.map(rowToReview);
}

export async function insertReview(
	input: NewReview,
	db: Client = turso
): Promise<Review> {
	const id = randomUUID();
	const createdAt = new Date().toISOString();
	await db.execute(
		`INSERT INTO reviews (id, product_id, user_id, user_name, score, comment, country, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			input.product_id,
			input.user_id,
			input.user_name,
			input.score,
			input.comment ?? null,
			input.country,
			createdAt
		]
	);
	return {
		id,
		product_id: input.product_id,
		user_id: input.user_id,
		user_name: input.user_name,
		score: input.score,
		comment: input.comment ?? null,
		country: input.country,
		created_at: createdAt,
		is_verified_purchase: false
	};
}

function rowToReview(row: Record<string, unknown>): Review {
	return {
		id: String(row.id),
		product_id: String(row.product_id),
		...(row.user_id ? { user_id: String(row.user_id) } : {}),
		...(row.user_name ? { user_name: String(row.user_name) } : {}),
		...(row.user_avatar ? { user_avatar: String(row.user_avatar) } : {}),
		score: Number(row.score),
		comment: row.comment != null ? String(row.comment) : null,
		country: String(row.country) as CountryCode,
		created_at: String(row.created_at),
		is_verified_purchase: false
	};
}
