import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Layers3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ReportDetailView, type ReportDetailData } from '@/components/report-detail-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { recordAuditLog } from '@/lib/audit-log'
import { request, type Interview } from '@/lib/api'
import { interviewerStyles } from '@/lib/interviewer-styles'
import {
  canViewReport,
  INTERVIEW_STATUS,
  interviewStatusText,
  interviewStatusTone,
  isReportPending,
} from '@/lib/interview-status'
import {
  fillTemplate,
  listTemplates,
  saveTemplate,
  sendNotification,
  type NotificationTemplate,
} from '@/lib/notifications'
import { profile } from '@/lib/session'

type Candidate = { id: string; username: string; realName: string }
type Question = { id: string; content: string; questionType: string; difficulty: number; score: number }
type QuestionBank = { id: string; name: string; bankCode: string; description?: string; status: number }
type Page<T> = { records: T[]; total: number }
type InterviewRow = Interview & { candidateId: string }
type ReportItem = {
  reportId: string
  interviewId: string
  interviewTitle: string
  candidateName: string
  candidateUsername: string
  scheduledAt: string
  totalScore: number
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
  status: number
}
type ReportDetail = ReportDetailData
type Template = { id: string; name: string; title: string; type: string; duration: number; questionCount: number; note: string }
type FormState = { title: string; candidateId: string; scheduledAt: string; duration: number; type: string; source: 'question' | 'bank'; questionIds: string[]; questionBankId: string; questionCount: number; interviewerStyle: string }
type BulkState = { templateId: string; candidateIds: string[]; scheduledAt: string; interval: number; questionBankId: string }

