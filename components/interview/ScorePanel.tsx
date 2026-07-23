'use client'

import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadarChart } from './RadarChart'
import { FeedbackBubble } from './FeedbackBubble'
import { DIMENSION_LABELS, type ScoreDimension, type DimensionScore } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScorePanelProps {
  className?: string
}

export function ScorePanel({ className }: ScorePanelProps) {
  const dimensionScores = useInterviewStore((s) => s.dimensionScores)
  const feedbacks = useInterviewStore((s) => s.feedbacks)
  const showFeedback = useInterviewStore((s) => s.showFeedback)
  const phase = useInterviewStore((s) => s.phase)

  // 构建评分数据
  const scores: DimensionScore[] = (Object.entries(DIMENSION_LABELS) as [ScoreDimension, string][]).map(
    ([dimension, label]) => ({
      dimension,
      label,
      score: dimensionScores[dimension] || 0,
      maxScore: 100,
    })
  )

  const hasScores = scores.some((s) => s.score > 0)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 雷达图卡片 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">能力评估</CardTitle>
            {phase === 'in-progress' && !showFeedback && (
              <Badge variant="secondary" className="text-xs">
                实时更新
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadarChart scores={scores} />
        </CardContent>
      </Card>

      {/* 维度进度条 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">维度详情</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {scores.map((item) => (
            <div key={item.dimension} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{item.label}</span>
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {item.score}
                  <span className="text-text-secondary font-normal"> / {item.maxScore}</span>
                </span>
              </div>
              <Progress
                value={item.score}
                className="h-1.5"
                indicatorClassName={cn(
                  item.score >= 85 && 'bg-green-500',
                  item.score >= 70 && item.score < 85 && 'bg-primary',
                  item.score < 70 && item.score > 0 && 'bg-yellow-500',
                  item.score === 0 && 'bg-gray-200'
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 即时反馈 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">即时反馈</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="sync">
            {showFeedback && feedbacks.length > 0 ? (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {feedbacks.map((fb, i) => (
                  <FeedbackBubble
                    key={fb.id}
                    feedback={fb}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-text-secondary">
                  {phase === 'waiting'
                    ? '等待面试开始...'
                    : phase === 'in-progress' && !showFeedback
                    ? '完成当前题目后显示反馈'
                    : phase === 'ended'
                    ? '面试已结束'
                    : '暂无反馈'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
