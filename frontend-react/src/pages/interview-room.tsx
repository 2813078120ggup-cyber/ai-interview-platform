import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Mic, Play, Send, Sparkles, Square, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type Interview } from '@/lib/api'
import { isInterviewFinished } from '@/lib/interview-status'
import { askOpenTalking, closeOpenTalking, speakOpenTalking, startOpenTalking, transcribeOpenTalking, type OpenTalkingRuntime } from '@/lib/opentalking'

type Question = { interviewQuestionId: string; content: string; options?: string; questionType: string; maxScore: number; correctAnswer?: string; answerTemplate?: string; explanation?: string }
type Answer = { interviewQuestionId: string; answerContent?: string; answerData?: string }
type Message = { role: 'assistant' | 'candidate'; content: string }
type Task = { id?: string; status: string; outputPayload?: string; errorMessage?: string }
type EndResponse = { interview: Interview; evaluationTaskId?: string }
type SdkConfig = { enabled: boolean; provider: string; status: string; message: string; signedUrl: string; appId: string; sceneId: string; avatarId: string; vcn: string; protocol: string; endpoint: string }
type FinishPhase = 'confirm' | 'submitting' | 'evaluating' | 'ready' | 'failed'
type AvatarRuntime = { provider: 'xunfei' | 'opentalking'; avatar?: any; player?: any; recorder?: any; events?: any; playerEvents?: any; openTalking?: OpenTalkingRuntime }

const FOLLOW_UP_MIN = 2
const FOLLOW_UP_MAX = 5
const choiceTypes = ['single_choice', 'multiple_choice', 'true_false']
// Keep the official demo SDK entry and its dynamic XRTC player chunks together
// under public/. Runtime import avoids Vite transforming a public ESM module.
const sdkEntry = '/sdk/avatar-sdk-web_3.1.0.1011/index.js'
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

function answerKeys(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) return []
  // The question bank accepts both JSON (for example ["A","C"]) and
  // conventional raw keys (for example A or A,C). Keep both formats valid
  // so a correct choice is never misclassified merely because it was stored
  // as plain text.
  const parsed = safeJson<unknown>(normalized, normalized)
  if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean).sort()
  if (typeof parsed === 'string') return parsed.split(/[,\s，、]+/).map(item => item.trim()).filter(Boolean).sort()
  return []
}

