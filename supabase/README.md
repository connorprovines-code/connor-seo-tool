# Supabase Database Setup

## Overview
This directory contains database migrations for Connor's SEO Tool.

## Setup Instructions

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migrations**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `migrations/001_initial_schema.sql`
   - Paste and execute the SQL

3. **Verify Setup**
   - Check that all tables are created under the "Table Editor"
   - Verify RLS policies are enabled for all tables
   - Test authentication by signing up a test user

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key

## Database Schema

### Core Tables
- **profiles**: User profile information
- **projects**: Website projects to track
- **keywords**: Keywords to track for each project
- **rankings**: Historical ranking data
- **competitors**: Competitor websites
- **backlinks**: Backlink data

### Integration Tables
- **gsc_data**: Google Search Console data
- **gsc_tokens**: OAuth tokens for GSC

### Outreach Tables
- **outreach_campaigns**: Email outreach campaigns
- **outreach_prospects**: Prospect contacts
- **outreach_templates**: Email templates

### System Tables
- **api_usage**: Track API usage and costs
- **chat_messages**: AI assistant chat history

## Security

All tables have Row Level Security (RLS) enabled. Users can only access their own data through the `user_id` or `project_id` associations.
