import { listReviews } from '$lib/server/admin';

export async function load() {
	return { reviews: await listReviews() };
}
