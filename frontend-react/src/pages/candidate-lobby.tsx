import { motion } from 'framer-motion'
import { Calendar, Clock3, Play, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type Interview, type PracticeBank, request } from '@/lib/api'
import { canEnterInterview, canViewReport, interviewStatusText, interviewStatusTone, isReportPending } from '@/lib/interview-status'

export function CandidateLobby() {
  const [items, setItems] = useState<Interview[]>([])
  const [banks, setBanks] = useState<PracticeBank[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [bank, setBank] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      request<Interview[]>('/v1/interviews'),
      request<PracticeBank[]>('/v1/interviews/practice/banks'),
    ]).then(([interviews, practiceBanks]) => {
      setItems(interviews)
      setBanks(practiceBanks)
    }).catch(reason => setError(reason instanceof Error ? reason.message : '无法加载面试大厅'))
  }, [])

  const list = useMemo(() => items.filter(item => (
    (!status || String(item.status) === status)
    && item.title.toLowerCase().includes(query.toLowerCase())
  )), [items, query, status])

  async function enter(item: Interview) {
    try {
      if (item.status === 0) await request(`/v1/interviews/${item.id}/start`, { method: 'POST' })
      nav(`/candidate/interviews/${item.id}/room`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法进入面试')
    }
  }

  async function practice() {
    if (!bank) {
      setError('请选择一个练习题库')
      return
    }
    setBusy(true)
    try {
      const result = await request<Interview>('/v1/interviews/practice', {
        method: 'POST',
        body: JSON.stringify({ questionBankId: bank, questionCount: 5, duration: 30 }),
      })
      nav(`/candidate/interviews/${result.id}/room`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '创建练习失败')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold text-[var(--accent)]">MY AI INTERVIEWS</p>
        <h1 className="mt-2 text-3xl font-bold">把准备，变成底气。</h1>
        <p className="mt-2 text-muted-foreground">选择一场安排，或开始一次专属的 AI 模拟练习。</p>
      </div>
      <Button onClick={() => setOpen(true)}><Sparkles className="h-4 w-4" />开始模拟练习</Button>
    </div>

    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}

    <Card>
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent outline-none" placeholder="搜索面试主题" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <select className="h-11 rounded-xl border border-border bg-surface px-3 text-sm" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">全部状态</option>
          <option value="0">待开始</option>
          <option value="1">进行中</option>
          <option value="2">已结束</option>
          <option value="4">已通过</option>
          <option value="5">报告生成中</option>
          <option value="6">已出报告</option>
          <option value="7">未通过</option>
        </select>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {list.map((item, index) => <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.28, delay: index * 0.04, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border p-5 transition hover:shadow-lg"
        >
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{item.remark === 'candidate-practice' ? '个人模拟练习' : 'AI 模拟面试'}</span>
            <Badge tone={interviewStatusTone(item.status)}>{interviewStatusText[item.status] ?? '未知状态'}</Badge>
          </div>
          <h2 className="mt-5 text-lg font-bold">{item.title}</h2>
          <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />{item.scheduledAt.replace('T', ' ').slice(0, 16)}
            <Clock3 className="ml-2 h-4 w-4" />{item.duration} 分钟
          </p>
          <div className="mt-6 flex justify-between">
            <span className="text-xs text-muted-foreground">#{item.id}</span>
            {canViewReport(item.status)
              ? <Button variant="secondary" onClick={() => nav(`/candidate/interviews/${item.id}/report`)}>查看报告</Button>
              : isReportPending(item.status)
                ? <Button variant="secondary" disabled>报告生成中</Button>
                : <Button disabled={!canEnterInterview(item.status)} onClick={() => enter(item)}><Play className="h-4 w-4" />{item.status === 1 ? '继续面试' : '开始面试'}</Button>}
          </div>
        </motion.article>)}
      </div>
    </Card>

    {open && <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-4 sm:place-items-center">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold">开始模拟练习</h2>
        <p className="mt-2 text-sm text-muted-foreground">选择题库后，AI 面试官将随机抽题并立即开始对话。</p>
        <select className="mt-6 h-11 w-full rounded-xl border border-border bg-surface px-3" value={bank} onChange={event => setBank(event.target.value)}>
          <option value="">选择练习题库</option>
          {banks.map(item => <option key={item.id} value={item.id}>{item.name} · {item.questionCount} 题</option>)}
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
          <Button disabled={busy} onClick={practice}>{busy ? '创建中…' : '立即开始'}</Button>
        </div>
      </Card>
    </div>}
  </div>
}
