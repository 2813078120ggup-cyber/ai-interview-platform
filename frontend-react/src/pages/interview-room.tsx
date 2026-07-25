import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Mic, Send, Sparkles, Square, Volume2, VolumeX } from 'lucide-react'
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
type EndResponse = { interview: Interview; evaluationTaskId?: string; evaluationTaskStatus?: string }
type FinishPhase = 'confirm' | 'submitting' | 'evaluating' | 'ready' | 'failed'
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const FOLLOW_UP_MIN = 2
const FOLLOW_UP_MAX = 5
const choiceTypes = ['single_choice', 'multiple_choice', 'true_false']
const safeJson = <T,>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
const remainingText = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
const roomStateKey = (id: string) => `interviewos_room_state_${id}`
const draftKey = (id: string, questionId: string) => `interviewos_answer_draft_${id}_${questionId}`

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
  const [cameraOn, setCameraOn] = useState(false)
  const [listening, setListening] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [finishPhase, setFinishPhase] = useState<FinishPhase>('confirm')
  const [finishMessage, setFinishMessage] = useState('')
  const [limits, setLimits] = useState<Record<string, number>>({})
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const speechToken = useRef(0)

  const question = questions[active]
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
    setMessages(Array.isArray(stored) && stored.every(item => typeof item === 'object' && item && 'role' in item && 'content' in item) ? stored as Message[] : saved?.answerContent ? [{ role: 'candidate', content: saved.answerContent }] : [])
    const localDraft = localStorage.getItem(draftKey(id, question.interviewQuestionId))
    setDraft(localDraft ?? (choiceQuestion ? '' : saved?.answerContent ?? ''))
    setLimits(previous => previous[question.interviewQuestionId] ? previous : { ...previous, [question.interviewQuestionId]: Math.floor(Math.random() * (FOLLOW_UP_MAX - FOLLOW_UP_MIN + 1)) + FOLLOW_UP_MIN })
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
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey(id, question.interviewQuestionId), draft)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [id, question, choiceQuestion, finished, draft])

  useEffect(() => {
    if (question && tts) speak(question.content)
  }, [question?.interviewQuestionId])

  useEffect(() => () => {
    stream.current?.getTracks().forEach(track => track.stop())
    recognition.current?.stop()
    window.speechSynthesis?.cancel()
  }, [])

  async function waitTask(taskId: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1000))
      const task = await request<Task>('/v1/ai-tasks/' + taskId)
      if (task.status === 'SUCCESS') return safeJson<Record<string, string>>(task.outputPayload, {}).followUp ?? ''
      if (task.status === 'FAILED') throw new Error(task.errorMessage ?? 'AI 面试官暂时不可用')
    }
    throw new Error('AI 面试官响应超时，请稍后重试')
  }

  async function waitEvaluationTask(taskId: string) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1500))
      const task = await request<Task>('/v1/ai-tasks/' + taskId)
      if (task.status === 'SUCCESS') return task
      if (task.status === 'FAILED') throw new Error(task.errorMessage ?? 'AI 报告生成失败，请稍后在报告页重试或联系管理员。')
      setFinishMessage(task.status === 'RUNNING' ? 'AI 正在评估答案并生成报告…' : '评测任务已提交，等待 AI 处理…')
    }
    throw new Error('报告生成等待超时，系统会继续在后台处理，你可以稍后到能力报告查看。')
  }

  function speak(text: string, force = false) {
    if ((!tts && !force) || !text) return
    if (!('speechSynthesis' in window)) {
      if (force) setError('当前浏览器不支持语音朗读，请升级 Chrome / Edge，或接入服务端 TTS。')
      return
    }
    const token = speechToken.current + 1
    speechToken.current = token
    const synth = window.speechSynthesis
    const speechErrorMessage = '语音朗读未能启动，请点击“重新朗读本题”后重试。'
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = .95
    utterance.pitch = 1
    const voice = synth.getVoices().find(item => item.lang.toLowerCase().startsWith('zh'))
    if (voice) utterance.voice = voice
    utterance.onstart = () => {
      if (speechToken.current === token) setError(previous => previous === speechErrorMessage || previous.includes('语音朗读') ? '' : previous)
    }
    utterance.onerror = event => {
      if (speechToken.current !== token || event.error === 'interrupted' || event.error === 'canceled') return
      setError(speechErrorMessage)
    }
    utterance.onend = () => {
      if (speechToken.current === token) setError(previous => previous === speechErrorMessage ? '' : previous)
    }
    const start = () => { synth.speak(utterance); synth.resume() }
    if (synth.getVoices().length === 0) synth.onvoiceschanged = () => { synth.onvoiceschanged = null; start() }
    else start()
  }

  function toggleVoiceAnswer() {
    if (listening) { recognition.current?.stop(); return }
    if (!window.isSecureContext) { setError('语音回答只能在 HTTPS 或 localhost 环境使用，请先配置 HTTPS。'); return }
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Constructor) { setError('当前浏览器不支持语音识别，请使用 Chrome、Edge 或改用文字回答。'); return }
    const instance = new Constructor()
    instance.lang = 'zh-CN'
    instance.continuous = false
    instance.interimResults = false
    instance.onresult = event => {
      let transcript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript
      }
      if (transcript.trim()) setDraft(previous => (previous + (previous ? '\n' : '') + transcript.trim()).trim())
    }
    instance.onerror = event => setError(event.error === 'not-allowed' ? '未获得麦克风权限，请在浏览器地址栏中允许访问。' : '语音识别失败，请重试或改用文字回答。')
    instance.onend = () => setListening(false)
    recognition.current = instance
    setListening(true)
    instance.start()
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

  async function send() {
    if (!question || finished || thinking) return
    const content = choiceQuestion ? selected.join(', ') : draft.trim()
    if (!content) { setError('请先完成本题作答'); return }
    setThinking(true)
    setError('')
    try {
      if (choiceQuestion) {
        await request('/v1/interviews/' + id + '/questions/' + question.interviewQuestionId + '/answer', {
          method: 'PUT',
          body: JSON.stringify({ answerContent: content, answerData: JSON.stringify(selected), durationSeconds: Math.max(0, (interview?.duration ?? 0) * 60 - seconds) }),
        })
        localStorage.removeItem(draftKey(id, question.interviewQuestionId))
        if (active < questions.length - 1) setActive(active + 1)
        return
      }
      const candidateMessages = [...messages, { role: 'candidate' as const, content }]
      setMessages(candidateMessages)
      setDraft('')
      await save(candidateMessages)
      if (followUps >= limit) {
        if (active < questions.length - 1) setActive(active + 1)
        return
      }
      try {
        const task = await request<{ id: string }>('/v1/interviews/' + id + '/follow-ups', {
          method: 'POST',
          body: JSON.stringify({ interviewQuestionId: question.interviewQuestionId, answer: content, question: question.content }),
        })
        const followUp = await waitTask(task.id)
        const complete = [...candidateMessages, { role: 'assistant' as const, content: followUp }]
        setMessages(complete)
        await save(complete)
        speak(followUp)
      } catch (reason) {
        setError((reason instanceof Error ? reason.message : 'AI 面试官暂时不可用') + '。你的回答已保存，可以继续下一题或稍后重试。')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '答案保存失败')
    } finally {
      setThinking(false)
    }
  }

  async function finishWithProgress() {
    setThinking(true)
    setFinishPhase('submitting')
    setFinishMessage('正在锁定本次答题记录…')
    try {
      const result = await request<EndResponse>('/v1/interviews/' + id + '/end', { method: 'POST' })
      localStorage.removeItem(roomStateKey(id))
      questions.forEach(item => localStorage.removeItem(draftKey(id, item.interviewQuestionId)))
      setInterview(result.interview)
      setFinishPhase('evaluating')
      setFinishMessage('答题记录已锁定，正在生成评分和面试报告…')
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
    if (!window.isSecureContext) { setError('摄像头只能在 HTTPS 或 localhost 环境使用，请先配置域名与 HTTPS。'); return }
    if (!navigator.mediaDevices?.getUserMedia) { setError('当前浏览器不支持摄像头访问。'); return }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (video.current) video.current.srcObject = stream.current
      setCameraOn(true)
    } catch {
      setError('未获得摄像头权限，请在浏览器地址栏中允许访问。')
    }
  }

  if (loading) return <Card>正在加载 AI 面试间…</Card>
  if (!interview || !question) return <Card><strong>无法打开该面试</strong><p className="mt-2 text-sm text-muted-foreground">{error || '面试不存在，或你没有访问权限。'}</p><Button className="mt-5" variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回面试大厅</Button></Card>

  const submitLabel = choiceQuestion ? (active < questions.length - 1 ? '提交答案并进入下一题' : '提交答案') : (followUps >= limit && active < questions.length - 1 ? '完成本题并进入下一题' : '发送回答')

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <button onClick={() => navigate('/candidate/interviews')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回面试大厅</button>
        <h1 className="text-xl font-bold lg:text-2xl">{interview.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">#{id} · AI 对话式面试</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-muted px-4 py-2 text-right"><p className="text-xs text-muted-foreground">{finished ? '面试已结束' : '剩余时间'}</p><p className="font-mono text-xl font-bold">{finished ? '--:--' : remainingText(seconds)}</p></div>
        {!finished && <Button variant="danger" disabled={thinking} onClick={() => { setFinishPhase('confirm'); setFinishMessage(''); setFinishDialogOpen(true) }}><Square className="h-4 w-4" />结束面试</Button>}
      </div>
    </header>

    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_310px]">
      <Card className="h-fit p-3">
        <div className="flex justify-between px-2 py-2"><strong>面试题目</strong><span className="text-sm text-muted-foreground">{active + 1}/{questions.length}</span></div>
        <div className="mx-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--primary)]" style={{ width: Math.round(((active + 1) / questions.length) * 100) + '%' }} /></div>
        <div className="mt-3 space-y-1">{questions.map((item, index) => <button key={item.interviewQuestionId} onClick={() => setActive(index)} className={'flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm ' + (index === active ? 'bg-[var(--accent-soft)] text-[var(--foreground)]' : 'hover:bg-muted')}><b className="text-xs">{String(index + 1).padStart(2, '0')}</b><span className="line-clamp-2">{item.content}</span></button>)}</div>
      </Card>

      <Card className="flex min-h-[620px] flex-col">
        <div className="flex items-center justify-between border-b border-border pb-4"><Badge tone="info">{question.questionType.replace('_', ' ')}</Badge><span className="text-sm text-muted-foreground">{choiceQuestion ? String(question.maxScore) + ' 分 · 提交后直接下一题' : 'AI 追问 ' + Math.min(followUps, limit) + '/' + limit}</span></div>
        <div className="mt-5 rounded-2xl bg-[var(--accent-soft)] p-4"><p className="text-xs font-bold text-[var(--accent)]">题库原题 · 当前问题</p><p className="mt-2 leading-7">{question.content}</p></div>
        <div className="my-5 flex flex-1 flex-col gap-3 overflow-y-auto">
          <AnimatePresence initial={false}>{messages.map((message, index) => <motion.article key={message.role + '-' + index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ' + (message.role === 'candidate' ? 'ml-auto bg-[var(--primary)] text-white' : 'bg-muted')}><p className="mb-1 text-xs font-bold">{message.role === 'candidate' ? '我' : 'AI 面试官追问'}</p>{message.content}</motion.article>)}</AnimatePresence>
          {thinking && <p className="w-fit rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">AI 面试官正在思考…</p>}
        </div>
        {choiceQuestion ? <div className="space-y-2">{options.map(option => <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"><input type={question.questionType === 'multiple_choice' ? 'checkbox' : 'radio'} name="answer" checked={selected.includes(option.key)} onChange={() => setSelected(previous => question.questionType === 'multiple_choice' ? previous.includes(option.key) ? previous.filter(value => value !== option.key) : [...previous, option.key] : [option.key])} />{option.key}. {option.text}</label>)}</div> : <div className="relative"><textarea value={draft} disabled={finished} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void send() }} className="min-h-32 w-full rounded-2xl border border-border bg-background p-4 pr-14 text-sm outline-none focus:border-[var(--accent)]" placeholder="输入回答，或点击麦克风进行语音回答。" /><button type="button" onClick={toggleVoiceAnswer} disabled={finished} className={'absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-xl ' + (listening ? 'bg-rose-500 text-white' : 'bg-[var(--primary)] text-white')} title={listening ? '停止语音识别' : '开始语音回答'}><Mic className="h-4 w-4" /></button><p className="mt-2 text-xs text-muted-foreground">{listening ? '正在聆听，请说话；再次点击麦克风可停止。' : '语音回答会自动转为文字，可继续编辑后发送。'}</p></div>}
        <div className="mt-4 flex justify-between gap-2"><Button variant="secondary" disabled={active === 0} onClick={() => setActive(value => value - 1)}><ChevronLeft className="h-4 w-4" />上一题</Button><Button disabled={thinking || finished} onClick={() => void send()}>{submitLabel}<Send className="h-4 w-4" /></Button><Button variant="secondary" disabled={active === questions.length - 1} onClick={() => setActive(value => value + 1)}>下一题<ChevronRight className="h-4 w-4" /></Button></div>
      </Card>

      <div className="space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="soft-emphasis-panel relative grid aspect-video place-items-center"><div className="absolute h-40 w-40 animate-[spin_8s_linear_infinite] rounded-full border border-[var(--border)]/50" /><span className="z-10 grid h-20 w-20 place-items-center rounded-[28px] bg-[var(--brand)]/15 shadow-[0_0_45px_rgba(109,93,252,.28)]"><Sparkles className="h-9 w-9 text-[var(--accent)]" /></span><div className="absolute bottom-4 text-center"><p className="font-bold">AI 面试官</p><p className="mt-1 text-xs text-white/75">仅在主观题回答后追问</p></div></div>
          <div className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">语音朗读</p><p className="mt-1 text-xs text-muted-foreground">朗读当前题库原题</p></div><button className="rounded-xl p-2 hover:bg-muted" onClick={() => { setTts(value => !value); window.speechSynthesis?.cancel() }}>{tts ? <Volume2 className="h-4 w-4 text-[var(--accent)]" /> : <VolumeX className="h-4 w-4" />}</button></div>
          <button onClick={() => speak(question.content, true)} className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"><Volume2 className="h-3.5 w-3.5" />重新朗读本题</button>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><div><p className="font-semibold">我的画面</p><p className="mt-1 text-xs text-muted-foreground">仅本地预览</p></div><Button variant="secondary" className="h-9 px-3" onClick={() => void camera()}><Camera className="h-4 w-4" />{cameraOn ? '关闭' : '开启'}</Button></div>
          <div className="relative mt-4 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-muted"><video ref={video} autoPlay muted playsInline className={'h-full w-full object-cover ' + (cameraOn ? 'block -scale-x-100' : 'hidden')} />{!cameraOn && <div className="text-center text-muted-foreground"><Camera className="mx-auto h-6 w-6" /><p className="mt-2 text-xs">尚未开启摄像头</p></div>}</div>
          {!window.isSecureContext && <p className="mt-3 text-xs leading-5 text-amber-700">当前 HTTP 连接不允许浏览器调用摄像头与语音识别；生产环境请配置 HTTPS。</p>}
        </Card>
      </div>
    </div>

    {finishDialogOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="finish-dialog-title">
      <motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }} transition={{ duration: .2, ease: 'easeOut' }} className="w-full max-w-md overflow-hidden rounded-[30px] border border-border bg-surface shadow-[0_28px_90px_rgba(20,18,17,.22)]">
        <div className="soft-emphasis-panel rounded-none border-0 p-6 shadow-none">
          <span className={'grid h-12 w-12 place-items-center rounded-2xl shadow-sm ' + (finishPhase === 'ready' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' : finishPhase === 'failed' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200')}>{finishPhase === 'ready' ? <CheckCircle2 className="h-6 w-6" /> : finishPhase === 'submitting' || finishPhase === 'evaluating' ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertTriangle className="h-6 w-6" />}</span>
          <h2 id="finish-dialog-title" className="mt-5 text-2xl font-bold">{finishPhase === 'confirm' ? '确认结束本次面试？' : finishPhase === 'ready' ? '报告生成完成' : finishPhase === 'failed' ? '报告生成遇到问题' : '正在生成面试报告'}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{finishPhase === 'confirm' ? '结束后系统会锁定当前答题记录，并自动生成 AI 评分与面试报告。' : finishMessage}</p>
        </div>
        <div className="space-y-3 p-6">
          <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground"><p><span className="font-semibold text-foreground">当前进度：</span>{active + 1}/{questions.length} 题</p><p className="mt-1"><span className="font-semibold text-foreground">剩余时间：</span>{remainingText(seconds)}</p></div>
          {finishPhase !== 'confirm' && <div className="rounded-2xl border border-border bg-background/70 p-4"><p className="text-sm font-semibold text-foreground">{finishPhase === 'ready' ? '报告已生成' : finishPhase === 'failed' ? '生成失败' : '正在处理'}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{finishMessage}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-pink))] transition-all duration-500" style={{ width: finishPhase === 'submitting' ? '34%' : finishPhase === 'evaluating' ? '72%' : '100%' }} /></div></div>}
          <div className="flex justify-end gap-3 pt-2">{finishPhase === 'confirm' && <Button variant="secondary" disabled={thinking} onClick={() => setFinishDialogOpen(false)}>继续作答</Button>}{finishPhase === 'confirm' && <Button variant="danger" disabled={thinking} onClick={() => void finishWithProgress()}><Square className="h-4 w-4" />确认结束</Button>}{finishPhase === 'failed' && <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回大厅</Button>}{finishPhase === 'failed' && <Button onClick={() => navigate('/candidate/interviews/' + id + '/report')}>稍后查看报告</Button>}</div>
        </div>
      </motion.div>
    </div>}
  </div>
}
