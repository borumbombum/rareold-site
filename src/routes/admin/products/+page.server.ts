import { listProducts } from '$lib/server/admin';

export async function load() {
	return { products: await listProducts() };
}
