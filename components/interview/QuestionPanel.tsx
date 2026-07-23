'use client'

import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Clock, FileText, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuestionPanelProps {
  className?: string
}

export function QuestionPanel({ className }: QuestionPanelProps) {
  const questions = useInterviewStore((s) => s.questions)
  const currentQuestionIndex = useInterviewStore((s) => s.currentQuestionIndex)
  const timeRemaining = useInterviewStore((s) => s.timeRemaining)
  const phase = useInterviewStore((s) => s.phase)

  const question = questions[currentQuestionIndex]

  if (!question) return null

  const typeLabel = {
    behavioral: '行为面试',
    technical: '技术问答',
    'case-study': '案例分析',
    general: '综合问答',
  }[question.type]

  const typeColor = {
    behavioral: 'bg-blue-50 text-blue-700',
    technical: 'bg-purple-50 text-purple-700',
    'case-study': 'bg-orange-50 text-orange-700',
    general: 'bg-green-50 text-green-700',
  }[question.type]

  return (
    <Card className={cn('border-0 shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">当前题目</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs font-normal', typeColor)}>
              {typeLabel}
            </Badge>
            <span className="text-xs text-text-secondary">
              第 {currentQuestionIndex + 1} / {questions.length} 题
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-text-primary text-sm leading-relaxed mb-4">
              {question.text}
            </p>

            {/* 参考要点 */}
            {question.referencePoints.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-text-secondary mb-3">
                <Tag className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                <div className="flex flex-wrap gap-1">
                  {question.referencePoints.map((point, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 建议时长 */}
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5" />
              <span>建议回答时长：{question.suggestedDuration}秒</span>
              {phase === 'in-progress' && (
                <span className="text-primary font-medium ml-2">
                  剩余 {timeRemaining}s
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
