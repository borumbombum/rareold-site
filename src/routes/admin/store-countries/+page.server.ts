import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listStoreCountries } from '$lib/server/stores';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const admin = await getAdmin(cookies);
	if (!admin) throw redirect(302, '/');
	return { countries: await listStoreCountries() };
};