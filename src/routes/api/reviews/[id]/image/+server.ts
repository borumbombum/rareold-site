import { error } from '@sveltejs/kit';
import { getReviewImage } from '$lib/server/reviews';

const CACHE = 'public, max-age=2592000, immutable';

export async function GET({ params }) {
	const image = await getReviewImage(params.id);
	if (!image) throw error(404, 'Not found');
	return new Response(new Uint8Array(image.data), {
		headers: { 'Content-Type': image.type, 'Cache-Control': CACHE }
	});
}
