#!/usr/bin/env node
/**
 * Populates missing influencer videos by searching YouTube for real
 * review/tasting videos, per language (es, en, pt, ja, fr).
 *
 * Modernized take on todo 021: products no longer have a single `video`
 * column (removed in todo 040) — videos live in the per-language
 * `influencer_videos` table / seed arrays.
 *
 * Usage:
 *   npm run data:youtube-videos [-- --dry-run] [-- --from=<slug>] [-- --lang=<codes>]
 *
 * Flags:
 *   --dry-run       print proposed matches without writing anything
 *   --from=<slug>   start processing at a specific product slug
 *   --lang=<codes>  comma-separated subset of languages (default: all five)
 *
 * Requires YOUTUBE_API_KEY in the environment (.env works). Quota note:
 * search.list costs 100 units/query on the free tier (10k/day), so a full
 * pass over every product × language may need several days or a paid key.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SEED_FILE = resolve(process.cwd(), 'data/seed/whiskies.json');
const DISTILLERIES_FILE = resolve(process.cwd(), 'data/seed/distilleries.json');
const FIXED_CREATED_AT = '2000-01-01T00:00:00.000Z';

const LANGS = ['es', 'en', 'pt', 'ja', 'fr'];
const QUERY_SUFFIX = {
	es: 'whisky reseña cata',
	en: 'whisky review tasting',
	pt: 'whisky análise degustação',
	ja: 'ウイスキー レビュー',
	fr: 'whisky dégustation revue'
};
const RELEVANCE_LANGUAGE = { es: 'es', en: 'en', pt: 'pt', ja: 'ja', fr: 'fr' };
const REVIEW_WORDS = [
	'review', 'reviews', 'tasting', 'nota de cata', 'notas de cata', 'cata',
	'análise', 'analise', 'degustação', 'degustacion', 'dégustation',
	'レビュー', 'テイスティング'
];

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const fromArg = argv.find((a) => a.startsWith('--from='))?.slice(7) ?? null;
const langArg = argv.find((a) => a.startsWith('--lang='))?.slice(7);
const langs = langArg ? langArg.split(',').map((l) => l.trim()).filter((l) => LANGS.includes(l)) : LANGS;

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
	console.error('[youtube-videos] Missing YOUTUBE_API_KEY. Add it to .env (YouTube Data API v3 key).');
	process.exit(1);
}

const norm = (s) =>
	String(s ?? '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(endpoint, params) {
	const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
	url.searchParams.set('key', apiKey);
	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`${endpoint} ${res.status}: ${body.slice(0, 200)}`);
	}
	return res.json();
}

function scoreVideo(item, durationSec, nameN, brandN) {
	const titleN = norm(item.snippet?.title);
	const channelN = norm(item.snippet?.channelTitle);
	let score = 0;

	if (nameN && titleN.includes(nameN)) {
		score += 10;
	} else {
		const tokens = nameN.split(' ').filter((t) => t && !['the', 'yo', 'year', 'old', 'years'].includes(t));
		const hits = tokens.filter((t) => titleN.includes(t)).length;
		const ratio = tokens.length ? hits / tokens.length : 0;
		if (ratio >= 0.7) score += 8;
		else if (brandN && titleN.includes(brandN)) score += 4;
	}

	if (REVIEW_WORDS.some((w) => titleN.includes(norm(w)))) score += 5;
	if (channelN.includes('whisky') || channelN.includes('whiskey')) score += 3;

	if (durationSec != null) {
		if (durationSec < 75) score -= 8; // shorts
		else if (durationSec >= 180 && durationSec <= 1200) score += 4; // typical review length
		else if (durationSec > 2400) score -= 3; // compilations/podcasts
	}
	return score;
}

function parseISODuration(iso) {
	const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '');
	if (!m) return null;
	return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

async function findBestVideo(query, lang, nameN, brandN) {
	const search = await api('search', {
		part: 'snippet',
		type: 'video',
		maxResults: 3,
		q: query,
		relevanceLanguage: RELEVANCE_LANGUAGE[lang] ?? 'en'
	});
	const items = search.items ?? [];
	if (!items.length) return null;

	const ids = items.map((i) => i.id?.videoId).filter(Boolean);
	let details = new Map();
	if (ids.length) {
		const res = await api('videos', { part: 'contentDetails', id: ids.join(',') });
		for (const v of res.items ?? []) details.set(v.id, parseISODuration(v.contentDetails?.duration));
	}

	let best = null;
	for (const item of items) {
		const id = item.id?.videoId;
		if (!id) continue;
		const score = scoreVideo(item, details.get(id) ?? null, nameN, brandN);
		if (!best || score > best.score) best = { id, score, item };
	}
	return best;
}

const seed = JSON.parse(await readFile(SEED_FILE, 'utf8'));
let distilleryNames = new Map();
try {
	const d = JSON.parse(await readFile(DISTILLERIES_FILE, 'utf8'));
	distilleryNames = new Map((d.distilleries ?? []).map((x) => [x.id, x.name]));
} catch { /* optional */ }

