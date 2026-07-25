import { ArrowLeft, BarChart3, CheckCircle2, Download, TrendingUp, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { exportReportPdf } from '@/lib/report-export'

export type ReportDetailData = {
  totalScore: number
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
  summary: string
  strengths: string
  weaknesses: string
  improvementSuggestions: string
  status: number
}

const dimensions: Array<[keyof ReportDetailData, string, string]> = [
  ['professionalScore', '专业能力', '核心知识、岗位技能与方案完整度'],
  ['expressionScore', '表达能力', '结构化表达、沟通清晰度与说服力'],
  ['logicScore', '逻辑思维', '问题拆解、推理链路与边界意识'],
  ['adaptabilityScore', '应变能力', '追问场景下的临场反应与调整能力'],
]

type ReportDetailViewProps = {
  report: ReportDetailData
  title: string
  eyebrow?: string
  heading?: string
  meta?: string
  exportTitle: string
  backLabel?: string
  onBack?: () => void
  onClose?: () => void
  extraActions?: ReactNode
}

export function ReportDetailView({
  report,
  title,
  eyebrow = 'INTERVIEW INTELLIGENCE',
  heading = '面试评测报告',
  meta,
  exportTitle,
  backLabel,
  onBack,
  onClose,
  extraActions,
}: ReportDetailViewProps) {
  const scores = dimensions.map(([key]) => Number(report[key]))
  const average = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)

  return (
    <div data-print-root className="mx-auto max-w-6xl space-y-6">
      <div className="print-only mb-6 border-b border-[#ddd7cc] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b6847]">InterviewOS Assessment Report</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        {meta && <p className="mt-1 text-sm text-[#7a7770]">{meta}</p>}
      </div>

      <header className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {onBack && (
            <button className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel || '返回'}
            </button>
          )}
          <p className="text-sm font-semibold text-[var(--accent)]">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-bold">{heading}</h1>
          {meta && <p className="mt-2 text-sm text-muted-foreground">{meta}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {extraActions}
          <Button variant="secondary" onClick={() => exportReportPdf(exportTitle)}>
            <Download className="h-4 w-4" />
            导出 PDF
          </Button>
          {onClose && (
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface hover:bg-muted" aria-label="关闭报告">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <section className="soft-emphasis-panel print-section overflow-hidden rounded-[28px] px-6 py-7 shadow-xl sm:px-9">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge tone={report.status === 1 ? 'success' : 'warning'}>{report.status === 1 ? '报告已生成' : '报告草稿'}</Badge>
            <h2 className="mt-5 text-2xl font-bold">综合评测：表现达到岗位基础要求</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/85">{report.summary}</p>
          </div>
          <div className="grid h-40 w-40 place-items-center rounded-full border-8 border-[var(--border)]/40 bg-white/10 text-center shadow-[0_0_0_12px_rgba(255,255,255,.05)]">
            <div>
              <strong className="text-5xl tracking-tight">{report.totalScore}</strong>
              <span className="mt-1 block text-xs text-white/75">综合得分 / 100</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dimensions.map(([key, label, note]) => (
          <Card key={key} className="print-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-3 flex items-end justify-between">
              <strong className="text-3xl">{report[key]}</strong>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--brand-pink)]" style={{ width: `${report[key]}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="print-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">ABILITY PROFILE</p>
              <h2 className="mt-1 text-xl font-bold">能力分布</h2>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              平均 {average}
            </span>
          </div>
          <div className="mt-8 space-y-5">
            {dimensions.map(([key, label]) => (
              <div key={key}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{label}</span>
                  <strong>{report[key]}</strong>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--brand-pink)]" style={{ width: `${report[key]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="print-card">
          <p className="text-sm font-semibold text-[var(--accent)]">AI TAKEAWAYS</p>
          <h2 className="mt-1 text-xl font-bold">下一次，做得更好</h2>
          <div className="mt-6 space-y-4">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)]/70 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-[var(--accent)]">
                <CheckCircle2 className="h-4 w-4" />
                优势分析
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/80">{report.strengths}</p>
            </article>
            <article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <h3 className="font-semibold text-amber-800">可提升项</h3>
              <p className="mt-2 text-sm leading-6 text-amber-950/80">{report.weaknesses}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)]/70 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-[var(--accent)]">
                <TrendingUp className="h-4 w-4" />
                行动建议
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/80">{report.improvementSuggestions}</p>
            </article>
          </div>
        </Card>
      </div>
    </div>
  )
}
