import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gscClient } from '@/lib/gsc/client'

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
        console.log(`Starting GSC sync for project ${token.project_id}`)

        // 1. Refresh token if needed (check if token is expired)
        const tokenExpiry = new Date(token.token_expiry)
        const now = new Date()
        let accessToken = token.access_token
        let refreshToken = token.refresh_token

        if (tokenExpiry <= now) {
          console.log(`Token expired, refreshing for project ${token.project_id}`)
          const newTokens = await gscClient.refreshAccessToken(token.refresh_token)
          accessToken = newTokens.access_token!
          refreshToken = newTokens.refresh_token || token.refresh_token

          // Update token in database
          await supabaseAdmin
            .from('gsc_tokens')
            .update({
              access_token: accessToken,
              refresh_token: refreshToken,
              token_expiry: new Date(newTokens.expiry_date!).toISOString(),
            })
            .eq('id', token.id)
        }

        // 2. Calculate date range (last 7 days)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() - 1) // Yesterday (GSC data has ~2 day delay)
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 7) // 7 days ago

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        console.log(`Fetching GSC data for ${startDateStr} to ${endDateStr}`)

        // 3. Fetch search analytics from GSC
        const rows = await gscClient.getSearchAnalytics(
          token.site_url,
          accessToken,
          refreshToken,
          startDateStr,
          endDateStr
        )

        console.log(`Fetched ${rows.length} rows from GSC for project ${token.project_id}`)

        // 4. Insert data into gsc_data table (upsert to avoid duplicates)
        const dataToInsert = rows.map((row: any) => ({
          project_id: token.project_id,
          date: row.keys[2], // date dimension
          page: row.keys[1], // page dimension
          query: row.keys[0], // query dimension
          device: row.keys[3], // device dimension
          country: row.keys[4], // country dimension
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }))

        // Insert in batches of 1000
        const batchSize = 1000
        for (let i = 0; i < dataToInsert.length; i += batchSize) {
          const batch = dataToInsert.slice(i, i + batchSize)
          const { error: insertError } = await supabaseAdmin
            .from('gsc_data')
            .upsert(batch, {
              onConflict: 'project_id,date,page,query,device,country',
            })

          if (insertError) {
            console.error(`Error inserting GSC data batch:`, insertError)
            throw insertError
          }
        }

        console.log(`Successfully synced ${dataToInsert.length} rows for project ${token.project_id}`)
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
    })
  } catch (error: any) {
    console.error('GSC sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run GSC sync' },
      { status: 500 }
    )
  }
}
