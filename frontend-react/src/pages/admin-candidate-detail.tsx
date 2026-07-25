import { ArrowLeft, BarChart3, CalendarDays, FileText, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { request } from '@/lib/api'
import { interviewStatusText, interviewStatusTone } from '@/lib/interview-status'

type User = { id: string; username: string; realName: string; email?: string; phone?: string; status: number; createdAt?: string }
type InterviewRow = { id: string; title: string; candidateId: string; scheduledAt: string; duration: number; status: number }
type ReportItem = { reportId: string; interviewId: string; interviewTitle: string; candidateName: string; scheduledAt: string; totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number; status: number }
type Page<T> = { records: T[]; total: number }
const dateText = (value?: string) => value?.replace('T', ' ').slice(0, 16) || '-'

export function AdminCandidateDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User>()
  const [interviews, setInterviews] = useState<InterviewRow[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [error, setError] = useState('')
  useEffect(() => { void Promise.all([request<Page<User>>('/v1/users?pageNo=1&pageSize=300'), request<InterviewRow[]>('/v1/interviews'), request<Page<ReportItem>>('/v1/reports/page?pageNo=1&pageSize=300')]).then(([users, allInterviews, allReports]) => { setUser(users.records.find(item => String(item.id) === id)); setInterviews(allInterviews.filter(item => String(item.candidateId) === id)); setReports(allReports.records.filter(item => allInterviews.some(interview => String(interview.candidateId) === id && String(interview.id) === String(item.interviewId)))) }).catch(reason => setError(reason instanceof Error ? reason.message : '无法加载候选人详情')) }, [id])
  const latest = reports[0]
  const points = useMemo(() => reports.slice().reverse().map((item, index) => ({ x: 40 + index * (reports.length > 1 ? 520 / (reports.length - 1) : 0), y: 170 - item.totalScore * 1.35, score: item.totalScore })), [reports])
  if (error) return <Card>{error}</Card>
  if (!user) return <Card>正在加载候选人详情…</Card>
  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <button onClick={() => navigate('/admin/candidates')} className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回候选人</button>
    <section className="soft-emphasis-panel overflow-hidden rounded-[30px] p-8"><p className="text-sm font-semibold text-white/55">CANDIDATE PROFILE</p><h1 className="mt-2 text-4xl font-bold">{user.realName}</h1><p className="mt-2 text-white/60">@{user.username} · {user.email || '未填写邮箱'} · {user.phone || '未填写手机号'}</p><div className="mt-5"><Badge tone={user.status === 1 ? 'success' : 'warning'}>{user.status === 1 ? '正常' : '停用'}</Badge></div></section>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card><UserRound className="h-5 w-5 text-[var(--accent)]" /><p className="mt-4 text-sm text-muted-foreground">历史面试</p><strong className="mt-1 block text-3xl">{interviews.length}</strong></Card><Card><FileText className="h-5 w-5 text-[var(--accent)]" /><p className="mt-4 text-sm text-muted-foreground">已生成报告</p><strong className="mt-1 block text-3xl">{reports.length}</strong></Card><Card><BarChart3 className="h-5 w-5 text-[var(--accent)]" /><p className="mt-4 text-sm text-muted-foreground">最新综合分</p><strong className="mt-1 block text-3xl">{latest?.totalScore ?? '-'}</strong></Card><Card><CalendarDays className="h-5 w-5 text-[var(--accent)]" /><p className="mt-4 text-sm text-muted-foreground">最近面试</p><strong className="mt-1 block text-lg">{dateText(latest?.scheduledAt)}</strong></Card></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><Card><h2 className="font-bold">能力趋势</h2><svg viewBox="0 0 600 190" className="mt-5 h-56 w-full"><polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />{points.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" /><text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-foreground text-[12px] font-bold">{point.score}</text></g>)}</svg></Card><Card className="p-0"><div className="border-b border-border p-5"><h2 className="font-bold">报告列表</h2></div><div className="divide-y divide-border">{reports.map(item => <button key={item.reportId} onClick={() => navigate(`/admin/reports?interviewId=${item.interviewId}`)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50"><div><strong>{item.interviewTitle}</strong><p className="mt-1 text-xs text-muted-foreground">{dateText(item.scheduledAt)}</p></div><strong className="text-[var(--accent)]">{item.totalScore}</strong></button>)}{!reports.length && <p className="p-10 text-center text-sm text-muted-foreground">暂无评测报告</p>}</div></Card></div>
    <Card className="mt-6 p-0"><div className="border-b border-border p-5"><h2 className="font-bold">历史面试</h2></div><div className="divide-y divide-border">{interviews.map(item => <button key={item.id} onClick={() => navigate(`/admin/interviews/${item.id}/review`)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50"><div><strong>{item.title}</strong><p className="mt-1 text-xs text-muted-foreground">{dateText(item.scheduledAt)} · {item.duration} 分钟</p></div><Badge tone={interviewStatusTone(item.status)}>{interviewStatusText[item.status] ?? '未知状态'}</Badge></button>)}</div></Card>
  </div>
}
