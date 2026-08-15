import originData from '$lib/data/origins.json';
import { getLocale } from '$lib/paraglide/runtime';

export interface OriginRow {
	id: string;
	name: string;
	name_es: string | null;
	name_pt: string | null;
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
	flag: o.flag || '🌍'
}));

export const ORIGINS: OriginDef[] = ROWS.map((o) => ({ key: o.id, flag: o.flag }));

const KNOWN = new Set(ORIGINS.map((o) => o.key));

const LOCALE_FIELD: Record<string, 'name_es' | 'name_pt'> = {
	es: 'name_es',
	pt: 'name_pt'
};

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
	const field = LOCALE_FIELD[getLocale()];
	const localized = field ? row[field] : null;
	return localized || row.name;
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
