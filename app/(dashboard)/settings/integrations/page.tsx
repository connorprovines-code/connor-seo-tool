'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react'

export default function IntegrationsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [gscTokens, setGscTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadData()

    // Check for OAuth callback status
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast({
        title: 'Success',
        description: 'Google Search Console connected successfully!',
      })
    } else if (error) {
      toast({
        title: 'Error',
        description: `Failed to connect GSC: ${error}`,
        variant: 'destructive',
      })
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])

      // Load GSC tokens
      const { data: tokensData } = await supabase
        .from('gsc_tokens')
        .select('*')

      setGscTokens(tokensData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectGSC = (projectId: string) => {
    window.location.href = `/api/gsc/auth?projectId=${projectId}`
  }

  const isConnected = (projectId: string) => {
    return gscTokens.some((token) => token.project_id === projectId)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect third-party services to enhance your SEO data</p>
      </div>

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              alt="Google"
              className="w-6 h-6"
            />
            Google Search Console
          </CardTitle>
          <CardDescription>
            Connect your Google Search Console account to import verified ranking data, clicks,
            impressions, and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => {
                const connected = isConnected(project.id)
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {connected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-gray-500">{project.domain}</p>
                      </div>
                    </div>
                    <Button
                      variant={connected ? 'outline' : 'default'}
                      onClick={() => !connected && connectGSC(project.id)}
                      disabled={connected}
                    >
                      {connected ? 'Connected' : 'Connect GSC'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Create a project first to connect Google Search Console
            </p>
          )}
        </CardContent>
      </Card>

      {/* DataForSEO */}
      <Card>
        <CardHeader>
          <CardTitle>DataForSEO API</CardTitle>
          <CardDescription>
            Credentials configured via environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {process.env.NEXT_PUBLIC_DATAFORSEO_LOGIN ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Not configured</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anthropic Claude */}
      <Card>
        <CardHeader>
          <CardTitle>Anthropic Claude AI</CardTitle>
          <CardDescription>
            AI assistant credentials configured via environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600">Connected</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
