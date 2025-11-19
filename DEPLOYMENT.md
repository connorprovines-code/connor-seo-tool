# Deployment Guide

## Prerequisites

Before deploying, you need accounts and API keys for:

1. **Supabase** - Database and authentication
2. **DataForSEO** - SEO data API
3. **Anthropic** - Claude AI for chat
4. **Vercel** - Hosting platform (recommended)
5. **Google Cloud** - (Optional) For Google Search Console integration

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and execute the SQL
4. Verify all tables are created in the **Table Editor**

### Get Credentials

1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public key**

## 2. DataForSEO Setup

1. Sign up at [dataforseo.com](https://dataforseo.com)
2. Go to your dashboard and get your API credentials:
   - Login (email)
   - Password
3. Fund your account with credits

## 3. Anthropic Setup

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to **API Keys**
3. Create a new API key
4. Save it securely

## 4. Deploy to Vercel

### Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select the `connor-seo-tool` repository

### Configure Environment Variables

In the Vercel project settings, add these environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# DataForSEO API
DATAFORSEO_LOGIN=your_email
DATAFORSEO_PASSWORD=your_password

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxx

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

### Update App URL

1. After deployment, copy your Vercel URL
2. Go back to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
4. Redeploy

## 5. Optional: Google Search Console Integration

### Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Search Console API**

### Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/gsc/callback
   ```
5. Save the **Client ID** and **Client Secret**

### Add to Environment Variables

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/gsc/callback
```

## 6. Cron Jobs

The `vercel.json` file configures two cron jobs:

- **Daily Rank Check**: Runs at 2:00 AM UTC
- **GSC Sync**: Runs at 3:00 AM UTC

These are automatically configured with Vercel's cron jobs feature.

## 7. Post-Deployment Setup

### Create Your First Account

1. Visit your deployed app
2. Click **Register**
3. Create an account with email/password
4. You'll be redirected to the dashboard

### Create Your First Project

1. Click **Create Project**
2. Enter your website details:
   - Project name
   - Domain (full URL)
   - Target location (e.g., United States)
   - Target language (e.g., en)

### Add Keywords

1. Go to your project
2. Click **Manage Keywords**
3. Add keywords to track
4. Click **Check Rank** to get initial rankings

### Use the AI Chat

1. Click the chat widget in the bottom right
2. Ask questions like:
   - "Show me my projects"
   - "What are my keyword rankings?"
   - "Analyze my keyword performance"

## 8. Monitoring

### Check Logs

- Go to Vercel dashboard → **Deployments** → Select deployment → **Logs**
- Monitor for errors or issues

### Database Monitoring

- Go to Supabase dashboard → **Database** → **Usage**
- Monitor database size and connections

### API Usage

- Check DataForSEO dashboard for credit usage
- Check Anthropic dashboard for Claude API usage

## 9. Troubleshooting

### Build Errors

- Check all environment variables are set correctly
- Ensure database schema is deployed
- Review build logs in Vercel

### Runtime Errors

- Check server logs in Vercel
- Verify API credentials are valid
- Test database connection

### Authentication Issues

- Ensure Supabase project is active
- Check RLS policies are enabled
- Verify redirect URLs are configured

## 10. Scaling Considerations

As your usage grows:

1. **Database**: Upgrade Supabase plan if needed
2. **API Credits**: Add more credits to DataForSEO
3. **AI Usage**: Monitor Anthropic usage and upgrade plan
4. **Vercel**: Upgrade to Pro plan for more resources

## Support

For issues:
- Check the GitHub repository issues
- Review Supabase documentation
- Check DataForSEO API docs
- Review Anthropic Claude documentation
