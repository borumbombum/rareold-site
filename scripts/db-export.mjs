import { createClient } from '@libsql/client';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(ROOT, 'src/lib/data');
const WHISKIES_FILE = resolve(DATA_DIR, 'whiskies.json');
const ORIGINS_FILE = resolve(DATA_DIR, 'origins.json');
const REGIONS_FILE = resolve(DATA_DIR, 'regions.json');
const PAGES_FILE = resolve(DATA_DIR, 'pages.json');

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	console.warn(
		'[db-export] WARNING: TURSO_URL or TURSO_AUTH_TOKEN is missing. ' +
			'Cannot read the Turso database. Set both variables (see .env.example) and re-run the build.'
	);
	process.exit(1);
}

const client = createClient({ url, authToken });

// Resellers come from Turso. product_id NULL = country-wide default store;
// product_id set = per-product listing (deep link + price) that wins over defaults.
const resellersRes = await client.execute(
	'SELECT id, name, url, country, price, sort_order, product_id FROM resellers ORDER BY country, sort_order, name COLLATE NOCASE'
);

const countryDefaults = { UY: [], BR: [], US: [] };
const byProduct = new Map();
for (const r of resellersRes.rows) {
	const item = { name: r.name, url: r.url, price: r.price ?? null };
	if (r.product_id) {
		const map = byProduct.get(r.product_id) ?? {};
		(map[r.country] = map[r.country] ?? []).push(item);
		byProduct.set(r.product_id, map);
	} else {
		(countryDefaults[r.country] = countryDefaults[r.country] ?? []).push(item);
	}
}

const resellersFor = (productId, country) => {
	const own = byProduct.get(productId)?.[country];
	return own && own.length > 0 ? own : (countryDefaults[country] ?? []);
};

const productsRes = await client.execute(
	`SELECT p.id, p.name, p.brand, p.description, p.image, p.video, p.origin_id, r.name AS region_name,
	        p.age, p.volume, p.abv, p.cask, p.name_pt, p.description_pt, p.name_en, p.description_en, p.name_ja, p.description_ja
	 FROM products p
	 LEFT JOIN regions r ON r.id = p.region_id
	 ORDER BY p.name COLLATE NOCASE`
);

const whiskies = productsRes.rows.map((row) => {
	return {
		id: row.id,
		slug: row.id,
		name: row.name,
		brand: row.brand ?? '',
		description: row.description ?? null,
		image: row.image ?? null,
		video: row.video ?? null,
		origin: row.origin_id,
		region: row.region_name ?? null,
		age: row.age ?? null,
		volume: row.volume ?? null,
		abv: row.abv ?? null,
		cask: row.cask ?? null,
		name_pt: row.name_pt ?? null,
		description_pt: row.description_pt ?? null,
		name_en: row.name_en ?? null,
		description_en: row.description_en ?? null,
		name_ja: row.name_ja ?? null,
		description_ja: row.description_ja ?? null,
		resellers_uy: resellersFor(row.id, 'UY'),
		resellers_br: resellersFor(row.id, 'BR'),
		resellers_usa: resellersFor(row.id, 'US')
	};
});

const originsRes = await client.execute(
	'SELECT id, name, sort_order, flag, name_es, name_pt, name_ja FROM origins ORDER BY sort_order'
);
const regionsRes = await client.execute(
	'SELECT id, origin_id, name, sort_order FROM regions ORDER BY sort_order, name COLLATE NOCASE'
);

const origins = originsRes.rows.map((r) => ({
	id: r.id,
	name: r.name,
	name_es: r.name_es ?? null,
	name_pt: r.name_pt ?? null,
	name_ja: r.name_ja ?? null,
	flag: r.flag ?? '🌍',
	sort_order: r.sort_order
}));
const regions = regionsRes.rows.map((r) => ({
	id: r.id,
	origin_id: r.origin_id,
	name: r.name,
	sort_order: r.sort_order
}));

const data = {
	source: url,
	generatedAt: new Date().toISOString(),
	whiskies
};

await writeFile(WHISKIES_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
await writeFile(ORIGINS_FILE, `${JSON.stringify(origins, null, 2)}\n`, 'utf8');
await writeFile(REGIONS_FILE, `${JSON.stringify(regions, null, 2)}\n`, 'utf8');

let pagesCount = 0;
try {
	const pagesRes = await client.execute('SELECT * FROM pages ORDER BY updated_at DESC');
	const pages = pagesRes.rows.map((r) => ({
		id: String(r.id),
		slug: String(r.slug),
		title: String(r.title ?? ''),
		body: String(r.body ?? ''),
		title_pt: r.title_pt ?? null,
		body_pt: r.body_pt ?? null,
		title_en: r.title_en ?? null,
		body_en: r.body_en ?? null,
		title_ja: r.title_ja ?? null,
		body_ja: r.body_ja ?? null,
		created_at: String(r.created_at ?? ''),
		updated_at: String(r.updated_at ?? '')
	}));
	await writeFile(PAGES_FILE, `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
	pagesCount = pages.length;
} catch { /* pages table may not exist yet */ }

console.log(
	`[db-export] Wrote ${whiskies.length} whiskies, ${origins.length} origins, ${regions.length} regions, ${pagesCount} pages to ${DATA_DIR}`
);
client.close();
