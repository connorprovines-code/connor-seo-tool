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

    const { keyword, locationCode = 2840 } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    // Call DataForSEO API
    const result = await dataForSEO.getKeywordIdeas(keyword, locationCode)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'keyword_ideas',
      credits_used: 1,
      request_data: { keyword, locationCode },
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Keyword ideas error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword ideas' },
      { status: 500 }
    )
  }
}
