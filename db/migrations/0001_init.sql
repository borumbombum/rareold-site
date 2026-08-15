-- Initial schema: catalog data mirrored from src/lib/data/*.json at build time.
-- Idempotent: every statement is CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS origins (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
	id TEXT PRIMARY KEY,
	origin_id TEXT NOT NULL REFERENCES origins(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	brand TEXT NOT NULL,
	description TEXT,
	image TEXT,
	origin_id TEXT REFERENCES origins(id),
	region_id TEXT REFERENCES regions(id),
	age INTEGER,
	volume TEXT,
	abv REAL,
	cask TEXT,
	url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_categories (
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
	PRIMARY KEY (product_id, category_id)
);

-- Live scoring (task 2: fetched at runtime, updated on vote/comment).

CREATE TABLE IF NOT EXISTS karma (
	entity_id TEXT PRIMARY KEY,
	karma INTEGER NOT NULL DEFAULT 0,
	vote_count INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT
);

CREATE TABLE IF NOT EXISTS votes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entity_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	country TEXT NOT NULL,
	value INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE (entity_id, user_id, country)
);

CREATE TABLE IF NOT EXISTS reviews (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	user_id TEXT,
	user_name TEXT,
	score REAL NOT NULL,
	comment TEXT,
	country TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