const startIndex = fromArg ? seed.whiskies.findIndex((w) => w.slug === fromArg) : 0;
if (fromArg && startIndex === -1) {
	console.error(`[youtube-videos] --from slug not found: ${fromArg}`);
	process.exit(1);
}

const pendingWrites = [];
let searched = 0;
let filled = 0;

for (const w of seed.whiskies.slice(startIndex)) {
	const have = new Set((w.influencer_videos ?? []).map((v) => v.language));
	const missing = langs.filter((l) => !have.has(l));
	if (!missing.length) continue;

	const brandName = (w.distillery_id && distilleryNames.get(w.distillery_id)) || '';
	const nameN = norm(w.name);
	const brandN = norm(brandName);

	for (const lang of missing) {
		const query = `${brandName} ${w.name} ${QUERY_SUFFIX[lang]}`.replace(/\s+/g, ' ').trim();
		process.stdout.write(`[youtube-videos] ${w.slug} [${lang}] "${query}" ... `);
		try {
			await sleep(150); // be gentle with the quota
			searched++;
			const best = await findBestVideo(query, lang, nameN, brandN);
			if (!best || best.score < 9) {
				console.log(best ? `no confident match (score ${best.score})` : 'no results');
				continue;
			}
			const label = String(best.item.snippet?.title ?? '').slice(0, 80);
			console.log(`match (${best.score}): ${label}`);
			if (dryRun) continue;
			(w.influencer_videos ??= []).push({
				language: lang,
				platform: 'youtube',
				url: `https://www.youtube.com/watch?v=${best.id}`,
				label,
				created_at: FIXED_CREATED_AT
			});
			pendingWrites.push({ slug: w.slug, lang, url: `https://www.youtube.com/watch?v=${best.id}`, label });
			filled++;
		} catch (err) {
			console.log(`error: ${err.message}`);
		}
	}
}

console.log(`[youtube-videos] searched=${searched} filled=${filled}${dryRun ? ' (dry-run)' : ''}`);
if (dryRun || !pendingWrites.length) process.exit(0);

await writeFile(SEED_FILE, `${JSON.stringify(seed, null, 4)}\n`, 'utf8');
console.log(`[youtube-videos] Updated ${SEED_FILE}`);

const { createClient } = await import('@libsql/client');
const client = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
await client.batch(
	pendingWrites.map((v) => ({
		sql: 'INSERT OR IGNORE INTO influencer_videos (product_id, language, platform, url, label, created_at) VALUES (?, ?, ?, ?, ?, ?)',
		args: [v.slug, v.lang, 'youtube', v.url, v.label, FIXED_CREATED_AT]
	}))
);
console.log(`[youtube-videos] Inserted ${pendingWrites.length} rows into Turso`);
client.close();
