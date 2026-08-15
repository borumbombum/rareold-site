import type { CountryCode, Reseller, Whisky } from '$lib/types';

/** Resolved store list for a country (exported per-product from Turso). */
export function resellersFor(
	product: Pick<Whisky, 'resellers_uy' | 'resellers_br' | 'resellers_usa'>,
	country: CountryCode
): Reseller[] {
	return country === 'UY'
		? product.resellers_uy
		: country === 'BR'
			? product.resellers_br
			: product.resellers_usa;
}
