-- English canonical-name override for origins (045): empty falls back to base `name`.
ALTER TABLE origins ADD COLUMN name_en TEXT;
