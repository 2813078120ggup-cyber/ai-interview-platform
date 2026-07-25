import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AiAssistant } from '@/components/ai-assistant'
import { AdminPageShell } from '@/components/admin-page-shell'
import { CandidatePageShell } from '@/components/candidate-page-shell'
import { GlobalMouseFollower } from '@/components/global-mouse-follower'
import { PageTransition } from '@/components/page-transition'
import { type Interview, type PracticeBank, request } from '@/lib/api'
import { isPracticeInterview } from '@/lib/interviewer-styles'
import { profile } from '@/lib/session'
import { AdminAuditLog } from '@/pages/admin-audit-log'
import { AdminCandidateDetail } from '@/pages/admin-candidate-detail'
import { AdminCandidates } from '@/pages/admin-candidates'
import { AdminInterviewReview } from '@/pages/admin-interview-review'
import { AdminInterviews } from '@/pages/admin-interviews'
import { AdminQuestionBanks } from '@/pages/admin-question-banks'
import { AdminQuestions } from '@/pages/admin-questions'
import { AdminSettings } from '@/pages/admin-settings'
import { AdminWorkspace } from '@/pages/admin-workspace'
import { AbilityDashboard } from '@/pages/ability-dashboard'
import { CandidateLibrary } from '@/pages/candidate-library'
import { CandidateLobby } from '@/pages/candidate-lobby'
import { CandidateProfile } from '@/pages/candidate-profile'
import { CandidateReport } from '@/pages/candidate-report'
import { InterviewRoom } from '@/pages/interview-room'
import { LoginPage } from '@/pages/login'

type Trend = {
  interviewId: string
  interviewTitle: string
  scheduledAt: string
  totalScore: number
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
}
type Summary = { reportCount: number; latest?: Trend; trends: Trend[] }

