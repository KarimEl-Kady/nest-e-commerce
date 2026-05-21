-- Add search vector column
ALTER TABLE "products" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_products_search ON "products" USING GIN("search_vector");

-- Create trigger function to auto-update search vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger AS $$
begin
  new."search_vector" :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON "products" FOR EACH ROW EXECUTE PROCEDURE products_search_trigger();

-- Backfill existing products (if any)
UPDATE "products" SET "search_vector" =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');
