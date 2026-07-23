'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import { Mic, MicOff, Video, VideoOff, Volume2, User, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface VideoPanelProps {
  className?: string
}

export function VideoPanel({ className }: VideoPanelProps) {
  const isMuted = useInterviewStore((s) => s.isMuted)
  const isCameraOff = useInterviewStore((s) => s.isCameraOff)
  const subtitleText = useInterviewStore((s) => s.subtitleText)
  const isAiSpeaking = useInterviewStore((s) => s.isAiSpeaking)
  const candidateVolume = useInterviewStore((s) => s.candidateVolume)
  const phase = useInterviewStore((s) => s.phase)

  const [dots, setDots] = useState('')

  // 模拟AI说话时的动画点
  useEffect(() => {
    if (!isAiSpeaking) {
      setDots('')
      return
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [isAiSpeaking])

  return (
    <div className={cn('relative rounded-md overflow-hidden bg-gray-900', className)}>
      {/* AI面试官画面 (大) */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        {/* 模拟AI面试官头像 */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 transition-all',
              isAiSpeaking
                ? 'border-primary shadow-lg shadow-primary/30 scale-105'
                : 'border-primary/40'
            )}
          >
            <Bot className={cn(
              'w-10 h-10 transition-colors',
              isAiSpeaking ? 'text-primary' : 'text-primary/60'
            )} />
          </div>
          <span className="text-white/80 text-sm font-medium">
            AI面试官{isAiSpeaking ? dots : ''}
          </span>
        </div>

        {/* AI面试官标签 */}
        <Badge className="absolute top-3 left-3 bg-white/20 text-white border-0 backdrop-blur-sm">
          AI面试官
        </Badge>

        {/* AI正在说话的指示器 */}
        {isAiSpeaking && (
          <motion.div
            className="absolute bottom-3 left-3 right-3 flex gap-1 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[1, 2, 3, 4, 5].map((bar) => (
              <motion.div
                key={bar}
                className="w-1 bg-primary rounded-full"
                animate={{ height: [4, 12 + bar * 3, 4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* 候选人画面 (小 - 画中画) */}
      <div className="absolute bottom-4 right-4 w-[35%] aspect-[4/3] rounded-sm overflow-hidden border-2 border-white/20 shadow-xl bg-gray-700">
        {/* 摄像头关闭时的占位 */}
        {isCameraOff ? (
          <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-2">
            <VideoOff className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400 text-xs">摄像头已关闭</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* 候选人标签 */}
        <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0 text-xs backdrop-blur-sm">
          候选人
        </Badge>

        {/* 静音状态指示 */}
        {isMuted && (
          <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 animate-pulse">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 字幕区域 */}
      <AnimatePresence>
        {subtitleText && (
          <motion.div
            className="absolute bottom-4 left-4 right-[38%] bg-black/60 backdrop-blur-sm rounded-sm px-3 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p className="text-white text-xs leading-relaxed">
              {subtitleText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 音量指示器 */}
      {!isMuted && candidateVolume > 0 && (
        <div className="absolute left-4 bottom-[30%] flex items-end gap-[2px] h-8">
          {[1, 2, 3, 4, 5].map((bar) => (
            <motion.div
              key={bar}
              className="w-[3px] bg-green-400 rounded-full"
              animate={{
                height: candidateVolume > bar * 15 ? 8 + bar * 6 : 2,
                opacity: candidateVolume > bar * 15 ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
