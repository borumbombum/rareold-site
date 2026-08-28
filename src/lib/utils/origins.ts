import originData from '$lib/data/origins.json';
import { getLocale } from '$lib/paraglide/runtime';
import { LOCALE_CONFIG, type LocaleKey } from '$lib/utils/locales';
import { getPinnedOrigins } from '$lib/stores/pinned-origins.svelte';

export interface OriginRow {
	id: string;
	name: string;
	name_es: string | null;
	name_pt: string | null;
	name_en?: string | null;
	name_ja: string | null;
	name_fr?: string | null;
	flag: string;
}

export interface OriginDef {
	key: string;
	flag: string;
}

const ROWS: OriginRow[] = (originData as OriginRow[]).map((o) => ({
	...o,
	name_es: o.name_es ?? null,
	name_pt: o.name_pt ?? null,
	name_en: o.name_en ?? null,
	name_ja: o.name_ja ?? null,
	flag: o.flag || '🌍'
})) as OriginRow[];

export const ORIGINS: OriginDef[] = ROWS.map((o) => ({ key: o.id, flag: o.flag }));

function originNameField(locale: LocaleKey): keyof OriginRow {
	const key = `name_${locale}` as keyof OriginRow;
	if (key in ROWS[0]) return key;
	return 'name';
}

const LOCALE_FIELD: Record<LocaleKey, keyof OriginRow> = Object.fromEntries(
	Object.keys(LOCALE_CONFIG).map((l) => [l, originNameField(l as LocaleKey)])
) as Record<LocaleKey, keyof OriginRow>;

export function originKey(product: { origin?: string | null }): string {
	return (product.origin ?? '').toLowerCase().trim();
}

/** Origins ordered by product count, highest first. */
export function sortOriginsByCount(counts: Record<string, number>): OriginDef[] {
	return [...ORIGINS].sort((a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0));
}

/**
 * Origins ordered for display: "all" first, then the active/navigated origin,
 * then user-pinned origins (by count), then the rest by count.
 */
export function sortOriginsForDisplay(
	counts: Record<string, number>,
	activeOrigin?: string
): OriginDef[] {
	const active = activeOrigin && activeOrigin !== 'all' ? activeOrigin : null;
	const pinned = getPinnedOrigins().filter((k) => k !== active);
	const byCount = sortOriginsByCount(counts);

	const ordered: OriginDef[] = [];
	const seen = new Set<string>(['all']);

	if (active) {
		const row = byCount.find((o) => o.key === active);
		if (row) {
			ordered.push(row);
			seen.add(active);
		}
	}
	for (const key of pinned) {
		const row = byCount.find((o) => o.key === key);
		if (row && !seen.has(key)) {
			ordered.push(row);
			seen.add(key);
		}
	}
	for (const o of byCount) {
		if (!seen.has(o.key)) {
			ordered.push(o);
			seen.add(o.key);
		}
	}
	return ordered;
}

export function originFlag(product: { origin?: string | null }): string {
	return ORIGINS.find((o) => o.key === originKey(product))?.flag ?? '🌍';
}

export function originLabel(key: string): string {
	const row = ROWS.find((o) => o.id === key);
	if (!row) return key;
	const field = LOCALE_FIELD[getLocale() as LocaleKey] ?? 'name';
	const localized = row[field];
	return (typeof localized === 'string' && localized) || row.name;
}

export function regionsByOrigin(
	whiskies: { origin?: string | null; region?: string | null }[]
): Record<string, string[]> {
	const map: Record<string, string[]> = {};
	for (const w of whiskies) {
		const key = originKey(w);
		if (!w.region) continue;
		if (!map[key]) map[key] = [];
		if (!map[key].includes(w.region)) map[key].push(w.region);
	}
	for (const key of Object.keys(map)) map[key].sort((a, b) => a.localeCompare(b));
	return map;
}

function slugify(str: string): string {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function originSlug(id: string, locale: string): string {
	const row = ROWS.find((o) => o.id === id);
	if (!row) return id;
	const field = LOCALE_FIELD[locale as LocaleKey] ?? 'name';
	const name = row[field] || row.name;
	return slugify(String(name));
}

const SLUG_TO_ID = new Map<string, string>();
for (const row of ROWS) {
	for (const locale of Object.keys(LOCALE_CONFIG) as LocaleKey[]) {
		const field = LOCALE_FIELD[locale] ?? 'name';
		const name = row[field] || row.name;
		SLUG_TO_ID.set(slugify(String(name)), row.id);
	}
}

export function resolveOriginSlug(slug: string): string | null {
	return SLUG_TO_ID.get(slug) ?? null;
}
