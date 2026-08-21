-- Drop the legacy free-text brand column. Products link to distilleries
-- (products.distillery_id, migration 0017) which is now the single source for
-- the producer name shown across the app. Runs once (tracked in schema_migrations).

ALTER TABLE products DROP COLUMN brand;
