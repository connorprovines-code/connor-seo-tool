'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { TrendingUp, ExternalLink, Trophy, AlertCircle } from 'lucide-react'

interface CheckRankButtonProps {
  keywordId: string
  keyword: string
  projectId: string
  domain: string
}

interface RankingResult {
  keyword: string
  domain: string
  position: number | null
  rankUrl: string | null
  rankTitle: string | null
  totalResults: number
  serpFeatures: number
  topResults: Array<{
    position: number
    url: string
    domain: string
    title: string
    description: string
  }>
}

export default function CheckRankButton({
  keywordId,
  keyword,
  projectId,
  domain,
}: CheckRankButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [rankingData, setRankingData] = useState<RankingResult | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCheck = async () => {
    setLoading(true)

    try {
      // Call API to check ranking
      const response = await fetch('/api/dataforseo/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          domain,
          locationCode: 2840,
          device: 'desktop',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check ranking')
      }

      const data = await response.json()
      setRankingData(data)

      // Verify keyword exists before inserting ranking
      const { data: keywordExists, error: keywordError } = await supabase
        .from('keywords')
        .select('id')
        .eq('id', keywordId)
        .single()

      if (keywordError || !keywordExists) {
        console.error('Keyword not found:', keywordId, keywordError)
        toast({
          title: 'Error',
          description: 'Keyword not found in database. Please refresh the page.',
          variant: 'destructive',
        })
        setShowResults(true) // Still show the SERP results
        router.refresh() // Refresh to sync data
        return
      }

      // Save ranking to database
      const { error } = await supabase.from('rankings').insert({
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

      if (error) {
        console.error('Failed to save ranking:', error)
        toast({
          title: 'Error',
          description: `Failed to save ranking: ${error.message}`,
          variant: 'destructive',
        })
        setShowResults(true) // Still show the SERP results even if save fails
        return
      }

      // Show results dialog
      setShowResults(true)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check ranking',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCheck} disabled={loading}>
        <TrendingUp className="h-4 w-4 mr-1" />
        {loading ? 'Checking...' : 'Check'}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Ranking Results for "{keyword}"</DialogTitle>
            <DialogDescription>
              Your ranking position and top 10 competitors
            </DialogDescription>
          </DialogHeader>

          {rankingData && (
            <div className="space-y-6">
              {/* Your Ranking */}
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                {rankingData.position ? (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary text-white rounded-full">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Your Position: #{rankingData.position}</h3>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{rankingData.rankTitle}</p>
                        <a
                          href={rankingData.rankUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {rankingData.rankUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-200 text-gray-600 rounded-full">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Not Found in Top 100</h3>
                      <p className="text-sm text-gray-600">
                        Your domain doesn't currently rank in the top 100 results for this keyword.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 10 Results */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 Organic Results</h3>
                <div className="space-y-3">
                  {rankingData.topResults.map((result) => {
                    const isYourDomain = result.domain.includes(
                      domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
                    )

                    return (
                      <div
                        key={result.position}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          isYourDomain
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isYourDomain ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {result.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-primary">
                              {result.domain}
                            </span>
                            {isYourDomain && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                                YOU
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {result.description}
                          </p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 mt-1"
                          >
                            {result.url.substring(0, 80)}
                            {result.url.length > 80 && '...'}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Total SERP Results</p>
                  <p className="text-2xl font-bold">{rankingData.totalResults}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SERP Features</p>
                  <p className="text-2xl font-bold">{rankingData.serpFeatures}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
