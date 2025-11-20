import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dataForSEO } from '@/lib/dataforseo/client'

interface OutreachTarget {
  domain: string
  target_url: string
  target_score: number
  metrics: {
    domain_rating: number
    monthly_traffic: number
    referring_domains: number
  }
  why_targeted: string
  outreach_angle: string
  pitch_hook: string
  research_prompts: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keywordId, projectId, yourDomain } = await request.json()

    if (!keywordId || !projectId) {
      return NextResponse.json(
        { error: 'Keyword ID and Project ID are required' },
        { status: 400 }
      )
    }

    console.log(`Finding outreach targets for keyword ${keywordId}`)

    // 1. Get keyword details from database
    const { data: keyword, error: keywordError } = await supabase
      .from('keywords')
      .select('keyword, search_volume, keyword_difficulty')
      .eq('id', keywordId)
      .single()

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      )
    }

    console.log(`Analyzing keyword: "${keyword.keyword}"`)

    // 2. Get SERP results (top 20 ranking sites)
    const serpResult = await dataForSEO.getSERPResults(keyword.keyword, 2840, 'desktop')

    if (!serpResult.tasks || !serpResult.tasks[0]?.result) {
      return NextResponse.json(
        { error: 'Failed to get SERP results' },
        { status: 500 }
      )
    }

    const serpItems = serpResult.tasks[0].result[0]?.items || []
    const organicResults = serpItems
      .filter((item: any) => item.type === 'organic')
      .slice(0, 20) // Top 20 only

    console.log(`Found ${organicResults.length} organic SERP results`)

    // Extract competitor domains (filter out your domain and blacklist)
    const blacklist = ['youtube.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'wikipedia.org', 'reddit.com', 'pinterest.com', 'instagram.com']
    const cleanYourDomain = yourDomain?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '') || ''

    const competitorDomains = organicResults
      .map((item: any) => ({
        domain: item.domain,
        url: item.url,
        title: item.title,
        position: item.rank_absolute,
      }))
      .filter((item: any) => {
        const domain = item.domain.toLowerCase()
        return (
          domain !== cleanYourDomain.toLowerCase() &&
          !blacklist.some((bl) => domain.includes(bl))
        )
      })
      .slice(0, 5) // Top 5 competitors to analyze

    console.log(`Analyzing ${competitorDomains.length} competitor domains for backlinks`)

    // 3. Get referring domains for each competitor (link intersect)
    const referringDomainsMap = new Map<string, any[]>()

    for (const competitor of competitorDomains) {
      try {
        const refDomainsResult = await dataForSEO.getReferringDomains(competitor.domain, 500)

        if (refDomainsResult.tasks && refDomainsResult.tasks[0]?.result) {
          const refDomains = refDomainsResult.tasks[0].result[0]?.items || []
          refDomains.forEach((rd: any) => {
            const domain = rd.domain_from
            if (!referringDomainsMap.has(domain)) {
              referringDomainsMap.set(domain, [])
            }
            referringDomainsMap.get(domain)!.push({
              competitor: competitor.domain,
              backlinks_count: rd.backlinks,
              rank: rd.rank,
            })
          })
        }
      } catch (error) {
        console.error(`Failed to get referring domains for ${competitor.domain}:`, error)
      }
    }

    console.log(`Found ${referringDomainsMap.size} unique referring domains`)

    // 4. Score and filter targets
    const targets: OutreachTarget[] = []

    for (const [domain, linkingTo] of referringDomainsMap.entries()) {
      // Filter out blacklisted domains and your own domain
      const domainLower = domain.toLowerCase()
      if (
        domainLower === cleanYourDomain.toLowerCase() ||
        blacklist.some((bl) => domainLower.includes(bl))
      ) {
        continue
      }

      // Link intersect score: prefer domains linking to multiple competitors
      const linkIntersectScore = linkingTo.length * 20 // 20 points per competitor they link to

      // Calculate base score (we'll enhance with metrics later)
      const avgRank = linkingTo.reduce((sum, l) => sum + (l.rank || 0), 0) / linkingTo.length
      const rankScore = Math.min(avgRank / 10, 50) // Up to 50 points for rank

      const totalScore = linkIntersectScore + rankScore

      // Determine why this target is good
      let whyTargeted = ''
      if (linkingTo.length >= 3) {
        whyTargeted = `Links to ${linkingTo.length} of your competitors (${linkingTo.map((l: any) => l.competitor).join(', ')})`
      } else if (linkingTo.length === 2) {
        whyTargeted = `Links to ${linkingTo.map((l: any) => l.competitor).join(' and ')}`
      } else {
        whyTargeted = `Links to ${linkingTo[0].competitor} (top ranker for "${keyword.keyword}")`
      }

      // Outreach angle
      const outreachAngle = linkIntersectScore >= 40 ? 'guest_post' : 'resource_update'

      // Pitch hook
      const pitchHook = linkingTo.length >= 2
        ? `They recommend ${linkingTo.length} competitors but are missing your unique value prop`
        : `They mention ${linkingTo[0].competitor}, would benefit from your alternative perspective`

      // Research prompts for n8n/Perplexity
      const researchPrompts = [
        `What are the main topics and categories covered on ${domain}?`,
        `Who writes content for ${domain} and what is their typical writing style?`,
        `What tools, products, or resources does ${domain} currently recommend in the ${keyword.keyword} niche?`,
        `Are there any content gaps or missing topics on ${domain} related to ${keyword.keyword}?`,
        `What is the contact information for editorial team or content submissions at ${domain}?`,
      ]

      targets.push({
        domain,
        target_url: `https://${domain}`, // Will be refined by n8n
        target_score: Math.round(totalScore),
        metrics: {
          domain_rating: avgRank, // Placeholder - will be enhanced
          monthly_traffic: 0, // Placeholder - will be enhanced
          referring_domains: linkingTo.reduce((sum, l) => sum + (l.backlinks_count || 0), 0),
        },
        why_targeted: whyTargeted,
        outreach_angle: outreachAngle,
        pitch_hook: pitchHook,
        research_prompts: researchPrompts,
      })
    }

    // Sort by score and take top 10
    targets.sort((a, b) => b.target_score - a.target_score)
    const top10Targets = targets.slice(0, 10)

    console.log(`Returning top ${top10Targets.length} targets`)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'dataforseo',
      endpoint: 'outreach_target_finder',
      credits_used: 1 + competitorDomains.length, // 1 for SERP + 1 per competitor backlink analysis
      request_data: { keywordId, keyword: keyword.keyword },
    })

    return NextResponse.json({
      keyword: keyword.keyword,
      keyword_id: keywordId,
      project_id: projectId,
      your_domain: cleanYourDomain,
      competitors_analyzed: competitorDomains.length,
      total_targets_found: targets.length,
      targets: top10Targets,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Find outreach targets error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to find outreach targets',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
