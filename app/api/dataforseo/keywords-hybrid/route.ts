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
      keyword,
      locationCode = 2840,
      includeSEO = true,
      includeAds = false,
      includeRelated = true,
      limit = 100,
    } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    console.log(`Fetching hybrid keywords for "${keyword}" with options:`, {
      includeSEO,
      includeAds,
      includeRelated,
    })

    // Use hybrid approach to get keywords from multiple sources
    const keywords = await dataForSEO.getKeywordsHybrid(keyword, {
      includeSEO,
      includeAds,
      includeRelated,
      locationCode,
      limit,
    })

    console.log(`Found ${keywords.length} hybrid keywords for "${keyword}"`)

    // Track API usage
    const creditsUsed =
      (includeSEO ? 1 : 0) + (includeAds ? 1 : 0) + (includeRelated ? 1 : 0)

    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'keywords_hybrid',
      credits_used: creditsUsed,
      request_data: { keyword, locationCode, includeSEO, includeAds, includeRelated, limit },
    })

    return NextResponse.json({
      keyword,
      total_keywords: keywords.length,
      keywords,
      sources: {
        seo: includeSEO,
        ads: includeAds,
        related: includeRelated,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Hybrid keywords error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch hybrid keywords',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
