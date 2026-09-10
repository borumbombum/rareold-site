import type { Client } from '@libsql/client';
import { turso } from './turso';

/** Country where store system operates (Turso `store_countries`). */
export interface StoreCountryRow {
	code: string;
	name: string;
	currency: string;
	sort_order: number;
	active: boolean;
	store_count?: number;
}

export interface StoreCountryInput {
	code: string;
	name: string;
	currency: string;
	sort_order?: number;
	active?: boolean;
}

/** Retail store per country (Turso `stores`). */
export interface StoreRow {
	id: string;
	store_country_code: string;
	name: string;
	url: string;
	logo_url: string | null;
	sort_order: number;
}

export interface StoreInput {
	id: string;
	store_country_code: string;
	name: string;
	url: string;
	logo_url?: string | null;
	sort_order?: number;
}

/** Per-product deep affiliate link override (Turso `product_stores`). */
export interface ProductStoreRow {
	product_id: string;
	store_id: string;
	url: string | null;
	price: number | null;
	store_name?: string;
	store_country_code?: string;
}

export interface ProductStoreInput {
	product_id: string;
	store_id: string;
	url?: string | null;
	price?: number | null;
}

/** Country used when the visitor's own country has no configured stores. */
export const FALLBACK_COUNTRY = 'EN';

export async function listStoreCountries(db: Client = turso): Promise<StoreCountryRow[]> {
	const res = await db.execute(`
		SELECT c.code, c.name, c.currency, c.sort_order, c.active,
		       (SELECT COUNT(*) FROM stores s WHERE s.store_country_code = c.code) AS store_count
		FROM store_countries c
		ORDER BY c.sort_order, c.name COLLATE NOCASE
	`);
	return res.rows.map((r) => ({
		code: String(r.code),
		name: String(r.name),
		currency: String(r.currency),
		sort_order: Number(r.sort_order ?? 0),
		active: Number(r.active ?? 0) === 1,
		store_count: Number(r.store_count ?? 0)
	}));
}

export async function upsertStoreCountry(input: StoreCountryInput, db: Client = turso): Promise<void> {
	const code = input.code.toUpperCase();
	await db.execute(
		`INSERT INTO store_countries (code, name, currency, sort_order, active)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(code) DO UPDATE SET
			name = excluded.name,
			currency = excluded.currency,
			sort_order = excluded.sort_order,
			active = excluded.active`,
		[
			code,
			input.name,
			input.currency,
			Number.isFinite(input.sort_order as number) ? Math.trunc(input.sort_order as number) : 0,
			input.active === false ? 0 : 1
		]
	);
}

/** Delete a store country unless stores still reference it. */
export async function deleteStoreCountry(
	code: string,
	db: Client = turso
): Promise<{ ok: true } | { ok: false; reason: 'stores' }> {
	const res = await db.execute('SELECT COUNT(*) AS n FROM stores WHERE store_country_code = ?', [code]);
	if (Number(res.rows[0].n) > 0) return { ok: false, reason: 'stores' };
	await db.execute('DELETE FROM store_countries WHERE code = ?', [code]);
	return { ok: true };
}

export async function listStores(countryCode: string | null, db: Client = turso): Promise<StoreRow[]> {
	const sql = `SELECT id, store_country_code, name, url, logo_url, sort_order FROM stores
		${countryCode ? 'WHERE store_country_code = ?' : ''}
		ORDER BY store_country_code, sort_order, name COLLATE NOCASE`;
	const res = countryCode
		? await db.execute(sql, [countryCode])
		: await db.execute(sql);
	return res.rows.map((r) => ({
		id: String(r.id),
		store_country_code: String(r.store_country_code),
		name: String(r.name),
		url: String(r.url),
		logo_url: (r.logo_url as string | null) ?? null,
		sort_order: Number(r.sort_order ?? 0)
	}));
}

export async function upsertStore(input: StoreInput, db: Client = turso): Promise<void> {
	await db.execute(
		`INSERT INTO stores (id, store_country_code, name, url, logo_url, sort_order)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			store_country_code = excluded.store_country_code,
			name = excluded.name,
			url = excluded.url,
			logo_url = excluded.logo_url,
			sort_order = excluded.sort_order`,
		[
			input.id,
			input.store_country_code,
			input.name,
			input.url,
			input.logo_url || null,
			Number.isFinite(input.sort_order as number) ? Math.trunc(input.sort_order as number) : 0
		]
	);
}

