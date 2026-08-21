import { json, error, type Cookies } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { addInfluencerVideo, deleteInfluencerVideo, listProductInfluencerVideos } from '$lib/server/videos';
import { invalidateInfluencerVideos } from '$lib/server/data';
import { LOCALES, type LocaleKey } from '$lib/utils/locales';
import type { ProductVideo } from '$lib/types';

function assertLanguage(language: unknown): asserts language is LocaleKey {
	if (!language || !LOCALES.includes(language as LocaleKey)) {
		throw error(400, `language must be one of: ${LOCALES.join(', ')}`);
	}
}

async function requireAdmin(cookies: Cookies) {
	if (!(await getAdmin(cookies))) throw error(403, 'forbidden');
}

export async function GET({ url, cookies }) {
	await requireAdmin(cookies);
	const productId = url.searchParams.get('productId');
	if (!productId) throw error(400, 'productId required');
	return json(await listProductInfluencerVideos(productId));
}

export async function PUT({ request, cookies }) {
	await requireAdmin(cookies);
	const body = await request.json();
	if (!body.productId || !body.url) throw error(400, 'productId, url required');
	assertLanguage(body.language);
	const platform = body.platform === 'instagram' ? 'instagram' : 'youtube';
	await addInfluencerVideo(body.productId, body.language, platform, body.url, body.label ?? '');
	invalidateInfluencerVideos(body.productId);
	return json({ ok: true });
}

export async function DELETE({ request, cookies }) {
	await requireAdmin(cookies);
	const body = await request.json();
	if (!body.productId || !body.url) throw error(400, 'productId, url required');
	assertLanguage(body.language);
	await deleteInfluencerVideo(body.productId, body.language, body.url);
	invalidateInfluencerVideos(body.productId);
	return json({ ok: true });
}
