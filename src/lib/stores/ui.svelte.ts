let _loginOpen = $state(false);
let _videoUrl = $state<string | null>(null);
let _drawerOpen = $state(false);
let _toast = $state<{ text: string; error?: boolean } | null>(null);
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export const ui = {
	get loginOpen(): boolean {
		return _loginOpen;
	},
	openLogin(): void {
		_loginOpen = true;
	},
	closeLogin(): void {
		_loginOpen = false;
	},
	get videoUrl(): string | null {
		return _videoUrl;
	},
	openVideo(url: string): void {
		_videoUrl = url;
	},
	closeVideo(): void {
		_videoUrl = null;
	},
	get drawerOpen(): boolean {
		return _drawerOpen;
	},
	openDrawer(): void {
		_drawerOpen = true;
	},
	closeDrawer(): void {
		_drawerOpen = false;
	},
	toggleDrawer(): void {
		_drawerOpen = !_drawerOpen;
	},
	get toast(): { text: string; error?: boolean } | null {
		return _toast;
	},
	showToast(text: string, error = false): void {
		if (_toastTimer) clearTimeout(_toastTimer);
		_toast = { text, error };
		_toastTimer = setTimeout(() => {
			_toast = null;
		}, 2600);
	}
};
