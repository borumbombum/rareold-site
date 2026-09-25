import { WHISKIES } from '$lib/data/whiskies';
import { DISTILLERIES } from '$lib/data/distilleries';
import originData from '$lib/data/origins.json';
import { LOCALES, type LocaleKey } from '$lib/utils/locales';
import type { Whisky, Distillery } from '$lib/types';

function originKeyOf(w: { origin?: string | null }): string {
	return (w.origin ?? '').toLowerCase().trim();
}

/**
 * Serializers for the public read-only API (`/api/v1/public/*`). The API resolves
 * localized fields from the `?lang=` param (default `en`), independent of the
 * UI's per-request paraglide locale, since `/api/v1/public/*` sits outside the
 * localized catch-all.
 */

export type ApiLocale = (typeof LOCALES)[number];

export function resolveLang(lang: unknown): ApiLocale {
	const l = String(lang ?? '').trim().toLowerCase();
	return (LOCALES as string[]).includes(l) ? (l as ApiLocale) : 'en';
}

/** Mirrors `l10n()`: prefer `<field>_<locale>`, fall back to the base field. */
function localized(
	item: Record<string, unknown> | null | undefined,
	field: string,
	lang: ApiLocale
): string | null {
	if (!item) return null;
	const value = item[`${field}_${lang}`];
	if (typeof value === 'string' && value.trim() !== '') return value;
	const base = item[field];
	return typeof base === 'string' && base.trim() !== '' ? base : null;
}

const ORIGINS = originData as { id: string; name: string; flag: string; name_es?: string | null; name_pt?: string | null; name_ja?: string | null; name_fr?: string | null }[];

export function serializeOrigin(o: (typeof ORIGINS)[number], lang: ApiLocale) {
	return {
		id: o.id,
		name: localized(o as unknown as Record<string, unknown>, 'name', lang) ?? o.name,
		flag: o.flag ?? null
	};
}

const DISTILLERY_BY_ID = new Map<string, Distillery>(DISTILLERIES.map((d) => [d.id, d]));

export function getDistillery(id: string | null | undefined): Distillery | null {
	return id ? (DISTILLERY_BY_ID.get(id) ?? null) : null;
}

export function serializeDistillery(d: Distillery | null, lang: ApiLocale) {
	if (!d) return null;
	return {
		id: d.id,
		slug: d.slug,
		name: localized(d as unknown as Record<string, unknown>, 'name', lang) ?? d.name,
		description: localized(d as unknown as Record<string, unknown>, 'description', lang) ?? d.description,
		country: d.country,
		region: d.region,
		founded: d.founded,
		image: d.image,
		website: d.website,
		latitude: d.latitude,
		longitude: d.longitude
	};
}

export interface ApiWhisky {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	image: string | null;
	images: string[];
	origin: { id: string; name: string; flag: string | null };
	region: string | null;
	age: number | null;
	volume: string | null;
	abv: number | null;
	cask: string | null;
	distillery: ReturnType<typeof serializeDistillery>;
	videos: Whisky['videos'];
}

export function serializeWhisky(w: Whisky, lang: ApiLocale): ApiWhisky {
	const origin = ORIGINS.find((o) => o.id === originKeyOf(w));
	return {
		id: w.id,
		slug: w.slug,
		name: localized(w as unknown as Record<string, unknown>, 'name', lang) ?? w.name,
		description: localized(w as unknown as Record<string, unknown>, 'description', lang) ?? w.description,
		image: w.image,
		images: w.images?.length ? w.images : w.image ? [w.image] : [],
		origin: {
			id: origin?.id ?? originKeyOf(w),
			name: origin ? (localized(origin as unknown as Record<string, unknown>, 'name', lang) ?? origin.name) : originKeyOf(w),
			flag: origin?.flag ?? null
		},
		region: w.region,
		age: w.age,
		volume: w.volume,
		abv: w.abv,
		cask: w.cask,
		distillery: serializeDistillery(DISTILLERY_BY_ID.get(w.distillery_id ?? '') ?? null, lang),
		videos: w.videos ?? []
	};
}

/** `country` filter: matches the origin id (e.g. `scotland`) or distillery country, case-insensitive. */
export function matchesCountry(w: Whisky, country: string): boolean {
	const c = country.toLowerCase().trim();
	if (!c) return true;
	if (originKeyOf(w).toLowerCase() === c) return true;
	const distillery = DISTILLERY_BY_ID.get(w.distillery_id ?? '');
	if (distillery?.country && distillery.country.toLowerCase() === c) return true;
	return false;
}

/** `distillery` filter: matches id or slug, case-insensitive. */
export function matchesDistillery(w: Whisky, distillery: string): boolean {
	const q = distillery.toLowerCase().trim();
	if (!q) return true;
	const d = DISTILLERY_BY_ID.get(w.distillery_id ?? '');
	return (
		(w.distillery_id ?? '').toLowerCase() === q ||
		Boolean(d && d.slug && d.slug.toLowerCase() === q)
	);
}

/** `q` filter: substring match against base + localized name/description. */
export function matchesQuery(w: Whisky, q: string): boolean {
	const needle = q.toLowerCase().trim();
	if (!needle) return true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const row = w as any;
	const haystack = [row.name, row.name_en, row.name_es, row.name_pt, row.name_ja, row.name_fr, row.description, row.description_en, row.description_es, row.description_pt, row.description_ja, row.description_fr]
		.filter((v): v is string => typeof v === 'string')
		.join(' ')
		.toLowerCase();
	return haystack.includes(needle);
}

export interface WhiskyFilter {
	country?: string;
	distillery?: string;
	q?: string;
}

export function filterWhiskies(f: WhiskyFilter, lang: ApiLocale): ApiWhisky[] {
	return WHISKIES.filter(
		(w) => matchesCountry(w, f.country ?? '') && matchesDistillery(w, f.distillery ?? '') && matchesQuery(w, f.q ?? '')
	).map((w) => serializeWhisky(w, lang));
}

export function findWhisky(slug: string, lang: ApiLocale): ApiWhisky | null {
	const w = WHISKIES.find((x) => x.slug === slug || x.id === slug);
	return w ? serializeWhisky(w, lang) : null;
}

export function listOrigins(lang: ApiLocale) {
	return ORIGINS.map((o) => serializeOrigin(o, lang));
}

export function listDistilleries(lang: ApiLocale) {
	const rows = DISTILLERIES.map((d) => serializeDistillery(d, lang));
	return rows.filter((x): x is NonNullable<typeof x> => x !== null);
}