import { ArrowLeft, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { recordAuditLog } from '@/lib/audit-log'
import { request } from '@/lib/api'
import { profile } from '@/lib/session'

type Bank = { id: string; bankCode: string; name: string; description?: string }
type Question = {
  id: string
  questionType: string
  difficulty: number
  content: string
  options?: string
  correctAnswer?: string
  answerTemplate?: string
  explanation?: string
  tags?: string
  score: number
  source?: string
  sortOrder?: number
  status?: number
}
type Page<T> = { records: T[] }
type QuestionForm = {
  questionType: string
  difficulty: number
  content: string
  options: string
  correctAnswer: string
  answerTemplate: string
  explanation: string
  tags: string
  score: number
  source: string
  sortOrder: number
  status: number
}

const labels: Record<string, string> = {
  short_answer: '简答题',
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  coding: '编程题',
}

const emptyForm: QuestionForm = {
  questionType: 'short_answer',
  difficulty: 2,
  content: '',
  options: '',
  correctAnswer: '',
  answerTemplate: '',
  explanation: '',
  tags: '',
  score: 10,
  source: 'manual',
  sortOrder: 0,
  status: 1,
}

const statusText: Record<number, string> = { 0: '草稿', 1: '已发布', 2: '已停用' }

function toForm(question: Question): QuestionForm {
  return {
    questionType: question.questionType,
    difficulty: question.difficulty,
    content: question.content,
    options: question.options ?? '',
    correctAnswer: question.correctAnswer ?? '',
    answerTemplate: question.answerTemplate ?? '',
    explanation: question.explanation ?? '',
    tags: question.tags ?? '',
    score: Number(question.score ?? 10),
    source: question.source ?? 'manual',
    sortOrder: Number(question.sortOrder ?? 0),
    status: Number(question.status ?? 1),
  }
}

function questionSummary(question: Question) {
  return question.answerTemplate || question.explanation || '尚未填写参考答案说明'
}

export function AdminQuestions() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [bank, setBank] = useState<Bank>()
  const [items, setItems] = useState<Question[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<QuestionForm>(emptyForm)

  async function load() {
    setLoading(true)
    try {
      const [detail, page] = await Promise.all([
        request<Bank>(`/v1/question-banks/${id}`),
        request<Page<Question>>(`/v1/question-banks/${id}/questions?pageNo=1&pageSize=100&keyword=${encodeURIComponent(keyword)}${type ? `&questionType=${type}` : ''}${difficulty ? `&difficulty=${difficulty}` : ''}`),
      ])
      setBank(detail)
      setItems(page.records)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载题目')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(question: Question) {
    setEditing(question)
    setForm(toForm(question))
    setOpen(true)
  }

  async function save() {
    if (!form.content.trim()) {
      setError('请填写题目内容')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const item = await request<Question>(`/v1/question-banks/${id}/questions/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
        setItems(previous => previous.map(question => question.id === item.id ? item : question))
        recordAuditLog({
          module: '题库管理',
          action: '修改题目',
          operator: profile()?.realName ?? '管理员',
          target: bank?.name ?? id,
          detail: `修改题目：${item.content.slice(0, 40)}`,
        })
      } else {
        const item = await request<Question>(`/v1/question-banks/${id}/questions`, { method: 'POST', body: JSON.stringify(form) })
        setItems(previous => [item, ...previous])
        recordAuditLog({
          module: '题库管理',
          action: '新增题目',
          operator: profile()?.realName ?? '管理员',
          target: bank?.name ?? id,
          detail: `新增题目：${item.content.slice(0, 40)}`,
        })
      }
      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : editing ? '修改题目失败' : '创建题目失败')
    } finally {
      setSaving(false)
    }
  }

  async function remove(question: Question) {
    const confirmed = window.confirm(`确认删除题目「${question.content.slice(0, 40)}」吗？删除后不可恢复。`)
    if (!confirmed) return
    setDeletingId(question.id)
    try {
      await request(`/v1/question-banks/${id}/questions/${question.id}`, { method: 'DELETE' })
      setItems(previous => previous.filter(item => item.id !== question.id))
      recordAuditLog({
        module: '题库管理',
        action: '删除题目',
        operator: profile()?.realName ?? '管理员',
        target: bank?.name ?? id,
        detail: `删除题目：${question.content.slice(0, 40)}`,
      })
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除题目失败')
    } finally {
      setDeletingId('')
    }
  }

  return <div className="mx-auto max-w-7xl p-5 lg:p-9">
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <button onClick={() => nav('/admin/question-banks')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回题库</button>
        <p className="text-sm font-semibold text-[var(--accent)]">QUESTION MANAGEMENT</p>
        <h1 className="mt-1 text-2xl font-bold">{bank?.name || '题目维护'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{bank?.bankCode} · {bank?.description || '维护 AI 面试题目'}</p>
      </div>
      <Button onClick={openCreate}><Plus className="h-4 w-4" />新增题目</Button>
    </header>

    {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

    <Card className="mt-6 p-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => event.key === 'Enter' && void load()} className="w-full bg-transparent text-sm outline-none" placeholder="搜索题目内容或标签" />
        </label>
        <select value={type} onChange={event => setType(event.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm">
          <option value="">全部题型</option>
          {Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <select value={difficulty} onChange={event => setDifficulty(event.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm">
          <option value="">全部难度</option>
          {[1, 2, 3].map(value => <option key={value} value={value}>难度 {value}</option>)}
        </select>
        <Button variant="secondary" onClick={() => void load()}>筛选</Button>
      </div>

      {loading ? <p className="p-12 text-center text-sm text-muted-foreground">正在加载题目…</p> : <div className="divide-y divide-border">
        {items.map((question, index) => <article key={question.id} className="group flex gap-4 p-5 transition hover:bg-muted/20">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{labels[question.questionType] || question.questionType}</Badge>
              <Badge tone={question.difficulty === 3 ? 'warning' : 'default'}>难度 {question.difficulty}</Badge>
              <Badge tone={question.status === 1 ? 'success' : question.status === 2 ? 'default' : 'warning'}>{statusText[question.status ?? 1]}</Badge>
              <span className="text-xs text-muted-foreground">{question.score} 分</span>
            </div>
            <h2 className="mt-3 font-semibold leading-6">{question.content}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{questionSummary(question)}</p>
            {question.tags && <p className="mt-2 text-xs text-muted-foreground">标签：{question.tags}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="h-9 px-3" onClick={() => openEdit(question)}><Pencil className="h-3.5 w-3.5" />修改</Button>
            <Button variant="ghost" className="h-9 px-3 text-rose-700 hover:bg-rose-50" disabled={deletingId === question.id} onClick={() => void remove(question)}><Trash2 className="h-3.5 w-3.5" />删除</Button>
          </div>
        </article>)}
        {!items.length && <p className="p-12 text-center text-sm text-muted-foreground">该题库暂时没有匹配题目</p>}
      </div>}
    </Card>

    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--primary)]/30 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-3xl rounded-[28px] bg-surface p-6 shadow-2xl">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">{editing ? 'EDIT QUESTION' : 'NEW QUESTION'}</p>
            <h2 className="mt-1 text-2xl font-bold">{editing ? '修改题目' : '新增题目'}</h2>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">题型<select value={form.questionType} onChange={event => setForm({ ...form, questionType: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal">
            {Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          <label className="text-sm font-semibold">难度<select value={form.difficulty} onChange={event => setForm({ ...form, difficulty: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal">
            {[1, 2, 3].map(value => <option key={value} value={value}>难度 {value}</option>)}
          </select></label>
          <label className="sm:col-span-2 text-sm font-semibold">题目内容<textarea value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} className="mt-2 min-h-28 w-full rounded-xl border border-border bg-background p-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="sm:col-span-2 text-sm font-semibold">选项 JSON（选择题 / 判断题填写）<textarea value={form.options} onChange={event => setForm({ ...form, options: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-border bg-background p-3 font-normal outline-none focus:border-[var(--accent)]" placeholder='例如：[{"key":"A","text":"选项内容"}]' /></label>
          <label className="sm:col-span-2 text-sm font-semibold">标准答案 JSON（选择题 / 判断题填写）<textarea value={form.correctAnswer} onChange={event => setForm({ ...form, correctAnswer: event.target.value })} className="mt-2 min-h-16 w-full rounded-xl border border-border bg-background p-3 font-normal outline-none focus:border-[var(--accent)]" placeholder='例如：["A"]' /></label>
          <label className="sm:col-span-2 text-sm font-semibold">参考答案 / 回答模板<textarea value={form.answerTemplate} onChange={event => setForm({ ...form, answerTemplate: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-border bg-background p-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="sm:col-span-2 text-sm font-semibold">解析<textarea value={form.explanation} onChange={event => setForm({ ...form, explanation: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-border bg-background p-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="text-sm font-semibold">分值<input type="number" min="0" step="0.5" value={form.score} onChange={event => setForm({ ...form, score: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="text-sm font-semibold">状态<select value={form.status} onChange={event => setForm({ ...form, status: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal">
            <option value={1}>已发布</option>
            <option value={0}>草稿</option>
            <option value={2}>已停用</option>
          </select></label>
          <label className="text-sm font-semibold">排序<input type="number" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="text-sm font-semibold">标签<input value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal outline-none focus:border-[var(--accent)]" placeholder='例如：["Spring","IOC"]' /></label>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
          <Button disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : editing ? '保存修改' : '保存题目'}</Button>
        </div>
      </div>
    </div>}
  </div>
}
