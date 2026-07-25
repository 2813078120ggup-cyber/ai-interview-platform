import { motion } from 'framer-motion'
import { ArrowRight, Bot, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, Waves } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { request } from '@/lib/api'
import { establish } from '@/lib/session'

type Login = { token: string; refreshToken: string; user: { id: string; username: string; realName: string; roles: string[] } }

const fieldClass = 'mt-2 h-12 w-full rounded-2xl border border-border bg-background/70 px-4 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-surface focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_14%,transparent)]'

export function LoginPage() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', realName: '', email: '', phone: '' })

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') {
        await request('/v1/auth/register', { method: 'POST', body: JSON.stringify(form) })
        setMode('login')
        setForm(previous => ({ ...previous, password: '' }))
        return
      }
      const result = await request<Login>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ username: form.username, password: form.password }) })
      establish(result.token, result.refreshToken, result.user)
      nav(result.user.roles.includes('ADMIN') ? '/admin/interviews' : '/candidate/interviews', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败，请检查账号和密码')
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return <main className="relative grid min-h-dvh overflow-hidden bg-background lg:grid-cols-[1.08fr_.92fr]">
    <div className="pointer-events-none absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-[var(--brand)]/12 blur-3xl" />
    <div className="pointer-events-none absolute bottom-[10%] right-[12%] h-80 w-80 rounded-full bg-[var(--brand-pink)]/10 blur-3xl" />

    <section className="relative hidden min-h-dvh p-8 lg:flex">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: 'easeOut' }} className="soft-emphasis-panel relative flex w-full overflow-hidden rounded-[36px] p-10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--brand)]/30 blur-3xl" />
        <div className="absolute bottom-12 right-10 h-44 w-44 rounded-full bg-[var(--brand-pink)]/20 blur-2xl" />
        <div className="absolute inset-x-10 bottom-10 h-px bg-white/15" />

        <div className="relative flex max-w-2xl flex-col">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--primary)] shadow-[0_18px_44px_rgba(255,255,255,.14)]"><Bot className="h-5 w-5" /></span>
            <div><strong className="text-lg">InterviewOS</strong><p className="text-xs text-white/60">AI 多模态模拟面试评测平台</p></div>
          </div>

          <div className="my-auto">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12, duration: .4 }} className="text-sm font-semibold tracking-[0.18em] text-white/60">AI INTERVIEW WORKSPACE</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18, duration: .45 }} className="mt-6 max-w-xl text-5xl font-bold leading-[1.08] tracking-tight">
              把每一次模拟面试，变成下一次的底气。
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24, duration: .45 }} className="mt-6 max-w-lg text-lg leading-8 text-white/68">
              AI 面试官追问、语音作答、能力画像和成长报告，帮助候选人把准备过程变得清晰可复盘。
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .45 }} className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['AI 追问', '像真实面试一样推进'],
                ['能力报告', '四维画像与建议'],
                ['中断恢复', '回答自动保存'],
              ].map(([title, desc]) => <div key={title} className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-white/55">{desc}</p>
              </div>)}
            </motion.div>
          </div>

        </div>
      </motion.div>
    </section>

    <section className="relative grid min-h-dvh place-items-center px-5 py-8 sm:px-10">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .42, ease: 'easeOut' }} className="w-full max-w-md rounded-[32px] border border-border bg-surface/88 p-6 shadow-[0_24px_70px_rgba(20,18,17,.12)] backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-pink))] text-white"><Bot className="h-5 w-5" /></span>
            <div><strong>InterviewOS</strong><p className="text-xs text-muted-foreground">AI 面试评测平台</p></div>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />AI 在线</span>
        </div>

        <div className="mt-8">
          <motion.p key={mode + '-eyebrow'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-[var(--accent)]">WELCOME TO INTERVIEWOS</motion.p>
          <motion.h2 key={mode + '-title'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-3xl font-bold tracking-tight">{mode === 'login' ? '欢迎回来' : '创建候选人账号'}</motion.h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === 'login' ? '登录后会根据你的角色进入对应工作空间。' : '新注册账号默认进入候选人端，可用于模拟练习和查看报告。'}</p>
        </div>

        {error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</motion.p>}

        <div className="mt-6 space-y-5">
          {mode === 'register' && <label className="block text-sm font-semibold">
            姓名
            <div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={form.realName} onChange={event => setForm({ ...form, realName: event.target.value })} className={`${fieldClass} pl-11`} required placeholder="请输入真实姓名" /></div>
          </label>}

          <label className="block text-sm font-semibold">
            用户名
            <div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} className={`${fieldClass} pl-11`} required autoComplete="username" placeholder="例如 candidate_liu" /></div>
          </label>

          <label className="block text-sm font-semibold">
            密码
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className={`${fieldClass} pl-11 pr-12`} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="请输入密码" />
              <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label={showPassword ? '隐藏密码' : '显示密码'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </label>

          {mode === 'register' && <label className="block text-sm font-semibold">
            邮箱，可选
            <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={`${fieldClass} pl-11`} placeholder="用于后续找回和通知" /></div>
          </label>}
        </div>

        <Button className="mt-7 h-12 w-full rounded-2xl" disabled={busy}>
          {busy ? '处理中…' : mode === 'login' ? '登录工作空间' : '创建账号'}
          {busy ? <Waves className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}
        </Button>

        <button type="button" onClick={switchMode} className="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)]">
          {mode === 'login' ? '没有账号？创建候选人账号' : '已有账号？去登录'}
        </button>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          密码通过后端 Spring Security BCrypt 校验，登录成功后自动分流到管理端或候选人端。
        </div>
      </motion.form>
    </section>
  </main>
}
