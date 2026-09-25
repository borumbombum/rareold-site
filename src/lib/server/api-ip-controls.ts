import type { Client } from '@libsql/client';
import { turso } from './turso';

/** Per-IP control for the public API (Turso `api_ip_controls`). */
export interface ApiIpControlRow {
	ip: string;
	blocked: boolean;
	limit_per_min: number | null;
	reason: string | null;
	created_at: string;
}

export interface ApiIpControlInput {
	ip: string;
	blocked?: boolean;
	limit_per_min?: number | null;
	reason?: string | null;
}

export async function listApiIpControls(db: Client = turso): Promise<ApiIpControlRow[]> {
	const res = await db.execute(
		'SELECT ip, blocked, limit_per_min, reason, created_at FROM api_ip_controls ORDER BY created_at DESC, ip'
	);
	return res.rows.map((r) => ({
		ip: String(r.ip),
		blocked: Number(r.blocked ?? 0) === 1,
		limit_per_min: r.limit_per_min == null ? null : Number(r.limit_per_min),
		reason: (r.reason as string | null) ?? null,
		created_at: String(r.created_at ?? '')
	}));
}

export async function upsertApiIpControl(input: ApiIpControlInput, db: Client = turso): Promise<void> {
	const ip = input.ip.trim();
	const limit =
		Number.isFinite(input.limit_per_min as number) && Number(input.limit_per_min) > 0
			? Math.trunc(Number(input.limit_per_min))
			: null;
	await db.execute(
		`INSERT INTO api_ip_controls (ip, blocked, limit_per_min, reason)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(ip) DO UPDATE SET
			blocked = excluded.blocked,
			limit_per_min = excluded.limit_per_min,
			reason = excluded.reason`,
		[ip, input.blocked === false ? 0 : 1, limit, (input.reason ?? '').trim() || null]
	);
}

export async function deleteApiIpControl(ip: string, db: Client = turso): Promise<void> {
	await db.execute('DELETE FROM api_ip_controls WHERE ip = ?', [ip.trim()]);
}