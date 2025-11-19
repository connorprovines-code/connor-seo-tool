-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  target_location TEXT NOT NULL DEFAULT 'United States',
  target_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Competitors table
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitors
CREATE POLICY "Users can view competitors for their projects"
  ON competitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert competitors for their projects"
  ON competitors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors for their projects"
  ON competitors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors for their projects"
  ON competitors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  cpc DECIMAL(10, 2),
  keyword_difficulty INTEGER CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100),
  tags TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on keywords for faster searches
CREATE INDEX idx_keywords_project_id ON keywords(project_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);

-- Enable RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keywords
CREATE POLICY "Users can view keywords for their projects"
  ON keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert keywords for their projects"
  ON keywords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update keywords for their projects"
  ON keywords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete keywords for their projects"
  ON keywords FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Rankings table
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  rank_url TEXT,
  rank_absolute INTEGER NOT NULL,
  search_engine TEXT NOT NULL DEFAULT 'google',
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile')),
  location_code INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  serp_features JSONB
);

-- Create indexes for faster queries
CREATE INDEX idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX idx_rankings_project_id ON rankings(project_id);
CREATE INDEX idx_rankings_checked_at ON rankings(checked_at DESC);

-- Enable RLS
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rankings
CREATE POLICY "Users can view rankings for their projects"
  ON rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rankings.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rankings for their projects"
  ON rankings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rankings.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Backlinks table
CREATE TABLE backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_rank INTEGER,
  page_rank INTEGER,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_lost BOOLEAN DEFAULT FALSE,
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow'))
);

-- Create indexes
CREATE INDEX idx_backlinks_project_id ON backlinks(project_id);
CREATE INDEX idx_backlinks_is_lost ON backlinks(is_lost);

-- Enable RLS
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backlinks
CREATE POLICY "Users can view backlinks for their projects"
  ON backlinks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backlinks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert backlinks for their projects"
  ON backlinks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backlinks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update backlinks for their projects"
  ON backlinks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backlinks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- GSC Data table
CREATE TABLE gsc_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr DECIMAL(5, 4) NOT NULL,
  position DECIMAL(6, 2) NOT NULL,
  device TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date, page, query, device, country)
);

-- Create indexes for faster queries
CREATE INDEX idx_gsc_data_project_id ON gsc_data(project_id);
CREATE INDEX idx_gsc_data_date ON gsc_data(date DESC);
CREATE INDEX idx_gsc_data_query ON gsc_data(query);

-- Enable RLS
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gsc_data
CREATE POLICY "Users can view GSC data for their projects"
  ON gsc_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = gsc_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GSC data for their projects"
  ON gsc_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = gsc_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- API Usage table
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  cost DECIMAL(10, 4),
  request_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_usage
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage"
  ON api_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Outreach Campaigns table
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outreach_campaigns
CREATE POLICY "Users can view campaigns for their projects"
  ON outreach_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = outreach_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaigns for their projects"
  ON outreach_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = outreach_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns for their projects"
  ON outreach_campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = outreach_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns for their projects"
  ON outreach_campaigns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = outreach_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Outreach Prospects table
CREATE TABLE outreach_prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_position TEXT,
  domain_authority INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'contacted', 'responded', 'success', 'rejected')) DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_outreach_prospects_campaign_id ON outreach_prospects(campaign_id);

-- Enable RLS
ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outreach_prospects
CREATE POLICY "Users can view prospects for their campaigns"
  ON outreach_prospects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      JOIN projects ON projects.id = outreach_campaigns.project_id
      WHERE outreach_campaigns.id = outreach_prospects.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert prospects for their campaigns"
  ON outreach_prospects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      JOIN projects ON projects.id = outreach_campaigns.project_id
      WHERE outreach_campaigns.id = outreach_prospects.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update prospects for their campaigns"
  ON outreach_prospects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      JOIN projects ON projects.id = outreach_campaigns.project_id
      WHERE outreach_campaigns.id = outreach_prospects.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete prospects for their campaigns"
  ON outreach_prospects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      JOIN projects ON projects.id = outreach_campaigns.project_id
      WHERE outreach_campaigns.id = outreach_prospects.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- Outreach Templates table
CREATE TABLE outreach_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outreach_templates
CREATE POLICY "Users can view their own templates"
  ON outreach_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON outreach_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON outreach_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON outreach_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  function_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- GSC Tokens table
CREATE TABLE gsc_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  site_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gsc_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gsc_tokens
CREATE POLICY "Users can view their own GSC tokens"
  ON gsc_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GSC tokens"
  ON gsc_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GSC tokens"
  ON gsc_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GSC tokens"
  ON gsc_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_campaigns_updated_at BEFORE UPDATE ON outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_prospects_updated_at BEFORE UPDATE ON outreach_prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_templates_updated_at BEFORE UPDATE ON outreach_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsc_tokens_updated_at BEFORE UPDATE ON gsc_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
