-- Merge the two EM&C Pampa records into a single "Pampa Single Malt" product.
-- The old ids are removed; the merged product is upserted by db-sync from the seed.
-- Idempotent (no-op if already applied).

DELETE FROM karma WHERE entity_id IN ('emc-pampa-classic-43', 'emc-pampa-peated-43');
DELETE FROM products WHERE id IN ('emc-pampa-classic-43', 'emc-pampa-peated-43');
