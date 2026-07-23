'use client'

import { useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { TopNavBar } from './TopNavBar'
import { VideoPanel } from './VideoPanel'
import { QuestionPanel } from './QuestionPanel'
import { CodeEditor } from './CodeEditor'
import { ScorePanel } from './ScorePanel'
import { BottomActionBar } from './BottomActionBar'
import { AnimatePresence, motion } from 'framer-motion'

interface InterviewRoomProps {
  roomId: string
  className?: string
}

export function InterviewRoom({ roomId, className }: InterviewRoomProps) {
  const phase = useInterviewStore((s) => s.phase)
  const questions = useInterviewStore((s) => s.questions)
  const currentQuestionIndex = useInterviewStore((s) => s.currentQuestionIndex)
  const startInterview = useInterviewStore((s) => s.startInterview)
  const setSubtitle = useInterviewStore((s) => s.setSubtitle)
  const setAiSpeaking = useInterviewStore((s) => s.setAiSpeaking)
  const setCandidateVolume = useInterviewStore((s) => s.setCandidateVolume)

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 初始化roomId
  useEffect(() => {
    useInterviewStore.setState({ roomId })
  }, [roomId])

  // 模拟字幕和AI说话
  useEffect(() => {
    if (phase !== 'in-progress') {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
        simulationRef.current = null
      }
      setAiSpeaking(false)
      setSubtitle('')
      setCandidateVolume(0)
      return
    }

    const subtitles = [
      '请简单介绍一下你自己...',
      '你对这个问题有什么看法？',
      '能否详细解释一下你的思路？',
      '这是一个很好的观点...',
      '还有其他的想法吗？',
    ]

    let subtitleIndex = 0

    simulationRef.current = setInterval(() => {
      // 随机模拟AI说话
      const isSpeaking = Math.random() > 0.6
      setAiSpeaking(isSpeaking)

      if (isSpeaking) {
        setSubtitle(subtitles[subtitleIndex % subtitles.length])
        subtitleIndex++
      } else {
        // 候选人在说话时显示音量
        setCandidateVolume(Math.floor(Math.random() * 60) + 20)
      }
    }, 3000)

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [phase, setAiSpeaking, setSubtitle, setCandidateVolume])

  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* 顶部导航栏 */}
      <TopNavBar className="shrink-0" />

      {/* 主内容区：55/45 分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：55% - 视频 + 题目 + 代码编辑器 */}
        <div className="w-[55%] flex flex-col gap-3 p-4 overflow-y-auto">
          {/* 视频区 */}
          <VideoPanel className="shrink-0" />

          {/* 题目区 */}
          <QuestionPanel className="shrink-0" />

          {/* 代码编辑器（技术岗显示） */}
          <CodeEditor className="flex-1 min-h-0" />
        </div>

        {/* 右侧：45% - 评分面板 */}
        <div className="w-[45%] p-4 overflow-y-auto border-l border-gray-100">
          <ScorePanel />
        </div>
      </div>

      {/* 底部操作栏 */}
      <BottomActionBar className="shrink-0" />
    </div>
  )
}
