import { error } from '@sveltejs/kit';
import { getPageBySlug } from '$lib/server/pages';
import { l10n } from '$lib/utils/l10n';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	const locale = locals.locale ?? 'es';
	const page = await getPageBySlug(params.slug);
	if (!page) throw error(404, 'Page not found');
	return {
		title: l10n(page, 'title') ?? page.title,
		body: l10n(page, 'body') ?? page.body
	};
};
