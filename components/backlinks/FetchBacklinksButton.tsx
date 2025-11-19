'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

interface FetchBacklinksButtonProps {
  projectId: string
  domain: string
}

export default function FetchBacklinksButton({
  projectId,
  domain,
}: FetchBacklinksButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFetch = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/dataforseo/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch backlinks')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: `Fetched ${data.count} backlinks`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch backlinks',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFetch} disabled={loading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Fetching...' : 'Fetch Backlinks'}
    </Button>
  )
}
