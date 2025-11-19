import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gscClient } from '@/lib/gsc/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Generate OAuth URL with project ID in state
    const authUrl = gscClient.getAuthUrl(projectId)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('GSC auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate GSC authentication' },
      { status: 500 }
    )
  }
}
