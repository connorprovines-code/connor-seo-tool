'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MonthlySearch {
  year: number
  month: number
  search_volume: number
}

interface KeywordSparklineProps {
  data: MonthlySearch[]
  className?: string
}

export function KeywordSparkline({ data, className = '' }: KeywordSparklineProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !data || data.length === 0) {
    return null
  }

  // Sort data by year/month (oldest first for left-to-right trend)
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })

  // Take last 12 months
  const last12Months = sortedData.slice(-12)

  // Calculate trend (positive = growing, negative = declining)
  const firstValue = last12Months[0]?.search_volume || 0
  const lastValue = last12Months[last12Months.length - 1]?.search_volume || 0
  const trend = lastValue - firstValue
  const isGrowing = trend > 0
  const isDeclined = trend < 0

  // Choose color based on trend
  const lineColor = isGrowing ? '#10b981' : isDeclined ? '#ef4444' : '#6b7280'

  return (
    <div className={`inline-flex items-center ${className}`}>
      <ResponsiveContainer width={60} height={20}>
        <LineChart data={last12Months}>
          <Line
            type="monotone"
            dataKey="search_volume"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
