import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Webhook callback endpoint for n8n to update outreach campaign status
 *
 * Expected payload from n8n:
 * {
 *   campaign_id: string,
 *   target_domain: string,
 *   status: 'researching' | 'drafted' | 'sent' | 'opened' | 'replied' | 'link_acquired' | 'declined',
 *   contact_info?: { emails: [], social: [] },
 *   research_data?: { ... },
 *   outreach_email?: string,
 *   response_data?: { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    const {
      campaign_id,
      target_domain,
      status,
      contact_info,
      research_data,
      outreach_email,
      response_data,
    } = payload

    if (!campaign_id || !target_domain) {
      return NextResponse.json(
        { error: 'campaign_id and target_domain are required' },
        { status: 400 }
      )
    }

    console.log(`Webhook callback for campaign ${campaign_id}, target ${target_domain}, status ${status}`)

    // Use service role to bypass RLS (webhook is trusted)
    const supabase = await createClient()

    // Find the target
    const { data: target, error: findError } = await supabase
      .from('outreach_targets')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('domain', target_domain)
      .single()

    if (findError || !target) {
      console.error('Target not found:', findError)
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    // Update target with new data
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updates.status = status

      // Set timestamp based on status
      if (status === 'sent' && !target.contacted_at) {
        updates.contacted_at = new Date().toISOString()
      }
      if (status === 'replied' && !target.replied_at) {
        updates.replied_at = new Date().toISOString()
      }
      if (status === 'link_acquired' && !target.link_acquired_at) {
        updates.link_acquired_at = new Date().toISOString()
      }
    }

    if (contact_info) {
      updates.contact_info = contact_info
    }

    if (research_data) {
      updates.research_data = research_data
    }

    if (outreach_email) {
      updates.outreach_email = outreach_email
    }

    if (response_data) {
      updates.response_data = response_data
    }

    const { error: updateError } = await supabase
      .from('outreach_targets')
      .update(updates)
      .eq('id', target.id)

    if (updateError) {
      console.error('Failed to update target:', updateError)
      return NextResponse.json(
        { error: 'Failed to update target' },
        { status: 500 }
      )
    }

    // Update campaign-level stats
    const { data: campaignTargets } = await supabase
      .from('outreach_targets')
      .select('status')
      .eq('campaign_id', campaign_id)

    if (campaignTargets) {
      const sentCount = campaignTargets.filter((t) => ['sent', 'opened', 'replied', 'link_acquired', 'declined'].includes(t.status)).length
      const repliedCount = campaignTargets.filter((t) => ['replied', 'link_acquired'].includes(t.status)).length
      const linkAcquiredCount = campaignTargets.filter((t) => t.status === 'link_acquired').length

      await supabase
        .from('outreach_campaigns')
        .update({
          sent_count: sentCount,
          replied_count: repliedCount,
          link_acquired_count: linkAcquiredCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign_id)
    }

    console.log(`Updated target ${target_domain} to status ${status}`)

    return NextResponse.json({
      success: true,
      target_id: target.id,
      campaign_id: campaign_id,
      status: updates.status || target.status,
    })
  } catch (error: any) {
    console.error('Webhook callback error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process webhook callback',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}

// Allow n8n to verify the webhook endpoint
export async function GET() {
  return NextResponse.json({
    service: 'SEO Tool - Outreach Webhook Callback',
    status: 'active',
    version: '1.0',
  })
}
