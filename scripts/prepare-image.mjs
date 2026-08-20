import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = resolve(ROOT, 'data', 'images');
const UA = 'oldrare-image-prep/1.0';
const TARGET_SIZE = 500;
const QUALITY = 85;

const args = process.argv.slice(2);
if (args.length < 2) {
	console.error('Usage: node scripts/prepare-image.mjs <image-url-or-path> <slug>');
	console.error('  Downloads/resizes an image to 500x500 webp and saves to data/images/<slug>.webp');
	process.exit(1);
}

const [input, slug] = args;

if (!/^[a-z0-9-]+$/i.test(slug)) {
	console.error(`Invalid slug: "${slug}". Use lowercase letters, numbers, and hyphens only.`);
	process.exit(1);
}

await mkdir(IMAGES_DIR, { recursive: true });

let inputBuffer;
if (input.startsWith('http://') || input.startsWith('https://')) {
	console.log(`Downloading: ${input}`);
	const res = await fetch(input, { headers: { 'user-agent': UA } });
	if (!res.ok) {
		console.error(`Download failed: HTTP ${res.status}`);
		process.exit(1);
	}
	inputBuffer = Buffer.from(await res.arrayBuffer());
	console.log(`Downloaded: ${(inputBuffer.length / 1024).toFixed(1)} KB`);
} else {
	const { readFile } = await import('node:fs/promises');
	inputBuffer = await readFile(input);
	console.log(`Read local file: ${(inputBuffer.length / 1024).toFixed(1)} KB`);
}

const outPath = resolve(IMAGES_DIR, `${slug}.webp`);

try {
	await sharp(inputBuffer)
		.resize(TARGET_SIZE, TARGET_SIZE, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		})
		.webp({ quality: QUALITY })
		.toFile(outPath);

	const stat = await import('node:fs/promises').then(fs => fs.stat(outPath));
	console.log(`Saved: ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
} catch (err) {
	console.error(`Image processing failed: ${err.message}`);
	process.exit(1);
}
