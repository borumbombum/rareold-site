import { listProducts } from '$lib/server/admin';
import { listStoreCountries, listStores } from '$lib/server/stores';

export async function load() {
	return {
		products: await listProducts(),
		storeCountries: await listStoreCountries(),
		stores: await listStores(null)
	};
}