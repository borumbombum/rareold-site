import type { Cookies } from '@sveltejs/kit';
import type { Client, InValue } from '@libsql/client';
import { turso } from './turso';
import { getSessionUser } from './session';
import type { UserData } from '$lib/types';

/** Session user with role 'admin', or null. Server-side gate for /admin pages + APIs. */
export async function getAdmin(cookies: Cookies, db: Client = turso): Promise<UserData | null> {
	const user = await getSessionUser(cookies, db);
	if (!user || user.role !== 'admin') return null;
	return user;
}

export interface ProductInput {
	id: string;
	name: string;
	brand: string;
	description: string | null;
	image: string | null;
	video: string | null;
	origin_id: string | null;
	region_id: string | null;
	age: number | null;
	volume: string | null;
	abv: number | null;
	cask: string | null;
	name_pt: string | null;
	description_pt: string | null;
	name_en: string | null;
	description_en: string | null;
	name_ja: string | null;
	description_ja: string | null;
}

const PRODUCT_FIELDS = [
	'id',
	'name',
	'brand',
	'description',
	'image',
	'video',
	'origin_id',
	'region_id',
	'age',
	'volume',
	'abv',
	'cask',
	'name_pt',
	'description_pt',
	'name_en',
	'description_en',
	'name_ja',
	'description_ja'
] as const;

const PRODUCT_COLUMNS = PRODUCT_FIELDS.join(', ');
const PRODUCT_COLUMNS_PREFIXED = PRODUCT_FIELDS.map((c) => `p.${c}`).join(', ');

function rowToProductInput(row: Record<string, unknown>): ProductInput {
	return {
		id: String(row.id),
		name: String(row.name),
		brand: String(row.brand ?? ''),
		description: row.description == null ? null : String(row.description),
		image: row.image == null ? null : String(row.image),
		video: row.video == null ? null : String(row.video),
		origin_id: row.origin_id == null ? null : String(row.origin_id),
		region_id: row.region_id == null ? null : String(row.region_id),
		age: row.age == null ? null : Number(row.age),
		volume: row.volume == null ? null : String(row.volume),
		abv: row.abv == null ? null : Number(row.abv),
		cask: row.cask == null ? null : String(row.cask),
		name_pt: row.name_pt == null ? null : String(row.name_pt),
		description_pt: row.description_pt == null ? null : String(row.description_pt),
		name_en: row.name_en == null ? null : String(row.name_en),
		description_en: row.description_en == null ? null : String(row.description_en),
		name_ja: row.name_ja == null ? null : String(row.name_ja),
		description_ja: row.description_ja == null ? null : String(row.description_ja)
	};
}

export interface AdminProduct extends ProductInput {
	avg_rating: number;
	review_count: number;
}

export async function listProducts(db: Client = turso): Promise<AdminProduct[]> {
	const res = await db.execute(
		`SELECT ${PRODUCT_COLUMNS_PREFIXED}, o.name AS origin_name, r.name AS region_name,
		        COALESCE(pr.avg_rating, 0) AS avg_rating, COALESCE(pr.review_count, 0) AS review_count
		 FROM products p
		 LEFT JOIN origins o ON o.id = p.origin_id
		 LEFT JOIN regions r ON r.id = p.region_id
		 LEFT JOIN product_ratings pr ON pr.product_id = p.id
		 ORDER BY p.name COLLATE NOCASE`
	);
	return res.rows.map((row) => ({
		...rowToProductInput(row),
		avg_rating: Number(row.avg_rating ?? 0),
		review_count: Number(row.review_count ?? 0)
	}));
}

