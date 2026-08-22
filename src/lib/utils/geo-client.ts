const STORAGE_KEY = 'rareold.country';
const ENDPOINT = 'https://ipwho.is/';

let pending: Promise<string | null> | null = null;

/** Detect the visitor's country in the browser from their own public IP.
 *  Memoized per session; cached across visits in localStorage. */
export function detectUserCountry(): Promise<string | null> {
	pending ??= detect();
	return pending;
}

async function detect(): Promise<string | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && /^[A-Z]{2}$/.test(stored)) return stored;
	} catch {
		/* storage unavailable */
	}
	try {
		const res = await fetch(ENDPOINT, { headers: { accept: 'application/json' } });
		if (!res.ok) return null;
		const data: unknown = await res.json();
		const code =
			typeof data === 'object' && data !== null && 'country_code' in data
				? (data as { country_code?: unknown }).country_code
				: null;
		const country = typeof code === 'string' && code.length === 2 ? code.toUpperCase() : null;
		if (country) {
			try {
				localStorage.setItem(STORAGE_KEY, country);
			} catch {
				/* storage unavailable */
			}
		}
		return country;
	} catch {
		return null;
	}
}

/** ISO-2 country code -> flag emoji, or null when unknown. */
export function countryFlag(cc: string | null): string | null {
	if (!cc || cc.length !== 2) return null;
	return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
