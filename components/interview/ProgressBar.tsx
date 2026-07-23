'use client'

import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

interface ProgressBarProps {
  className?: string
}

export function ProgressBar({ className }: ProgressBarProps) {
  const questions = useInterviewStore((s) => s.questions)
  const currentQuestionIndex = useInterviewStore((s) => s.currentQuestionIndex)
  const phase = useInterviewStore((s) => s.phase)

  const total = questions.length
  const current = currentQuestionIndex + 1
  const percent = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* 进度条 */}
      <div className="flex-1 min-w-[160px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">
            面试进度
          </span>
          <span className="text-xs font-medium text-primary">
            {current} / {total}
          </span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>

      {/* 题目节点 */}
      <div className="hidden lg:flex items-center gap-1">
        {questions.map((q, i) => {
          const isCompleted = i < currentQuestionIndex
          const isCurrent = i === currentQuestionIndex
          const isPending = i > currentQuestionIndex

          return (
            <div key={q.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-300',
                  isCompleted && 'bg-primary text-white',
                  isCurrent && 'bg-primary-100 text-primary border-2 border-primary',
                  isPending && 'bg-gray-100 text-text-secondary border border-gray-200'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < questions.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-[2px]',
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
