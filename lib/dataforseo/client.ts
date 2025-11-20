// DataForSEO API client
export class DataForSEOClient {
  private login: string
  private password: string
  private baseUrl: string = 'https://api.dataforseo.com/v3'

  constructor(login?: string, password?: string) {
    this.login = login || process.env.DATAFORSEO_LOGIN || ''
    this.password = password || process.env.DATAFORSEO_PASSWORD || ''
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64')
  }

  async makeRequest(endpoint: string, data: any): Promise<any> {
    console.log('[DataForSEO] Request:', {
      endpoint,
      url: `${this.baseUrl}${endpoint}`,
      data: JSON.stringify(data, null, 2),
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    console.log('[DataForSEO] Response:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      statusCode: result.status_code,
      statusMessage: result.status_message,
      tasksCount: result.tasks?.length,
    })

    if (!response.ok) {
      console.error('DataForSEO API Error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        data: data,
        response: result,
      })
      throw new Error(`DataForSEO API error: ${response.statusText} - ${JSON.stringify(result)}`)
    }

    // Check for DataForSEO status_code in response
    if (result.status_code && result.status_code >= 40000) {
      console.error('DataForSEO Error Response:', result)
      throw new Error(`DataForSEO Error: ${result.status_message || 'Unknown error'}`)
    }

    return result
  }

  // Keyword research - Get search volume and metrics
  async getKeywordMetrics(keywords: string[], locationCode: number = 2840) {
    return this.makeRequest('/keywords_data/google_ads/search_volume/live', [
      {
        keywords,
        location_code: locationCode,
        language_code: 'en',
      },
    ])
  }

  // Get keyword ideas/suggestions (Google Ads - less reliable, more expensive)
  async getKeywordIdeas(keyword: string, locationCode: number = 2840) {
    return this.makeRequest('/keywords_data/google_ads/keywords_for_keywords/live', [
      {
        keywords: [keyword],
        location_code: locationCode,
        language_code: 'en',
        include_adult_keywords: false,
      },
    ])
  }

  // Get similar keywords using DataForSEO Labs (better, faster, cheaper)
  async getSimilarKeywords(keyword: string, locationCode: number = 2840, limit: number = 100) {
    console.log(`Calling keyword_ideas for: "${keyword}", location: ${locationCode}, limit: ${limit}`)
    return this.makeRequest('/dataforseo_labs/google/keyword_ideas/live', [
      {
        keywords: [keyword], // API requires array of keywords (not singular "keyword")
        location_code: locationCode,
        language_code: 'en',
        limit: limit,
        include_serp_info: false,
      },
    ])
  }

  // Get related keywords from "searches related to" SERP element
  async getRelatedKeywords(keyword: string, locationCode: number = 2840, depth: number = 1) {
    return this.makeRequest('/dataforseo_labs/google/related_keywords/live', [
      {
        keyword,
        location_code: locationCode,
        language_code: 'en',
        depth, // 1-3, each level returns 8x more results
      },
    ])
  }

