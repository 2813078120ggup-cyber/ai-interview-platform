import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <section className={cn('rounded-[22px] border border-border/90 bg-surface p-5 shadow-[0_1px_2px_rgba(23,34,31,.04),0_12px_34px_rgba(23,34,31,.035)]', className)} {...props} /> }
