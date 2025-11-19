'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Ranking, Keyword } from '@/types'

interface RankingsChartProps {
  rankings: Ranking[]
  keywords: Keyword[]
}

export default function RankingsChart({ rankings, keywords }: RankingsChartProps) {
  // Group rankings by date
  const dataByDate = new Map<string, any>()

  rankings.forEach((ranking) => {
    const date = new Date(ranking.checked_at).toLocaleDateString()
    if (!dataByDate.has(date)) {
      dataByDate.set(date, { date })
    }

    const keyword = keywords.find((k) => k.id === ranking.keyword_id)
    if (keyword) {
      dataByDate.get(date)[keyword.keyword] = ranking.rank_position
    }
  })

  const data = Array.from(dataByDate.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30) // Last 30 days

  // Get unique keywords for lines
  const uniqueKeywords = [...new Set(rankings.map((r) => r.keyword_id))]
    .map((id) => keywords.find((k) => k.id === id))
    .filter(Boolean)
    .slice(0, 5) // Show max 5 keywords

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis reversed domain={[1, 100]} />
          <Tooltip />
          <Legend />
          {uniqueKeywords.map((keyword, idx) => (
            <Line
              key={keyword!.id}
              type="monotone"
              dataKey={keyword!.keyword}
              stroke={colors[idx]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
