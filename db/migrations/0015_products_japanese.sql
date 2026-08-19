-- Add Japanese locale columns for product and origin content.

ALTER TABLE products ADD COLUMN name_ja TEXT;
ALTER TABLE products ADD COLUMN description_ja TEXT;
ALTER TABLE origins ADD COLUMN name_ja TEXT;
