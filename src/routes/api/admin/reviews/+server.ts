import { json } from '@sveltejs/kit';
import { getAdmin, listReviews, deleteReview } from '$lib/server/admin';

export async function GET({ cookies, url }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const q = url.searchParams.get('q') ?? '';
	const country = url.searchParams.get('country') ?? '';
	const reviews = await listReviews({
		q: q.trim() || undefined,
		country: country.trim() || undefined
	});
	return json({ reviews });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'missing_required' }, { status: 400 });
	try {
		await deleteReview(id);
		return json({ ok: true });
	} catch (e) {
		return json({ error: (e as Error).message || 'delete failed' }, { status: 400 });
	}
}
