import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { error } from '@sveltejs/kit';

const imagesDir = join(process.cwd(), 'data', 'images');

const MIME: Record<string, string> = {
	webp: 'image/webp',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg'
};

export const prerender = true;

export const entries = async () => {
	const files = await readdir(imagesDir, { withFileTypes: true });
	return files.filter((f) => f.isFile()).map((f) => ({ file: f.name }));
};

export async function GET({ params }) {
	const { file } = params;
	const mime = MIME[extname(file).slice(1).toLowerCase()];
	if (!mime) throw error(404, 'Not found');
	try {
		const body = await readFile(join(imagesDir, file));
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
