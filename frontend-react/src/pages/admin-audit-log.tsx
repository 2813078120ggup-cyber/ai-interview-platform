import { Download, History, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { listAuditLogs } from '@/lib/audit-log'

const dateText = (value: string) => value.replace('T', ' ').slice(0, 19)

export function AdminAuditLog() {
  const [keyword, setKeyword] = useState('')
  const logs = useMemo(() => listAuditLogs(), [])
  const visible = logs.filter(item => [item.action, item.module, item.operator, item.target, item.detail].some(value => value.toLowerCase().includes(keyword.toLowerCase())))

  function exportCsv() {
    const csv = ['时间,模块,动作,操作人,对象,详情', ...visible.map(item => [dateText(item.createdAt), item.module, item.action, item.operator, item.target, item.detail].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'operation-logs.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm font-semibold text-[var(--accent)]">OPERATION TIMELINE</p><h1 className="mt-2 text-4xl font-bold tracking-tight">操作日志</h1><p className="mt-3 text-muted-foreground">记录管理员创建面试、修改用户、导入题库等关键动作，便于演示审计能力。</p></div>
      <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />导出 CSV</Button>
    </header>
    <Card className="mt-7 p-0">
      <div className="border-b border-border p-5"><label className="flex h-12 max-w-xl items-center gap-2 rounded-full border border-border bg-surface px-4"><Search className="h-4 w-4 text-muted-foreground" /><input value={keyword} onChange={event => setKeyword(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="搜索模块、动作、对象或操作人" /></label></div>
      <div className="divide-y divide-border">{visible.map(item => <article key={item.id} className="flex gap-4 px-5 py-4"><span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><History className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{item.action}</strong><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.module}</span><span className="text-xs text-muted-foreground">{dateText(item.createdAt)}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.detail}</p><p className="mt-1 text-xs text-muted-foreground">操作人：{item.operator} · 对象：{item.target}</p></div></article>)}{!visible.length && <p className="p-12 text-center text-sm text-muted-foreground">暂无操作日志。</p>}</div>
    </Card>
  </div>
}
