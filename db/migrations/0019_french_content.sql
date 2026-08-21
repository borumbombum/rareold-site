-- French locale columns (task 034). Follows 0010/0015/0016 pattern.
ALTER TABLE products ADD COLUMN name_fr TEXT;
ALTER TABLE products ADD COLUMN description_fr TEXT;

ALTER TABLE origins ADD COLUMN name_fr TEXT;

ALTER TABLE pages ADD COLUMN title_fr TEXT;
ALTER TABLE pages ADD COLUMN body_fr TEXT;

ALTER TABLE distilleries ADD COLUMN name_fr TEXT;
ALTER TABLE distilleries ADD COLUMN description_fr TEXT;
