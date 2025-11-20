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

    const {
      domain,
      locationCode = 2840,
      limit = 100,
      offset = 0,
      filters,
      orderBy,
    } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Clean domain (remove https://, www., trailing slash)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')

    console.log(`Fetching keywords for domain: ${cleanDomain}`)

    // Get keywords for the domain
    const result = await dataForSEO.getKeywordsForSite(cleanDomain, locationCode, {
      limit: Math.min(limit, 1000),
      offset,
      filters,
      orderBy,
      includeSerp: false,
    })

    console.log('DataForSEO Ranked Keywords response:', JSON.stringify(result, null, 2))

    if (!result.tasks || !result.tasks[0]?.result) {
      console.error('No keywords found for domain:', result)
      return NextResponse.json(
        { error: 'No keywords found for this domain', debug: result },
        { status: 404 }
      )
    }

    const taskResult = result.tasks[0].result[0]
    const keywords = taskResult?.items || []

    console.log(`Found ${keywords.length} keywords for domain "${cleanDomain}"`)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'ranked_keywords',
      credits_used: 1,
      request_data: { domain: cleanDomain, locationCode, limit },
    })

    // Log first item to debug structure
    if (keywords.length > 0) {
      console.log('First ranked keyword item:', JSON.stringify(keywords[0], null, 2))
    }

    return NextResponse.json({
      domain: cleanDomain,
      total_count: taskResult?.total_count || 0,
      items_count: keywords.length,
      keywords: keywords.map((item: any) => ({
        keyword: item.keyword_data?.keyword || '',
        position: item.ranked_serp_element?.serp_item?.rank_absolute || null,
        search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
        competition: item.keyword_data?.keyword_info?.competition || null,
        cpc: item.keyword_data?.keyword_info?.cpc || 0,
        keyword_difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty || null,
        url: item.ranked_serp_element?.serp_item?.url || null,
        title: item.ranked_serp_element?.serp_item?.title || null,
        etv: item.impressions_info?.etv || 0,
        estimated_paid_traffic_cost: item.impressions_info?.estimated_paid_traffic_cost || 0,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Keywords for site error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch keywords for domain',
        details: error.toString(),
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
