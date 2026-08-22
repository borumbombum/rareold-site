import { describe, expect, it } from 'vitest';
import { createTestDb } from './helpers/db';
import { buildSqliteDump, DUMP_TABLES } from '$lib/server/dbfile';

describe('sqlite dump builder (044)', () => {
	it('produces a valid SQLite file with all content tables', async () => {
		const db = await createTestDb();
		await db.execute(
			"INSERT INTO origins (id, name, sort_order) VALUES ('scotland', 'Scotland', 1)"
		);
		await db.execute(
			"INSERT INTO pages (id, slug, title, body, title_en, body_en) VALUES ('p1', 'about', 'Acerca', '<p>hola</p>', 'About', '<p>hello</p>')"
		);

		const buf = await buildSqliteDump(db);
		expect(Buffer.from(buf.slice(0, 16)).toString('utf8')).toBe('SQLite format 3\x00');

		const initSqlJs = (await import('sql.js')).default;
		const SQL = await initSqlJs();
		const sqlite = new SQL.Database(buf);
		for (const t of DUMP_TABLES) {
			const r = sqlite.exec(`SELECT COUNT(*) FROM "${t}"`);
			expect(r[0].values[0][0]).toBe(t === 'origins' ? 1 : t === 'pages' ? 1 : 0);
		}
		const about = sqlite.exec("SELECT title_en, body_en FROM pages WHERE slug = 'about'");
		expect(about[0].values[0]).toEqual(['About', '<p>hello</p>']);
		sqlite.close();

		// second call within TTL returns the cached buffer
		const again = await buildSqliteDump(db);
		expect(again).toBe(buf);
	}, 30_000);
});
