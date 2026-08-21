-- Distillery/brand entity (task 039): products get linked via distillery_id.
-- Brand-string cleanup below is one-time and idempotent: corrupted brands ->
-- canonical names. Product->distillery links are carried by the seed inserts
-- (db-sync) rather than here, because the distilleries rows do not exist yet
-- when migrations run.

CREATE TABLE IF NOT EXISTS distilleries (
	id TEXT PRIMARY KEY,
	slug TEXT UNIQUE,
	name TEXT NOT NULL,
	name_es TEXT,
	name_pt TEXT,
	name_en TEXT,
	name_ja TEXT,
	description TEXT,
	description_es TEXT,
	description_pt TEXT,
	description_en TEXT,
	description_ja TEXT,
	country TEXT,
	region TEXT,
	founded INTEGER,
	image TEXT,
	website TEXT,
	latitude REAL,
	longitude REAL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

ALTER TABLE products ADD COLUMN distillery_id TEXT REFERENCES distilleries(id);

CREATE INDEX IF NOT EXISTS idx_products_distillery ON products(distillery_id);

-- One-time brand normalization: HTML entities, truncation artifacts, typos.
UPDATE products SET brand = 'An Cnoc' WHERE brand = 'An';
UPDATE products SET brand = 'Catto''s' WHERE brand = 'Catto&#8217;s';
UPDATE products SET brand = 'Cu Bocan' WHERE brand = 'Cu';
UPDATE products SET brand = 'Elijah Craig' WHERE brand IN ('Elijah', 'Elijh');
UPDATE products SET brand = 'Evan Williams' WHERE brand = 'Evan';
UPDATE products SET brand = 'Hankey Bannister' WHERE brand = 'Hankey';
UPDATE products SET brand = 'Isle of Jura' WHERE brand IN ('Isle', 'Jura');
UPDATE products SET brand = 'Lost Irish' WHERE brand = 'Lost';
UPDATE products SET brand = 'MacArthur''s' WHERE brand = 'MacArthur&#8217;s';
UPDATE products SET brand = 'Old Ballantruan' WHERE id LIKE 'old-ballantruan%';
UPDATE products SET brand = 'Old Pulteney' WHERE id LIKE 'old-pulteney%';
UPDATE products SET brand = 'Rittenhouse' WHERE brand = 'Whisky';
UPDATE products SET brand = 'The Irishman' WHERE brand = 'Irishman';
UPDATE products SET brand = 'West Cork' WHERE brand = 'West';
UPDATE products SET brand = 'Casanegra' WHERE brand = 'The Williams Casanegra';
