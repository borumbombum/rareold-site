import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(rel) {
	return JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));
}

const videos = loadJson('src/lib/data/influencer_videos.json');
const videoArr = Array.isArray(videos) ? videos : (videos.videos ?? videos.influencer_videos ?? []);
const whiskies = (loadJson('src/lib/data/whiskies.json').whiskies ?? []);

const whiskyName = new Map(whiskies.map((w) => [w.slug /* id is slug-compatible */, w.name ?? w.id]));
const VIDEO_RE = /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

const byId = new Map(); // videoId -> { product_ids:Set, langs:Set, url }
for (const row of videoArr) {
	if (row.platform && row.platform !== 'youtube') continue;
	const m = String(row.url ?? '').match(VIDEO_RE);
	if (!m) continue;
	const id = m[1];
	if (!byId.has(id)) byId.set(id, { url: row.url, products: new Set(), langs: new Set() });
	const e = byId.get(id);
	e.products.add(row.product_id);
	if (row.language) e.langs.add(row.language);
}

const ids = [...byId.keys()];
console.log(`[influencers] ${videoArr.length} video rows -> ${ids.length} unique videos`);

async function oembed(id) {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
		if (!res.ok) return null;
		const j = await res.json();
		return { author_name: j.author_name, author_url: j.author_url };
	} catch {
		return null;
	}
}

function channelKey(authorUrl) {
	if (!authorUrl) return null;
	let u = authorUrl.replace(/^https?:\/\//, '');
	// normalize: strip trailing slash, query, fragment; keep @handle or /channel/UCxxxx
	u = u.split(/[?#]/)[0].replace(/\/+$/, '');
	if (u.includes('/channel/')) {
		// keep /channel/UCxxxx
		const i = u.indexOf('/channel/');
		u = 'youtube.com' + u.slice(i, i + '/channel/UC'.length + 24);
	} else if (u.includes('/c/') || u.includes('/user/')) {
		return u; // legacy, keep full for identity
	} else if (u.includes('/@')) {
		const idx = u.indexOf('/@');
		const handle = u.slice(idx + 1).split('/')[0];
		u = `youtube.com/@${handle}`;
	} else {
		u = 'youtube.com/channel/' + undefined; // fallback unlikely
	}
	return u;
}

// Step 1: resolve channels per video, with minimal delay to be polite to oEmbed.
// Results are cached so re-runs (e.g. after fixing the contact scraper) skip the network.
const CACHE_FILE = '/tmp/rareold-batch/influencers-oembed.json';
const videoChannel = new Map(); // videoId -> { name, url }
let ok = 0, dead = 0;
let cache = {};
try {
	cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
} catch {
	cache = {};
}
const toFetch = ids.filter((id) => !cache[id]);
for (let i = 0; i < toFetch.length; i++) {
	const id = toFetch[i];
	cache[id] = await oembed(id);
	if (cache[id]) ok++;
	else dead++;
	if ((i + 1) % 100 === 0) console.log(`[influencers] oEmbed ${i + 1}/${toFetch.length} ok=${ok} dead=${dead}`);
	await new Promise((r) => setTimeout(r, 40));
}
if (toFetch.length) writeFileSync(CACHE_FILE, JSON.stringify(cache));
for (const id of ids) {
	if (cache[id]) videoChannel.set(id, { name: cache[id].author_name, url: cache[id].author_url });
	else dead++;
}
ok = videoChannel.size;
dead = ids.length - videoChannel.size;
console.log(`[influencers] oEmbed done (cached=${ids.length - toFetch.length}, fetched=${toFetch.length}): total ok=${ok} dead=${dead}`);

// Step 2: aggregate by channel URL (dedupe key).
const channels = new Map(); // normalized key -> { name, url, videos:Set, products:Set, langs:Set, videoIds:Set }
for (const [id, info] of videoChannel) {
	const key = channelKey(info.url) ?? info.url;
	if (!channels.has(key)) {
		channels.set(key, { name: info.name, url: info.url, videos: new Set(), products: new Set(), langs: new Set(), videoIds: new Set() });
	}
	const c = channels.get(key);
	c.name = info.name;
	c.videoIds.add(id);
	for (const p of byId.get(id).products) c.products.add(p);
	for (const l of byId.get(id).langs) c.langs.add(l);
}

console.log(`[influencers] unique channels: ${channels.size}`);

// Step 3: contact discovery — best effort About-page scrape for email/website.
// Email needs a real alpha TLD (>=2 letters) so CSS variable-font ranges like
// "wght@0..100" (Google Fonts CSS embedded in every page) can never match.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/g;
const MAILTO_RE = /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,})/gi;
const URL_RE = /https?:\/\/(?!www\.youtube\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[A-Za-z0-9./-]*)?/g;
const JUNK_TLDS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'woff', 'woff2', 'css', 'js', 'json']);

