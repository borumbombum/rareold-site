import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listApiIpControls } from '$lib/server/api-ip-controls';
import { getApiUsageStats } from '$lib/server/api-ratelimit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ cookies }) => {
	const admin = await getAdmin(cookies);
	if (!admin) throw redirect(302, '/');
	return {
		controls: await listApiIpControls(),
		stats: getApiUsageStats()
	};
};