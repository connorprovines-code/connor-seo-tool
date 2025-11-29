'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface EditProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const [id, setId] = useState<string>('')
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProject() {
      const resolvedParams = await params
      setId(resolvedParams.id)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error || !project) {
        toast({
          title: 'Error',
          description: 'Project not found',
          variant: 'destructive',
        })
        router.push('/projects')
        return
      }

      setName(project.name)
      setDomain(project.domain)
      setTargetLocation(project.target_location || '')
      setTargetLanguage(project.target_language || '')
      setInitialLoading(false)
    }

    loadProject()
  }, [params, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          domain,
          target_location: targetLocation,
          target_language: targetLanguage,
        })
        .eq('id', id)

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
        description: 'Project updated successfully!',
      })

      router.push(`/projects/${id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-500 mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-gray-500 mt-1">Update your project settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Update the details for your SEO project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full URL of your website
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLocation">Target Location</Label>
              <Input
                id="targetLocation"
                placeholder="United States"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The primary geographic target for your SEO efforts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLanguage">Target Language</Label>
              <Input
                id="targetLanguage"
                placeholder="en"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Language code (e.g., en, es, fr)
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
