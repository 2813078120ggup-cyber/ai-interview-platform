'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { QUESTION_TIME, WARNING_TIME } from '@/lib/design-tokens'

interface CountdownTimerProps {
  className?: string
}

export function CountdownTimer({ className }: CountdownTimerProps) {
  const timeRemaining = useInterviewStore((s) => s.timeRemaining)
  const phase = useInterviewStore((s) => s.phase)

  const isWarning = phase === 'in-progress' && timeRemaining <= WARNING_TIME && timeRemaining > 0
  const isTimeout = timeRemaining <= 0 && phase === 'in-progress'

  // SVG 圆形进度
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = phase === 'in-progress' ? timeRemaining / QUESTION_TIME : 1
  const offset = circumference * (1 - progress)

  return (
    <div className={cn('relative flex items-center gap-3', className)}>
      {/* 圆形倒计时 */}
      <div className="relative w-[68px] h-[68px] flex items-center justify-center">
        {/* 背景圆环 */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="6"
          />
        </svg>

        {/* 进度圆环 */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 64 64"
        >
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={
              isTimeout ? '#EF4444'
                : isWarning ? '#EF4444'
                : '#4A6CF7'
            }
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </svg>

        {/* 时间数字 */}
        <span
          className={cn(
            'text-lg font-bold tabular-nums z-10 transition-colors',
            isWarning && 'text-red-500',
            isTimeout && 'text-red-500'
          )}
        >
          {isTimeout ? '0' : timeRemaining}
        </span>
      </div>

      {/* 标签 */}
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">剩余时间</span>
        <span className={cn(
          'text-lg font-bold tabular-nums',
          isWarning ? 'text-red-500 animate-pulse' : 'text-text-primary'
        )}>
          {timeRemaining}s
        </span>
      </div>
    </div>
  )
}
