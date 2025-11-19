'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { TrendingUp } from 'lucide-react'

interface CheckRankButtonProps {
  keywordId: string
  keyword: string
  projectId: string
  domain: string
}

export default function CheckRankButton({
  keywordId,
  keyword,
  projectId,
  domain,
}: CheckRankButtonProps) {
  const [loading, setLoading] = useState(false)
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
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: data.position
          ? `Ranking: #${data.position}`
          : 'Not found in top 100',
      })

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
    <Button variant="outline" size="sm" onClick={handleCheck} disabled={loading}>
      <TrendingUp className="h-4 w-4 mr-1" />
      {loading ? 'Checking...' : 'Check'}
    </Button>
  )
}
