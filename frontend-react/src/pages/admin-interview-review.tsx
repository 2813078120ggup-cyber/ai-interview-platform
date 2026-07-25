import { ArrowLeft, Calendar, ClipboardList, FileText, MessageSquareText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type Interview } from '@/lib/api'
import { canViewReport, interviewStatusText, interviewStatusTone } from '@/lib/interview-status'

type Question = { interviewQuestionId: string; content: string; options?: string; questionType: string; maxScore: number }
type Answer = { interviewQuestionId: string; answerContent?: string; answerData?: string; score?: number; evaluation?: string; durationSeconds?: number }

export function AdminInterviewReview() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState<Interview>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let disposed = false; Promise.all([request<Interview>(`/v1/interviews/${id}`), request<Question[]>(`/v1/interviews/${id}/questions`), request<Answer[]>(`/v1/interviews/${id}/answers`)]).then(([item, questionList, answerList]) => { if (disposed) return; setInterview(item); setQuestions(questionList); setAnswers(answerList) }).catch(reason => { if (!disposed) setError(reason instanceof Error ? reason.message : '无法加载面试回顾') }).finally(() => { if (!disposed) setLoading(false) }); return () => { disposed = true } }, [id])
  const answersByQuestion = useMemo(() => new Map(answers.map(item => [String(item.interviewQuestionId), item])), [answers])
  if (loading) return <div className="p-5 lg:p-8"><Card>正在加载管理员回顾…</Card></div>
  if (!interview) return <div className="p-5 lg:p-8"><Card><p className="text-rose-700">{error || '面试不存在或无权访问。'}</p><Button variant="secondary" className="mt-5" onClick={() => navigate('/admin/interviews')}>返回面试管理</Button></Card></div>
  return <div className="mx-auto max-w-6xl space-y-6 p-5 lg:p-8">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><button onClick={() => navigate('/admin/interviews')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回面试管理</button><p className="mt-4 text-sm font-semibold text-[var(--accent)]">INTERVIEW REVIEW</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{interview.title}</h1><p className="mt-2 text-muted-foreground">管理员专属回顾视图，仅用于查看面试过程与作答记录。</p></div><div className="flex gap-2"><Badge tone={interviewStatusTone(interview.status)}>{interviewStatusText[interview.status] ?? '未知状态'}</Badge>{canViewReport(interview.status) && <Button onClick={() => navigate(`/admin/interviews?reportInterviewId=${interview.id}`)}><FileText className="h-4 w-4" />查看评测报告</Button>}</div></header>
    <Card className="grid gap-4 sm:grid-cols-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] dark:bg-[var(--brand)]/10"><Calendar className="h-4 w-4" /></span><div><p className="text-xs text-muted-foreground">预约时间</p><strong className="text-sm">{interview.scheduledAt.replace('T', ' ').slice(0, 16)}</strong></div></div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] dark:bg-[var(--accent)]/10"><ClipboardList className="h-4 w-4" /></span><div><p className="text-xs text-muted-foreground">面试题目</p><strong className="text-sm">{questions.length} 道</strong></div></div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-400/10"><MessageSquareText className="h-4 w-4" /></span><div><p className="text-xs text-muted-foreground">已提交作答</p><strong className="text-sm">{answers.filter(item => item.answerContent || item.answerData).length} 份</strong></div></div></Card>
    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <section className="space-y-4">{questions.map((question, index) => { const answer = answersByQuestion.get(String(question.interviewQuestionId)); return <Card key={question.interviewQuestionId} className="p-0"><div className="flex items-start gap-4 border-b border-border p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)] dark:bg-[var(--brand)]/10 dark:text-[var(--brand)]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone="info">{question.questionType}</Badge><span className="text-xs text-muted-foreground">{question.maxScore} 分</span></div><h2 className="mt-3 font-semibold leading-6">{question.content}</h2>{question.options && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{question.options}</p>}</div></div><div className="p-5"><p className="text-xs font-semibold tracking-wide text-muted-foreground">候选人作答</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{answer?.answerContent || '候选人尚未提交文字作答。'}</p>{answer?.evaluation && <div className="mt-4 rounded-xl bg-muted/70 p-4"><p className="text-xs font-semibold text-[var(--accent)]">AI 评价</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{answer.evaluation}</p></div>}</div></Card> })}{!questions.length && <Card><p className="text-center text-sm text-muted-foreground">该面试尚未关联题目。</p></Card>}</section>
  </div>
}
