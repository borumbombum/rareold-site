-- Product galleries (097): any number of images per product, ordered by position.
-- products.image stays as the primary/fallback; product_images mirrors it (position 0)
-- and holds any additional URLs. Idempotent.

CREATE TABLE IF NOT EXISTS product_images (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	position INTEGER NOT NULL DEFAULT 0,
	url TEXT NOT NULL,
	alt TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);

-- Unique (product_id, position) so bootstrap uses INSERT OR IGNORE as a true
-- dedupe (a plain index would let duplicate rows slip through).
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_unique ON product_images(product_id, position);

-- Bootstrap: copy the current single product image into the table as position 0.
INSERT OR IGNORE INTO product_images (product_id, position, url, alt, created_at)
SELECT id, 0, image, '', datetime('now')
FROM products
WHERE image IS NOT NULL AND image != '';