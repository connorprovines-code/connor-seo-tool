import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dataForSEO } from '@/lib/dataforseo/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, domain } = await request.json()

    if (!projectId || !domain) {
      return NextResponse.json(
        { error: 'Project ID and domain are required' },
        { status: 400 }
      )
    }

    // Call DataForSEO API
    const result = await dataForSEO.getBacklinks(domain)

    if (!result.tasks || !result.tasks[0] || !result.tasks[0].result) {
      return NextResponse.json(
        { error: 'No results from DataForSEO' },
        { status: 500 }
      )
    }

    const backlinks = result.tasks[0].result[0]?.items || []

    // Save backlinks to database
    for (const backlink of backlinks.slice(0, 100)) {
      // Limit to 100
      await supabase.from('backlinks').upsert(
        {
          project_id: projectId,
          source_url: backlink.url_from,
          target_url: backlink.url_to,
          anchor_text: backlink.anchor,
          domain_rank: backlink.rank,
          link_type: backlink.dofollow ? 'dofollow' : 'nofollow',
          first_seen: backlink.first_seen || new Date().toISOString(),
          last_seen: new Date().toISOString(),
          is_lost: false,
        },
        {
          onConflict: 'source_url,target_url',
        }
      )
    }

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'backlinks',
      credits_used: 1,
      request_data: { domain },
    })

    return NextResponse.json({
      success: true,
      count: backlinks.length,
    })
  } catch (error: any) {
    console.error('Backlinks error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch backlinks' },
      { status: 500 }
    )
  }
}
