# Connor's SEO Tool - Project Specification

## Overview
Build a **comprehensive SEO management dashboard** - a lightweight Ahrefs alternative that replaces expensive SEO tools by leveraging DataForSEO API for keyword research, rank tracking, backlink monitoring, and competitor analysis. This is a **Next.js + Supabase** application designed to give you complete visibility into your website's SEO performance with:
- Real-time keyword rankings and search volume data
- Historical ranking trends across all your websites
- Backlink discovery and outreach automation
- Google Search Console integration for verified data
- AI-powered chat assistant for SEO insights
- All in one unified dashboard

## Technology Stack

### Frontend & Framework
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** or **Headless UI** for component library
- **Recharts** or **Chart.js** for data visualization
- **TanStack Query (React Query)** for data fetching and caching

### Backend & Database
- **Supabase** for:
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS) policies
  - Real-time subscriptions (optional for live updates)
- **Next.js API Routes** for:
  - Third-party API integrations (DataForSEO, Google Search Console)
  - Server-side business logic
  - Webhook handlers

### External APIs
- **DataForSEO API** - Keyword research, rank tracking, backlink data
- **Google Search Console API** - Search analytics and performance data

## Core Features

### 1. Authentication & User Management
- Email/password registration and login using Supabase Auth
- User profile management
- Password reset functionality
- Protected routes (middleware-based auth checks)
- User session persistence

### 2. Project Management
- Create/edit/delete website projects
- Each project represents a website to track
- Project settings:
  - Domain/URL
  - Target location (country/region)
  - Primary keywords
  - Competitor websites
- Dashboard view showing all user projects
- Project-specific detail pages

### 3. Keyword Research & Tracking
- **Keyword Research Tool**:
  - Search for keyword ideas based on seed keywords
  - Display search volume, competition, CPC data
  - Keyword difficulty scores
  - Save keywords to projects
- **Keyword Tracking**:
  - Track daily/weekly rankings for saved keywords
  - Historical rank data with trend charts
  - SERP feature tracking (featured snippets, PAA, etc.)
  - Desktop vs mobile rankings
  - Location-specific tracking
- **Keyword Organization**:
  - Group keywords by category/intent
  - Tag system for filtering
  - Search and filter functionality

### 4. Rank Tracking & Analytics
- Daily automated rank checks for tracked keywords
- Ranking history charts (line graphs showing position over time)
- Ranking distribution visualization (positions 1-3, 4-10, 11-20, etc.)
- Visibility score metrics
- Share of voice vs competitors
- Ranking alerts (notify on significant changes)
- Export rank data to CSV

