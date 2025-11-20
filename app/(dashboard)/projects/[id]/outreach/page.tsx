'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Search, Loader2, ExternalLink, Target, Send, CheckCircle2, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OutreachPageProps {
  params: Promise<{
    id: string
  }>
}

interface Keyword {
  id: string
  keyword: string
  search_volume: number | null
  keyword_difficulty: number | null
}

interface OutreachTarget {
  domain: string
  target_url: string
  target_score: number
  metrics: {
    domain_rating: number
    monthly_traffic: number
    referring_domains: number
  }
  why_targeted: string
  outreach_angle: string
  pitch_hook: string
  research_prompts: string[]
}

export default function OutreachPage({ params }: OutreachPageProps) {
  const { id: projectId } = use(params)
  const supabase = createClient()

  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null)
  const [yourDomain, setYourDomain] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [campaignName, setCampaignName] = useState('')

  const [loadingKeywords, setLoadingKeywords] = useState(true)
  const [findingTargets, setFindingTargets] = useState(false)
  const [launchingCampaign, setLaunchingCampaign] = useState(false)

  const [targets, setTargets] = useState<OutreachTarget[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null)

  // Load keywords
  useEffect(() => {
    const loadKeywords = async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('id, keyword, search_volume, keyword_difficulty')
        .eq('project_id', projectId)
        .order('search_volume', { ascending: false, nullsFirst: false })

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load keywords',
          variant: 'destructive',
        })
      } else {
        setKeywords(data || [])
      }
      setLoadingKeywords(false)
    }

    loadKeywords()
  }, [projectId])

  // Load project domain
  useEffect(() => {
    const loadProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('domain')
        .eq('id', projectId)
        .single()

      if (data?.domain) {
        setYourDomain(data.domain)
      }
    }

    loadProject()
  }, [projectId])

  const handleFindTargets = async () => {
    if (!selectedKeywordId) {
      toast({
        title: 'Error',
        description: 'Please select a keyword',
        variant: 'destructive',
      })
      return
    }

    setFindingTargets(true)
    setTargets([])

    try {
      const response = await fetch('/api/outreach/find-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywordId: selectedKeywordId,
          projectId,
          yourDomain,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to find targets')
      }

      const data = await response.json()
      setTargets(data.targets || [])
      setSelectedKeyword(keywords.find(k => k.id === selectedKeywordId) || null)

      toast({
        title: 'Targets Found',
        description: `Found ${data.targets.length} outreach opportunities`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to find targets',
        variant: 'destructive',
      })
    } finally {
      setFindingTargets(false)
    }
  }

  const handleLaunchCampaign = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your n8n webhook URL',
        variant: 'destructive',
      })
      return
    }

    if (targets.length === 0) {
      toast({
        title: 'Error',
        description: 'No targets to launch campaign with',
        variant: 'destructive',
      })
      return
    }

    setLaunchingCampaign(true)

    try {
      const response = await fetch('/api/outreach/launch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          keywordId: selectedKeywordId,
          keyword: selectedKeyword?.keyword,
          targets,
          webhookUrl: webhookUrl.trim(),
          yourDomain,
          campaignName: campaignName || `${selectedKeyword?.keyword} - Outreach`,
        }),
      })

      const data = await response.json()

      if (data.success || data.campaign_id) {
        toast({
          title: 'Campaign Launched!',
          description: data.message || `Campaign sent to n8n with ${targets.length} targets`,
        })

        // Reset form
        setTargets([])
        setSelectedKeywordId(null)
        setSelectedKeyword(null)
        setCampaignName('')
      } else {
        throw new Error(data.error || 'Failed to launch campaign')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to launch campaign',
        variant: 'destructive',
      })
    } finally {
      setLaunchingCampaign(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Link Building Outreach</h1>
        <p className="text-gray-500 mt-1">
          Find high-quality backlink opportunities and automate outreach with n8n
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Campaign</CardTitle>
          <CardDescription>
            Select a keyword to find link building opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyword Selection */}
          <div>
            <Label>Select Keyword</Label>
            {loadingKeywords ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading keywords...
              </div>
            ) : (
              <select
                value={selectedKeywordId || ''}
                onChange={(e) => setSelectedKeywordId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                disabled={findingTargets || launchingCampaign}
              >
                <option value="">-- Select a keyword --</option>
                {keywords.map((kw) => (
                  <option key={kw.id} value={kw.id}>
                    {kw.keyword} {kw.search_volume ? `(${kw.search_volume.toLocaleString()} vol)` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Your Domain */}
          <div>
            <Label>Your Domain</Label>
            <Input
              value={yourDomain}
              onChange={(e) => setYourDomain(e.target.value)}
              placeholder="yourdomain.com"
              disabled={findingTargets || launchingCampaign}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll exclude this domain from target results
            </p>
          </div>

          {/* Find Targets Button */}
          <Button
            onClick={handleFindTargets}
            disabled={!selectedKeywordId || findingTargets || launchingCampaign}
            className="w-full"
          >
            {findingTargets ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding Targets...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Outreach Targets
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Targets Results */}
      {targets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Outreach Targets for "{selectedKeyword?.keyword}"</CardTitle>
                <CardDescription>
                  Top {targets.length} link building opportunities
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {targets.length} targets
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* n8n Configuration */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label>Campaign Name (Optional)</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={`${selectedKeyword?.keyword} - Outreach`}
                    disabled={launchingCampaign}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label>n8n Webhook URL</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-n8n.app.n8n.cloud/webhook/..."
                    disabled={launchingCampaign}
                    className="mt-1 bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Your n8n workflow will receive all targets with research prompts
                  </p>
                </div>
                <Button
                  onClick={handleLaunchCampaign}
                  disabled={!webhookUrl.trim() || launchingCampaign}
                  className="w-full"
                  size="lg"
                >
                  {launchingCampaign ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Launching Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Launch Campaign to n8n
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Target List */}
            <div className="space-y-2">
              {targets.map((target, idx) => (
                <Card key={idx} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{target.domain}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs h-5 px-1.5 ${getScoreColor(target.target_score)}`}
                          >
                            Score: {target.target_score}
                          </Badge>
                          <Badge variant="secondary" className="text-xs h-5 px-1.5 capitalize">
                            {target.outreach_angle.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{target.why_targeted}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mb-2">
                          <span>{target.metrics.referring_domains.toLocaleString()} backlinks</span>
                          {target.metrics.domain_rating > 0 && (
                            <span>DR: {Math.round(target.metrics.domain_rating)}</span>
                          )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <strong>Pitch Hook:</strong> {target.pitch_hook}
                        </div>
                      </div>
                    </div>

                    {/* Research Prompts Preview */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:underline">
                        View {target.research_prompts.length} research prompts for n8n
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 list-disc text-gray-600">
                        {target.research_prompts.map((prompt, i) => (
                          <li key={i}>{prompt}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!findingTargets && targets.length === 0 && !loadingKeywords && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Find Link Building Opportunities
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Select a keyword above to discover high-quality backlink opportunities. We'll analyze:
            </p>
            <ul className="text-sm text-gray-600 max-w-md mx-auto text-left space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Sites ranking for your keyword
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Domains linking to multiple competitors
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Best outreach opportunities (top 10)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Research prompts for personalized outreach
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
