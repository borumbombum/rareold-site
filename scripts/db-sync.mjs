import { createClient } from '@libsql/client';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = resolve(ROOT, 'data/seed');
const MIGRATIONS_DIR = resolve(ROOT, 'db/migrations');

const ORIGIN_META = {
	scotland: { name: 'Scotland', name_es: 'Escocia', name_pt: 'Escócia', name_ja: 'スコットランド', name_fr: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
	ireland: { name: 'Ireland', name_es: 'Irlanda', name_pt: 'Irlanda', name_ja: 'アイルランド', name_fr: 'Irlande', flag: '🇮🇪' },
	usa: { name: 'USA', name_es: 'EE. UU.', name_pt: 'EUA', name_ja: 'アメリカ', name_fr: 'États-Unis', flag: '🇺🇸' },
	japan: { name: 'Japan', name_es: 'Japón', name_pt: 'Japão', name_ja: '日本', name_fr: 'Japon', flag: '🇯🇵' },
	india: { name: 'India', name_es: 'India', name_pt: 'Índia', name_ja: 'インド', name_fr: 'Inde', flag: '🇮🇳' },
	canada: { name: 'Canada', name_es: 'Canadá', name_pt: 'Canadá', name_ja: 'カナダ', name_fr: 'Canada', flag: '🇨🇦' },
	argentina: { name: 'Argentina', name_es: 'Argentina', name_pt: 'Argentina', name_ja: 'アルゼンチン', name_fr: 'Argentine', flag: '🇦🇷' },
	other: { name: 'Other', name_es: 'Otros', name_pt: 'Outros', name_ja: 'その他', name_fr: 'Autres', flag: '🌍' }
};

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	console.warn(
		'[db-sync] WARNING: TURSO_URL or TURSO_AUTH_TOKEN is missing. ' +
			'Cannot seed the Turso database. Set both variables (see .env.example) and re-run the build.'
	);
	process.exit(1);
}

function slugify(s) {
	return (s ?? '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const [whiskiesData, resellersData] = await Promise.all([
	readFile(resolve(SEED_DIR, 'whiskies.json'), 'utf8').then(JSON.parse),
	readFile(resolve(SEED_DIR, 'resellers.json'), 'utf8').then(JSON.parse)
]);

const whiskies = whiskiesData.whiskies;
const resellers = resellersData.resellers;

let distilleries = [];
try {
	const distilleriesRaw = await readFile(resolve(SEED_DIR, 'distilleries.json'), 'utf8');
	distilleries = JSON.parse(distilleriesRaw).distilleries ?? [];
} catch { /* no distilleries seed file */ }

// Origins are derived from the catalog data, not a hardcoded list. Only
// presentation metadata (display name, flag, sort order) lives here.
const metaRank = new Map(Object.keys(ORIGIN_META).map((id, i) => [id, i]));
const seen = new Set();
const appearance = new Map();
let idx = 0;
for (const w of whiskies) {
	const key = (w.origin ?? '').toLowerCase().trim();
	if (!key) continue;
	if (!seen.has(key)) {
		seen.add(key);
		appearance.set(key, idx++);
	}
}

const origins = [...seen]
	.sort((a, b) => {
		if (a === 'other') return 1;
		if (b === 'other') return -1;
		const ra = metaRank.get(a) ?? 100 + (appearance.get(a) ?? 0);
		const rb = metaRank.get(b) ?? 100 + (appearance.get(b) ?? 0);
		return ra - rb;
	})
	.map((id, i) => {
		const meta = ORIGIN_META[id];
		return {
			id,
			name: meta?.name ?? id.charAt(0).toUpperCase() + id.slice(1),
			name_es: meta?.name_es ?? null,
			name_pt: meta?.name_pt ?? null,
			name_ja: meta?.name_ja ?? null,
			name_fr: meta?.name_fr ?? null,
			flag: meta?.flag ?? '🌍',
			sort_order: i
		};
	});

