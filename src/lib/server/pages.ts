import type { Client } from '@libsql/client';
import { turso } from './turso';

export interface PageRow {
	id: string;
	slug: string;
	title: string;
	body: string;
	title_pt: string | null;
	body_pt: string | null;
	title_en: string | null;
	body_en: string | null;
	title_ja: string | null;
	body_ja: string | null;
	created_at: string;
	updated_at: string;
}

export async function listPages(db: Client = turso): Promise<PageRow[]> {
	const res = await db.execute('SELECT * FROM pages ORDER BY updated_at DESC');
	return res.rows.map((r) => ({
		id: String(r.id),
		slug: String(r.slug),
		title: String(r.title ?? ''),
		body: String(r.body ?? ''),
		title_pt: r.title_pt as string | null,
		body_pt: r.body_pt as string | null,
		title_en: r.title_en as string | null,
		body_en: r.body_en as string | null,
		title_ja: r.title_ja as string | null,
		body_ja: r.body_ja as string | null,
		created_at: String(r.created_at ?? ''),
		updated_at: String(r.updated_at ?? '')
	}));
}

export async function getPageBySlug(slug: string, db: Client = turso): Promise<PageRow | null> {
	const res = await db.execute('SELECT * FROM pages WHERE slug = ?', [slug]);
	if (res.rows.length === 0) return null;
	const r = res.rows[0];
	return {
		id: String(r.id),
		slug: String(r.slug),
		title: String(r.title ?? ''),
		body: String(r.body ?? ''),
		title_pt: r.title_pt as string | null,
		body_pt: r.body_pt as string | null,
		title_en: r.title_en as string | null,
		body_en: r.body_en as string | null,
		title_ja: r.title_ja as string | null,
		body_ja: r.body_ja as string | null,
		created_at: String(r.created_at ?? ''),
		updated_at: String(r.updated_at ?? '')
	};
}

export interface PageInput {
	id: string;
	slug: string;
	title: string;
	body: string;
	title_pt?: string | null;
	body_pt?: string | null;
	title_en?: string | null;
	body_en?: string | null;
	title_ja?: string | null;
	body_ja?: string | null;
}

export async function upsertPage(input: PageInput, db: Client = turso): Promise<void> {
	const ts = new Date().toISOString();
	await db.execute(
		`INSERT INTO pages (id, slug, title, body, title_pt, body_pt, title_en, body_en, title_ja, body_ja, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			slug = excluded.slug,
			title = excluded.title,
			body = excluded.body,
			title_pt = excluded.title_pt,
			body_pt = excluded.body_pt,
			title_en = excluded.title_en,
			body_en = excluded.body_en,
			title_ja = excluded.title_ja,
			body_ja = excluded.body_ja,
			updated_at = excluded.updated_at`,
		[
			input.id,
			input.slug,
			input.title,
			input.body,
			input.title_pt ?? null,
			input.body_pt ?? null,
			input.title_en ?? null,
			input.body_en ?? null,
			input.title_ja ?? null,
			input.body_ja ?? null,
			ts,
			ts
		]
	);
}

export async function deletePage(id: string, db: Client = turso): Promise<void> {
	await db.execute('DELETE FROM pages WHERE id = ?', [id]);
}
