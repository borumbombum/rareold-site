interface RatingEntry {
	avg_rating: number;
	review_count: number;
}

export interface RatingSeed {
	slug: string;
	avg_rating: number;
	review_count: number;
}

let _map = $state<Record<string, RatingEntry>>({});
let _seededFor: string | null = null;

/** Seed server-side ratings once per site so ratings survive SPA navigation. */
export function seedRating(siteKey: string, entries: RatingSeed[]): void {
	if (_seededFor === siteKey) return;
	_seededFor = siteKey;
	const next: Record<string, RatingEntry> = {};
	for (const e of entries) next[e.slug] = { avg_rating: e.avg_rating, review_count: e.review_count };
	_map = next;
}

export const ratingStore = {
	get map(): Record<string, RatingEntry> {
		return _map;
	},
	get(slug: string): RatingEntry {
		return _map[slug] ?? { avg_rating: 0, review_count: 0 };
	},
	/** Merge fresh rating entries fetched after page load. */
	refresh(entries: RatingSeed[]): void {
		for (const e of entries) _map[e.slug] = { avg_rating: e.avg_rating, review_count: e.review_count };
	}
};

/** Fetch fresh ratings from Turso (no-store) and merge it into the store. */
export async function refreshRating(slugs: string[]): Promise<void> {
	const unique = [...new Set(slugs)].filter(Boolean);
	if (unique.length === 0) return;
	const [{ navigation }, { tick }] = await Promise.all([
		import('./navigation.svelte'),
		import('svelte')
	]);
	navigation.beginLoading();
	try {
		const res = await fetch(`/api/rating?slugs=${encodeURIComponent(unique.join(','))}`);
		if (!res.ok) return;
		const data = (await res.json()) as {
			items?: { entity_id: string; avg_rating: number; review_count: number }[];
			reviewed?: string[];
		};
		if (data.items) {
			ratingStore.refresh(
				data.items.map((e) => ({ slug: e.entity_id, avg_rating: e.avg_rating, review_count: e.review_count }))
			);
		}
		if (data.reviewed) {
			const { reviewedStore } = await import('./reviewed.svelte');
			reviewedStore.refresh(data.reviewed);
		}
		await tick();
	} catch {
		/* keep last-known rating */
	} finally {
		navigation.endLoading();
	}
}
