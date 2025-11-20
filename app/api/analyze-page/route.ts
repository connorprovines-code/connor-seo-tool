import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePage } from '@/lib/puppeteer/browser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 second timeout for page analysis

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, projectId, targetKeyword } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    console.log(`[Page Analyzer] Analyzing: ${url}`)

    // Analyze the page with Puppeteer
    const seoData = await analyzePage(url, targetKeyword)

    console.log(`[Page Analyzer] Analysis complete for ${url}`)

    // Process images
    const imagesTotal = seoData.images.length
    const imagesWithoutAlt = seoData.images.filter((img) => !img.alt).length

    // Process links
    const currentDomain = new URL(url).hostname
    const internalLinks = seoData.links.filter((link) => {
      try {
        const linkDomain = new URL(link.href).hostname
        return linkDomain === currentDomain || linkDomain === `www.${currentDomain}` || linkDomain === currentDomain.replace('www.', '')
      } catch {
        // Relative URLs are internal
        return !link.href.startsWith('http')
      }
    })
    const externalLinks = seoData.links.filter((link) => !internalLinks.includes(link))

    // Process Schema.org data
    const schemaTypes: string[] = []
    seoData.schemaScripts.forEach((schema) => {
      if (schema && schema['@type']) {
        const type = Array.isArray(schema['@type']) ? schema['@type'][0] : schema['@type']
        if (type && !schemaTypes.includes(type)) {
          schemaTypes.push(type)
        }
      }
    })

    // Build audit result
    const auditData = {
      user_id: user.id,
      project_id: projectId || null,
      url,
      analyzed_at: new Date().toISOString(),

      // Basic SEO
      title: seoData.title,
      meta_description: seoData.metaDescription,
      h1: seoData.h1,
      h2: seoData.h2,
      canonical_url: seoData.canonicalUrl,

      // Content
      word_count: seoData.wordCount,
      paragraph_count: seoData.paragraphCount,

      // Images
      images_total: imagesTotal,
      images_without_alt: imagesWithoutAlt,
      images_data: seoData.images.slice(0, 50), // Limit to first 50 to save DB space

      // Links
      internal_links_count: internalLinks.length,
      external_links_count: externalLinks.length,
      links_data: {
        internal: internalLinks.slice(0, 20).map((l) => ({ href: l.href, text: l.text })),
        external: externalLinks.slice(0, 20).map((l) => ({ href: l.href, text: l.text })),
      },

      // Technical SEO
      has_meta_viewport: seoData.hasMetaViewport,
      has_meta_robots: seoData.hasMetaRobots,
      meta_robots: seoData.metaRobots,
      has_og_tags: seoData.hasOgTags,
      has_twitter_tags: seoData.hasTwitterTags,
      has_schema_markup: schemaTypes.length > 0,
      schema_types: schemaTypes,

      // Keyword analysis
      target_keyword: targetKeyword || null,
      keyword_in_title: seoData.keyword?.inTitle || false,
      keyword_in_h1: seoData.keyword?.inH1 || false,
      keyword_in_meta: seoData.keyword?.inMeta || false,
      keyword_in_url: seoData.keyword?.inUrl || false,
      keyword_density: seoData.keyword?.density || 0,
    }

    // Save to database
    const { data: audit, error: dbError } = await supabase
      .from('page_audits')
      .insert(auditData)
      .select()
      .single()

    if (dbError) {
      console.error('[Page Analyzer] Database error:', dbError)
      throw new Error('Failed to save audit to database')
    }

    console.log(`[Page Analyzer] Audit saved with ID: ${audit.id}`)

    // Track API usage
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'page_analyzer',
      endpoint: 'analyze_page',
      credits_used: 1,
      request_data: { url, targetKeyword },
    })

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        url: audit.url,
        title: audit.title,
        metaDescription: audit.meta_description,
        wordCount: audit.word_count,
        imagesTotal: audit.images_total,
        imagesWithoutAlt: audit.images_without_alt,
        internalLinks: audit.internal_links_count,
        externalLinks: audit.external_links_count,
        hasSchemaMarkup: audit.has_schema_markup,
        schemaTypes: audit.schema_types,
        keywordAnalysis: targetKeyword
          ? {
              keyword: targetKeyword,
              inTitle: audit.keyword_in_title,
              inH1: audit.keyword_in_h1,
              inMeta: audit.keyword_in_meta,
              inUrl: audit.keyword_in_url,
              density: audit.keyword_density,
            }
          : null,
        issues: [
          ...(audit.images_without_alt > 0
            ? [`${audit.images_without_alt} images missing alt text`]
            : []),
          ...(!audit.meta_description ? ['Missing meta description'] : []),
          ...(!audit.has_meta_viewport ? ['Missing viewport meta tag'] : []),
          ...(audit.h1.length === 0 ? ['No H1 heading found'] : []),
          ...(audit.h1.length > 1 ? ['Multiple H1 headings (should be one)'] : []),
          ...(!audit.canonical_url ? ['No canonical URL set'] : []),
          ...(!audit.has_schema_markup ? ['No Schema.org markup found'] : []),
        ],
      },
    })
  } catch (error: any) {
    console.error('[Page Analyzer] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze page',
        details: error.toString(),
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
