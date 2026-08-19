-- Add English locale columns for product content.
-- Origins already have an implicit English name in the `name` column.

ALTER TABLE products ADD COLUMN name_en TEXT;
ALTER TABLE products ADD COLUMN description_en TEXT;
