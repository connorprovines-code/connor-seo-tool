-- Create table for storing rank check results
CREATE TABLE IF NOT EXISTS rank_check_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Your ranking data
  position INTEGER,  -- null if not found in top 100
  rank_url TEXT,
  rank_title TEXT,

  -- SERP metadata
  total_results INTEGER DEFAULT 0,
  serp_features INTEGER DEFAULT 0,

  -- Top 10 results (stored as JSONB for flexibility)
  top_results JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_rank_check_results_keyword_id ON rank_check_results(keyword_id);
CREATE INDEX idx_rank_check_results_project_id ON rank_check_results(project_id);
CREATE INDEX idx_rank_check_results_checked_at ON rank_check_results(checked_at DESC);

-- Add RLS policies
ALTER TABLE rank_check_results ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own rank check results
CREATE POLICY "Users can view their rank check results"
  ON rank_check_results FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert their own rank check results
CREATE POLICY "Users can insert their rank check results"
  ON rank_check_results FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own rank check results
CREATE POLICY "Users can update their rank check results"
  ON rank_check_results FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete their own rank check results
CREATE POLICY "Users can delete their rank check results"
  ON rank_check_results FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rank_check_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_rank_check_results_updated_at_trigger
  BEFORE UPDATE ON rank_check_results
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_check_results_updated_at();
