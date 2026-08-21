import { json } from '@sveltejs/kit';
import { insertReview } from '$lib/server/reviews';
import { getReviews as getCachedReviews, invalidateReviews, invalidateRating } from '$lib/server/data';
import { getSessionUser } from '$lib/server/session';
import type { CountryCode } from '$lib/types';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET({ url }) {
	const productId = url.searchParams.get('productId');
	const country = (url.searchParams.get('country') ?? 'UY') as CountryCode;
	if (!productId) return json({ items: [] });
	const reviews = await getCachedReviews(productId, country);
	return json({ items: reviews }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST({ request, cookies }) {
	let body: FormData;
	try {
		body = await request.formData();
	} catch {
		return json({ error: 'missing_params' }, { status: 400 });
	}

	const country = body.get('country') as CountryCode | null;
	const productId = (body.get('productId') as string | null)?.trim() || null;
	const score = Number(body.get('score'));
	const comment = ((body.get('comment') as string | null) ?? '').trim();
	const latRaw = body.get('lat');
	const lngRaw = body.get('lng');
	const file = body.get('image');

	if (!country || !productId || !Number.isFinite(score)) {
		return json({ error: 'missing_params' }, { status: 400 });
	}
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });

	let image: { data: Buffer; type: string } | null = null;
	if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
		if (!IMAGE_TYPES.has(file.type)) return json({ error: 'bad_image_type' }, { status: 400 });
		if (file.size > MAX_IMAGE_BYTES) return json({ error: 'image_too_large' }, { status: 400 });
		image = { data: Buffer.from(await file.arrayBuffer()), type: file.type };
	}
	const lat = latRaw != null ? Number(latRaw) : NaN;
	const lng = lngRaw != null ? Number(lngRaw) : NaN;

	try {
		const review = await insertReview({
			product_id: productId,
			user_id: user.id,
			user_name: user.name,
			score,
			comment,
			country,
			image,
			lat: Number.isFinite(lat) ? lat : null,
			lng: Number.isFinite(lng) ? lng : null
		});
		invalidateReviews(country, productId);
		invalidateRating();
		return json(review, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return json({ error: (e as Error).message || 'review failed' }, { status: 400 });
	}
}
