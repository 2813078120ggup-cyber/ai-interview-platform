import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Send, Sparkles, Square, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type Interview } from '@/lib/api'

type Question = { interviewQuestionId: string; content: string; options?: string; questionType: string; maxScore: number }
type Answer = { interviewQuestionId: string; answerContent?: string; answerData?: string }
type Message = { role: 'assistant' | 'candidate'; content: string }
type Task = { status: string; outputPayload?: string; errorMessage?: string }
const FOLLOW_UP_MIN = 2
const FOLLOW_UP_MAX = 5

const safeJson = <T,>(value: string | undefined, fallback: T): T => { try { return value ? JSON.parse(value) : fallback } catch { return fallback } }
const remainingText = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

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
  const [limits, setLimits] = useState<Record<string, number>>({})
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const question = questions[active]
  const finished = interview?.status === 2
  const choiceQuestion = ['single_choice', 'multiple_choice', 'true_false'].includes(question?.questionType ?? '')
  const options = useMemo(() => safeJson<Array<{ key: string; text: string }>>(question?.options, []), [question?.options])
  const followUps = messages.filter((item, index) => item.role === 'assistant' && index > 0).length
  const limit = question ? limits[question.interviewQuestionId] ?? FOLLOW_UP_MAX : FOLLOW_UP_MAX

  useEffect(() => {
    let cancelled = false
    void Promise.all([request<Interview>(`/v1/interviews/${id}`), request<Question[]>(`/v1/interviews/${id}/questions`), request<Answer[]>(`/v1/interviews/${id}/answers`)])
      .then(([item, questionList, answerList]) => {
        if (cancelled) return
        setInterview(item); setQuestions(questionList); setSeconds(item.status === 1 ? item.duration * 60 : 0)
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
    setDraft('')
    setLimits(previous => previous[question.interviewQuestionId] ? previous : { ...previous, [question.interviewQuestionId]: Math.floor(Math.random() * (FOLLOW_UP_MAX - FOLLOW_UP_MIN + 1)) + FOLLOW_UP_MIN })
  }, [question, answers])

  useEffect(() => {
    if (interview?.status !== 1 || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [interview?.status, seconds])
  useEffect(() => () => { stream.current?.getTracks().forEach(track => track.stop()); window.speechSynthesis?.cancel() }, [])

  async function waitTask(taskId: string, key: 'question' | 'followUp') {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1000))
      const task = await request<Task>(`/v1/ai-tasks/${taskId}`)
      if (task.status === 'SUCCESS') return safeJson<Record<string, string>>(task.outputPayload, {})[key] ?? ''
      if (task.status === 'FAILED') throw new Error(task.errorMessage ?? 'AI 面试官暂时不可用')
    }
    throw new Error('AI 面试官响应超时，请稍后重试')
  }
  function speak(text: string) {
    if (!tts || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'zh-CN'; window.speechSynthesis.speak(utterance)
  }
  async function openQuestion() {
    if (!question || messages.some(item => item.role === 'assistant') || interview?.status !== 1) return
    setThinking(true)
    try { const task = await request<{ id: string }>(`/v1/interviews/${id}/ai-opening`, { method: 'POST' }); const content = await waitTask(task.id, 'question'); setMessages([{ role: 'assistant', content }]); speak(content) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'AI 面试官连接失败') } finally { setThinking(false) }
  }
  useEffect(() => { void openQuestion() }, [question?.interviewQuestionId])
  async function save(next: Message[]) {
    if (!question || !interview) return
    const answerContent = next.filter(item => item.role === 'candidate').map(item => item.content).join('\n')
    const answerData = JSON.stringify(next)
    await request(`/v1/interviews/${id}/questions/${question.interviewQuestionId}/answer`, { method: 'PUT', body: JSON.stringify({ answerContent, answerData, durationSeconds: Math.max(0, interview.duration * 60 - seconds) }) })
    setAnswers(previous => ({ ...previous, [question.interviewQuestionId]: { interviewQuestionId: question.interviewQuestionId, answerContent, answerData } }))
  }
  async function send() {
    if (!question || finished || thinking) return
    const content = choiceQuestion ? selected.join(', ') : draft.trim()
    if (!content) { setError('请先完成本题作答'); return }
    setThinking(true); setError('')
    try {
      if (choiceQuestion) { await request(`/v1/interviews/${id}/questions/${question.interviewQuestionId}/answer`, { method: 'PUT', body: JSON.stringify({ answerContent: content, answerData: JSON.stringify(selected), durationSeconds: Math.max(0, (interview?.duration ?? 0) * 60 - seconds) }) }); if (active < questions.length - 1) setActive(active + 1); return }
      const candidateMessages = [...messages, { role: 'candidate' as const, content }]
      setMessages(candidateMessages); setDraft(''); await save(candidateMessages)
      if (followUps >= limit) { if (active < questions.length - 1) setActive(active + 1); return }
      const task = await request<{ id: string }>(`/v1/interviews/${id}/follow-ups`, { method: 'POST', body: JSON.stringify({ answer: content, question: question.content }) })
      const followUp = await waitTask(task.id, 'followUp'); const complete = [...candidateMessages, { role: 'assistant' as const, content: followUp }]
      setMessages(complete); await save(complete); speak(followUp)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '答案保存失败') } finally { setThinking(false) }
  }
  async function finish() { if (!window.confirm('确定结束本次面试吗？结束后将自动生成评分与报告。')) return; setThinking(true); try { await request(`/v1/interviews/${id}/end`, { method: 'POST' }); navigate(`/candidate/interviews/${id}/report`) } catch (reason) { setError(reason instanceof Error ? reason.message : '结束面试失败') } finally { setThinking(false) } }
  async function camera() { if (cameraOn) { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setCameraOn(false); return } if (!window.isSecureContext) { setError('摄像头仅能在 HTTPS 或 localhost 环境使用，请先配置域名与 HTTPS。'); return } try { stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); if (video.current) video.current.srcObject = stream.current; setCameraOn(true) } catch { setError('未获得摄像头权限，请在浏览器地址栏中允许访问。') } }

  if (loading) return <Card>正在加载 AI 面试间…</Card>
  if (!interview || !question) return <Card><strong>无法打开该面试</strong><p className="mt-2 text-sm text-muted-foreground">{error || '面试不存在，或你没有访问权限。'}</p><Button className="mt-5" variant="secondary" onClick={() => navigate('/candidate/interviews')}>返回面试大厅</Button></Card>
  return <div className="space-y-5"><header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"><div><button onClick={() => navigate('/candidate/interviews')} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回面试大厅</button><h1 className="text-xl font-bold lg:text-2xl">{interview.title}</h1><p className="mt-1 text-sm text-muted-foreground">#{id} · AI 对话式面试</p></div><div className="flex items-center gap-3"><div className="rounded-2xl bg-muted px-4 py-2 text-right"><p className="text-xs text-muted-foreground">{finished ? '面试已结束' : '剩余时间'}</p><p className="font-mono text-xl font-bold">{finished ? '--:--' : remainingText(seconds)}</p></div>{!finished && <Button variant="danger" disabled={thinking} onClick={() => void finish()}><Square className="h-4 w-4" />结束面试</Button>}</div></header>{error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_310px]"><Card className="h-fit p-3"><div className="flex justify-between px-2 py-2"><strong>面试题目</strong><span className="text-sm text-muted-foreground">{active + 1}/{questions.length}</span></div><div className="mx-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500" style={{ width: `${Math.round(((active + 1) / questions.length) * 100)}%` }} /></div><div className="mt-3 space-y-1">{questions.map((item, itemIndex) => <button key={item.interviewQuestionId} onClick={() => setActive(itemIndex)} className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm ${itemIndex === active ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-muted'}`}><b className="text-xs">{String(itemIndex + 1).padStart(2, '0')}</b><span className="line-clamp-2">{item.content}</span></button>)}</div></Card><Card className="flex min-h-[620px] flex-col"><div className="flex items-center justify-between border-b border-border pb-4"><Badge tone="info">{question.questionType.replace('_', ' ')}</Badge><span className="text-sm text-muted-foreground">{choiceQuestion ? `${question.maxScore} 分` : `AI 追问 ${Math.min(followUps, limit)}/${limit}`}</span></div><div className="mt-5 rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">AI 面试官 · 当前问题</p><p className="mt-2 leading-7">{question.content}</p></div><div className="my-5 flex flex-1 flex-col gap-3 overflow-y-auto"><AnimatePresence initial={false}>{messages.map((message, messageIndex) => <motion.article key={`${message.role}-${messageIndex}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'candidate' ? 'ml-auto bg-emerald-600 text-white' : 'bg-muted'}`}><p className="mb-1 text-xs font-bold">{message.role === 'candidate' ? '我' : 'AI 面试官'}</p>{message.content}</motion.article>)}</AnimatePresence>{thinking && <p className="w-fit rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">AI 面试官正在思考…</p>}</div>{choiceQuestion ? <div className="space-y-2">{options.map(option => <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"><input type={question.questionType === 'multiple_choice' ? 'checkbox' : 'radio'} name="answer" checked={selected.includes(option.key)} onChange={() => setSelected(previous => question.questionType === 'multiple_choice' ? previous.includes(option.key) ? previous.filter(value => value !== option.key) : [...previous, option.key] : [option.key])} />{option.key}. {option.text}</label>)}</div> : <textarea value={draft} disabled={finished} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void send() }} className="min-h-32 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-emerald-400" placeholder="输入回答，Ctrl / ⌘ + Enter 发送。" />}<div className="mt-4 flex justify-between gap-2"><Button variant="secondary" disabled={active === 0} onClick={() => setActive(value => value - 1)}><ChevronLeft className="h-4 w-4" />上一题</Button><Button disabled={thinking || finished} onClick={() => void send()}>{followUps >= limit && !choiceQuestion && active < questions.length - 1 ? '完成本题并进入下一题' : '发送回答'}<Send className="h-4 w-4" /></Button><Button variant="secondary" disabled={active === questions.length - 1} onClick={() => setActive(value => value + 1)}>下一题<ChevronRight className="h-4 w-4" /></Button></div></Card><div className="space-y-5"><Card className="overflow-hidden p-0"><div className="relative grid aspect-video place-items-center bg-[radial-gradient(circle_at_50%_35%,#1c6c61,#09251f_72%)] text-white"><div className="absolute h-40 w-40 rounded-full border border-emerald-200/50 animate-[spin_8s_linear_infinite]" /><span className="z-10 grid h-20 w-20 place-items-center rounded-[28px] bg-emerald-300/15 shadow-[0_0_45px_rgba(52,211,153,.5)]"><Sparkles className="h-9 w-9 text-emerald-100" /></span><div className="absolute bottom-4 text-center"><p className="font-bold">AI 面试官</p><p className="mt-1 text-xs text-emerald-100">DeepSeek 驱动 · 在线</p></div></div><div className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">语音朗读</p><p className="mt-1 text-xs text-muted-foreground">AI 问题将自动朗读</p></div><button className="rounded-xl p-2 hover:bg-muted" onClick={() => { setTts(value => !value); window.speechSynthesis?.cancel() }}>{tts ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4" />}</button></div></Card><Card><div className="flex items-center justify-between"><div><p className="font-semibold">我的画面</p><p className="mt-1 text-xs text-muted-foreground">仅本地预览</p></div><Button variant="secondary" className="h-9 px-3" onClick={() => void camera()}><Camera className="h-4 w-4" />{cameraOn ? '关闭' : '开启'}</Button></div><div className="relative mt-4 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-muted"><video ref={video} autoPlay muted playsInline className={`h-full w-full object-cover ${cameraOn ? 'block -scale-x-100' : 'hidden'}`} />{!cameraOn && <div className="text-center text-muted-foreground"><Camera className="mx-auto h-6 w-6" /><p className="mt-2 text-xs">尚未开启摄像头</p></div>}</div>{!window.isSecureContext && <p className="mt-3 text-xs leading-5 text-amber-700">当前 HTTP 连接不允许浏览器调用摄像头；生产环境请配置 HTTPS。</p>}</Card></div></div></div>
}
