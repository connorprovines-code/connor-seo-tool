'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
}

export default function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"? This action cannot be undone and will delete all associated keywords, rankings, and data.`
    )

    if (!confirmed) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId)

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
        description: 'Project deleted successfully',
      })

      router.push('/projects')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete project',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="mr-2 h-4 w-4" />
      {loading ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
