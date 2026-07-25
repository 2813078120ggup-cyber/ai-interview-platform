import { CheckCircle2, Database, Edit3, Eye, EyeOff, KeyRound, Loader2, Mic2, Plus, Radio, Server, Settings2, Sparkles, Trash2, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request } from '@/lib/api'
import { recordAuditLog } from '@/lib/audit-log'
import { profile } from '@/lib/session'

type ProviderKind = 'llm' | 'virtual-human' | 'speech' | 'asr' | 'tts'
type Provider = {
  id: string
  name: string
  code: string
  kind: ProviderKind
  baseUrl: string
  chatModel: string
  voiceModel: string
  avatarModel: string
  apiKey: string
  apiSecret: string
  appId: string
  enabled: boolean
  textDefault: boolean
  voiceDefault: boolean
  remark: string
}

type ProviderTestResult = {
  success: boolean
  statusCode: number | null
  latencyMs: number
  message: string
}

const emptyProvider: Provider = {
  id: '',
  name: '',
  code: '',
  kind: 'llm',
  baseUrl: '',
  chatModel: '',
  voiceModel: '',
  avatarModel: '',
  apiKey: '',
  apiSecret: '',
  appId: '',
  enabled: true,
  textDefault: false,
  voiceDefault: false,
  remark: '',
}

const kindMap: Record<ProviderKind, { label: string; icon: typeof Server; tone: 'success' | 'info' | 'warning' | 'default' }> = {
  llm: { label: '大模型', icon: Sparkles, tone: 'success' },
  'virtual-human': { label: '虚拟人', icon: Video, tone: 'info' },
  speech: { label: '浏览器语音', icon: Mic2, tone: 'default' },
  asr: { label: '语音识别', icon: Radio, tone: 'warning' },
  tts: { label: '语音合成', icon: Mic2, tone: 'info' },
}

function canBeTextDefault(item: Provider) {
  return item.kind === 'llm'
}

function canBeVoiceDefault(item: Provider) {
  return item.kind === 'virtual-human' || item.kind === 'speech' || item.kind === 'asr' || item.kind === 'tts'
}

function canTestProvider(item: Provider) {
  if (!item.enabled) return false
  if (item.kind === 'speech') return true
  return Boolean(item.baseUrl.trim()) && item.baseUrl !== '待配置'
}

function defaultDeleteReason(item: Provider) {
  if (item.textDefault) return '当前是文字默认 Provider，请先切换默认项后再删除。'
  if (item.voiceDefault) return '当前是语音默认 Provider，请先切换默认项后再删除。'
  return ''
}

function secretLabel(value: string) {
  return value || '未配置'
}

function providerLabels(kind: ProviderKind) {
  if (kind === 'virtual-human') {
    return {
      chatModel: '接口服务 ID',
      voiceModel: '发音人 / 音色',
      avatarModel: '虚拟人形象 ID',
      baseUrlHint: '例如：https://vms.cn-huadong-1.xf-yun.com',
    }
  }
  if (kind === 'asr') return { chatModel: '聊天模型', voiceModel: '语音识别模型', avatarModel: '虚拟人形象', baseUrlHint: '' }
  if (kind === 'tts') return { chatModel: '聊天模型', voiceModel: '语音合成模型', avatarModel: '虚拟人形象', baseUrlHint: '' }
  return { chatModel: '聊天模型', voiceModel: '语音模型', avatarModel: '虚拟人形象', baseUrlHint: '' }
}

