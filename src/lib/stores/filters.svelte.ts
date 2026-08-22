import { browser } from '$app/environment';

export interface Filters {
	origin: string;
	region: string | null;
	sort: SortKey;
}

export type SortKey = 'top' | 'reviews' | 'latest' | 'worst' | 'az';

const SORT_KEYS: SortKey[] = ['top', 'reviews', 'latest', 'worst', 'az'];
const STORAGE_KEY = 'rareold.sort';

let hydrated = false;

function readStored(): SortKey {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return SORT_KEYS.includes(stored as SortKey) ? (stored as SortKey) : 'top';
	} catch {
		return 'top';
	}
}

export const filters: Filters = $state({
	origin: 'all',
	region: null,
	sort: 'top'
});

/** Apply the persisted sort preference (call once on mount, client only). */
export function initSort(): void {
	if (!browser || hydrated) return;
	hydrated = true;
	filters.sort = readStored();
}

export function setOrigin(key: string): void {
	filters.origin = key;
	filters.region = null;
}

export function setRegion(region: string | null): void {
	filters.region = region;
}

export function setSort(sort: SortKey): void {
	filters.sort = sort;
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, sort);
		} catch {
			/* ignore */
		}
	}
}

export function resetFilters(): void {
	filters.origin = 'all';
	filters.region = null;
}
