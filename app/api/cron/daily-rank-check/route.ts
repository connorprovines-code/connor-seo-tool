import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { dataForSEO } from '@/lib/dataforseo/client'

// Use service role key for cron jobs (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds a specific header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily rank check...')

    // Get all projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`)
    }

    let totalChecked = 0
    let totalErrors = 0

    // Process each project
    for (const project of projects || []) {
      try {
        // Get all keywords for this project
        const { data: keywords } = await supabaseAdmin
          .from('keywords')
          .select('*')
          .eq('project_id', project.id)

        if (!keywords || keywords.length === 0) continue

        // Check rankings for each keyword
        for (const keyword of keywords) {
          try {
            // Call DataForSEO API
            const result = await dataForSEO.getSERPResults(keyword.keyword, 2840, 'desktop')

            if (!result.tasks || !result.tasks[0] || !result.tasks[0].result) {
              continue
            }

            const items = result.tasks[0].result[0]?.items || []

            // Find domain's ranking
            let position = null
            let rankUrl = null

            const domainToMatch = project.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

            for (let i = 0; i < items.length; i++) {
              const item = items[i]
              if (item.url && item.url.includes(domainToMatch)) {
                position = item.rank_absolute
                rankUrl = item.url
                break
              }
            }

            // Save ranking to database
            if (position) {
              await supabaseAdmin.from('rankings').insert({
                keyword_id: keyword.id,
                project_id: project.id,
                rank_position: position,
                rank_url: rankUrl,
                rank_absolute: position,
                search_engine: 'google',
                device: 'desktop',
                location_code: 2840,
                language_code: 'en',
              })

              totalChecked++
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.error(`Error checking keyword ${keyword.keyword}:`, error)
            totalErrors++
          }
        }
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error)
        totalErrors++
      }
    }

    console.log(`Daily rank check complete: ${totalChecked} checked, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      totalChecked,
      totalErrors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Daily rank check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run daily rank check' },
      { status: 500 }
    )
  }
}
