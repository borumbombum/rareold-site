import { json } from '@sveltejs/kit';
import {
	getAdmin,
	listProducts,
	createProduct,
	updateProduct,
	deleteProduct,
	type ProductInput
} from '$lib/server/admin';

function parseProduct(body: Record<string, unknown>): ProductInput | null {
	const id = typeof body.id === 'string' ? body.id.trim() : '';
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	if (!id || !name) return null;
	const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
	const num = (v: unknown): number | null => {
		if (v === '' || v === null || v === undefined) return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	};
	return {
		id,
		name,
		description: str(body.description),
		image: str(body.image),
		video: str(body.video),
		origin_id: str(body.origin_id),
		region_id: str(body.region_id),
		age: num(body.age),
		volume: str(body.volume),
		abv: num(body.abv),
		cask: str(body.cask),
		distillery_id: str(body.distillery_id),
		name_pt: str(body.name_pt),
		description_pt: str(body.description_pt),
		name_en: str(body.name_en),
		description_en: str(body.description_en),
		name_ja: str(body.name_ja),
		description_ja: str(body.description_ja),
		name_fr: str(body.name_fr),
		description_fr: str(body.description_fr)
	};
}

export async function GET({ cookies, url }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json({ products: await listProducts() });
}

export async function POST({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const product = parseProduct(body);
	if (!product) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await createProduct(product);
		return json({ ok: true, id: product.id });
	} catch (e) {
		return json({ error: (e as Error).message || 'create failed' }, { status: 400 });
	}
}

export async function PUT({ request, cookies, url }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const product = parseProduct(body);
	if (!id || !product) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await updateProduct(id, product);
		return json({ ok: true });
	} catch (e) {
		return json({ error: (e as Error).message || 'update failed' }, { status: 400 });
	}
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await deleteProduct(id);
		return json({ ok: true });
	} catch (e) {
		return json({ error: (e as Error).message || 'delete failed' }, { status: 400 });
	}
}
