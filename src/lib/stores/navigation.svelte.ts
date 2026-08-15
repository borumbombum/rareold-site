let _isNavigating = $state(false);

/** Global client-side navigation state, driven by beforeNavigate/afterNavigate. */
export const navigation = {
	get isNavigating(): boolean {
		return _isNavigating;
	},
	set(isNavigating: boolean): void {
		_isNavigating = isNavigating;
	}
};
