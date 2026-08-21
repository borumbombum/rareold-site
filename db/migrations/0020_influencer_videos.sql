-- Influencer/sommelier videos per product per LANGUAGE (replaces country-based
-- product_videos and the global products.video column).
-- Runs once (tracked in schema_migrations).

CREATE TABLE IF NOT EXISTS influencer_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  language TEXT NOT NULL,       -- locale key: 'es', 'en', 'pt', 'ja', 'fr'
  platform TEXT NOT NULL DEFAULT 'youtube',  -- 'youtube' | 'instagram'
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, language, url)
);

CREATE INDEX IF NOT EXISTS idx_influencer_videos_product ON influencer_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_influencer_videos_lang ON influencer_videos(language);

-- Migrate the global product videos as English entries. The early fixed
-- timestamp keeps them first under ORDER BY created_at ASC.
INSERT OR IGNORE INTO influencer_videos (product_id, language, platform, url, label, created_at)
SELECT id, 'en', 'youtube', video, '', '2000-01-01 00:00:00'
FROM products
WHERE video IS NOT NULL AND video != '';

-- Country-based table was never populated; drop it and the global column.
DROP TABLE IF EXISTS product_videos;

ALTER TABLE products DROP COLUMN video;
