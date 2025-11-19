'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  TrendingUp,
  DollarSign,
  Zap,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react'
import { KeywordResearchSession, SimilarKeyword, KeywordCache } from '@/types/keyword-research'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const CACHE_KEY = 'keyword_research_cache'
const MAX_CACHE_ITEMS = 20 // Limit to last 20 searches to prevent localStorage overflow

export default function KeywordResearchPage() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<KeywordResearchSession | null>(null)
  const [cache, setCache] = useState<KeywordCache>({})
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set())
  const [includeSERP, setIncludeSERP] = useState(true)

  // Load cache from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        setCache(JSON.parse(cached))
      } catch (e) {
        console.error('Failed to load cache:', e)
      }
    }
  }, [])

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cache).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    }
  }, [cache])

  const handleResearch = async (refreshData = false) => {
    const searchKeyword = keyword.trim().toLowerCase()

    if (!searchKeyword) {
      toast({
        title: 'Error',
        description: 'Please enter a keyword',
        variant: 'destructive',
      })
      return
    }

    // Check cache first (unless refreshing)
    if (!refreshData && cache[searchKeyword]) {
      setCurrentSession(cache[searchKeyword])
      toast({
        title: 'Loaded from cache',
        description: 'Data loaded from previous search',
      })
      return
    }

    setLoading(true)

    try {
      // Get keyword metrics
      const metricsRes = await fetch('/api/dataforseo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: [searchKeyword] }),
      })

      if (!metricsRes.ok) {
        throw new Error('Failed to fetch keyword data')
      }

      const metricsData = await metricsRes.json()

      // Get similar keywords with SERP data
      const similarRes = await fetch('/api/dataforseo/similar-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: searchKeyword,
          includeSERP,
          limit: 50,
        }),
      })

      if (!similarRes.ok) {
        throw new Error('Failed to fetch similar keywords')
      }

      const similarData = await similarRes.json()
      console.log('Similar keywords API response:', similarData)

      // Parse metrics
      let metrics = {
        search_volume: 0,
        competition: 'N/A',
        cpc: 0,
      }

      if (metricsData.tasks && metricsData.tasks[0]?.result) {
        const item = metricsData.tasks[0].result[0]
        metrics = {
          search_volume: item?.search_volume || 0,
          competition: item?.competition || 'N/A',
          cpc: item?.cpc || 0,
        }
      }

      // Create session
      const session: KeywordResearchSession = {
        id: `${searchKeyword}-${Date.now()}`,
        keyword: searchKeyword,
        timestamp: new Date().toISOString(),
        metrics,
        similar_keywords: similarData.ideas || [],
        total_ideas: similarData.total_ideas || 0,
      }

      // Update current session and cache
      setCurrentSession(session)
      setCache((prev) => {
        const newCache = {
          ...prev,
          [searchKeyword]: session,
        }

        // Limit cache size - keep only the most recent MAX_CACHE_ITEMS searches
        const cacheEntries = Object.entries(newCache)
        if (cacheEntries.length > MAX_CACHE_ITEMS) {
          const sortedEntries = cacheEntries.sort(
            (a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime()
          )
          return Object.fromEntries(sortedEntries.slice(0, MAX_CACHE_ITEMS))
        }

        return newCache
      })

      toast({
        title: 'Success',
        description: `Found ${similarData.total_ideas} similar keywords`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to research keyword',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    handleResearch(true)
  }

  const loadFromCache = (cachedKeyword: string) => {
    setCurrentSession(cache[cachedKeyword])
    setKeyword(cachedKeyword)
  }

  const clearCache = () => {
    setCache({})
    localStorage.removeItem(CACHE_KEY)
    toast({
      title: 'Cache cleared',
      description: 'All cached keyword data has been removed',
    })
  }

  const toggleKeywordExpansion = (kw: string) => {
    const newExpanded = new Set(expandedKeywords)
    if (newExpanded.has(kw)) {
      newExpanded.delete(kw)
    } else {
      newExpanded.add(kw)
    }
    setExpandedKeywords(newExpanded)
  }

  const cachedSearches = Object.values(cache).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Keyword Research</h1>
        <p className="text-gray-500 mt-1">
          Discover similar keywords, analyze search metrics, and see who ranks for each term
        </p>
      </div>

      {/* Research Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Keyword</CardTitle>
          <CardDescription>
            Enter a keyword to get metrics, similar keywords, and SERP rankings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter keyword (e.g., seo tools)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                disabled={loading}
              />
            </div>
            <Button onClick={() => handleResearch()} disabled={loading}>
              {loading ? 'Searching...' : 'Research'}
            </Button>
            {currentSession && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeSERP"
              checked={includeSERP}
              onChange={(e) => setIncludeSERP(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="includeSERP" className="text-sm">
              Include SERP rankings (shows who ranks for each keyword, uses more API credits)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Cached Searches Sidebar */}
      {cachedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Cached Searches</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={clearCache}>
                Clear All
              </Button>
            </div>
            <CardDescription>
              Click to load a previous search from memory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {cachedSearches.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadFromCache(session.keyword)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    currentSession?.keyword === session.keyword
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{session.keyword}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(session.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {session.similar_keywords.length} keywords
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Session Results */}
      {currentSession && (
        <>
          {/* Main Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Metrics for "{currentSession.keyword}"</span>
                <Badge variant="outline">
                  {new Date(currentSession.timestamp).toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Search className="h-4 w-4 mr-1" />
                    Search Volume
                  </div>
                  <div className="text-2xl font-bold">
                    {currentSession.metrics.search_volume.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Competition
                  </div>
                  <div className="text-2xl font-bold capitalize">
                    {currentSession.metrics.competition}
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    CPC
                  </div>
                  <div className="text-2xl font-bold">
                    ${currentSession.metrics.cpc.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>
                Similar Keywords ({currentSession.similar_keywords.length})
              </CardTitle>
              <CardDescription>
                Related keywords with metrics and SERP rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentSession.similar_keywords.map((idea, idx) => {
                  const isExpanded = expandedKeywords.has(idea.keyword)
                  const hasSERP = idea.serp_rankings && idea.serp_rankings.length > 0

                  return (
                    <div key={idx} className="border rounded-lg">
                      {/* Keyword Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{idea.keyword}</h3>
                              {hasSERP && (
                                <Badge variant="secondary" className="text-xs">
                                  SERP Data
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Volume:</span>{' '}
                                <span className="font-medium">
                                  {idea.search_volume?.toLocaleString() || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Competition:</span>{' '}
                                <span className="font-medium capitalize">
                                  {idea.competition || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">CPC:</span>{' '}
                                <span className="font-medium">
                                  ${idea.cpc?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {hasSERP && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeywordExpansion(idea.keyword)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* SERP Rankings (Expandable) */}
                      {hasSERP && isExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <h4 className="font-medium text-sm mb-3">Top 10 Rankings:</h4>
                          <div className="space-y-2">
                            {idea.serp_rankings!.map((ranking) => (
                              <div
                                key={ranking.position}
                                className="flex items-start gap-3 p-2 bg-white rounded border"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                                  {ranking.position}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-primary">
                                      {ranking.domain}
                                    </span>
                                    <a
                                      href={ranking.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-primary"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {ranking.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {ranking.url}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!currentSession && cachedSearches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No keyword research yet
            </h3>
            <p className="text-gray-600">
              Enter a keyword above to start researching similar keywords and SERP rankings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
