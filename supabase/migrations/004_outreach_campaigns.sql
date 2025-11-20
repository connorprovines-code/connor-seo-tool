-- Outreach Campaigns
-- Stores link building outreach campaigns

CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Campaign details
  campaign_name TEXT NOT NULL,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, paused

  -- Target configuration
  target_count INTEGER DEFAULT 10,
  targets JSONB DEFAULT '[]'::jsonb, -- Array of target sites with scoring

  -- n8n webhook
  webhook_url TEXT,
  webhook_fired_at TIMESTAMP WITH TIME ZONE,
  webhook_response JSONB,

  -- Campaign tracking
  sent_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  link_acquired_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach Targets (individual outreach attempts)
CREATE TABLE IF NOT EXISTS outreach_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Target site info
  domain TEXT NOT NULL,
  target_url TEXT,
  target_score INTEGER,

  -- Metrics
  domain_rating INTEGER,
  monthly_traffic INTEGER,
  referring_domains INTEGER,

  -- Outreach details
  why_targeted TEXT,
  outreach_angle TEXT, -- guest_post, resource_page, broken_link, etc.
  pitch_hook TEXT,
  research_prompts JSONB DEFAULT '[]'::jsonb,

  -- Status tracking (updated via webhook callback)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, researching, drafted, sent, opened, replied, link_acquired, declined
  contacted_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  link_acquired_at TIMESTAMP WITH TIME ZONE,

  -- External data (from n8n callbacks)
  contact_info JSONB, -- emails, social profiles found by n8n
  research_data JSONB, -- Perplexity research results
  outreach_email TEXT, -- Generated email content
  response_data JSONB, -- Reply tracking

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_campaigns_project_id ON outreach_campaigns(project_id);
CREATE INDEX idx_outreach_campaigns_keyword_id ON outreach_campaigns(keyword_id);
CREATE INDEX idx_outreach_campaigns_user_id ON outreach_campaigns(user_id);
CREATE INDEX idx_outreach_campaigns_status ON outreach_campaigns(status);

CREATE INDEX idx_outreach_targets_campaign_id ON outreach_targets(campaign_id);
CREATE INDEX idx_outreach_targets_project_id ON outreach_targets(project_id);
CREATE INDEX idx_outreach_targets_status ON outreach_targets(status);
CREATE INDEX idx_outreach_targets_domain ON outreach_targets(domain);

-- RLS Policies
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own outreach campaigns"
  ON outreach_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outreach campaigns"
  ON outreach_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outreach campaigns"
  ON outreach_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outreach campaigns"
  ON outreach_campaigns FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view outreach targets for their campaigns"
  ON outreach_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE outreach_campaigns.id = outreach_targets.campaign_id
      AND outreach_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create outreach targets for their campaigns"
  ON outreach_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE outreach_campaigns.id = outreach_targets.campaign_id
      AND outreach_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outreach targets for their campaigns"
  ON outreach_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE outreach_campaigns.id = outreach_targets.campaign_id
      AND outreach_campaigns.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE outreach_campaigns IS 'Link building outreach campaigns for keywords';
COMMENT ON TABLE outreach_targets IS 'Individual outreach targets within campaigns';
COMMENT ON COLUMN outreach_campaigns.targets IS 'Scored and ranked target sites (top 10)';
COMMENT ON COLUMN outreach_targets.research_prompts IS 'AI research prompts for n8n/Perplexity';
COMMENT ON COLUMN outreach_targets.contact_info IS 'Contact details found during research';
COMMENT ON COLUMN outreach_targets.research_data IS 'Research results from Perplexity/n8n';
