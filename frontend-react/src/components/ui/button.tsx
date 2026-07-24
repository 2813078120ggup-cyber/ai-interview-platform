import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
const styles = cva('inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50', { variants: { variant: { primary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700', secondary: 'border border-border bg-surface hover:bg-muted', ghost: 'hover:bg-muted', danger: 'bg-rose-600 text-white hover:bg-rose-700' } }, defaultVariants: { variant: 'primary' } })
export function Button({ className, variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>) { return <button className={cn(styles({ variant }), className)} {...props} /> }