### 5. Competitor Analysis
- Add competitor domains to projects
- Side-by-side keyword ranking comparisons
- Competitor keyword gap analysis (keywords they rank for but you don't)
- Competitor ranking trends
- Estimated traffic comparison
- Identify competitor content opportunities

### 6. Backlink Monitoring & Outreach
- **Backlink Monitoring**:
  - Backlink profile overview (total backlinks, referring domains)
  - New and lost backlinks tracking
  - Domain authority/rating metrics
  - Anchor text distribution
  - Top referring domains
  - Toxic backlink detection
  - Backlink growth over time charts
- **Backlink Outreach Builder**:
  - Discover potential backlink opportunities via DataForSEO
  - Research relevant websites in your niche
  - Find contact information (email scraping or manual entry)
  - Generate personalized outreach email templates
  - Track outreach campaigns (pending, contacted, responded, success)
  - Webhook integration for email sending (can integrate with SendGrid, Mailgun, Resend, or custom webhook)
  - Automated follow-up sequences
  - Response tracking and management
  - Success metrics (conversion rate, acquired backlinks)

### 7. Google Search Console Integration (REQUIRED)
**Priority Feature** - This provides verified, accurate data directly from Google.

- **OAuth2 Authentication**:
  - Secure Google account linking
  - Multi-property support (if user has multiple verified sites)
  - Token refresh handling
- **Data Import & Sync**:
  - Import search analytics data automatically:
    - Clicks, impressions, CTR, average position
    - Top performing pages
    - Top queries (actual search terms people use)
    - Geographic performance (country/region breakdown)
    - Device breakdown (desktop, mobile, tablet)
  - Historical data sync (last 16 months of data)
  - Automatic daily updates via cron job
  - Manual refresh option
- **Unified Data Views**:
  - Combined GSC + DataForSEO ranking data
  - Cross-reference GSC queries with tracked keywords
  - Identify new keyword opportunities from GSC queries
  - Compare GSC positions vs DataForSEO SERP positions
  - CTR analysis by position
- **Performance Insights**:
  - Pages losing traffic
  - Queries with high impressions but low clicks (CTR optimization opportunities)
  - Position changes over time
  - Seasonal trends
- **Data Storage**:
  - Store all GSC data in Supabase `gsc_data` table
  - Efficient querying with proper indexes
  - Deduplication handling for daily syncs

### 8. API Usage & Credits System
- Track DataForSEO API usage per user
- Credit-based system or usage quotas
- Display current usage and limits
- Usage history and cost tracking
- Alert users when approaching limits
- Option for usage tiers/plans

### 9. Dashboard & Reporting
- **Main Dashboard**:
  - Overview cards (total keywords, average position, visibility trend)
  - Quick stats for all projects
  - Recent ranking changes
  - Alerts and notifications
- **Project Dashboard**:
  - Project-specific KPIs
  - Ranking summary charts
  - Recent keyword movements
  - Top gaining/losing keywords
- **Custom Reports**:
  - Generate PDF reports
  - Scheduled email reports (weekly/monthly)
  - White-label report options

### 10. AI SEO Assistant (REQUIRED)
**Priority Feature** - Chat widget for intelligent SEO insights and data analysis.

- **Chat Widget Interface**:
  - Persistent chat widget (bottom-right corner, expandable/collapsible)
  - Available on all dashboard pages
  - Chat history persistence per user
  - Markdown support for formatted responses
  - Code block rendering for SQL queries or examples
- **Natural Language Queries**:
  - "What keywords am I ranking for in position 2-5?"
  - "Show me keywords that dropped in the last 7 days"
  - "Which competitors are outranking me?"
  - "What pages have the best CTR?"
  - "Summarize my backlink profile"
- **Data-Aware Responses**:
  - AI has context of user's projects, keywords, rankings, and GSC data
  - Can query the database via function calling
  - Returns actual data from user's account (not generic advice)
  - Generates charts and visualizations when relevant
- **SEO Recommendations**:
  - Content optimization suggestions based on ranking data
  - Keyword clustering and grouping recommendations
  - Identify low-hanging fruit (keywords in positions 4-20)
  - Technical SEO issue detection from GSC data
  - Competitor content gap analysis
- **Implementation**:
  - Uses OpenAI GPT-4 with function calling
  - Server-side API route handles chat completions
  - Functions available to AI:
    - `getProjectKeywords(projectId)`
    - `getRankingHistory(keywordId, days)`
    - `getGSCData(projectId, dateRange)`
    - `getBacklinks(projectId)`
    - `getCompetitorData(projectId)`
  - Streaming responses for better UX
  - Rate limiting to prevent abuse

## Database Schema

### Tables (Supabase PostgreSQL)

#### `users`
- Managed by Supabase Auth
- Extended with custom profile data in `profiles` table

#### `profiles`
```sql
- id (uuid, references auth.users)
- email (text)
- full_name (text)
- company (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `projects`
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- name (text)
- domain (text)
- target_location (text) -- e.g., "United States", "2840" (location code)
- target_language (text) -- e.g., "en"
- created_at (timestamp)
- updated_at (timestamp)
```

#### `competitors`
```sql
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- domain (text)
- name (text, nullable)
- created_at (timestamp)
```

#### `keywords`
```sql
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- keyword (text)
- search_volume (integer, nullable)
- competition (text, nullable) -- "low", "medium", "high"
- cpc (decimal, nullable)
- keyword_difficulty (integer, nullable)
- tags (text[], nullable)
- category (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `rankings`
```sql
- id (uuid, primary key)
- keyword_id (uuid, references keywords.id)
- project_id (uuid, references projects.id)
- rank_position (integer)
- rank_url (text, nullable) -- the URL that's ranking
- rank_absolute (integer) -- position including all SERP features
- search_engine (text) -- "google", "bing", etc.
- device (text) -- "desktop", "mobile"
- location_code (integer)
- language_code (text)
- checked_at (timestamp)
- serp_features (jsonb, nullable) -- featured snippets, PAA, etc.
```

#### `backlinks`
```sql
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- source_url (text)
- target_url (text)
- anchor_text (text, nullable)
- domain_rank (integer, nullable)
- page_rank (integer, nullable)
- first_seen (timestamp)
- last_seen (timestamp)
- is_lost (boolean, default false)
- link_type (text) -- "dofollow", "nofollow"
```

#### `gsc_data`
```sql
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- date (date)
- page (text)
- query (text)
- clicks (integer)
- impressions (integer)
- ctr (decimal)
- position (decimal)
- device (text)
- country (text)
- created_at (timestamp)
```

#### `api_usage`
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- api_name (text) -- "dataforseo", "openai", etc.
- endpoint (text)
- credits_used (integer)
- cost (decimal, nullable)
- request_data (jsonb, nullable)
- created_at (timestamp)
```

#### `outreach_campaigns`
```sql
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- name (text) -- campaign name
- status (text) -- "active", "paused", "completed"
- created_at (timestamp)
- updated_at (timestamp)
```

#### `outreach_prospects`
```sql
- id (uuid, primary key)
- campaign_id (uuid, references outreach_campaigns.id)
- domain (text)
- contact_name (text, nullable)
- contact_email (text)
- contact_position (text, nullable)
- domain_authority (integer, nullable)
- status (text) -- "pending", "contacted", "responded", "success", "rejected"
- email_sent_at (timestamp, nullable)
- response_received_at (timestamp, nullable)
- notes (text, nullable)
- custom_fields (jsonb, nullable) -- for email template personalization
- created_at (timestamp)
- updated_at (timestamp)
```

#### `outreach_templates`
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- name (text)
- subject (text)
- body (text) -- supports template variables like {{contact_name}}, {{domain}}, etc.
- is_default (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `chat_messages`
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- role (text) -- "user" or "assistant"
- content (text)
- function_calls (jsonb, nullable) -- stores function calling data if AI used functions
- created_at (timestamp)
```

#### `gsc_tokens`
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- project_id (uuid, references projects.id, nullable)
- access_token (text)
- refresh_token (text)
- token_expiry (timestamp)
- site_url (text) -- verified property in GSC
- created_at (timestamp)
- updated_at (timestamp)
```

### Row Level Security (RLS) Policies

All tables must have RLS enabled with policies ensuring:
- Users can only read/write their own data
- `user_id` or `project_id` ownership checks on all queries
- Example policy for `projects`:
  ```sql
  CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  ```

## Application Architecture

### Directory Structure (Next.js App Router)
```
connor-seo-tool/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Protected layout with nav + AI chat widget
│   │   ├── page.tsx             # Main dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx         # Projects list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # Project detail
│   │   │   │   ├── keywords/
│   │   │   │   ├── rankings/
│   │   │   │   ├── competitors/
│   │   │   │   ├── backlinks/
│   │   │   │   ├── gsc/
│   │   │   │   │   └── page.tsx # GSC data view
│   │   │   │   └── outreach/
│   │   │   │       ├── page.tsx # Campaigns list
│   │   │   │       └── [campaignId]/
│   │   │   │           └── page.tsx # Campaign details
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── keyword-research/
│   │   │   └── page.tsx
│   │   ├── outreach/
│   │   │   ├── page.tsx         # All campaigns
│   │   │   ├── templates/
│   │   │   │   └── page.tsx     # Email templates
│   │   │   └── new/
│   │   │       └── page.tsx     # Create campaign
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── integrations/
│   │           └── page.tsx     # GSC OAuth, webhook setup
│   ├── api/
│   │   ├── dataforseo/
│   │   │   ├── keywords/route.ts
│   │   │   ├── rankings/route.ts
│   │   │   └── backlinks/route.ts
│   │   ├── gsc/
│   │   │   ├── auth/route.ts
│   │   │   ├── callback/route.ts # OAuth callback
│   │   │   ├── sync/route.ts     # Manual sync trigger
│   │   │   └── data/route.ts
│   │   ├── chat/
│   │   │   └── route.ts          # AI chat completions
│   │   ├── outreach/
│   │   │   ├── send-email/route.ts # Webhook for email sending
│   │   │   └── webhook/route.ts    # Receive email responses
│   │   └── cron/
│   │       ├── daily-rank-check/route.ts
│   │       └── gsc-sync/route.ts
│   ├── layout.tsx
│   └── page.tsx                 # Landing/welcome page
├── components/
│   ├── ui/                      # Shadcn components
│   ├── auth/
│   ├── projects/
│   ├── keywords/
│   ├── charts/
│   ├── chat/
│   │   ├── ChatWidget.tsx       # Expandable chat widget
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   ├── outreach/
│   │   ├── CampaignList.tsx
│   │   ├── ProspectTable.tsx
│   │   └── EmailTemplateEditor.tsx
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── middleware.ts        # Auth middleware
│   ├── dataforseo/
│   │   └── client.ts
│   ├── gsc/
│   │   ├── client.ts
│   │   └── oauth.ts             # OAuth flow helpers
│   ├── openai/
│   │   ├── client.ts
│   │   └── functions.ts         # Function definitions for AI
│   ├── email/
│   │   └── webhook.ts           # Email webhook handler
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProject.ts
│   ├── useKeywords.ts
│   ├── useChat.ts
│   └── useGSC.ts
├── types/
│   └── index.ts
└── middleware.ts                # Next.js middleware for auth
```

### Authentication Pattern

**Client-side auth (for client components):**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server-side auth (for server components and API routes):**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**Middleware for protected routes:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.delete(name)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if authenticated and on auth pages
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Key Implementation Details

### 1. DataForSEO Integration

Create API route handlers that:
- Accept requests from the frontend
- Make authenticated requests to DataForSEO API using server-side credentials
- Track API usage in the `api_usage` table
- Return formatted data to frontend

Example:
```typescript
// app/api/dataforseo/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keywords, location } = await request.json()

  // Call DataForSEO API
  const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ keywords, location_code: location }])
  })

  const data = await response.json()

  // Track API usage
  await supabase.from('api_usage').insert({
    user_id: user.id,
    api_name: 'dataforseo',
    endpoint: 'keywords_data',
    credits_used: keywords.length,
  })

  return NextResponse.json(data)
}
```

### 2. Google Search Console Integration Implementation

**OAuth2 Flow**:
```typescript
// app/api/gsc/auth/route.ts
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
    prompt: 'consent'
  })

  return NextResponse.redirect(url)
}
```

**Data Sync**:
```typescript
// app/api/gsc/sync/route.ts
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's OAuth tokens from database
  const { data: tokens } = await supabase
    .from('gsc_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const oauth2Client = new google.auth.OAuth2(/*...*/)
  oauth2Client.setCredentials(tokens)

  const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client })

  // Fetch last 30 days of data
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  const response = await searchconsole.searchanalytics.query({
    siteUrl: project.domain,
    requestBody: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'page', 'date', 'device', 'country'],
      rowLimit: 25000
    }
  })

  // Insert into gsc_data table
  for (const row of response.data.rows) {
    await supabase.from('gsc_data').upsert({
      project_id: project.id,
      date: row.keys[2],
      query: row.keys[0],
      page: row.keys[1],
      device: row.keys[3],
      country: row.keys[4],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    })
  }
}
```

### 3. AI Chat Widget Implementation

**Chat API with Function Calling**:
```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const functions = [
  {
    name: 'getProjectKeywords',
    description: 'Get all keywords for a project',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' }
      }
    }
  },
  {
    name: 'getRankingHistory',
    description: 'Get ranking history for a keyword',
    parameters: {
      type: 'object',
      properties: {
        keywordId: { type: 'string' },
        days: { type: 'number' }
      }
    }
  },
  // ... more functions
]

export async function POST(request: NextRequest) {
  const { messages } = await request.json()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    functions,
    function_call: 'auto',
    stream: true
  })

  // Handle streaming response and function calls
  // Store messages in chat_messages table

  return new Response(stream)
}
```

**Chat Widget Component**:
```typescript
// components/chat/ChatWidget.tsx
'use client'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-primary-600 p-4 shadow-lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">SEO Assistant</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>

          <ChatInput onSend={handleSend} />
        </div>
      )}
    </div>
  )
}
```

### 4. Backlink Outreach Implementation

**Email Webhook Integration**:
```typescript
// app/api/outreach/send-email/route.ts
export async function POST(request: NextRequest) {
  const { prospectId, templateId } = await request.json()
  const supabase = createClient()

  // Get prospect and template data
  const { data: prospect } = await supabase
    .from('outreach_prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  const { data: template } = await supabase
    .from('outreach_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  // Replace template variables
  const personalizedSubject = template.subject
    .replace('{{contact_name}}', prospect.contact_name)
    .replace('{{domain}}', prospect.domain)

  const personalizedBody = template.body
    .replace('{{contact_name}}', prospect.contact_name)
    .replace('{{domain}}', prospect.domain)
    // ... more replacements

  // Send via webhook (user can configure Resend, SendGrid, etc.)
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: prospect.contact_email,
      subject: personalizedSubject,
      html: personalizedBody,
      metadata: {
        prospect_id: prospectId,
        campaign_id: prospect.campaign_id
      }
    })
  })

  // Update prospect status
  await supabase
    .from('outreach_prospects')
    .update({
      status: 'contacted',
      email_sent_at: new Date().toISOString()
    })
    .eq('id', prospectId)
}
```

### 5. Daily Rank Checking (Cron Job)

Use **Vercel Cron Jobs** to:
- Run daily at a scheduled time
- Query all active keywords across all projects
- Call DataForSEO SERP API to get current rankings
- Insert new ranking records into `rankings` table
- Detect significant changes and create alerts

**vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-rank-check",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/gsc-sync",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 3. Data Visualization

Use **Recharts** for:
- Line charts for ranking trends over time
- Bar charts for ranking distribution
- Area charts for visibility scores
- Comparison charts for competitor analysis

### 4. Real-time Updates (Optional)

Use Supabase real-time subscriptions to:
- Show live ranking updates as they're checked
- Notify users of new backlinks
- Update project stats in real-time

### 5. Error Handling & User Feedback

- Toast notifications for success/error states
- Loading skeletons for data fetching
- Error boundaries for component failures
- Graceful API error handling with user-friendly messages

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# DataForSEO API
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Google Search Console (OAuth)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# OpenAI for AI Chat Assistant (REQUIRED)
OPENAI_API_KEY=your_openai_key

# Email Webhook for Outreach (user configurable)
EMAIL_WEBHOOK_URL=https://api.resend.com/emails
# Or: https://api.sendgrid.com/v3/mail/send
# Or: https://api.mailgun.net/v3/your-domain/messages
# Or: custom webhook endpoint

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Configure Vercel Cron Jobs for daily rank checks
4. Deploy with automatic CI/CD on git push

### Supabase Setup
1. Create new Supabase project
2. Run migration SQL to create all tables
3. Enable RLS and create policies
4. Configure auth settings (email templates, redirects)
5. Set up database backups

## Development Workflow

1. **Initial Setup**:
   ```bash
   npx create-next-app@latest connor-seo-tool
   cd connor-seo-tool
   npm install @supabase/ssr @supabase/supabase-js
   npm install @tanstack/react-query
   npm install recharts
   npm install -D tailwindcss
   ```

2. **Database Setup**:
   - Create Supabase project
   - Run SQL migrations to create tables
   - Set up RLS policies

3. **Authentication Implementation**:
   - Set up Supabase client and server utilities
   - Create auth middleware
   - Build login/register pages
   - Implement protected routes

4. **Core Features (in order)**:
   - Project management CRUD
   - Keyword research integration (DataForSEO)
   - Keyword tracking and ranking display
   - Ranking history and charts
   - **Google Search Console integration (PRIORITY)**
   - **AI Chat Widget (PRIORITY)**
   - Competitor analysis
   - Backlink monitoring
   - Backlink outreach builder with email webhook
   - API usage tracking
   - Reporting features

5. **Testing**:
   - Test all auth flows
   - Verify RLS policies work correctly
   - Test DataForSEO integration
   - Test daily cron job execution
   - Performance testing for large datasets

## Success Criteria

The project is complete when:
- ✅ Users can register and log in securely
- ✅ Users can create and manage multiple website projects
- ✅ Keyword research returns accurate data from DataForSEO (volume, difficulty, CPC)
- ✅ Keywords can be tracked and historical rankings are stored
- ✅ Ranking charts display properly with trend data
- ✅ **Google Search Console OAuth works and data syncs automatically**
- ✅ **GSC data displays in unified views with DataForSEO rankings**
- ✅ **AI chat widget is functional and can query user's SEO data**
- ✅ **Chat assistant provides intelligent insights based on actual project data**
- ✅ Competitor domains can be added and compared
- ✅ Backlink data is fetched and displayed
- ✅ **Outreach campaigns can be created with prospect management**
- ✅ **Email templates work with variable substitution**
- ✅ **Webhook email sending integration is functional**
- ✅ Daily automated rank checking runs successfully via cron
- ✅ Daily GSC sync runs successfully via cron
- ✅ API usage is tracked and displayed to users
- ✅ All features work on both desktop and mobile browsers
- ✅ Application is deployed to Vercel and accessible
- ✅ Database is secure with proper RLS policies

## Additional Notes

- **Use TypeScript strictly** - no `any` types unless absolutely necessary
- **Follow Next.js best practices** - Server Components by default, Client Components only when needed
- **Optimize for performance** - Implement caching, pagination, lazy loading
- **Mobile responsive** - All pages must work well on mobile devices
- **Accessibility** - Follow WCAG guidelines, proper ARIA labels
- **SEO optimized** - Proper meta tags, sitemap, robots.txt
- **Security first** - Validate all inputs, sanitize data, use parameterized queries via Supabase client

## Reference Implementation

The working authentication pattern is based on the **besmaras-loot-tracker-external** app, which successfully uses:
- Frontend-only Supabase authentication
- Next.js App Router
- Protected routes with middleware
- Supabase SSR package for server/client separation

This project should follow the same architectural patterns for auth while extending it with SEO-specific features.

---

**Ready to build?** Use this specification with Claude Code to create Connor's SEO Tool from scratch in a new repository.
