<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Play, Square, Send, Clock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { interviewApi, interviewRoomApi, evaluationApi } from '@/api'
import type { InterviewVO, InterviewQuestion, InterviewAnswer, EvaluationVO } from '@/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const interview = ref<InterviewVO | null>(null)
const questions = ref<InterviewQuestion[]>([])
const answers = ref<InterviewAnswer[]>([])
const evaluations = ref<EvaluationVO[]>([])
const loading = ref(true)

const interviewId = computed(() => Number(route.params.id))
const userRoles = computed(() => auth.user?.roles || [])
const isInterviewer = computed(() => userRoles.value.includes('INTERVIEWER') || userRoles.value.includes('HR') || userRoles.value.includes('ADMIN'))
const isCandidate = computed(() => userRoles.value.includes('CANDIDATE'))
const isInProgress = computed(() => interview.value?.status === 1)
const isPending = computed(() => interview.value?.status === 0)
const isCompleted = computed(() => interview.value?.status === 2)

// Answer being composed
const currentAnswer = ref<Record<number, string>>({})
const submitting = ref<Record<number, boolean>>({})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [ivRes, qRes, aRes, eRes] = await Promise.all([
      interviewApi.getDetail(interviewId.value),
      interviewRoomApi.getQuestions(interviewId.value).catch(() => ({ data: [] })),
      interviewRoomApi.getAnswers(interviewId.value).catch(() => ({ data: [] })),
      evaluationApi.listByInterview(interviewId.value).catch(() => ({ data: [] })),
    ])
    interview.value = ivRes.data
    questions.value = qRes.data || []
    answers.value = aRes.data || []
    evaluations.value = eRes.data || []
  } catch (e) {
    ElMessage.error('加载面试数据失败')
  } finally {
    loading.value = false
  }
}

async function handleStart() {
  try {
    await ElMessageBox.confirm('确认开始面试？', '开始面试', { type: 'info' })
  } catch { return }

  try {
    const res = await interviewRoomApi.start(interviewId.value)
    questions.value = res.data || []
    interview.value!.status = 1
    ElMessage.success('面试已开始')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '操作失败')
  }
}

async function handleEnd() {
  try {
    await ElMessageBox.confirm('确认结束面试？结束后将触发AI评测。', '结束面试', { type: 'warning' })
  } catch { return }

  try {
    await interviewRoomApi.end(interviewId.value)
    interview.value!.status = 2
    interview.value!.endedAt = new Date().toISOString()
    ElMessage.success('面试已结束')
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '操作失败')
  }
}

async function handleSubmitAnswer(iqId: number) {
  if (!currentAnswer.value[iqId]?.trim()) {
    ElMessage.warning('请输入作答内容')
    return
  }
  submitting.value[iqId] = true
  try {
    await interviewRoomApi.submitAnswer(iqId, {
      answerContent: currentAnswer.value[iqId],
      durationSeconds: 0,
    })
    ElMessage.success('作答提交成功')
    currentAnswer.value[iqId] = ''
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '提交失败')
  } finally {
    submitting.value[iqId] = false
  }
}

function getAnswerFor(iqId: number): InterviewAnswer | undefined {
  return answers.value.find(a => a.interviewQuestionId === iqId)
}

function parseSnapshot(snapshot: string): any {
  try { return JSON.parse(snapshot) } catch { return {} }
}

async function handleCancel() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消面试', {
      inputPlaceholder: '取消原因',
    })
    if (!reason) return
    await interviewApi.cancel(interviewId.value, reason)
    interview.value!.status = 3
    ElMessage.success('面试已取消')
  } catch { /* cancelled */ }
}

async function handleMarkAbsent() {
  try {
    await ElMessageBox.confirm('确认标记候选人缺席？', '标记缺席', { type: 'warning' })
  } catch { return }
  try {
    await interviewApi.markAbsent(interviewId.value)
    interview.value!.status = 3
    ElMessage.success('已标记缺席')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '操作失败')
  }
}

async function handleGenerateReport() {
  try {
    const res = await import('@/api').then(m => m.reportApi.generate(interviewId.value))
    ElMessage.success('报告生成成功')
    router.push(`/report/interview/${interviewId.value}`)
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '生成失败')
  }
}
</script>

