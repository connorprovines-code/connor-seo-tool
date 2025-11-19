'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyword } from '@/types'
import { Trash2, Lightbulb, TrendingUp, ChevronDown, ChevronUp, ExternalLink, Trophy, AlertCircle, Loader2, Search, DollarSign } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { KeywordSparkline } from '@/components/keywords/KeywordSparkline'

interface KeywordListProps {
  keywords: Keyword[]
  projectId: string
  projectDomain: string
}

interface RankCheckResult {
  id: string
  keyword_id: string
  position: number | null
  rank_url: string | null
  rank_title: string | null
  top_results: Array<{
    position: number
    url: string
    domain: string
    title: string
    description: string
  }>
  checked_at: string
}

interface SimilarKeyword {
  keyword: string
  search_volume: number
  competition: string
  cpc: number
  keyword_difficulty?: number
}

// Utility function for difficulty badge
const getDifficultyBadge = (difficulty: number | null) => {
  if (!difficulty && difficulty !== 0) return null

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
  let color = "text-gray-600"

  if (difficulty >= 70) {
    variant = "destructive"
    color = "text-red-600"
  } else if (difficulty >= 40) {
    variant = "secondary"
    color = "text-yellow-600"
  } else {
    variant = "default"
    color = "text-green-600"
  }

  return { variant, color, label: `KD: ${difficulty}` }
}

