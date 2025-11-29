import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gscClient } from '@/lib/gsc/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get GSC token for this project
    const { data: token, error: tokenError } = await supabase
      .from('gsc_tokens')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'GSC not connected for this project' },
        { status: 404 }
      )
    }

    console.log(`Starting manual GSC sync for project ${projectId}`)

    // Check if token needs refresh
    const tokenExpiry = new Date(token.token_expiry)
    const now = new Date()
    let accessToken = token.access_token
    let refreshToken = token.refresh_token

    if (tokenExpiry <= now) {
      console.log(`Token expired, refreshing...`)
      const newTokens = await gscClient.refreshAccessToken(token.refresh_token)
      accessToken = newTokens.access_token!
      refreshToken = newTokens.refresh_token || token.refresh_token

      // Update token in database
      await supabase
        .from('gsc_tokens')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: new Date(newTokens.expiry_date!).toISOString(),
        })
        .eq('id', token.id)
    }

    // Calculate date range (last 30 days for manual sync)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // Yesterday
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30) // 30 days ago

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log(`Fetching GSC data from ${startDateStr} to ${endDateStr}`)

    // Fetch search analytics from GSC
    const rows = await gscClient.getSearchAnalytics(
      token.site_url,
      accessToken,
      refreshToken,
      startDateStr,
      endDateStr
    )

    console.log(`Fetched ${rows.length} rows from GSC`)

    // Transform and insert data
    const dataToInsert = rows.map((row: any) => ({
      project_id: projectId,
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
    let insertedCount = 0

    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('gsc_data')
        .upsert(batch, {
          onConflict: 'project_id,date,page,query,device,country',
        })

      if (insertError) {
        console.error(`Error inserting GSC data batch:`, insertError)
        return NextResponse.json(
          { error: 'Failed to save GSC data', details: insertError.message },
          { status: 500 }
        )
      }

      insertedCount += batch.length
    }

    console.log(`Successfully synced ${insertedCount} rows`)

    return NextResponse.json({
      success: true,
      rowsInserted: insertedCount,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
    })
  } catch (error: any) {
    console.error('GSC manual sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync GSC data' },
      { status: 500 }
    )
  }
}
