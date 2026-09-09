import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listProductStores, upsertProductStore, deleteProductStore } from '$lib/server/stores';

export async function GET({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const productId = url.searchParams.get('product');
	if (!productId) throw error(400, 'product required');
	return json(await listProductStores(productId));
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json();
	if (!body.product_id) throw error(400, 'product_id required');
	if (!body.store_id) throw error(400, 'store_id required');
	await upsertProductStore(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const productId = url.searchParams.get('product');
	const storeId = url.searchParams.get('store');
	if (!productId || !storeId) throw error(400, 'product and store required');
	await deleteProductStore(productId, storeId);
	return json({ ok: true });
}