let _ids = $state<Record<string, boolean>>({});

/** Logged-in user's followed distillery ids, seeded from the layout and kept in sync. */
export const followedDistilleries = {
	get ids(): string[] {
		return Object.keys(_ids);
	},
	has(id: string): boolean {
		return Boolean(_ids[id]);
	},
	/** Called on (re)hydrate from the SSR layout data. */
	hydrate(ids: string[]): void {
		const next: Record<string, boolean> = {};
		for (const id of ids) next[id] = true;
		_ids = next;
	},
	add(id: string): void {
		_ids[id] = true;
	},
	remove(id: string): void {
		const next: Record<string, boolean> = { ..._ids };
		delete next[id];
		_ids = next;
	}
};

/** Optimistic toggle against /api/distillery-followers; reverts + toasts on failure. */
export async function toggleFollow(id: string, on: boolean): Promise<boolean> {
	if (on) followedDistilleries.add(id);
	else followedDistilleries.remove(id);
	try {
		const res = await fetch('/api/distillery-followers', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ distillery_id: id, on })
		});
		if (!res.ok) throw new Error(String(res.status));
		return true;
	} catch {
		if (on) followedDistilleries.remove(id);
		else followedDistilleries.add(id);
		return false;
	}
}
