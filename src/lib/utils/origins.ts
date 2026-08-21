import originData from '$lib/data/origins.json';
import { getLocale } from '$lib/paraglide/runtime';
import { LOCALE_CONFIG, type LocaleKey } from '$lib/utils/locales';

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

const KNOWN = new Set(ORIGINS.map((o) => o.key));

function originNameField(locale: LocaleKey): keyof OriginRow {
	const key = `name_${locale}` as keyof OriginRow;
	if (key in ROWS[0]) return key;
	return 'name';
}

const LOCALE_FIELD: Record<LocaleKey, keyof OriginRow> = Object.fromEntries(
	Object.keys(LOCALE_CONFIG).map((l) => [l, originNameField(l as LocaleKey)])
) as Record<LocaleKey, keyof OriginRow>;

export function originKey(product: { origin?: string | null }): string {
	const key = (product.origin ?? '').toLowerCase().trim();
	return KNOWN.has(key) ? key : 'other';
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
