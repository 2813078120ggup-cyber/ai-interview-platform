<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, ChatDotRound, Clock, Microphone, Monitor, Timer, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, type Interview } from '@/api'
import { profile } from '@/auth-session'

interface RoomQuestion { interviewQuestionId: string; questionId: string; sequenceNo: number; maxScore: number; content: string; options?: string; questionType: string }
interface ChatMessage { role: 'assistant' | 'candidate'; content: string }
interface SpeechAlternative { transcript: string }
interface SpeechResult { isFinal: boolean; [index: number]: SpeechAlternative }
interface SpeechEvent { resultIndex: number; results: ArrayLike<SpeechResult> }
interface BrowserSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type SpeechConstructor = new () => BrowserSpeechRecognition
type SpeechWindow = Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor }

const route = useRoute()
const router = useRouter()
const interviewId = String(route.params.id)
const interview = ref<Interview>()
const questions = ref<RoomQuestion[]>([])
const index = ref(0)
const loading = ref(true)
const saving = ref(false)
const aiLoading = ref(false)
const cameraBusy = ref(false)
const cameraOn = ref(false)
const localVideo = ref<HTMLVideoElement>()
const followUp = ref('')
const conversation = ref<ChatMessage[]>([])
const answer = ref('')
const choice = ref<string | string[]>('')
const seconds = ref(0)
const speechActive = ref(false)
const speechPreview = ref('')
const speechSupported = Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition)
const ttsSupported = 'speechSynthesis' in window
const ttsEnabled = ref(true)
const MIN_FOLLOW_UPS_PER_QUESTION = 2
const MAX_FOLLOW_UPS_PER_QUESTION = 5
const savedAnswers = ref<Record<string, { answerContent?: string; answerData?: string }>>({})
const followUpTargets = ref<Record<string, number>>({})
const isCandidate = computed(() => String(interview.value?.candidateId) === String(profile.value.id))
const canAnswer = computed(() => isCandidate.value && interview.value?.status === 1)
const isFinished = computed(() => interview.value?.status === 2)
const lobbyPath = computed(() => (profile.value.roles ?? []).includes('ADMIN') ? '/admin/interviews' : '/candidate/interviews')
const current = computed(() => questions.value[index.value])
const options = computed(() => { try { return current.value?.options ? JSON.parse(current.value.options) : [] } catch { return [] } })
const remaining = computed(() => interview.value?.status === 1 ? `${String(Math.floor(seconds.value / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}` : '--:--')
const isChoice = computed(() => ['single_choice', 'multiple_choice', 'true_false'].includes(current.value?.questionType ?? ''))
const progress = computed(() => questions.value.length ? Math.round(((index.value + 1) / questions.value.length) * 100) : 0)
const currentFollowUpTarget = computed(() => current.value ? followUpTargets.value[current.value.interviewQuestionId] ?? MAX_FOLLOW_UPS_PER_QUESTION : MAX_FOLLOW_UPS_PER_QUESTION)
const followUpCount = computed(() => {
  let candidateAnswered = false
  let count = 0
  for (const message of conversation.value) {
    if (message.role === 'candidate') candidateAnswered = true
    else if (candidateAnswered) count++
  }
  return count
})
const followUpLimitReached = computed(() => !isChoice.value && followUpCount.value >= currentFollowUpTarget.value)

let timer: number | undefined
let mediaStream: MediaStream | undefined
let speechRecognition: BrowserSpeechRecognition | undefined
let speechBaseText = ''
let speechFinalText = ''

function hydrateAnswer() {
  stopSpeechRecognition()
  ensureFollowUpTarget(current.value?.interviewQuestionId)
  const saved = current.value && savedAnswers.value[current.value.interviewQuestionId]
  answer.value = ''
  followUp.value = ''
  conversation.value = []
  choice.value = ''
  if (!saved) return
  if (isChoice.value && saved.answerData) {
    try { choice.value = JSON.parse(saved.answerData) } catch { choice.value = '' }
    return
  }
  try {
    const parsed = JSON.parse(saved.answerData ?? '[]')
    if (Array.isArray(parsed) && parsed.every(item => item && ['assistant', 'candidate'].includes(item.role) && typeof item.content === 'string')) {
      conversation.value = parsed
      return
    }
  } catch { /* compatibility with historical answers */ }
  if (saved.answerContent) conversation.value = [{ role: 'candidate', content: saved.answerContent }]
}

