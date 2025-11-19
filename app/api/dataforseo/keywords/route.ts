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

    const { keywords, locationCode = 2840 } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    // Call DataForSEO API
    const result = await dataForSEO.getKeywordMetrics(keywords, locationCode)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'keywords_data',
      credits_used: keywords.length,
      request_data: { keywords, locationCode },
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Keyword research error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword data' },
      { status: 500 }
    )
  }
}
