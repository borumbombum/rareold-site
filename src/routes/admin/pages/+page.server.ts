import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listPages } from '$lib/server/pages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const admin = await getAdmin(cookies);
	if (!admin) throw redirect(302, '/');
	const pages = await listPages();
	return { pages };
};
