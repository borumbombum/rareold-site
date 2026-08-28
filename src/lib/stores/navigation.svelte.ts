let _isNavigating = $state(false);
let _loading = $state(false);
let _loadCount = 0;

/** Global client-side navigation state, driven by beforeNavigate/afterNavigate. */
export const navigation = {
	get isNavigating(): boolean {
		return _isNavigating;
	},
	set(isNavigating: boolean): void {
		_isNavigating = isNavigating;
	},
	get loading(): boolean {
		return _loading;
	},
	/** Increment an in-flight async task; keeps the loader on until all resolve. */
	beginLoading(): void {
		_loadCount += 1;
		_loading = true;
	},
	endLoading(): void {
		_loadCount = Math.max(0, _loadCount - 1);
		if (_loadCount === 0) _loading = false;
	}
};
