import { getLocale } from '$lib/paraglide/runtime';

type LocalizedField = 'name' | 'description' | 'title' | 'body';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function l10n(item: any, field: LocalizedField): string | null {
	const locale = getLocale();
	const key = `${field}_${locale}`;
	const value = item[key] as string | null | undefined;
	const base = item[field] as string | null | undefined;
	return value != null && value.trim() !== '' ? value : (base ?? null);
}
