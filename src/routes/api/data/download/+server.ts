import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { localizeHref } from '$lib/paraglide/runtime';
import { consumeDownloadToken } from '$lib/server/downloads';
import { buildSqliteDump } from '$lib/server/dbfile';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');
	const back = (suffix: string) => localizeHref(`/download${suffix}`);
	if (!token) throw redirect(302, back(''));

	const result = await consumeDownloadToken(token);
	if (!result.ok) {
		if (dev) console.warn('[download] rejected token:', result.reason);
		throw redirect(302, back('?e=1'));
	}

	const db = await buildSqliteDump();
	return new Response(db as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/vnd.sqlite3',
			'Content-Disposition': `attachment; filename="oldrare-${new Date().toISOString().slice(0, 10)}.db"`,
			'Cache-Control': 'no-store'
		}
	});
};
