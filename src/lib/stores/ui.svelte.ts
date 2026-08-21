let _loginOpen = $state(false);
let _video = $state<{ list: { url: string; label: string }[]; index: number } | null>(null);
let _drawerOpen = $state(false);
let _langOpen = $state(false);
let _toast = $state<{ text: string; error?: boolean } | null>(null);
let _toastTimer: ReturnType<typeof setTimeout> | null = null;
let _reviewProduct = $state<{
	slug: string;
	productName: string;
	productImage: string | null;
	country: string;
	existingReview?: { score: number; comment: string | null };
} | null>(null);

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
		return _video ? _video.list[_video.index].url : null;
	},
	get videoList(): { url: string; label: string }[] {
		return _video ? _video.list : [];
	},
	get videoIndex(): number {
		return _video ? _video.index : 0;
	},
	openVideo(url: string, list?: { url: string; label: string }[]): void {
		if (list && list.length > 1) {
			const index = Math.max(0, list.findIndex((v) => v.url === url));
			_video = { list, index };
		} else {
			_video = { list: [{ url, label: '' }], index: 0 };
		}
	},
	setVideoIndex(index: number): void {
		if (_video && index >= 0 && index < _video.list.length) _video = { ..._video, index };
	},
	closeVideo(): void {
		_video = null;
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
	get langOpen(): boolean {
		return _langOpen;
	},
	openLang(): void {
		_langOpen = true;
	},
	closeLang(): void {
		_langOpen = false;
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
	},
	get reviewOpen(): boolean {
		return _reviewProduct !== null;
	},
	get reviewProduct(): typeof _reviewProduct {
		return _reviewProduct;
	},
	openReview(data: typeof _reviewProduct): void {
		_reviewProduct = data;
	},
	closeReview(): void {
		_reviewProduct = null;
	}
};
