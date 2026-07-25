import { ArrowRight, CalendarDays, ClipboardCheck, FileText, PlayCircle, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { request, type Interview } from '@/lib/api'

const status: Record<number, readonly [string, 'info' | 'success' | 'default' | 'warning']> = { 0: ['待开始', 'info'], 1: ['进行中', 'success'], 2: ['已结束', 'default'], 3: ['已取消', 'warning'], 4: ['已通过', 'success'] }

export function AdminWorkspace() {
  const [items, setItems] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { request<Interview[]>('/v1/interviews').then(setItems).catch(reason => setError(reason instanceof Error ? reason.message : '无法加载工作台数据')).finally(() => setLoading(false)) }, [])
  const metrics = useMemo<Array<[string, number, LucideIcon]>>(() => [
    ['全部面试', items.length, CalendarDays],
    ['待开始', items.filter(item => item.status === 0).length, ClipboardCheck],
    ['进行中', items.filter(item => item.status === 1).length, PlayCircle],
    ['已完成', items.filter(item => item.status === 2 || item.status === 4).length, FileText],
  ], [items])
  const recent = useMemo(() => [...items].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).slice(0, 6), [items])
  return <div className="p-5 lg:p-8">
    <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm font-semibold text-[var(--accent)]">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-bold tracking-tight">让每一场评测，都可追踪。</h1><p className="mt-2 text-muted-foreground">集中查看 AI 面试运行状态、候选人进度与评测产出。</p></div>
      <Link to="/admin/interviews" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_7px_20px_rgba(21,20,18,.16)] transition hover:-translate-y-px hover:bg-[var(--foreground)] dark:bg-[#f7f3ea] dark:text-[#151412] dark:hover:bg-white">管理面试 <ArrowRight className="h-4 w-4" /></Link>
    </section>
    {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon], index) => <Card key={label as string} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms` }}><div className="flex items-start justify-between"><span className="text-sm text-muted-foreground">{label as string}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] dark:bg-[var(--brand)]/10 dark:text-[var(--brand)]"><Icon className="h-4 w-4" /></span></div><strong className="mt-5 block text-3xl tracking-tight">{loading ? '—' : value as number}</strong><p className="mt-2 text-xs text-muted-foreground">实时汇总当前可见面试</p></Card>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card className="p-0"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-bold">最近面试安排</h2><p className="mt-1 text-sm text-muted-foreground">按预约时间倒序展示</p></div><Link className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)]" to="/admin/interviews">全部面试</Link></div><div className="divide-y divide-border">{loading ? <p className="p-10 text-center text-sm text-muted-foreground">正在载入工作台…</p> : recent.length ? recent.map(item => { const [label, tone] = status[item.status] ?? status[3]; return <Link key={item.id} to={`/admin/interviews/${item.id}/review`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40"><div className="min-w-0"><strong className="block truncate">{item.title}</strong><p className="mt-1 text-xs text-muted-foreground">{item.scheduledAt.replace('T', ' ').slice(0, 16)} · {item.duration} 分钟</p></div><Badge tone={tone}>{label}</Badge></Link> }) : <p className="p-10 text-center text-sm text-muted-foreground">暂无面试安排</p>}</div></Card>
      <Card><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] dark:bg-[var(--accent)]/10"><Users className="h-5 w-5" /></span><div><h2 className="font-bold">候选人运营</h2><p className="text-sm text-muted-foreground">账号、状态与面试可用性</p></div></div><p className="mt-7 text-sm leading-6 text-muted-foreground">为候选人创建账号、调整访问状态，并结合评测报告进行后续跟进。</p><Link to="/admin/candidates" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)]">进入候选人管理 <ArrowRight className="h-4 w-4" /></Link><div className="mt-7 rounded-2xl bg-muted/60 p-4"><p className="text-xs font-semibold text-[var(--accent)]">评测闭环</p><p className="mt-2 text-sm text-muted-foreground">面试结束后会自动生成评分与报告，可直接在管理端查看。</p><Link to="/admin/reports" className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)]">查看评测报告 →</Link></div></Card>
    </section>
  </div>
}