function followUpStorageKey() { return `ai-interview:follow-up-targets:${interviewId}` }

function ensureFollowUpTarget(interviewQuestionId?: string) {
  if (!interviewQuestionId || followUpTargets.value[interviewQuestionId]) return
  try {
    const stored = JSON.parse(sessionStorage.getItem(followUpStorageKey()) ?? '{}') as Record<string, number>
    const existing = stored[interviewQuestionId]
    const target = Number.isInteger(existing) && existing >= MIN_FOLLOW_UPS_PER_QUESTION && existing <= MAX_FOLLOW_UPS_PER_QUESTION
      ? existing : Math.floor(Math.random() * (MAX_FOLLOW_UPS_PER_QUESTION - MIN_FOLLOW_UPS_PER_QUESTION + 1)) + MIN_FOLLOW_UPS_PER_QUESTION
    followUpTargets.value = { ...followUpTargets.value, [interviewQuestionId]: target }
    sessionStorage.setItem(followUpStorageKey(), JSON.stringify({ ...stored, [interviewQuestionId]: target }))
  } catch {
    const target = Math.floor(Math.random() * (MAX_FOLLOW_UPS_PER_QUESTION - MIN_FOLLOW_UPS_PER_QUESTION + 1)) + MIN_FOLLOW_UPS_PER_QUESTION
    followUpTargets.value = { ...followUpTargets.value, [interviewQuestionId]: target }
  }
}

async function load() {
  loading.value = true
  try {
    interview.value = await api.get<Interview>(`/v1/interviews/${interviewId}`)
    questions.value = await api.get<RoomQuestion[]>(`/v1/interviews/${interviewId}/questions`)
    const answers = await api.get<Array<{ interviewQuestionId: string; answerContent?: string; answerData?: string }>>(`/v1/interviews/${interviewId}/answers`)
    savedAnswers.value = Object.fromEntries(answers.map(item => [item.interviewQuestionId, item]))
    hydrateAnswer()
    if (interview.value.status === 1) {
      seconds.value = (interview.value.duration ?? 60) * 60
      timer = window.setInterval(() => { if (seconds.value > 0) seconds.value-- }, 1000)
      if (isCandidate.value) await requestOpening()
    }
  } catch (error: any) {
    ElMessage.error(error.message)
    router.push(lobbyPath.value)
  } finally {
    loading.value = false
  }
}

function switchQuestion(next: number) {
  if (next < 0 || next >= questions.value.length) return
  index.value = next
  hydrateAnswer()
}

async function waitForAiTask(taskId: string, key: 'question' | 'followUp') {
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise(resolve => window.setTimeout(resolve, 1000))
    const result = await api.get<{ status: string; outputPayload?: string; errorMessage?: string }>(`/v1/ai-tasks/${taskId}`)
    if (result.status === 'SUCCESS') return JSON.parse(result.outputPayload ?? '{}')[key] as string
    if (result.status === 'FAILED') throw new Error(result.errorMessage ?? 'AI 面试官生成问题失败')
  }
  throw new Error('AI 面试官响应超时，请检查 DeepSeek 服务状态后重试')
}

async function requestOpening() {
  aiLoading.value = true
  try {
    const task = await api.post<{ id: string }>(`/v1/interviews/${interviewId}/ai-opening`)
    followUp.value = await waitForAiTask(task.id, 'question')
    if (!conversation.value.some(item => item.role === 'assistant')) conversation.value = [{ role: 'assistant', content: followUp.value }]
    speakAsInterviewer(followUp.value)
  } catch (error: any) {
    ElMessage.warning(error.message)
  } finally {
    aiLoading.value = false
  }
}

