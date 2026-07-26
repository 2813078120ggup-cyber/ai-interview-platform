import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Mic, Play, Send, Sparkles, Square, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type Interview } from '@/lib/api'
import { isInterviewFinished } from '@/lib/interview-status'

type Question = { interviewQuestionId: string; content: string; options?: string; questionType: string; maxScore: number }
type Answer = { interviewQuestionId: string; answerContent?: string; answerData?: string }
type Message = { role: 'assistant' | 'candidate'; content: string }
type Task = { id?: string; status: string; outputPayload?: string; errorMessage?: string }
type EndResponse = { interview: Interview; evaluationTaskId?: string }
type SdkConfig = { enabled: boolean; provider: string; status: string; message: string; signedUrl: string; appId: string; sceneId: string; avatarId: string; vcn: string; protocol: string }
type FinishPhase = 'confirm' | 'submitting' | 'evaluating' | 'ready' | 'failed'
type AvatarRuntime = { avatar: any; player?: any; recorder?: any; events: any; playerEvents: any }

const FOLLOW_UP_MIN = 2
const FOLLOW_UP_MAX = 5
const choiceTypes = ['single_choice', 'multiple_choice', 'true_false']
// Keep the official demo SDK entry and its dynamic XRTC player chunks together
// under public/. Runtime import avoids Vite transforming a public ESM module.
const sdkEntry = '/sdk/avatar-sdk-web_3.1.0.1011/index.js'
// This is the official demo's safe XRTC bitrate setting (kbps). It also meets
// the provider's minimum requirement of 200 for avatar.stream.bitrate.
const xunfeiStreamBitrate = 2_000
const roomStateKey = (id: string) => `interviewos_room_state_${id}`
const draftKey = (id: string, questionId: string) => `interviewos_answer_draft_${id}_${questionId}`
const remainingText = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
const safeJson = <T,>(value: string | undefined, fallback: T): T => { try { return value ? JSON.parse(value) : fallback } catch { return fallback } }

function eventText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(eventText).filter(Boolean).join(' ')
  if (!value || typeof value !== 'object') return ''
  const source = value as Record<string, unknown>
  for (const key of ['text', 'content', 'answer', 'output', 'result', 'message']) {
    const text = eventText(source[key])
    if (text) return text
  }
  for (const item of Object.values(source)) {
    const text = eventText(item)
    if (text) return text
  }
  return ''
}

function avatarErrorText(value: unknown): string {
  if (!value || typeof value !== 'object') return eventText(value)
  const source = value as Record<string, unknown>
  const code = String(source.code ?? source.errorCode ?? (source.header as Record<string, unknown> | undefined)?.code ?? '').trim()
  const message = eventText(value) || '请重新连接。'
  if (code === '11203') return '11203：在线虚拟人并发会话不可用。请确认讯飞控制台没有“持续中”链路，并检查授权路数。'
  if (code === '11200') return '11200：当前形象或发音人未获接口服务授权。请核对系统设置中的形象 ID、发音人和接口服务 ID 是否来自同一服务。'
  if (code === '10104') return '10104：讯飞请求参数不完整或不匹配。请核对接口服务 ID、形象 ID 和发音人。'
  return code ? `${code}：${message}` : message
}

