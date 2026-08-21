import { localizeHref } from '$lib/paraglide/runtime';
import { LOCALES, type LocaleKey } from './locales';

export interface HreflangAlternate {
	lang: string;
	href: string;
}

/** Build hreflang alternates for every configured locale.
 *  `resolve` maps a locale to the de-localized path for that locale
 *  (needed when slugs themselves are translated, e.g. origin pages). */
export function buildAlternates(
	resolve: (locale: LocaleKey) => string,
	origin: string
): HreflangAlternate[] {
	return LOCALES.map((locale) => ({
		lang: locale,
		href: `${origin}${localizeHref(resolve(locale), { locale })}`
	}));
}

/** Build hreflang alternates for a fixed de-localized base path (e.g. "/whisky/foo"). */
export function buildHreflangAlternates(basePath: string, origin: string): HreflangAlternate[] {
	return buildAlternates(() => basePath, origin);
}
