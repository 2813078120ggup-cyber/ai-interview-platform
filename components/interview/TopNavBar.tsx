'use client'

import { cn, formatTime } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { ProgressBar } from './ProgressBar'
import { CountdownTimer } from './CountdownTimer'
import { Clock } from 'lucide-react'

interface TopNavBarProps {
  className?: string
}

export function TopNavBar({ className }: TopNavBarProps) {
  const totalElapsed = useInterviewStore((s) => s.totalElapsed)
  const phase = useInterviewStore((s) => s.phase)

  return (
    <header
      className={cn(
        'flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-100 shadow-sm',
        className
      )}
    >
      {/* Logo / 标题 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <span className="text-sm font-semibold text-text-primary hidden sm:inline">
          AI模拟面试
        </span>
      </div>

      {/* 进度条 */}
      <ProgressBar className="flex-1" />

      {/* 分隔 */}
      <div className="w-px h-8 bg-gray-200" />

      {/* 总时长 */}
      <div className="flex items-center gap-2 text-sm text-text-secondary shrink-0">
        <Clock className="w-4 h-4" />
        <span className="tabular-nums">{formatTime(totalElapsed)}</span>
      </div>

      {/* 倒计时 */}
      <CountdownTimer />
    </header>
  )
}
