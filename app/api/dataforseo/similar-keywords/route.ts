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
      keyword,
      locationCode = 2840,
      includeSERP = true,
      limit = 20
    } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    // Get keyword ideas (related keywords)
    const ideasResult = await dataForSEO.getKeywordIdeas(keyword, locationCode)

    console.log('DataForSEO keyword ideas response:', JSON.stringify(ideasResult, null, 2))

    if (!ideasResult.tasks || !ideasResult.tasks[0]?.result) {
      console.error('No keyword ideas found in response:', ideasResult)
      return NextResponse.json(
        { error: 'No keyword ideas found', debug: ideasResult },
        { status: 500 }
      )
    }

    const ideas = ideasResult.tasks[0].result[0]?.items || []
    console.log(`Found ${ideas.length} keyword ideas for "${keyword}"`)

    const limitedIdeas = ideas.slice(0, limit)

    // If SERP data is requested, fetch rankings for each keyword
    let enhancedIdeas = limitedIdeas

    if (includeSERP && limitedIdeas.length > 0) {
      // Fetch SERP results for each keyword (limit to avoid too many API calls)
      const serpPromises = limitedIdeas.slice(0, 10).map(async (idea: any) => {
        try {
          const serpResult = await dataForSEO.getSERPResults(
            idea.keyword,
            locationCode,
            'desktop'
          )

          if (serpResult.tasks && serpResult.tasks[0]?.result) {
            const items = serpResult.tasks[0].result[0]?.items || []

            // Extract top 10 organic results
            const topRankings = items
              .filter((item: any) => item.type === 'organic')
              .slice(0, 10)
              .map((item: any) => ({
                position: item.rank_absolute,
                url: item.url,
                domain: item.domain,
                title: item.title,
                description: item.description,
              }))

            return {
              ...idea,
              serp_rankings: topRankings,
              serp_features: serpResult.tasks[0].result[0]?.check_url || null,
            }
          }
        } catch (error) {
          console.error(`Failed to fetch SERP for ${idea.keyword}:`, error)
        }
        return idea
      })

      const serpResults = await Promise.all(serpPromises)

      // Combine SERP results with remaining ideas (without SERP data)
      enhancedIdeas = [
        ...serpResults,
        ...limitedIdeas.slice(10),
      ]
    }

    // Track API usage
    const creditsUsed = 1 + (includeSERP ? Math.min(limitedIdeas.length, 10) : 0)
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'similar_keywords',
      credits_used: creditsUsed,
      request_data: { keyword, locationCode, includeSERP, limit },
    })

    return NextResponse.json({
      keyword,
      total_ideas: ideas.length,
      returned_ideas: enhancedIdeas.length,
      ideas: enhancedIdeas,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Similar keywords error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch similar keywords',
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
