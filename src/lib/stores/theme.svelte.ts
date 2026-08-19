import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const KEY = 'rareold.theme';

let _theme = $state<Theme>('light');
let _hydrated = false;

function load(): void {
	if (!browser || _hydrated) return;
	_hydrated = true;
	try {
		const stored = localStorage.getItem(KEY) as Theme | null;
		_theme = stored ?? 'light';
	} catch {
		_theme = 'light';
	}
	apply();
}

function apply(): void {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', _theme === 'dark');
	document.documentElement.style.colorScheme = _theme;
}

export const theme = {
	get current(): Theme {
		return _theme;
	},
	init(): void {
		load();
	},
	toggle(): void {
		_theme = _theme === 'dark' ? 'light' : 'dark';
		if (browser) {
			try {
				localStorage.setItem(KEY, _theme);
			} catch {
				/* ignore */
			}
		}
		apply();
	}
};