  // Hybrid approach: Get keywords from multiple sources and merge
  async getKeywordsHybrid(
    keyword: string,
    options: {
      includeSEO?: boolean
      includeAds?: boolean
      includeRelated?: boolean
      locationCode?: number
      limit?: number
    } = {}
  ) {
    const {
      includeSEO = true,
      includeAds = false,
      includeRelated = true,
      locationCode = 2840,
      limit = 100,
    } = options

    // Call selected endpoints in parallel
    const promises = []
    if (includeSEO) {
      promises.push(
        this.getSimilarKeywords(keyword, locationCode, limit).catch((e) => {
          console.error('SEO keywords error:', e)
          return null
        })
      )
    }
    if (includeAds) {
      promises.push(
        this.getKeywordIdeas(keyword, locationCode).catch((e) => {
          console.error('Ads keywords error:', e)
          return null
        })
      )
    }
    if (includeRelated) {
      promises.push(
        this.getRelatedKeywords(keyword, locationCode, 1).catch((e) => {
          console.error('Related keywords error:', e)
          return null
        })
      )
    }

    const results = await Promise.all(promises)

    // Merge and deduplicate results
    const keywordMap = new Map()
    let sourceIndex = 0

    results.forEach((result, idx) => {
      if (!result || !result.tasks || !result.tasks[0]?.result) return

      const items = result.tasks[0].result[0]?.items || []
      const source =
        idx === 0 && includeSEO
          ? 'seo'
          : idx === 1 && includeAds
          ? 'ads'
          : 'related'

      items.forEach((item: any) => {
        const kw = item.keyword?.toLowerCase()
        if (!kw) return

        if (!keywordMap.has(kw)) {
          keywordMap.set(kw, {
            keyword: item.keyword,
            search_volume: item.search_volume || item.keyword_info?.search_volume || 0,
            competition: item.competition || item.keyword_info?.competition || 'N/A',
            cpc: item.cpc || item.keyword_info?.cpc || 0,
            keyword_difficulty: item.keyword_difficulty,
            monthly_searches: item.monthly_searches || item.keyword_info?.monthly_searches || [],
            source,
            sources: [source],
          })
        } else {
          // Merge data from multiple sources - prefer higher quality data
          const existing = keywordMap.get(kw)
          existing.sources.push(source)

          // Use highest search volume
          if (item.search_volume > existing.search_volume) {
            existing.search_volume = item.search_volume
          }
          // Use highest CPC
          if (item.cpc > existing.cpc) {
            existing.cpc = item.cpc
          }
        }
      })
    })

    return Array.from(keywordMap.values()).slice(0, limit)
  }

  // Get keyword difficulty
  async getKeywordDifficulty(keywords: string[], locationCode: number = 2840) {
    return this.makeRequest('/keywords_data/google/keyword_difficulty/live', [
      {
        keywords,
        location_code: locationCode,
        language_code: 'en',
      },
    ])
  }

  // Get keywords for a specific domain (competitor analysis) - RANKED KEYWORDS
  async getKeywordsForSite(
    target: string,
    locationCode: number = 2840,
    options: {
      limit?: number
      offset?: number
      filters?: any[]
      orderBy?: string[]
      includeSerp?: boolean
    } = {}
  ) {
    const {
      limit = 100,
      offset = 0,
      filters,
      orderBy = ['ranked_serp_element.serp_item.rank_group,asc'], // Sort by rank position instead of volume
      includeSerp = false,
    } = options

    console.log(`Calling ranked_keywords for domain: "${target}", location: ${locationCode}, limit: ${limit}`)

    // Use ranked_keywords endpoint - this returns keywords the domain actually ranks for
    return this.makeRequest('/dataforseo_labs/google/ranked_keywords/live', [
      {
        target,
        location_code: locationCode,
        language_code: 'en',
        limit,
        offset,
        filters,
        order_by: orderBy,
        item_types: ['organic'], // Only get organic rankings
        ignore_synonyms: false, // Include similar keywords
      },
    ])
  }

  // Get SERP results for rank tracking
  async getSERPResults(keyword: string, locationCode: number = 2840, device: 'desktop' | 'mobile' = 'desktop') {
    return this.makeRequest('/serp/google/organic/live/advanced', [
      {
        keyword,
        location_code: locationCode,
        language_code: 'en',
        device,
        depth: 100, // Get top 100 results
      },
    ])
  }

  // Get backlinks for a domain
  async getBacklinks(target: string, mode: 'as_is' | 'one_per_domain' = 'as_is') {
    return this.makeRequest('/backlinks/backlinks/live', [
      {
        target,
        mode,
        limit: 1000,
      },
    ])
  }

  // Get backlink summary
  async getBacklinkSummary(target: string) {
    return this.makeRequest('/backlinks/summary/live', [
      {
        target,
      },
    ])
  }

  // Get competitor domains
  async getCompetitors(target: string) {
    return this.makeRequest('/backlinks/competitors/live', [
      {
        target,
        limit: 10,
      },
    ])
  }

  // Get referring domains (for link intersect analysis)
  async getReferringDomains(target: string, limit: number = 1000) {
    return this.makeRequest('/backlinks/referring_domains/live', [
      {
        target,
        limit,
        order_by: ['rank,desc'], // Highest authority first
      },
    ])
  }

  // Get domain metrics (for scoring targets)
  async getDomainMetrics(target: string) {
    return this.makeRequest('/dataforseo_labs/google/domain_metrics/live', [
      {
        target,
      },
    ])
  }
}

export const dataForSEO = new DataForSEOClient()