async function findContact(c) {
	const handleUrl = c.url.replace(/^https?:\/\//, '');
	const about = `https://${handleUrl.replace(/\/+$/, '')}/about`;
	try {
		const res = await fetch(about, {
			signal: AbortSignal.timeout(15000),
			headers: { 'user-agent': 'Mozilla/5.0 (contact outreach research; oldrare project)' }
		});
		if (!res.ok) return null;
		const html = await res.text();
		const mailtos = [...new Set([...html.matchAll(MAILTO_RE)].map((m) => m[1]))];
		if (mailtos.length) return mailtos[0];
		const emails = [...new Set([...html.matchAll(EMAIL_RE)].map((m) => m[0]))].filter(
			(e) => ![...JUNK_TLDS].some((t) => e.toLowerCase().endsWith('.' + t))
		);
		if (emails.length) return emails[0];
		const links = [...new Set(html.match(URL_RE) ?? [])]
			.filter((u) => !/youtube\.|youtu\.be|google|youtubei|ytimg|gstatic|doubleclick|schema\.org|w3\.org|unsplash|fonts\.|googletagmanager|googleapis|googlesyndication|googleusercontent|youtube-nocookie|ggpht/.test(u))
			.map((u) => u.split(/[)\s'"<>]/)[0].replace(/\.{2,}$/, '').replace(/[,.;:]+$/, '').replace(/https?:\/\/+/, 'https://').replace(/(\.[a-z]{2,})https?$/, '$1'))
			.filter(Boolean);
		if (links.length) return links[0];
		return null;
	} catch {
		return null;
	}
}

let withContact = 0;
for (const c of channels.values()) {
	c.contact = await findContact(c);
	if (c.contact) withContact++;
}
console.log(`[influencers] contacts found (email/website): ${withContact}/${channels.size} (rest fall back to channel URL)`);

// Step 4: build rows, sort by video count desc.
const rows = [...channels.values()].map((c) => ({
	channel: c.name,
	contact: c.contact ?? c.url,
	video_count: c.videoIds.size,
	whiskies: [...c.products].map((pid) => whiskyName.get(pid) ?? pid).sort().join(';')
})).sort((a, b) => b.video_count - a.video_count || a.channel.localeCompare(b.channel));

// Step 5: write CSV (RFC-4180-ish escaping).
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const csvHeader = ['channel', 'contact', 'video_count', 'whiskies'];
const csvLines = [csvHeader.join(','), ...rows.map((r) => [r.channel, r.contact, r.video_count, r.whiskies].map(esc).join(','))];
writeFileSync(resolve(ROOT, 'docs/youtube-influencers.csv'), csvLines.join('\n') + '\n');

// Step 6: write markdown summary.
const totalVideos = [...videoChannel.keys()].length;
const md = [
	'# YouTube Influencers (featured on Old Rare)',
	'',
	`- Generated from the embedded videos export (${videoArr.length} rows, ${ids.length} unique videos).`,
	`- Channels: **${rows.length}** total | contacts found (email/website): **${withContact}** | fallback-to-URL: **${rows.length - withContact}** | unresolved videos: **${dead}**`,
	'',
	'| # | Channel | Contact | Videos | Whiskies |',
	'|---|---------|---------|--------|----------|',
	...rows.map((r, i) => `| ${i + 1} | ${r.channel.replace(/\|/g, '/')} | ${r.contact.replace(/\|/g, '/')} | ${r.video_count} | ${r.whiskies.replace(/\|/g, '/')} |`),
	''
].join('\n');
writeFileSync(resolve(ROOT, 'docs/youtube-influencers.md'), md);

console.log(`[influencers] wrote docs/youtube-influencers.csv (${rows.length} channels) + docs/youtube-influencers.md`);