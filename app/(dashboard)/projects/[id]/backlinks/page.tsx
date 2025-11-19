import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link as LinkIcon, TrendingUp, Globe } from 'lucide-react'
import FetchBacklinksButton from '@/components/backlinks/FetchBacklinksButton'

interface BacklinksPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BacklinksPage({ params }: BacklinksPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    notFound()
  }

  const { data: backlinks, count: totalBacklinks } = await supabase
    .from('backlinks')
    .select('*', { count: 'exact' })
    .eq('project_id', project.id)
    .eq('is_lost', false)
    .order('first_seen', { ascending: false })

  const { count: lostBacklinks } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)
    .eq('is_lost', true)

  const dofollowCount =
    backlinks?.filter((b) => b.link_type === 'dofollow').length || 0

  const uniqueDomains = new Set(
    backlinks?.map((b) => {
      try {
        return new URL(b.source_url).hostname
      } catch {
        return b.source_url
      }
    })
  ).size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backlinks</h1>
          <p className="text-gray-500 mt-1">{project.name}</p>
        </div>
        <FetchBacklinksButton projectId={project.id} domain={project.domain} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBacklinks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Referring Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDomains}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dofollow Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dofollowCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lostBacklinks || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backlinks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Backlink Profile</CardTitle>
          <CardDescription>
            All backlinks pointing to your domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backlinks && backlinks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Source URL</th>
                    <th className="text-left py-3 px-4">Target URL</th>
                    <th className="text-left py-3 px-4">Anchor Text</th>
                    <th className="text-center py-3 px-4">Type</th>
                    <th className="text-center py-3 px-4">First Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {backlinks.map((backlink) => (
                    <tr key={backlink.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <a
                          href={backlink.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate block max-w-xs"
                        >
                          {backlink.source_url}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 truncate block max-w-xs">
                          {backlink.target_url}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {backlink.anchor_text || '-'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            backlink.link_type === 'dofollow'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {backlink.link_type}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-500">
                        {new Date(backlink.first_seen).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No backlinks found
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Fetch backlinks to monitor your link profile
              </p>
              <FetchBacklinksButton projectId={project.id} domain={project.domain} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
