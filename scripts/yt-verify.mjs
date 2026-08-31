// Verify YouTube video IDs via the oEmbed endpoint (no API key). Usage:
//   node scripts/yt-verify.mjs <id...>
//   node scripts/yt-verify.mjs < ids.txt
// Output per id: "<id>\t<author_name>\t<title>" for live videos, "<id>\tDEAD|BLOCK|INVALID" otherwise.
const ids = process.argv.slice(2).flatMap(a => a.match(/[a-zA-Z0-9_-]{11}/g) || []);
if (!ids.length) {
	// fall back to stdin (one token per line)
	const input = await new Promise(res => {
		let d = ''; process.stdin.on('data', c => (d += c)); process.stdin.on('end', () => res(d));
	});
	for (const t of input.split(/\s+/)) { const m = t.match(/[a-zA-Z0-9_-]{11}/); if (m) ids.push(m[0]); }
}
if (!ids.length) { console.error('usage: node scripts/yt-verify.mjs <id...>'); process.exit(1); }

const unique = [...new Set(ids)];
for (const id of unique) {
	if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { console.log(`${id}\tINVALID`); continue; }
	try {
		const res = await fetch(
			`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
			{ signal: AbortSignal.timeout(15000) }
		);
		if (!res.ok) { console.log(`${id}\t${res.status === 404 || res.status === 401 ? (res.status === 401 ? 'BLOCK' : 'DEAD') : 'HTTP ' + res.status}`); continue; }
		const j = await res.json();
		console.log(`${id}\t${j.author_name}\t${j.title}`);
	} catch {
		console.log(`${id}\tERR`);
	}
}
