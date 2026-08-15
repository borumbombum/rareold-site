import { getSessionUser } from '$lib/server/session';
import { listFavoriteIds } from '$lib/server/favorites';
import type { UserData } from '$lib/types';

export async function load({ cookies }): Promise<{ user: UserData | null; favorites: string[] }> {
	const user = await getSessionUser(cookies);
	const favorites = user ? await listFavoriteIds(user.id) : [];
	return { user, favorites };
}
