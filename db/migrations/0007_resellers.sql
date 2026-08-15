-- Resellers: stores per country (Turso is the source of truth).
-- product_id NULL = country-wide default store list.
-- product_id set = per-product listing (deep link + price) filled later by the price bot / admin.
-- Idempotent: every statement is CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS resellers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	country TEXT NOT NULL CHECK (country IN ('UY', 'BR', 'US')),
	price REAL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	product_id TEXT REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resellers_country ON resellers(country);
