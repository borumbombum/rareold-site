import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
	console.error('[delete] Missing TURSO_URL/TURSO_AUTH_TOKEN — aborting.');
	process.exit(1);
}

const client = createClient({ url, authToken });
const TARGETS = ['smogen-primor', 'the-lakes-whiskymakers-reserve-no-1'];

for (const id of TARGETS) {
	const { rows } = await client.execute('SELECT COUNT(*) AS n FROM influencer_videos WHERE product_id = ?', [id]);
	console.log(`[delete] influencer_videos ${id}: ${rows[0].n} row(s) found`);
}

const delVideos = await client.execute(
	'DELETE FROM influencer_videos WHERE product_id IN (?, ?)',
	TARGETS
);
console.log(`[delete] deleted ${delVideos.rowsAffected} influencer_videos row(s)`);

const delWhiskies = await client.execute('DELETE FROM products WHERE id IN (?, ?)', TARGETS);
console.log(`[delete] deleted ${delWhiskies.rowsAffected} products row(s)`);

const orphanCheck = await client.execute(
	'SELECT COUNT(*) AS n FROM products WHERE distillery_id = ?',
	['smogen']
);
console.log(`[delete] products still referencing distillery 'smogen': ${orphanCheck.rows[0].n}`);

const delDist = await client.execute(
	"DELETE FROM distilleries WHERE id = 'smogen' AND NOT EXISTS (SELECT 1 FROM products WHERE distillery_id = 'smogen')"
);
console.log(`[delete] deleted ${delDist.rowsAffected} orphan distillery row(s) (slug=smogen)`);

const after = await client.execute('SELECT COUNT(*) AS n FROM products');
console.log(`[delete] whiskies remaining in Turso: ${after.rows[0].n}`);

client.close();