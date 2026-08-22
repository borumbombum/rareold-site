import { ratingStore } from '$lib/stores/rating.svelte';
import { l10n } from '$lib/utils/l10n';
import type { SortKey } from '$lib/stores/filters.svelte';
import type { Whisky } from '$lib/types';

function nameCmp(a: Whisky, b: Whisky): number {
	const an = l10n(a, 'name') ?? a.name;
	const bn = l10n(b, 'name') ?? b.name;
	return an.localeCompare(bn);
}

export function sortWhiskies(list: Whisky[], sort: SortKey): Whisky[] {
	const arr = [...list];
	switch (sort) {
		case 'reviews':
			return arr.sort(
				(a, b) =>
					ratingStore.get(b.slug).review_count - ratingStore.get(a.slug).review_count || nameCmp(a, b)
			);
		case 'latest':
			return arr.sort(
				(a, b) => (b.insertion_order ?? 0) - (a.insertion_order ?? 0) || nameCmp(a, b)
			);
		case 'worst':
			return arr.sort(
				(a, b) =>
					ratingStore.get(a.slug).avg_rating - ratingStore.get(b.slug).avg_rating || nameCmp(a, b)
			);
		case 'az':
			return arr.sort(nameCmp);
		default:
			return arr.sort((a, b) => {
				const diff = ratingStore.get(b.slug).avg_rating - ratingStore.get(a.slug).avg_rating;
				if (diff !== 0) return diff;
				const diffCount =
					ratingStore.get(b.slug).review_count - ratingStore.get(a.slug).review_count;
				if (diffCount !== 0) return diffCount;
				return nameCmp(a, b);
			});
	}
}
