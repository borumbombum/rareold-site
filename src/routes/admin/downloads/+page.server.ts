import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listDownloadRequests } from '$lib/server/downloads';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ cookies }) => {
	const admin = await getAdmin(cookies);
	if (!admin) throw redirect(302, '/');
	return { requests: await listDownloadRequests() };
};
