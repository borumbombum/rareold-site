let _voted = $state<Record<string, boolean>>({});
let _seeded = false;

export const votedStore = {
	get map(): Record<string, boolean> {
		return _voted;
	},
	isVoted(slug: string): boolean {
		return Boolean(_voted[slug]);
	},
	seed(slugs: string[]): void {
		if (_seeded) return;
		_seeded = true;
		for (const s of slugs) _voted[s] = true;
	},
	set(slug: string, value: boolean): void {
		_voted[slug] = value;
	},
	refresh(votedSlugs: string[]): void {
		const set = new Set(votedSlugs);
		const keys = Object.keys(_voted);
		if (keys.length === 0) {
			for (const s of votedSlugs) _voted[s] = true;
		} else {
			for (const k of keys) {
				_voted[k] = set.has(k);
			}
		}
	},
	reset(): void {
		_voted = {};
		_seeded = false;
	}
};

export async function refreshVoted(slugs: string[]): Promise<void> {
	const unique = [...new Set(slugs)].filter(Boolean);
	if (unique.length === 0) return;
	try {
		const res = await fetch(`/api/karma?slugs=${encodeURIComponent(unique.join(','))}`);
		if (!res.ok) return;
		const data = (await res.json()) as { voted?: string[] };
		if (data.voted) votedStore.refresh(data.voted);
	} catch {
		/* keep last-known */
	}
}
