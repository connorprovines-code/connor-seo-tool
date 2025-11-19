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
          <h1 className="text-3xl font-bold text-gray-900">Outreach Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage your backlink outreach campaigns</p>
        </div>
        <div className="flex gap-2">
          <Link href="/outreach/templates">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Templates
            </Button>
          </Link>
          <Link href="/outreach/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => (
            <Link key={campaign.id} href={`/outreach/${campaign.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Mail className="h-8 w-8 text-primary" />
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <CardTitle className="mt-4">{campaign.name}</CardTitle>
                  <CardDescription>
                    {campaign.projects?.name || 'Unknown Project'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Create your first outreach campaign to start building backlinks
            </p>
            <Link href="/outreach/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
