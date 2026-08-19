let _isNavigating = $state(false);
let _loading = $state(false);

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
	setLoading(loading: boolean): void {
		_loading = loading;
	}
};
