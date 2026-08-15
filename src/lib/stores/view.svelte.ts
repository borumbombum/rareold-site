import { browser } from '$app/environment';

export type ProductView = 'grid' | 'list';

const KEY = 'rareold.view';

let _view = $state<ProductView>('grid');
let _hydrated = false;

function load(): void {
	if (!browser || _hydrated) return;
	_hydrated = true;
	try {
		const stored = localStorage.getItem(KEY) as ProductView | null;
		if (stored === 'grid' || stored === 'list') _view = stored;
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
			} catch {
				/* ignore */
			}
		}
	}
};
