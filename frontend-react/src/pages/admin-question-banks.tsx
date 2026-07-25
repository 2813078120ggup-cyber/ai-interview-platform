import { BookOpen, Download, Plus, Search, UploadCloud, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { recordAuditLog } from '@/lib/audit-log'
import { request } from '@/lib/api'
import { profile } from '@/lib/session'

type Bank = { id: string; bankCode: string; name: string; description?: string; visibility: number; status: number }
type Page<T> = { records: T[]; total: number }
type ImportQuestion = { questionType: string; difficulty: number; content: string; options: string; correctAnswer: string; answerTemplate: string; explanation: string; tags: string; score: number; source: string; sortOrder: number; status: number }

const visibilityText = (value: number) => value === 2 ? '练习可见' : value === 1 ? '内部可见' : '仅管理端'
const emptyQuestion = (index = 0): ImportQuestion => ({ questionType: 'short_answer', difficulty: 2, content: '', options: '', correctAnswer: '', answerTemplate: '', explanation: '', tags: '', score: 10, source: 'excel_import', sortOrder: index, status: 1 })
const typeMap: Record<string, string> = { 单选: 'single_choice', 单选题: 'single_choice', 多选: 'multiple_choice', 多选题: 'multiple_choice', 判断: 'true_false', 判断题: 'true_false', 简答: 'short_answer', 简答题: 'short_answer', 编程: 'coding', 编程题: 'coding' }
const headerMap: Record<string, keyof ImportQuestion> = { questiontype: 'questionType', type: 'questionType', 题型: 'questionType', difficulty: 'difficulty', 难度: 'difficulty', content: 'content', 题目: 'content', 题目内容: 'content', options: 'options', 选项: 'options', correctanswer: 'correctAnswer', 正确答案: 'correctAnswer', answertemplate: 'answerTemplate', 参考答案: 'answerTemplate', explanation: 'explanation', 解析: 'explanation', tags: 'tags', 标签: 'tags', score: 'score', 分值: 'score' }

function splitLine(line: string, separator: string) {
  const result: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') quoted = !quoted
    else if (char === separator && !quoted) { result.push(value.trim()); value = '' }
    else value += char
  }
  result.push(value.trim())
  return result.map(item => item.replace(/^"|"$/g, '').replaceAll('""', '"'))
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const separator = lines[0].includes('\t') ? '\t' : ','
  const headers = splitLine(lines[0], separator).map(item => headerMap[item.trim().toLowerCase()] ?? headerMap[item.trim()])
  return lines.slice(1).map((line, index) => {
    const question = emptyQuestion(index)
    splitLine(line, separator).forEach((cell, cellIndex) => {
      const key = headers[cellIndex]
      if (!key) return
      if (key === 'difficulty' || key === 'score' || key === 'sortOrder' || key === 'status') (question as Record<string, string | number>)[key] = Number(cell) || Number((question as Record<string, string | number>)[key])
      else if (key === 'questionType') question.questionType = typeMap[cell.trim()] ?? (cell.trim().toLowerCase().replaceAll('-', '_') || 'short_answer')
      else (question as Record<string, string | number>)[key] = cell
    })
    return question
  }).filter(item => item.content.trim())
}

