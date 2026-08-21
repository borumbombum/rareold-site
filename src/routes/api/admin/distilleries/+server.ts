import { json } from '@sveltejs/kit';
import {
	getAdmin,
	listDistilleries,
	createDistillery,
	updateDistillery,
	deleteDistillery,
	type DistilleryInput
} from '$lib/server/admin';

function parseDistillery(body: Record<string, unknown>): DistilleryInput | null {
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
		slug: str(body.slug) ?? id,
		name,
		name_es: str(body.name_es),
		name_pt: str(body.name_pt),
		name_en: str(body.name_en),
		name_ja: str(body.name_ja),
		description: str(body.description),
		description_es: str(body.description_es),
		description_pt: str(body.description_pt),
		description_en: str(body.description_en),
		description_ja: str(body.description_ja),
		country: str(body.country),
		region: str(body.region),
		founded: num(body.founded),
		image: str(body.image),
		website: str(body.website),
		latitude: num(body.latitude),
		longitude: num(body.longitude)
	};
}

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json({ distilleries: await listDistilleries() });
}

export async function POST({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const distillery = parseDistillery(body);
	if (!distillery) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await createDistillery(distillery);
		return json({ ok: true, id: distillery.id });
	} catch (e) {
		return json({ error: (e as Error).message || 'create failed' }, { status: 400 });
	}
}

export async function PUT({ request, cookies, url }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const distillery = parseDistillery(body);
	if (!id || !distillery) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await updateDistillery(id, distillery);
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
		await deleteDistillery(id);
		return json({ ok: true });
	} catch (e) {
		const msg = (e as Error).message || 'delete failed';
		return json({ error: msg }, { status: msg === 'distillery_has_products' ? 409 : 400 });
	}
}
