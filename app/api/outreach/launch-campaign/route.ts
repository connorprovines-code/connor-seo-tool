import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      keywordId,
      keyword,
      targets,
      webhookUrl,
      yourDomain,
      campaignName,
    } = await request.json()

    if (!projectId || !keywordId || !targets || !webhookUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`Launching outreach campaign for keyword "${keyword}"`)

    // 1. Create campaign in database
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .insert({
        project_id: projectId,
        keyword_id: keywordId,
        user_id: user.id,
        campaign_name: campaignName || `${keyword} - Outreach`,
        keyword,
        status: 'pending',
        target_count: targets.length,
        targets,
        webhook_url: webhookUrl,
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      console.error('Failed to create campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    console.log(`Created campaign ${campaign.id}`)

    // 2. Create individual target records
    const targetRecords = targets.map((target: any) => ({
      campaign_id: campaign.id,
      project_id: projectId,
      domain: target.domain,
      target_url: target.target_url,
      target_score: target.target_score,
      domain_rating: target.metrics.domain_rating,
      monthly_traffic: target.metrics.monthly_traffic,
      referring_domains: target.metrics.referring_domains,
      why_targeted: target.why_targeted,
      outreach_angle: target.outreach_angle,
      pitch_hook: target.pitch_hook,
      research_prompts: target.research_prompts,
      status: 'pending',
    }))

    const { error: targetsError } = await supabase
      .from('outreach_targets')
      .insert(targetRecords)

    if (targetsError) {
      console.error('Failed to create target records:', targetsError)
      // Continue anyway - campaign is created
    }

    // 3. Prepare webhook payload for n8n
    const webhookPayload = {
      campaign_id: campaign.id,
      keyword,
      keyword_id: keywordId,
      project_id: projectId,
      your_domain: yourDomain,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outreach/webhook-callback`,
      targets: targets.map((target: any) => ({
        target_id: null, // n8n can store this if needed
        domain: target.domain,
        target_url: target.target_url,
        target_score: target.target_score,
        metrics: target.metrics,
        why_targeted: target.why_targeted,
        outreach_angle: target.outreach_angle,
        pitch_hook: target.pitch_hook,
        research_prompts: target.research_prompts,
      })),
      created_at: campaign.created_at,
    }

    // 4. Fire webhook to n8n
    console.log(`Firing webhook to ${webhookUrl}`)

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      })

      const webhookData = await webhookResponse.json().catch(() => ({}))

      // Update campaign with webhook response
      await supabase
        .from('outreach_campaigns')
        .update({
          webhook_fired_at: new Date().toISOString(),
          webhook_response: webhookData,
          status: webhookResponse.ok ? 'running' : 'pending',
        })
        .eq('id', campaign.id)

      console.log(`Webhook fired successfully. Status: ${webhookResponse.status}`)

      return NextResponse.json({
        success: true,
        campaign_id: campaign.id,
        campaign_name: campaign.campaign_name,
        targets_count: targets.length,
        webhook_status: webhookResponse.status,
        webhook_fired: webhookResponse.ok,
        message: webhookResponse.ok
          ? 'Campaign launched and webhook sent to n8n'
          : 'Campaign created but webhook failed. You can retry manually.',
      })
    } catch (webhookError: any) {
      console.error('Webhook firing failed:', webhookError)

      // Update campaign status
      await supabase
        .from('outreach_campaigns')
        .update({
          status: 'pending',
          webhook_response: { error: webhookError.message },
        })
        .eq('id', campaign.id)

      return NextResponse.json({
        success: false,
        campaign_id: campaign.id,
        error: 'Campaign created but webhook failed to fire',
        details: webhookError.message,
      })
    }
  } catch (error: any) {
    console.error('Launch campaign error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to launch campaign',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
