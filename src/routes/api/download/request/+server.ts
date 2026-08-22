import { json, error } from '@sveltejs/kit';
import { createDownloadRequest } from '$lib/server/downloads';
import type { RequestHandler } from './$types';

export const prerender = false;

// naive in-memory rate limit (best effort on serverless, deters naive abuse)
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function limited(key: string): boolean {
	const now = Date.now();
	const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
	list.push(now);
	hits.set(key, list);
	return list.length > MAX_PER_WINDOW;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = await request.json().catch(() => ({}));
	const email = String((body as { email?: unknown }).email ?? '').trim();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error(400, 'invalid_email');
	if (limited(getClientAddress())) throw error(429, 'too_many_requests');
	await createDownloadRequest(email);
	return json({ ok: true });
};
