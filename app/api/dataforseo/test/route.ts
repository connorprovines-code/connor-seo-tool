import { NextRequest, NextResponse } from 'next/server'
import { dataForSEO } from '@/lib/dataforseo/client'

nexport const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { keyword = 'seo' } = await request.json()

    console.log('Testing DataForSEO connection...')
    console.log('Keyword:', keyword)

    // Test API call
    const result = await dataForSEO.getKeywordIdeas(keyword, 2840)

    console.log('DataForSEO Response:', JSON.stringify(result, null, 2))

    if (!result.tasks || !result.tasks[0]?.result) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response from DataForSEO',
        response: result,
      }, { status: 500 })
    }

    const ideas = result.tasks[0].result[0]?.items || []

    return NextResponse.json({
      success: true,
      keyword,
      ideasCount: ideas.length,
      sampleIdeas: ideas.slice(0, 5).map((idea: any) => ({
        keyword: idea.keyword,
        search_volume: idea.search_volume,
        competition: idea.competition,
        cpc: idea.cpc,
      })),
      fullResponse: result,
    })
  } catch (error: any) {
    console.error('DataForSEO test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      stack: error.stack,
    }, { status: 500 })
  }
}
