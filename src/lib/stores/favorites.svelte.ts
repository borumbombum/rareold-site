let _ids = $state<Record<string, boolean>>({});

/** Logged-in user's favorite slugs, seeded from the layout and kept in sync. */
export const favorites = {
	get ids(): string[] {
		return Object.keys(_ids);
	},
	has(slug: string): boolean {
		return Boolean(_ids[slug]);
	},
	/** Called on (re)hydrate from the SSR layout data. */
	hydrate(slugs: string[]): void {
		const next: Record<string, boolean> = {};
		for (const s of slugs) next[s] = true;
		_ids = next;
	},
	add(slug: string): void {
		_ids[slug] = true;
	},
	remove(slug: string): void {
		const next = { ..._ids };
		delete next[slug];
		_ids = next;
	}
};
