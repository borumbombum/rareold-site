import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';

const HTML_LANG: Record<string, string> = {
	es: 'es-UY',
	pt: 'pt-BR',
	en: 'en-US'
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

export const handle: Handle = paraglideHandle;
