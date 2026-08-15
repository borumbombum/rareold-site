import { createClient, type Client } from '@libsql/client';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations', import.meta.url));

/** Fresh in-memory Turso-compatible DB with all migrations applied. */
export async function createTestDb(): Promise<Client> {
	const client = createClient({ url: 'file::memory:' });
	await client.execute('PRAGMA foreign_keys = OFF');
	const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
	for (const file of files) {
		const sql = await readFile(resolve(MIGRATIONS_DIR, file), 'utf8');
		await client.executeMultiple(sql);
	}
	return client;
}
