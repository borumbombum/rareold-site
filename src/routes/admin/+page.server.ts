import { getStats } from '$lib/server/admin';

export async function load() {
	return { stats: await getStats() };
}
