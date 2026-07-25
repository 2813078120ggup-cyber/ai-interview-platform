import { BookOpen, Bot, CalendarDays, History, LayoutDashboard, LogOut, Moon, Settings2, Sun, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NotificationCenter } from '@/components/notification-center'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { clearSession, profile } from '@/lib/session'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const nav = [
  ['/admin/workspace', '工作台', LayoutDashboard],
  ['/admin/interviews', '面试管理', CalendarDays],
  ['/admin/candidates', '候选人', UserRound],
  ['/admin/question-banks', '题库管理', BookOpen],
  ['/admin/settings', '系统设置', Settings2],
  ['/admin/audit-logs', '操作日志', History],
] as const

export function AdminPageShell({ children }: { children: ReactNode }) {
  const { dark, toggleTheme } = useTheme()
  const current = profile()
  const navigate = useNavigate()
  const initials = current?.realName?.trim().slice(0, 1) || '管'
  function logout() { clearSession(); navigate('/login', { replace: true }) }

  return <div className="min-h-screen bg-background">
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface/92 p-5 backdrop-blur">
      <NavLink to="/admin/workspace" className="flex items-center gap-3 px-1 py-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-pink))] text-white shadow-[0_12px_30px_rgba(109,93,252,.24)]"><Bot className="h-5 w-5" /></span>
        <div><strong className="text-lg">InterviewOS</strong><p className="text-xs text-muted-foreground">AI 面试管理平台</p></div>
      </NavLink>

      <div className="my-7 rounded-[22px] border border-border bg-[var(--accent-soft)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />控制中心正常</div>
        <p className="mt-1 text-xs text-muted-foreground">面试、题库与候选人流程运行中</p>
      </div>

      <nav className="space-y-1.5">
        {nav.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition duration-200', isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_14px_30px_rgba(20,18,17,.16)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <Icon className="h-4 w-4" />{label}
        </NavLink>)}
      </nav>

      <div className="mt-auto border-t border-border px-2 pt-4 text-xs text-muted-foreground">管理员端 · v2.4.1</div>
    </aside>

    <main className="min-h-screen pl-72">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-end border-b border-border bg-background/82 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-10 w-10 rounded-full px-0" onClick={toggleTheme} aria-label={dark ? '切换为浅色模式' : '切换为深色模式'}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
          <NotificationCenter role="admin" />
          <Button variant="ghost" className="h-10 w-10 rounded-full px-0" onClick={logout} aria-label="退出登录" title="退出登录"><LogOut className="h-4 w-4" /></Button>
          <span title={current?.realName || '管理员'} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--warning)] text-sm font-bold text-[var(--warning-foreground)]">{initials}</span>
        </div>
      </header>
      <PageTransition>
        <div className="[&>div>aside]:hidden [&>div>main]:!min-h-0 [&>div>main]:!pl-0 [&>div>main>header]:hidden">{children}</div>
      </PageTransition>
    </main>
  </div>
}
