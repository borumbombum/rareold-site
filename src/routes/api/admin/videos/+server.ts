import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { addProductVideo, deleteProductVideo, listProductVideos } from '$lib/server/videos';
import type { CountryCode } from '$lib/types';

export async function GET({ url, cookies }) {
	await getAdmin(cookies);
	const productId = url.searchParams.get('productId');
	if (!productId) throw error(400, 'productId required');
	const videos = await listProductVideos(productId);
	return json(videos);
}

export async function PUT({ request, cookies }) {
	await getAdmin(cookies);
	const body = await request.json();
	if (!body.productId || !body.country || !body.url) throw error(400, 'productId, country, url required');
	await addProductVideo(body.productId, body.country as CountryCode, body.url, body.label ?? '');
	return json({ ok: true });
}

export async function DELETE({ request, cookies }) {
	await getAdmin(cookies);
	const body = await request.json();
	if (!body.productId || !body.country || !body.url) throw error(400, 'productId, country, url required');
	await deleteProductVideo(body.productId, body.country as CountryCode, body.url);
	return json({ ok: true });
}
