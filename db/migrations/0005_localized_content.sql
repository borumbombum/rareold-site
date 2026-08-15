-- Locale-specific display content. Base fields remain the fallback:
--   * origins.name    -> canonical English name
--   * products.name   -> base locale (es) name
--   * products.description -> base locale (es) description
-- Overrides are added per locale (name_es/name_pt for origins, name_pt/description_pt for products).
-- Runs once (tracked in schema_migrations).

ALTER TABLE origins ADD COLUMN name_es TEXT;
ALTER TABLE origins ADD COLUMN name_pt TEXT;
ALTER TABLE products ADD COLUMN name_pt TEXT;
ALTER TABLE products ADD COLUMN description_pt TEXT;
