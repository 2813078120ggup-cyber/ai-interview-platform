'use client'

import { cn } from '@/lib/utils'
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { DIMENSION_LABELS, type ScoreDimension, type DimensionScore } from '@/lib/types'

interface RadarChartProps {
  scores: DimensionScore[]
  className?: string
}

// 将 score 数据转换为 Recharts 格式
function toChartData(scores: DimensionScore[]) {
  return scores.map((s) => ({
    dimension: s.label,
    score: s.score,
    fullScore: s.maxScore,
  }))
}

export function RadarChart({ scores, className }: RadarChartProps) {
  const data = toChartData(scores)

  return (
    <div className={cn('w-full h-[240px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={data}
        >
          <PolarGrid
            stroke="#E2E8F0"
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fontSize: 11,
              fill: '#64748B',
              fontFamily: "'PingFang SC', 'Inter', system-ui, sans-serif",
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="评分"
            dataKey="score"
            stroke="#4A6CF7"
            strokeWidth={2}
            fill="#4A6CF7"
            fillOpacity={0.15}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  )
}
