import { getLocale } from '$lib/paraglide/runtime';
import type { Whisky } from '$lib/types';

type LocalizedField = 'name' | 'description';

/**
 * Locale-specific text with fallback to the base (source-language) field.
 * Override columns follow `<field>_<locale>` (e.g. `name_pt`, `description_pt`).
 */
export function l10n(item: Whisky, field: LocalizedField): string | null {
	const locale = getLocale();
	const key = `${field}_${locale}` as keyof Whisky;
	const value = item[key] as string | null | undefined;
	return value != null && value.trim() !== '' ? value : item[field];
}
