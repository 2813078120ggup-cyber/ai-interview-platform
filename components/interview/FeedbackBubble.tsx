'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Feedback } from '@/lib/types'

interface FeedbackBubbleProps {
  feedback: Feedback
  className?: string
}

const typeStyles = {
  positive: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-100',
    dot: 'bg-green-500',
  },
  suggestion: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100',
    dot: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-100',
    dot: 'bg-yellow-500',
  },
}

export function FeedbackBubble({ feedback, className }: FeedbackBubbleProps) {
  const style = typeStyles[feedback.type]

  return (
    <motion.div
      className={cn(
        'flex items-start gap-2 px-3 py-2 rounded-sm border text-xs',
        style.bg,
        style.text,
        style.border,
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={cn('w-2 h-2 rounded-full mt-0.5 shrink-0', style.dot)} />
      <span className="leading-relaxed">{feedback.message}</span>
    </motion.div>
  )
}
