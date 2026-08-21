import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { LOCALE_CONFIG, LOCALES, type LocaleKey } from '$lib/utils/locales';
import { isBot, localeForCountry, resolveCountry } from '$lib/server/geo';

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

const DETECTED_COOKIE = 'rareold.detected_lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function detectedCookie(value: string): string {
	const parts = [
		`${DETECTED_COOKIE}=${value}`,
		'Path=/',
		`Max-Age=${COOKIE_MAX_AGE}`,
		'SameSite=Lax',
		'HttpOnly'
	];
	if (!dev) parts.push('Secure');
	return parts.join('; ');
}

function localeFromPath(pathname: string): LocaleKey | null {
	for (const l of LOCALES) {
		const p = LOCALE_CONFIG[l].path;
		if (p && (pathname === p || pathname.startsWith(p + '/'))) return l;
	}
	return null;
}

function clientIp(event: RequestEvent): string {
	try {
		return event.getClientAddress();
	} catch {
		const fwd = event.request.headers.get('x-forwarded-for');
		return fwd ? fwd.split(',')[0].trim() : '';
	}
}

/** IP-based language suggestion: first-time visitors on the exact root get a
 *  302 to their closest locale. Deep links, bots and returning visitors are
 *  never touched. Failures silently stay on English `/`. */
const geoHandle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Landing on any prefixed locale path records the choice — manual choice always wins.
	const prefixed = localeFromPath(pathname);
	if (prefixed) {
		if (!event.cookies.get(DETECTED_COOKIE)) {
			event.cookies.set(DETECTED_COOKIE, prefixed, {
				path: '/',
				maxAge: COOKIE_MAX_AGE,
				sameSite: 'lax',
				httpOnly: true,
				secure: !dev
			});
		}
		return resolve(event);
	}

	// Detection only ever considers the exact root.
	if (pathname !== '/' || event.request.method !== 'GET') return resolve(event);

	if (isBot(event.request.headers.get('user-agent'))) return resolve(event);

	let target: LocaleKey | null = null;
	const forced = event.url.searchParams.get('lang');
	if (forced && forced in LOCALE_CONFIG) {
		// Dev/testing override: force the outcome without geolocation.
		target = forced as LocaleKey;
	} else {
		if (event.cookies.get(DETECTED_COOKIE) || event.cookies.get('PARAGLIDE_LOCALE')) {
			return resolve(event);
		}
		const country = await resolveCountry(clientIp(event));
		target = country ? localeForCountry(country) : null;
	}

	if (!target || target === 'en') {
		event.cookies.set(DETECTED_COOKIE, 'en', {
			path: '/',
			maxAge: COOKIE_MAX_AGE,
			sameSite: 'lax',
			httpOnly: true,
			secure: !dev
		});
		return resolve(event);
	}

	return new Response(null, {
		status: 302,
		headers: {
			location: `${LOCALE_CONFIG[target].path}/`,
			'set-cookie': detectedCookie(target)
		}
	});
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

export const handle: Handle = sequence(legacyEnRedirect, geoHandle, paraglideHandle);
