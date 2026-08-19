CREATE TABLE IF NOT EXISTS product_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  country TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, country, url)
);

CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);