<template>
  <div class="room" v-loading="loading">
    <!-- Nav -->
    <nav class="nav">
      <button class="nav__back" @click="router.push('/dashboard')">
        <ArrowLeft :size="18" /> 返回
      </button>
      <span class="nav__title">{{ interview?.title || '面试房间' }}</span>
      <div class="nav__actions">
        <el-button v-if="isPending && isInterviewer" type="primary" size="small" @click="handleStart">
          <Play :size="14" /> 开始面试
        </el-button>
        <el-button v-if="isInProgress && isInterviewer" type="danger" size="small" @click="handleEnd">
          <Square :size="14" /> 结束面试
        </el-button>
        <el-button v-if="isPending && isInterviewer" size="small" @click="handleCancel">取消面试</el-button>
        <el-button v-if="(isPending || isInProgress) && isInterviewer" size="small" type="warning" @click="handleMarkAbsent">标记缺席</el-button>
        <el-button v-if="isCompleted && isInterviewer" size="small" type="success" @click="handleGenerateReport">生成报告</el-button>
      </div>
    </nav>

    <!-- Info Bar -->
    <div class="info-bar" v-if="interview">
      <span>候选人：{{ interview.candidateName }}</span>
      <span>面试官：{{ interview.interviewerName }}</span>
      <span>预约：{{ interview.scheduledAt?.replace('T', ' ') }}</span>
      <span>状态：<strong>{{ interview.statusText }}</strong></span>
    </div>

    <!-- Questions & Answers -->
    <main class="content">
      <div class="q-list" v-if="questions.length > 0">
        <div v-for="(iq, idx) in questions" :key="iq.id" class="q-card">
          <div class="q-card__header">
            <span class="q-num">第 {{ iq.sequenceNo }} 题</span>
            <span class="q-score">满分 {{ iq.maxScore }} 分</span>
          </div>
          <p class="q-content">{{ parseSnapshot(iq.questionSnapshot).content || '题目内容' }}</p>

          <!-- Candidate answer area -->
          <div v-if="isInProgress && isCandidate" class="answer-box">
            <el-input
              v-model="currentAnswer[iq.id]"
              type="textarea"
              :rows="3"
              placeholder="请输入你的作答..."
              :disabled="!!getAnswerFor(iq.id)"
            />
            <el-button
              v-if="!getAnswerFor(iq.id)"
              type="primary"
              size="small"
              :loading="submitting[iq.id]"
              @click="handleSubmitAnswer(iq.id)"
              style="margin-top:0.5rem"
            >
              <Send :size="14" /> 提交作答
            </el-button>
          </div>

          <!-- Answer display (for interviewer or completed) -->
          <div v-if="getAnswerFor(iq.id)" class="submitted-answer">
            <div class="answer-label">候选人作答：</div>
            <p>{{ getAnswerFor(iq.id)?.answerContent }}</p>
            <span class="answer-time">
              <Clock :size="12" />
              {{ getAnswerFor(iq.id)?.answeredAt?.replace('T', ' ') }}
            </span>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty">暂无题目</div>
    </main>
  </div>
</template>

<style scoped>
.room { min-height: 100vh; background: #f5f3ff; }
.nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.5rem; background: #fff; border-bottom: 1px solid #ede9f6;
  position: sticky; top: 0; z-index: 10;
}
.nav__back {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.375rem 0.75rem; border: none; border-radius: 8px;
  background: transparent; color: #6b7280; cursor: pointer;
  font-size: 0.875rem; font-family: inherit;
}
.nav__back:hover { color: #1e1b4b; background: #f5f3ff; }
.nav__title { font-size: 0.9375rem; font-weight: 600; color: #1e1b4b; }
.nav__actions { display: flex; gap: 0.5rem; }

.info-bar {
  display: flex; gap: 2rem; padding: 0.75rem 1.5rem;
  background: #fff; border-bottom: 1px solid #ede9f6;
  font-size: 0.8125rem; color: #6b7280;
}

.content { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

.q-list { display: flex; flex-direction: column; gap: 1rem; }
.q-card {
  padding: 1.25rem 1.5rem; background: #fff; border-radius: 12px;
  border: 1px solid #ede9f6;
}
.q-card__header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.q-num { font-size: 0.75rem; font-weight: 600; color: #7c3aed; }
.q-score { font-size: 0.75rem; color: #6b7280; }
.q-content { font-size: 0.9375rem; color: #1e1b4b; line-height: 1.6; margin-bottom: 1rem; }

.answer-box { margin-top: 0.75rem; }
.submitted-answer {
  margin-top: 0.75rem; padding: 0.75rem; background: #f9fafb;
  border-radius: 8px; border: 1px solid #e5e7eb;
}
.answer-label { font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; }
.submitted-answer p { font-size: 0.875rem; color: #1e1b4b; line-height: 1.5; }
.answer-time { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem; }

.empty { padding: 3rem; text-align: center; color: #9ca3af; }
</style>
