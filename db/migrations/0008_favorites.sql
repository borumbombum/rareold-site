-- Favorites: per-user saved products (Turso is the source of truth).
-- product_id = catalog slug (products.id). Idempotent: CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS favorites (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
