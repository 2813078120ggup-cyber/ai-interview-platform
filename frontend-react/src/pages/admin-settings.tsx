import { CheckCircle2, Database, Edit3, Eye, EyeOff, KeyRound, Mic2, Plus, Radio, Save, Server, Settings2, Sparkles, Trash2, Video, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

const storageKey = 'admin-ai-provider-settings-v1'
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

const defaults: Provider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    code: 'deepseek',
    kind: 'llm',
    baseUrl: 'https://api.deepseek.com',
    chatModel: 'deepseek-chat',
    voiceModel: '不支持',
    avatarModel: '不支持',
    apiKey: 'sk-************',
    apiSecret: '',
    appId: '',
    enabled: true,
    textDefault: true,
    voiceDefault: false,
    remark: '当前 AI 面试官的大模型服务，负责提问、追问、评分和报告总结。',
  },
  {
    id: 'xf-virtual-human',
    name: '讯飞虚拟人',
    code: 'xunfei-virtual-human',
    kind: 'virtual-human',
    baseUrl: 'https://virtual-man.xfyun.cn',
    chatModel: 'DeepSeek 生成文本',
    voiceModel: '讯飞 TTS',
    avatarModel: '虚拟人形象 ID 待配置',
    apiKey: '',
    apiSecret: '',
    appId: '',
    enabled: false,
    textDefault: false,
    voiceDefault: true,
    remark: '用于把 AI 面试官的问题转成数字人播报和虚拟形象交互。',
  },
  {
    id: 'browser-speech',
    name: '浏览器语音',
    code: 'browser-speech',
    kind: 'speech',
    baseUrl: 'Web Speech API',
    chatModel: '不支持',
    voiceModel: 'speechSynthesis / SpeechRecognition',
    avatarModel: '不支持',
    apiKey: '',
    apiSecret: '',
    appId: '',
    enabled: true,
    textDefault: false,
    voiceDefault: false,
    remark: '本地浏览器语音朗读和语音识别兜底方案，无需服务端密钥。',
  },
  {
    id: 'whisper-compatible',
    name: '语音识别服务',
    code: 'asr-provider',
    kind: 'asr',
    baseUrl: '待配置',
    chatModel: '不支持',
    voiceModel: 'ASR',
    avatarModel: '不支持',
    apiKey: '',
    apiSecret: '',
    appId: '',
    enabled: false,
    textDefault: false,
    voiceDefault: false,
    remark: '用于候选人语音回答转文字，可后续接讯飞听写或其他 ASR 服务。',
  },
]

const kindMap: Record<ProviderKind, { label: string; icon: typeof Server; tone: 'success' | 'info' | 'warning' | 'default' }> = {
  llm: { label: '大模型', icon: Sparkles, tone: 'success' },
  'virtual-human': { label: '虚拟人', icon: Video, tone: 'info' },
  speech: { label: '浏览器语音', icon: Mic2, tone: 'default' },
  asr: { label: '语音识别', icon: Radio, tone: 'warning' },
  tts: { label: '语音合成', icon: Mic2, tone: 'info' },
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `provider-${Date.now()}`
}

function loadProviders() {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as Provider[] : defaults
  } catch {
    return defaults
  }
}

function saveProviders(items: Provider[]) {
  localStorage.setItem(storageKey, JSON.stringify(items))
}

