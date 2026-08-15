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
	const view: ProductView = cookies.get('rareold.view') === 'list' ? 'list' : 'grid';
	return { user, favorites, view };
}