export function InterviewRoom() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState<Interview>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [active, setActive] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [seconds, setSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [tts, setTts] = useState(true)
  const [virtualMessage, setVirtualMessage] = useState('启动后由讯飞虚拟面试官负责题目播报、文本交互与语音转写。')
  const [virtualActive, setVirtualActive] = useState(false)
  const [virtualLoading, setVirtualLoading] = useState(false)
  const [playBlocked, setPlayBlocked] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [listening, setListening] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [finishPhase, setFinishPhase] = useState<FinishPhase>('confirm')
  const [finishMessage, setFinishMessage] = useState('')
  const [limits, setLimits] = useState<Record<string, number>>({})
  const video = useRef<HTMLVideoElement>(null)
  const avatarRoot = useRef<HTMLDivElement>(null)
  const avatarRuntime = useRef<AvatarRuntime | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const lastReadQuestionId = useRef('')
  const currentQuestion = useRef<Question | undefined>(undefined)
  const nlpTimeout = useRef<number | undefined>(undefined)
  const followupHandler = useRef<(text: string) => Promise<void>>(async () => undefined)

  const question = questions[active]
  currentQuestion.current = question
  const finished = isInterviewFinished(interview?.status)
  const choiceQuestion = choiceTypes.includes(question?.questionType ?? '')
  const options = useMemo(() => safeJson<Array<{ key: string; text: string }>>(question?.options, []), [question?.options])
  const followUps = messages.filter(item => item.role === 'assistant').length
  const limit = question ? limits[question.interviewQuestionId] ?? FOLLOW_UP_MAX : FOLLOW_UP_MAX

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      request<Interview>('/v1/interviews/' + id),
      request<Question[]>('/v1/interviews/' + id + '/questions'),
      request<Answer[]>('/v1/interviews/' + id + '/answers'),
    ]).then(([item, questionList, answerList]) => {
      if (cancelled) return
      const restored = safeJson<{ active?: number; seconds?: number }>(localStorage.getItem(roomStateKey(id)) ?? undefined, {})
      setInterview(item)
      setQuestions(questionList)
      setSeconds(item.status === 1 ? Math.max(0, Number(restored.seconds ?? item.duration * 60)) : 0)
      if (typeof restored.active === 'number' && restored.active >= 0 && restored.active < questionList.length) setActive(restored.active)
      setAnswers(Object.fromEntries(answerList.map(answer => [answer.interviewQuestionId, answer])))
    }).catch(reason => setError(reason instanceof Error ? reason.message : '无法加载面试'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!question) return
    const saved = answers[question.interviewQuestionId]
    const stored = safeJson<unknown>(saved?.answerData, null)
    setSelected(Array.isArray(stored) && stored.every(item => typeof item === 'string') ? stored : [])
    setMessages(Array.isArray(stored) && stored.every(item => typeof item === 'object' && item && 'role' in item && 'content' in item)
      ? stored as Message[]
      : saved?.answerContent ? [{ role: 'candidate', content: saved.answerContent }] : [])
    setDraft(localStorage.getItem(draftKey(id, question.interviewQuestionId)) ?? (choiceQuestion ? '' : saved?.answerContent ?? ''))
    setLimits(previous => previous[question.interviewQuestionId]
      ? previous
      : { ...previous, [question.interviewQuestionId]: Math.floor(Math.random() * (FOLLOW_UP_MAX - FOLLOW_UP_MIN + 1)) + FOLLOW_UP_MIN })
  }, [id, question, answers, choiceQuestion])

  useEffect(() => {
    if (interview?.status !== 1 || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [interview?.status, seconds])

  useEffect(() => {
    if (!interview || !questions.length || finished) return
    localStorage.setItem(roomStateKey(id), JSON.stringify({ active, seconds, updatedAt: new Date().toISOString() }))
  }, [id, interview, questions.length, active, seconds, finished])

  useEffect(() => {
    if (!question || choiceQuestion || finished) return
    const timer = window.setTimeout(() => localStorage.setItem(draftKey(id, question.interviewQuestionId), draft), 600)
    return () => window.clearTimeout(timer)
  }, [id, question, choiceQuestion, finished, draft])

  useEffect(() => {
    if (!virtualActive || !tts || !question || choiceQuestion || lastReadQuestionId.current === question.interviewQuestionId) return
    void readQuestion(question)
  }, [virtualActive, tts, question?.interviewQuestionId, choiceQuestion])

  useEffect(() => () => {
    stream.current?.getTracks().forEach(track => track.stop())
    if (nlpTimeout.current) window.clearTimeout(nlpTimeout.current)
    void disposeAvatar(false)
  }, [])

  async function disposeAvatar(updateState = true) {
    const runtime = avatarRuntime.current
    avatarRuntime.current = null
    lastReadQuestionId.current = ''
    if (nlpTimeout.current) window.clearTimeout(nlpTimeout.current)
    if (runtime) {
      try { await runtime.recorder?.stopRecord?.(true) } catch { /* recorder can already be stopped */ }
      try { runtime.recorder?.destroy?.() } catch { /* cleanup only */ }
      try { runtime.avatar.stop?.() } catch { /* SDK releases remote avatar session */ }
      try { runtime.avatar.destroy?.() } catch { /* cleanup only */ }
    }
    avatarRoot.current?.removeAttribute('style')
    if (updateState) {
      setVirtualActive(false)
      setPlayBlocked(false)
      setListening(false)
      setThinking(false)
      setVirtualMessage('讯飞虚拟人已停止，授权会话已释放。')
    }
  }

  async function readQuestion(target: Question) {
    const runtime = avatarRuntime.current
    if (!runtime || !virtualActive || choiceTypes.includes(target.questionType)) return
    try {
      await runtime.avatar.writeText(target.content, { nlp: false })
      lastReadQuestionId.current = target.interviewQuestionId
      setVirtualMessage('讯飞虚拟面试官正在播报当前题目。')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '讯飞虚拟人播报失败，请重新连接后重试。')
    }
  }

  async function startAvatar() {
    if (virtualLoading || finished) return
    setVirtualLoading(true)
    setError('')
    let runtimeResource = ''
    let latestSdkError = ''
    try {
      const config = await request<SdkConfig>('/v1/virtual-human/sdk-config')
      if (!config.enabled || !config.signedUrl || !config.appId || !config.sceneId || !config.avatarId || !config.vcn) {
        throw new Error(config.message || '讯飞虚拟人尚未完成配置。')
      }
      if (!avatarRoot.current) throw new Error('虚拟人画布尚未准备完成。')
      setVirtualMessage(`正在连接讯飞虚拟人：形象 ${config.avatarId}，发音人 ${config.vcn}。`)
      await disposeAvatar(false)
      avatarRoot.current.replaceChildren()
      // The idle UI hides the mount point. Reveal it before start so XRTC can
      // measure and render its first frame instead of attaching off-screen.
      avatarRoot.current.style.display = 'block'
      avatarRoot.current.style.opacity = '0'
      // The SDK lives in public/ so its dynamic player chunks remain adjacent
      // to index.js after deployment. Construct an absolute runtime URL so
      // Vite does not attempt to transform a public ESM import in dev mode.
      const sdkUrl = new URL(sdkEntry, window.location.origin).href
      const sdk = await import(/* @vite-ignore */ sdkUrl) as any
      const AvatarPlatform = sdk.default
      if (!AvatarPlatform) throw new Error('讯飞 Web SDK 未加载成功，请检查 SDK 静态资源。')
      // Match guides/avatar-sdk-demo exactly: create a plain platform instance,
      // bind events, configure API/global parameters, then start with wrapper.
      const avatar = new AvatarPlatform()
      const player = avatar.player ?? avatar.createPlayer?.()
      const runtime: AvatarRuntime = { avatar, player, events: sdk.SDKEvents, playerEvents: sdk.PlayerEvents }
      avatarRuntime.current = runtime
      runtimeResource = `当前请求：形象 ${config.avatarId} · 发音人 ${config.vcn}。`
      // `start()` may reject after the SDK has emitted its detailed error
      // event. Keep that payload so the UI does not reduce an actionable
      // iFlytek code to the generic "avatar authentication failed" text.

      avatar.on?.(sdk.SDKEvents.connected, () => setVirtualMessage('讯飞虚拟面试官已连接，可以开始面试。'))
      avatar.on?.(sdk.SDKEvents.disconnected, () => {
        setVirtualActive(false)
        setListening(false)
        setVirtualMessage('讯飞虚拟人连接已关闭，授权会话已释放。')
      })
      avatar.on?.(sdk.SDKEvents.error, (event: unknown) => {
        latestSdkError = avatarErrorText(event)
        setVirtualActive(false)
        setListening(false)
        setThinking(false)
        setVirtualMessage('讯飞虚拟人运行异常：' + latestSdkError + ' ' + runtimeResource)
      })
      avatar.on?.(sdk.SDKEvents.asr, (event: unknown) => {
        const text = eventText(event)
        if (text) setDraft(previous => (previous + (previous ? '\n' : '') + text).trim())
      })
      avatar.on?.(sdk.SDKEvents.nlp, (event: unknown) => { void followupHandler.current(eventText(event)) })
      if (player) {
        player.defaultMuted = false
        player.on?.(sdk.PlayerEvents.playNotAllowed, () => {
          setPlayBlocked(true)
          setVirtualMessage('浏览器阻止了自动播放，请点击“恢复声音”。')
        })
        player.on?.(sdk.PlayerEvents.error, () => setVirtualMessage('虚拟人媒体播放异常，请重新连接。'))
      }
      // API Secret never enters the browser. The backend creates the short-lived
      // signed URL required by the official SDK, then this page performs the
      // same start/text/stop lifecycle as the supplied demo.
      avatar.setApiInfo({ signedUrl: config.signedUrl, appId: config.appId, sceneId: config.sceneId })
      avatar.setGlobalParams({
        stream: { protocol: 'xrtc', alpha: 1, bitrate: xunfeiStreamBitrate },
        avatar: { avatar_id: config.avatarId, width: 720, height: 1280 },
        tts: { vcn: config.vcn },
      })
      // Keep the player wrapper mounted: XRTC can connect successfully but
      // render no frame when it starts inside a display:none container.
      await avatar.start({ wrapper: avatarRoot.current })
      setVirtualActive(true)
      window.requestAnimationFrame(() => avatarRoot.current?.removeAttribute('style'))
      setVirtualMessage('讯飞虚拟面试官已就绪。')
      await player?.resume?.().catch(() => undefined)
    } catch (reason) {
      await disposeAvatar(false)
      setVirtualActive(false)
      const failure = latestSdkError || (reason instanceof Error ? reason.message : '讯飞虚拟人连接失败。')
      setVirtualMessage(`${failure} ${runtimeResource ?? ''}`.trim())
    } finally {
      setVirtualLoading(false)
    }
  }

  async function resumeAvatarAudio() {
    try {
      await avatarRuntime.current?.player?.resume?.()
      setPlayBlocked(false)
      setVirtualMessage('声音已恢复。')
    } catch {
      setError('浏览器仍未允许播放声音，请先点击页面空白处后再试。')
    }
  }

  async function toggleVoiceAnswer() {
    const runtime = avatarRuntime.current
    if (!runtime || !virtualActive) {
      setError('请先启动讯飞虚拟面试官。语音转写仅使用讯飞 SDK，不会降级到浏览器或 DeepSeek。')
      return
    }
    if (!window.isSecureContext) {
      setError('语音回答只能在 HTTPS 或 localhost 环境使用，请先配置 HTTPS。')
      return
    }
    try {
      const recorder = runtime.recorder ?? runtime.avatar.createRecorder({ sampleRate: 16000 })
      runtime.recorder = recorder
      if (listening) {
        await recorder.stopRecord()
        setListening(false)
        return
      }
      await recorder.startRecord(120, () => setListening(false), { nlp: true })
      setListening(true)
      setVirtualMessage('正在使用讯飞语音识别，请开始回答。')
    } catch (reason) {
      setListening(false)
      setError(reason instanceof Error ? reason.message : '讯飞语音识别启动失败，请检查麦克风权限与平台 ASR 授权。')
    }
  }

  async function save(next: Message[]) {
    if (!question || !interview) return
    const answerContent = next.filter(item => item.role === 'candidate').map(item => item.content).join('\n')
    const answerData = JSON.stringify(next)
    await request('/v1/interviews/' + id + '/questions/' + question.interviewQuestionId + '/answer', {
      method: 'PUT',
      body: JSON.stringify({ answerContent, answerData, durationSeconds: Math.max(0, interview.duration * 60 - seconds) }),
    })
    localStorage.removeItem(draftKey(id, question.interviewQuestionId))
    setAnswers(previous => ({ ...previous, [question.interviewQuestionId]: { interviewQuestionId: question.interviewQuestionId, answerContent, answerData } }))
  }

  async function applyXunfeiFollowup(text: string) {
    const normalized = text.trim()
    if (!normalized || !question || choiceQuestion || finished) return
    if (nlpTimeout.current) window.clearTimeout(nlpTimeout.current)
    setMessages(previous => {
      if (previous.at(-1)?.role === 'assistant' && previous.at(-1)?.content === normalized) return previous
      const next = [...previous, { role: 'assistant' as const, content: normalized }]
      void save(next)
      return next
    })
    setThinking(false)
    setVirtualMessage('讯飞 AI 面试官已完成追问。')
  }

  followupHandler.current = applyXunfeiFollowup

  async function send() {
    if (!question || finished || thinking) return
    const content = choiceQuestion ? selected.join(', ') : draft.trim()
    if (!content) { setError('请先完成本题作答。'); return }
    setError('')
    if (choiceQuestion) {
      setThinking(true)
      try {
        await request('/v1/interviews/' + id + '/questions/' + question.interviewQuestionId + '/answer', {
          method: 'PUT',
          body: JSON.stringify({ answerContent: content, answerData: JSON.stringify(selected), durationSeconds: Math.max(0, (interview?.duration ?? 0) * 60 - seconds) }),
        })
        localStorage.removeItem(draftKey(id, question.interviewQuestionId))
        if (active < questions.length - 1) setActive(active + 1)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '答案保存失败。')
      } finally {
        setThinking(false)
      }
      return
    }

    const candidateMessages = [...messages, { role: 'candidate' as const, content }]
    setMessages(candidateMessages)
    setDraft('')
    setThinking(true)
    try {
      await save(candidateMessages)
      if (followUps >= limit) {
        if (active < questions.length - 1) setActive(active + 1)
        return
      }
      const runtime = avatarRuntime.current
      if (!runtime || !virtualActive) {
        throw new Error('回答已保存。请启动讯飞虚拟面试官后继续，由它生成后续追问。')
      }
      setVirtualMessage('讯飞虚拟面试官正在分析回答并生成追问。')
      await runtime.avatar.writeText(content, { nlp: true, avatar_dispatch: { interactive_mode: 1, content_analysis: 1 } })
      nlpTimeout.current = window.setTimeout(() => {
        setThinking(false)
        setVirtualMessage('讯飞未在预期时间返回追问。你可以继续补充回答，或进入下一题。')
      }, 15000)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '答案保存或讯飞交互失败。')
      setThinking(false)
    }
  }

  async function waitEvaluationTask(taskId: string) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1500))
      const task = await request<Task>('/v1/ai-tasks/' + taskId)
      if (task.status === 'SUCCESS') return task
      if (task.status === 'FAILED') throw new Error(task.errorMessage ?? 'AI 报告生成失败，请稍后在报告页重试。')
      setFinishMessage(task.status === 'RUNNING' ? 'AI 正在评估答案并生成报告…' : '评测任务已提交，等待 AI 处理…')
    }
    throw new Error('报告生成等待超时，系统会继续在后台处理。')
  }

  async function finishWithProgress() {
    setThinking(true)
    setFinishPhase('submitting')
    setFinishMessage('正在锁定本次答题记录…')
    try {
      const result = await request<EndResponse>('/v1/interviews/' + id + '/end', { method: 'POST' })
      await disposeAvatar()
      localStorage.removeItem(roomStateKey(id))
      questions.forEach(item => localStorage.removeItem(draftKey(id, item.interviewQuestionId)))
      setInterview(result.interview)
      setFinishPhase('evaluating')
      setFinishMessage('答题记录已锁定，正在生成评分与面试报告…')
      if (result.evaluationTaskId) await waitEvaluationTask(String(result.evaluationTaskId))
      setFinishPhase('ready')
      setFinishMessage('报告已生成，即将打开能力报告。')
      window.setTimeout(() => navigate('/candidate/interviews/' + id + '/report'), 650)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '结束面试失败'
      setFinishPhase('failed')
      setFinishMessage(message)
      setError(message)
    } finally {
      setThinking(false)
    }
  }

  async function camera() {
    if (cameraOn) {
      stream.current?.getTracks().forEach(track => track.stop())
      stream.current = null
      setCameraOn(false)
      return
    }
    if (!window.isSecureContext) { setError('摄像头只能在 HTTPS 或 localhost 环境使用，请先配置 HTTPS。'); return }
    if (!navigator.mediaDevices?.getUserMedia) { setError('当前浏览器不支持摄像头访问。'); return }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (video.current) video.current.srcObject = stream.current
      setCameraOn(true)
    } catch {
      setError('未获得摄像头权限，请在浏览器中允许访问。')
    }
  }

  if (loading) return <Card>正在加载 AI 面试间…</Card>
  if (!interview || !question) return <Card><strong>无法打开该面试</strong><p className="mt-2 text-sm text-muted-foreground">{error || '面试不存在，或你没有访问权限。'}</p><Button className="mt-5" variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回面试大厅</Button></Card>

  const submitLabel = choiceQuestion
    ? (active < questions.length - 1 ? '提交答案并进入下一题' : '提交答案')
    : (followUps >= limit && active < questions.length - 1 ? '完成本题并进入下一题' : '发送回答')

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div><button onClick={() => navigate('/candidate/interviews')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回面试大厅</button><h1 className="text-xl font-bold lg:text-2xl">{interview.title}</h1><p className="mt-1 text-sm text-muted-foreground">#{id} · 讯飞虚拟人对话式面试</p></div>
      <div className="flex items-center gap-3"><div className="rounded-2xl bg-muted px-4 py-2 text-right"><p className="text-xs text-muted-foreground">{finished ? '面试已结束' : '剩余时间'}</p><p className="font-mono text-xl font-bold">{finished ? '--:--' : remainingText(seconds)}</p></div>{!finished && <Button variant="danger" disabled={thinking} onClick={() => { setFinishPhase('confirm'); setFinishMessage(''); setFinishDialogOpen(true) }}><Square className="h-4 w-4" />结束面试</Button>}</div>
    </header>
    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
      <Card className="h-fit p-3"><div className="flex justify-between px-2 py-2"><strong>面试题目</strong><span className="text-sm text-muted-foreground">{active + 1}/{questions.length}</span></div><div className="mx-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--primary)]" style={{ width: Math.round(((active + 1) / questions.length) * 100) + '%' }} /></div><div className="mt-3 space-y-1">{questions.map((item, index) => <button key={item.interviewQuestionId} onClick={() => setActive(index)} className={'flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm ' + (index === active ? 'bg-[var(--accent-soft)] text-[var(--foreground)]' : 'hover:bg-muted')}><b className="text-xs">{String(index + 1).padStart(2, '0')}</b><span className="line-clamp-2">{item.content}</span></button>)}</div></Card>
      <Card className="flex min-h-[620px] flex-col"><div className="flex items-center justify-between border-b border-border pb-4"><Badge tone="info">{question.questionType.replace('_', ' ')}</Badge><span className="text-sm text-muted-foreground">{choiceQuestion ? `${question.maxScore} 分 · 提交后直接下一题` : `讯飞追问 ${Math.min(followUps, limit)}/${limit}`}</span></div><div className="mt-5 rounded-2xl bg-[var(--accent-soft)] p-4"><p className="text-xs font-bold text-[var(--accent)]">题库原题 · 当前问题</p><p className="mt-2 leading-7">{question.content}</p></div><div className="my-5 flex flex-1 flex-col gap-3 overflow-y-auto"><AnimatePresence initial={false}>{messages.map((message, index) => <motion.article key={message.role + '-' + index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ' + (message.role === 'candidate' ? 'ml-auto bg-[var(--primary)] text-white' : 'bg-muted')}><p className="mb-1 text-xs font-bold">{message.role === 'candidate' ? '我' : '讯飞 AI 面试官'}</p>{message.content}</motion.article>)}</AnimatePresence>{thinking && <p className="w-fit rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">讯飞 AI 面试官正在处理…</p>}</div>{choiceQuestion ? <div className="space-y-2">{options.map(option => <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"><input type={question.questionType === 'multiple_choice' ? 'checkbox' : 'radio'} name="answer" checked={selected.includes(option.key)} onChange={() => setSelected(previous => question.questionType === 'multiple_choice' ? previous.includes(option.key) ? previous.filter(value => value !== option.key) : [...previous, option.key] : [option.key])} />{option.key}. {option.text}</label>)}</div> : <div className="relative"><textarea value={draft} disabled={finished} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void send() }} className="min-h-32 w-full rounded-2xl border border-border bg-background p-4 pr-14 text-sm outline-none focus:border-[var(--accent)]" placeholder="输入回答，或点击麦克风进行讯飞语音回答。" /><button type="button" onClick={() => void toggleVoiceAnswer()} disabled={finished} className={'absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-xl ' + (listening ? 'bg-rose-500 text-white' : 'bg-[var(--primary)] text-white')} title={listening ? '停止讯飞语音识别' : '开始讯飞语音回答'}><Mic className="h-4 w-4" /></button><p className="mt-2 text-xs text-muted-foreground">{listening ? '正在使用讯飞语音识别，请说话；再次点击麦克风可停止。' : '启动虚拟人后，语音回答将由讯飞转写为文字。'}</p></div>}<div className="mt-4 flex justify-between gap-2"><Button variant="secondary" disabled={active === 0} onClick={() => setActive(value => value - 1)}><ChevronLeft className="h-4 w-4" />上一题</Button><Button disabled={thinking || finished} onClick={() => void send()}>{submitLabel}<Send className="h-4 w-4" /></Button><Button variant="secondary" disabled={active === questions.length - 1} onClick={() => setActive(value => value + 1)}>下一题<ChevronRight className="h-4 w-4" /></Button></div></Card>
      <div className="space-y-5"><Card className="overflow-hidden p-0"><div className="relative min-h-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_16%,rgba(235,214,255,.75),transparent_36%),linear-gradient(180deg,#fff7fb_0%,#f2ebe2_100%)] dark:bg-[radial-gradient(circle_at_50%_16%,rgba(120,88,170,.35),transparent_36%),linear-gradient(180deg,#211b19_0%,#151210_100%)]"><div className="absolute left-4 top-4 z-20 rounded-full border border-white/55 bg-white/75 px-3 py-1 text-xs font-bold text-[#8a5f3f] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-amber-100">{virtualActive ? '讯飞虚拟人已接入' : '讯飞虚拟人待启动'}</div><div ref={avatarRoot} className={'absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover ' + (virtualActive ? 'block' : 'hidden')} />{!virtualActive && <div className="absolute inset-0 grid place-items-center"><div className="relative grid h-56 w-56 place-items-center"><div className="absolute inset-0 rounded-full border border-dashed border-[#b17653]/35" /><div className="absolute h-40 w-40 animate-[spin_10s_linear_infinite] rounded-full border border-[#b17653]/20" /><span className="z-10 grid h-24 w-24 place-items-center rounded-[32px] bg-[#11100f] text-white shadow-[0_24px_80px_rgba(119,83,59,.28)]"><Sparkles className="h-10 w-10" /></span></div></div>}<div className="absolute bottom-4 left-4 right-4 z-20 rounded-[22px] border border-white/45 bg-white/78 px-4 py-3 text-[#251c18] shadow-[0_18px_45px_rgba(84,58,41,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/35 dark:text-white"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{virtualActive ? '讯飞虚拟面试官' : 'AI 面试官'}</p><p className="mt-1 text-xs leading-5 opacity-75">{virtualLoading ? '正在连接讯飞虚拟人服务…' : virtualMessage}</p></div><span className={'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ' + (virtualActive ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,.7)]' : 'bg-amber-500')} /></div>{!virtualActive && <Button className="mt-3 h-9 px-3" disabled={virtualLoading || finished} onClick={() => void startAvatar()}><Play className="h-3.5 w-3.5" />启动虚拟人</Button>}{playBlocked && <Button variant="secondary" className="mt-3 h-9 px-3" onClick={() => void resumeAvatarAudio()}><Volume2 className="h-3.5 w-3.5" />恢复声音</Button>}</div></div><div className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">语音朗读</p><p className="mt-1 text-xs text-muted-foreground">由讯飞虚拟人朗读当前题目</p></div><button className="rounded-xl p-2 hover:bg-muted" onClick={() => setTts(value => !value)}>{tts ? <Volume2 className="h-4 w-4 text-[var(--accent)]" /> : <VolumeX className="h-4 w-4" />}</button></div><button onClick={() => void readQuestion(question)} className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"><Volume2 className="h-3.5 w-3.5" />让虚拟人重读本题</button></Card><Card><div className="flex items-center justify-between"><div><p className="font-semibold">我的画面</p><p className="mt-1 text-xs text-muted-foreground">仅本地预览</p></div><Button variant="secondary" className="h-9 px-3" onClick={() => void camera()}><Camera className="h-4 w-4" />{cameraOn ? '关闭' : '开启'}</Button></div><div className="relative mt-4 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-muted"><video ref={video} autoPlay muted playsInline className={'h-full w-full object-cover ' + (cameraOn ? 'block -scale-x-100' : 'hidden')} />{!cameraOn && <div className="text-center text-muted-foreground"><Camera className="mx-auto h-6 w-6" /><p className="mt-2 text-xs">尚未开启摄像头</p></div>}</div>{!window.isSecureContext && <p className="mt-3 text-xs leading-5 text-amber-700">当前 HTTP 连接不允许调用摄像头与麦克风；生产环境请配置 HTTPS。</p>}</Card></div>
    </div>
    {finishDialogOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="finish-dialog-title"><motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .2, ease: 'easeOut' }} className="w-full max-w-md overflow-hidden rounded-[30px] border border-border bg-surface shadow-[0_28px_90px_rgba(20,18,17,.22)]"><div className="soft-emphasis-panel rounded-none border-0 p-6 shadow-none"><span className={'grid h-12 w-12 place-items-center rounded-2xl shadow-sm ' + (finishPhase === 'ready' ? 'bg-emerald-50 text-emerald-700' : finishPhase === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{finishPhase === 'ready' ? <CheckCircle2 className="h-6 w-6" /> : finishPhase === 'submitting' || finishPhase === 'evaluating' ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertTriangle className="h-6 w-6" />}</span><h2 id="finish-dialog-title" className="mt-5 text-2xl font-bold">{finishPhase === 'confirm' ? '确认结束本次面试？' : finishPhase === 'ready' ? '报告生成完成' : finishPhase === 'failed' ? '报告生成遇到问题' : '正在生成面试报告'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{finishPhase === 'confirm' ? '结束后系统会锁定当前答题记录，并自动生成 AI 评分与面试报告。' : finishMessage}</p></div><div className="space-y-3 p-6"><div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground"><p><span className="font-semibold text-foreground">当前进度：</span>{active + 1}/{questions.length} 题</p><p className="mt-1"><span className="font-semibold text-foreground">剩余时间：</span>{remainingText(seconds)}</p></div>{finishPhase !== 'confirm' && <div className="rounded-2xl border border-border bg-background/70 p-4"><p className="text-sm font-semibold text-foreground">{finishPhase === 'ready' ? '报告已生成' : finishPhase === 'failed' ? '生成失败' : '正在处理'}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{finishMessage}</p></div>}<div className="flex justify-end gap-3 pt-2">{finishPhase === 'confirm' && <Button variant="secondary" disabled={thinking} onClick={() => setFinishDialogOpen(false)}>继续作答</Button>}{finishPhase === 'confirm' && <Button variant="danger" disabled={thinking} onClick={() => void finishWithProgress()}><Square className="h-4 w-4" />确认结束</Button>}{finishPhase === 'failed' && <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回大厅</Button>}{finishPhase === 'failed' && <Button onClick={() => navigate('/candidate/interviews/' + id + '/report')}>稍后查看报告</Button>}</div></div></motion.div></div>}
  </div>
}
