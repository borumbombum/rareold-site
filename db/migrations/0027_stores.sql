-- Stores system (078): self-contained, unrelated to product origins.
-- store_countries = where a visitor is from / where retail stores operate.
-- stores = retail affiliate stores per country.
-- product_stores = optional per-product deep affiliate links (product + store -> custom url + price).
-- Replaces the old resellers table (dropped here after data moves to the new tables).
-- Idempotent: every statement is CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS store_countries (
	code TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	currency TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stores (
	id TEXT PRIMARY KEY,
	store_country_code TEXT NOT NULL REFERENCES store_countries(code),
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	logo_url TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stores_country ON stores(store_country_code);

CREATE TABLE IF NOT EXISTS product_stores (
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
	url TEXT,
	price REAL,
	PRIMARY KEY (product_id, store_id)
);

DROP TABLE IF EXISTS resellers;
