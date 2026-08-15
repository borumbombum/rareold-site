import { json } from '@sveltejs/kit';
import { siteForCountry } from '$lib/server/env';
import { getFreshPrices } from '$lib/server/data';
import type { CountryCode } from '$lib/types';

export async function GET({ url }) {
	const country = (url.searchParams.get('country') ?? 'UY') as CountryCode;
	const site = siteForCountry(country);
	const prices = await getFreshPrices(site);
	return json(
		{ currency: site.currency, symbol: site.currencySymbol, prices },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}
