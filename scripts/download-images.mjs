import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { statSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_FILE = join(ROOT, 'src', 'lib', 'data', 'whiskies.json');
const IMAGES_DIR = join(ROOT, 'data', 'images');
const RAW_DIR = join(IMAGES_DIR, 'raw');
const TOOLS_DIR = join(ROOT, 'tools');
const TOOL_BIN = join(TOOLS_DIR, 'png2webp');
const TOOL_REPO = join(TOOLS_DIR, 'png2webp-src');

const QUALITY = 85;
const CONCURRENCY = 8;
const UA = 'oldrare-image-downloader/1.0';
const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp']);

function exec(cmd, args, cwd) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { cwd, stdio: 'inherit' });
		child.on('error', reject);
		child.on('close', (code) =>
			code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))
		);
	});
}

async function ensureTool() {
	if (existsSync(TOOL_BIN)) return;
	await mkdir(TOOLS_DIR, { recursive: true });
	if (!existsSync(TOOL_REPO)) {
		console.log('Cloning png2webp...');
		await exec('git', ['clone', '--depth', '1', 'https://github.com/borumbombum/png2webp', TOOL_REPO]);
	}
	console.log('Building png2webp...');
	await exec('go', ['build', '-o', TOOL_BIN, '.'], TOOL_REPO);
}

async function download(url, dest) {
	const res = await fetch(url, { headers: { 'user-agent': UA } });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	await writeFile(dest, buf);
	return buf.length;
}

function extFromUrl(url) {
	let pathname;
	try {
		pathname = new URL(url).pathname;
	} catch {
		return null;
	}
	const ext = extname(basename(pathname)).slice(1).toLowerCase();
	return ALLOWED_EXT.has(ext) ? ext : null;
}

function runPool(items, worker, size) {
	const queue = [...items];
	const total = items.length;
	let done = 0;
	const run = async () => {
		while (queue.length > 0) {
			const item = queue.shift();
			await worker(item, ++done, total);
		}
	};
	return Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
}

const catalog = JSON.parse(await readFile(JSON_FILE, 'utf8'));
const whiskies = catalog.whiskies;

const wanted = whiskies
	.map((w) => ({ slug: w.slug, url: w.image }))
	.filter((w) => typeof w.url === 'string' && w.url.length > 0);

if (!/^[a-z0-9-]+$/i.test(wanted.map((w) => w.slug).join(''))) {
	throw new Error('Unsafe slug found in catalog');
}

const skippedExisting = wanted.filter((w) => existsSync(join(IMAGES_DIR, `${w.slug}.webp`)));
const toDownload = wanted.filter((w) => !existsSync(join(IMAGES_DIR, `${w.slug}.webp`)));

console.log(
	`Catalog: ${whiskies.length} whiskies, ${toDownload.length} to download, ${skippedExisting.length} already present`
);

await ensureTool();
await mkdir(RAW_DIR, { recursive: true });

const failures = [];
await runPool(
	toDownload.map((w) => ({ ...w, ext: extFromUrl(w.url) })),
	async (item, done, total) => {
		const { slug, url, ext } = item;
		if (!ext) {
			console.log(`[${done}/${total}] ${slug}: skipping, unsupported image url`);
			failures.push({ slug, reason: 'unsupported url' });
			return;
		}
		try {
			const size = await download(url, join(RAW_DIR, `${slug}.${ext}`));
			console.log(`[${done}/${total}] ${slug}.${ext}: ${(size / 1024).toFixed(1)} KB`);
		} catch (err) {
			console.log(`[${done}/${total}] ${slug}: FAILED (${err.message})`);
			failures.push({ slug, reason: err.message });
		}
	},
	CONCURRENCY
);

console.log(`Converting to webp (quality ${QUALITY})...`);
await exec(TOOL_BIN, ['-dir', RAW_DIR, '-quality', String(QUALITY), '-force']);

const converted = (await readdir(RAW_DIR)).filter((f) => extname(f).toLowerCase() === '.webp');
for (const file of converted) {
	await copyFile(join(RAW_DIR, file), join(IMAGES_DIR, file));
	await unlink(join(RAW_DIR, file));
}
await rm(RAW_DIR, { recursive: true, force: true });

let updated = 0;
let missing = 0;
for (const w of whiskies) {
	const local = `/data/images/${w.slug}.webp`;
	if (existsSync(join(IMAGES_DIR, `${w.slug}.webp`))) {
		if (w.image !== local) {
			w.image = local;
			updated++;
		}
	} else if (typeof w.image === 'string' && w.image.length > 0) {
		missing++;
	}
}

await writeFile(JSON_FILE, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

let totalBytes = 0;
const localFiles = (await readdir(IMAGES_DIR)).filter((f) => extname(f).toLowerCase() === '.webp');
for (const f of localFiles) {
	totalBytes += statSync(join(IMAGES_DIR, f)).size;
}

console.log(`\nDone: ${localFiles.length} local images (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
console.log(`JSON: ${updated} image fields updated, ${missing} still remote, ${failures.length} download failures`);
if (failures.length) {
	console.log('Failures:');
	for (const f of failures) console.log(`  - ${f.slug}: ${f.reason}`);
}
