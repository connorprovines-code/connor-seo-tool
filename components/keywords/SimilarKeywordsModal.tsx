'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Search, TrendingUp, DollarSign, Lightbulb, Tag, RefreshCw } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface SimilarKeyword {
  keyword: string
  search_volume: number
  competition: string
  cpc: number
  keyword_difficulty?: number
  source: string
  sources: string[]
}

interface SimilarKeywordsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: string
  projectId: string
}

export default function SimilarKeywordsModal({
  open,
  onOpenChange,
  keyword,
  projectId,
}: SimilarKeywordsModalProps) {
  const [loading, setLoading] = useState(false)
  const [keywords, setKeywords] = useState<SimilarKeyword[]>([])
  const [includeSEO, setIncludeSEO] = useState(true)
  const [includeAds, setIncludeAds] = useState(false)
  const [includeRelated, setIncludeRelated] = useState(true)
  const [fetched, setFetched] = useState(false)

  const fetchKeywords = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dataforseo/keywords-hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          includeSEO,
          includeAds,
          includeRelated,
          limit: 100,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch similar keywords')
      }

      const data = await response.json()
      setKeywords(data.keywords || [])
      setFetched(true)

      toast({
        title: 'Success',
        description: `Found ${data.keywords.length} similar keywords`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch similar keywords',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !fetched) {
      fetchKeywords()
    }
    onOpenChange(newOpen)
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'seo':
        return <Badge variant="default" className="text-xs">SEO</Badge>
      case 'ads':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Ads</Badge>
      case 'related':
        return <Badge variant="outline" className="text-xs">Related</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Similar Keywords for "{keyword}"
          </DialogTitle>
          <DialogDescription>
            Discover related keywords from multiple sources
          </DialogDescription>
        </DialogHeader>

        {/* Source Toggles */}
        <div className="flex items-center gap-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeSEO"
              checked={includeSEO}
              onChange={(e) => setIncludeSEO(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <Label htmlFor="includeSEO" className="text-sm font-medium cursor-pointer">
              SEO Keywords (DataForSEO Labs)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeAds"
              checked={includeAds}
              onChange={(e) => setIncludeAds(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <Label htmlFor="includeAds" className="text-sm font-medium cursor-pointer">
              Paid/Ads Keywords (Google Ads)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeRelated"
              checked={includeRelated}
              onChange={(e) => setIncludeRelated(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <Label htmlFor="includeRelated" className="text-sm font-medium cursor-pointer">
              Related Searches (SERP)
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchKeywords}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching...' : 'Refresh'}
          </Button>
        </div>

        {/* Keywords Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && !fetched ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : keywords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b-2">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Keyword</th>
                    <th className="text-left py-3 px-4 font-semibold">Source</th>
                    <th className="text-right py-3 px-4 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <Search className="h-4 w-4" />
                        Volume
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Competition
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4" />
                        CPC
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{kw.keyword}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {kw.sources.map((source) => (
                            <span key={source}>{getSourceBadge(source)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        {kw.search_volume?.toLocaleString() || '-'}
                      </td>
                      <td className="text-right py-3 px-4 capitalize">
                        {kw.competition || '-'}
                      </td>
                      <td className="text-right py-3 px-4">
                        ${kw.cpc?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : fetched ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Tag className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No similar keywords found</p>
              <p className="text-sm">Try enabling more sources or use a different keyword</p>
            </div>
          ) : null}
        </div>

        {/* Footer Stats */}
        {keywords.length > 0 && (
          <div className="border-t pt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {keywords.length} keywords</span>
            <span>
              Sources: {includeSEO && 'SEO'} {includeAds && '+ Ads'}{' '}
              {includeRelated && '+ Related'}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
