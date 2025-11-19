# Database Migrations Required

Your Supabase production database needs the following migrations applied:

## 1. Rank Check Results Table
**File:** `supabase/migrations/002_rank_check_results.sql`

This migration creates the `rank_check_results` table to store persistent rank checking data.

**To apply via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/[your-project-id]/editor
2. Click "SQL Editor"
3. Paste the contents of `supabase/migrations/002_rank_check_results.sql`
4. Click "Run"

**Or via CLI:**
```bash
npx supabase db push
```

## 2. Monthly Searches Column
**File:** `supabase/migrations/003_add_monthly_searches.sql`

This migration adds a `monthly_searches` JSONB column to the `keywords` table for storing trend data.

**To apply via Supabase Dashboard:**
1. Go to SQL Editor
2. Paste the contents of `supabase/migrations/003_add_monthly_searches.sql`
3. Click "Run"

## Current Status

Without these migrations:
- ✅ Keyword tracking works
- ✅ Similar keywords work
- ✅ Competitor analysis works
- ❌ Rank checking shows errors (rank_check_results doesn't exist)
- ❌ Monthly trend sparklines won't populate (monthly_searches column missing)
- ❌ Keyword deletion may show errors

After applying migrations:
- ✅ All features will work correctly
- ✅ Rank results will persist across sessions
- ✅ Monthly trends will be saved and displayed

## Environment Variables Needed

For the AI Chat widget to work, add to your `.env.local`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Then restart your development server.

**Note:** You've shared your API key - make sure it's added to `.env.local` (which is gitignored) and never commit it to the repository.
