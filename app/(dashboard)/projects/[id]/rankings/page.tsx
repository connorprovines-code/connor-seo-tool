import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RankingsChart from '@/components/charts/RankingsChart'
import CheckRankButton from '@/components/keywords/CheckRankButton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RankingsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RankingsPage({ params }: RankingsPageProps) {
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

  // Get keywords with their latest rankings
  const { data: keywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  // Get all rankings for this project
  const { data: rankings } = await supabase
    .from('rankings')
    .select('*')
    .eq('project_id', project.id)
    .order('checked_at', { ascending: false })

  // Calculate stats
  const keywordIds = keywords?.map(k => k.id) || []
  const latestRankings = new Map()

  rankings?.forEach(ranking => {
    if (!latestRankings.has(ranking.keyword_id)) {
      latestRankings.set(ranking.keyword_id, ranking)
    }
  })

  const avgPosition = latestRankings.size > 0
    ? Array.from(latestRankings.values()).reduce((sum, r) => sum + r.rank_position, 0) / latestRankings.size
    : 0

  const top3 = Array.from(latestRankings.values()).filter(r => r.rank_position <= 3).length
  const top10 = Array.from(latestRankings.values()).filter(r => r.rank_position <= 10).length
  const top20 = Array.from(latestRankings.values()).filter(r => r.rank_position <= 20).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
        <p className="text-gray-500 mt-1">{project.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgPosition > 0 ? avgPosition.toFixed(1) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top 3 Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{top3}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top 10 Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{top10}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top 20 Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{top20}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Chart */}
      {rankings && rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking Trends</CardTitle>
            <CardDescription>Historical ranking positions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingsChart rankings={rankings} keywords={keywords || []} />
          </CardContent>
        </Card>
      )}

      {/* Current Rankings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Rankings</CardTitle>
              <CardDescription>Latest ranking positions for your keywords</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {keywords && keywords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Keyword</th>
                    <th className="text-center py-3 px-4">Current Position</th>
                    <th className="text-center py-3 px-4">Change</th>
                    <th className="text-center py-3 px-4">Last Checked</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((keyword) => {
                    const latestRanking = latestRankings.get(keyword.id)
                    return (
                      <tr key={keyword.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{keyword.keyword}</td>
                        <td className="text-center py-3 px-4">
                          {latestRanking ? (
                            <span className="font-semibold">#{latestRanking.rank_position}</span>
                          ) : (
                            <span className="text-gray-400">Not checked</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {latestRanking ? (
                            <span className="flex items-center justify-center text-gray-400">
                              <Minus className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-500">
                          {latestRanking
                            ? new Date(latestRanking.checked_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="text-right py-3 px-4">
                          <CheckRankButton
                            keywordId={keyword.id}
                            keyword={keyword.keyword}
                            projectId={project.id}
                            domain={project.domain}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No keywords to track. Add keywords first to see rankings.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
