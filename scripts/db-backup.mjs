import { createClient } from '@libsql/client';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP_DIR = resolve(ROOT, 'db', 'backup');

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
	console.warn('[db-backup] WARNING: TURSO_URL or TURSO_AUTH_TOKEN is missing. Set both variables (see .env.example).');
	process.exit(1);
}

const args = process.argv.slice(2);
const restoreIdx = args.indexOf('--restore');
const client = createClient({ url, authToken });

function sqlValue(v) {
	if (v === null || v === undefined) return 'NULL';
	if (typeof v === 'number') return String(v);
	if (typeof v === 'bigint') return String(v);
	return `'${String(v).replace(/'/g, "''")}'`;
}

function tableNameOf(row) {
	return row.name;
}

async function dump() {
	const tablesRes = await client.execute(
		`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
	);
	const tables = tablesRes.rows.map(tableNameOf);

	let ddl = '';
	for (const t of tables) {
		const s = await client.execute(`SELECT sql FROM sqlite_master WHERE type IN ('table','index') AND tbl_name = ?`, [t]);
		for (const row of s.rows) {
			if (row.sql) ddl += `${row.sql};\n`;
		}
	}

	const lines = [`-- Old Rare Turso backup`, `-- Generated: ${new Date().toISOString()}`, `-- Tables: ${tables.join(', ')}`, '', ddl, ''];
	const counts = {};

	for (const t of tables) {
		const res = await client.execute(`SELECT * FROM ${t}`);
		counts[t] = res.rows.length;
		for (const r of res.rows) {
			const keys = Object.keys(r);
			const values = keys.map((k) => sqlValue(r[k])).join(', ');
			lines.push(`INSERT INTO ${t} (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${values});`);
		}
		lines.push('');
	}

	await mkdir(BACKUP_DIR, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '');
	const file = resolve(BACKUP_DIR, `backup-${stamp}.sql`);
	const body = lines.join('\n');
	await writeFile(file, body);
	console.log(`[db-backup] Wrote ${(body.length / 1024).toFixed(1)} KB -> ${file}`);
	console.log(`[db-backup] Row counts:`);
	for (const [t, n] of Object.entries(counts)) console.log(`  ${t}: ${n}`);
}

async function restore(file) {
	const sql = await readFile(file, 'utf8');
	const statements = sql
		.split(/\n(?=CREATE|INSERT)/g)
		.map((s) => s.trim())
		.filter(Boolean);
	let ok = 0;
	let failed = 0;
	for (const stmt of statements) {
		try {
			await client.executeMultiple(stmt);
			ok++;
		} catch (err) {
			failed++;
			console.error(`[db-backup] FAILED statement:\n${stmt.slice(0, 200)}...\n  ${err.message}`);
		}
	}
	console.log(`[db-backup] Restored from ${file}: ${ok} ok, ${failed} failed`);
}

if (restoreIdx !== -1) {
	const file = args[restoreIdx + 1];
	if (!file) {
		console.error('Usage: node scripts/db-backup.mjs --restore <file.sql>');
		process.exit(1);
	}
	await restore(resolve(ROOT, file));
} else {
	await dump();
}