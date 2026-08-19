import { getSessionUser } from '$lib/server/session';
import { listFavoriteIds } from '$lib/server/favorites';
import type { ProductView } from '$lib/stores/view.svelte';
import type { UserData } from '$lib/types';

export async function load({ cookies }): Promise<{
	user: UserData | null;
	favorites: string[];
	view: ProductView;
}> {
	const user = await getSessionUser(cookies);
	const favorites = user ? await listFavoriteIds(user.id) : [];
	const v = cookies.get('rareold.view');
	const view: ProductView = v === 'list' || v === 'compact' ? v : 'grid';
	return { user, favorites, view };
}
