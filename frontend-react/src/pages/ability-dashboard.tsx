import { ArrowLeft, BarChart3, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request } from '@/lib/api'

type Trend = { interviewId: string; interviewTitle: string; scheduledAt: string; totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number }
type Changes = { totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number }
type Summary = { reportCount: number; latest?: Trend; previous?: Trend; changeFromPrevious: Changes; trends: Trend[] }

const labels: Array<[keyof Changes, string]> = [
  ['professionalScore', '专业能力'],
  ['expressionScore', '表达能力'],
  ['logicScore', '逻辑思维'],
  ['adaptabilityScore', '应变能力'],
]
const radarDimensions: Array<{ key: keyof Pick<Trend, 'professionalScore' | 'expressionScore' | 'logicScore' | 'adaptabilityScore'>; label: string }> = [
  { key: 'professionalScore', label: '专业能力' },
  { key: 'expressionScore', label: '表达能力' },
  { key: 'logicScore', label: '逻辑思维' },
  { key: 'adaptabilityScore', label: '应变能力' },
]
const day = (value: string) => value?.replace('T', ' ').slice(0, 10) || '-'
const change = (value: number) => (value > 0 ? '+' : '') + Number(value || 0).toFixed(1)

export function AbilityDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<Summary>()
  const [error, setError] = useState('')

  useEffect(() => {
    void request<Summary>('/v1/reports/my/summary')
      .then(setData)
      .catch(reason => setError(reason instanceof Error ? reason.message : '无法获取能力数据'))
  }, [])

  const changes = data?.changeFromPrevious ?? {
    totalScore: 0, professionalScore: 0, expressionScore: 0, logicScore: 0, adaptabilityScore: 0,
  }
  const trendChart = useMemo(() => {
    const trends = data?.trends ?? []
    const width = 920; const height = 260; const paddingX = 52; const paddingY = 30
    const scores = trends.map(item => item.totalScore)
    const lower = Math.max(0, Math.min(...scores, 60) - 8)
    const upper = Math.min(100, Math.max(...scores, 85) + 8)
    const range = Math.max(upper - lower, 1)
    const step = trends.length > 1 ? (width - paddingX * 2) / (trends.length - 1) : 0
    const points = trends.map((item, index) => ({
      ...item,
      x: trends.length === 1 ? width / 2 : paddingX + index * step,
      y: paddingY + ((upper - item.totalScore) / range) * (height - paddingY * 2),
    }))
    return {
      width, height, paddingX, paddingY, lower, upper, points,
      line: points.map(point => point.x + ',' + point.y).join(' '),
      area: points.length
        ? 'M ' + points[0].x + ' ' + (height - paddingY) + ' L ' + points.map(point => point.x + ' ' + point.y).join(' L ') + ' L ' + points.at(-1)?.x + ' ' + (height - paddingY) + ' Z'
        : '',
    }
  }, [data])
  const radarChart = useMemo(() => {
    const center = 150; const radius = 92
    const polar = (value: number, index: number, extra = 0) => {
      const angle = -Math.PI / 2 + index * Math.PI / 2
      const distance = radius * value + extra
      return { x: center + Math.cos(angle) * distance, y: center + Math.sin(angle) * distance }
    }
    const values = radarDimensions.map(item => data?.latest?.[item.key] ?? 0)
    const polygon = (ratio: number) => radarDimensions.map((_, index) => {
      const point = polar(ratio, index)
      return point.x + ',' + point.y
    }).join(' ')
    const points = values.map((value, index) => {
      const point = polar(value / 100, index)
      return point.x + ',' + point.y
    }).join(' ')
    return { center, radius, polar, values, polygon, points }
  }, [data])

  if (!data?.latest) {
    return <div className="mx-auto max-w-xl py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Sparkles /></span>
      <h1 className="mt-5 text-2xl font-bold">你的能力曲线，从第一场开始</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error || '完成一次面试并生成报告后，这里将展示能力变化。'}</p>
      <Button className="mt-6" onClick={() => navigate('/candidate/interviews')}>开始模拟面试</Button>
    </div>
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <button onClick={() => navigate('/candidate/interviews')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回面试大厅</button>
        <p className="text-sm font-semibold text-emerald-600">ABILITY DASHBOARD</p>
        <h1 className="mt-1 text-3xl font-bold">你的能力成长轨迹</h1>
        <p className="mt-2 text-muted-foreground">基于 {data.reportCount} 场已评测面试的可视化总结。</p>
      </div>
      <Button variant="secondary"><BarChart3 className="h-4 w-4" />已评测 {data.reportCount} 场</Button>
    </header>

    <section className="grid gap-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-700 to-teal-900 p-7 text-white md:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm text-emerald-100">当前综合能力值</p>
        <strong className="mt-2 block text-6xl tracking-tight">{data.latest.totalScore}</strong>
        <p className="mt-4 text-sm text-emerald-50/80">最近一次：{data.latest.interviewTitle} · {day(data.latest.scheduledAt)}</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/10 px-7 py-5 text-center">
        <p className="text-sm text-emerald-100">较上一次</p>
        <strong className={changes.totalScore >= 0 ? 'mt-2 block text-3xl text-emerald-200' : 'mt-2 block text-3xl text-rose-200'}>{change(changes.totalScore)}</strong>
        <p className="mt-1 text-xs text-emerald-100">综合得分变化</p>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {labels.map(([key, label]) => {
        const value = changes[key]
        return <Card key={key}>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-4 flex items-center justify-between">
            <strong className={value >= 0 ? 'text-2xl text-emerald-600' : 'text-2xl text-rose-600'}>{change(value)}</strong>
            {value >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-rose-500" />}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">相较上一份报告</p>
        </Card>
      })}
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(260px,.6fr)]">
    <Card>
      <div className="flex items-start justify-between">
        <div><p className="text-sm font-semibold text-emerald-600">HISTORICAL TREND</p><h2 className="mt-1 text-xl font-bold">历史综合能力变化</h2></div>
        <span className="text-sm text-muted-foreground">按面试时间排序</span>
      </div>
      <div className="mt-8 overflow-x-auto">
        <div className="min-w-[680px]">
          <svg viewBox={'0 0 ' + trendChart.width + ' ' + trendChart.height} className="h-64 w-full overflow-visible" role="img" aria-label="综合能力折线趋势图">
            <defs><linearGradient id="abilityTrendArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity=".28" /><stop offset="100%" stopColor="#14b8a6" stopOpacity="0" /></linearGradient></defs>
            {[0, .25, .5, .75, 1].map(ratio => {
              const y = trendChart.paddingY + ratio * (trendChart.height - trendChart.paddingY * 2)
              const score = Math.round(trendChart.upper - ratio * (trendChart.upper - trendChart.lower))
              return <g key={ratio}>
                <line x1={trendChart.paddingX} x2={trendChart.width - trendChart.paddingX} y1={y} y2={y} stroke="currentColor" strokeOpacity=".1" strokeDasharray="4 6" />
                <text x="4" y={y + 4} className="fill-muted-foreground text-[11px]">{score}</text>
              </g>
            })}
            <path d={trendChart.area} fill="url(#abilityTrendArea)" />
            <polyline points={trendChart.line} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {trendChart.points.map((point, index) => <g key={point.interviewId}>
              <circle cx={point.x} cy={point.y} r="8" fill="white" stroke="#0f766e" strokeWidth="4" />
              <text x={point.x} y={point.y - 17} textAnchor="middle" className="fill-foreground text-[13px] font-bold">{point.totalScore}</text>
              <title>第 {index + 1} 次：{point.totalScore} 分</title>
            </g>)}
          </svg>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(' + data.trends.length + ', minmax(0, 1fr))', marginLeft: (trendChart.paddingX / trendChart.width) * 100 + '%', marginRight: (trendChart.paddingX / trendChart.width) * 100 + '%' }}>
            {data.trends.map((item, index) => <div key={item.interviewId} className="text-center"><strong className="text-xs">第 {index + 1} 次</strong><p className="mt-1 text-[10px] text-muted-foreground">{day(item.scheduledAt)}</p></div>)}
          </div>
        </div>
      </div>
    </Card>
    <Card className="self-start overflow-hidden">
      <div>
        <p className="text-sm font-semibold text-emerald-600">ABILITY RADAR</p>
        <h2 className="mt-1 text-xl font-bold">四维能力画像</h2>
        <p className="mt-1 text-sm text-muted-foreground">最近一次面试的能力分布</p>
      </div>
      <div className="mx-auto mt-5 max-w-[230px] rounded-[22px] border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-transparent p-2 dark:border-emerald-400/10 dark:from-emerald-400/5">
        <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="专业能力、表达能力、逻辑思维和应变能力的雷达图">
          {[.25, .5, .75, 1].map(ratio => <polygon key={ratio} points={radarChart.polygon(ratio)} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" />)}
          {radarDimensions.map((item, index) => {
            const outer = radarChart.polar(1, index)
            const label = radarChart.polar(1, index, 28)
            return <g key={item.key}>
              <line x1={radarChart.center} y1={radarChart.center} x2={outer.x} y2={outer.y} stroke="currentColor" strokeOpacity=".14" />
              <text x={label.x} y={label.y + 4} textAnchor={index === 1 ? 'start' : index === 3 ? 'end' : 'middle'} className="fill-muted-foreground text-[12px] font-medium">{item.label}</text>
            </g>
          })}
          <polygon points={radarChart.points} fill="#14b8a6" fillOpacity=".25" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" />
          {radarChart.values.map((value, index) => {
            const point = radarChart.polar(value / 100, index)
            return <circle key={radarDimensions[index].key} cx={point.x} cy={point.y} r="5" fill="white" stroke="#0f766e" strokeWidth="3"><title>{radarDimensions[index].label}：{value}</title></circle>
          })}
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        {radarDimensions.map((item, index) => <div key={item.key} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{item.label}</span><strong>{radarChart.values[index]}</strong></div>)}
      </div>
    </Card>
    </div>
  </div>
}
