interface KarmaEntry {
	karma: number;
	votes: number;
}

export interface KarmaSeed {
	slug: string;
	karma: number;
	votes: number;
}

let _map = $state<Record<string, KarmaEntry>>({});
let _seededFor: string | null = null;

/** Seed server-side karma once per site so votes survive SPA navigation. */
export function seedKarma(siteKey: string, entries: KarmaSeed[]): void {
	if (_seededFor === siteKey) return;
	_seededFor = siteKey;
	const next: Record<string, KarmaEntry> = {};
	for (const e of entries) next[e.slug] = { karma: e.karma, votes: e.votes };
	_map = next;
}

export const karmaStore = {
	get map(): Record<string, KarmaEntry> {
		return _map;
	},
	get(slug: string): KarmaEntry {
		return _map[slug] ?? { karma: 0, votes: 0 };
	},
	/** Merge fresh karma entries fetched after page load. */
	refresh(entries: KarmaSeed[]): void {
		for (const e of entries) _map[e.slug] = { karma: e.karma, votes: e.votes };
	},
	/** Optimistically apply a vote/unvote; revert with the inverse deltas on failure. */
	applyDelta(slug: string, karmaDelta: number, voteDelta: number): void {
		const cur = _map[slug] ?? { karma: 0, votes: 0 };
		_map[slug] = {
			karma: cur.karma + karmaDelta,
			votes: cur.votes + voteDelta
		};
	}
};
