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

    const { keyword, domain, locationCode = 2840, device = 'desktop' } = await request.json()

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: 'Keyword and domain are required' },
        { status: 400 }
      )
    }

    // Call DataForSEO API
    const result = await dataForSEO.getSERPResults(keyword, locationCode, device)

    if (!result.tasks || !result.tasks[0] || !result.tasks[0].result) {
      return NextResponse.json(
        { error: 'No results from DataForSEO' },
        { status: 500 }
      )
    }

    const items = result.tasks[0].result[0]?.items || []

    // Find domain's ranking
    let position = null
    let rankUrl = null

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.url && item.url.includes(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))) {
        position = item.rank_absolute
        rankUrl = item.url
        break
      }
    }

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'serp_check',
      credits_used: 1,
      request_data: { keyword, domain, locationCode, device },
    })

    return NextResponse.json({
      keyword,
      domain,
      position,
      rankUrl,
      totalResults: items.length,
      serpFeatures: result.tasks[0].result[0]?.se_results_count || 0,
    })
  } catch (error: any) {
    console.error('Rank check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check ranking' },
      { status: 500 }
    )
  }
}
