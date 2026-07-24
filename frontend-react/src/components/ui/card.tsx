import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type CardProps = HTMLMotionProps<'section'> & {
  motionDelay?: number
}

export function Card({ className, motionDelay = 0, ...props }: CardProps) {
  const shouldReduceMotion = useReducedMotion()

  return <motion.section
    className={cn('rounded-[22px] border border-border/90 bg-surface p-5 shadow-[0_1px_2px_rgba(23,34,31,.04),0_12px_34px_rgba(23,34,31,.035)]', className)}
    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.28, delay: motionDelay, ease: 'easeOut' }}
    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
    {...props}
  />
}
