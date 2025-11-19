import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, Link as LinkIcon, Search, Users } from 'lucide-react'
import DeleteProjectButton from '@/components/projects/DeleteProjectButton'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
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
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    notFound()
  }

  // Fetch project stats
  const { count: keywordCount } = await supabase
    .from('keywords')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)

  const { count: backlinkCount } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)

  const { count: competitorCount } = await supabase
    .from('competitors')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)

  const stats = [
    { name: 'Keywords', value: keywordCount || 0, icon: Search },
    { name: 'Rankings', value: '-', icon: TrendingUp },
    { name: 'Backlinks', value: backlinkCount || 0, icon: LinkIcon },
    { name: 'Competitors', value: competitorCount || 0, icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.domain}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">Edit Project</Button>
          </Link>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Domain</p>
            <p className="font-medium">{project.domain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target Location</p>
            <p className="font-medium">{project.target_location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target Language</p>
            <p className="font-medium">{project.target_language}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your SEO data for this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/projects/${project.id}/keywords`}>
              <Button variant="outline" className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Manage Keywords
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/rankings`}>
              <Button variant="outline" className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Rankings
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/backlinks`}>
              <Button variant="outline" className="w-full">
                <LinkIcon className="mr-2 h-4 w-4" />
                Monitor Backlinks
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/competitors`}>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Competitors
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
