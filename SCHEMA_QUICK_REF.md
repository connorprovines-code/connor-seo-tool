# Database Schema - Quick Reference

## 14 Tables

### Core Tables
1. **profiles** - User accounts (extends auth.users)
2. **projects** - Website projects/campaigns
3. **keywords** - Keywords tracked per project (has `monthly_searches` JSONB)
4. **competitors** - Competitor domains per project

### Rankings & SERP
5. **rankings** - Historical ranking time-series
6. **rank_check_results** - Persistent rank checks with top 10 SERP data (has `top_results` JSONB)

### Backlinks
7. **backlinks** - Backlink profile tracking

### Google Search Console
8. **gsc_data** - GSC metrics (clicks, impressions, CTR, position)
9. **gsc_tokens** - OAuth tokens per project

### Outreach/Link Building
10. **outreach_campaigns** - Campaigns (has `targets` JSONB, `webhook_url`)
11. **outreach_targets** - Individual prospects (has `research_prompts`, `contact_info`, `research_data` JSONB)
12. **outreach_templates** - Email templates

### AI & Tracking
13. **chat_messages** - Claude AI chat history (has `function_calls` JSONB)
14. **api_usage** - API cost tracking

---

## Key JSONB Columns

### keywords.monthly_searches
```json
[
  {"year": 2024, "month": 1, "search_volume": 1200},
  {"year": 2024, "month": 2, "search_volume": 1350}
]
```

### rank_check_results.top_results
```json
[
  {"position": 1, "url": "https://example.com", "title": "Title"},
  {"position": 2, "url": "https://competitor.com", "title": "Title"}
]
```

### outreach_campaigns.targets
```json
[
  {"domain": "example.com", "score": 85, "dr": 70}
]
```

### outreach_targets.research_prompts
```json
["Find contact email", "Get recent blog topics"]
```

### outreach_targets.contact_info
```json
{"email": "john@example.com", "twitter": "@john"}
```

### chat_messages.function_calls
```json
{"tool": "get_keywords", "params": {"project_id": "..."}}
```

---

## Foreign Key Relationships

```
profiles (user_id)
  └─ projects (project_id)
      ├─ keywords (keyword_id)
      │   ├─ rankings
      │   ├─ rank_check_results
      │   └─ outreach_campaigns (campaign_id)
      │       └─ outreach_targets
      ├─ competitors
      ├─ backlinks
      ├─ gsc_data
      └─ gsc_tokens
  ├─ chat_messages
  ├─ api_usage
  └─ outreach_templates
```

---

## All Tables Have RLS (Row Level Security)

- **User-scoped**: profiles, chat_messages, api_usage, outreach_templates, gsc_tokens
- **Project-scoped**: keywords, rankings, rank_check_results, backlinks, gsc_data, competitors
- **Campaign-scoped**: outreach_targets

---

## Auto-Updated Columns

Tables with `updated_at` auto-trigger:
- profiles
- projects
- keywords
- outreach_campaigns
- outreach_targets
- outreach_templates
- gsc_tokens
- rank_check_results

---

## Indexes Created

- All foreign keys (user_id, project_id, keyword_id, campaign_id)
- keywords: keyword (text search)
- rankings: checked_at DESC (time-series)
- rank_check_results: checked_at DESC (time-series)
- gsc_data: date DESC, query (time-series + search)
- backlinks: is_lost (filtering)
- chat_messages: created_at DESC (recent first)
- api_usage: created_at DESC (recent first)

---

## Unique Constraints

- **gsc_data**: (project_id, date, page, query, device, country)
  - Prevents duplicate GSC records

---

## Check Constraints

- **keywords.competition**: Must be 'low', 'medium', or 'high'
- **keywords.keyword_difficulty**: Must be 0-100
- **rankings.device**: Must be 'desktop' or 'mobile'
- **backlinks.link_type**: Must be 'dofollow' or 'nofollow'
- **outreach_campaigns.status**: Must be 'pending', 'running', 'completed', or 'paused'
- **outreach_targets.status**: Must be 'pending', 'researching', 'drafted', 'sent', 'opened', 'replied', 'link_acquired', or 'declined'
- **chat_messages.role**: Must be 'user' or 'assistant'

---

**Last Updated:** 2025-11-19
