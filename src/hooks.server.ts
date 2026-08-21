import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { LOCALE_CONFIG } from '$lib/utils/locales';

const HTML_LANG = Object.fromEntries(
	Object.entries(LOCALE_CONFIG).map(([k, v]) => [k, v.bcp47])
) as Record<string, string>;

/** Legacy `/en/...` URLs (English was prefixed before 032) → unprefixed equivalent. */
const legacyEnRedirect: Handle = ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname === '/en' || pathname.startsWith('/en/')) {
		const target = (pathname.slice(3) || '/') + event.url.search;
		return new Response(null, { status: 301, headers: { location: target } });
	}
	return resolve(event);
};

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		event.locals.locale = locale;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html
					.replace('%lang%', HTML_LANG[locale] ?? locale)
					.replace('%dir%', getTextDirection(locale));
			}
		});
	});

export const handle: Handle = sequence(legacyEnRedirect, paraglideHandle);
