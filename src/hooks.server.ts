import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { LOCALE_CONFIG } from '$lib/utils/locales';

const HTML_LANG = Object.fromEntries(
	Object.entries(LOCALE_CONFIG).map(([k, v]) => [k, v.bcp47])
) as Record<string, string>;

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

export const handle: Handle = paraglideHandle;
