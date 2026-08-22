import { createRequire } from 'node:module';
import { turso } from './turso';

/** Public content tables included in the paid dump. PII tables (users, sessions,
 *  votes, reviews, favorites, download_requests) are intentionally excluded. */
export const DUMP_TABLES = [
	'origins',
	'regions',
	'distilleries',
	'products',
	'influencer_videos',
	'resellers',
	'pages'
] as const;

interface CacheEntry {
	buffer: Uint8Array;
	builtAt: number;
}

const CACHE_TTL_MS = 6 * 3600 * 1000;
let cache: CacheEntry | null = null;
let inflight: Promise<Uint8Array> | null = null;

async function initSql(): Promise<import('sql.js').SqlJsStatic> {
	const initSqlJs = (await import('sql.js')).default;
	try {
		const require_ = createRequire(import.meta.url);
		const wasmPath = require_.resolve('sql.js/dist/sql-wasm.wasm');
		return await initSqlJs({ locateFile: () => wasmPath });
	} catch {
		return await initSqlJs();
	}
}

export async function buildSqliteDump(db: typeof turso = turso): Promise<Uint8Array> {
	if (cache && Date.now() - cache.builtAt < CACHE_TTL_MS) return cache.buffer;
	if (inflight) return inflight;

	inflight = (async () => {
		const SQL = await initSql();
		const sqlite = new SQL.Database();

		for (const table of DUMP_TABLES) {
			const ddl = await db.execute({
				sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
				args: [table]
			});
			if (ddl.rows.length === 0) continue;
			sqlite.run(String(ddl.rows[0].sql));

			const rows = await db.execute({ sql: `SELECT * FROM "${table}"`, args: [] });
			if (rows.rows.length === 0) continue;
			const cols = rows.columns;
			const placeholders = cols.map(() => '?').join(',');
			const insert = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${placeholders})`;
			sqlite.run('BEGIN');
			for (const row of rows.rows) {
				sqlite.run(
					insert,
					cols.map((c) => {
						const v = row[c];
						if (v === null || v === undefined) return null;
						if (typeof v === 'bigint') return Number(v);
						return v as string | number | Uint8Array;
					})
				);
			}
			sqlite.run('COMMIT');
		}

		const buffer = sqlite.export();
		sqlite.close();
		cache = { buffer, builtAt: Date.now() };
		return buffer;
	})();

	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}
