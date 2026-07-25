import { ArrowLeft, BarChart3, CheckCircle2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request } from '@/lib/api'

type Report = { totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number; summary: string; strengths: string; weaknesses: string; improvementSuggestions: string; status: number }
const dimensions: Array<[keyof Report, string, string]> = [['professionalScore', '专业能力', '核心知识与岗位技能'], ['expressionScore', '表达能力', '表达结构与沟通清晰度'], ['logicScore', '逻辑思维', '分析拆解与推理能力'], ['adaptabilityScore', '应变能力', '追问场景下的临场反应']]

export function CandidateReport() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report>()
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')
  const scores = useMemo(() => report ? dimensions.map(([key]) => Number(report[key])) : [], [report])
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0

  async function load(silent = false) {
    if (!silent) setLoading(true)
    try { setReport(await request<Report>(`/v1/interviews/${id}/report`)); setRetrying(false); setError('') }
    catch (reason) { setRetrying(true); setError(reason instanceof Error ? reason.message : '评分报告尚未生成') }
    finally { if (!silent) setLoading(false) }
  }
  useEffect(() => { void load() }, [id])
  useEffect(() => { if (!retrying || report) return; const timer = window.setTimeout(() => void load(true), 5000); return () => window.clearTimeout(timer) }, [retrying, report])

  if (loading) return <Card>正在获取 AI 评测报告…</Card>
  if (!report) return <div className="mx-auto max-w-2xl py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Sparkles /></span><h1 className="mt-5 text-2xl font-bold">AI 正在生成你的评测报告</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">系统正在逐题评估你的作答，并整理优势、短板和下一步建议。页面会自动刷新。</p>{error && <p className="mt-4 text-sm text-amber-700">{error}</p>}<div className="mt-6 flex justify-center gap-3"><Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回大厅</Button><Button onClick={() => void load()}><RefreshCw className="h-4 w-4" />立即刷新</Button></div></div>
  return <div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><button className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/candidate/interviews')}><ArrowLeft className="h-4 w-4" />返回面试大厅</button><p className="text-sm font-semibold text-[var(--accent)]">INTERVIEW INTELLIGENCE</p><h1 className="mt-1 text-3xl font-bold">你的面试评测报告</h1></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate('/candidate/reports')}><BarChart3 className="h-4 w-4" />能力趋势</Button><Button variant="secondary" onClick={() => window.print()}>导出 / 打印</Button></div></header><section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_85%_10%,var(--brand-pink)_0,transparent_28%),linear-gradient(135deg,var(--primary),var(--accent))] px-6 py-7 text-white shadow-xl shadow-black/10 sm:px-9"><div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center"><div><Badge tone="success">报告已生成</Badge><h2 className="mt-5 text-2xl font-bold">综合评测：表现达到岗位基础要求</h2><p className="mt-3 max-w-2xl leading-7 text-white/85">{report.summary}</p></div><div className="grid h-40 w-40 place-items-center rounded-full border-8 border-[var(--border)]/40 bg-white/10 text-center shadow-[0_0_0_12px_rgba(255,255,255,.05)]"><div><strong className="text-5xl tracking-tight">{report.totalScore}</strong><span className="mt-1 block text-xs text-white/75">综合得分 / 100</span></div></div></div></section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dimensions.map(([key, label, note]) => <Card key={key}><p className="text-sm text-muted-foreground">{label}</p><div className="mt-3 flex items-end justify-between"><strong className="text-3xl">{report[key]}</strong><span className="text-xs text-muted-foreground">/ 100</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--brand-pink)]" style={{ width: `${report[key]}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{note}</p></Card>)}</div><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><Card><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">ABILITY PROFILE</p><h2 className="mt-1 text-xl font-bold">能力分布</h2></div><span className="text-sm text-muted-foreground">平均 {average}</span></div><div className="mt-8 space-y-5">{dimensions.map(([key, label]) => <div key={key}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{report[key]}</strong></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--brand-pink)]" style={{ width: `${report[key]}%` }} /></div></div>)}</div></Card><Card><p className="text-sm font-semibold text-[var(--accent)]">AI TAKEAWAYS</p><h2 className="mt-1 text-xl font-bold">下一次，做得更好</h2><div className="mt-6 space-y-4"><article className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)]/70 p-4"><h3 className="flex items-center gap-2 font-semibold text-[var(--accent)]"><CheckCircle2 className="h-4 w-4" />你的优势</h3><p className="mt-2 text-sm leading-6 text-[var(--foreground)]/80">{report.strengths}</p></article><article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4"><h3 className="font-semibold text-amber-800">可提升项</h3><p className="mt-2 text-sm leading-6 text-amber-950/80">{report.weaknesses}</p></article><article className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)]/70 p-4"><h3 className="flex items-center gap-2 font-semibold text-[var(--accent)]"><TrendingUp className="h-4 w-4" />行动建议</h3><p className="mt-2 text-sm leading-6 text-[var(--foreground)]/80">{report.improvementSuggestions}</p></article></div></Card></div></div>
}
