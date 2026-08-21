import { listDistilleries } from '$lib/server/admin';

export async function load() {
	return { distilleries: await listDistilleries() };
}
