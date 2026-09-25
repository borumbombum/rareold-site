CREATE TABLE IF NOT EXISTS api_ip_controls (
  ip            TEXT PRIMARY KEY,
  blocked       INTEGER NOT NULL DEFAULT 0,
  limit_per_min INTEGER,
  reason        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);