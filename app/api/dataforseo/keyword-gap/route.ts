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

    const {
      projectId,
      competitorDomain,
      locationCode = 2840,
      limit = 20, // Reduced from 100 - focus on top opportunities
    } = await request.json()

    if (!projectId || !competitorDomain) {
      return NextResponse.json(
        { error: 'Project ID and competitor domain are required' },
        { status: 400 }
      )
    }

    // Clean domain
    const cleanDomain = competitorDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')

    console.log(`Starting keyword gap analysis for project ${projectId} vs ${cleanDomain}`)

    // 1. Get user's current keywords from database
    const { data: userKeywords, error: dbError } = await supabase
      .from('keywords')
      .select('keyword, search_volume, keyword_difficulty')
      .eq('project_id', projectId)

    if (dbError) {
      console.error('Database error fetching keywords:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch your keywords' },
        { status: 500 }
      )
    }

    console.log(`Found ${userKeywords?.length || 0} keywords in database`)

    // Create a Set of user keywords (lowercase for comparison)
    const userKeywordSet = new Set(
      (userKeywords || []).map((k: any) => k.keyword.toLowerCase())
    )

    // 2. Get competitor keywords from DataForSEO
    const result = await dataForSEO.getKeywordsForSite(cleanDomain, locationCode, {
      limit: Math.min(limit, 100), // Cap at 100 to control API costs
      offset: 0,
      includeSerp: false,
      orderBy: ['keyword_data.keyword_info.search_volume,desc'], // Highest volume first
    })

    if (!result.tasks || !result.tasks[0]?.result) {
      console.error('No keywords found for competitor:', result)
      return NextResponse.json(
        { error: 'No keywords found for competitor domain' },
        { status: 404 }
      )
    }

    const taskResult = result.tasks[0].result[0]
    const competitorKeywords = taskResult?.items || []

    console.log(`Found ${competitorKeywords.length} competitor keywords`)

    // 3. Compute gap analysis
    const gaps: any[] = [] // Keywords competitor has that user doesn't
    const overlaps: any[] = [] // Keywords both have

    competitorKeywords.forEach((item: any) => {
      const keyword = item.keyword_data?.keyword || ''
      const keywordLower = keyword.toLowerCase()

      const mappedKeyword = {
        keyword,
        position: item.ranked_serp_element?.serp_item?.rank_absolute || null,
        search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
        competition: item.keyword_data?.keyword_info?.competition_level?.toLowerCase() || null,
        cpc: item.keyword_data?.keyword_info?.cpc || 0,
        keyword_difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty || null,
        url: item.ranked_serp_element?.serp_item?.url || null,
        title: item.ranked_serp_element?.serp_item?.title || null,
        etv: item.impression_info?.etv || 0,
      }

      if (userKeywordSet.has(keywordLower)) {
        // Both have this keyword
        overlaps.push(mappedKeyword)
      } else {
        // Gap - competitor has it, user doesn't
        gaps.push(mappedKeyword)
      }
    })

    // Sort gaps by opportunity score (high volume, low difficulty)
    gaps.sort((a, b) => {
      const scoreA = a.search_volume * (100 - (a.keyword_difficulty || 50)) / 100
      const scoreB = b.search_volume * (100 - (b.keyword_difficulty || 50)) / 100
      return scoreB - scoreA
    })

    console.log(`Gap analysis complete: ${gaps.length} gaps, ${overlaps.length} overlaps`)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'keyword_gap',
      credits_used: 1,
      request_data: { projectId, competitorDomain: cleanDomain, limit },
    })

    return NextResponse.json({
      competitor_domain: cleanDomain,
      your_keywords_count: userKeywords?.length || 0,
      competitor_keywords_count: competitorKeywords.length,
      gaps_count: gaps.length,
      overlaps_count: overlaps.length,
      gaps, // Keywords competitor has that you don't
      overlaps, // Keywords both have
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Keyword gap analysis error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to perform keyword gap analysis',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
