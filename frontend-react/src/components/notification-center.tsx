import { Bell, CheckCheck, Inbox, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationEvent,
  type InterviewNotification,
} from '@/lib/notifications'
import { profile } from '@/lib/session'
import { cn } from '@/lib/utils'

type NotificationCenterProps = {
  role: 'admin' | 'candidate'
}

function shortDate(value?: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

export function NotificationCenter({ role }: NotificationCenterProps) {
  const current = profile()
  const currentUserId = String(current?.id || current?.username || 'guest')
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<InterviewNotification[]>([])

  const refresh = () => setItems(listNotifications())

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener(notificationEvent, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(notificationEvent, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const visibleItems = useMemo(() => {
    if (role === 'admin') return items
    const username = current?.username || ''
    const id = String(current?.id || '')
    return items.filter(item => item.candidate.userId === id || item.candidate.username === username)
  }, [current?.id, current?.username, items, role])

  const unreadCount = visibleItems.filter(item => !item.readBy.includes(currentUserId)).length

  const markRead = (item: InterviewNotification) => {
    markNotificationRead(item.id, currentUserId)
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        className="relative h-10 w-10 rounded-full px-0"
        aria-label="通知"
        onClick={() => setOpen(value => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b77a54] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[28px] border border-border bg-surface/95 text-foreground shadow-[0_24px_70px_rgba(42,31,20,0.18)] backdrop-blur-xl dark:shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                {role === 'admin' ? 'SENT NOTICES' : 'NOTIFICATION CENTER'}
              </p>
              <h3 className="mt-1 text-xl font-black text-foreground">通知中心</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === 'admin' ? '查看最近发送给候选人的面试通知。' : '查看管理员发来的面试安排和练习提醒。'}
              </p>
            </div>
            {visibleItems.length > 0 && unreadCount > 0 && (
              <Button
                variant="secondary"
                className="h-8 shrink-0 whitespace-nowrap rounded-full px-2.5 text-[11px] leading-none"
                onClick={() => markAllNotificationsRead(currentUserId)}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                全部已读
              </Button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto p-3">
            {visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted text-[var(--accent)]">
                  <Inbox className="h-6 w-6" />
                </span>
                <p className="mt-4 text-base font-black text-foreground">暂无通知</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role === 'admin' ? '可以在面试管理列表里按具体面试发送通知。' : '新的面试通知会出现在这里。'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleItems.map(item => {
                  const unread = !item.readBy.includes(currentUserId)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        'w-full rounded-[22px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(42,31,20,0.12)] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.36)]',
                        unread ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/80 dark:bg-[var(--accent)]/10' : 'border-border bg-background/70 hover:bg-muted/60',
                      )}
                      onClick={() => markRead(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-foreground">{item.title}</p>
                          <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.content}</p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[var(--accent)]">
                          <Send className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {role === 'admin' && <span>发送给：{item.candidate.realName || item.candidate.username}</span>}
                        {item.interviewTitle && <span>面试：{item.interviewTitle}</span>}
                        <span>{shortDate(item.createdAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
