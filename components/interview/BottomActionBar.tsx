'use client'

import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ArrowRight,
  ArrowLeft,
  Send,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BottomActionBarProps {
  className?: string
}

export function BottomActionBar({ className }: BottomActionBarProps) {
  const isMuted = useInterviewStore((s) => s.isMuted)
  const isCameraOff = useInterviewStore((s) => s.isCameraOff)
  const phase = useInterviewStore((s) => s.phase)
  const currentQuestionIndex = useInterviewStore((s) => s.currentQuestionIndex)
  const questions = useInterviewStore((s) => s.questions)
  const showFeedback = useInterviewStore((s) => s.showFeedback)

  const toggleMute = useInterviewStore((s) => s.toggleMute)
  const toggleCamera = useInterviewStore((s) => s.toggleCamera)
  const nextQuestion = useInterviewStore((s) => s.nextQuestion)
  const prevQuestion = useInterviewStore((s) => s.prevQuestion)
  const submitAnswer = useInterviewStore((s) => s.submitAnswer)
  const endInterview = useInterviewStore((s) => s.endInterview)
  const startInterview = useInterviewStore((s) => s.startInterview)

  const isFirst = currentQuestionIndex === 0
  const isLast = currentQuestionIndex === questions.length - 1

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center justify-between px-6 py-3 bg-white border-t border-gray-100 shadow-sm',
          className
        )}
      >
        {/* 左侧：音视频控制 */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? 'destructive' : 'ghost'}
                size="icon"
                onClick={toggleMute}
                className={cn(
                  'w-10 h-10 rounded-full transition-all',
                  isMuted && 'animate-pulse'
                )}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? '取消静音' : '静音'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCameraOff ? 'destructive' : 'ghost'}
                size="icon"
                onClick={toggleCamera}
                className={cn(
                  'w-10 h-10 rounded-full transition-all',
                  isCameraOff && 'animate-pulse'
                )}
              >
                {isCameraOff ? (
                  <VideoOff className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCameraOff ? '开启摄像头' : '关闭摄像头'}
            </TooltipContent>
          </Tooltip>

          {/* 状态标签 */}
          {isMuted && (
            <span className="text-xs text-red-500 font-medium animate-pulse ml-1">
              已静音
            </span>
          )}
          {isCameraOff && (
            <span className="text-xs text-red-500 font-medium animate-pulse ml-1">
              摄像头已关闭
            </span>
          )}
        </div>

        {/* 中间：题目导航 & 提交 */}
        <div className="flex items-center gap-2">
          {phase === 'waiting' ? (
            <Button
              onClick={startInterview}
              className="gap-2 px-6"
              size="lg"
            >
              开始面试
            </Button>
          ) : phase === 'in-progress' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuestion}
                disabled={isFirst}
                className="gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                上一题
              </Button>

              {!showFeedback ? (
                <Button
                  size="sm"
                  onClick={submitAnswer}
                  className="gap-1"
                >
                  <Send className="w-4 h-4" />
                  提交答案
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={nextQuestion}
                  disabled={isLast}
                  className="gap-1"
                >
                  下一题
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : phase === 'feedback' ? (
            <Button
              size="sm"
              onClick={nextQuestion}
              disabled={isLast}
              className="gap-1"
            >
              下一题
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : null}
        </div>

        {/* 右侧：结束面试 */}
        <div className="flex items-center gap-2">
          {phase === 'in-progress' || phase === 'feedback' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={endInterview}
              className="gap-1"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">结束面试</span>
            </Button>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )
}
