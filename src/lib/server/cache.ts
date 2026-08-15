interface CacheEntry {
	expires: number;
	value: unknown;
}

const store = new Map<string, CacheEntry>();

function now(): number {
	return Date.now();
}

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key);
	if (hit && hit.expires > now()) {
		return Promise.resolve(hit.value as T);
	}
	return fn().then((value) => {
		store.set(key, { expires: now() + ttlMs, value });
		return value;
	});
}

export function cachedSync<T>(key: string, ttlMs: number, fn: () => T): T {
	const hit = store.get(key);
	if (hit && hit.expires > now()) {
		return hit.value as T;
	}
	const value = fn();
	store.set(key, { expires: now() + ttlMs, value });
	return value;
}

export function invalidateCache(prefix: string): void {
	for (const key of store.keys()) {
		if (key.startsWith(prefix)) store.delete(key);
	}
}

export function cacheSize(): number {
	return store.size;
}

export function clearCache(): void {
	store.clear();
}

if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		const t = now();
		for (const [key, entry] of store) {
			if (entry.expires <= t) store.delete(key);
		}
	}, 60_000);
}
