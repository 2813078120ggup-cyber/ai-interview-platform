import { BarChart3, Bell, BookOpen, Bot, CalendarDays, LayoutDashboard, LogOut, Moon, Search, Sun, UserRound } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { clearSession, profile } from '@/lib/session'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const nav = [
  ['/admin/workspace', '工作台', LayoutDashboard],
  ['/admin/interviews', '面试管理', CalendarDays],
  ['/admin/reports', '评测报告', BarChart3],
  ['/admin/candidates', '候选人', UserRound],
  ['/admin/question-banks', '题库管理', BookOpen],
] as const

export function AdminPageShell({ children }: { children: ReactNode }) {
  const { dark, toggleTheme } = useTheme()
  const current = profile()
  const navigate = useNavigate()
  const initials = current?.realName?.trim().slice(0, 1) || '管'

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  function handleLegacyNavigation(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor || anchor.getAttribute('href')) return
    const text = anchor.textContent ?? ''
    const route = text.includes('工作台')
      ? '/admin/workspace'
      : text.includes('评测报告')
        ? '/admin/reports'
        : text.includes('候选人')
          ? '/admin/candidates'
          : undefined
    if (!route) return
    event.preventDefault()
    navigate(route)
  }

  return <div className="min-h-screen bg-background">
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface p-4">
      <NavLink to="/admin/workspace" className="flex items-center gap-3 px-2 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white"><Bot className="h-5 w-5" /></span>
        <div><strong>InterviewOS</strong><p className="text-xs text-muted-foreground">AI 面试管理平台</p></div>
      </NavLink>
      <div className="my-6 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-500" />控制中心正常</div>
        <p className="mt-1 text-xs text-muted-foreground">AI 服务与评测任务运行中</p>
      </div>
      <nav className="space-y-1">
        {nav.map(([to, label, Icon]) => <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
            isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />{label}
        </NavLink>)}
      </nav>
      <div className="mt-auto border-t border-border px-2 pt-4 text-xs text-muted-foreground">管理员端 · v2.1.0</div>
    </aside>
    <main className="min-h-screen pl-64">
      <header className="flex h-20 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="搜索候选人、面试或评测报告" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="w-10 px-0" onClick={toggleTheme} aria-label={dark ? '切换为浅色模式' : '切换为深色模式'}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" className="w-10 px-0" aria-label="通知"><Bell className="h-4 w-4" /></Button>
          <Button variant="ghost" className="w-10 px-0" onClick={logout} aria-label="退出登录" title="退出登录"><LogOut className="h-4 w-4" /></Button>
          <span title={current?.realName || '管理员'} className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">{initials}</span>
        </div>
      </header>
      <PageTransition>
        <div onClickCapture={handleLegacyNavigation} className="[&>div>aside]:hidden [&>div>main]:!min-h-0 [&>div>main]:!pl-0 [&>div>main>header]:hidden">
          {children}
        </div>
      </PageTransition>
    </main>
  </div>
}
