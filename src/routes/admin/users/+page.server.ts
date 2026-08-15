import { listUsers } from '$lib/server/admin';

export async function load() {
	return { users: await listUsers() };
}
