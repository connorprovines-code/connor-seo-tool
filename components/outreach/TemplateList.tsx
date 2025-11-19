'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OutreachTemplate } from '@/types'
import { Trash2, Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TemplateListProps {
  templates: OutreachTemplate[]
}

export default function TemplateList({ templates }: TemplateListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (templateId: string, name: string) => {
    const confirmed = window.confirm(`Delete template "${name}"?`)
    if (!confirmed) return

    setDeleting(templateId)

    try {
      const { error } = await supabase.from('outreach_templates').delete().eq('id', templateId)

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
        description: 'Template deleted',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {template.name}
                  {template.is_default && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </CardTitle>
                <CardDescription className="mt-1">{template.subject}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(template.id, template.name)}
                disabled={deleting === template.id}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {template.body.length > 200
                  ? template.body.substring(0, 200) + '...'
                  : template.body}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
