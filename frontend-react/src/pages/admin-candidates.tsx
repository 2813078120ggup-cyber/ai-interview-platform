import { Eye, Plus, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { recordAuditLog } from '@/lib/audit-log'
import { request } from '@/lib/api'
import { profile } from '@/lib/session'

type User = { id: string; username: string; realName: string; email?: string; phone?: string; status: number; roles: string[]; lastLoginAt?: string; createdAt?: string }
type Role = { id: string; roleCode: string; roleName: string }
type Page<T> = { records: T[]; total: number }

export function AdminCandidates() {
  const nav = useNavigate()
  const [items, setItems] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', realName: '', email: '', phone: '' })

  async function load() {
    setLoading(true)
    try {
      const [page, roleList] = await Promise.all([
        request<Page<User>>(`/v1/users?pageNo=1&pageSize=100&keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ''}`),
        request<Role[]>('/v1/roles'),
      ])
      setItems(page.records.filter(user => user.roles.includes('CANDIDATE')))
      setRoles(roleList)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载候选人')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function toggle(user: User) {
    try {
      const nextStatus = user.status === 1 ? 0 : 1
      await request(`/v1/users/${user.id}/status`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) })
      recordAuditLog({ module: '候选人管理', action: nextStatus === 1 ? '启用候选人' : '停用候选人', operator: profile()?.realName ?? '管理员', target: user.realName, detail: `账号 ${user.username} 状态变更为 ${nextStatus === 1 ? '启用' : '停用'}` })
      setItems(previous => previous.map(item => item.id === user.id ? { ...item, status: nextStatus } : item))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '状态更新失败')
    }
  }

  async function create() {
    const candidate = roles.find(role => role.roleCode === 'CANDIDATE')
    if (!candidate) { setError('未找到 CANDIDATE 角色'); return }
    if (!form.username || !form.password || !form.realName) { setError('请填写账号、密码和姓名'); return }
    setSaving(true)
    try {
      const user = await request<User>('/v1/users', { method: 'POST', body: JSON.stringify({ ...form, roleIds: [candidate.id] }) })
      recordAuditLog({ module: '候选人管理', action: '创建候选人', operator: profile()?.realName ?? '管理员', target: user.realName, detail: `创建候选人账号 ${user.username}` })
      setItems(previous => [user, ...previous])
      setOpen(false)
      setForm({ username: '', password: '', realName: '', email: '', phone: '' })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '创建候选人失败')
    } finally {
      setSaving(false)
    }
  }

  return <div className="mx-auto max-w-7xl p-6 lg:p-10">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm font-semibold text-[var(--accent)]">CANDIDATE DIRECTORY</p><h1 className="mt-2 text-4xl font-bold tracking-tight">候选人管理</h1><p className="mt-3 max-w-2xl text-muted-foreground">统一管理候选人账号、状态、面试历史和能力趋势。</p></div>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />新增候选人</Button>
    </header>
    {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <Card className="mt-7 p-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row"><label className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4"><Search className="h-4 w-4 text-muted-foreground" /><input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => event.key === 'Enter' && void load()} className="w-full bg-transparent text-sm outline-none" placeholder="搜索姓名、账号、邮箱或手机号" /></label><select value={status} onChange={event => setStatus(event.target.value)} className="h-12 rounded-full border border-border bg-surface px-4 text-sm"><option value="">全部状态</option><option value="1">已启用</option><option value="0">已停用</option></select><Button variant="secondary" onClick={() => void load()}>搜索</Button></div>
      {loading ? <p className="p-12 text-center text-sm text-muted-foreground">正在加载候选人…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-5 py-4">候选人</th><th className="px-5 py-4">联系方式</th><th className="px-5 py-4">最近登录</th><th className="px-5 py-4">状态</th><th className="px-5 py-4 text-right">操作</th></tr></thead><tbody>{items.map(user => <tr key={user.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30"><td className="px-5 py-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><UserRound className="h-4 w-4" /></span><div><strong>{user.realName}</strong><p className="mt-1 text-xs text-muted-foreground">{user.username}</p></div></div></td><td className="px-5 py-5 text-muted-foreground">{user.email || user.phone || '-'}</td><td className="px-5 py-5 text-muted-foreground">{user.lastLoginAt?.replace('T', ' ').slice(0, 16) || '从未登录'}</td><td className="px-5 py-5"><Badge tone={user.status === 1 ? 'success' : 'default'}>{user.status === 1 ? '已启用' : '已停用'}</Badge></td><td className="px-5 py-5 text-right"><div className="flex justify-end gap-3"><button onClick={() => nav(`/admin/candidates/${user.id}`)} className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:text-foreground"><Eye className="h-4 w-4" />详情</button><button onClick={() => void toggle(user)} className="font-semibold text-muted-foreground hover:text-foreground">{user.status === 1 ? '停用' : '启用'}</button></div></td></tr>)}{!items.length && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">暂无候选人</td></tr>}</tbody></table></div>}
    </Card>
    {open && <div className="fixed inset-0 z-50 bg-black/35 p-4 backdrop-blur-sm"><div className="mx-auto my-12 max-w-lg rounded-[30px] bg-surface p-7 shadow-2xl"><div className="flex justify-between"><div><p className="text-sm font-semibold text-[var(--accent)]">NEW CANDIDATE</p><h2 className="mt-1 text-2xl font-bold">新增候选人</h2></div><button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{([
      ['realName', '姓名', '刘洋'],
      ['username', '账号', 'candidate_liu'],
      ['password', '初始密码', '至少 8 位'],
      ['email', '邮箱', 'name@example.com'],
      ['phone', '手机号', '可选'],
    ] as const).map(([key, label, placeholder]) => <label key={key} className="text-sm font-semibold">{label}<input type={key === 'password' ? 'password' : 'text'} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-normal outline-none focus:border-[var(--accent)]" placeholder={placeholder} /></label>)}</div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={() => setOpen(false)}>取消</Button><Button disabled={saving} onClick={() => void create()}>{saving ? '创建中…' : '创建候选人'}</Button></div></div></div>}
  </div>
}