async function requestFollowUp(answerText: string) {
  if (!answerText.trim() || !current.value) return
  aiLoading.value = true
  try {
    const task = await api.post<{ id: string }>(`/v1/interviews/${interviewId}/follow-ups`, { answer: answerText, question: current.value.content })
    return await waitForAiTask(task.id, 'followUp')
  } catch (error: any) {
    ElMessage.warning(error.message)
    return undefined
  } finally {
    aiLoading.value = false
  }
}

async function persistConversation() {
  if (!current.value) return
  const answerContent = conversation.value.filter(item => item.role === 'candidate').map(item => item.content).join('\n')
  const answerData = JSON.stringify(conversation.value)
  await api.put(`/v1/interviews/${interviewId}/questions/${current.value.interviewQuestionId}/answer`, {
    answerContent,
    answerData,
    durationSeconds: Math.max(0, (interview.value?.duration ?? 60) * 60 - seconds.value)
  })
  savedAnswers.value[current.value.interviewQuestionId] = { answerContent, answerData }
}

async function saveAnswer(next = false) {
  if (!current.value || !canAnswer.value) return
  stopSpeechRecognition()
  const value = isChoice.value ? choice.value : answer.value.trim()
  if (!value || (Array.isArray(value) && !value.length)) {
    ElMessage.warning('请先完成本题作答')
    return
  }
  saving.value = true
  try {
    if (isChoice.value) {
      const answerContent = JSON.stringify(value)
      await api.put(`/v1/interviews/${interviewId}/questions/${current.value.interviewQuestionId}/answer`, {
        answerContent,
        answerData: JSON.stringify(value),
        durationSeconds: Math.max(0, (interview.value?.duration ?? 60) * 60 - seconds.value)
      })
      savedAnswers.value[current.value.interviewQuestionId] = { answerContent, answerData: JSON.stringify(value) }
      const follow = await requestFollowUp(answerContent)
      if (follow) {
        conversation.value.push({ role: 'assistant', content: follow })
        speakAsInterviewer(follow)
      }
    } else {
      const reply = String(value)
      conversation.value.push({ role: 'candidate', content: reply })
      answer.value = ''
      await persistConversation()
      if (followUpLimitReached.value) {
        if (index.value < questions.value.length - 1) {
          ElMessage.success(`本题已完成 ${currentFollowUpTarget.value} 次追问，正在进入下一题`)
          switchQuestion(index.value + 1)
        } else {
          ElMessage.success(`本题已完成 ${currentFollowUpTarget.value} 次追问，全部题目已完成，可结束面试`)
        }
        return
      }
      const follow = await requestFollowUp(reply)
      if (follow) {
        conversation.value.push({ role: 'assistant', content: follow })
        await persistConversation()
        speakAsInterviewer(follow)
      }
    }
    ElMessage.success('作答已保存')
    if (next) switchQuestion(index.value + 1)
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    saving.value = false
  }
}

async function finish() {
  try {
    await ElMessageBox.confirm('确认结束本次面试吗？结束后将无法继续作答。', '结束面试', { type: 'warning' })
    stopSpeechRecognition()
    await api.post(`/v1/interviews/${interviewId}/end`)
    ElMessage.success('面试已结束，正在生成 AI 评测报告')
    router.push(isCandidate.value ? `/candidate/interviews/${interviewId}/report` : lobbyPath.value)
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.message)
  }
}

function resolveSpeechConstructor(): SpeechConstructor | undefined {
  const browserWindow = window as SpeechWindow
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
}

function appendTranscript(base: string, transcript: string) {
  return [base.trim(), transcript.trim()].filter(Boolean).join(base.trim() ? ' ' : '')
}