function downloadTemplate() {
  const csv = ['questionType,difficulty,content,options,correctAnswer,answerTemplate,explanation,tags,score', 'short_answer,2,"请说明 HashMap 在 JDK 8 中的扩容机制。","","","从数组、链表/红黑树和扩容迁移说明。","考察集合底层原理","Java,集合",15'].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'question-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminQuestionBanks() {
  const [items, setItems] = useState<Bank[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [bankId, setBankId] = useState('')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportQuestion[]>([])
  const [form, setForm] = useState({ bankCode: '', name: '', description: '', visibility: 0, status: 1 })

  async function load(nextKeyword = keyword) {
    setLoading(true)
    try {
      const page = await request<Page<Bank>>(`/v1/question-banks?pageNo=1&pageSize=100&keyword=${encodeURIComponent(nextKeyword)}${status ? `&status=${status}` : ''}`)
      setItems(page.records)
      setError('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : '无法加载题库') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load('') }, [status])
  const visible = useMemo(() => items.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()) || item.bankCode.toLowerCase().includes(keyword.toLowerCase())), [items, keyword])

  async function create() {
    if (!form.bankCode.trim() || !form.name.trim()) { setError('请填写题库编码和题库名称'); return }
    setSaving(true)
    try {
      const bank = await request<Bank>('/v1/question-banks', { method: 'POST', body: JSON.stringify(form) })
      recordAuditLog({ module: '题库管理', action: '创建题库', operator: profile()?.realName ?? '管理员', target: bank.name, detail: `创建题库 ${bank.bankCode}` })
      setItems(previous => [bank, ...previous]); setDialog(false); setForm({ bankCode: '', name: '', description: '', visibility: 0, status: 1 })
    } catch (reason) { setError(reason instanceof Error ? reason.message : '创建题库失败') }
    finally { setSaving(false) }
  }

  async function handleFile(file?: File) {
    if (!file) return
    setFileName(file.name); setPreview([])
    if (/\.(xlsx|xls)$/i.test(file.name)) { setError('当前前端支持 CSV/TSV 直接解析。Excel 文件请先另存为 CSV 后导入。'); return }
    const parsed = parseCsv(await file.text())
    if (!parsed.length) setError('没有解析到有效题目，请确认表头包含 content/题目内容。')
    else { setPreview(parsed); setError('') }
  }

  async function submitImport() {
    if (!bankId) { setError('请选择要导入的题库'); return }
    if (!preview.length) { setError('请先上传并预览题目文件'); return }
    setImporting(true)
    try {
      for (const [index, question] of preview.entries()) await request(`/v1/question-banks/${bankId}/questions`, { method: 'POST', body: JSON.stringify({ ...question, sortOrder: index }) })
      const bank = items.find(item => item.id === bankId)
      recordAuditLog({ module: '题库管理', action: '批量导入题目', operator: profile()?.realName ?? '管理员', target: bank?.name ?? bankId, detail: `从 ${fileName || '表格文件'} 导入 ${preview.length} 道题` })
      setImportOpen(false); setPreview([]); setFileName(''); setBankId('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : '导入题目失败') }
    finally { setImporting(false) }
  }

  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">QUESTION OPS</p><h1 className="mt-2 text-4xl font-bold tracking-tight">题库管理</h1><p className="mt-3 max-w-2xl text-muted-foreground">按岗位和技术域管理题库资产，支持模板下载、批量导入和题目维护。</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={downloadTemplate}><Download className="h-4 w-4" />下载模板</Button><Button variant="secondary" onClick={() => setImportOpen(true)}><UploadCloud className="h-4 w-4" />批量导入</Button><Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" />新建题库</Button></div></header>
    {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <Card className="mt-7 p-0"><div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row"><label className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4"><Search className="h-4 w-4 text-muted-foreground" /><input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => event.key === 'Enter' && void load()} className="w-full bg-transparent text-sm outline-none" placeholder="搜索题库名称或编码" /></label><select value={status} onChange={event => setStatus(event.target.value)} className="h-12 rounded-full border border-border bg-surface px-4 text-sm"><option value="">全部状态</option><option value="1">已启用</option><option value="0">已停用</option></select><Button variant="secondary" onClick={() => void load()}>搜索</Button></div>{loading ? <p className="p-12 text-center text-sm text-muted-foreground">正在加载题库…</p> : <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((item, index) => <Card key={item.id} motionDelay={index * .03}><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--accent)]"><BookOpen className="h-5 w-5" /></span><Badge tone={item.status === 1 ? 'success' : 'default'}>{item.status === 1 ? '已启用' : '已停用'}</Badge></div><p className="mt-6 text-xs font-semibold tracking-wide text-[var(--accent)]">{item.bankCode}</p><h3 className="mt-1 text-xl font-bold">{item.name}</h3><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">{item.description || '暂未添加题库说明'}</p><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">{visibilityText(item.visibility)}</span><Link to={`/admin/question-banks/${item.id}`} className="text-sm font-semibold text-[var(--accent)] hover:text-foreground">维护题目 →</Link></div></Card>)}{!visible.length && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">暂未找到题库</p>}</div>}</Card>
    {dialog && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"><div className="mx-auto my-10 max-w-lg rounded-[30px] bg-surface p-7 shadow-2xl"><div className="flex justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">NEW QUESTION BANK</p><h2 className="mt-1 text-2xl font-bold">新建题库</h2></div><button onClick={() => setDialog(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-5"><label className="block text-sm font-semibold">题库编码<input value={form.bankCode} onChange={event => setForm({ ...form, bankCode: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label><label className="block text-sm font-semibold">题库名称<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label><label className="block text-sm font-semibold">题库说明<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background p-4 font-normal outline-none focus:border-[var(--accent)]" /></label><label className="block text-sm font-semibold">可见范围<select value={form.visibility} onChange={event => setForm({ ...form, visibility: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal"><option value={0}>仅管理端</option><option value={1}>内部可见</option><option value={2}>候选人练习可见</option></select></label></div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDialog(false)}>取消</Button><Button disabled={saving} onClick={() => void create()}>{saving ? '创建中…' : '创建题库'}</Button></div></div></div>}
    {importOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-w-5xl rounded-[30px] bg-surface p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">EXCEL IMPORT</p><h2 className="mt-1 text-2xl font-bold">题库批量导入</h2><p className="mt-2 text-sm text-muted-foreground">CSV/TSV 可直接解析预览，Excel 请先另存为 CSV。</p></div><button onClick={() => setImportOpen(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]"><Card className="bg-[var(--accent-soft)]"><h3 className="font-bold">导入设置</h3><label className="mt-5 block text-sm font-semibold">目标题库<select value={bankId} onChange={event => setBankId(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border bg-surface px-4 font-normal"><option value="">选择题库</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}（{item.bankCode}）</option>)}</select></label><label className="mt-5 grid min-h-32 cursor-pointer place-items-center rounded-[22px] border border-dashed border-[var(--accent)] bg-surface/60 p-5 text-center text-sm"><input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" className="hidden" onChange={event => void handleFile(event.target.files?.[0])} /><UploadCloud className="mb-3 h-7 w-7 text-[var(--accent)]" /><span className="font-semibold">{fileName || '点击选择题目文件'}</span><span className="mt-1 text-xs text-muted-foreground">建议使用下载模板填写</span></label><Button variant="secondary" className="mt-5 w-full" onClick={downloadTemplate}>下载模板</Button></Card><Card className="p-0"><div className="flex items-center justify-between border-b border-border p-5"><div><h3 className="font-bold">导入预览</h3><p className="mt-1 text-sm text-muted-foreground">已解析 {preview.length} 道题。</p></div><Button disabled={importing || !preview.length} onClick={() => void submitImport()}>{importing ? '导入中…' : '提交导入'}</Button></div><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 border-b border-border bg-surface text-xs text-muted-foreground"><tr><th className="px-4 py-3">题型</th><th className="px-4 py-3">难度</th><th className="px-4 py-3">题目内容</th><th className="px-4 py-3">标签</th><th className="px-4 py-3">分值</th></tr></thead><tbody>{preview.slice(0, 80).map((item, index) => <tr key={index} className="border-b border-border/70"><td className="px-4 py-3"><Badge tone="info">{item.questionType}</Badge></td><td className="px-4 py-3">{item.difficulty}</td><td className="max-w-xl px-4 py-3 leading-6">{item.content}</td><td className="px-4 py-3 text-muted-foreground">{item.tags || '-'}</td><td className="px-4 py-3">{item.score}</td></tr>)}{!preview.length && <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">上传模板文件后会在这里预览。</td></tr>}</tbody></table></div></Card></div></div></div>}
  </div>
}
