import type { UserData } from '$lib/types';

let _user = $state<UserData | null>(null);

export const session = {
	get user(): UserData | null {
		return _user;
	},
	get isAuthed(): boolean {
		return Boolean(_user);
	},
	/** Called on (re)hydrate from the SSR layout data. */
	hydrate(user: UserData | null): void {
		_user = user;
	},
	setUser(user: UserData | null): void {
		_user = user;
	},
	/** Log out: clear the server cookie and local state. */
	async clear(): Promise<void> {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			/* ignore */
		}
		_user = null;
	}
};
