# Connor SEO Tool - Database Schema Documentation

**Version:** 2.0
**Last Updated:** 2025-11-19
**Database:** PostgreSQL (Supabase)

---

## Overview

The Connor SEO Tool database consists of **14 tables** organized into 6 functional areas:
1. User Management
2. Projects & Competitors
3. Keywords & Rankings
4. Backlinks
5. Google Search Console
6. Outreach/Link Building
7. AI Chat & Usage Tracking

All tables have **Row Level Security (RLS)** enabled to ensure users can only access their own data.

---

## Table Summary

| Table | Records | Purpose |
|-------|---------|---------|
| `profiles` | Users | User profiles extending Supabase auth |
| `projects` | Sites | Website projects/campaigns to track |
| `competitors` | Domains | Competitor domains per project |
| `keywords` | Keywords | Keywords tracked per project |
| `rankings` | Time-series | Historical ranking data |
| `rank_check_results` | Snapshots | Persistent rank checks with SERP data |
| `backlinks` | Links | Backlink profile per project |
| `gsc_data` | Metrics | Google Search Console data |
| `gsc_tokens` | OAuth | GSC OAuth tokens per project |
| `outreach_campaigns` | Campaigns | Link building campaigns |
| `outreach_targets` | Prospects | Individual outreach targets |
| `outreach_templates` | Templates | Email templates for outreach |
| `chat_messages` | Messages | AI chat history |
| `api_usage` | Logs | API usage tracking |

---

## 1. USER MANAGEMENT

### `profiles`
Extends Supabase `auth.users` with additional user data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | References auth.users(id) |
| `email` | TEXT | User email |
| `full_name` | TEXT | Full name |
| `company` | TEXT | Company name |
| `created_at` | TIMESTAMPTZ | Account creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** Primary key on `id`
**RLS:** Users can only view/update their own profile

---

## 2. PROJECTS & COMPETITORS

### `projects`
Website projects/campaigns to track.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Project ID |
| `user_id` | UUID FK | Owner (profiles.id) |
| `name` | TEXT | Project name |
| `domain` | TEXT | Domain to track |
| `target_location` | TEXT | Target country (default: United States) |
| `target_language` | TEXT | Target language (default: en) |
| `created_at` | TIMESTAMPTZ | Created date |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `user_id`
**RLS:** Users can only access their own projects

### `competitors`
Competitor domains to track per project.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Competitor ID |
| `project_id` | UUID FK | Parent project |
| `domain` | TEXT | Competitor domain |
| `name` | TEXT | Competitor name (optional) |
| `created_at` | TIMESTAMPTZ | Added date |

**Indexes:** `project_id`
**RLS:** Users can only access competitors for their projects

---

## 3. KEYWORDS & RANKINGS

### `keywords`
Keywords tracked per project.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Keyword ID |
| `project_id` | UUID FK | Parent project |
| `keyword` | TEXT | Keyword phrase |
| `search_volume` | INTEGER | Monthly search volume |
| `competition` | TEXT | low/medium/high |
| `cpc` | DECIMAL(10,2) | Cost per click ($) |
| `keyword_difficulty` | INTEGER | 0-100 difficulty score |
| `tags` | TEXT[] | Custom tags |
| `category` | TEXT | Category |
| `monthly_searches` | JSONB | 12-month trend data |
| `created_at` | TIMESTAMPTZ | Added date |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `project_id`, `keyword`
**RLS:** Users can only access keywords for their projects

**`monthly_searches` format:**
```json
[
  {"year": 2024, "month": 1, "search_volume": 1200},
  {"year": 2024, "month": 2, "search_volume": 1350},
  ...
]
```

### `rankings`
Historical ranking data (simple time-series).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Ranking ID |
| `keyword_id` | UUID FK | Keyword being tracked |
| `project_id` | UUID FK | Parent project |
| `rank_position` | INTEGER | Position in SERP (1-100) |
| `rank_url` | TEXT | URL that ranks |
| `rank_absolute` | INTEGER | Absolute rank |
| `search_engine` | TEXT | google (default) |
| `device` | TEXT | desktop/mobile |
| `location_code` | INTEGER | DataForSEO location code |
| `language_code` | TEXT | Language code (en) |
| `checked_at` | TIMESTAMPTZ | Check date |
| `serp_features` | JSONB | SERP features detected |

**Indexes:** `keyword_id`, `project_id`, `checked_at DESC`
**RLS:** Users can only access rankings for their projects

