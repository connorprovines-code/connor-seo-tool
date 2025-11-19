# Setup Instructions

## Issue: Similar keywords showing 0 results

This is likely because **DataForSEO API credentials** aren't configured.

## Step 1: Check Environment Variables

You need DataForSEO credentials configured in your `.env.local`:

```bash
# Required for similar keywords, keyword metrics, rankings
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
```

**To check if they're set:**
```bash
# In your project root
grep DATAFORSEO .env.local
```

If empty or missing, you need to:
1. Sign up at https://dataforseo.com
2. Get your API credentials from the dashboard
3. Add them to `.env.local`

## Step 2: Run Supabase Migrations

Make sure your database schema is up to date:

```bash
# If using Supabase CLI locally
npx supabase db push

# OR if using Supabase dashboard:
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and run
```

## Step 3: Verify DataForSEO Connection

I've created a test endpoint. After restarting your dev server:

```bash
curl -X POST http://localhost:3000/api/dataforseo/test \
  -H "Content-Type: application/json" \
  -d '{"keyword": "seo"}'
```

Expected response:
```json
{
  "success": true,
  "keyword": "seo",
  "ideasCount": 50
}
```

If you get errors, the DataForSEO credentials are wrong or missing.

## Step 4: Restart Dev Server

After adding credentials:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Common Issues

### Keywords saving but no data showing
- Keywords save to database without metrics (that's OK)
- Metrics come from DataForSEO API which requires credentials
- Once credentials are configured, metrics will populate

### Similar keywords returning 0
- DataForSEO credentials not configured
- Check browser console for errors
- Check server logs for API response

### Foreign key errors
- Fixed in latest push
- Make sure you've pulled latest changes
- Refresh the page to sync data
