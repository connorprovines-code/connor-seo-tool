'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function NewProjectPage() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [targetLocation, setTargetLocation] = useState('United States')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [connectGSC, setConnectGSC] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a project',
          variant: 'destructive',
        })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          domain,
          target_location: targetLocation,
          target_language: targetLanguage,
        })
        .select()
        .single()

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
        description: 'Project created successfully!',
      })

      // If GSC connection requested, redirect to OAuth flow
      if (connectGSC) {
        window.location.href = `/api/gsc/auth?projectId=${data.id}`
      } else {
        router.push(`/projects/${data.id}`)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-500 mt-1">Add a new website to track its SEO performance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Enter the details for your new SEO project
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

            <div className="flex items-start space-x-3 rounded-md border p-4">
              <input
                type="checkbox"
                id="connectGSC"
                checked={connectGSC}
                onChange={(e) => setConnectGSC(e.target.checked)}
                disabled={loading}
                className="mt-1"
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="connectGSC" className="font-medium cursor-pointer">
                  Connect Google Search Console
                </Label>
                <p className="text-xs text-muted-foreground">
                  Connect GSC to automatically import ranking data, clicks, and impressions for this project
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
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
