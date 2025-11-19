import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import AddCompetitorButton from '@/components/competitors/AddCompetitorButton'
import CompetitorList from '@/components/competitors/CompetitorList'

interface CompetitorsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CompetitorsPage({ params }: CompetitorsPageProps) {
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

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competitors</h1>
          <p className="text-gray-500 mt-1">{project.name}</p>
        </div>
        <AddCompetitorButton projectId={project.id} />
      </div>

      {competitors && competitors.length > 0 ? (
        <CompetitorList competitors={competitors} projectId={project.id} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitors yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Add competitor domains to track and compare their SEO performance
            </p>
            <AddCompetitorButton projectId={project.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
