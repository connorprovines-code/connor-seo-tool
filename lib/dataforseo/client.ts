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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`)
    }

    return response.json()
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
    return this.makeRequest('/dataforseo_labs/google/keyword_ideas/live', [
      {
        keyword,
        location_code: locationCode,
        language_code: 'en',
        limit,
        include_serp_info: false,
      },
    ])
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
}

export const dataForSEO = new DataForSEOClient()
