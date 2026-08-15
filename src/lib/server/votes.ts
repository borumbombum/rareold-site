import type { Client } from '@libsql/client';
import { turso } from './turso';
import type { CountryCode, EntityKarma } from '$lib/types';

export interface VoteInput {
	entity_id: string;
	user_id: string;
	country: CountryCode;
	value: number;
}

/** Upsert a user's vote and recompute the entity's karma row. */
export async function applyVote(input: VoteInput, db: Client = turso): Promise<void> {
	const ts = new Date().toISOString();
	await db.execute(
		`INSERT INTO votes (entity_id, user_id, country, value, created_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(entity_id, user_id, country) DO UPDATE SET
			value = excluded.value,
			created_at = excluded.created_at`,
		[input.entity_id, input.user_id, input.country, input.value, ts]
	);
	await db.execute('INSERT INTO karma (entity_id) VALUES (?) ON CONFLICT(entity_id) DO NOTHING', [
		input.entity_id
	]);
	await db.execute(
		`UPDATE karma SET
			karma = (SELECT COALESCE(SUM(value), 0) FROM votes WHERE entity_id = ?),
			vote_count = (SELECT COUNT(*) FROM votes WHERE entity_id = ?),
			updated_at = ?
		 WHERE entity_id = ?`,
		[input.entity_id, input.entity_id, ts, input.entity_id]
	);
}

/** Karma for a set of entity ids, ranked best-first. */
export async function getKarmaMap(
	slugs: string[],
	db: Client = turso
): Promise<Map<string, EntityKarma>> {
	const unique = [...new Set(slugs)].filter(Boolean);
	if (unique.length === 0) return new Map();
	const placeholders = unique.map(() => '?').join(', ');
	const res = await db.execute(
		`SELECT entity_id, karma, vote_count FROM karma WHERE entity_id IN (${placeholders})`,
		unique
	);
	const entries: EntityKarma[] = res.rows.map((row) => ({
		entity_id: String(row.entity_id),
		karma: Number(row.karma ?? 0),
		vote_count: Number(row.vote_count ?? 0),
		rank: 0
	}));
	entries.sort((a, b) => b.karma - a.karma || a.entity_id.localeCompare(b.entity_id));
	entries.forEach((e, i) => {
		e.rank = i + 1;
	});
	return new Map(entries.map((e) => [e.entity_id, e]));
}
