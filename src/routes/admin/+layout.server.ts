import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';

export async function load({ cookies }) {
	const admin = await getAdmin(cookies);
	if (!admin) redirect(307, '/');
	return { admin };
}
