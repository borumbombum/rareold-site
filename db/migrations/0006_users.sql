-- Users table for own Google auth (task 002).
-- Idempotent: every statement is CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,          -- Google sub (or 'demo' for demo login)
	email TEXT NOT NULL,
	name TEXT NOT NULL DEFAULT '',
	avatar TEXT NOT NULL DEFAULT '',
	role TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin' (admin section, task 003)
	login_type TEXT NOT NULL DEFAULT 'google',  -- 'google' | 'mock'
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
