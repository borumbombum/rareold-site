let _reviewed = $state<Record<string, boolean>>({});
let _seeded = false;

export const reviewedStore = {
	get map(): Record<string, boolean> {
		return _reviewed;
	},
	isReviewed(slug: string): boolean {
		return Boolean(_reviewed[slug]);
	},
	seed(slugs: string[]): void {
		if (_seeded) return;
		_seeded = true;
		for (const s of slugs) _reviewed[s] = true;
	},
	refresh(reviewedSlugs: string[]): void {
		const set = new Set(reviewedSlugs);
		const keys = Object.keys(_reviewed);
		if (keys.length === 0) {
			for (const s of reviewedSlugs) _reviewed[s] = true;
		} else {
			for (const k of keys) {
				_reviewed[k] = set.has(k);
			}
		}
	},
	reset(): void {
		_reviewed = {};
		_seeded = false;
	}
};
