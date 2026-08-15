import type { CountryCode } from '$lib/types';

export interface AffiliateSite {
	name: string;
	url: string;
}

/** Static list of affiliate/retail partner sites per country. */
export const AFFILIATE_SITES: Record<CountryCode, AffiliateSite[]> = {
	BR: [
		{ name: 'Amazon', url: 'https://www.amazon.com.br' },
		{ name: 'Mercado Livre', url: 'https://www.mercadolivre.com.br' }
	],
	UY: [
		{ name: 'Malthaus', url: 'https://malthaus.uy' },
		{ name: 'Mercado Libre Uruguay', url: 'https://www.mercadolibre.com.uy' }
	]
};
