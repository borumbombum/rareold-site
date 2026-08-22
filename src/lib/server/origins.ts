import type { Client } from '@libsql/client';
import { turso } from './turso';

export interface OriginRow {
	id: string;
	name: string;
	flag: string;
	sort_order: number;
	name_es: string | null;
	name_pt: string | null;
	name_en: string | null;
	name_ja: string | null;
	name_fr: string | null;
	product_count?: number;
}

export async function listOrigins(db: Client = turso): Promise<OriginRow[]> {
	const res = await db.execute(`
		SELECT o.id, o.name, o.flag, o.sort_order,
		       o.name_es, o.name_pt, o.name_en, o.name_ja, o.name_fr,
		       COUNT(p.id) AS product_count
		FROM origins o
		LEFT JOIN products p ON p.origin_id = o.id
		GROUP BY o.id
		ORDER BY o.sort_order, o.name COLLATE NOCASE
	`);
	return res.rows.map((r) => ({
		id: String(r.id),
		name: String(r.name),
		flag: String(r.flag ?? '🌍'),
		sort_order: Number(r.sort_order ?? 0),
		name_es: (r.name_es as string | null) ?? null,
		name_pt: (r.name_pt as string | null) ?? null,
		name_en: (r.name_en as string | null) ?? null,
		name_ja: (r.name_ja as string | null) ?? null,
		name_fr: (r.name_fr as string | null) ?? null,
		product_count: Number(r.product_count ?? 0)
	}));
}

export async function getOriginById(id: string, db: Client = turso): Promise<OriginRow | null> {
	const res = await db.execute('SELECT * FROM origins WHERE id = ?', [id]);
	if (res.rows.length === 0) return null;
	const r = res.rows[0];
	return {
		id: String(r.id),
		name: String(r.name),
		flag: String(r.flag ?? '🌍'),
		sort_order: Number(r.sort_order ?? 0),
		name_es: (r.name_es as string | null) ?? null,
		name_pt: (r.name_pt as string | null) ?? null,
		name_en: (r.name_en as string | null) ?? null,
		name_ja: (r.name_ja as string | null) ?? null,
		name_fr: (r.name_fr as string | null) ?? null
	};
}

export interface OriginInput {
	id: string;
	name: string;
	flag?: string | null;
	sort_order?: number;
	name_es?: string | null;
	name_pt?: string | null;
	name_en?: string | null;
	name_ja?: string | null;
	name_fr?: string | null;
}

export async function upsertOrigin(input: OriginInput, db: Client = turso): Promise<void> {
	await db.execute(
		`INSERT INTO origins (id, name, flag, sort_order, name_es, name_pt, name_en, name_ja, name_fr)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			flag = excluded.flag,
			sort_order = excluded.sort_order,
			name_es = excluded.name_es,
			name_pt = excluded.name_pt,
			name_en = excluded.name_en,
			name_ja = excluded.name_ja,
			name_fr = excluded.name_fr`,
		[
			input.id,
			input.name,
			input.flag || '🌍',
			Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order as number) : 0,
			input.name_es || null,
			input.name_pt || null,
			input.name_en || null,
			input.name_ja || null,
			input.name_fr || null
		]
	);
}

/** Delete an origin unless products, distilleries or regions still reference it. */
export async function deleteOrigin(
	id: string,
	db: Client = turso
): Promise<{ ok: true } | { ok: false; reason: 'products' | 'distilleries' | 'regions' }> {
	const counts = await db.execute({
		sql: `SELECT
			(SELECT COUNT(*) FROM products WHERE origin_id = ?1) AS products,
			(SELECT COUNT(*) FROM distilleries WHERE country = ?1) AS distilleries,
			(SELECT COUNT(*) FROM regions WHERE origin_id = ?1) AS regions`,
		args: [id]
	});
	const r = counts.rows[0];
	if (Number(r.products) > 0) return { ok: false, reason: 'products' };
	if (Number(r.distilleries) > 0) return { ok: false, reason: 'distilleries' };
	if (Number(r.regions) > 0) return { ok: false, reason: 'regions' };
	await db.execute('DELETE FROM origins WHERE id = ?', [id]);
	return { ok: true };
}
