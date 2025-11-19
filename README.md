# Connor's SEO Tool - Project Specification

## Overview
Build a comprehensive SEO management dashboard that allows users to track keyword rankings, analyze competitors, monitor backlinks, and manage multiple website projects. This is a **Next.js + Supabase** application with modern best practices.

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

### 6. Backlink Monitoring
- Backlink profile overview (total backlinks, referring domains)
- New and lost backlinks tracking
- Domain authority/rating metrics
- Anchor text distribution
- Top referring domains
- Toxic backlink detection
- Backlink growth over time charts

### 7. Google Search Console Integration
- OAuth2 integration with Google Search Console
- Import search analytics data:
  - Clicks, impressions, CTR, average position
  - Top performing pages
  - Top queries
  - Geographic performance
- Historical data sync (last 16 months)
- Automatic daily updates
- Combined GSC + manual tracking views

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

### 10. AI Assistant (Optional/Future)
- Chat interface for SEO insights
- Natural language queries ("What keywords am I ranking for in position 2-5?")
- Content optimization suggestions
- Keyword clustering and grouping recommendations
- Uses OpenAI API with project context

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
│   │   ├── layout.tsx          # Protected layout with nav
│   │   ├── page.tsx             # Main dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx         # Projects list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # Project detail
│   │   │   │   ├── keywords/
│   │   │   │   ├── rankings/
│   │   │   │   ├── competitors/
│   │   │   │   └── backlinks/
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── keyword-research/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── dataforseo/
│   │   │   ├── keywords/route.ts
│   │   │   ├── rankings/route.ts
│   │   │   └── backlinks/route.ts
│   │   ├── gsc/
│   │   │   ├── auth/route.ts
│   │   │   └── data/route.ts
│   │   └── cron/
│   │       └── daily-rank-check/route.ts
│   ├── layout.tsx
│   └── page.tsx                 # Landing/welcome page
├── components/
│   ├── ui/                      # Shadcn components
│   ├── auth/
│   ├── projects/
│   ├── keywords/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── middleware.ts        # Auth middleware
│   ├── dataforseo/
│   │   └── client.ts
│   ├── gsc/
│   │   └── client.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProject.ts
│   └── useKeywords.ts
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

### 2. Daily Rank Checking (Cron Job)

Use **Vercel Cron Jobs** or **Supabase Edge Functions** to:
- Run daily at a scheduled time
- Query all active keywords across all projects
- Call DataForSEO SERP API to get current rankings
- Insert new ranking records into `rankings` table
- Detect significant changes and create alerts

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

# Optional: OpenAI for AI features
OPENAI_API_KEY=your_openai_key

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
   - Keyword research integration
   - Keyword tracking and ranking display
   - Ranking history and charts
   - Competitor analysis
   - Backlink monitoring
   - Google Search Console integration
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
- ✅ Keyword research returns accurate data from DataForSEO
- ✅ Keywords can be tracked and historical rankings are stored
- ✅ Ranking charts display properly with trend data
- ✅ Competitor domains can be added and compared
- ✅ Backlink data is fetched and displayed
- ✅ Google Search Console integration works end-to-end
- ✅ Daily automated rank checking runs successfully
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
