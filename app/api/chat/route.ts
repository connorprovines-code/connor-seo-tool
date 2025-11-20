import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, tools } from '@/lib/anthropic/client'

// Tool execution functions
async function executeTools(toolName: string, toolInput: any, supabase: any) {
  switch (toolName) {
    case 'get_user_projects':
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      return projects || []

    case 'get_project_keywords':
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', toolInput.project_id)
      return keywords || []

    case 'get_ranking_history':
      const days = toolInput.days || 30
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - days)

      const { data: rankings } = await supabase
        .from('rankings')
        .select('*')
        .eq('keyword_id', toolInput.keyword_id)
        .gte('checked_at', daysAgo.toISOString())
        .order('checked_at', { ascending: true })
      return rankings || []

    case 'get_backlinks':
      const { data: backlinks } = await supabase
        .from('backlinks')
        .select('*')
        .eq('project_id', toolInput.project_id)
        .eq('is_lost', false)
      return backlinks || []

    case 'get_gsc_data':
      const gscDays = toolInput.days || 30
      const gscDaysAgo = new Date()
      gscDaysAgo.setDate(gscDaysAgo.getDate() - gscDays)

      const { data: gscData } = await supabase
        .from('gsc_data')
        .select('*')
        .eq('project_id', toolInput.project_id)
        .gte('date', gscDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
      return gscData || []

    case 'analyze_keyword_performance':
      // Get keywords with their latest rankings
      const { data: kwds } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', toolInput.project_id)

      const keywordIds = kwds?.map((k: any) => k.id) || []

      const { data: allRankings } = await supabase
        .from('rankings')
        .select('*')
        .in('keyword_id', keywordIds)
        .order('checked_at', { ascending: false })

      // Calculate stats
      const latestRankings = new Map()
      allRankings?.forEach((r: any) => {
        if (!latestRankings.has(r.keyword_id)) {
          latestRankings.set(r.keyword_id, r)
        }
      })

      const analysis = {
        total_keywords: kwds?.length || 0,
        tracked_keywords: latestRankings.size,
        average_position: latestRankings.size > 0
          ? Array.from(latestRankings.values()).reduce((sum, r) => sum + r.rank_position, 0) / latestRankings.size
          : 0,
        top_3: Array.from(latestRankings.values()).filter(r => r.rank_position <= 3).length,
        top_10: Array.from(latestRankings.values()).filter(r => r.rank_position <= 10).length,
        keywords: kwds,
      }

      return analysis

    case 'analyze_page_seo':
      // Directly call the analyze function instead of HTTP request
      const { analyzePage: analyzePageFn } = await import('@/lib/puppeteer/browser')

      try {
        const pageData = await analyzePageFn(toolInput.url, toolInput.target_keyword)

        // Process the data similar to API endpoint
        const currentDomain = new URL(toolInput.url).hostname
        const internalLinks = pageData.links.filter((link: any) => {
          try {
            const linkDomain = new URL(link.href).hostname
            return linkDomain === currentDomain || linkDomain === `www.${currentDomain}` || linkDomain === currentDomain.replace('www.', '')
          } catch {
            return !link.href.startsWith('http')
          }
        })
        const externalLinks = pageData.links.filter((link: any) => !internalLinks.includes(link))

        const schemaTypes: string[] = []
        pageData.schemaScripts.forEach((schema: any) => {
          if (schema && schema['@type']) {
            const type = Array.isArray(schema['@type']) ? schema['@type'][0] : schema['@type']
            if (type && !schemaTypes.includes(type)) {
              schemaTypes.push(type)
            }
          }
        })

        const imagesWithoutAlt = pageData.images.filter((img: any) => !img.alt).length

        // Save to database
        const auditData = {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          project_id: toolInput.project_id || null,
          url: toolInput.url,
          title: pageData.title,
          meta_description: pageData.metaDescription,
          h1: pageData.h1,
          h2: pageData.h2,
          canonical_url: pageData.canonicalUrl,
          word_count: pageData.wordCount,
          paragraph_count: pageData.paragraphCount,
          images_total: pageData.images.length,
          images_without_alt: imagesWithoutAlt,
          images_data: pageData.images.slice(0, 50),
          internal_links_count: internalLinks.length,
          external_links_count: externalLinks.length,
          links_data: {
            internal: internalLinks.slice(0, 20).map((l: any) => ({ href: l.href, text: l.text })),
            external: externalLinks.slice(0, 20).map((l: any) => ({ href: l.href, text: l.text })),
          },
          has_meta_viewport: pageData.hasMetaViewport,
          has_meta_robots: pageData.hasMetaRobots,
          meta_robots: pageData.metaRobots,
          has_og_tags: pageData.hasOgTags,
          has_twitter_tags: pageData.hasTwitterTags,
          has_schema_markup: schemaTypes.length > 0,
          schema_types: schemaTypes,
          target_keyword: toolInput.target_keyword || null,
          keyword_in_title: pageData.keyword?.inTitle || false,
          keyword_in_h1: pageData.keyword?.inH1 || false,
          keyword_in_meta: pageData.keyword?.inMeta || false,
          keyword_in_url: pageData.keyword?.inUrl || false,
          keyword_density: pageData.keyword?.density || 0,
        }

        await supabase.from('page_audits').insert(auditData)

        return {
          url: toolInput.url,
          title: pageData.title,
          metaDescription: pageData.metaDescription,
          wordCount: pageData.wordCount,
          imagesTotal: pageData.images.length,
          imagesWithoutAlt,
          internalLinks: internalLinks.length,
          externalLinks: externalLinks.length,
          hasSchemaMarkup: schemaTypes.length > 0,
          schemaTypes,
          keywordAnalysis: toolInput.target_keyword ? {
            keyword: toolInput.target_keyword,
            inTitle: pageData.keyword?.inTitle,
            inH1: pageData.keyword?.inH1,
            inMeta: pageData.keyword?.inMeta,
            inUrl: pageData.keyword?.inUrl,
            density: pageData.keyword?.density,
          } : null,
          issues: [
            ...(imagesWithoutAlt > 0 ? [`${imagesWithoutAlt} images missing alt text`] : []),
            ...(!pageData.metaDescription ? ['Missing meta description'] : []),
            ...(!pageData.hasMetaViewport ? ['Missing viewport meta tag'] : []),
            ...(pageData.h1.length === 0 ? ['No H1 heading found'] : []),
            ...(pageData.h1.length > 1 ? ['Multiple H1 headings (should be one)'] : []),
            ...(!pageData.canonicalUrl ? ['No canonical URL set'] : []),
            ...(schemaTypes.length === 0 ? ['No Schema.org markup found'] : []),
          ],
        }
      } catch (err: any) {
        return {
          error: `Failed to analyze page: ${err.message}`,
          details: err.toString(),
        }
      }

    default:
      return { error: 'Unknown tool' }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Chat API] Request received')

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Chat API] ANTHROPIC_API_KEY is not configured')
      return NextResponse.json(
        { error: 'AI Chat is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    console.log('[Chat API] API key present')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Chat API] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Chat API] User authenticated:', user.id)

    const { messages } = await request.json()
    console.log('[Chat API] Messages received:', messages?.length || 0)

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Create initial message
    console.log('[Chat API] Calling Claude API...')
    console.log('[Chat API] Model: claude-sonnet-4-5-20250929')
    console.log('[Chat API] Tools count:', tools.length)

    let response
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        tools,
        messages,
      })
      console.log('[Chat API] Claude response received, stop_reason:', response.stop_reason)
    } catch (apiError: any) {
      console.error('[Chat API] Anthropic API error:', apiError)
      console.error('[Chat API] Error details:', {
        message: apiError.message,
        status: apiError.status,
        type: apiError.type,
      })
      throw new Error(`Anthropic API failed: ${apiError.message}`)
    }

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      // Find all tool_use blocks in the response
      const toolUses: any[] = response.content.filter((block: any) => block.type === 'tool_use')
      if (toolUses.length === 0) break

      // Execute all tools in parallel
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse: any) => {
          const result = await executeTools(toolUse.name, toolUse.input, supabase)
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          }
        })
      )

      // Continue conversation with all tool results
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: toolResults,
          },
        ],
      })
    }

    // Extract text response
    const textContent = response.content.find((block) => block.type === 'text')
    const assistantMessage = textContent && textContent.type === 'text' ? textContent.text : ''

    // Save messages to database (non-blocking, don't fail chat if this fails)
    try {
      const { error: saveError } = await supabase.from('chat_messages').insert([
        {
          user_id: user.id,
          role: 'user',
          content: messages[messages.length - 1].content,
        },
        {
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage,
        },
      ])

      if (saveError) {
        console.error('Failed to save chat history (non-critical):', saveError)
      }
    } catch (saveErr) {
      console.error('Chat history save error (non-critical):', saveErr)
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    )
  }
}
