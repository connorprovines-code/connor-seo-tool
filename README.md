# Connor's SEO Tool

A comprehensive SEO management dashboard built with Next.js and Supabase - a lightweight Ahrefs alternative that leverages DataForSEO API for keyword research, rank tracking, backlink monitoring, and competitor analysis.

![Connor's SEO Tool](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Claude AI](https://img.shields.io/badge/Claude-AI_Powered-purple)

## Features

### ✅ Implemented

- **Authentication & User Management**
  - Email/password registration and login
  - Secure session management with Supabase Auth
  - Protected routes with middleware

- **Project Management**
  - Create/edit/delete website projects
  - Multi-project support
  - Project-specific dashboards

- **Keyword Research & Tracking**
  - DataForSEO integration for keyword data
  - Search volume, competition, and CPC metrics
  - Keyword ideas and suggestions
  - Add/manage keywords per project

- **Rankings Tracking**
  - Manual rank checking via DataForSEO SERP API
  - Historical ranking data storage
  - Visual ranking trends with Recharts
  - Rankings stats (average position, top 3/10/20)

- **AI Chat Assistant (Claude)**
  - Natural language queries about your SEO data
  - Database-aware responses using Claude's tool use
  - Chat history persistence
  - Ask questions like:
    - "Show me my projects"
    - "What are my top keywords?"
    - "Analyze my keyword performance"

- **Backlink Monitoring**
  - Fetch backlinks via DataForSEO
  - Backlink profile overview
  - Referring domains tracking
  - Dofollow vs nofollow breakdown
  - Lost backlinks detection

- **Dashboard & Analytics**
  - Project statistics overview
  - Keyword performance metrics
  - Visual charts and graphs
  - Mobile-responsive design

### 🚧 Pending Implementation

- Google Search Console OAuth integration
- Competitor analysis features
- Outreach campaign management
- Automated daily rank checks (cron job)
- GSC data sync (cron job)

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Authentication**: Supabase Auth with RLS
- **APIs**: DataForSEO, Anthropic Claude
- **Charts**: Recharts
- **Deployment**: Vercel (recommended)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account
- DataForSEO API account
- Anthropic API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/connorprovines-code/connor-seo-tool.git
   cd connor-seo-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # DataForSEO
   DATAFORSEO_LOGIN=your_email
   DATAFORSEO_PASSWORD=your_password

   # Anthropic Claude
   ANTHROPIC_API_KEY=sk-ant-xxx

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Go to SQL Editor
   - Run the migration from `supabase/migrations/001_initial_schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to http://localhost:3000
   - Create an account
   - Start tracking your SEO!

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy to Vercel:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/connorprovines-code/connor-seo-tool)

## Database Schema

The application uses Supabase (PostgreSQL) with all tables having Row Level Security (RLS) enabled.

## Development

### Run in development
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm run start
```

### Lint code
```bash
npm run lint
```

## License

This project is licensed under the MIT License.

---

Made with ❤️ for SEO professionals