function Field({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [visible, setVisible] = useState(false)
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm">
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate font-semibold">{secret && !visible ? secretLabel(value) : value || '未配置'}</span>
    {secret && value && <button type="button" onClick={() => setVisible(!visible)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={visible ? '隐藏密钥' : '查看密钥'}>
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>}
  </div>
}

export function AdminSettings() {
  const [items, setItems] = useState<Provider[]>([])
  const [editing, setEditing] = useState<Provider | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState('')

  const enabledCount = items.filter(item => item.enabled).length
  const textDefault = items.find(item => item.textDefault)
  const voiceDefault = items.find(item => item.voiceDefault)
  const groups = useMemo(() => [
    ['模型服务', items.filter(item => item.kind === 'llm')],
    ['虚拟人与语音', items.filter(item => item.kind !== 'llm')],
  ] as const, [items])

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const data = await request<Provider[]>('/v1/admin/ai-providers')
      setItems(data.map(item => ({ ...item, id: String(item.id) })))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '配置加载失败')
    } finally {
      setLoading(false)
    }
  }

  function audit(action: string, target: string) {
    recordAuditLog({
      module: '系统设置',
      action,
      operator: profile()?.realName ?? '管理员',
      target,
      detail: `配置项 ${target} 已更新。`,
    })
  }

  async function submit() {
    if (!editing || saving) return
    if (!editing.name.trim() || !editing.code.trim()) {
      setMessage('请填写 Provider 名称和编码。')
      return
    }
    setSaving(true)
    try {
      const existed = items.some(item => item.id === editing.id)
      const path = existed ? `/v1/admin/ai-providers/${editing.id}` : '/v1/admin/ai-providers'
      const saved = await request<Provider>(path, { method: existed ? 'PUT' : 'POST', body: JSON.stringify(editing) })
      setItems(previous => existed ? previous.map(item => item.id === editing.id ? { ...saved, id: String(saved.id) } : item) : [{ ...saved, id: String(saved.id) }, ...previous])
      audit(existed ? '编辑配置' : '新增配置', editing.name)
      setEditing(null)
      setMessage(existed ? '配置已保存，并已写入数据库。' : 'Provider 已新增，并已写入数据库。')
      void refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function updateProvider(item: Provider, patch: Partial<Provider>, action: string) {
    try {
      const next = { ...item, ...patch }
      const saved = await request<Provider>(`/v1/admin/ai-providers/${item.id}`, { method: 'PUT', body: JSON.stringify(next) })
      setItems(previous => previous.map(current => current.id === item.id ? { ...saved, id: String(saved.id) } : current))
      audit(action, item.name)
      setMessage(`${item.name} 已更新。`)
      void refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function remove(item: Provider) {
    if (!window.confirm(`确定删除 ${item.name} 配置吗？删除后需要重新录入密钥。`)) return
    try {
      await request(`/v1/admin/ai-providers/${item.id}`, { method: 'DELETE' })
      setItems(previous => previous.filter(current => current.id !== item.id))
      audit('删除配置', item.name)
      setMessage(`${item.name} 已删除。`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败')
    }
  }

  async function testProvider(item: Provider) {
    setTestingId(item.id)
    try {
      const result = await request<ProviderTestResult>(`/v1/admin/ai-providers/${item.id}/test`, { method: 'POST' })
      const statusText = result.statusCode ? `HTTP ${result.statusCode} · ` : ''
      setMessage(`${item.name}：${result.success ? '测试通过' : '测试未通过'}，${statusText}${result.latencyMs}ms。${result.message}`)
      audit('测试配置', item.name)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '连通性测试失败')
    } finally {
      setTestingId('')
    }
  }

  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-[22px] bg-[linear-gradient(135deg,var(--brand),var(--brand-pink))] text-white shadow-[0_18px_42px_rgba(109,93,252,.25)]">
          <Settings2 className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">SYSTEM SETTINGS</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">系统设置</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">集中管理大模型、虚拟人、语音识别和语音朗读配置。密钥由后端加密保存，前端仅展示脱敏状态。</p>
        </div>
      </div>
      <Button onClick={() => setEditing({ ...emptyProvider })}><Plus className="h-4 w-4" />新增 Provider</Button>
    </header>

    {message && <div className="mt-6 flex items-center justify-between rounded-[22px] border border-border bg-[var(--accent-soft)] px-5 py-4 text-sm text-[var(--accent)]">
      <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{message}</span>
      <button onClick={() => setMessage('')} className="rounded-full p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
    </div>}

    <div className="mt-7 grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-muted-foreground">已启用 Provider</p><strong className="mt-3 block text-3xl">{loading ? '…' : enabledCount}</strong><p className="mt-2 text-xs text-muted-foreground">禁用后不会作为新面试服务来源</p></Card>
      <Card><p className="text-sm text-muted-foreground">文字默认模型</p><strong className="mt-3 block truncate text-2xl">{textDefault?.name ?? '未设置'}</strong><p className="mt-2 text-xs text-muted-foreground">{textDefault?.chatModel ?? '用于 AI 提问、追问、评分'}</p></Card>
      <Card><p className="text-sm text-muted-foreground">语音/虚拟人默认</p><strong className="mt-3 block truncate text-2xl">{voiceDefault?.name ?? '未设置'}</strong><p className="mt-2 text-xs text-muted-foreground">{voiceDefault?.voiceModel ?? '用于朗读、ASR 或数字人播报'}</p></Card>
    </div>

    {loading ? <Card className="mt-8 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" />正在加载系统配置…</Card> : <div className="mt-8 space-y-9">
      {groups.map(([title, providers]) => <section key={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <span className="text-sm text-muted-foreground">{providers.length} 个配置</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {providers.map((item, index) => {
            const meta = kindMap[item.kind]
            const Icon = meta.icon
            const testable = canTestProvider(item)
            const deleteReason = defaultDeleteReason(item)
            const labels = providerLabels(item.kind)
            return <Card key={item.id} motionDelay={index * .04} className="p-0">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Badge tone={item.enabled ? 'success' : 'default'}>{item.enabled ? '已启用' : '已停用'}</Badge>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {item.textDefault && <Badge tone="info">文字默认</Badge>}
                  {item.voiceDefault && <Badge tone="warning">语音默认</Badge>}
                </div>
              </div>

              <div className="space-y-2 border-y border-border bg-background/45 p-5">
                <Field label="Base URL" value={item.baseUrl} />
                <Field label={labels.chatModel} value={item.chatModel} />
                <Field label={labels.voiceModel} value={item.voiceModel} />
                <Field label={labels.avatarModel} value={item.avatarModel} />
                <Field label="APP ID" value={item.appId} secret />
                <Field label="API Key" value={item.apiKey} secret />
                <Field label="API Secret" value={item.apiSecret} secret />
              </div>

              <div className="p-5">
                <p className="min-h-10 text-sm leading-6 text-muted-foreground">{item.remark || '暂无说明。'}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button variant="secondary" className="h-10 px-4" onClick={() => setEditing(item)}><Edit3 className="h-4 w-4" />编辑</Button>
                  <Button
                    variant="secondary"
                    className="h-10 px-4"
                    disabled={!testable || testingId === item.id}
                    title={!item.enabled ? '请先启用 Provider 后再测试。' : !testable ? '请先配置 Base URL 或服务地址。' : '测试当前 Provider 连通性'}
                    onClick={() => testProvider(item)}
                  >{testingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}测试</Button>
                  <Button
                    variant={item.enabled ? 'secondary' : 'primary'}
                    className="h-10 px-4"
                    onClick={() => updateProvider(item, { enabled: !item.enabled }, item.enabled ? '停用配置' : '启用配置')}
                  >{item.enabled ? '停用' : '启用'}</Button>
                  {canBeTextDefault(item) && <Button
                    variant="secondary"
                    className="h-10 px-4"
                    disabled={!item.enabled || item.textDefault}
                    onClick={() => updateProvider(item, { textDefault: true }, '设置文字默认模型')}
                  ><Database className="h-4 w-4" />{item.textDefault ? '文字默认' : '设为文字'}</Button>}
                  {canBeVoiceDefault(item) && <Button
                    variant="secondary"
                    className="h-10 px-4"
                    disabled={!item.enabled || item.voiceDefault}
                    onClick={() => updateProvider(item, { voiceDefault: true }, '设置语音默认模型')}
                  ><Mic2 className="h-4 w-4" />{item.voiceDefault ? '语音默认' : '设为语音'}</Button>}
                  <Button
                    variant="secondary"
                    className="h-10 px-4 text-rose-700 hover:border-rose-200 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
                    disabled={Boolean(deleteReason)}
                    title={deleteReason || '删除当前 Provider 配置'}
                    onClick={() => remove(item)}
                  ><Trash2 className="h-4 w-4" />删除</Button>
                </div>
              </div>
            </Card>
          })}
        </div>
      </section>)}
    </div>}

    {editing && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-3xl rounded-[30px] bg-surface p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">PROVIDER CONFIG</p>
            <h2 className="mt-1 text-2xl font-bold">{editing.id ? '编辑配置' : '新增 Provider'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">保存后配置会写入数据库。若密钥输入框保留星号脱敏值，后端会自动沿用原密钥。</p>
          </div>
          <button onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-semibold">Provider 名称<input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">Provider 编码<input value={editing.code} onChange={event => setEditing({ ...editing, code: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">类型<select value={editing.kind} onChange={event => setEditing({ ...editing, kind: event.target.value as ProviderKind })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]">
            {Object.entries(kindMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select></label>
          <label className="block text-sm font-semibold">Base URL<input value={editing.baseUrl} placeholder={providerLabels(editing.kind).baseUrlHint} onChange={event => setEditing({ ...editing, baseUrl: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">{providerLabels(editing.kind).chatModel}<input value={editing.chatModel} onChange={event => setEditing({ ...editing, chatModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">{providerLabels(editing.kind).voiceModel}<input value={editing.voiceModel} onChange={event => setEditing({ ...editing, voiceModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">{providerLabels(editing.kind).avatarModel}<input value={editing.avatarModel} onChange={event => setEditing({ ...editing, avatarModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">APP ID<input value={editing.appId} onChange={event => setEditing({ ...editing, appId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">API Key<input value={editing.apiKey} onChange={event => setEditing({ ...editing, apiKey: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">API Secret<input value={editing.apiSecret} onChange={event => setEditing({ ...editing, apiSecret: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
        </div>
        <label className="mt-5 block text-sm font-semibold">配置说明<textarea value={editing.remark} onChange={event => setEditing({ ...editing, remark: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-[var(--accent)]" /></label>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.enabled} onChange={event => setEditing({ ...editing, enabled: event.target.checked })} />启用 Provider</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.textDefault} disabled={!canBeTextDefault(editing)} onChange={event => setEditing({ ...editing, textDefault: event.target.checked })} />文字默认</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.voiceDefault} disabled={!canBeVoiceDefault(editing)} onChange={event => setEditing({ ...editing, voiceDefault: event.target.checked })} />语音默认</label>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" disabled={saving} onClick={() => setEditing(null)}>取消</Button>
          <Button disabled={saving} onClick={() => void submit()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}保存配置</Button>
        </div>
      </div>
    </div>}
  </div>
}
