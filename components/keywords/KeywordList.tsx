'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Keyword } from '@/types'
import { Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import CheckRankButton from '@/components/keywords/CheckRankButton'

interface KeywordListProps {
  keywords: Keyword[]
  projectId: string
  projectDomain: string
}

export default function KeywordList({ keywords, projectId, projectDomain }: KeywordListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

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
    <div className="space-y-4">
      {keywords.map((kw) => (
        <Card key={kw.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{kw.keyword}</h3>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                {kw.search_volume && (
                  <span>Volume: {kw.search_volume.toLocaleString()}</span>
                )}
                {kw.competition && (
                  <span className="capitalize">Competition: {kw.competition}</span>
                )}
                {kw.cpc && <span>CPC: ${kw.cpc.toFixed(2)}</span>}
                {kw.keyword_difficulty && (
                  <span>Difficulty: {kw.keyword_difficulty}/100</span>
                )}
              </div>
              {kw.tags && kw.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {kw.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <CheckRankButton
                keywordId={kw.id}
                keyword={kw.keyword}
                projectId={projectId}
                domain={projectDomain}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(kw.id, kw.keyword)}
                disabled={deleting === kw.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
