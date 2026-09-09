import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listStoreCountries, listStores } from '$lib/server/stores';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const admin = await getAdmin(cookies);
	if (!admin) throw redirect(302, '/');
	const countries = await listStoreCountries();
	const requested = url.searchParams.get('country');
	const country = requested && countries.some((c) => c.code === requested) ? requested : countries[0]?.code ?? null;
	return { countries, stores: await listStores(country) };
};