import { browser } from '$app/environment';

export type ProductView = 'grid' | 'list' | 'compact';

const KEY = 'rareold.view';

function readStored(): ProductView {
	const attr = document.documentElement.getAttribute('data-view');
	if (attr === 'grid' || attr === 'list' || attr === 'compact') return attr;
	const stored = localStorage.getItem(KEY);
	return stored === 'grid' || stored === 'list' || stored === 'compact' ? stored : 'grid';
}

let _view = $state<ProductView>(browser ? readStored() : 'grid');
let _hydrated = false;

function load(): void {
	if (!browser || _hydrated) return;
	_hydrated = true;
	try {
		_view = readStored();
	} catch {
		/* ignore */
	}
}

export const view = {
	get current(): ProductView {
		return _view;
	},
	init(): void {
		load();
	},
	set(value: ProductView): void {
		_view = value;
		if (browser) {
			try {
				localStorage.setItem(KEY, value);
				document.cookie = `${KEY}=${value}; path=/; samesite=lax; max-age=31536000`;
			} catch {
				/* ignore */
			}
		}
	}
};