function sameKeys(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function choiceText(keys: string[], options: Array<{ key: string; text: string }>) {
  const optionMap = new Map(options.map(option => [option.key, option.text]))
  return keys.map(key => `${key}${optionMap.has(key) ? `.${optionMap.get(key)}` : ''}`).join('、')
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
  const [virtualMessage, setVirtualMessage] = useState('待启动')
  const [virtualProvider, setVirtualProvider] = useState<'xunfei' | 'opentalking' | null>(null)
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
  // React state updates are asynchronous. Keep the session lock in refs so a
  // double click, StrictMode remount, or a delayed event cannot open two XRTC
  // sessions before `virtualLoading` has rendered.
  const avatarStartLock = useRef(false)
  const sendLock = useRef(false)
  const avatarAttempt = useRef(0)
  const stream = useRef<MediaStream | null>(null)
  const lastReadQuestionId = useRef('')
  const currentQuestion = useRef<Question | undefined>(undefined)
  const nlpTimeout = useRef<number | undefined>(undefined)
  const followupHandler = useRef<(text: string) => Promise<void>>(async () => undefined)
  const openTalkingRecorder = useRef<MediaRecorder | null>(null)
  const openTalkingAudioStream = useRef<MediaStream | null>(null)
  const openTalkingAudioChunks = useRef<BlobPart[]>([])
  const browserRecognition = useRef<any>(null)
  const browserRecognitionBase = useRef('')

  const question = questions[active]
  currentQuestion.current = question
  const finished = isInterviewFinished(interview?.status)
  const choiceQuestion = choiceTypes.includes(question?.questionType ?? '')
  const options = useMemo(() => safeJson<Array<{ key: string; text: string }>>(question?.options, []), [question?.options])
  const questionPrompt = question?.content.trim() ?? ''
  const followUps = messages.filter(item => item.role === 'assistant' && item.content.trim() !== questionPrompt).length
  const limit = question ? limits[question.interviewQuestionId] ?? FOLLOW_UP_MAX : FOLLOW_UP_MAX
  const virtualProviderName = virtualProvider === 'opentalking' ? 'OpenTalking' : '讯飞'
  const virtualInterviewerName = virtualProvider === 'opentalking' ? '面试官' : '面试官'

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
    setDraft(localStorage.getItem(draftKey(id, question.interviewQuestionId)) ?? '')
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
    if (!tts || !question || lastReadQuestionId.current === question.interviewQuestionId) return
    void readQuestion(question)
  }, [virtualActive, tts, question?.interviewQuestionId, choiceQuestion])

  useEffect(() => {
    const releaseRemoteSession = () => disposeAvatarImmediately()
    window.addEventListener('pagehide', releaseRemoteSession)
    window.addEventListener('beforeunload', releaseRemoteSession)
    return () => {
      stream.current?.getTracks().forEach(track => track.stop())
      releaseRemoteSession()
      window.removeEventListener('pagehide', releaseRemoteSession)
      window.removeEventListener('beforeunload', releaseRemoteSession)
    }
  }, [])

  function invalidateAvatarAttempt() {
    avatarAttempt.current += 1
    avatarStartLock.current = false
  }

  function detachAvatarRuntime() {
    const runtime = avatarRuntime.current
    avatarRuntime.current = null
    lastReadQuestionId.current = ''
    if (nlpTimeout.current) window.clearTimeout(nlpTimeout.current)
    stopOpenTalkingRecording(false)
    stopBrowserRecognition()
    window.speechSynthesis?.cancel()
    return runtime
  }

  function stopOpenTalkingRecording(upload: boolean) {
    const recorder = openTalkingRecorder.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = upload ? recorder.onstop : null
      recorder.stop()
      if (upload) return
    }
    openTalkingRecorder.current = null
    openTalkingAudioStream.current?.getTracks().forEach(track => track.stop())
    openTalkingAudioStream.current = null
    if (!upload) openTalkingAudioChunks.current = []
  }

  function stopBrowserRecognition() {
    const recognition = browserRecognition.current
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try { recognition.stop() } catch { /* already stopped */ }
    browserRecognition.current = null
  }

  async function browserSpeak(text: string) {
    if (!tts || !text.trim() || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    await new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
      window.setTimeout(resolve, Math.min(9000, Math.max(1800, text.length * 120)))
    })
  }

  // `beforeunload`/`pagehide` cannot wait for an async recorder shutdown.
  // Send the SDK stop frame synchronously first so the single iFlytek route is
  // released even when the candidate refreshes or navigates away.
  function disposeAvatarImmediately() {
    invalidateAvatarAttempt()
    const runtime = detachAvatarRuntime()
    if (!runtime) return
    if (runtime.provider === 'opentalking' && runtime.openTalking) {
      closeOpenTalking(runtime.openTalking)
      return
    }
    try { void runtime.recorder?.stopRecord?.(true) } catch { /* cleanup only */ }
    try { runtime.recorder?.destroy?.() } catch { /* cleanup only */ }
    try { runtime.avatar.stop?.() } catch { /* SDK releases remote avatar session */ }
    try { runtime.avatar.destroy?.() } catch { /* cleanup only */ }
  }

  async function disposeAvatar(updateState = true, invalidateAttempt = true) {
    if (invalidateAttempt) invalidateAvatarAttempt()
    const runtime = detachAvatarRuntime()
    if (runtime) {
      if (runtime?.provider === 'opentalking' && runtime.openTalking) {
        closeOpenTalking(runtime.openTalking)
      } else {
        try { await runtime.recorder?.stopRecord?.(true) } catch { /* recorder can already be stopped */ }
        try { runtime.recorder?.destroy?.() } catch { /* cleanup only */ }
        try { runtime.avatar?.stop?.() } catch { /* SDK releases remote avatar session */ }
        try { runtime.avatar?.destroy?.() } catch { /* cleanup only */ }
      }
    }
    avatarRoot.current?.removeAttribute('style')
    if (updateState) {
      setVirtualActive(false)
      setPlayBlocked(false)
      setListening(false)
      setThinking(false)
      setVirtualProvider(null)
      setVirtualMessage('已停止')
    }
  }

  async function readQuestion(target: Question) {
    const runtime = avatarRuntime.current
    if (!tts) return
    try {
      if (runtime?.provider === 'opentalking' && runtime.openTalking) {
        await speakOpenTalking(runtime.openTalking, target.content)
        appendAssistantMessage(target.content, { persist: false, allowChoice: true })
        setVirtualMessage('朗读中')
      } else if (runtime?.provider === 'xunfei') {
        await runtime.avatar?.writeText(target.content, { nlp: false })
        appendAssistantMessage(target.content, { persist: false, allowChoice: true })
        setVirtualMessage('朗读中')
      } else {
        appendAssistantMessage(target.content, { persist: false, allowChoice: true })
        setVirtualMessage('浏览器朗读中')
        await browserSpeak(target.content)
        setVirtualMessage('浏览器语音就绪')
      }
      lastReadQuestionId.current = target.interviewQuestionId
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '虚拟人播报失败，请重新连接后重试。')
    }
  }

  async function startOpenTalkingAvatar(config: SdkConfig, isCurrentAttempt: () => boolean) {
    if (!config.endpoint || !config.sceneId || !config.avatarId) throw new Error(config.message || 'OpenTalking 尚未完成配置。')
    if (!avatarRoot.current) throw new Error('虚拟人画布尚未准备完成。')
    setVirtualMessage('连接中…')
    await disposeAvatar(false, false)
    if (!isCurrentAttempt() || !avatarRoot.current) return
    avatarRoot.current.replaceChildren()
    avatarRoot.current.style.display = 'block'
    const avatarVideo = document.createElement('video')
    avatarVideo.autoplay = true
    avatarVideo.playsInline = true
    avatarVideo.muted = false
    avatarRoot.current.append(avatarVideo)
    const openTalking = await startOpenTalking({
      endpoint: config.endpoint,
      model: config.sceneId,
      avatarId: config.avatarId,
      ttsProvider: config.appId || 'edge',
      ttsVoice: config.vcn,
      sttProvider: 'dashscope',
    }, avatarVideo, {
      onStatus: status => {
        if (status === 'thinking' || status === 'processing') setThinking(true)
        if (status === 'idle' || status === 'ready' || status === 'speech.ended') setThinking(false)
      },
      onError: message => {
        setThinking(false)
        setVirtualMessage('异常：' + message)
      },
    })
    if (!isCurrentAttempt()) {
      closeOpenTalking(openTalking)
      return
    }
    avatarRuntime.current = { provider: 'opentalking', openTalking }
    setVirtualProvider('opentalking')
    setVirtualActive(true)
    window.requestAnimationFrame(() => avatarRoot.current?.removeAttribute('style'))
    setVirtualMessage('已就绪')
  }

  async function startAvatar() {
    if (avatarStartLock.current || avatarRuntime.current || finished) return
    avatarStartLock.current = true
    const startAttempt = ++avatarAttempt.current
    const isCurrentAttempt = () => avatarAttempt.current === startAttempt
    setVirtualLoading(true)
    setError('')
    let runtimeResource = ''
    let latestSdkError = ''
    try {
      const config = await request<SdkConfig>('/v1/virtual-human/sdk-config')
      if (!config.enabled) throw new Error(config.message || '虚拟人尚未完成配置。')
      if (config.protocol === 'opentalking') {
        await startOpenTalkingAvatar(config, isCurrentAttempt)
        return
      }
      if (!config.enabled || !config.signedUrl || !config.appId || !config.sceneId || !config.avatarId || !config.vcn) {
        throw new Error(config.message || '讯飞虚拟人尚未完成配置。')
      }
      if (!avatarRoot.current) throw new Error('虚拟人画布尚未准备完成。')
      setVirtualMessage('连接中…')
      await disposeAvatar(false, false)
      if (!isCurrentAttempt()) return
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
      if (!isCurrentAttempt()) return
      const AvatarPlatform = sdk.default
      if (!AvatarPlatform) throw new Error('讯飞 Web SDK 未加载成功，请检查 SDK 静态资源。')
      // Match guides/avatar-sdk-demo exactly: create a plain platform instance,
      // bind events, configure API/global parameters, then start with wrapper.
      const avatar = new AvatarPlatform()
      const player = avatar.player ?? avatar.createPlayer?.()
      const runtime: AvatarRuntime = { provider: 'xunfei', avatar, player, events: sdk.SDKEvents, playerEvents: sdk.PlayerEvents }
      avatarRuntime.current = runtime
      runtimeResource = `当前请求：形象 ${config.avatarId} · 发音人 ${config.vcn}。`
      // `start()` may reject after the SDK has emitted its detailed error
      // event. Keep that payload so the UI does not reduce an actionable
      // iFlytek code to the generic "avatar authentication failed" text.

      avatar.on?.(sdk.SDKEvents.connected, () => setVirtualMessage('已连接'))
      avatar.on?.(sdk.SDKEvents.disconnected, () => {
        setVirtualActive(false)
        setListening(false)
        setVirtualMessage('已断开')
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
          setVirtualMessage('请恢复声音')
        })
        player.on?.(sdk.PlayerEvents.error, () => setVirtualMessage('播放异常'))
      }
      // API Secret never enters the browser. The backend creates the short-lived
      // signed URL required by the official SDK, then this page performs the
      // same start/text/stop lifecycle as the supplied demo.
      avatar.setApiInfo({ signedUrl: config.signedUrl, appId: config.appId, sceneId: config.sceneId })
      const globalParams = {
        // This is intentionally identical to the supplied official React demo:
        // do not send `bitrate` or `fps`. In SDK 3.1, a supplied bitrate is
        // converted from bps to kbps; `2000` becomes 1 kbps and fails the
        // provider validation (minimum 200). Omitting it uses the SDK default.
        stream: { protocol: 'xrtc', alpha: 1 },
        avatar: { avatar_id: config.avatarId, width: 720, height: 1280 },
        tts: { vcn: config.vcn },
      }
      // Safe browser-side verification: this contains no secret or signed URL.
      // It makes it possible to confirm the exact start payload from DevTools.
      console.info('[iFlytek Avatar] official-demo global params', globalParams)
      avatar.setGlobalParams(globalParams)
      // Keep the player wrapper mounted: XRTC can connect successfully but
      // render no frame when it starts inside a display:none container.
      await avatar.start({ wrapper: avatarRoot.current })
      if (!isCurrentAttempt()) {
        try { avatar.stop?.() } catch { /* session was already invalidated */ }
        try { avatar.destroy?.() } catch { /* local cleanup only */ }
        return
      }
      setVirtualActive(true)
      setVirtualProvider('xunfei')
      window.requestAnimationFrame(() => avatarRoot.current?.removeAttribute('style'))
      setVirtualMessage('已就绪')
      await player?.resume?.().catch(() => undefined)
    } catch (reason) {
      if (isCurrentAttempt()) {
        await disposeAvatar(false, false)
        setVirtualActive(false)
        const failure = latestSdkError || (reason instanceof Error ? reason.message : '讯飞虚拟人连接失败。')
        setVirtualMessage(`${failure} ${runtimeResource ?? ''}`.trim())
      }
    } finally {
      if (isCurrentAttempt()) {
        avatarStartLock.current = false
        setVirtualLoading(false)
      }
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
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('当前浏览器不支持内置语音识别，请使用新版 Chrome 或 Edge，或启动 OpenTalking。')
        return
      }
      if (!window.isSecureContext) {
        setError('语音回答只能在 HTTPS 或 localhost 环境使用。')
        return
      }
      if (listening) {
        stopBrowserRecognition()
        setListening(false)
        setVirtualMessage('浏览器语音就绪')
        return
      }
      const recognition = new SpeechRecognition()
      browserRecognition.current = recognition
      browserRecognitionBase.current = draft.trim()
      recognition.lang = 'zh-CN'
      recognition.continuous = false
      recognition.interimResults = true
      let finalText = ''
      recognition.onresult = (event: any) => {
        let interim = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = String(event.results[index][0]?.transcript ?? '').trim()
          if (event.results[index].isFinal) finalText += transcript
          else interim += transcript
        }
        const text = (finalText || interim).trim()
        if (text) setDraft([browserRecognitionBase.current, text].filter(Boolean).join('\n'))
      }
      recognition.onerror = () => {
        setListening(false)
        browserRecognition.current = null
        setError('浏览器语音识别失败，请检查麦克风权限。')
      }
      recognition.onend = () => {
        setListening(false)
        browserRecognition.current = null
        setVirtualMessage('浏览器语音就绪')
      }
      try {
        recognition.start()
        setListening(true)
        setError('')
        setVirtualMessage('浏览器录音中')
      } catch {
        setListening(false)
        browserRecognition.current = null
        setError('浏览器语音识别启动失败，请刷新后重试。')
      }
      return
    }
    if (runtime.provider === 'opentalking' && runtime.openTalking) {
      if (!window.isSecureContext) {
        setError('语音回答只能在 HTTPS 或 localhost 环境使用，请先配置 HTTPS。')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError('当前浏览器不支持录音上传，请使用最新版 Chrome 或 Edge。')
        return
      }
      if (listening) {
        setVirtualMessage('识别中…')
        stopOpenTalkingRecording(true)
        return
      }
      try {
        openTalkingAudioChunks.current = []
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        openTalkingAudioStream.current = audioStream
        const recorderOptions = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined
        const recorder = new MediaRecorder(audioStream, recorderOptions)
        openTalkingRecorder.current = recorder
        recorder.ondataavailable = event => {
          if (event.data.size > 0) openTalkingAudioChunks.current.push(event.data)
        }
        recorder.onstop = () => {
          const chunks = openTalkingAudioChunks.current
          openTalkingAudioChunks.current = []
          openTalkingAudioStream.current?.getTracks().forEach(track => track.stop())
          openTalkingAudioStream.current = null
          openTalkingRecorder.current = null
          setListening(false)
          if (!chunks.length) return
          void (async () => {
            try {
              const audio = new Blob(chunks, { type: 'audio/webm' })
              const text = await transcribeOpenTalking(runtime.openTalking!, audio)
              if (!text) {
                setError('OpenTalking 未识别到有效语音，请靠近麦克风后重试。')
                return
              }
              setDraft(previous => (previous + (previous ? '\n' : '') + text).trim())
              setVirtualMessage('已转写')
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : 'OpenTalking 语音识别失败，请检查 STT Key 和麦克风权限。')
              setVirtualMessage('识别失败')
            }
          })()
        }
        recorder.start()
        setListening(true)
        setError('')
        setVirtualMessage('录音中')
      } catch (reason) {
        setListening(false)
        stopOpenTalkingRecording(false)
        setError(reason instanceof Error ? reason.message : 'OpenTalking 录音启动失败，请检查麦克风权限。')
      }
      return
    }
    if (runtime.provider !== 'xunfei' || !runtime.avatar) {
      setError('当前虚拟人运行时不可用，无法启动语音识别。')
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
      setVirtualMessage('录音中')
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

  function appendAssistantMessage(text: string, options: { persist?: boolean; allowChoice?: boolean } = {}) {
    const normalized = text.trim()
    if (!normalized || !question || (!options.allowChoice && choiceQuestion) || finished) return
    setMessages(previous => {
      if (previous.some(item => item.role === 'assistant' && item.content.trim() === normalized)) return previous
      const next = [...previous, { role: 'assistant' as const, content: normalized }]
      if (options.persist !== false) void save(next)
      return next
    })
  }

  async function applyFollowup(text: string) {
    const normalized = text.trim()
    if (!normalized || !question || choiceQuestion || finished) return
    if (nlpTimeout.current) window.clearTimeout(nlpTimeout.current)
    appendAssistantMessage(normalized)
    setThinking(false)
    setVirtualMessage('已追问')
  }

  followupHandler.current = applyFollowup

  async function waitFollowupTask(taskId: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1000))
      const task = await request<Task>('/v1/ai-tasks/' + taskId)
      if (task.status === 'SUCCESS') return task
      if (task.status === 'FAILED') throw new Error(task.errorMessage || 'AI 追问生成失败。')
    }
    throw new Error('AI 追问仍在生成中，请稍后继续。')
  }

  async function requestOpenTalkingFollowup(runtime: OpenTalkingRuntime, answer: string) {
    if (!question) return
    const prompt = [
      '你是正在进行模拟面试的 Java 后端技术面试官。',
      '请只基于当前题目和候选人刚刚对当前题目的回答生成下一句面试官要说的话。',
      '先用 1 到 2 句话简短回应答案质量，可以指出一个亮点、不足或给一句简短参考方向；然后只提出一个追问。',
      '追问必须围绕当前题目的原理、边界、复杂度、线程安全、实现细节或实践取舍展开，不能跳到简历、项目经历、岗位泛聊或其他题目。',
      '不要输出多道题，不要完整讲课，不要说自己是 AI。控制在 80 到 140 个中文字符。',
      `当前题目：${question.content}`,
      `候选人回答：${answer}`,
    ].join('\n')
    const followUp = (await askOpenTalking(runtime, prompt)).trim()
    if (!followUp) throw new Error('OpenTalking did not return a follow-up.')
    /*
      method: 'POST',
      body: JSON.stringify({ interviewQuestionId: question.interviewQuestionId, answer, question: question.content }),
    })
    if (!task.id) throw new Error('AI 追问任务创建失败。')
    const completed = await waitFollowupTask(task.id)
    const followUp = safeJson<{ followUp?: string }>(completed.outputPayload, {}).followUp?.trim()
    if (!followUp) throw new Error('AI 未返回有效追问。')
    */
    await applyFollowup(followUp)
    setVirtualMessage('追问中')
  }

  async function requestDeepSeekFollowup(answer: string) {
    if (!question) return
    const task = await request<Task>('/v1/interviews/' + id + '/follow-ups', {
      method: 'POST',
      body: JSON.stringify({ interviewQuestionId: question.interviewQuestionId, answer, question: question.content }),
    })
    if (!task.id) throw new Error('AI 追问任务创建失败。')
    const completed = await waitFollowupTask(task.id)
    const followUp = safeJson<{ followUp?: string }>(completed.outputPayload, {}).followUp?.trim()
    if (!followUp) throw new Error('AI 未返回有效追问。')
    await applyFollowup(followUp)
    await browserSpeak(followUp)
    setVirtualMessage('DeepSeek 已追问')
  }

  async function speakBriefly(text: string) {
    const runtime = avatarRuntime.current
    if (runtime?.provider === 'opentalking' && runtime.openTalking) {
      await speakOpenTalking(runtime.openTalking, text)
    } else if (runtime?.provider === 'xunfei') {
      await runtime.avatar?.writeText(text, { nlp: false })
    } else {
      await browserSpeak(text)
    }
    await new Promise(resolve => window.setTimeout(resolve, Math.min(6500, Math.max(2200, text.length * 90))))
  }

  function buildChoiceFeedback(selectedKeys: string[]) {
    const correctKeys = answerKeys(question?.correctAnswer)
    const correctText = choiceText(correctKeys, options)
    const correct = correctKeys.length > 0 && sameKeys(selectedKeys.slice().sort(), correctKeys)
    const explanation = (question?.explanation || question?.answerTemplate || '').trim()
    if (correct) return '回答正确，让我们来继续下一道题。'
    return `回答错误。正确答案是 ${correctText || '题库暂未配置'}。${explanation ? `解析：${explanation}。` : ''}让我们来继续下一道题。`
  }

  async function closeCurrentQuestion(answer: string) {
    if (!question) return
    const runtime = avatarRuntime.current
    const hasNext = active < questions.length - 1
    let closing = hasNext ? '这道题先到这里。好的，我们看下一题。' : '这道题先到这里，本轮题目已经完成。'
    if (runtime?.provider === 'opentalking' && runtime.openTalking) {
      const prompt = [
        '你是 Java 后端面试官。候选人刚回答完当前题，当前题不再继续追问。',
        hasNext ? '请用一句话简短总结候选人的回答，然后自然过渡到下一题。' : '请用一句话简短总结候选人的回答，并说明本轮题目已经完成。',
        '不要提出新问题，不要展开讲课，不要评分。控制在 50 个中文字符以内。',
        `当前题目：${question.content}`,
        `候选人回答：${answer}`,
      ].join('\n')
      closing = (await askOpenTalking(runtime.openTalking, prompt, 60000)).trim() || closing
    } else {
      await speakBriefly(closing)
    }
    appendAssistantMessage(closing)
    setThinking(false)
    if (hasNext) setActive(active + 1)
  }

  async function send() {
    if (!question || finished || thinking) return
    if (sendLock.current) return
    sendLock.current = true
    const content = choiceQuestion ? selected.join(', ') : draft.trim()
    if (!content) sendLock.current = false
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
        const candidateMessage = { role: 'candidate' as const, content: `我选择：${choiceText(selected, options) || content}` }
        const feedback = buildChoiceFeedback(selected)
        // Choice questions are deterministic: do not hand the answer to an LLM
        // or OpenTalking's agent. Render exactly the sentence that will be
        // spoken by the avatar, so the dialogue and media output stay in sync.
        setMessages(previous => [...previous, candidateMessage, { role: 'assistant' as const, content: feedback }])
        setAnswers(previous => ({ ...previous, [question.interviewQuestionId]: { interviewQuestionId: question.interviewQuestionId, answerContent: content, answerData: JSON.stringify(selected) } }))
        setVirtualMessage('讲评中')
        await speakBriefly(feedback)
        if (active < questions.length - 1) setActive(active + 1)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '答案保存失败。')
      } finally {
        setThinking(false)
        sendLock.current = false
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
        await closeCurrentQuestion(content)
        return
      }
      const runtime = avatarRuntime.current
      if (!runtime || !virtualActive) {
        setVirtualMessage('DeepSeek 追问中')
        await requestDeepSeekFollowup(content)
        return
      }
      if (runtime.provider === 'opentalking' && runtime.openTalking) {
        setVirtualMessage('追问中')
        await requestOpenTalkingFollowup(runtime.openTalking, content)
        return
      }
      setVirtualMessage('追问中')
      await runtime.avatar?.writeText(content, { nlp: true, avatar_dispatch: { interactive_mode: 1, content_analysis: 1 } })
      nlpTimeout.current = window.setTimeout(() => {
        setThinking(false)
        setVirtualMessage('讯飞未在预期时间返回追问。你可以继续补充回答，或进入下一题。')
      }, 15000)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '答案保存或讯飞交互失败。')
      setThinking(false)
    } finally {
      sendLock.current = false
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

  async function retryReportGeneration() {
    setThinking(true)
    setFinishPhase('evaluating')
    setFinishMessage('正在重新提交报告生成任务…')
    try {
      const task = await request<Task>('/v1/interviews/' + id + '/evaluation-task/retry', { method: 'POST' })
      await waitEvaluationTask(String(task.id))
      setFinishPhase('ready')
      setFinishMessage('报告已生成，即将打开能力报告。')
      window.setTimeout(() => navigate('/candidate/interviews/' + id + '/report'), 650)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '报告重新生成失败'
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
    ? (active < questions.length - 1 ? '提交并下一题' : '提交')
    : '发送'

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div><button onClick={() => navigate('/candidate/interviews')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回</button><h1 className="text-xl font-bold lg:text-2xl">{interview.title}</h1><p className="mt-1 text-sm text-muted-foreground">#{id} · 对话面试</p></div>
      <div className="flex items-center gap-3"><div className="rounded-2xl bg-muted px-4 py-2 text-right"><p className="text-xs text-muted-foreground">{finished ? '面试已结束' : '剩余时间'}</p><p className="font-mono text-xl font-bold">{finished ? '--:--' : remainingText(seconds)}</p></div>{!finished && <Button variant="danger" disabled={thinking} onClick={() => { setFinishPhase('confirm'); setFinishMessage(''); setFinishDialogOpen(true) }}><Square className="h-4 w-4" />结束面试</Button>}</div>
    </header>
    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
      <Card className="h-fit p-3"><div className="flex justify-between px-2 py-2"><strong>题目</strong><span className="text-sm text-muted-foreground">{active + 1}/{questions.length}</span></div><div className="mx-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--primary)]" style={{ width: Math.round(((active + 1) / questions.length) * 100) + '%' }} /></div><div className="mt-3 space-y-1">{questions.map((item, index) => <button key={item.interviewQuestionId} onClick={() => setActive(index)} className={'flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm ' + (index === active ? 'bg-[var(--accent-soft)] text-[var(--foreground)]' : 'hover:bg-muted')}><b className="text-xs">{String(index + 1).padStart(2, '0')}</b><span className="line-clamp-2">{item.content}</span></button>)}</div></Card>
      <Card className="flex min-h-[620px] flex-col"><div className="flex items-center justify-between border-b border-border pb-4"><Badge tone="info">{question.questionType.replace('_', ' ')}</Badge><span className="text-sm text-muted-foreground">{choiceQuestion ? `${question.maxScore} 分` : `追问 ${Math.min(followUps, limit)}/${limit}`}</span></div><div className="mt-5 rounded-2xl bg-[var(--accent-soft)] p-4"><p className="text-xs font-bold text-[var(--accent)]">当前题目</p><p className="mt-2 leading-7">{question.content}</p></div><div className="my-5 flex flex-1 flex-col gap-3 overflow-y-auto"><AnimatePresence initial={false}>{messages.map((message, index) => <motion.article key={message.role + '-' + index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ' + (message.role === 'candidate' ? 'ml-auto bg-[var(--primary)] text-white' : 'bg-muted')}><p className="mb-1 text-xs font-bold">{message.role === 'candidate' ? '我' : virtualInterviewerName}</p>{message.content}</motion.article>)}</AnimatePresence>{thinking && <p className="w-fit rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">处理中…</p>}</div>{choiceQuestion ? <div className="space-y-2">{options.map(option => <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"><input type={question.questionType === 'multiple_choice' ? 'checkbox' : 'radio'} name="answer" checked={selected.includes(option.key)} onChange={() => setSelected(previous => question.questionType === 'multiple_choice' ? previous.includes(option.key) ? previous.filter(value => value !== option.key) : [...previous, option.key] : [option.key])} />{option.key}. {option.text}</label>)}</div> : <div className="relative"><textarea value={draft} disabled={finished} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void send() }} className="min-h-32 w-full rounded-2xl border border-border bg-background p-4 pr-14 text-sm outline-none focus:border-[var(--accent)]" placeholder="输入回答，或点麦克风。" /><button type="button" onClick={() => void toggleVoiceAnswer()} disabled={finished} className={'absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-xl ' + (listening ? 'bg-rose-500 text-white' : 'bg-[var(--primary)] text-white')} title={listening ? '停止录音' : '语音回答'}><Mic className="h-4 w-4" /></button><p className="mt-2 text-xs text-muted-foreground">{listening ? '录音中，再点停止。' : '语音会自动转写到回答框。'}</p></div>}<div className="mt-4 flex justify-between gap-2"><Button variant="secondary" disabled={active === 0} onClick={() => setActive(value => value - 1)}><ChevronLeft className="h-4 w-4" />上一题</Button><Button disabled={thinking || finished} onClick={() => void send()}>{submitLabel}<Send className="h-4 w-4" /></Button><Button variant="secondary" disabled={active === questions.length - 1} onClick={() => setActive(value => value + 1)}>下一题<ChevronRight className="h-4 w-4" /></Button></div></Card>
      <div className="space-y-5"><Card className="overflow-hidden p-0"><div className="relative min-h-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_16%,rgba(235,214,255,.75),transparent_36%),linear-gradient(180deg,#fff7fb_0%,#f2ebe2_100%)] dark:bg-[radial-gradient(circle_at_50%_16%,rgba(120,88,170,.35),transparent_36%),linear-gradient(180deg,#211b19_0%,#151210_100%)]"><div className="absolute left-4 top-4 z-20 rounded-full border border-white/55 bg-white/75 px-3 py-1 text-xs font-bold text-[#8a5f3f] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-amber-100">{virtualActive ? virtualProviderName : '未接入'}</div><div ref={avatarRoot} className={'absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover ' + (virtualActive ? 'block' : 'hidden')} />{!virtualActive && <div className="absolute inset-0 grid place-items-center"><div className="relative grid h-56 w-56 place-items-center"><div className="absolute inset-0 rounded-full border border-dashed border-[#b17653]/35" /><div className="absolute h-40 w-40 animate-[spin_10s_linear_infinite] rounded-full border border-[#b17653]/20" /><span className="z-10 grid h-24 w-24 place-items-center rounded-[32px] bg-[#11100f] text-white shadow-[0_24px_80px_rgba(119,83,59,.28)]"><Sparkles className="h-10 w-10" /></span></div></div>}<div className="absolute bottom-4 left-4 right-4 z-20 rounded-[22px] border border-white/45 bg-white/78 px-4 py-3 text-[#251c18] shadow-[0_18px_45px_rgba(84,58,41,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/35 dark:text-white"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">面试官</p><p className="mt-1 text-xs leading-5 opacity-75">{virtualLoading ? '连接中…' : virtualMessage}</p></div><span className={'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ' + (virtualActive ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,.7)]' : 'bg-amber-500')} /></div>{!virtualActive && <Button className="mt-3 h-9 px-3" disabled={virtualLoading || finished} onClick={() => void startAvatar()}><Play className="h-3.5 w-3.5" />启动</Button>}{playBlocked && <Button variant="secondary" className="mt-3 h-9 px-3" onClick={() => void resumeAvatarAudio()}><Volume2 className="h-3.5 w-3.5" />恢复声音</Button>}</div></div><div className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">朗读</p></div><button className="rounded-xl p-2 hover:bg-muted" onClick={() => setTts(value => !value)}>{tts ? <Volume2 className="h-4 w-4 text-[var(--accent)]" /> : <VolumeX className="h-4 w-4" />}</button></div><button onClick={() => void readQuestion(question)} className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"><Volume2 className="h-3.5 w-3.5" />重读题目</button></Card><Card><div className="flex items-center justify-between"><div><p className="font-semibold">摄像头</p></div><Button variant="secondary" className="h-9 px-3" onClick={() => void camera()}><Camera className="h-4 w-4" />{cameraOn ? '关闭' : '开启'}</Button></div><div className="relative mt-4 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-muted"><video ref={video} autoPlay muted playsInline className={'h-full w-full object-cover ' + (cameraOn ? 'block -scale-x-100' : 'hidden')} />{!cameraOn && <div className="text-center text-muted-foreground"><Camera className="mx-auto h-6 w-6" /><p className="mt-2 text-xs">未开启</p></div>}</div>{!window.isSecureContext && <p className="mt-3 text-xs leading-5 text-amber-700">当前连接不支持摄像头/麦克风。</p>}</Card></div>
    </div>
    {finishDialogOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="finish-dialog-title"><motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .2, ease: 'easeOut' }} className="w-full max-w-md overflow-hidden rounded-[30px] border border-border bg-surface shadow-[0_28px_90px_rgba(20,18,17,.22)]"><div className="soft-emphasis-panel rounded-none border-0 p-6 shadow-none"><span className={'grid h-12 w-12 place-items-center rounded-2xl shadow-sm ' + (finishPhase === 'ready' ? 'bg-emerald-50 text-emerald-700' : finishPhase === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{finishPhase === 'ready' ? <CheckCircle2 className="h-6 w-6" /> : finishPhase === 'submitting' || finishPhase === 'evaluating' ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertTriangle className="h-6 w-6" />}</span><h2 id="finish-dialog-title" className="mt-5 text-2xl font-bold">{finishPhase === 'confirm' ? '确认结束本次面试？' : finishPhase === 'ready' ? '报告生成完成' : finishPhase === 'failed' ? '报告生成遇到问题' : '正在生成面试报告'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{finishPhase === 'confirm' ? '结束后系统会锁定当前答题记录，并自动生成 AI 评分与面试报告。' : finishMessage}</p></div><div className="space-y-3 p-6"><div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground"><p><span className="font-semibold text-foreground">当前进度：</span>{active + 1}/{questions.length} 题</p><p className="mt-1"><span className="font-semibold text-foreground">剩余时间：</span>{remainingText(seconds)}</p></div>{finishPhase !== 'confirm' && <div className="rounded-2xl border border-border bg-background/70 p-4"><p className="text-sm font-semibold text-foreground">{finishPhase === 'ready' ? '报告已生成' : finishPhase === 'failed' ? '生成失败' : '正在处理'}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{finishMessage}</p></div>}<div className="flex justify-end gap-3 pt-2">{finishPhase === 'confirm' && <Button variant="secondary" disabled={thinking} onClick={() => setFinishDialogOpen(false)}>继续作答</Button>}{finishPhase === 'confirm' && <Button variant="danger" disabled={thinking} onClick={() => void finishWithProgress()}><Square className="h-4 w-4" />确认结束</Button>}{finishPhase === 'failed' && <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回大厅</Button>}{finishPhase === 'failed' && <Button disabled={thinking} onClick={() => void retryReportGeneration()}>重新生成报告</Button>}</div></div></motion.div></div>}
  </div>
}