function Protected({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const current = profile()
  if (!current) return <Navigate to="/login" replace />
  if (admin && !current.roles.includes('ADMIN')) return <Navigate to="/candidate/interviews" replace />
  return <>{children}{!admin && !current.roles.includes('ADMIN') && <AiAssistant />}</>
}

function OverviewTrendChart({ trends }: { trends: Trend[] }) {
  const points = useMemo(() => {
    const width = 560
    const height = 190
    const paddingX = 34
    const paddingY = 30
    const list = trends.slice(-6)
    if (!list.length) return { width, height, list, line: '', area: '', points: [] as Array<Trend & { x: number; y: number }> }
    const scores = list.map(item => Number(item.totalScore))
    const min = Math.max(0, Math.min(...scores) - 8)
    const max = Math.min(100, Math.max(...scores) + 8)
    const range = Math.max(1, max - min)
    const step = list.length > 1 ? (width - paddingX * 2) / (list.length - 1) : 0
    const chartPoints = list.map((item, index) => ({
      ...item,
      x: list.length === 1 ? width / 2 : paddingX + step * index,
      y: height - paddingY - ((Number(item.totalScore) - min) / range) * (height - paddingY * 2),
    }))
    const line = chartPoints.map(point => `${point.x},${point.y}`).join(' ')
    const area = `M ${chartPoints[0].x} ${height - paddingY} L ${chartPoints.map(point => `${point.x} ${point.y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x} ${height - paddingY} Z`
    return { width, height, list, line, area, points: chartPoints }
  }, [trends])

  if (!points.list.length) {
    return <div className="mt-8 grid h-52 place-items-center rounded-[22px] border border-dashed border-border bg-background/60 text-center">
      <div>
        <p className="font-semibold">暂无能力趋势</p>
        <p className="mt-2 text-sm text-muted-foreground">完成一场面试并生成报告后，这里会展示综合能力变化。</p>
      </div>
    </div>
  }

  return <div className="mt-6">
    <svg viewBox={`0 0 ${points.width} ${points.height}`} className="h-56 w-full overflow-visible" role="img" aria-label="最近六次面试综合能力趋势">
      <defs>
        <linearGradient id="workspaceTrendArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map(index => {
        const y = 42 + index * 48
        return <line key={index} x1="28" x2={points.width - 28} y1={y} y2={y} stroke="currentColor" strokeOpacity=".08" strokeDasharray="4 7" />
      })}
      <path d={points.area} fill="url(#workspaceTrendArea)" />
      <polyline points={points.line} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.points.map((point, index) => <g key={point.interviewId}>
        <circle cx={point.x} cy={point.y} r="7" fill="var(--surface)" stroke="var(--accent)" strokeWidth="4" />
        <text x={point.x} y={point.y - 15} textAnchor="middle" className="fill-foreground text-[12px] font-bold">{point.totalScore}</text>
        <text x={point.x} y={points.height - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">{index + 1}</text>
      </g>)}
    </svg>
  </div>
}

function Overview() {
  const nav = useNavigate()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [banks, setBanks] = useState<PracticeBank[]>([])
  const [summary, setSummary] = useState<Summary>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      request<Interview[]>('/v1/interviews'),
      request<PracticeBank[]>('/v1/interviews/practice/banks'),
      request<Summary>('/v1/reports/my/summary'),
    ]).then(([interviewList, bankList, abilitySummary]) => {
      setInterviews(interviewList)
      setBanks(bankList)
      setSummary(abilitySummary)
    }).catch(reason => setError(reason instanceof Error ? reason.message : '无法加载工作概览'))
  }, [])

  const pendingCount = interviews.filter(item => item.status === 0).length
  const practiceCount = interviews.filter(item => isPracticeInterview(item.remark)).length
  const averageScore = summary?.latest?.totalScore ?? 0
  const feedbackCount = summary?.reportCount ?? 0
  const activePractice = interviews.find(item => isPracticeInterview(item.remark) && item.status === 1)
  const pendingPractice = interviews.find(item => isPracticeInterview(item.remark) && item.status === 0)
  const resumablePractice = activePractice ?? pendingPractice
  const nextPracticeBank = banks[0]
  const stats = [
    ['本周练习', String(Math.max(practiceCount, 0)).padStart(2, '0'), banks.length ? `${banks.length} 个题库` : '无题库'],
    ['平均能力分', averageScore ? String(Math.round(averageScore)) : '--', summary?.reportCount ? `${summary.reportCount} 份报告` : '待生成'],
    ['待完成面试', String(pendingCount).padStart(2, '0'), '今日'],
    ['AI 反馈', String(feedbackCount).padStart(2, '0'), '已生成'],
  ]

  async function startPractice() {
    if (resumablePractice) {
      try {
        if (resumablePractice.status === 0) await request(`/v1/interviews/${resumablePractice.id}/start`, { method: 'POST' })
        nav(`/candidate/interviews/${resumablePractice.id}/room`)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '无法继续训练')
      }
      return
    }
    if (!nextPracticeBank) {
      nav('/library')
      return
    }
    setBusy(true)
    try {
      const result = await request<Interview>('/v1/interviews/practice', {
        method: 'POST',
        body: JSON.stringify({ questionBankId: nextPracticeBank.id, questionCount: 5, duration: 30, interviewerStyle: 'big-tech' }),
      })
      nav(`/candidate/interviews/${result.id}/room`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '创建模拟面试失败')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold text-[var(--accent)]">AI INTERVIEW WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">让每一次面试，都成为进步。</h1>
      <p className="mt-2 text-muted-foreground">查看训练进度、继续未完成练习，并追踪你的能力变化。</p>
    </div>

    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, hint], index) => <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}>
        <Card><p className="text-sm text-muted-foreground">{label}</p><div className="mt-4 flex items-end justify-between"><strong className="text-3xl tracking-tight">{value}</strong><Badge tone="success">{hint}</Badge></div></Card>
      </motion.div>)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card>
        <div className="flex items-center justify-between">
          <div><h2 className="font-bold">继续你的训练</h2><p className="mt-1 text-sm text-muted-foreground">{resumablePractice ? `${resumablePractice.title} · ${resumablePractice.duration} 分钟` : nextPracticeBank ? `${nextPracticeBank.name} · 30 分钟` : '选择一个题库开始模拟练习'}</p></div>
          <Badge tone={activePractice ? 'success' : 'warning'}>{activePractice ? '进行中' : resumablePractice ? '待开始' : nextPracticeBank ? '待开始' : '待配置'}</Badge>
        </div>
        <div className="soft-emphasis-panel mt-7 rounded-2xl p-6">
          <Bot className="h-7 w-7" />
          <h3 className="mt-5 text-xl font-bold">AI 面试官已经就绪</h3>
          <p className="mt-2 text-sm text-white/80">开启语音或文字对话，获得逐题反馈与完整能力报告。</p>
          <Button className="mt-5" disabled={busy} onClick={() => void startPractice()}>{busy ? '创建中…' : resumablePractice ? '继续训练' : '开始模拟面试'} <Sparkles className="h-4 w-4" /></Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-bold">能力趋势</h2>
        <p className="mt-1 text-sm text-muted-foreground">过去 6 次面试的综合表现</p>
        <OverviewTrendChart trends={summary?.trends ?? []} />
      </Card>
    </div>
  </div>
}

function CandidateWorkspace() {
  return <CandidatePageShell>
    <Routes><Route path="/workspace" element={<Overview />} /><Route path="/candidate/interviews" element={<CandidateLobby />} /><Route path="*" element={<Overview />} /></Routes>
  </CandidatePageShell>
}

function AbilityPage() {
  return <CandidatePageShell><AbilityDashboard /></CandidatePageShell>
}

export function App() {
  return <>
    <GlobalMouseFollower />
    <Routes>
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/admin/workspace" element={<Protected admin><AdminPageShell><AdminWorkspace /></AdminPageShell></Protected>} />
      <Route path="/admin/interviews" element={<Protected admin><AdminPageShell><AdminInterviews /></AdminPageShell></Protected>} />
      <Route path="/admin/interviews/:id/review" element={<Protected admin><AdminPageShell><AdminInterviewReview /></AdminPageShell></Protected>} />
      <Route path="/admin/interviews/:id/room" element={<Protected admin><AdminPageShell><AdminInterviewReview /></AdminPageShell></Protected>} />
      <Route path="/admin/question-banks" element={<Protected admin><AdminPageShell><AdminQuestionBanks /></AdminPageShell></Protected>} />
      <Route path="/admin/question-banks/:id" element={<Protected admin><AdminPageShell><AdminQuestions /></AdminPageShell></Protected>} />
      <Route path="/admin/candidates" element={<Protected admin><AdminPageShell><AdminCandidates /></AdminPageShell></Protected>} />
      <Route path="/admin/candidates/:id" element={<Protected admin><AdminPageShell><AdminCandidateDetail /></AdminPageShell></Protected>} />
      <Route path="/admin/settings" element={<Protected admin><AdminPageShell><AdminSettings /></AdminPageShell></Protected>} />
      <Route path="/admin/audit-logs" element={<Protected admin><AdminPageShell><AdminAuditLog /></AdminPageShell></Protected>} />
      <Route path="/admin" element={<Protected admin><Navigate to="/admin/workspace" replace /></Protected>} />
      <Route path="/candidate/interviews/:id/room" element={<Protected><PageTransition><InterviewRoom /></PageTransition></Protected>} />
      <Route path="/candidate/interviews/:id/report" element={<Protected><PageTransition><CandidateReport /></PageTransition></Protected>} />
      <Route path="/candidate/reports" element={<Protected><Navigate to="/reports" replace /></Protected>} />
      <Route path="/reports" element={<Protected><AbilityPage /></Protected>} />
      <Route path="/library" element={<Protected><CandidateLibrary /></Protected>} />
      <Route path="/users" element={<Protected><CandidateProfile /></Protected>} />
      <Route path="/interviews" element={<Navigate to="/candidate/interviews" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Protected><CandidateWorkspace /></Protected>} />
    </Routes>
  </>
}