const regionNamesByOrigin = new Map();
for (const w of whiskies) {
	if (!w.region) continue;
	const set = regionNamesByOrigin.get(w.origin) ?? new Set();
	set.add(w.region);
	regionNamesByOrigin.set(w.origin, set);
}
const regions = [];
for (const [originId, names] of regionNamesByOrigin) {
	for (const name of [...names].sort()) {
		regions.push({ id: `${originId}-${slugify(name)}`, origin_id: originId, name });
	}
}
regions.sort((a, b) => a.origin_id.localeCompare(b.origin_id) || a.name.localeCompare(b.name));
regions.forEach((r, i) => {
	r.sort_order = i;
});

const regionIdByKey = new Map(regions.map((r) => [`${r.origin_id}|${r.name}`, r.id]));

function stmt(sql, args) {
	return { sql, args };
}

const client = createClient({ url, authToken });

const migrationFiles = (await readdir(MIGRATIONS_DIR))
	.filter((f) => f.endsWith('.sql'))
	.sort();

await client.execute(
	'CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\')))'
);

const appliedRes = await client.execute('SELECT filename FROM schema_migrations');
const applied = new Set(appliedRes.rows.map((r) => r.filename));

for (const file of migrationFiles) {
	if (applied.has(file)) continue;
	const sql = await readFile(resolve(MIGRATIONS_DIR, file), 'utf8');
	await client.executeMultiple(sql);
	await client.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
	console.log(`[db-sync] Migration applied: ${file}`);
}

// products.distillery_id cannot be added by a plain migration because a
// partially-applied run would fail on the duplicate column. Ensure it here.
const productCols = await client.execute('PRAGMA table_info(products)');
if (!productCols.rows.some((c) => c.name === 'distillery_id')) {
	await client.execute('ALTER TABLE products ADD COLUMN distillery_id TEXT REFERENCES distilleries(id)');
	await client.execute('CREATE INDEX IF NOT EXISTS idx_products_distillery ON products(distillery_id)');
	console.log('[db-sync] Added products.distillery_id');
}

const tx = await client.transaction('write');

// Turso is the sole source of truth: the seed bootstraps data that does not
// exist yet (INSERT ... ON CONFLICT DO NOTHING). For locale columns, existing
// rows are backfilled via ON CONFLICT DO UPDATE so new translations propagate.
// Other edits happen in Turso (admin UI / SQL) and reach the frontend via
// `npm run data:export`.
const insertOrigins = origins.map((o) =>
	stmt(
		'INSERT INTO origins (id, name, sort_order, flag, name_es, name_pt, name_ja, name_fr) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name_fr = excluded.name_fr',
		[o.id, o.name, o.sort_order, o.flag, o.name_es, o.name_pt, o.name_ja, o.name_fr]
	)
);

const insertRegions = regions.map((r) =>
	stmt(
		'INSERT INTO regions (id, origin_id, name, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
		[r.id, r.origin_id, r.name, r.sort_order]
	)
);

const insertDistilleries = distilleries.map((d) =>
	stmt(
		`INSERT INTO distilleries (id, slug, name, name_es, name_pt, name_en, name_ja, name_fr, description, description_es, description_pt, description_en, description_ja, description_fr, country, region, founded, image, website, latitude, longitude)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO NOTHING`,
		[
			d.id,
			d.slug ?? d.id,
			d.name,
			d.name_es ?? null,
			d.name_pt ?? null,
			d.name_en ?? null,
			d.name_ja ?? null,
			d.name_fr ?? null,
			d.description ?? null,
			d.description_es ?? null,
			d.description_pt ?? null,
			d.description_en ?? null,
			d.description_ja ?? null,
			d.description_fr ?? null,
			d.country ?? null,
			d.region ?? null,
			d.founded ?? null,
			d.image ?? null,
			d.website ?? null,
			d.latitude ?? null,
			d.longitude ?? null
		]
	)
);

