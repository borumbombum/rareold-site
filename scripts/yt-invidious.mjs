// Search multiple Invidious instances for videos. Usage:
//   node scripts/yt-invidious.mjs "query"
//   node scripts/yt-invidious.mjs "ロイヤルサルート トレジャード ブレンド"
// Output per result: "id ||| title" (original-language titles preserved).
// Tries a list of public instances; some disable search (401/403/"Endpoint
// disabled") and are skipped automatically. Dedups by video id across instances.
const INSTANCES = [
	'https://inv.nadeko.net',
	'https://yewtu.be',
	'https://invidious.fdn.fr',
	'https://invidious.nerdvpn.de',
	'https://iv.melmac.space'
];

const q = process.argv.slice(2).join(' ').trim();
if (!q) { console.error('usage: node scripts/yt-invidious.mjs "query"'); process.exit(1); }

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function searchInstance(base) {
	try {
		const url = `${base}/search?q=${encodeURIComponent(q)}&page=1`;
		const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
		if (!res.ok) return { base, ok: false, status: res.status, results: [] };
		const html = await res.text();
		const re = /\/watch\?v=([A-Za-z0-9_-]{11})[\s\S]*?<p dir="auto">([^<]+)<\/p>/g;
		const results = [];
		let m;
		while ((m = re.exec(html)) !== null) results.push({ id: m[1], title: m[2].trim() });
		return { base, ok: true, status: 200, results };
	} catch (e) {
		return { base, ok: false, status: 'ERR', error: e.message, results: [] };
	}
}

const settled = await Promise.all(INSTANCES.map(searchInstance));

const seen = new Set();
const merged = [];
const hits = settled.filter(s => s.ok && s.results.length);
for (const s of hitOrder(settled, hits)) {
	for (const r of s.results) {
		if (!seen.has(r.id)) { seen.add(r.id); merged.push({ id: r.id, title: r.title, via: s.base }); }
	}
}

// Prioritize results that came from instances which actually returned hits.
function hitOrder(all, withHits) {
	const hitsSet = new Set(withHits);
	return [...all.filter(s => hitsSet.has(s)), ...all.filter(s => !hitsSet.has(s))];
}

for (const s of settled) {
	const status = s.ok && s.results.length ? `OK  (${s.results.length})` : (s.ok ? `EMPTY` : `FAIL (${s.status || s.error})`);
	console.error(`[invidious] ${s.base}  ${status}`);
}

if (!merged.length) {
	console.log('(no results from any Invidious instance)');
	process.exit(0);
}
for (const r of merged) console.log(`${r.id} ||| ${r.title}  [via ${r.via}]`);