### `rank_check_results`
Persistent rank check results with top 10 SERP competitors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Result ID |
| `keyword_id` | UUID FK | Keyword checked |
| `project_id` | UUID FK | Parent project |
| `keyword` | TEXT | Keyword phrase |
| `domain` | TEXT | Your domain |
| `position` | INTEGER | Your position (null if not found) |
| `rank_url` | TEXT | Your ranking URL |
| `rank_title` | TEXT | Your page title |
| `total_results` | INTEGER | Total SERP results |
| `serp_features` | INTEGER | Count of SERP features |
| `top_results` | JSONB | Top 10 SERP results |
| `checked_at` | TIMESTAMPTZ | Check timestamp |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `keyword_id`, `project_id`, `checked_at DESC`
**RLS:** Users can only access results for their projects

**`top_results` format:**
```json
[
  {"position": 1, "url": "https://example.com/page", "title": "Page Title"},
  {"position": 2, "url": "https://competitor.com/page", "title": "Competitor Page"},
  ...
]
```

---

## 4. BACKLINKS

### `backlinks`
Backlink profile per project.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Backlink ID |
| `project_id` | UUID FK | Parent project |
| `source_url` | TEXT | Linking page URL |
| `target_url` | TEXT | Your page URL |
| `anchor_text` | TEXT | Link anchor text |
| `domain_rank` | INTEGER | Source domain rank |
| `page_rank` | INTEGER | Source page rank |
| `first_seen` | TIMESTAMPTZ | First detected |
| `last_seen` | TIMESTAMPTZ | Last detected |
| `is_lost` | BOOLEAN | Lost backlink flag |
| `link_type` | TEXT | dofollow/nofollow |

**Indexes:** `project_id`, `is_lost`
**RLS:** Users can only access backlinks for their projects

---

## 5. GOOGLE SEARCH CONSOLE

### `gsc_data`
Google Search Console data synced daily.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Record ID |
| `project_id` | UUID FK | Parent project |
| `date` | DATE | Data date |
| `page` | TEXT | Page URL |
| `query` | TEXT | Search query |
| `clicks` | INTEGER | Click count |
| `impressions` | INTEGER | Impression count |
| `ctr` | DECIMAL(5,4) | Click-through rate |
| `position` | DECIMAL(6,2) | Average position |
| `device` | TEXT | desktop/mobile/tablet |
| `country` | TEXT | Country code |
| `created_at` | TIMESTAMPTZ | Synced date |

**Indexes:** `project_id`, `date DESC`, `query`
**Unique:** `(project_id, date, page, query, device, country)`
**RLS:** Users can only access GSC data for their projects

### `gsc_tokens`
OAuth tokens for Google Search Console.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Token ID |
| `user_id` | UUID FK | Owner |
| `project_id` | UUID FK | Associated project |
| `access_token` | TEXT | OAuth access token |
| `refresh_token` | TEXT | OAuth refresh token |
| `token_expiry` | TIMESTAMPTZ | Token expiration |
| `site_url` | TEXT | GSC property URL |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `user_id`, `project_id`
**RLS:** Users can only access their own tokens

---

## 6. OUTREACH / LINK BUILDING

### `outreach_campaigns`
Link building outreach campaigns.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Campaign ID |
| `project_id` | UUID FK | Parent project |
| `keyword_id` | UUID FK | Target keyword |
| `user_id` | UUID FK | Owner |
| `campaign_name` | TEXT | Campaign name |
| `keyword` | TEXT | Keyword phrase |
| `status` | TEXT | pending/running/completed/paused |
| `target_count` | INTEGER | Number of targets (default 10) |
| `targets` | JSONB | Scored target sites |
| `webhook_url` | TEXT | n8n webhook URL |
| `webhook_fired_at` | TIMESTAMPTZ | Webhook trigger time |
| `webhook_response` | JSONB | Webhook response |
| `sent_count` | INTEGER | Emails sent |
| `replied_count` | INTEGER | Replies received |
| `link_acquired_count` | INTEGER | Links acquired |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `project_id`, `keyword_id`, `user_id`, `status`
**RLS:** Users can only access their own campaigns

