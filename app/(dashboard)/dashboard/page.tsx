import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, TrendingUp, Link, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user's projects
  const { data: projects, count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch total keywords across all projects
  const { count: keywordCount } = await supabase
    .from('keywords')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projects?.map(p => p.id) || [])

  // Fetch total backlinks
  const { count: backlinkCount } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projects?.map(p => p.id) || [])

  const stats = [
    {
      name: 'Total Projects',
      value: projectCount || 0,
      icon: Folder,
      href: '/projects',
    },
    {
      name: 'Tracked Keywords',
      value: keywordCount || 0,
      icon: TrendingUp,
      href: '/keyword-research',
    },
    {
      name: 'Backlinks',
      value: backlinkCount || 0,
      icon: Link,
      href: '/backlinks',
    },
    {
      name: 'Avg. Position',
      value: '-',
      icon: BarChart3,
      href: '/rankings',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/projects/new">
          <Button>Create Project</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently created projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.domain}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new project.
              </p>
              <div className="mt-6">
                <Link href="/projects/new">
                  <Button>Create Project</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
