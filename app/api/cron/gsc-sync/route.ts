import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for cron jobs (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting GSC sync...')

    // Get all GSC tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('gsc_tokens')
      .select('*')

    if (tokensError) {
      throw new Error(`Failed to fetch GSC tokens: ${tokensError.message}`)
    }

    let totalSynced = 0
    let totalErrors = 0

    // Process each token (user)
    for (const token of tokens || []) {
      try {
        // TODO: Implement GSC sync when GSC integration is complete
        // This would:
        // 1. Refresh OAuth token if needed
        // 2. Call Google Search Console API
        // 3. Fetch last 7 days of data
        // 4. Insert into gsc_data table

        console.log(`GSC sync for project ${token.project_id} - pending implementation`)

        // Placeholder for now
        totalSynced++
      } catch (error) {
        console.error(`Error syncing GSC for token ${token.id}:`, error)
        totalErrors++
      }
    }

    console.log(`GSC sync complete: ${totalSynced} synced, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      totalSynced,
      totalErrors,
      timestamp: new Date().toISOString(),
      note: 'GSC sync pending full implementation',
    })
  } catch (error: any) {
    console.error('GSC sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run GSC sync' },
      { status: 500 }
    )
  }
}
