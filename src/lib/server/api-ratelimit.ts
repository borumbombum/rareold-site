import type { Client } from '@libsql/client';
import { turso } from './turso';
import { listApiIpControls } from './api-ip-controls';

/**
 * Shared in-memory sliding-window rate limiter for the public `/api/v1/public/*` routes,
 * plus admin IP controls (blocked → 403, per-IP limit override) and live usage stats.
 *
 * In-memory state is best-effort on serverless (warm lambdas only), but the
 * blocklist/limits themselves are persisted in Turso (`api_ip_controls`) and cached
 * here for ~60s, so a block survives cold starts and is cheap to check.
 */

export const DEFAULT_LIMIT_PER_MIN = 60;

const WINDOW_MS = 60_000;
const CONTROLS_CACHE_MS = 60_000;

interface Control {
	blocked: boolean;
	limit_per_min: number | null;
}

/** key (ip) → request timestamps within the sliding window. */
const sliding = new Map<string, number[]>();
/** last-minute request count per endpoint (by pathname) for admin stats. */
const endpointHits = new Map<string, number>();
/** last-minute request count per IP for admin stats. */
const ipHits = new Map<string, number>();
let denied429 = 0;

let controlsCache: { at: number; rows: Map<string, Control> } | null = null;

async function controls(db: Client): Promise<Map<string, Control>> {
	const now = Date.now();
	if (controlsCache && now - controlsCache.at < CONTROLS_CACHE_MS) return controlsCache.rows;
	const rows = await listApiIpControls(db);
	const map = new Map<string, Control>();
	for (const r of rows) map.set(r.ip, { blocked: r.blocked, limit_per_min: r.limit_per_min });
	controlsCache = { at: now, rows: map };
	return map;
}

/** Drop the cached controls so admin edits apply immediately. Called by the admin writer. */
export function invalidateControlsCache(): void {
	controlsCache = null;
}

/** Reset in-memory counters + cache. Intended for tests. */
export function resetRateLimits(): void {
	sliding.clear();
	endpointHits.clear();
	ipHits.clear();
	denied429 = 0;
	invalidateControlsCache();
}

export interface ApiUsageStats {
	requestsInWindow: number;
	denied429: number;
	endpoints: { path: string; hits: number }[];
	topIps: { ip: string; hits: number }[];
}

/** Live usage snapshot for `/admin/api`. */
export function getApiUsageStats(): ApiUsageStats {
	let requestsInWindow = 0;
	for (const list of sliding.values()) requestsInWindow += list.length;
	const endpoints = [...endpointHits.entries()]
		.map(([path, hits]) => ({ path, hits }))
		.sort((a, b) => b.hits - a.hits);
	const topIps = [...ipHits.entries()]
		.map(([ip, hits]) => ({ ip, hits }))
		.sort((a, b) => b.hits - a.hits)
		.slice(0, 20);
	return { requestsInWindow, denied429, endpoints, topIps };
}

function prune(key: string, now: number): number[] {
	const list = (sliding.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
	if (list.length === 0) sliding.delete(key);
	else sliding.set(key, list);
	return list;
}

/**
 * Guard for `/api/v1/public/*` handlers. Returns an error Response to return as-is, or
 * `null` to continue. Status: 403 when the IP is blocked, 429 over the limit.
 */
export async function checkApiLimit(
	ip: string,
	endpoint: string,
	db: Client = turso
): Promise<Response | null> {
	const now = Date.now();
	const ipControls = await controls(db);
	const control = ipControls.get(ip);

	if (control?.blocked) {
		return new Response(JSON.stringify({ error: 'blocked' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const limit = control?.limit_per_min && control.limit_per_min > 0 ? control.limit_per_min : DEFAULT_LIMIT_PER_MIN;
	const list = prune(ip, now);
	list.push(now);
	sliding.set(ip, list);

	endpointHits.set(endpoint, (endpointHits.get(endpoint) ?? 0) + 1);
	ipHits.set(ip, (ipHits.get(ip) ?? 0) + 1);

	if (list.length > limit) {
		denied429 += 1;
		return new Response(JSON.stringify({ error: 'rate_limited' }), {
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': String(Math.ceil(WINDOW_MS / 1000))
			}
		});
	}
	return null;
}