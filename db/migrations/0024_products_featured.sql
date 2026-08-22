-- Editor's-picks flag (048): homepage Featured section renders up to 4.
ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
