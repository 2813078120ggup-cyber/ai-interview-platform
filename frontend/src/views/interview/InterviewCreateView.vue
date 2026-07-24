<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft } from 'lucide-vue-next'
import { interviewApi, userApi, questionApi } from '@/api'
import type { InterviewVO, UserVO, QuestionVO } from '@/api'

const router = useRouter()
const loading = ref(false)
const interviews = ref<InterviewVO[]>([])
const users = ref<UserVO[]>([])
const questions = ref<QuestionVO[]>([])

const form = ref({
  title: '',
  candidateId: null as number | null,
  interviewerId: null as number | null,
  scheduledAt: '',
  duration: 60,
  type: 'tech' as string,
  meetingUrl: '',
  remark: '',
  questionIds: [] as number[],
})

onMounted(async () => {
  try {
    const [ivRes, userRes, qRes] = await Promise.all([
      interviewApi.list({ page: 1, size: 100 }),
      userApi.list({ page: 1, size: 200, status: 1 }),
      questionApi.list({ status: 1, page: 1, size: 200 }),
    ])
    interviews.value = ivRes.data.records || []
    users.value = userRes.data.records || []
    questions.value = qRes.data.records || []
  } catch (e) {
    ElMessage.warning('加载数据失败')
  }
})

const candidateUsers = ref<UserVO[]>([])
const interviewerUsers = ref<UserVO[]>([])

onMounted(() => {
  // This is populated by the user list - filter by roles is done server side
  // For now, show all users
})

async function handleSubmit() {
  if (!form.value.title || !form.value.candidateId || !form.value.interviewerId
      || !form.value.scheduledAt || form.value.questionIds.length === 0) {
    ElMessage.warning('请填写所有必填项并选择题目')
    return
  }

  loading.value = true
  try {
    await interviewApi.create({
      ...form.value,
      candidateId: form.value.candidateId!,
      interviewerId: form.value.interviewerId!,
      scheduledAt: form.value.scheduledAt.replace('T', ' ') + ':00',
    })
    ElMessage.success('面试创建成功')
    router.push('/dashboard')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '创建失败')
  } finally {
    loading.value = false
  }
}

function toggleQuestion(qId: number) {
  const idx = form.value.questionIds.indexOf(qId)
  if (idx >= 0) {
    form.value.questionIds.splice(idx, 1)
  } else {
    form.value.questionIds.push(qId)
  }
}

function typeLabel(t: string) {
  const map: Record<string, string> = { tech: '技术面试', hr: 'HR面试', comprehensive: '综合面试' }
  return map[t] || t
}

function difficultyLabel(d: number) {
  const map: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' }
  return map[d] || '未知'
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <button class="nav__back" @click="router.push('/dashboard')">
        <ArrowLeft :size="18" /> 返回
      </button>
      <span class="nav__title">创建面试</span>
      <div class="nav__spacer" />
    </nav>

    <main class="content">
      <el-form label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="面试标题" required>
          <el-input v-model="form.title" placeholder="例：高级前端工程师技术面试" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="候选人" required>
              <el-select v-model="form.candidateId" placeholder="选择候选人" filterable>
                <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试官" required>
              <el-select v-model="form.interviewerId" placeholder="选择面试官" filterable>
                <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="预约时间" required>
              <el-date-picker
                v-model="form.scheduledAt"
                type="datetime"
                placeholder="选择时间"
                style="width:100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="时长(分)" required>
              <el-input-number v-model="form.duration" :min="15" :max="240" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试类型" required>
              <el-select v-model="form.type">
                <el-option label="技术面试" value="tech" />
                <el-option label="HR面试" value="hr" />
                <el-option label="综合面试" value="comprehensive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="会议链接">
          <el-input v-model="form.meetingUrl" placeholder="可选，在线会议地址" />
        </el-form-item>

        <el-form-item label="内部备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>

        <!-- Question Selection -->
        <el-form-item label="选择题目" required>
          <div class="question-pick">
            <div
              v-for="q in questions"
              :key="q.id"
              :class="['q-item', { 'q-item--selected': form.questionIds.includes(q.id) }]"
              @click="toggleQuestion(q.id)"
            >
              <div class="q-item__header">
                <span class="q-item__type">{{ q.questionType }}</span>
                <span class="q-item__diff">{{ difficultyLabel(q.difficulty) }}</span>
                <span class="q-item__score">{{ q.score }}分</span>
              </div>
              <p class="q-item__content">{{ q.content?.substring(0, 80) }}{{ q.content?.length > 80 ? '...' : '' }}</p>
            </div>
          </div>
          <div class="selected-count" v-if="form.questionIds.length > 0">
            已选 {{ form.questionIds.length }} 道题目
          </div>
        </el-form-item>

        <el-button type="primary" :loading="loading" @click="handleSubmit" size="large">
          <Plus :size="16" /> 创建面试
        </el-button>
      </el-form>
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f5f3ff; }
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
.nav__spacer { width: 64px; }
.content { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

.question-pick {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
  max-height: 400px; overflow-y: auto; padding: 0.5rem;
  border: 1px solid #e5e7eb; border-radius: 8px;
}
.q-item {
  padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.q-item:hover { border-color: #7c3aed; }
.q-item--selected { border-color: #7c3aed; background: #f5f3ff; }
.q-item__header { display: flex; gap: 0.5rem; margin-bottom: 0.25rem; }
.q-item__type {
  font-size: 0.6875rem; font-weight: 600; color: #7c3aed;
  background: #ede9fe; padding: 0.1rem 0.4rem; border-radius: 4px;
}
.q-item__diff { font-size: 0.6875rem; color: #6b7280; }
.q-item__score { font-size: 0.6875rem; color: #7c3aed; margin-left: auto; }
.q-item__content { font-size: 0.8125rem; color: #374151; line-height: 1.4; }
.selected-count { margin-top: 0.5rem; font-size: 0.875rem; color: #7c3aed; font-weight: 500; }
</style>
