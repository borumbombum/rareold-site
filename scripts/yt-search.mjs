const query = process.argv.slice(2).join(' ');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
const res = await fetch(url, {
	headers: { 'user-agent': UA, 'accept-language': 'en,es;q=0.8' }
});
const html = await res.text();
const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
if (!m) {
	console.error('ytInitialData not found');
	process.exit(0);
}
const data = JSON.parse(m[1]);
const results = [];
try {
	const contents = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
	for (const section of contents) {
		if (!section.itemSectionRenderer) continue;
		for (const item of section.itemSectionRenderer.contents) {
			const v = item.videoRenderer;
			if (!v) continue;
			results.push({
				id: v.videoId,
				title: v.title?.runs?.[0]?.text ?? '',
				channel: v.ownerText?.runs?.[0]?.text ?? '',
				length: v.lengthText?.simpleText ?? ''
			});
		}
	}
} catch (e) {
	console.error('parse error', e.message);
}
results.forEach(r => console.log(`${r.id}\t${r.length}\t${r.channel}\t${r.title}`));
