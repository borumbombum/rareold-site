CREATE TABLE IF NOT EXISTS download_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token_hash TEXT,
  expires_at TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_download_requests_email ON download_requests(email);
CREATE INDEX IF NOT EXISTS idx_download_requests_token ON download_requests(token_hash);
