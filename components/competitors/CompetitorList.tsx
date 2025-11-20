'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Competitor } from '@/types'
import { Trash2, ExternalLink, Search, TrendingUp, Target } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CompetitorListProps {
  competitors: Competitor[]
  projectId: string
}

export default function CompetitorList({ competitors, projectId }: CompetitorListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (competitorId: string, domain: string) => {
    const confirmed = window.confirm(`Delete competitor "${domain}"?`)
    if (!confirmed) return

    setDeleting(competitorId)

    try {
      const { error } = await supabase.from('competitors').delete().eq('id', competitorId)

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
        description: 'Competitor deleted',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete competitor',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const cleanDomain = (domain: string) => {
    return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {competitors.map((competitor) => (
        <Card key={competitor.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="truncate">{competitor.name || cleanDomain(competitor.domain)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(competitor.id, competitor.domain)}
                disabled={deleting === competitor.id}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Domain:</span>
                <a
                  href={`https://${cleanDomain(competitor.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <span className="truncate max-w-[150px]">
                    {cleanDomain(competitor.domain)}
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Added:</span>
                <span>{new Date(competitor.created_at).toLocaleDateString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t space-y-2">
                <Link
                  href={`/projects/${projectId}/competitors/keywords?domain=${encodeURIComponent(cleanDomain(competitor.domain))}`}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    View Their Keywords
                  </Button>
                </Link>

                <Link
                  href={`/projects/${projectId}/competitors/keywords?domain=${encodeURIComponent(cleanDomain(competitor.domain))}&action=gap`}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Keyword Gap Analysis
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
