-- Unify voting: star reviews become the single ranking system.
-- Add unique constraint: one review per user per product.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
  ON reviews(user_id, product_id);

-- Materialized rating view for fast lookups.
CREATE VIEW IF NOT EXISTS product_ratings AS
SELECT product_id,
       ROUND(AVG(score), 1) AS avg_rating,
       COUNT(*) AS review_count
FROM reviews
GROUP BY product_id;
