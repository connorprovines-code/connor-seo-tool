export interface SerpRanking {
  position: number
  url: string
  domain: string
  title: string
  description: string
}

export interface SimilarKeyword {
  keyword: string
  search_volume: number
  competition: string
  cpc: number
  keyword_difficulty?: number
  serp_rankings?: SerpRanking[]
  serp_features?: any
}

export interface KeywordResearchSession {
  id: string
  keyword: string
  timestamp: string
  metrics: {
    search_volume: number
    competition: string
    cpc: number
    keyword_difficulty?: number
  }
  similar_keywords: SimilarKeyword[]
  total_ideas: number
}

export interface KeywordCache {
  [keyword: string]: KeywordResearchSession
}
