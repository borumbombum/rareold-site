import { browser } from '$app/environment';

export const PINNED_KEY = 'rareold.pinnedOrigins';
export const MAX_PINNED = 5;

function readStored(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]');
		return Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string').slice(0, MAX_PINNED) : [];
	} catch {
		return [];
	}
}

let _pinned = $state<string[]>(browser ? readStored() : []);
let _hydrated = false;

function load(): void {
	if (!browser || _hydrated) return;
	_hydrated = true;
	try {
		_pinned = readStored();
	} catch {
		/* ignore */
	}
}

export function getPinnedOrigins(): string[] {
	load();
	return _pinned;
}

export function isPinnedOrigin(key: string): boolean {
	load();
	return _pinned.includes(key);
}

export function togglePinnedOrigin(key: string): boolean {
	load();
	const pinned = _pinned.includes(key) ? _pinned.filter((k) => k !== key) : _pinned.length >= MAX_PINNED ? _pinned : [..._pinned, key];
	_pinned = pinned;
	if (browser) {
		try {
			localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
		} catch {
			/* ignore */
		}
	}
	return _pinned.includes(key);
}
