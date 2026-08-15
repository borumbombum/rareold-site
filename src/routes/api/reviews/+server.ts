import { json } from '@sveltejs/kit';
import { insertReview } from '$lib/server/reviews';
import { getReviews as getCachedReviews, invalidateReviews } from '$lib/server/data';
import { getSessionUser } from '$lib/server/session';
import type { CountryCode } from '$lib/types';

export async function GET({ url }) {
	const productId = url.searchParams.get('productId');
	const country = (url.searchParams.get('country') ?? 'UY') as CountryCode;
	if (!productId) return json({ items: [] });
	const reviews = await getCachedReviews(productId, country);
	return json({ items: reviews }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const { country, productId, score, comment } = body as {
		country?: CountryCode;
		productId?: string;
		score?: number;
		comment?: string;
	};
	if (!country || !productId || typeof score !== 'number') {
		return json({ error: 'missing_params' }, { status: 400 });
	}
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });

	try {
		const review = await insertReview({
			product_id: productId,
			user_id: user.id,
			user_name: user.name,
			score,
			comment,
			country
		});
		invalidateReviews(country, productId);
		return json(review, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return json({ error: (e as Error).message || 'review failed' }, { status: 400 });
	}
}
