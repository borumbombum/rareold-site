import {
	AUTH_SECRET,
	GOOGLE_CLIENT_SECRET,
	TURSO_URL,
	TURSO_AUTH_TOKEN
} from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
import type { CountryCode, SiteContext } from '$lib/types';
import { LOCALE_CONFIG, type LocaleKey } from '$lib/utils/locales';

export const env = {
	authSecret: AUTH_SECRET,
	tursoUrl: TURSO_URL,
	tursoAuthToken: TURSO_AUTH_TOKEN,
	googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
	googleClientSecret: GOOGLE_CLIENT_SECRET
};

export const sites: Record<CountryCode, SiteContext> = {
	UY: {
		locale: 'es',
		countryCode: 'UY',
		currency: 'UYU',
		currencySymbol: '$',
		timezone: 'America/Montevideo'
	},
	BR: {
		locale: 'pt',
		countryCode: 'BR',
		currency: 'BRL',
		currencySymbol: 'R$',
		timezone: 'America/Sao_Paulo'
	},
	US: {
		locale: 'en',
		countryCode: 'US',
		currency: 'USD',
		currencySymbol: '$',
		timezone: 'America/New_York'
	},
	JP: {
		locale: 'ja',
		countryCode: 'JP',
		currency: 'JPY',
		currencySymbol: '¥',
		timezone: 'Asia/Tokyo'
	}
};

const LOCALE_TO_COUNTRY: Record<LocaleKey, CountryCode> = {
	es: 'UY',
	pt: 'BR',
	en: 'US',
	ja: 'JP',
	fr: 'US'
};

export function siteForLocale(locale: string): SiteContext {
	const cc = LOCALE_TO_COUNTRY[locale as LocaleKey] ?? 'UY';
	return sites[cc];
}

export function siteForCountry(country: CountryCode): SiteContext {
	return sites[country];
}
