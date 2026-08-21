import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const locale = (locals.locale ?? 'en') as Locale;
	redirect(301, localizeHref(`/user/${params.userId}`, { locale }));
};
