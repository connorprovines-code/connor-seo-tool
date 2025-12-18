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

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { projectId, domain } = body

    if (!projectId || !domain) {
      return NextResponse.json(
        { error: 'Project ID and domain are required' },
        { status: 400 }
      )
    }

    // Verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, domain')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`[Backlinks API] Fetching backlinks for domain: ${domain}`)

    // Call DataForSEO API
    let result
    try {
      result = await dataForSEO.getBacklinks(domain)
    } catch (apiError: any) {
      console.error('[Backlinks API] DataForSEO error:', apiError.message)
      return NextResponse.json(
        { error: 'DataForSEO API error', details: apiError.message },
        { status: 502 }
      )
    }

    console.log('[Backlinks API] DataForSEO response:', {
      statusCode: result.status_code,
      tasksCount: result.tasks?.length,
      hasResult: !!result.tasks?.[0]?.result,
    })

    // Check for API-level errors
    if (result.status_code && result.status_code >= 40000) {
      return NextResponse.json(
        { error: 'DataForSEO error', details: result.status_message },
        { status: 502 }
      )
    }

    if (!result.tasks || !result.tasks[0]) {
      return NextResponse.json(
        { error: 'No response from DataForSEO', details: result },
        { status: 502 }
      )
    }

    // Check task-level status
    const task = result.tasks[0]
    if (task.status_code && task.status_code >= 40000) {
      return NextResponse.json(
        { error: 'DataForSEO task error', details: task.status_message },
        { status: 502 }
      )
    }

    if (!task.result || task.result.length === 0) {
      console.log('[Backlinks API] No backlinks found for domain')
      return NextResponse.json({
        success: true,
        count: 0,
        total_found: 0,
        message: 'No backlinks found for this domain',
      })
    }

    const backlinks = task.result[0]?.items || []
    const totalCount = task.result[0]?.total_count || backlinks.length
    console.log(`[Backlinks API] Found ${totalCount} total backlinks, processing ${Math.min(backlinks.length, 100)}`)

    // Filter out invalid backlinks and limit to 100
    const validBacklinks = backlinks
      .filter((b: any) => b.url_from && b.url_to)
      .slice(0, 100)

    if (validBacklinks.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        total_found: totalCount,
        message: 'No valid backlinks found',
      })
    }

    // Prepare data for database
    const backlinkData = validBacklinks.map((backlink: any) => ({
      project_id: projectId,
      source_url: backlink.url_from,
      target_url: backlink.url_to,
      anchor_text: backlink.anchor || null,
      domain_rank: backlink.rank || backlink.domain_from_rank || null,
      page_rank: backlink.page_from_rank || null,
      link_type: backlink.dofollow ? 'dofollow' : 'nofollow',
      first_seen: backlink.first_seen || new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_lost: false,
    }))

    // Upsert backlinks
    const { error: upsertError } = await supabase.from('backlinks').upsert(
      backlinkData,
      { onConflict: 'source_url,target_url' }
    )

    if (upsertError) {
      console.error('[Backlinks API] Database upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save backlinks', details: upsertError.message },
        { status: 500 }
      )
    }

    // Track API usage (non-blocking)
    void supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'backlinks',
      credits_used: 1,
      request_data: { domain, backlinks_found: totalCount },
    })

    console.log(`[Backlinks API] Successfully saved ${backlinkData.length} backlinks`)

    return NextResponse.json({
      success: true,
      count: backlinkData.length,
      total_found: totalCount,
    })
  } catch (error: any) {
    console.error('[Backlinks API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch backlinks' },
      { status: 500 }
    )
  }
}