function startSpeechRecognition() {
  if (!canAnswer.value || isChoice.value) return
  const SpeechRecognition = resolveSpeechConstructor()
  if (!SpeechRecognition) {
    ElMessage.warning('当前浏览器不支持实时语音识别，请使用最新版 Chrome 或 Edge。')
    return
  }
  speechBaseText = answer.value
  speechFinalText = ''
  speechPreview.value = ''
  const recognition = new SpeechRecognition()
  speechRecognition = recognition
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0]?.transcript ?? ''
      if (event.results[i].isFinal) speechFinalText += transcript
      else interim += transcript
    }
    answer.value = appendTranscript(speechBaseText, speechFinalText)
    speechPreview.value = interim
  }
  recognition.onerror = (event) => {
    speechActive.value = false
    speechPreview.value = ''
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') ElMessage.error('未获得麦克风或语音识别权限，请在浏览器中允许访问。')
    else if (event.error !== 'aborted' && event.error !== 'no-speech') ElMessage.warning(`语音识别已停止：${event.error}`)
  }
  recognition.onend = () => {
    speechActive.value = false
    speechPreview.value = ''
    speechRecognition = undefined
  }
  try {
    recognition.start()
    speechActive.value = true
  } catch {
    ElMessage.warning('语音识别暂时无法启动，请稍后重试。')
  }
}

function stopSpeechRecognition() {
  speechActive.value = false
  speechPreview.value = ''
  if (speechRecognition) {
    try { speechRecognition.stop() } catch { /* browser already stopped recognition */ }
  }
}

function toggleSpeechRecognition() {
  if (speechActive.value) stopSpeechRecognition()
  else startSpeechRecognition()
}

function speakAsInterviewer(text: string) {
  if (!ttsSupported || !ttsEnabled.value || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 1
  utterance.pitch = 1
  const chineseVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith('zh'))
  if (chineseVoice) utterance.voice = chineseVoice
  window.speechSynthesis.speak(utterance)
}

function toggleTts() {
  ttsEnabled.value = !ttsEnabled.value
  if (!ttsEnabled.value && ttsSupported) window.speechSynthesis.cancel()
  ElMessage.info(ttsEnabled.value ? '已开启 AI 面试官语音朗读' : '已关闭 AI 面试官语音朗读')
}

function closeCamera() {
  mediaStream?.getTracks().forEach(track => track.stop())
  mediaStream = undefined
  cameraOn.value = false
}

async function toggleCamera() {
  if (cameraOn.value) {
    closeCamera()
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    ElMessage.error('当前浏览器不支持摄像头访问')
    return
  }
  cameraBusy.value = true
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    if (localVideo.value) localVideo.value.srcObject = mediaStream
    cameraOn.value = true
  } catch {
    ElMessage.error('未获得摄像头权限，请在浏览器中允许访问摄像头')
  } finally {
    cameraBusy.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  stopSpeechRecognition()
  if (ttsSupported) window.speechSynthesis.cancel()
  closeCamera()
})
</script>