const insertProducts = whiskies.map((w) =>
	stmt(
		`INSERT INTO products (id, name, description, image, origin_id, region_id, age, volume, abv, cask, distillery_id, name_pt, description_pt, name_en, description_en, name_ja, description_ja, name_fr, description_fr)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			name_pt = excluded.name_pt, description_pt = excluded.description_pt,
			name_en = excluded.name_en, description_en = excluded.description_en,
			name_ja = excluded.name_ja, description_ja = excluded.description_ja,
			name_fr = excluded.name_fr, description_fr = excluded.description_fr`,
		[
			w.slug,
			w.name,
			w.description,
			w.image,
			w.origin,
			regionIdByKey.get(`${w.origin}|${w.region}`) ?? null,
			w.age,
			w.volume,
			w.abv,
			w.cask,
			w.distillery_id ?? null,
			w.name_pt ?? null,
			w.description_pt ?? null,
			w.name_en ?? null,
			w.description_en ?? null,
			w.name_ja ?? null,
			w.description_ja ?? null,
			w.name_fr ?? null,
			w.description_fr ?? null
		]
	)
);

// Influencer videos are bootstrap-only (INSERT OR IGNORE): Turso stays the
// source of truth once seeded. Migrated/global videos live in the seed so a
// rebuild from scratch reproduces them.
const insertInfluencerVideos = whiskies.flatMap((w) =>
	(w.influencer_videos ?? []).map((v) =>
		stmt(
			'INSERT OR IGNORE INTO influencer_videos (product_id, language, platform, url, label, created_at) VALUES (?, ?, ?, ?, ?, ?)',
			[w.slug, v.language, v.platform ?? 'youtube', v.url, v.label ?? '', v.created_at ?? new Date().toISOString()]
		)
	)
);

const insertResellers = resellers.map((r) =>
	stmt(
		'INSERT INTO resellers (id, name, url, country, price, sort_order) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
		[r.id, r.name, r.url, r.country, r.price ?? null, r.sort_order ?? 0]
	)
);

let insertPages = [];
const pagesFile = resolve(SEED_DIR, 'pages.json');
try {
	const pagesRaw = await readFile(pagesFile, 'utf8');
	const pages = JSON.parse(pagesRaw);
	insertPages = pages.map((p) =>
		stmt(
			`INSERT INTO pages (id, slug, title, body, title_pt, body_pt, title_en, body_en, title_ja, body_ja, title_fr, body_fr)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(id) DO UPDATE SET
			title_pt = excluded.title_pt, body_pt = excluded.body_pt,
			title_en = excluded.title_en, body_en = excluded.body_en,
			title_ja = excluded.title_ja, body_ja = excluded.body_ja,
			title_fr = excluded.title_fr, body_fr = excluded.body_fr`,
			[p.id, p.slug, p.title ?? '', p.body ?? '', p.title_pt ?? null, p.body_pt ?? null, p.title_en ?? null, p.body_en ?? null, p.title_ja ?? null, p.body_ja ?? null, p.title_fr ?? null, p.body_fr ?? null]
		)
	);
} catch { /* no pages seed file */ }

await tx.batch([...insertOrigins, ...insertRegions, ...insertDistilleries, ...insertProducts, ...insertInfluencerVideos, ...insertResellers, ...insertPages]);

// Locale columns on existing rows are backfilled (ON CONFLICT DO UPDATE for
// _pt, _en, _ja fields) so new translations in the seed propagate. Other edits
// happen in Turso (admin UI / SQL) and reach the frontend via data:export.
await tx.commit();

const summary = await client.execute(
	`SELECT
		(SELECT COUNT(*) FROM origins) AS origins,
		(SELECT COUNT(*) FROM regions) AS regions,
		(SELECT COUNT(*) FROM distilleries) AS distilleries,
		(SELECT COUNT(*) FROM products) AS products,
		(SELECT COUNT(*) FROM influencer_videos) AS influencer_videos,
		(SELECT COUNT(*) FROM resellers) AS resellers`
);

console.log('[db-sync] Seeded (bootstrap-only, never overwrites existing rows):');
console.log(summary.rows[0]);
client.close();
