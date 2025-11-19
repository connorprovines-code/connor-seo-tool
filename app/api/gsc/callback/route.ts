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
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // project ID
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=missing_parameters', request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await gscClient.getTokensFromCode(code)

    // Get verified sites
    const sites = await gscClient.getSites(
      tokens.access_token!,
      tokens.refresh_token!
    )

    // Use the first verified site (or you could present a choice)
    const siteUrl = sites[0]?.siteUrl

    if (!siteUrl) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=no_verified_sites', request.url)
      )
    }

    // Save tokens to database
    const { error: dbError } = await supabase.from('gsc_tokens').upsert({
      user_id: user.id,
      project_id: state,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      token_expiry: new Date(tokens.expiry_date!).toISOString(),
      site_url: siteUrl,
    })

    if (dbError) {
      console.error('Failed to save GSC tokens:', dbError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=save_failed', request.url)
      )
    }

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL('/settings/integrations?success=true', request.url)
    )
  } catch (error: any) {
    console.error('GSC callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${error.message}`, request.url)
    )
  }
}
