import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getStoresForProduct } from '$lib/server/stores';
import { resolveCountry } from '$lib/server/geo';

function clientIp(event: RequestEvent): string {
	try {
		return event.getClientAddress();
	} catch {
		const fwd = event.request.headers.get('x-forwarded-for');
		return fwd ? fwd.split(',')[0].trim() : '';
	}
}

/** Public store lookup: resolves the visitor's country from their IP and returns
 *  that country's stores for a product (falling back to English stores). */
export async function GET(event: RequestEvent) {
	const product = event.url.searchParams.get('product')?.trim();
	if (!product) return json({ error: 'product required' }, { status: 400 });

	const country = await resolveCountry(clientIp(event));
	const result = await getStoresForProduct(product, country);

	return json(
		{ country: result.country, currency: result.currency, stores: result.stores },
		{
			headers: { 'Cache-Control': 'private, max-age=300' }
		}
	);
}