export default function KeywordList({ keywords, projectId, projectDomain }: KeywordListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null)
  const [expandedType, setExpandedType] = useState<'rank' | 'similar' | null>(null)
  const [rankResults, setRankResults] = useState<Record<string, RankCheckResult>>({})
  const [similarResults, setSimilarResults] = useState<Record<string, SimilarKeyword[]>>({})
  const [loadingRank, setLoadingRank] = useState<string | null>(null)
  const [loadingSimilar, setLoadingSimilar] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load existing rank results for all keywords on mount
  useEffect(() => {
    loadRankResults()
  }, [keywords])

  const loadRankResults = async () => {
    const keywordIds = keywords.map(k => k.id)
    if (keywordIds.length === 0) return

    const { data, error } = await supabase
      .from('rank_check_results')
      .select('*')
      .in('keyword_id', keywordIds)
      .order('checked_at', { ascending: false })

    if (error) {
      // Table might not exist yet (migrations not applied)
      console.warn('rank_check_results table not found - migrations may need to be applied')
      return
    }

    if (data) {
      // Get most recent result for each keyword
      const results: Record<string, RankCheckResult> = {}
      for (const item of data) {
        if (!results[item.keyword_id]) {
          results[item.keyword_id] = item
        }
      }
      setRankResults(results)
    }
  }

  const handleCheckRank = async (keywordId: string, keyword: string) => {
    setLoadingRank(keywordId)

    try {
      // Call API to check ranking
      const response = await fetch('/api/dataforseo/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          domain: projectDomain,
          locationCode: 2840,
          device: 'desktop',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check ranking')
      }

      const data = await response.json()

      // Try to save to rank_check_results table (if it exists)
      const { data: savedResult, error: saveError } = await supabase
        .from('rank_check_results')
        .insert({
          keyword_id: keywordId,
          project_id: projectId,
          keyword,
          domain: projectDomain,
          position: data.position || null,
          rank_url: data.rankUrl,
          rank_title: data.rankTitle,
          total_results: data.totalResults || 0,
          serp_features: data.serpFeatures || 0,
          top_results: data.topResults || [],
        })
        .select()
        .single()

      if (saveError) {
        console.warn('Could not save to rank_check_results - table may not exist:', saveError)
        // Continue anyway - show results without persistence
      } else if (savedResult) {
        // Update local state
        setRankResults(prev => ({
          ...prev,
          [keywordId]: savedResult
        }))
      }

      // Store results in memory for current session
      const tempResult: RankCheckResult = {
        id: 'temp-' + keywordId,
        keyword_id: keywordId,
        position: data.position || null,
        rank_url: data.rankUrl,
        rank_title: data.rankTitle,
        top_results: data.topResults || [],
        checked_at: new Date().toISOString(),
      }

      setRankResults(prev => ({
        ...prev,
        [keywordId]: savedResult || tempResult
      }))

      // Expand to show results
      setExpandedKeyword(keywordId)
      setExpandedType('rank')

      // Also save to rankings table for historical tracking
      await supabase.from('rankings').insert({
        keyword_id: keywordId,
        project_id: projectId,
        rank_position: data.position || 100,
        rank_url: data.rankUrl,
        rank_absolute: data.position || 100,
        search_engine: 'google',
        device: 'desktop',
        location_code: 2840,
        language_code: 'en',
      })

      toast({
        title: 'Success',
        description: data.position
          ? `Your site ranks at position #${data.position}`
          : 'Your site is not in top 100',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check ranking',
        variant: 'destructive',
      })
    } finally {
      setLoadingRank(null)
    }
  }

  const handleFetchSimilar = async (keywordId: string, keyword: string) => {
    // If already expanded and showing similar, just toggle closed
    if (expandedKeyword === keywordId && expandedType === 'similar') {
      setExpandedKeyword(null)
      setExpandedType(null)
      return
    }

    // If we already have similar keywords cached, just show them
    if (similarResults[keywordId]) {
      setExpandedKeyword(keywordId)
      setExpandedType('similar')
      return
    }

    setLoadingSimilar(keywordId)

    try {
      const response = await fetch('/api/dataforseo/similar-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          limit: 20,
          includeSERP: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch similar keywords')
      }

      const data = await response.json()
      const ideas = data.ideas || []

      // Map to our interface
      const similarKeywords: SimilarKeyword[] = ideas.map((idea: any) => ({
        keyword: idea.keyword,
        search_volume: idea.search_volume || 0,
        competition: idea.competition_level || 'N/A',
        cpc: idea.cpc || 0,
        keyword_difficulty: idea.keyword_difficulty,
      }))

      setSimilarResults(prev => ({
        ...prev,
        [keywordId]: similarKeywords,
      }))

      setExpandedKeyword(keywordId)
      setExpandedType('similar')

      toast({
        title: 'Success',
        description: `Found ${similarKeywords.length} similar keywords`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch similar keywords',
        variant: 'destructive',
      })
    } finally {
      setLoadingSimilar(null)
    }
  }

  const toggleExpand = (keywordId: string, type: 'rank' | 'similar') => {
    if (expandedKeyword === keywordId && expandedType === type) {
      setExpandedKeyword(null)
      setExpandedType(null)
    } else {
      setExpandedKeyword(keywordId)
      setExpandedType(type)
    }
  }

  const handleDelete = async (keywordId: string, keyword: string) => {
    const confirmed = window.confirm(`Delete "${keyword}"?`)
    if (!confirmed) return

    setDeleting(keywordId)

    try {
      const { error } = await supabase.from('keywords').delete().eq('id', keywordId)

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Keyword deleted',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete keyword',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-2">
      {keywords.map((kw) => {
        const rankResult = rankResults[kw.id]
        const similarKeywords = similarResults[kw.id]
        const isExpanded = expandedKeyword === kw.id
        const isRankExpanded = isExpanded && expandedType === 'rank'
        const isSimilarExpanded = isExpanded && expandedType === 'similar'
        const hasRankData = !!rankResult
        const hasSimilarData = !!similarKeywords

        return (
          <Card key={kw.id} className="overflow-hidden">
            {/* Main Keyword Row */}
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{kw.keyword}</h3>
                    {(() => {
                      const diffBadge = getDifficultyBadge(kw.keyword_difficulty)
                      return diffBadge ? (
                        <Badge variant={diffBadge.variant} className="text-xs h-5 px-1.5">
                          {diffBadge.label}
                        </Badge>
                      ) : null
                    })()}
                    {kw.monthly_searches && kw.monthly_searches.length > 0 && (
                      <KeywordSparkline data={kw.monthly_searches} />
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {kw.search_volume && (
                      <span>{kw.search_volume.toLocaleString()} vol</span>
                    )}
                    {kw.competition && (
                      <span className="capitalize">{kw.competition}</span>
                    )}
                    {kw.cpc && <span>${kw.cpc.toFixed(2)}</span>}
                    {rankResult && (
                      <span className="font-medium text-primary">
                        {rankResult.position ? `#${rankResult.position}` : 'Not ranked'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFetchSimilar(kw.id, kw.keyword)}
                    disabled={loadingSimilar === kw.id}
                    className={`h-7 px-3 ${isSimilarExpanded ? 'bg-primary/10' : ''}`}
                    title="Find similar keywords"
                  >
                    {loadingSimilar === kw.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Lightbulb className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Similar</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckRank(kw.id, kw.keyword)}
                    disabled={loadingRank === kw.id}
                    className={`h-7 px-3 ${isRankExpanded ? 'bg-primary/10' : ''}`}
                    title="Check your ranking for this keyword"
                  >
                    {loadingRank === kw.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Rank</span>
                      </>
                    )}
                  </Button>
                  {(hasRankData || hasSimilarData) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(kw.id, isRankExpanded ? 'rank' : 'similar')}
                      className="h-7 px-2"
                      title={isExpanded ? "Collapse" : "Expand results"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(kw.id, kw.keyword)}
                    disabled={deleting === kw.id}
                    className="h-7 px-2"
                    title="Delete this keyword"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Expandable Rank Results */}
            {hasRankData && isRankExpanded && (
              <div className="border-t bg-gray-50 p-3">
                {/* Your Position */}
                <div className={`rounded-lg border-2 p-3 mb-3 ${
                  rankResult.position
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 bg-gray-100'
                }`}>
                  {rankResult.position ? (
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-primary text-white rounded-full flex-shrink-0">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">Position #{rankResult.position}</h4>
                        <p className="text-xs font-medium mb-1 truncate">{rankResult.rank_title}</p>
                        {rankResult.rank_url && (
                          <a
                            href={rankResult.rank_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                          >
                            {rankResult.rank_url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-gray-400 text-white rounded-full flex-shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs mb-0.5">Not in Top 100</h4>
                        <p className="text-xs text-gray-600">
                          Your domain isn't ranking in the top 100.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top 10 Results */}
                {rankResult.top_results && rankResult.top_results.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-xs mb-2">Top 10:</h4>
                    <div className="space-y-1.5">
                      {rankResult.top_results.map((result) => {
                        const isYourDomain = result.domain.includes(
                          projectDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
                        )

                        return (
                          <div
                            key={result.position}
                            className={`flex items-start gap-2 p-2 rounded border text-xs ${
                              isYourDomain
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isYourDomain ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {result.position}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="font-medium text-primary truncate">
                                  {result.domain}
                                </span>
                                {isYourDomain && (
                                  <span className="text-xs bg-primary text-white px-1 py-0.5 rounded">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <h5 className="font-semibold text-gray-900 truncate">
                                {result.title}
                              </h5>
                              <p className="text-gray-600 line-clamp-1">
                                {result.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500 text-right">
                  {new Date(rankResult.checked_at).toLocaleString()}
                </div>
              </div>
            )}

            {/* Expandable Similar Keywords */}
            {hasSimilarData && isSimilarExpanded && (
              <div className="border-t bg-gray-50 p-3">
                <h4 className="font-semibold text-xs mb-3 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Similar Keywords ({similarKeywords.length})
                </h4>
                <div className="space-y-1.5">
                  {similarKeywords.map((sk, idx) => {
                    const diffBadge = getDifficultyBadge(sk.keyword_difficulty || null)
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border border-gray-200 bg-white text-xs hover:border-primary transition-colors"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="font-medium truncate">{sk.keyword}</span>
                          {diffBadge && (
                            <Badge variant={diffBadge.variant} className="text-xs h-5 px-1.5 flex-shrink-0">
                              {diffBadge.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Search className="h-3 w-3" />
                            <span>{sk.search_volume.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            <span>${sk.cpc.toFixed(2)}</span>
                          </div>
                          <span className="capitalize text-gray-500 min-w-[50px] text-right">
                            {sk.competition}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