/** Delete a store unless product_stores rows still reference it. */
export async function deleteStore(
	id: string,
	db: Client = turso
): Promise<{ ok: true } | { ok: false; reason: 'products' }> {
	const res = await db.execute('SELECT COUNT(*) AS n FROM product_stores WHERE store_id = ?', [id]);
	if (Number(res.rows[0].n) > 0) return { ok: false, reason: 'products' };
	await db.execute('DELETE FROM stores WHERE id = ?', [id]);
	return { ok: true };
}

/** Resolve the effective store list for a product + visitor country.
 *  Falls back to FALLBACK_COUNTRY when the country has no active stores. */
export async function getStoresForProduct(
	productId: string | null,
	countryCode: string | null,
	db: Client = turso
): Promise<{ country: string; currency: string; stores: StoreRow[] }> {
	const pick = async (code: string) => {
		const countryRes = await db.execute(
			'SELECT currency FROM store_countries WHERE code = ? AND active = 1',
			[code]
		);
		if (countryRes.rows.length === 0) return null;
		const currency = String(countryRes.rows[0].currency);
		const storesRes = await db.execute(
			`SELECT s.id, s.name, s.url, s.logo_url,
			        ps.url AS override_url, ps.price AS override_price
			 FROM stores s
			 LEFT JOIN product_stores ps
			        ON ps.store_id = s.id AND ps.product_id = ?
			 WHERE s.store_country_code = ?
			 ORDER BY s.sort_order, s.name COLLATE NOCASE`,
			[productId, code]
		);
		const stores = storesRes.rows.map((r) => ({
			id: String(r.id),
			store_country_code: code,
			name: String(r.name),
			url: String(r.override_url ?? r.url),
			logo_url: (r.logo_url as string | null) ?? null,
			sort_order: Number(r.sort_order ?? 0),
			price: r.override_price == null ? null : Number(r.override_price)
		}));
		return { country: code, currency, stores };
	};

	const wanted = countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : FALLBACK_COUNTRY;
	const direct = await pick(wanted);
	if (direct && direct.stores.length > 0) return direct;

	// Visitor's country has no configured stores (not registered, or registered but empty):
	// fall back to the English store country. When that country row is absent, still report
	// EN as the effective country so the UI never silently reports ''.
	const fallback = await pick(FALLBACK_COUNTRY);
	if (fallback && fallback.stores.length > 0) return fallback;
	return { country: FALLBACK_COUNTRY, currency: fallback?.currency ?? 'USD', stores: [] };
}

export async function listProductStores(productId: string, db: Client = turso): Promise<ProductStoreRow[]> {
	const res = await db.execute(
		`SELECT ps.product_id, ps.store_id, ps.url, ps.price,
		        s.name AS store_name, s.store_country_code
		 FROM product_stores ps
		 JOIN stores s ON s.id = ps.store_id
		 WHERE ps.product_id = ?
		 ORDER BY s.store_country_code, s.sort_order, s.name COLLATE NOCASE`,
		[productId]
	);
	return res.rows.map((r) => ({
		product_id: String(r.product_id),
		store_id: String(r.store_id),
		url: (r.url as string | null) ?? null,
		price: r.price == null ? null : Number(r.price),
		store_name: String(r.store_name),
		store_country_code: String(r.store_country_code)
	}));
}

export async function upsertProductStore(input: ProductStoreInput, db: Client = turso): Promise<void> {
	await db.execute(
		`INSERT INTO product_stores (product_id, store_id, url, price)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(product_id, store_id) DO UPDATE SET
			url = excluded.url,
			price = excluded.price`,
		[input.product_id, input.store_id, input.url || null, input.price ?? null]
	);
}

export async function deleteProductStore(
	productId: string,
	storeId: string,
	db: Client = turso
): Promise<void> {
	await db.execute('DELETE FROM product_stores WHERE product_id = ? AND store_id = ?', [
		productId,
		storeId
	]);
}