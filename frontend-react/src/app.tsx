import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AiAssistant } from '@/components/ai-assistant'
import { AdminPageShell } from '@/components/admin-page-shell'
import { CandidatePageShell } from '@/components/candidate-page-shell'
import { PageTransition } from '@/components/page-transition'
import { profile } from '@/lib/session'
import { AdminCandidates } from '@/pages/admin-candidates'
import { AdminInterviewReview } from '@/pages/admin-interview-review'
import { AdminInterviews } from '@/pages/admin-interviews'
import { AdminQuestionBanks } from '@/pages/admin-question-banks'
import { AdminQuestions } from '@/pages/admin-questions'
import { AdminReports } from '@/pages/admin-reports'
import { AdminWorkspace } from '@/pages/admin-workspace'
import { AbilityDashboard } from '@/pages/ability-dashboard'
import { CandidateLibrary } from '@/pages/candidate-library'
import { CandidateLobby } from '@/pages/candidate-lobby'
import { CandidateProfile } from '@/pages/candidate-profile'
import { CandidateReport } from '@/pages/candidate-report'
import { InterviewRoom } from '@/pages/interview-room'
import { LoginPage } from '@/pages/login'

function Protected({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const current = profile()
  if (!current) return <Navigate to="/login" replace />
  if (admin && !current.roles.includes('ADMIN')) return <Navigate to="/candidate/interviews" replace />
  return <>{children}{!admin && !current.roles.includes('ADMIN') && <AiAssistant />}</>
}

function Overview() {
  const stats = [['本周练习', '06', '+2 场'], ['平均能力分', '82', '+4.6'], ['待完成面试', '03', '今日'], ['AI 反馈', '18', '已生成']]
  return <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold text-emerald-600">AI INTERVIEW WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">让每一次面试，都成为进步。</h1>
      <p className="mt-2 text-muted-foreground">查看训练进度、开始模拟面试，并追踪你的能力变化。</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, hint], index) => <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}>
        <Card><p className="text-sm text-muted-foreground">{label}</p><div className="mt-4 flex items-end justify-between"><strong className="text-3xl tracking-tight">{value}</strong><Badge tone="success">{hint}</Badge></div></Card>
      </motion.div>)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card>
        <div className="flex items-center justify-between"><div><h2 className="font-bold">继续你的训练</h2><p className="mt-1 text-sm text-muted-foreground">Java 核心能力模拟面试 · 45 分钟</p></div><Badge tone="warning">待开始</Badge></div>
        <div className="mt-7 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white"><Bot className="h-7 w-7" /><h3 className="mt-5 text-xl font-bold">AI 面试官已经就绪</h3><p className="mt-2 text-sm text-emerald-50">开启语音或文字对话，获得逐题反馈与完整能力报告。</p><Button className="mt-5 bg-white text-emerald-800 hover:bg-emerald-50">开始模拟面试 <Sparkles className="h-4 w-4" /></Button></div>
      </Card>
      <Card>
        <h2 className="font-bold">能力趋势</h2><p className="mt-1 text-sm text-muted-foreground">过去 6 次面试的综合表现</p>
        <div className="mt-8 flex h-40 items-end gap-3">{[58, 65, 61, 72, 76, 82].map((value, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-300" style={{ height: value + '%' }} /><span className="text-xs text-muted-foreground">{index + 1}</span></div>)}</div>
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
  return <Routes>
    <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
    <Route path="/admin/workspace" element={<Protected admin><AdminPageShell><AdminWorkspace /></AdminPageShell></Protected>} />
    <Route path="/admin/interviews" element={<Protected admin><AdminPageShell><AdminInterviews /></AdminPageShell></Protected>} />
    <Route path="/admin/interviews/:id/review" element={<Protected admin><AdminPageShell><AdminInterviewReview /></AdminPageShell></Protected>} />
    <Route path="/admin/interviews/:id/room" element={<Protected admin><AdminPageShell><AdminInterviewReview /></AdminPageShell></Protected>} />
    <Route path="/admin/reports" element={<Protected admin><AdminPageShell><AdminReports /></AdminPageShell></Protected>} />
    <Route path="/admin/question-banks" element={<Protected admin><AdminPageShell><AdminQuestionBanks /></AdminPageShell></Protected>} />
    <Route path="/admin/question-banks/:id" element={<Protected admin><AdminPageShell><AdminQuestions /></AdminPageShell></Protected>} />
    <Route path="/admin/candidates" element={<Protected admin><AdminPageShell><AdminCandidates /></AdminPageShell></Protected>} />
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
}