export async function getProduct(id: string, db: Client = turso): Promise<ProductInput | null> {
	const res = await db.execute(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`, [id]);
	const row = res.rows[0];
	return row ? rowToProductInput(row) : null;
}

function productValues(input: ProductInput): (string | number | null)[] {
	return [
		input.id,
		input.name,
		input.brand ?? '',
		input.description,
		input.image,
		input.video,
		input.origin_id,
		input.region_id,
		input.age,
		input.volume,
		input.abv,
		input.cask,
		input.name_pt,
		input.description_pt,
		input.name_en,
		input.description_en,
		input.name_ja,
		input.description_ja
	];
}

export async function createProduct(input: ProductInput, db: Client = turso): Promise<void> {
	const cols = PRODUCT_FIELDS.join(', ');
	const placeholders = PRODUCT_FIELDS.map(() => '?').join(', ');
	const onConflict = PRODUCT_FIELDS.filter((c) => c !== 'id')
		.map((c) => `${c} = excluded.${c}`)
		.join(', ');
	await db.execute(
		`INSERT INTO products (${cols}) VALUES (${placeholders})
		 ON CONFLICT(id) DO UPDATE SET ${onConflict}`,
		productValues(input)
	);
}

export async function updateProduct(id: string, input: ProductInput, db: Client = turso): Promise<void> {
	const updateFields = PRODUCT_FIELDS.filter((c) => c !== 'id');
	const setClauses = updateFields.map((c) => `${c} = ?`).join(', ');
	const values = [
		input.name,
		input.brand ?? '',
		input.description,
		input.image,
		input.video,
		input.origin_id,
		input.region_id,
		input.age,
		input.volume,
		input.abv,
		input.cask,
		input.name_pt,
		input.description_pt,
		input.name_en,
		input.description_en,
		input.name_ja,
		input.description_ja
	];
	await db.execute(`UPDATE products SET ${setClauses} WHERE id = ?`, [...values, id]);
}

export async function deleteProduct(id: string, db: Client = turso): Promise<void> {
	await db.execute('DELETE FROM products WHERE id = ?', [id]);
	await db.execute('DELETE FROM karma WHERE entity_id = ?', [id]);
	await db.execute('DELETE FROM votes WHERE entity_id = ?', [id]);
}

export interface ReviewRow {
	id: string;
	product_id: string;
	product_name: string;
	user_name: string;
	score: number;
	comment: string | null;
	country: string | null;
	created_at: string;
}

export async function listReviews(
	opts: { q?: string; country?: string } = {},
	db: Client = turso
): Promise<ReviewRow[]> {
	let sql = `SELECT r.id, r.product_id, r.user_name, r.score, r.comment, r.country, r.created_at,
	                  COALESCE(p.name, r.product_id) AS product_name
	           FROM reviews r
	           LEFT JOIN products p ON p.id = r.product_id`;
	const where: string[] = [];
	const args: InValue[] = [];
	if (opts.q) {
		where.push('(p.name LIKE ? OR r.comment LIKE ? OR r.user_name LIKE ?)');
		args.push(`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`);
	}
	if (opts.country) {
		where.push('r.country = ?');
		args.push(opts.country);
	}
	if (where.length) sql += ' WHERE ' + where.join(' AND ');
	sql += ' ORDER BY r.created_at DESC';
	const res = await db.execute(sql, args);
	return res.rows.map((row) => ({
		id: String(row.id),
		product_id: String(row.product_id),
		product_name: String(row.product_name),
		user_name: String(row.user_name ?? ''),
		score: Number(row.score ?? 0),
		comment: row.comment == null ? null : String(row.comment),
		country: row.country == null ? null : String(row.country),
		created_at: String(row.created_at)
	}));
}

export async function deleteReview(id: string, db: Client = turso): Promise<void> {
	await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
}

export interface Stats {
	counts: { products: number; users: number; reviews: number; votes: number };
	top: { slug: string; name: string; karma: number; vote_count: number }[];
}

export async function getStats(db: Client = turso): Promise<Stats> {
	const countsRes = await db.execute(
		`SELECT
			(SELECT COUNT(*) FROM products) AS products,
			(SELECT COUNT(*) FROM users) AS users,
			(SELECT COUNT(*) FROM reviews) AS reviews,
			(SELECT COUNT(*) FROM votes) AS votes`
	);
	const c = countsRes.rows[0];
	const topRes = await db.execute(
		`SELECT k.entity_id, COALESCE(p.name, k.entity_id) AS name, k.karma, k.vote_count
		 FROM karma k
		 LEFT JOIN products p ON p.id = k.entity_id
		 WHERE k.karma != 0 OR k.vote_count != 0
		 ORDER BY k.karma DESC, k.vote_count DESC
		 LIMIT 20`
	);
	return {
		counts: {
			products: Number(c.products ?? 0),
			users: Number(c.users ?? 0),
			reviews: Number(c.reviews ?? 0),
			votes: Number(c.votes ?? 0)
		},
		top: topRes.rows.map((row) => ({
			slug: String(row.entity_id),
			name: String(row.name),
			karma: Number(row.karma ?? 0),
			vote_count: Number(row.vote_count ?? 0)
		}))
	};
}

export interface AdminUser {
	id: string;
	email: string;
	name: string;
	avatar: string;
	role: string;
	login_type: string;
	created_at: string;
	last_login: string | null;
}

export async function listUsers(db: Client = turso): Promise<AdminUser[]> {
	const res = await db.execute(
		`SELECT id, email, name, avatar, role, login_type, created_at, last_login
		 FROM users ORDER BY last_login DESC NULLS LAST, name COLLATE NOCASE`
	);
	return res.rows.map((row) => ({
		id: String(row.id),
		email: String(row.email ?? ''),
		name: String(row.name ?? ''),
		avatar: String(row.avatar ?? ''),
		role: String(row.role ?? 'user'),
		login_type: String(row.login_type ?? 'google'),
		created_at: String(row.created_at ?? ''),
		last_login: row.last_login == null ? null : String(row.last_login)
	}));
}

export async function deleteUser(userId: string, db: Client = turso): Promise<void> {
	await db.execute('DELETE FROM users WHERE id = ?', [userId]);
}

export async function setUserRole(
	userId: string,
	role: 'admin' | 'user',
	db: Client = turso
): Promise<void> {
	await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}
