import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <section className={cn('rounded-[20px] border border-border bg-surface p-5 shadow-[0_1px_2px_rgb(16_34_30/0.04)]', className)} {...props} /> }
