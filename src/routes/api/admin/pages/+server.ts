import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listPages, upsertPage, deletePage, getPageBySlug } from '$lib/server/pages';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const pages = await listPages();
	return json(pages);
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json();
	if (!body.id || !body.slug) throw error(400, 'id and slug required');
	if (!SLUG_RE.test(body.slug)) throw error(400, 'slug must be lowercase letters, numbers and hyphens');
	if (!String(body.title ?? '').trim()) throw error(400, 'title required');
	if (!String(body.body ?? '').trim()) throw error(400, 'body required');
	const existing = await getPageBySlug(body.slug);
	if (existing && existing.id !== body.id) throw error(409, 'slug already in use');
	await upsertPage(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	await deletePage(id);
	return json({ ok: true });
}
