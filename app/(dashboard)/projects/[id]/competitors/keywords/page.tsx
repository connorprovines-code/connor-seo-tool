'use client'

import { useState } from 'react'
import { use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Search, Loader2, ExternalLink, TrendingUp, Target, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CompetitorKeywordsPageProps {
  params: Promise<{
    id: string
  }>
}

interface CompetitorKeyword {
  keyword: string
  position: number | null
  search_volume: number
  competition: string | null
  cpc: number
  keyword_difficulty: number | null
  url: string | null
  title: string | null
  etv: number
  estimated_paid_traffic_cost: number
}

export default function CompetitorKeywordsPage({ params }: CompetitorKeywordsPageProps) {
  const { id: projectId } = use(params)
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGap, setLoadingGap] = useState(false)
  const [keywords, setKeywords] = useState<CompetitorKeyword[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [analyzedDomain, setAnalyzedDomain] = useState('')
  const [gapAnalysis, setGapAnalysis] = useState<{
    gaps: CompetitorKeyword[]
    overlaps: CompetitorKeyword[]
    yourKeywordsCount: number
    competitorKeywordsCount: number
  } | null>(null)
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a domain',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setGapAnalysis(null) // Reset gap analysis when analyzing new domain

    try {
      const response = await fetch('/api/dataforseo/keywords-for-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.trim(),
          limit: 100,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch keywords')
      }

      const data = await response.json()
      setKeywords(data.keywords || [])
      setTotalCount(data.total_count || 0)
      setAnalyzedDomain(data.domain)

      toast({
        title: 'Success',
        description: `Found ${data.total_count.toLocaleString()} keywords for ${data.domain}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze domain',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGapAnalysis = async () => {
    if (!analyzedDomain) {
      toast({
        title: 'Error',
        description: 'Please analyze a domain first',
        variant: 'destructive',
      })
      return
    }

    setLoadingGap(true)

    try {
      const response = await fetch('/api/dataforseo/keyword-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          competitorDomain: analyzedDomain,
          limit: 200,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform gap analysis')
      }

      const data = await response.json()
      setGapAnalysis({
        gaps: data.gaps || [],
        overlaps: data.overlaps || [],
        yourKeywordsCount: data.your_keywords_count || 0,
        competitorKeywordsCount: data.competitor_keywords_count || 0,
      })

      toast({
        title: 'Gap Analysis Complete',
        description: `Found ${data.gaps_count} keyword opportunities`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform gap analysis',
        variant: 'destructive',
      })
    } finally {
      setLoadingGap(false)
    }
  }

  const handleAddKeyword = async (keyword: string, searchVolume: number, difficulty: number | null, cpc: number) => {
    setAddingKeyword(keyword)

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          keyword,
          search_volume: searchVolume,
          keyword_difficulty: difficulty,
          cpc,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add keyword')
      }

      toast({
        title: 'Keyword Added',
        description: `"${keyword}" added to your tracking`,
      })

      // Refresh gap analysis to remove this keyword from gaps
      if (gapAnalysis) {
        setGapAnalysis({
          ...gapAnalysis,
          gaps: gapAnalysis.gaps.filter(k => k.keyword !== keyword),
          yourKeywordsCount: gapAnalysis.yourKeywordsCount + 1,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add keyword',
        variant: 'destructive',
      })
    } finally {
      setAddingKeyword(null)
    }
  }

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty && difficulty !== 0) return 'text-gray-500'
    if (difficulty >= 70) return 'text-red-600'
    if (difficulty >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Competitor Keywords</h1>
        <p className="text-gray-500 mt-1">
          See what keywords any domain ranks for
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Competitor</CardTitle>
          <CardDescription>
            Enter any domain to see their ranking keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={loading || !domain.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {analyzedDomain && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Keywords for {analyzedDomain}</CardTitle>
                <CardDescription>
                  {gapAnalysis
                    ? `Comparing ${gapAnalysis.yourKeywordsCount} your keywords vs ${gapAnalysis.competitorKeywordsCount} competitor keywords`
                    : `Showing ${keywords.length.toLocaleString()} of ${totalCount.toLocaleString()} total keywords`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!gapAnalysis && (
                  <Button
                    onClick={handleGapAnalysis}
                    disabled={loadingGap}
                    variant="outline"
                    size="sm"
                  >
                    {loadingGap ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Compare to My Keywords
                      </>
                    )}
                  </Button>
                )}
                <Badge variant="outline" className="text-sm">
                  {totalCount.toLocaleString()} keywords
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {gapAnalysis ? (
              <Tabs defaultValue="gaps" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="gaps">
                    Keyword Gaps ({gapAnalysis.gaps.length})
                  </TabsTrigger>
                  <TabsTrigger value="overlaps">
                    Both Rank ({gapAnalysis.overlaps.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="gaps" className="mt-4">
                  {gapAnalysis.gaps.length > 0 ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-900">
                          <Target className="h-4 w-4 inline mr-1" />
                          <strong>{gapAnalysis.gaps.length} keyword opportunities</strong> - Your competitor ranks for these, but you don't track them yet
                        </p>
                      </div>
                      {gapAnalysis.gaps.map((kw, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{kw.keyword}</h4>
                                {kw.keyword_difficulty !== null && (
                                  <Badge variant="outline" className={`text-xs h-5 px-1.5 ${getDifficultyColor(kw.keyword_difficulty)}`}>
                                    KD: {kw.keyword_difficulty}
                                  </Badge>
                                )}
                                {kw.position && (
                                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                    Competitor: #{kw.position}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500 mb-1">
                                <span className="font-medium text-blue-600">{kw.search_volume.toLocaleString()} vol</span>
                                {kw.competition && (
                                  <span className="capitalize">{kw.competition}</span>
                                )}
                                {kw.cpc > 0 && <span>${kw.cpc.toFixed(2)} CPC</span>}
                                {kw.etv > 0 && (
                                  <span className="text-green-600 font-medium">
                                    ${kw.etv.toFixed(0)}/mo value
                                  </span>
                                )}
                              </div>
                              {kw.title && (
                                <p className="text-xs text-gray-600 truncate mb-1">{kw.title}</p>
                              )}
                              {kw.url && (
                                <a
                                  href={kw.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  {kw.url}
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddKeyword(kw.keyword, kw.search_volume, kw.keyword_difficulty, kw.cpc)}
                              disabled={addingKeyword === kw.keyword}
                              className="h-7 px-3 flex-shrink-0"
                            >
                              {addingKeyword === kw.keyword ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Track
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="font-medium mb-1">No keyword gaps found!</p>
                      <p className="text-sm">You're already tracking all the keywords your competitor ranks for</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="overlaps" className="mt-4">
                  {gapAnalysis.overlaps.length > 0 ? (
                    <div className="space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-900">
                          <TrendingUp className="h-4 w-4 inline mr-1" />
                          <strong>{gapAnalysis.overlaps.length} shared keywords</strong> - Both you and your competitor rank for these
                        </p>
                      </div>
                      {gapAnalysis.overlaps.map((kw, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{kw.keyword}</h4>
                                {kw.keyword_difficulty !== null && (
                                  <Badge variant="outline" className={`text-xs h-5 px-1.5 ${getDifficultyColor(kw.keyword_difficulty)}`}>
                                    KD: {kw.keyword_difficulty}
                                  </Badge>
                                )}
                                {kw.position && (
                                  <Badge variant="default" className="text-xs h-5 px-1.5">
                                    Competitor: #{kw.position}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500 mb-1">
                                <span>{kw.search_volume.toLocaleString()} vol</span>
                                {kw.competition && (
                                  <span className="capitalize">{kw.competition}</span>
                                )}
                                {kw.cpc > 0 && <span>${kw.cpc.toFixed(2)} CPC</span>}
                                {kw.etv > 0 && (
                                  <span className="text-green-600">
                                    ${kw.etv.toFixed(0)}/mo value
                                  </span>
                                )}
                              </div>
                              {kw.title && (
                                <p className="text-xs text-gray-600 truncate mb-1">{kw.title}</p>
                              )}
                              {kw.url && (
                                <a
                                  href={kw.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  {kw.url}
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No overlapping keywords found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : keywords.length > 0 ? (
              <div className="space-y-2">
                {keywords.map((kw, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{kw.keyword}</h4>
                          {kw.keyword_difficulty !== null && (
                            <Badge variant="outline" className={`text-xs h-5 px-1.5 ${getDifficultyColor(kw.keyword_difficulty)}`}>
                              KD: {kw.keyword_difficulty}
                            </Badge>
                          )}
                          {kw.position && (
                            <Badge variant="default" className="text-xs h-5 px-1.5">
                              #{kw.position}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mb-1">
                          <span>{kw.search_volume.toLocaleString()} vol</span>
                          {kw.competition && (
                            <span className="capitalize">{kw.competition}</span>
                          )}
                          {kw.cpc > 0 && <span>${kw.cpc.toFixed(2)} CPC</span>}
                          {kw.etv > 0 && (
                            <span className="text-green-600">
                              ${kw.etv.toFixed(0)}/mo traffic value
                            </span>
                          )}
                        </div>
                        {kw.title && (
                          <p className="text-xs text-gray-600 truncate mb-1">{kw.title}</p>
                        )}
                        {kw.url && (
                          <a
                            href={kw.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            {kw.url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No keywords found for this domain</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!analyzedDomain && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Spy on Any Competitor
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a competitor's domain above to see all the keywords they rank for, their positions, and estimated traffic value
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
