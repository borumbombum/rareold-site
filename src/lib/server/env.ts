import {
	AUTH_SECRET,
	GOOGLE_CLIENT_SECRET,
	TURSO_URL,
	TURSO_AUTH_TOKEN
} from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
import type { CountryCode, Locale, SiteContext } from '$lib/types';

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
	}
};

export function siteForLocale(locale: string): SiteContext {
	return locale === 'pt' ? sites.BR : sites.UY;
}

export function siteForCountry(country: CountryCode): SiteContext {
	return sites[country];
}
