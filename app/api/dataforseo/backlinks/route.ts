import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dataForSEO } from '@/lib/dataforseo/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


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

    console.log(`Fetching backlinks for domain: ${domain}`)

    // Call DataForSEO API
    const result = await dataForSEO.getBacklinks(domain)

    console.log('DataForSEO backlinks result:', {
      hasTasks: !!result.tasks,
      tasksLength: result.tasks?.length,
      firstTaskHasResult: !!result.tasks?.[0]?.result,
      statusCode: result.status_code,
      statusMessage: result.status_message,
    })

    if (!result.tasks || !result.tasks[0]) {
      return NextResponse.json(
        { error: 'No tasks returned from DataForSEO', details: result },
        { status: 500 }
      )
    }

    if (!result.tasks[0].result || result.tasks[0].result.length === 0) {
      console.log('No backlinks found for domain')
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No backlinks found for this domain',
      })
    }

    const backlinks = result.tasks[0].result[0]?.items || []
    console.log(`Found ${backlinks.length} backlinks`)

    // Save backlinks to database in batches
    const backlinkData = backlinks.slice(0, 100).map((backlink: any) => ({
      project_id: projectId,
      source_url: backlink.url_from,
      target_url: backlink.url_to,
      anchor_text: backlink.anchor,
      domain_rank: backlink.rank,
      link_type: backlink.dofollow ? 'dofollow' : 'nofollow',
      first_seen: backlink.first_seen || new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_lost: false,
    }))

    const { error: upsertError } = await supabase.from('backlinks').upsert(
      backlinkData,
      {
        onConflict: 'source_url,target_url',
      }
    )

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save backlinks to database', details: upsertError.message },
        { status: 500 }
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

    console.log(`Successfully saved ${backlinkData.length} backlinks`)

    return NextResponse.json({
      success: true,
      count: backlinkData.length,
    })
  } catch (error: any) {
    console.error('Backlinks error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch backlinks', stack: error.stack },
      { status: 500 }
    )
  }
}
