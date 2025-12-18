-- Add unique constraint on backlinks for upsert functionality
-- This allows the API to properly update existing backlinks instead of creating duplicates

-- Add unique constraint on source_url and target_url combination
ALTER TABLE backlinks ADD CONSTRAINT backlinks_source_target_unique UNIQUE (source_url, target_url);

-- Add index to improve query performance on source_url
CREATE INDEX IF NOT EXISTS idx_backlinks_source_url ON backlinks(source_url);