### `outreach_targets`
Individual outreach targets within campaigns.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Target ID |
| `campaign_id` | UUID FK | Parent campaign |
| `project_id` | UUID FK | Parent project |
| `domain` | TEXT | Target domain |
| `target_url` | TEXT | Target page URL |
| `target_score` | INTEGER | AI scoring |
| `domain_rating` | INTEGER | Domain authority |
| `monthly_traffic` | INTEGER | Estimated traffic |
| `referring_domains` | INTEGER | Backlink count |
| `why_targeted` | TEXT | Targeting reason |
| `outreach_angle` | TEXT | Approach type |
| `pitch_hook` | TEXT | Pitch idea |
| `research_prompts` | JSONB | AI research prompts |
| `status` | TEXT | pending/researching/drafted/sent/opened/replied/link_acquired/declined |
| `contacted_at` | TIMESTAMPTZ | Email sent date |
| `replied_at` | TIMESTAMPTZ | Reply received date |
| `link_acquired_at` | TIMESTAMPTZ | Link acquired date |
| `contact_info` | JSONB | Contact details |
| `research_data` | JSONB | Perplexity research |
| `outreach_email` | TEXT | Email content |
| `response_data` | JSONB | Reply tracking |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `campaign_id`, `project_id`, `status`, `domain`
**RLS:** Users can only access targets for their campaigns

### `outreach_templates`
Email templates for outreach.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Template ID |
| `user_id` | UUID FK | Owner |
| `name` | TEXT | Template name |
| `subject` | TEXT | Email subject |
| `body` | TEXT | Email body |
| `is_default` | BOOLEAN | Default template flag |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `user_id`
**RLS:** Users can only access their own templates

---

## 7. AI CHAT & USAGE TRACKING

### `chat_messages`
AI chat history with Claude assistant.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Message ID |
| `user_id` | UUID FK | Owner |
| `role` | TEXT | user/assistant |
| `content` | TEXT | Message content |
| `function_calls` | JSONB | Claude tool use data |
| `created_at` | TIMESTAMPTZ | Sent date |

**Indexes:** `user_id`, `created_at DESC`
**RLS:** Users can only view their own messages

### `api_usage`
API usage tracking for cost monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Usage ID |
| `user_id` | UUID FK | Owner |
| `api_name` | TEXT | API name (DataForSEO, Claude) |
| `endpoint` | TEXT | API endpoint called |
| `credits_used` | INTEGER | Credits consumed |
| `cost` | DECIMAL(10,4) | Cost in USD |
| `request_data` | JSONB | Request payload |
| `created_at` | TIMESTAMPTZ | Request time |

**Indexes:** `user_id`, `created_at DESC`
**RLS:** Users can only view their own usage

---

## Database Functions & Triggers

### `update_updated_at_column()`
Auto-updates `updated_at` timestamp on row update.

**Applied to:**
- `profiles`
- `projects`
- `keywords`
- `outreach_campaigns`
- `outreach_targets`
- `outreach_templates`
- `gsc_tokens`

### `update_rank_check_results_updated_at()`
Auto-updates `updated_at` for `rank_check_results`.

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Policy patterns:

### User-owned tables:
- `profiles`, `chat_messages`, `api_usage`, `outreach_templates`, `gsc_tokens`
- Policy: `auth.uid() = user_id`

### Project-scoped tables:
- `keywords`, `rankings`, `rank_check_results`, `backlinks`, `gsc_data`, `competitors`
- Policy: User owns the parent project

### Campaign-scoped tables:
- `outreach_targets`
- Policy: User owns the parent campaign

---

## Data Relationships

```
profiles (user)
  └── projects (1:N)
      ├── keywords (1:N)
      │   ├── rankings (1:N)
      │   ├── rank_check_results (1:N)
      │   └── outreach_campaigns (1:N)
      │       └── outreach_targets (1:N)
      ├── competitors (1:N)
      ├── backlinks (1:N)
      ├── gsc_data (1:N)
      └── gsc_tokens (1:N)
  ├── chat_messages (1:N)
  ├── api_usage (1:N)
  └── outreach_templates (1:N)
```

---

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-15 | Initial schema |
| 2.0 | 2025-11-19 | Added `rank_check_results`, `monthly_searches`, enhanced outreach |

---

## Maintenance Notes

### Cleanup Jobs Needed:
1. **Old rankings data** - Keep last 90 days
2. **Old rank_check_results** - Keep last 30 days per keyword
3. **Expired GSC tokens** - Clean up monthly

### Missing Indexes to Consider:
- `gsc_data(page)` if querying by page often
- `keywords(category)` if filtering by category
- `backlinks(source_url)` if searching by source

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# DataForSEO API
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Anthropic Claude
ANTHROPIC_API_KEY=

# Cron Jobs
CRON_SECRET=

# Google Search Console (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

---

**End of Schema Documentation**
