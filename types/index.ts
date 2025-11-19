// Database types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  company: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  domain: string
  target_location: string
  target_language: string
  created_at: string
  updated_at: string
}

export interface Competitor {
  id: string
  project_id: string
  domain: string
  name: string | null
  created_at: string
}

export interface Keyword {
  id: string
  project_id: string
  keyword: string
  search_volume: number | null
  competition: 'low' | 'medium' | 'high' | null
  cpc: number | null
  keyword_difficulty: number | null
  tags: string[] | null
  category: string | null
  monthly_searches?: Array<{
    year: number
    month: number
    search_volume: number
  }>
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: string
  keyword_id: string
  project_id: string
  rank_position: number
  rank_url: string | null
  rank_absolute: number
  search_engine: string
  device: 'desktop' | 'mobile'
  location_code: number
  language_code: string
  checked_at: string
  serp_features: any | null
}

export interface Backlink {
  id: string
  project_id: string
  source_url: string
  target_url: string
  anchor_text: string | null
  domain_rank: number | null
  page_rank: number | null
  first_seen: string
  last_seen: string
  is_lost: boolean
  link_type: 'dofollow' | 'nofollow'
}

export interface GSCData {
  id: string
  project_id: string
  date: string
  page: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  device: string
  country: string
  created_at: string
}

export interface ApiUsage {
  id: string
  user_id: string
  api_name: string
  endpoint: string
  credits_used: number
  cost: number | null
  request_data: any | null
  created_at: string
}

export interface OutreachCampaign {
  id: string
  project_id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

export interface OutreachProspect {
  id: string
  campaign_id: string
  domain: string
  contact_name: string | null
  contact_email: string
  contact_position: string | null
  domain_authority: number | null
  status: 'pending' | 'contacted' | 'responded' | 'success' | 'rejected'
  email_sent_at: string | null
  response_received_at: string | null
  notes: string | null
  custom_fields: any | null
  created_at: string
  updated_at: string
}

export interface OutreachTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  function_calls: any | null
  created_at: string
}

export interface GSCToken {
  id: string
  user_id: string
  project_id: string | null
  access_token: string
  refresh_token: string
  token_expiry: string
  site_url: string
  created_at: string
  updated_at: string
}
