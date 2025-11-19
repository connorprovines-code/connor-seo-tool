import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Search, TrendingUp } from 'lucide-react'
import AddKeywordButton from '@/components/keywords/AddKeywordButton'
import KeywordList from '@/components/keywords/KeywordList'

interface KeywordsPageProps {
  params: {
    id: string
  }
}

export default async function KeywordsPage({ params }: KeywordsPageProps) {
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

  const { data: keywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keywords</h1>
          <p className="text-gray-500 mt-1">{project.name}</p>
        </div>
        <AddKeywordButton projectId={project.id} />
      </div>

      {keywords && keywords.length > 0 ? (
        <KeywordList keywords={keywords} projectId={project.id} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Start tracking keywords to monitor your SEO performance
            </p>
            <AddKeywordButton projectId={project.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
