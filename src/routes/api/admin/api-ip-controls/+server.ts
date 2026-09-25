import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listApiIpControls, upsertApiIpControl, deleteApiIpControl } from '$lib/server/api-ip-controls';
import { invalidateControlsCache } from '$lib/server/api-ratelimit';
import type { RequestHandler } from './$types';

export const prerender = false;

const IP_RE = /^[0-9a-fA-F:.]+$/;

function validIp(ip: unknown): ip is string {
	const s = String(ip ?? '').trim();
	return s.length > 0 && s.length <= 45 && IP_RE.test(s);
}

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json(await listApiIpControls());
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json().catch(() => ({}));
	if (!validIp(body.ip)) throw error(400, 'invalid ip');
	await upsertApiIpControl({
		ip: String(body.ip).trim(),
		blocked: body.blocked !== false,
		limit_per_min:
			typeof body.limit_per_min === 'number' && Number.isFinite(body.limit_per_min)
				? body.limit_per_min
				: typeof body.limit_per_min === 'string' && body.limit_per_min !== ''
					? Number(body.limit_per_min)
					: null,
		reason: typeof body.reason === 'string' ? body.reason : null
	});
	invalidateControlsCache();
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const ip = url.searchParams.get('ip');
	if (!ip) throw error(400, 'ip required');
	await deleteApiIpControl(ip);
	invalidateControlsCache();
	return json({ ok: true });
}