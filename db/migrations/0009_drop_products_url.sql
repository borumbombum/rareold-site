-- Drop the legacy products.url column: it held external store deep links (e.g. alambique)
-- that the frontend never uses. Buy links come from the resellers table; the product's
-- own page URL is derived from its slug. SQLite supports DROP COLUMN since 3.35+ (libSQL/Turso).

ALTER TABLE products DROP COLUMN url;
