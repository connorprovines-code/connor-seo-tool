-- Page Audits Table
-- Stores SEO analysis results for individual pages

CREATE TABLE IF NOT EXISTS page_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Page info
  url TEXT NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic SEO elements
  title TEXT,
  meta_description TEXT,
  h1 TEXT[],
  h2 TEXT[],
  canonical_url TEXT,

  -- Content metrics
  word_count INTEGER,
  paragraph_count INTEGER,

  -- Images
  images_total INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,
  images_data JSONB, -- [{src, alt, width, height}]

  -- Links
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  broken_links_count INTEGER DEFAULT 0,
  links_data JSONB, -- [{href, text, type: 'internal'|'external'}]

  -- Technical SEO
  has_meta_viewport BOOLEAN DEFAULT false,
  has_meta_robots BOOLEAN DEFAULT false,
  meta_robots TEXT,
  has_og_tags BOOLEAN DEFAULT false,
  has_twitter_tags BOOLEAN DEFAULT false,
  has_schema_markup BOOLEAN DEFAULT false,
  schema_types TEXT[],

  -- Performance (if using Lighthouse)
  performance_score INTEGER, -- 0-100
  seo_score INTEGER, -- 0-100
  accessibility_score INTEGER, -- 0-100
  best_practices_score INTEGER, -- 0-100

  -- Lighthouse metrics
  lighthouse_data JSONB, -- Full Lighthouse report

  -- Keyword analysis (if target keyword provided)
  target_keyword TEXT,
  keyword_in_title BOOLEAN,
  keyword_in_h1 BOOLEAN,
  keyword_in_meta BOOLEAN,
  keyword_in_url BOOLEAN,
  keyword_density DECIMAL(5,2), -- percentage

  -- Raw HTML for reference
  html_snapshot TEXT, -- Optional: store rendered HTML

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_page_audits_project ON page_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_page_audits_user ON page_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_audits_url ON page_audits(url);
CREATE INDEX IF NOT EXISTS idx_page_audits_analyzed_at ON page_audits(analyzed_at DESC);

-- RLS Policies
ALTER TABLE page_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own page audits" ON page_audits;
CREATE POLICY "Users can view own page audits"
  ON page_audits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own page audits" ON page_audits;
CREATE POLICY "Users can insert own page audits"
  ON page_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own page audits" ON page_audits;
CREATE POLICY "Users can update own page audits"
  ON page_audits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own page audits" ON page_audits;
CREATE POLICY "Users can delete own page audits"
  ON page_audits FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_page_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_audits_updated_at ON page_audits;
CREATE TRIGGER page_audits_updated_at
  BEFORE UPDATE ON page_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_page_audits_updated_at();

-- Comments
COMMENT ON TABLE page_audits IS 'Stores SEO analysis results for individual web pages';
COMMENT ON COLUMN page_audits.images_data IS 'JSON array of image objects with src, alt, width, height';
COMMENT ON COLUMN page_audits.links_data IS 'JSON array of link objects with href, text, and type';
COMMENT ON COLUMN page_audits.lighthouse_data IS 'Full Lighthouse performance audit report';
COMMENT ON COLUMN page_audits.schema_types IS 'Array of Schema.org types found on the page (e.g., Article, Product)';
