-- Videos: play button + future per-country sommelier videos section.
-- Adds a nullable video URL (YouTube/Instagram/direct file) to products.
-- NOT idempotent by design: db-sync runs each migration file exactly once
-- (tracked in the schema_migrations table).

ALTER TABLE products ADD COLUMN video TEXT;
