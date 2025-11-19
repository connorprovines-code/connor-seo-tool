-- Add monthly searches trend data to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS monthly_searches JSONB DEFAULT '[]'::jsonb;

-- Add index for querying monthly searches
CREATE INDEX IF NOT EXISTS idx_keywords_monthly_searches ON keywords USING GIN (monthly_searches);

-- Add comment
COMMENT ON COLUMN keywords.monthly_searches IS 'Monthly search volume trends from DataForSEO - array of {year, month, search_volume} objects';
