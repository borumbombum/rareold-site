import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { error } from '@sveltejs/kit';

const videosDir = join(process.cwd(), 'data', 'videos');

const MIME: Record<string, string> = {
	mp4: 'video/mp4',
	webm: 'video/webm'
};

export const prerender = true;

export const entries = async () => {
	const files = await readdir(videosDir, { withFileTypes: true });
	return files.filter((f) => f.isFile()).map((f) => ({ file: f.name }));
};

export async function GET({ params }) {
	const { file } = params;
	const mime = MIME[extname(file).slice(1).toLowerCase()];
	if (!mime) throw error(404, 'Not found');
	try {
		const body = await readFile(join(videosDir, file));
		return new Response(body, {
			headers: {
				'Content-Type': mime,
				'Cache-Control': 'public, max-age=2592000, immutable'
			}
		});
	} catch {
		throw error(404, 'Not found');
	}
}
