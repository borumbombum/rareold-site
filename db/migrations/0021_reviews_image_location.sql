-- Reviews can carry an optional experience photo (stored as BLOB, served via
-- /api/reviews/[id]/image with 30-day immutable caching) and the geographic
-- location where the tasting happened.
ALTER TABLE reviews ADD COLUMN image BLOB;
ALTER TABLE reviews ADD COLUMN image_type TEXT;
ALTER TABLE reviews ADD COLUMN lat REAL;
ALTER TABLE reviews ADD COLUMN lng REAL;
