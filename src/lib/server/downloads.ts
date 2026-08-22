import { createHash, randomBytes } from 'node:crypto';
import type { Client, ResultSet } from '@libsql/client';
import { turso } from './turso';

export interface DownloadRequestRow {
	id: string;
	email: string;
	status: 'pending' | 'granted' | 'downloaded';
	token_hash: string | null;
	expires_at: string | null;
	used_at: string | null;
	created_at: string;
	updated_at: string;
}

export const DEFAULT_TTL_HOURS = 1;

function mapRows(res: ResultSet): DownloadRequestRow[] {
	return res.rows.map((r) => ({
		id: String(r.id),
		email: String(r.email),
		status: r.status as DownloadRequestRow['status'],
		token_hash: (r.token_hash as string | null) ?? null,
		expires_at: (r.expires_at as string | null) ?? null,
		used_at: (r.used_at as string | null) ?? null,
		created_at: String(r.created_at ?? ''),
		updated_at: String(r.updated_at ?? '')
	}));
}

export async function createDownloadRequest(email: string, db: Client = turso): Promise<DownloadRequestRow> {
	const normalized = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('invalid_email');
	// one live row per email: re-requesting refreshes updated_at instead of duplicating
	const existing = await db.execute({
		sql: "SELECT * FROM download_requests WHERE email = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
		args: [normalized]
	});
	if (existing.rows.length > 0) {
		await db.execute({
			sql: "UPDATE download_requests SET updated_at = datetime('now') WHERE id = ?",
			args: [String(existing.rows[0].id)]
		});
		return mapRows(existing)[0];
	}
	const id = crypto.randomUUID();
	await db.execute({
		sql: "INSERT INTO download_requests (id, email, status) VALUES (?, ?, 'pending')",
		args: [id, normalized]
	});
	const created = await db.execute({ sql: 'SELECT * FROM download_requests WHERE id = ?', args: [id] });
	return mapRows(created)[0];
}

export async function listDownloadRequests(db: Client = turso): Promise<DownloadRequestRow[]> {
	const res = await db.execute('SELECT * FROM download_requests ORDER BY created_at DESC LIMIT 200');
	return mapRows(res);
}

export interface GrantResult {
	id: string;
	email: string;
	token: string;
	expiresAt: string;
}

export async function grantDownload(id: string, hours = DEFAULT_TTL_HOURS, db: Client = turso): Promise<GrantResult> {
	const ttlHours = Math.min(Math.max(Number(hours) || DEFAULT_TTL_HOURS, 0.25), 168);
	const token = randomBytes(32).toString('base64url');
	const tokenHash = createHash('sha256').update(token).digest('hex');
	const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
	const res = await db.execute({
		sql: "UPDATE download_requests SET status = 'granted', token_hash = ?, expires_at = ?, used_at = NULL, updated_at = datetime('now') WHERE id = ? RETURNING email",
		args: [tokenHash, expiresAt, id]
	});
	if (res.rows.length === 0) throw new Error('not_found');
	return { id, email: String(res.rows[0].email), token, expiresAt };
}

export type ConsumeResult =
	| { ok: true; email: string }
	| { ok: false; reason: 'invalid' | 'expired' | 'used' };

export async function consumeDownloadToken(token: string, db: Client = turso): Promise<ConsumeResult> {
	const tokenHash = createHash('sha256').update(token).digest('hex');
	const res = await db.execute({
		sql: 'SELECT id, email, expires_at, used_at FROM download_requests WHERE token_hash = ?',
		args: [tokenHash]
	});
	if (res.rows.length === 0) return { ok: false, reason: 'invalid' };
	const row = res.rows[0];
	if (row.used_at !== null) return { ok: false, reason: 'used' };
	if (row.expires_at === null || new Date(String(row.expires_at)).getTime() < Date.now()) {
		return { ok: false, reason: 'expired' };
	}
	await db.execute({
		sql: "UPDATE download_requests SET status = 'downloaded', used_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
		args: [String(row.id)]
	});
	return { ok: true, email: String(row.email) };
}
