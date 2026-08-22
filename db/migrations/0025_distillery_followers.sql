-- Distillery follows (049): per-user followed distilleries, mirrors favorites.
CREATE TABLE IF NOT EXISTS distillery_followers (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	distillery_id TEXT NOT NULL REFERENCES distilleries(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	PRIMARY KEY (user_id, distillery_id)
);

CREATE INDEX IF NOT EXISTS idx_distillery_followers_user ON distillery_followers(user_id);
