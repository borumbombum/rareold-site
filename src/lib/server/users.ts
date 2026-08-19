import type { Client } from '@libsql/client';
import { turso } from './turso';
import type { UserData } from '$lib/types';

export interface GoogleClaims {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
	login_type?: string;
	role?: string;
}

export async function getUserById(id: string, db: Client = turso): Promise<UserData | null> {
	const res = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
	const row = res.rows[0];
	if (!row) return null;
	return rowToUser(row);
}

export async function upsertUser(claims: GoogleClaims, db: Client = turso): Promise<UserData> {
	const loginType = claims.login_type ?? 'google';
	const role = claims.role ?? 'user';
	await db.execute(
		`INSERT INTO users (id, email, name, avatar, login_type, role, last_login)
		 VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
		 ON CONFLICT(id) DO UPDATE SET
			email = excluded.email,
			name = excluded.name,
			avatar = excluded.avatar,
			role = excluded.role,
			last_login = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
			updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
		[claims.sub, claims.email, claims.name ?? '', claims.picture ?? '', loginType, role]
	);
	const user = await getUserById(claims.sub, db);
	if (!user) throw new Error('user upsert failed');
	return user;
}

function rowToUser(row: Record<string, unknown>): UserData {
	return {
		id: String(row.id),
		email: String(row.email),
		name: String(row.name ?? ''),
		avatar: String(row.avatar ?? ''),
		role: String(row.role ?? 'user'),
		login_type: String(row.login_type ?? 'google')
	};
}
