import { randomUUID } from 'node:crypto';
import type { Client } from '@libsql/client';
import { turso } from './turso';
import type { CountryCode, EntityRating, Review } from '$lib/types';

export interface NewReview {
	product_id: string;
	user_id: string;
	user_name: string;
	score: number;
	comment?: string;
	country: CountryCode;
	image?: { data: Buffer; type: string } | null;
	lat?: number | null;
	lng?: number | null;
}

const REVIEW_SELECT = `r.id, r.product_id, r.user_id, u.name AS user_name, u.avatar AS user_avatar,
		       r.score, r.comment, r.country, r.created_at,
		       (r.image IS NOT NULL) AS has_image, r.lat, r.lng`;

export async function listReviews(
	productId: string,
	country?: string,
	db: Client = turso
): Promise<Review[]> {
	const res = await db.execute(
		`SELECT ${REVIEW_SELECT}
		 FROM reviews r
		 LEFT JOIN users u ON u.id = r.user_id
		 WHERE r.product_id = ? AND (? IS NULL OR r.country = ?)
		 ORDER BY r.created_at DESC`,
		[productId, country ?? null, country ?? null]
	);
	return res.rows.map(rowToReview);
}

/** Upsert a review (one per user per product). Returns the saved review. */
export async function insertReview(
	input: NewReview,
	db: Client = turso
): Promise<Review> {
	const id = randomUUID();
	const createdAt = new Date().toISOString();
	await db.execute(
		`INSERT INTO reviews (id, product_id, user_id, user_name, score, comment, country, created_at, image, image_type, lat, lng)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(product_id, user_id) DO UPDATE SET
			score = excluded.score,
			comment = excluded.comment,
			created_at = excluded.created_at,
			image = COALESCE(excluded.image, reviews.image),
			image_type = COALESCE(excluded.image_type, reviews.image_type),
			lat = COALESCE(excluded.lat, reviews.lat),
			lng = COALESCE(excluded.lng, reviews.lng)`,
		[
			id,
			input.product_id,
			input.user_id,
			input.user_name,
			input.score,
			input.comment ?? null,
			input.country,
			createdAt,
			input.image?.data ?? null,
			input.image?.type ?? null,
			input.lat ?? null,
			input.lng ?? null
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

/** Fetch the stored photo bytes for a review (null when it has none). */
export async function getReviewImage(
	id: string,
	db: Client = turso
): Promise<{ data: Buffer; type: string } | null> {
	const res = await db.execute('SELECT image, image_type FROM reviews WHERE id = ?', [id]);
	const row = res.rows[0];
	if (!row || row.image == null) return null;
	const bytes = row.image instanceof Uint8Array ? row.image : new Uint8Array(row.image as ArrayBuffer);
	return {
		data: Buffer.from(bytes),
		type: row.image_type != null ? String(row.image_type) : 'image/jpeg'
	};
}

/** Get average rating and review count for a set of product IDs. */
export async function getRatingMap(
	productIds: string[],
	db: Client = turso
): Promise<Map<string, EntityRating>> {
	const unique = [...new Set(productIds)].filter(Boolean);
	if (unique.length === 0) return new Map();
	const placeholders = unique.map(() => '?').join(', ');
	const res = await db.execute(
		`SELECT product_id, avg_rating, review_count FROM product_ratings
		 WHERE product_id IN (${placeholders})`,
		unique
	);
	const entries: EntityRating[] = res.rows.map((row, i) => ({
		entity_id: String(row.product_id),
		rank: i + 1,
		avg_rating: Number(row.avg_rating ?? 0),
		review_count: Number(row.review_count ?? 0)
	}));
	entries.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count || a.entity_id.localeCompare(b.entity_id));
	entries.forEach((e, i) => {
		e.rank = i + 1;
	});
	return new Map(entries.map((e) => [e.entity_id, e]));
}

/** Get product_ids the user has reviewed. */
export async function getUserReviewedSlugs(
	userId: string,
	slugs?: string[],
	db: Client = turso
): Promise<string[]> {
	let query = 'SELECT DISTINCT product_id FROM reviews WHERE user_id = ?';
	const params: (string | number)[] = [userId];
	if (slugs && slugs.length > 0) {
		const unique = [...new Set(slugs)].filter(Boolean);
		const placeholders = unique.map(() => '?').join(', ');
		query += ` AND product_id IN (${placeholders})`;
		params.push(...unique);
	}
	const res = await db.execute(query, params);
	return res.rows.map((r) => String(r.product_id));
}

function rowToReview(row: Record<string, unknown>): Review {
	const hasImage = Number(row.has_image ?? 0) === 1;
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
		is_verified_purchase: false,
		...(hasImage ? { image_url: `/api/reviews/${String(row.id)}/image` } : {}),
		...(row.lat != null ? { lat: Number(row.lat) } : {}),
		...(row.lng != null ? { lng: Number(row.lng) } : {})
	};
}

/** Latest reviews that have actual comments, most recent first. */
export async function getLatestReviews(
	limit: number,
	db: Client = turso
): Promise<Review[]> {
	const res = await db.execute(
		`SELECT ${REVIEW_SELECT}
		 FROM reviews r
		 LEFT JOIN users u ON u.id = r.user_id
		 WHERE r.comment IS NOT NULL AND r.comment != ''
		 ORDER BY r.created_at DESC
		 LIMIT ?`,
		[limit]
	);
	return res.rows.map(rowToReview);
}

/** A user's own reviews (any rating), most recent first. */
export async function getUserReviews(
	userId: string,
	limit = 20,
	db: Client = turso
): Promise<Review[]> {
	const res = await db.execute(
		`SELECT ${REVIEW_SELECT}
		 FROM reviews r
		 LEFT JOIN users u ON u.id = r.user_id
		 WHERE r.user_id = ?
		 ORDER BY r.created_at DESC
		 LIMIT ?`,
		[userId, limit]
	);
	return res.rows.map(rowToReview);
}
