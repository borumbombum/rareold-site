// One-off favicon backfill for the `stores` table.
//
// For every store with logo_url IS NULL: fetch its homepage HTML server-side,
// pick the best icon (apple-touch-icon -> largest rel="icon" by sizes ->
// og:image -> /favicon.ico convention), HEAD-validate it is really an image,
// and UPDATE stores SET logo_url. Re-runnable and idempotent: stores that
// already have a logo_url are skipped (pass --force to re-resolve all).
//
// Usage:
//   node --env-file-if-exists=.env scripts/store-logos.mjs
//   node --env-file-if-exists=.env scripts/store-logos.mjs --force
//
// The StoreList component uses logo_url when present and falls back to
// Google's favicon service otherwise, so this script is an enhancement pass,
// not a requirement for logos to render.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
	console.error('[store-logos] TURSO_URL / TURSO_AUTH_TOKEN missing. See .env.example.');
	process.exit(1);
}
const client = createClient({ url, authToken });
const FORCE = process.argv.includes('--force');

const UA = 'Mozilla/5.0 (store logo backfill; oldrare project)';

async function fetchHtml(pageUrl) {
	const res = await fetch(pageUrl, {
		signal: AbortSignal.timeout(15000),
		headers: { 'user-agent': UA, accept: 'text/html' }
	});
	if (!res.ok) return null;
	const ct = res.headers.get('content-type') ?? '';
	if (!/text\/html/i.test(ct)) return null;
	return await res.text();
}

async function isImage(iconUrl) {
	try {
		const res = await fetch(iconUrl, {
			method: 'HEAD',
			signal: AbortSignal.timeout(15000),
			headers: { 'user-agent': UA }
		});
		if (!res.ok) return false;
		return /image\//i.test(res.headers.get('content-type') ?? '');
	} catch {
		return false;
	}
}

function sizeScore(sizes) {
	// "180x180" -> 180; "any" (svg) -> treat as large; missing -> 0
	if (!sizes) return 0;
	if (/any/i.test(sizes)) return 4096;
	const m = sizes.match(/(\d+)\s*x\s*(\d+)/i);
	if (!m) return 0;
	return Math.max(Number(m[1]), Number(m[2]));
}

/** Best-effort icon discovery from raw homepage HTML. Returns absolute URLs, best first. */
function discoverIcons(html, pageUrl) {
	const base = new URL(pageUrl);
	const abs = (href) => {
		try {
			return new URL(href, base).href;
		} catch {
			return null;
		}
	};
	const candidates = []; // { url, score }

	// <link rel="apple-touch-icon" href="...">
	for (const m of html.matchAll(
		/<link[^>]*rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*>/gi
	)) {
		const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
		const u = href && abs(href);
		if (u) candidates.push({ url: u, score: 2000 });
	}
	// <link rel="icon" ...> / shortcut icon, scored by sizes attr
	for (const m of html.matchAll(/<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/gi)) {
		const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
		const sizes = m[0].match(/sizes=["']([^"']+)["']/i)?.[1];
		const u = href && abs(href);
		if (!u || /^data:/i.test(u)) continue;
		candidates.push({ url: u, score: 100 + sizeScore(sizes) });
	}
	// og:image as a last resort (often a large brand image, not a square logo)
	const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*>/i)?.[0];
	const ogUrl = og?.match(/content=["']([^"']+)["']/i)?.[1];
	if (ogUrl) {
		const u = abs(ogUrl);
		if (u) candidates.push({ url: u, score: 10 });
	}
	// /favicon.ico convention
	candidates.push({ url: new URL('/favicon.ico', base).href, score: 1 });

	const seen = new Set();
	return candidates
		.sort((a, b) => b.score - a.score)
		.map((c) => c.url)
		.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
}

const rows = (
	await client.execute(
		FORCE
			? 'SELECT id, name, url FROM stores ORDER BY name'
			: 'SELECT id, name, url FROM stores WHERE logo_url IS NULL ORDER BY name'
	)
).rows;

console.log(`[store-logos] ${rows.length} store(s) to resolve${FORCE ? ' (--force)' : ''}`);
let ok = 0;
for (const r of rows) {
	const id = String(r.id);
	const name = String(r.name);
	const pageUrl = String(r.url);
	let logo = null;
	try {
		const html = await fetchHtml(pageUrl);
		if (html) {
			for (const candidate of discoverIcons(html, pageUrl)) {
				if (await isImage(candidate)) {
					logo = candidate;
					break;
				}
			}
		}
	} catch (e) {
		console.log(`[store-logos] ${name}: fetch failed (${e?.message ?? e})`);
	}
	if (logo) {
		await client.execute('UPDATE stores SET logo_url = ? WHERE id = ?', [logo, id]);
		console.log(`[store-logos] ${name}: -> ${logo}`);
		ok++;
	} else {
		console.log(`[store-logos] ${name}: no usable icon found (UI falls back to favicon service)`);
	}
	// Be polite: small delay between stores.
	await new Promise((res) => setTimeout(res, 500));
}
console.log(`[store-logos] done: ${ok}/${rows.length} logos resolved`);