<template>
  <main class="room-page" v-loading="loading">
    <header class="room-header">
      <div>
        <el-button text class="back-button" @click="router.push(lobbyPath)"><el-icon><ArrowLeft /></el-icon>返回大厅</el-button>
        <h1>{{ interview?.title || '面试间' }}</h1>
        <span>面试编号 #{{ interviewId }} · {{ isFinished ? '已结束 · 面试回顾模式' : isCandidate ? 'AI 对话面试模式' : '管理端查看模式' }}</span>
      </div>
      <div class="room-timer" :class="{ finished: isFinished }"><el-icon><Timer /></el-icon><strong>{{ remaining }}</strong><small>{{ isFinished ? '面试已结束' : '剩余时间' }}</small></div>
      <el-button v-if="interview?.status === 1" type="danger" @click="finish">结束面试</el-button>
    </header>
    <section class="room-grid">
      <aside class="question-nav">
        <div class="nav-heading"><span>面试题目</span><small>{{ index + 1 }}/{{ questions.length }}</small></div>
        <el-progress :percentage="progress" :show-text="false" />
        <button v-for="(item, i) in questions" :key="item.interviewQuestionId" class="question-number" :class="{ active: i === index }" @click="switchQuestion(i)"><b>{{ String(i + 1).padStart(2, '0') }}</b><span>{{ item.content }}</span></button>
      </aside>
      <section class="question-stage">
        <div class="stage-meta"><el-tag effect="plain">{{ current?.questionType?.replace('_', ' ') }}</el-tag><span v-if="!isChoice">随机追问 {{ followUpCount }}/{{ currentFollowUpTarget }}</span><span>{{ current?.maxScore }} 分</span></div>
        <div class="conversation-panel">
          <div class="chat-message assistant"><strong>AI 面试官</strong><p>{{ current?.content }}</p></div>
          <div v-for="(message, messageIndex) in conversation" :key="messageIndex" class="chat-message" :class="message.role"><strong>{{ message.role === 'assistant' ? 'AI 面试官' : '我' }}</strong><p>{{ message.content }}</p></div>
          <div v-if="aiLoading" class="chat-message assistant"><strong>AI 面试官</strong><el-skeleton :rows="2" animated /></div>
        </div>
        <template v-if="isChoice">
          <el-radio-group v-if="current?.questionType !== 'multiple_choice'" v-model="choice" class="choice-list" :disabled="!canAnswer"><el-radio v-for="option in options" :key="option.key" :value="option.key">{{ option.key }}. {{ option.text }}</el-radio></el-radio-group>
          <el-checkbox-group v-else v-model="choice" class="choice-list" :disabled="!canAnswer"><el-checkbox v-for="option in options" :key="option.key" :value="option.key">{{ option.key }}. {{ option.text }}</el-checkbox></el-checkbox-group>
        </template>
        <template v-else>
          <el-input v-model="answer" type="textarea" :rows="5" maxlength="2000" show-word-limit placeholder="输入回答，或点击麦克风进行语音作答；发送后 AI 面试官会继续追问。" :disabled="!canAnswer" @keydown.ctrl.enter="saveAnswer(false)" />
          <p v-if="speechActive || speechPreview" class="speech-state"><span class="speech-dot"></span>{{ speechPreview || '正在聆听，请继续作答…' }}</p>
        </template>
        <div class="answer-actions">
          <el-button :disabled="index === 0" @click="switchQuestion(index - 1)">上一题</el-button>
          <div><el-tag v-if="isFinished" type="info">已结束，仅可查看对话记录</el-tag><el-button v-else-if="canAnswer" type="primary" :loading="saving || aiLoading" @click="saveAnswer(false)">{{ followUpLimitReached ? '完成本题并进入下一题' : '发送回答' }}</el-button><el-button v-if="index < questions.length - 1" :disabled="saving || aiLoading" @click="switchQuestion(index + 1)">下一题</el-button></div>
        </div>
      </section>
      <aside class="meeting-panel">
        <div class="video-area">
          <div v-if="isCandidate" class="digital-human"><div class="avatar-orbit"></div><div class="avatar-head"><span></span></div><div class="avatar-body"></div><strong>AI 面试官</strong><small>在线 · 正在进行 AI 面试</small></div>
          <div v-else class="video-placeholder"><el-icon><VideoCamera /></el-icon><strong>候选人作答过程</strong><span>管理端仅查看，不参与提问</span></div>
          <div class="self-video" :class="{ active: cameraOn }"><video v-show="cameraOn" ref="localVideo" autoplay muted playsinline></video><template v-if="!cameraOn"><el-icon><Camera /></el-icon><span>我的画面</span></template><small v-else>摄像头已开启</small></div>
        </div>
        <div v-if="isCandidate" class="ai-follow-up"><div class="interviewer-heading"><strong>AI 面试官</strong><el-button v-if="ttsSupported" text size="small" @click="toggleTts">{{ ttsEnabled ? '关闭朗读' : '开启朗读' }}</el-button></div><el-skeleton v-if="aiLoading" :rows="2" animated /><p v-else>{{ followUp || 'AI 面试官正在准备本场面试的开场问题。' }}</p></div>
        <div class="call-controls">
          <el-button circle :disabled="!canAnswer || isChoice || !speechSupported" :type="speechActive ? 'danger' : 'default'" :title="speechSupported ? (speechActive ? '停止语音识别' : '开始语音识别') : '请使用 Chrome 或 Edge 进行语音识别'" @click="toggleSpeechRecognition"><el-icon><Microphone /></el-icon></el-button>
          <el-button circle :loading="cameraBusy" :type="cameraOn ? 'danger' : 'default'" :title="cameraOn ? '关闭摄像头' : '开启摄像头'" @click="toggleCamera"><el-icon><VideoCamera /></el-icon></el-button>
          <el-button circle><el-icon><Monitor /></el-icon></el-button><el-button circle><el-icon><ChatDotRound /></el-icon></el-button>
        </div>
        <div class="meeting-tip"><el-icon><Clock /></el-icon>{{ speechSupported ? '点击麦克风即可语音转文字；停止后可检查并编辑识别结果。' : '当前浏览器不支持语音识别，请使用 Chrome 或 Edge。' }}</div>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.ai-follow-up { margin: 16px; padding: 14px; border-radius: 10px; background: #f0f7ff; border: 1px solid #cfe4ff; color: #24415f; }
.ai-follow-up strong { color: #2563eb; }.ai-follow-up p { margin: 8px 0 0; line-height: 1.65; }
.interviewer-heading { display: flex; align-items: center; justify-content: space-between; }.interviewer-heading .el-button { height: 24px; padding: 0; }
.conversation-panel { display: flex; flex-direction: column; gap: 12px; min-height: 220px; max-height: 420px; overflow-y: auto; margin: 18px 0; padding: 4px 8px; }
.chat-message { max-width: 84%; padding: 12px 14px; border-radius: 14px; line-height: 1.6; }.chat-message strong { display: block; margin-bottom: 4px; font-size: 12px; }.chat-message p { margin: 0; white-space: pre-wrap; }
.chat-message.assistant { align-self: flex-start; background: #f0f7ff; color: #24415f; border-top-left-radius: 4px; }.chat-message.assistant strong { color: #2563eb; }.chat-message.candidate { align-self: flex-end; background: #2563eb; color: #fff; border-top-right-radius: 4px; }.chat-message.candidate strong { color: #dbeafe; }
.speech-state { display: flex; align-items: center; gap: 8px; min-height: 26px; margin: 8px 0 0; color: #b6533b; font-size: 13px; }.speech-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 5px rgba(182, 83, 59, .14); animation: speech-pulse 1.25s infinite; }
.digital-human { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; color: #e8f4ff; background: radial-gradient(circle at 50% 36%, #1f5d9b, #0b1930 68%); }
.avatar-orbit { width: 180px; height: 180px; position: absolute; border: 1px solid rgba(129, 204, 255, .55); border-radius: 50%; animation: orbit 4s linear infinite; }
.avatar-head { z-index: 1; width: 74px; height: 88px; border-radius: 48% 48% 42% 42%; background: linear-gradient(145deg, #d7f3ff, #7bc4ed); box-shadow: 0 0 35px #58bdff; position: relative; }
.avatar-head span { position: absolute; left: 15px; right: 15px; top: 38px; height: 7px; border-radius: 50%; background: #13537e; }.avatar-body { z-index: 1; width: 126px; height: 78px; margin-top: -5px; border-radius: 48% 48% 8px 8px; background: linear-gradient(135deg, #2c94cb, #10436d); }
.digital-human strong { z-index: 1; margin-top: 16px; font-size: 16px; }.digital-human small { z-index: 1; margin-top: 6px; color: #a4d7f6; }
.self-video.active { overflow: hidden; background: #101827; }.self-video video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }.self-video small { position: absolute; left: 8px; bottom: 6px; color: #fff; font-size: 11px; text-shadow: 0 1px 2px #000; }
@keyframes orbit { to { transform: rotate(360deg) scale(1.06); } }
@keyframes speech-pulse { 50% { opacity: .45; transform: scale(.78); } }
</style>
