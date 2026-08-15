export interface Filters {
	origin: string;
	region: string | null;
}

export const filters: Filters = $state({
	origin: 'all',
	region: null
});

export function setOrigin(key: string): void {
	filters.origin = key;
	filters.region = null;
}

export function setRegion(region: string | null): void {
	filters.region = region;
}

export function resetFilters(): void {
	filters.origin = 'all';
	filters.region = null;
}
