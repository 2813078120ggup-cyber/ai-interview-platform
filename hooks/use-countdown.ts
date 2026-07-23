'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInterviewStore } from '@/store/interview-store'
import { WARNING_TIME, QUESTION_TIME } from '@/lib/design-tokens'

/**
 * 倒计时 Hook
 * - 每题45秒倒计时
 * - 最后WARNING_TIME(10)秒触发警告回调
 * - 倒计时归零触发超时回调
 */
export function useCountdown(onWarning?: () => void, onTimeout?: () => void) {
  const phase = useInterviewStore((s) => s.phase)
  const timeRemaining = useInterviewStore((s) => s.timeRemaining)
  const tick = useInterviewStore((s) => s.tick)
  const submitAnswer = useInterviewStore((s) => s.submitAnswer)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasWarnedRef = useRef(false)
  const warningCallbackRef = useRef(onWarning)
  const timeoutCallbackRef = useRef(onTimeout)

  // 保持回调引用最新
  warningCallbackRef.current = onWarning
  timeoutCallbackRef.current = onTimeout

  // 启动/停止倒计时
  useEffect(() => {
    if (phase !== 'in-progress') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 重置警告标记
    hasWarnedRef.current = false

    intervalRef.current = setInterval(() => {
      tick()
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, tick])

  // 监听警告 & 超时
  useEffect(() => {
    if (phase !== 'in-progress') return

    // WARNING_TIME 秒警告
    if (timeRemaining <= WARNING_TIME && timeRemaining > 0 && !hasWarnedRef.current) {
      hasWarnedRef.current = true
      warningCallbackRef.current?.()
    }

    // 倒计时归零
    if (timeRemaining <= 0) {
      timeoutCallbackRef.current?.()
      submitAnswer()
    }
  }, [timeRemaining, phase, submitAnswer])

  /** 是否处于警告状态 */
  const isWarning = timeRemaining <= WARNING_TIME && timeRemaining > 0

  /** 进度百分比 (0-100) */
  const progress = (timeRemaining / QUESTION_TIME) * 100

  return {
    timeRemaining,
    isWarning,
    progress,
  }
}