function maskSecret(value: string) {
  if (!value) return '未配置'
  if (value.includes('*')) return value
  if (value.length <= 8) return `${value.slice(0, 1)}***${value.slice(-1)}`
  return `${value.slice(0, 4)}****${value.slice(-4)}`
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

function Field({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [visible, setVisible] = useState(false)
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm">
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate font-semibold">{secret && !visible ? maskSecret(value) : value || '未配置'}</span>
    {secret && value && <button type="button" onClick={() => setVisible(!visible)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={visible ? '隐藏密钥' : '查看密钥'}>
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>}
  </div>
}

export function AdminSettings() {
  const [items, setItems] = useState<Provider[]>(() => loadProviders())
  const [editing, setEditing] = useState<Provider | null>(null)
  const [message, setMessage] = useState('')
  const enabledCount = items.filter(item => item.enabled).length
  const textDefault = items.find(item => item.textDefault)
  const voiceDefault = items.find(item => item.voiceDefault)

  const groups = useMemo(() => [
    ['模型服务', items.filter(item => item.kind === 'llm')],
    ['虚拟人与语音', items.filter(item => item.kind !== 'llm')],
  ] as const, [items])

  function persist(next: Provider[], action: string, target: string) {
    setItems(next)
    saveProviders(next)
    recordAuditLog({
      module: '系统设置',
      action,
      operator: profile()?.realName ?? '管理员',
      target,
      detail: `配置项 ${target} 已更新。`,
    })
  }

  function openCreate() {
    setEditing({ ...emptyProvider, id: newId() })
  }

  function submit() {
    if (!editing) return
    if (!editing.name.trim() || !editing.code.trim()) {
      setMessage('请填写 Provider 名称和编码。')
      return
    }
    const existed = items.some(item => item.id === editing.id)
    const next = existed ? items.map(item => item.id === editing.id ? editing : item) : [editing, ...items]
    persist(next, existed ? '编辑配置' : '新增配置', editing.name)
    setEditing(null)
    setMessage(existed ? '配置已保存。' : 'Provider 已新增。')
  }

  function remove(item: Provider) {
    if (!window.confirm(`确定删除 ${item.name} 配置吗？`)) return
    persist(items.filter(current => current.id !== item.id), '删除配置', item.name)
    setMessage(`${item.name} 已删除。`)
  }

  function patch(id: string, updater: (item: Provider) => Provider, action: string) {
    const target = items.find(item => item.id === id)
    if (!target) return
    const next = items.map(item => item.id === id ? updater(item) : item)
    persist(next, action, target.name)
  }

  function setDefault(id: string, type: 'text' | 'voice') {
    const target = items.find(item => item.id === id)
    if (!target) return
    const next = items.map(item => ({
      ...item,
      textDefault: type === 'text' ? item.id === id : item.textDefault,
      voiceDefault: type === 'voice' ? item.id === id : item.voiceDefault,
    }))
    persist(next, type === 'text' ? '设置文字默认模型' : '设置语音默认模型', target.name)
    setMessage(`${target.name} 已设为${type === 'text' ? '文字' : '语音'}默认 Provider。`)
  }

  function testProvider(item: Provider) {
    setMessage(`${item.name} 测试请求已模拟完成。接入后端后这里会调用真实连通性检测接口。`)
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
          <p className="mt-3 max-w-2xl text-muted-foreground">集中管理大模型、虚拟人、语音识别和语音朗读配置。密钥仅脱敏展示，避免在前端泄露真实敏感信息。</p>
        </div>
      </div>
      <Button onClick={openCreate}><Plus className="h-4 w-4" />新增 Provider</Button>
    </header>

    {message && <div className="mt-6 flex items-center justify-between rounded-[22px] border border-border bg-[var(--accent-soft)] px-5 py-4 text-sm text-[var(--accent)]">
      <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{message}</span>
      <button onClick={() => setMessage('')} className="rounded-full p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
    </div>}

    <div className="mt-7 grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-muted-foreground">已启用 Provider</p><strong className="mt-3 block text-3xl">{enabledCount}</strong><p className="mt-2 text-xs text-muted-foreground">禁用后不会作为新面试服务来源</p></Card>
      <Card><p className="text-sm text-muted-foreground">文字默认模型</p><strong className="mt-3 block truncate text-2xl">{textDefault?.name ?? '未设置'}</strong><p className="mt-2 text-xs text-muted-foreground">{textDefault?.chatModel ?? '用于 AI 提问、追问、评分'}</p></Card>
      <Card><p className="text-sm text-muted-foreground">语音/虚拟人默认</p><strong className="mt-3 block truncate text-2xl">{voiceDefault?.name ?? '未设置'}</strong><p className="mt-2 text-xs text-muted-foreground">{voiceDefault?.voiceModel ?? '用于朗读、ASR 或数字人播报'}</p></Card>
    </div>

    <div className="mt-8 space-y-9">
      {groups.map(([title, providers]) => <section key={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <span className="text-sm text-muted-foreground">{providers.length} 个配置</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {providers.map((item, index) => {
            const meta = kindMap[item.kind]
            const Icon = meta.icon
            const supportsTextDefault = canBeTextDefault(item)
            const supportsVoiceDefault = canBeVoiceDefault(item)
            const testable = canTestProvider(item)
            const deleteReason = defaultDeleteReason(item)
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
                <Field label="聊天模型" value={item.chatModel} />
                <Field label="语音模型" value={item.voiceModel} />
                <Field label="虚拟人形象" value={item.avatarModel} />
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
                    disabled={!testable}
                    title={!item.enabled ? '请先启用 Provider 后再测试。' : !testable ? '请先配置 Base URL 或服务地址。' : '测试当前 Provider 连通性'}
                    onClick={() => testProvider(item)}
                  ><Radio className="h-4 w-4" />测试</Button>
                  <Button
                    variant={item.enabled ? 'secondary' : 'primary'}
                    className="h-10 px-4"
                    onClick={() => patch(item.id, current => ({ ...current, enabled: !current.enabled }), item.enabled ? '停用配置' : '启用配置')}
                  >{item.enabled ? '停用' : '启用'}</Button>
                  {supportsTextDefault && <Button
                    variant="secondary"
                    className="h-10 px-4"
                    disabled={!item.enabled || item.textDefault}
                    title={!item.enabled ? '请先启用 Provider。' : item.textDefault ? '当前已经是文字默认 Provider。' : '设为 AI 面试官文字大模型'}
                    onClick={() => setDefault(item.id, 'text')}
                  ><Database className="h-4 w-4" />{item.textDefault ? '文字默认' : '设为文字'}</Button>}
                  {supportsVoiceDefault && <Button
                    variant="secondary"
                    className="h-10 px-4"
                    disabled={!item.enabled || item.voiceDefault}
                    title={!item.enabled ? '请先启用 Provider。' : item.voiceDefault ? '当前已经是语音默认 Provider。' : '设为朗读、语音识别或虚拟人默认服务'}
                    onClick={() => setDefault(item.id, 'voice')}
                  ><Mic2 className="h-4 w-4" />{item.voiceDefault ? '语音默认' : '设为语音'}</Button>}
                  <Button
                    variant="secondary"
                    className="h-10 px-4 text-[var(--danger-foreground)] hover:border-[var(--danger-foreground)] hover:bg-[var(--danger)]"
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
    </div>

    {editing && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-3xl rounded-[30px] bg-surface p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">PROVIDER CONFIG</p>
            <h2 className="mt-1 text-2xl font-bold">{items.some(item => item.id === editing.id) ? '编辑配置' : '新增 Provider'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">正式上线时建议由后端加密保存密钥，前端只负责录入和脱敏展示。</p>
          </div>
          <button onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-semibold">Provider 名称<input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">Provider 编码<input value={editing.code} onChange={event => setEditing({ ...editing, code: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">类型<select value={editing.kind} onChange={event => setEditing({ ...editing, kind: event.target.value as ProviderKind })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]">
            {Object.entries(kindMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select></label>
          <label className="block text-sm font-semibold">Base URL<input value={editing.baseUrl} onChange={event => setEditing({ ...editing, baseUrl: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">聊天模型<input value={editing.chatModel} onChange={event => setEditing({ ...editing, chatModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">语音模型<input value={editing.voiceModel} onChange={event => setEditing({ ...editing, voiceModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">虚拟人形象 / Avatar ID<input value={editing.avatarModel} onChange={event => setEditing({ ...editing, avatarModel: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">APP ID<input value={editing.appId} onChange={event => setEditing({ ...editing, appId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">API Key<input value={editing.apiKey} onChange={event => setEditing({ ...editing, apiKey: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="block text-sm font-semibold">API Secret<input value={editing.apiSecret} onChange={event => setEditing({ ...editing, apiSecret: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="md:col-span-2 block text-sm font-semibold">说明<textarea value={editing.remark} onChange={event => setEditing({ ...editing, remark: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background p-4 font-normal outline-none focus:border-[var(--accent)]" /></label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 rounded-[22px] border border-border bg-background/60 p-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.enabled} onChange={event => setEditing({ ...editing, enabled: event.target.checked })} />启用 Provider</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.textDefault} onChange={event => setEditing({ ...editing, textDefault: event.target.checked })} />文字默认</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.voiceDefault} onChange={event => setEditing({ ...editing, voiceDefault: event.target.checked })} />语音默认</label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditing(null)}>取消</Button>
          <Button onClick={submit}><Save className="h-4 w-4" />保存配置</Button>
        </div>
      </div>
    </div>}
  </div>
}
