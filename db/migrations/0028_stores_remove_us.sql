-- Stores system (078): drop the redundant United States store country.
-- Per product-team decision: one store country per language; English (EN) covers
-- the en locale and is the fallback for visitors without a matched store country.
-- US added nothing — it had no stores and duplicated EN's role.
DELETE FROM store_countries WHERE code = 'US';