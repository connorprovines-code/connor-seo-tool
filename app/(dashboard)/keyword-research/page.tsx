'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Search, TrendingUp, DollarSign, Zap } from 'lucide-react'

interface KeywordResult {
  keyword: string
  search_volume: number
  competition: string
  cpc: number
  keyword_difficulty?: number
}

export default function KeywordResearchPage() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KeywordResult[]>([])
  const [ideas, setIdeas] = useState<any[]>([])

  const handleResearch = async () => {
    if (!keyword.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a keyword',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Get keyword metrics
      const metricsRes = await fetch('/api/dataforseo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: [keyword] }),
      })

      if (!metricsRes.ok) {
        throw new Error('Failed to fetch keyword data')
      }

      const metricsData = await metricsRes.json()

      // Get keyword ideas
      const ideasRes = await fetch('/api/dataforseo/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json()
        if (ideasData.tasks && ideasData.tasks[0]?.result) {
          setIdeas(ideasData.tasks[0].result[0]?.items || [])
        }
      }

      // Parse results
      if (metricsData.tasks && metricsData.tasks[0]?.result) {
        const items = metricsData.tasks[0].result
        const formattedResults = items.map((item: any) => ({
          keyword: item.keyword,
          search_volume: item.search_volume || 0,
          competition: item.competition || 'N/A',
          cpc: item.cpc || 0,
        }))
        setResults(formattedResults)
      }

      toast({
        title: 'Success',
        description: 'Keyword data fetched successfully',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Keyword Research</h1>
        <p className="text-gray-500 mt-1">
          Discover new keywords and analyze search metrics
        </p>
      </div>

      {/* Research Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Keyword</CardTitle>
          <CardDescription>
            Enter a keyword to get search volume, competition, and related ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button onClick={handleResearch} disabled={loading}>
              {loading ? 'Searching...' : 'Research'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{result.keyword}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Search className="h-4 w-4 mr-1" />
                        Search Volume
                      </div>
                      <div className="text-2xl font-bold">
                        {result.search_volume.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Competition
                      </div>
                      <div className="text-2xl font-bold capitalize">
                        {result.competition}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <DollarSign className="h-4 w-4 mr-1" />
                        CPC
                      </div>
                      <div className="text-2xl font-bold">
                        ${result.cpc.toFixed(2)}
                      </div>
                    </div>
                    {result.keyword_difficulty && (
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Zap className="h-4 w-4 mr-1" />
                          Difficulty
                        </div>
                        <div className="text-2xl font-bold">
                          {result.keyword_difficulty}/100
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyword Ideas */}
      {ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Keyword Ideas</CardTitle>
            <CardDescription>
              Suggested keywords based on your search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Keyword</th>
                    <th className="text-right py-2 px-4">Search Volume</th>
                    <th className="text-right py-2 px-4">Competition</th>
                    <th className="text-right py-2 px-4">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.slice(0, 20).map((idea, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{idea.keyword}</td>
                      <td className="text-right py-2 px-4">
                        {idea.search_volume?.toLocaleString() || '-'}
                      </td>
                      <td className="text-right py-2 px-4 capitalize">
                        {idea.competition || '-'}
                      </td>
                      <td className="text-right py-2 px-4">
                        ${idea.cpc?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
