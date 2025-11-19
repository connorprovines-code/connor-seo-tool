'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'

interface AddKeywordButtonProps {
  projectId: string
}

export default function AddKeywordButton({ projectId }: AddKeywordButtonProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async () => {
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
      // Fetch keyword data from DataForSEO to enrich the keyword
      const dataForSEOResponse = await fetch('/api/dataforseo/similar-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          limit: 1, // We only need the keyword itself, not similar keywords
          includeSERP: false,
        }),
      })

      let keywordData: any = {
        project_id: projectId,
        keyword: keyword.trim(),
      }

      // If we successfully fetched data from DataForSEO, enrich the keyword
      if (dataForSEOResponse.ok) {
        const data = await dataForSEOResponse.json()
        const mainKeyword = data.ideas?.[0]

        if (mainKeyword) {
          keywordData = {
            ...keywordData,
            search_volume: mainKeyword.search_volume || null,
            competition: mainKeyword.competition_level || null,
            cpc: mainKeyword.cpc || null,
            keyword_difficulty: mainKeyword.keyword_difficulty || null,
            monthly_searches: mainKeyword.monthly_searches || [],
          }
        }
      }

      const { error } = await supabase.from('keywords').insert(keywordData)

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
        description: 'Keyword added successfully',
      })

      setKeyword('')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add keyword',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Keyword
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Keyword</DialogTitle>
          <DialogDescription>
            Add a keyword to track its ranking over time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <Input
              id="keyword"
              placeholder="e.g., best seo tools"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? 'Adding...' : 'Add Keyword'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
