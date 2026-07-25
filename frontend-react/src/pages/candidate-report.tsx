import { RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ReportDetailView, type ReportDetailData } from '@/components/report-detail-view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request } from '@/lib/api'

export function CandidateReport() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportDetailData>()
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false) {
    if (!silent) setLoading(true)
    try {
      setReport(await request<ReportDetailData>(`/v1/interviews/${id}/report`))
      setRetrying(false)
      setError('')
    } catch (reason) {
      setRetrying(true)
      setError(reason instanceof Error ? reason.message : '评分报告尚未生成')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  useEffect(() => {
    if (!retrying || report) return
    const timer = window.setTimeout(() => void load(true), 5000)
    return () => window.clearTimeout(timer)
  }, [retrying, report])

  if (loading) return <Card>正在获取 AI 评测报告…</Card>

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles />
        </span>
        <h1 className="mt-5 text-2xl font-bold">AI 正在生成你的评测报告</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          系统正在逐题评估你的作答，并整理优势、短板和下一步建议。页面会自动刷新。
        </p>
        {error && <p className="mt-4 text-sm text-amber-700">{error}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回大厅</Button>
          <Button onClick={() => void load()}><RefreshCw className="h-4 w-4" />立即刷新</Button>
        </div>
      </div>
    )
  }

  return (
    <ReportDetailView
      report={report}
      title="你的面试评测报告"
      heading="你的面试评测报告"
      meta={`报告编号：${id}`}
      exportTitle={`InterviewOS-${id}-候选人评测报告`}
      backLabel="返回面试大厅"
      onBack={() => navigate('/candidate/interviews')}
      extraActions={<Button variant="secondary" onClick={() => navigate('/candidate/reports')}>能力趋势</Button>}
    />
  )
}
