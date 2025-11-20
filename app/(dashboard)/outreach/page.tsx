import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, Plus, Users } from 'lucide-react'

export default async function OutreachPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get all campaigns for user's projects
  const projectIds = projects?.map(p => p.id) || []

  const { data: campaigns } = await supabase
    .from('outreach_campaigns')
    .select('*, projects(name)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Link Building Outreach</h1>
          <p className="text-gray-500 mt-1">Automated backlink outreach campaigns powered by n8n</p>
        </div>
      </div>

      {/* Quick Start - Create New Campaign */}
      {projects && projects.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Start New Campaign</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select a project to find outreach opportunities
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {projects?.map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}/outreach`}>
                    <Button variant="outline" size="sm">
                      {project.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'running'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span><strong>Keyword:</strong> {campaign.keyword}</span>
                      <span><strong>Project:</strong> {campaign.projects?.name}</span>
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">{campaign.target_count} targets</span>
                      {campaign.sent_count > 0 && (
                        <span className="text-blue-600">{campaign.sent_count} sent</span>
                      )}
                      {campaign.replied_count > 0 && (
                        <span className="text-green-600">{campaign.replied_count} replied</span>
                      )}
                      {campaign.link_acquired_count > 0 && (
                        <span className="text-purple-600 font-medium">{campaign.link_acquired_count} links!</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/projects/${campaign.project_id}/outreach`}>
                    <Button variant="outline" size="sm">
                      View Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Create your first link building campaign to find backlink opportunities
            </p>
            {projects && projects.length > 0 && (
              <Link href={`/projects/${projects[0].id}/outreach`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start First Campaign
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