const localInput = () => { const date = new Date(Date.now() + 10 * 60_000); date.setSeconds(0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
const toBackendTime = (value: string) => value.length === 16 ? `${value}:00` : value
const dateText = (value?: string) => value?.replace('T', ' ').slice(0, 16) || '-'
const templates: Template[] = [
  { id: 'java-backend', name: 'Java 后端岗', title: 'Java 后端工程师模拟面试', type: 'tech', duration: 60, questionCount: 8, note: '集合、并发、Spring、数据库与项目表达' },
  { id: 'frontend', name: '前端工程师岗', title: '前端工程师综合能力面试', type: 'tech', duration: 50, questionCount: 8, note: 'Vue/React、浏览器、工程化、性能优化' },
  { id: 'algorithm', name: '算法与编程岗', title: '算法基础与编码思维面试', type: 'algorithm', duration: 45, questionCount: 6, note: '复杂度、数据结构、编码思路与边界条件' },
  { id: 'campus', name: '校园招聘通用', title: '综合素质与项目经历面试', type: 'hr', duration: 40, questionCount: 5, note: '自我介绍、项目复盘、沟通表达与稳定性' },
]
const defaultForm = (): FormState => ({ title: '', candidateId: '', scheduledAt: localInput(), duration: 60, type: 'tech', source: 'question', questionIds: [], questionBankId: '', questionCount: 5, interviewerStyle: 'big-tech' })
const defaultBulk = (): BulkState => ({ templateId: templates[0].id, candidateIds: [], scheduledAt: localInput(), interval: 60, questionBankId: '' })

export function AdminInterviews() {
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<InterviewRow[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [search, setSearch] = useState('')
  const [candidate, setCandidate] = useState('')
  const [status, setStatus] = useState('')
  const [time, setTime] = useState('all')
  const [dialog, setDialog] = useState(false)
  const [bulkDialog, setBulkDialog] = useState(false)
  const [noticeTarget, setNoticeTarget] = useState<InterviewRow>()
  const [actionTarget, setActionTarget] = useState<{ type: 'pass' | 'delete'; interview: InterviewRow }>()
  const [selectedReport, setSelectedReport] = useState<ReportItem>()
  const [reportDetail, setReportDetail] = useState<ReportDetail>()
  const [reportLoading, setReportLoading] = useState(false)
  const [openActions, setOpenActions] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [bulk, setBulk] = useState<BulkState>(defaultBulk)

  const candidateById = useMemo(() => new Map(candidates.map(item => [String(item.id), item])), [candidates])
  const reportByInterviewId = useMemo(() => new Map(reports.map(item => [String(item.interviewId), item])), [reports])
  const targetReportInterviewId = searchParams.get('reportInterviewId')

  async function load() {
    setLoading(true)
    try {
      const [interviews, people, availableQuestions, bankPage, reportPage] = await Promise.all([
        request<InterviewRow[]>('/v1/interviews'),
        request<Candidate[]>('/v1/users/candidates'),
        request<Question[]>('/v1/question-banks/options'),
        request<Page<QuestionBank>>('/v1/question-banks?pageNo=1&pageSize=100&status=1'),
        request<Page<ReportItem>>('/v1/reports/page?pageNo=1&pageSize=300'),
      ])
      setItems(interviews)
      setCandidates(people)
      setQuestions(availableQuestions)
      setBanks(bankPage.records)
      setReports(reportPage.records)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载面试数据')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (loading || !targetReportInterviewId || selectedReport || reportLoading) return
    const report = reportByInterviewId.get(targetReportInterviewId)
    if (report) void openReport(report)
  }, [loading, targetReportInterviewId, reportByInterviewId, selectedReport, reportLoading])

  function closeReport() {
    setSelectedReport(undefined)
    setReportDetail(undefined)
    if (targetReportInterviewId) {
      const next = new URLSearchParams(searchParams)
      next.delete('reportInterviewId')
      setSearchParams(next, { replace: true })
    }
  }

  const list = useMemo(() => items.filter(item => {
    const person = candidateById.get(String(item.candidateId))
    const keyword = search.toLowerCase()
    const date = new Date(item.scheduledAt)
    const now = new Date()
    const matchesTime = time === 'all'
      || (time === 'today' && date.toDateString() === now.toDateString())
      || (time === 'past' && date < now)
      || (time === 'next7' && date >= now && date <= new Date(now.getTime() + 7 * 86400000))
    return (!keyword || [item.title, person?.realName, person?.username].some(value => value?.toLowerCase().includes(keyword)))
      && (!candidate || String(item.candidateId) === candidate)
      && (!status || String(item.status) === status)
      && matchesTime
  }).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)), [items, candidateById, search, candidate, status, time])

  function applyTemplate(template: Template) {
    setForm(previous => ({ ...previous, title: template.title, duration: template.duration, type: template.type, questionCount: template.questionCount, source: 'bank' }))
  }

  async function openReport(report: ReportItem) {
    setSelectedReport(report)
    setReportDetail(undefined)
    setReportLoading(true)
    try {
      setReportDetail(await request<ReportDetail>(`/v1/interviews/${report.interviewId}/report`))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载报告详情')
    } finally {
      setReportLoading(false)
    }
  }

  async function create() {
    if (!form.title.trim() || !form.candidateId || !form.scheduledAt) { setError('请填写主题、候选人和预约时间'); return }
    if (form.source === 'question' && !form.questionIds.length) { setError('请至少选择一道题目'); return }
    if (form.source === 'bank' && !form.questionBankId) { setError('请选择题库'); return }
    setSaving(true)
    try {
      await request('/v1/interviews', { method: 'POST', body: JSON.stringify({ title: form.title, candidateId: form.candidateId, scheduledAt: toBackendTime(form.scheduledAt), duration: form.duration, type: form.type, interviewerStyle: form.interviewerStyle, questionIds: form.source === 'question' ? form.questionIds : [], questionBankId: form.source === 'bank' ? form.questionBankId : undefined, questionCount: form.source === 'bank' ? form.questionCount : undefined }) })
      recordAuditLog({ module: '面试管理', action: '创建面试', operator: profile()?.realName ?? '管理员', target: form.title, detail: `为候选人 ${candidateById.get(form.candidateId)?.realName ?? form.candidateId} 创建面试` })
      setDialog(false)
      setForm(defaultForm())
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '创建面试失败')
    } finally {
      setSaving(false)
    }
  }

  async function createBulk() {
    const template = templates.find(item => item.id === bulk.templateId) ?? templates[0]
    if (!bulk.candidateIds.length) { setError('请选择至少一名候选人'); return }
    if (!bulk.questionBankId) { setError('请选择批量面试题库'); return }
    setSaving(true)
    try {
      const start = new Date(bulk.scheduledAt)
      for (const [index, candidateId] of bulk.candidateIds.entries()) {
        const scheduled = new Date(start.getTime() + index * bulk.interval * 60_000)
        const local = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, '0')}-${String(scheduled.getDate()).padStart(2, '0')}T${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}:00`
        await request('/v1/interviews', { method: 'POST', body: JSON.stringify({ title: template.title, candidateId, scheduledAt: local, duration: template.duration, type: template.type, interviewerStyle: 'big-tech', questionIds: [], questionBankId: bulk.questionBankId, questionCount: template.questionCount }) })
      }
      recordAuditLog({ module: '面试管理', action: '批量创建面试', operator: profile()?.realName ?? '管理员', target: template.name, detail: `批量安排 ${bulk.candidateIds.length} 场面试` })
      setBulkDialog(false)
      setBulk(defaultBulk())
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '批量创建失败')
    } finally {
      setSaving(false)
    }
  }

  async function confirmInterviewAction() {
    if (!actionTarget) return
    setActionBusy(true)
    try {
      const { type, interview } = actionTarget
      if (type === 'pass') {
        await request(`/v1/interviews/${interview.id}/pass`, { method: 'POST' })
        const person = candidateById.get(String(interview.candidateId))
        recordAuditLog({
          module: '面试管理',
          action: '通过面试',
          operator: profile()?.realName ?? '管理员',
          target: interview.title,
          detail: `将 ${person?.realName ?? interview.candidateId} 的面试标记为已通过`,
        })
      } else {
        await request(`/v1/interviews/${interview.id}`, { method: 'DELETE' })
        recordAuditLog({
          module: '面试管理',
          action: '删除面试',
          operator: profile()?.realName ?? '管理员',
          target: interview.title,
          detail: `删除面试安排：${interview.title}`,
        })
      }
      setActionTarget(undefined)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作失败，请稍后重试')
    } finally {
      setActionBusy(false)
    }
  }

  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold text-[var(--accent)]">AI INTERVIEW ADMIN</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">面试管理</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">创建、检索和查看 AI 面试安排。已结束且生成报告的面试，可直接在操作栏查看评测报告。</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setBulkDialog(true)}><Users className="h-4 w-4" />批量创建</Button>
        <Button onClick={() => { setForm(defaultForm()); setDialog(true) }}><Plus className="h-4 w-4" />创建 AI 面试</Button>
      </div>
    </header>

    {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    <section className="mt-7 grid gap-4 md:grid-cols-4">
      {templates.map((item, index) => <Card key={item.id} motionDelay={index * .04} className="cursor-pointer bg-[linear-gradient(180deg,var(--surface),color-mix(in_srgb,var(--surface)_84%,var(--accent-soft)))]" onClick={() => { applyTemplate(item); setDialog(true) }}>
        <Layers3 className="h-5 w-5 text-[var(--accent)]" />
        <h3 className="mt-4 font-bold">{item.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p>
        <p className="mt-4 text-xs text-muted-foreground">{item.duration} 分钟 · {item.questionCount} 题</p>
      </Card>)}
    </section>

    <Card className="mt-7 p-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={event => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="搜索主题、候选人姓名或账号" />
        </label>
        <select className="h-12 rounded-full border border-border bg-surface px-4 text-sm" value={candidate} onChange={event => setCandidate(event.target.value)}>
          <option value="">全部候选人</option>
          {candidates.map(item => <option key={item.id} value={item.id}>{item.realName}（{item.username}）</option>)}
        </select>
        <select className="h-12 rounded-full border border-border bg-surface px-4 text-sm" value={time} onChange={event => setTime(event.target.value)}>
          <option value="all">全部时间</option>
          <option value="today">今天</option>
          <option value="next7">未来 7 天</option>
          <option value="past">已过期</option>
        </select>
        <select className="h-12 rounded-full border border-border bg-surface px-4 text-sm" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">全部状态</option>
          <option value="0">待开始</option>
          <option value="1">进行中</option>
          <option value="2">已结束</option>
          <option value="3">已取消</option>
          <option value="4">已通过</option>
          <option value="5">报告生成中</option>
          <option value="6">已出报告</option>
          <option value="7">未通过</option>
        </select>
      </div>
      <div>
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4">面试主题</th>
              <th className="px-5 py-4">候选人</th>
              <th className="px-5 py-4">预约时间</th>
              <th className="px-5 py-4">状态</th>
              <th className="px-5 py-4">报告</th>
              <th className="px-5 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="px-5 py-12 text-center text-muted-foreground" colSpan={6}>正在加载面试数据…</td></tr> : list.length ? list.map(item => {
              const person = candidateById.get(String(item.candidateId))
              const report = reportByInterviewId.get(String(item.id))
              return <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                <td className="break-words px-5 py-5 font-semibold">{item.title}</td>
                <td className="px-5 py-5">
                  <button onClick={() => person && nav(`/admin/candidates/${person.id}`)} className="font-medium hover:text-[var(--accent)]">{person?.realName ?? `候选人 #${item.candidateId}`}</button>
                  <p className="mt-1 text-xs text-muted-foreground">{person?.username}</p>
                </td>
                <td className="px-5 py-5 text-muted-foreground">{dateText(item.scheduledAt)}</td>
                <td className="px-5 py-5"><Badge className="shrink-0" tone={interviewStatusTone(item.status)}>{interviewStatusText[item.status] ?? '未知状态'}</Badge></td>
                <td className="px-5 py-5">
                  {report ? <Badge className="shrink-0" tone="success">已生成 · {report.totalScore} 分</Badge> : isReportPending(item.status) ? <Badge className="shrink-0" tone="warning">生成中</Badge> : <span className="whitespace-nowrap text-xs text-muted-foreground">面试结束后生成</span>}
                </td>
                <td className="relative px-5 py-5 align-middle">
                  <div className="grid grid-cols-[68px_72px] justify-end gap-2">
                    <Button variant="secondary" className="h-9 w-full gap-1 whitespace-nowrap px-2 text-xs shadow-[0_6px_18px_rgba(20,18,17,.04)]" onClick={() => nav(`/admin/interviews/${item.id}/review`)} title="查看回顾"><Eye className="hidden h-3.5 w-3.5 xl:block" />回顾</Button>
                    <div className="relative">
                      <Button
                        variant="secondary"
                        className="h-9 w-full gap-1 whitespace-nowrap px-2 text-xs shadow-[0_6px_18px_rgba(20,18,17,.04)]"
                        onClick={() => setOpenActions(openActions === String(item.id) ? undefined : String(item.id))}
                        title="更多操作"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />更多
                      </Button>
                      {openActions === String(item.id) && <>
                        <button className="fixed inset-0 z-20 cursor-default" aria-label="关闭更多操作菜单" onClick={() => setOpenActions(undefined)} />
                        <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 text-sm shadow-2xl">
                          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-muted" onClick={() => { setOpenActions(undefined); setNoticeTarget(item) }}><Bell className="h-4 w-4" />发送通知</button>
                          {([INTERVIEW_STATUS.COMPLETED, INTERVIEW_STATUS.REPORT_READY, INTERVIEW_STATUS.FAILED] as number[]).includes(item.status) && <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-muted" onClick={() => { setOpenActions(undefined); setActionTarget({ type: 'pass', interview: item }) }}><CheckCircle2 className="h-4 w-4" />标记通过</button>}
                          {report && canViewReport(item.status) && <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-muted" onClick={() => { setOpenActions(undefined); void openReport(report) }}><FileText className="h-4 w-4" />查看报告</button>}
                          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-400/10" onClick={() => { setOpenActions(undefined); setActionTarget({ type: 'delete', interview: item }) }}><Trash2 className="h-4 w-4" />删除面试</button>
                        </div>
                      </>}
                    </div>
                  </div>
                </td>
              </tr>
            }) : <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">暂无符合条件的面试</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>

    {dialog && <InterviewDialog saving={saving} onClose={() => setDialog(false)} onSubmit={create} form={form} setForm={setForm} candidates={candidates} questions={questions} banks={banks} templates={templates} applyTemplate={applyTemplate} />}
    {bulkDialog && <BulkDialog saving={saving} onClose={() => setBulkDialog(false)} onSubmit={createBulk} bulk={bulk} setBulk={setBulk} candidates={candidates} banks={banks} templates={templates} />}
    {noticeTarget && <NotificationDialog interview={noticeTarget} candidate={candidateById.get(String(noticeTarget.candidateId))} onClose={() => setNoticeTarget(undefined)} />}
    {actionTarget && <InterviewActionDialog target={actionTarget} candidate={candidateById.get(String(actionTarget.interview.candidateId))} busy={actionBusy} onClose={() => setActionTarget(undefined)} onConfirm={confirmInterviewAction} />}
    {selectedReport && <ReportDialog report={selectedReport} detail={reportDetail} loading={reportLoading} onClose={closeReport} />}
  </div>
}

function InterviewActionDialog({ target, candidate, busy, onClose, onConfirm }: { target: { type: 'pass' | 'delete'; interview: InterviewRow }; candidate?: Candidate; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const isDelete = target.type === 'delete'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[32px] border border-border bg-surface p-7 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">{isDelete ? 'DELETE INTERVIEW' : 'PASS INTERVIEW'}</p>
          <h2 className="mt-2 text-2xl font-black">{isDelete ? '确认删除这场面试？' : '确认标记为已通过？'}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isDelete
              ? '删除后会同步移除该面试的题目快照、回答和关联评测数据，此操作不可恢复。'
              : '系统会把面试状态更新为已通过；如果面试还没有结束，会同时写入当前结束时间。'}
          </p>
        </div>
        <button className="rounded-full p-2 hover:bg-muted" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Interview</p>
        <p className="mt-2 font-bold">{target.interview.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">候选人：{candidate?.realName ?? target.interview.candidateId} · 预约时间：{dateText(target.interview.scheduledAt)}</p>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>取消</Button>
        <Button variant={isDelete ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
          {isDelete ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? '处理中…' : isDelete ? '确认删除' : '标记通过'}
        </Button>
      </div>
    </div>
  </div>
}

function NotificationDialog({ interview, candidate, onClose }: { interview: InterviewRow; candidate?: Candidate; onClose: () => void }) {
  const candidateName = candidate?.realName || candidate?.username || `候选人 #${interview.candidateId}`
  const scheduledAt = dateText(interview.scheduledAt)
  const admin = profile()
  const [templates, setTemplates] = useState<NotificationTemplate[]>(() => listTemplates())
  const [templateId, setTemplateId] = useState(templates[0]?.id || '')
  const [title, setTitle] = useState(() => fillTemplate(templates[0]?.title || '面试通知', { candidateName, interviewTitle: interview.title, scheduledAt }))
  const [content, setContent] = useState(() => fillTemplate(templates[0]?.content || '', { candidateName, interviewTitle: interview.title, scheduledAt }))
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  function applyNoticeTemplate(id: string) {
    setTemplateId(id)
    const template = templates.find(item => item.id === id)
    if (!template) return
    setTitle(fillTemplate(template.title, { candidateName, interviewTitle: interview.title, scheduledAt }))
    setContent(fillTemplate(template.content, { candidateName, interviewTitle: interview.title, scheduledAt }))
  }

  function createTemplate() {
    if (!templateName.trim() || !title.trim() || !content.trim()) return
    const item = saveTemplate({ name: templateName.trim(), title: title.trim(), content: content.trim() })
    const nextTemplates = listTemplates()
    setTemplates(nextTemplates)
    setTemplateId(item.id)
    setTemplateName('')
    setSavingTemplate(false)
  }

  function submit() {
    if (!title.trim() || !content.trim()) return
    sendNotification({
      title: title.trim(),
      content: content.trim(),
      interviewId: String(interview.id),
      interviewTitle: interview.title,
      scheduledAt: interview.scheduledAt,
      candidate: {
        userId: String(candidate?.id || interview.candidateId),
        username: candidate?.username || '',
        realName: candidateName,
      },
      sender: {
        userId: String(admin?.id || admin?.username || 'admin'),
        username: admin?.username || 'admin',
        realName: admin?.realName || '管理员',
      },
    })
    recordAuditLog({
      module: '面试管理',
      action: '发送通知',
      operator: admin?.realName || admin?.username || '管理员',
      target: candidateName,
      detail: `向 ${candidateName} 发送「${interview.title}」通知：${title.trim()}`,
    })
    onClose()
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm">
    <div className="mx-auto my-8 max-w-3xl rounded-[32px] border border-border bg-surface p-7 shadow-2xl">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">SEND NOTICE</p>
          <h2 className="mt-1 text-2xl font-black">发送面试通知</h2>
          <p className="mt-2 text-sm text-muted-foreground">通知将发送给 {candidateName}，候选人可在顶部铃铛中查看。</p>
        </div>
        <button className="rounded-full p-2 hover:bg-muted" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>

      <div className="mt-6 rounded-[24px] border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">INTERVIEW</p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          <strong className="sm:col-span-1">{interview.title}</strong>
          <span className="text-muted-foreground">候选人：{candidateName}</span>
          <span className="text-muted-foreground">时间：{scheduledAt}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="text-sm font-semibold">发送模板
          <select value={templateId} onChange={event => applyNoticeTemplate(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal">
            {templates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">通知标题
          <input value={title} onChange={event => setTitle(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" />
        </label>
        <label className="text-sm font-semibold">通知内容
          <textarea value={content} onChange={event => setContent(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-border bg-background p-4 font-normal leading-7 outline-none focus:border-[var(--accent)]" />
        </label>

        <div className="rounded-[24px] border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">保存为发送模板</p>
              <p className="mt-1 text-xs text-muted-foreground">可使用变量：{'{candidateName}'}、{'{interviewTitle}'}、{'{scheduledAt}'}。</p>
            </div>
            <Button variant="secondary" onClick={() => setSavingTemplate(value => !value)}>{savingTemplate ? '收起' : '新建模板'}</Button>
          </div>
          {savingTemplate && <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={templateName} onChange={event => setTemplateName(event.target.value)} placeholder="模板名称，例如：复盘提醒" className="h-11 flex-1 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-[var(--accent)]" />
            <Button onClick={createTemplate}>保存模板</Button>
          </div>}
        </div>
      </div>

      <div className="mt-7 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button onClick={submit}><Bell className="h-4 w-4" />发送通知</Button>
      </div>
    </div>
  </div>
}

function ReportDialog({ report, detail, loading, onClose }: { report: ReportItem; detail?: ReportDetail; loading: boolean; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--primary)]/30 p-4 backdrop-blur-sm">
    <article className="mx-auto my-7 max-w-6xl rounded-[30px] bg-surface p-6 shadow-2xl sm:p-8">
      {loading || !detail ? (
        <div className="py-20 text-center text-muted-foreground">正在加载报告详情…</div>
      ) : (
        <ReportDetailView
          report={detail}
          title={report.interviewTitle}
          eyebrow={`${report.candidateName} · INTERVIEW REPORT`}
          heading={report.interviewTitle}
          meta={`候选人：${report.candidateName} · 面试时间：${dateText(report.scheduledAt)}`}
          exportTitle={`InterviewOS-${report.candidateName}-${report.interviewTitle}-评测报告`}
          onExport={() => window.open(`/candidate/interviews/${report.interviewId}/report?print=1`, '_blank', 'noopener,noreferrer')}
          trainingPlanEndpoint={`/v1/interviews/${report.interviewId}/report/training-plan`}
          onClose={onClose}
        />
      )}
    </article>
  </div>
}

function InterviewDialog({ saving, onClose, onSubmit, form, setForm, candidates, questions, banks, templates, applyTemplate }: { saving: boolean; onClose: () => void; onSubmit: () => void; form: FormState; setForm: (value: FormState) => void; candidates: Candidate[]; questions: Question[]; banks: QuestionBank[]; templates: Template[]; applyTemplate: (value: Template) => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-w-3xl rounded-[30px] bg-surface p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">INTERVIEW BUILDER</p><h2 className="mt-1 text-2xl font-bold">创建 AI 面试</h2></div><button className="rounded-full p-2 hover:bg-muted" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-5"><div><p className="text-sm font-semibold">面试模板</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{templates.map(item => <button key={item.id} onClick={() => applyTemplate(item)} className="rounded-2xl border border-border p-3 text-left text-sm hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"><strong>{item.name}</strong><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></button>)}</div></div><label className="text-sm font-semibold">面试主题<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label><label className="text-sm font-semibold">候选人<select value={form.candidateId} onChange={event => setForm({ ...form, candidateId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal"><option value="">选择候选人</option>{candidates.map(item => <option value={item.id} key={item.id}>{item.realName}（{item.username}）</option>)}</select></label><div><p className="text-sm font-semibold">AI 面试官风格</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{interviewerStyles.map(item => <button key={item.key} type="button" onClick={() => setForm({ ...form, interviewerStyle: item.key })} className={`rounded-2xl border p-3 text-left text-sm transition ${form.interviewerStyle === item.key ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm' : 'border-border hover:border-[var(--accent)] hover:bg-muted'}`}><strong>{item.label}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></button>)}</div></div><div><p className="text-sm font-semibold">题目来源</p><div className="mt-2 flex rounded-full bg-muted p-1"><button onClick={() => setForm({ ...form, source: 'question', questionBankId: '' })} className={`flex-1 rounded-full px-3 py-2 text-sm transition ${form.source === 'question' ? 'bg-surface font-semibold shadow-sm' : 'text-muted-foreground'}`}>自定义选择题目</button><button onClick={() => setForm({ ...form, source: 'bank', questionIds: [] })} className={`flex-1 rounded-full px-3 py-2 text-sm transition ${form.source === 'bank' ? 'bg-surface font-semibold shadow-sm' : 'text-muted-foreground'}`}>选择题库抽题</button></div></div>{form.source === 'question' ? <label className="text-sm font-semibold">面试题目（可多选任意题目）<select multiple value={form.questionIds} onChange={event => setForm({ ...form, questionIds: Array.from(event.target.selectedOptions, option => option.value) })} className="mt-2 h-40 w-full rounded-2xl border border-border bg-background p-3 text-sm font-normal">{questions.map(item => <option key={item.id} value={item.id}>#{item.id} · {item.content}</option>)}</select><span className="mt-2 block text-xs text-muted-foreground">按住 Ctrl / Command 可多选。</span></label> : <div className="grid gap-5 sm:grid-cols-[1fr_150px]"><label className="text-sm font-semibold">面试题库<select value={form.questionBankId} onChange={event => setForm({ ...form, questionBankId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal"><option value="">选择题库</option>{banks.map(item => <option key={item.id} value={item.id}>{item.name}（{item.bankCode}）</option>)}</select></label><label className="text-sm font-semibold">抽题数量<select value={form.questionCount} onChange={event => setForm({ ...form, questionCount: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal">{[3, 5, 8, 10, 15, 20].map(value => <option key={value}>{value}</option>)}</select></label></div>}<div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">预约时间<input type="datetime-local" value={form.scheduledAt} onChange={event => setForm({ ...form, scheduledAt: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal" /></label><label className="text-sm font-semibold">时长（分钟）<input type="number" min="1" max="480" value={form.duration} onChange={event => setForm({ ...form, duration: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal" /></label></div></div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>取消</Button><Button disabled={saving} onClick={onSubmit}>{saving ? '创建中…' : '创建面试'}</Button></div></div></div>
}

function BulkDialog({ saving, onClose, onSubmit, bulk, setBulk, candidates, banks, templates }: { saving: boolean; onClose: () => void; onSubmit: () => void; bulk: BulkState; setBulk: (value: BulkState) => void; candidates: Candidate[]; banks: QuestionBank[]; templates: Template[] }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-w-3xl rounded-[30px] bg-surface p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">BULK SCHEDULER</p><h2 className="mt-1 text-2xl font-bold">批量创建面试</h2></div><button className="rounded-full p-2 hover:bg-muted" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-5"><label className="text-sm font-semibold">面试模板<select value={bulk.templateId} onChange={event => setBulk({ ...bulk, templateId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal">{templates.map(item => <option key={item.id} value={item.id}>{item.name} · {item.duration} 分钟</option>)}</select></label><label className="text-sm font-semibold">面试题库<select value={bulk.questionBankId} onChange={event => setBulk({ ...bulk, questionBankId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal"><option value="">选择题库</option>{banks.map(item => <option key={item.id} value={item.id}>{item.name}（{item.bankCode}）</option>)}</select></label><label className="text-sm font-semibold">候选人（可多选）<select multiple value={bulk.candidateIds} onChange={event => setBulk({ ...bulk, candidateIds: Array.from(event.target.selectedOptions, option => option.value) })} className="mt-2 h-44 w-full rounded-2xl border border-border bg-background p-3 font-normal">{candidates.map(item => <option key={item.id} value={item.id}>{item.realName}（{item.username}）</option>)}</select><span className="mt-2 block text-xs text-muted-foreground">会按照选择顺序和间隔时间依次排期。</span></label><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">第一场开始时间<input type="datetime-local" value={bulk.scheduledAt} onChange={event => setBulk({ ...bulk, scheduledAt: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal" /></label><label className="text-sm font-semibold">场次间隔（分钟）<input type="number" min="10" max="240" value={bulk.interval} onChange={event => setBulk({ ...bulk, interval: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal" /></label></div></div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>取消</Button><Button disabled={saving} onClick={onSubmit}><ClipboardList className="h-4 w-4" />{saving ? '创建中…' : '批量创建'}</Button></div></div></div>
}
