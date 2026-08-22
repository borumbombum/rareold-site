import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { grantDownload, listDownloadRequests } from '$lib/server/downloads';
import type { RequestHandler } from './$types';

export const prerender = false;

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json(await listDownloadRequests());
}

export async function POST({ request, cookies, url }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json().catch(() => ({}));
	const { id, hours } = body as { id?: string; hours?: number };
	if (!id) throw error(400, 'id required');
	const grant = await grantDownload(id, hours);
	return json({
		ok: true,
		url: `${url.origin}/api/data/download?token=${grant.token}`,
		expiresAt: grant.expiresAt
	});
}
