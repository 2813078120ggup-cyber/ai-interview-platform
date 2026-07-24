<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Plus, Calendar, FileText, BookOpen, Users, Play, CheckCircle, XCircle, Clock } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { interviewApi, reportApi } from '@/api'
import type { InterviewVO, ReportVO } from '@/api'

const router = useRouter()
const auth = useAuthStore()

const interviews = ref<InterviewVO[]>([])
const reports = ref<ReportVO[]>([])
const loading = ref(true)

const userRoles = computed(() => auth.user?.roles || [])
const isHR = computed(() => userRoles.value.includes('HR') || userRoles.value.includes('ADMIN'))
const isInterviewer = computed(() => userRoles.value.includes('INTERVIEWER'))
const isCandidate = computed(() => userRoles.value.includes('CANDIDATE'))

const roleLabel = computed(() => {
  if (isHR.value) return 'HR'
  if (isInterviewer.value) return '面试官'
  return '候选人'
})

onMounted(async () => {
  try {
    const [interviewRes, reportRes] = await Promise.all([
      interviewApi.list({ page: 1, size: 20 }),
      reportApi.list().catch(() => ({ data: [] })),
    ])
    interviews.value = interviewRes.data.records || []
    reports.value = Array.isArray(reportRes.data) ? reportRes.data : []
  } catch (e) {
    ElMessage.warning('数据加载失败')
  } finally {
    loading.value = false
  }
})

function statusTag(status: number): { text: string; class: string } {
  switch (status) {
    case 0: return { text: '待开始', class: 'tag--pending' }
    case 1: return { text: '进行中', class: 'tag--progress' }
    case 2: return { text: '已结束', class: 'tag--done' }
    case 3: return { text: '已取消', class: 'tag--cancel' }
    default: return { text: '未知', class: '' }
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div class="header__left">
        <span class="logo">AI 面试平台</span>
        <span class="role-badge">{{ roleLabel }}</span>
      </div>
      <div class="header__right">
        <span class="header__user">{{ auth.user?.realName }}</span>
        <button class="btn-logout" @click="logout">
          <LogOut :size="16" />
          退出
        </button>
      </div>
    </header>

    <main class="main" v-loading="loading">
      <h1 class="greeting">欢迎回来，{{ auth.user?.realName }} 👋</h1>

      <!-- Quick Actions -->
      <section class="actions" v-if="isHR">
        <el-button type="primary" @click="router.push('/interview/create')">
          <Plus :size="16" /> 创建面试
        </el-button>
        <el-button @click="router.push('/questions')">
          <BookOpen :size="16" /> 题库管理
        </el-button>
      </section>

      <!-- Interview List -->
      <section class="section">
        <h2 class="section__title">
          <Calendar :size="20" />
          面试日程
        </h2>
        <div v-if="interviews.length === 0 && !loading" class="empty">暂无面试安排</div>
        <div class="card-list" v-else>
          <div
            v-for="iv in interviews"
            :key="iv.id"
            class="card"
            @click="router.push(`/interview/${iv.id}`)"
          >
            <div class="card__header">
              <span class="card__title">{{ iv.title }}</span>
              <span :class="`tag ${statusTag(iv.status).class}`">
                {{ statusTag(iv.status).text }}
              </span>
            </div>
            <div class="card__body">
              <span>候选人：{{ iv.candidateName }}</span>
              <span>面试官：{{ iv.interviewerName }}</span>
              <span>{{ iv.scheduledAt?.replace('T', ' ') }} · {{ iv.duration }}分钟</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Reports -->
      <section class="section" v-if="reports.length > 0">
        <h2 class="section__title">
          <FileText :size="20" />
          面试报告
        </h2>
        <div class="card-list">
          <div
            v-for="r in reports"
            :key="r.id"
            class="card"
            @click="router.push(`/report/${r.id}`)"
          >
            <div class="card__header">
              <span class="card__title">{{ r.candidateName }} · {{ r.interviewTitle }}</span>
              <span class="card__score">{{ r.totalScore }} 分</span>
            </div>
            <div class="card__body">
              <span>{{ r.generatedAt?.replace('T', ' ') }}</span>
              <span v-if="r.published === 0" style="color:#f59e0b">未发布</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f3ff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #ede9f6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  font-weight: 700;
  font-size: 1rem;
  color: #7c3aed;
}

.role-badge {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #ede9fe;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 500;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header__user {
  font-size: 0.875rem;
  color: #374151;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.8125rem;
  font-family: inherit;
}

.btn-logout:hover { color: #1e1b4b; border-color: #7c3aed; }

.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.greeting {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1e1b4b;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2rem;
}

.section__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1e1b4b;
  margin-bottom: 1rem;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  background: #fff;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card {
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #ede9f6;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: #7c3aed;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.08);
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e1b4b;
}

.card__score {
  font-size: 1.125rem;
  font-weight: 700;
  color: #7c3aed;
}

.card__body {
  display: flex;
  gap: 1.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.tag {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag--pending { background: #fef3c7; color: #92400e; }
.tag--progress { background: #dbeafe; color: #1e40af; }
.tag--done { background: #d1fae5; color: #065f46; }
.tag--cancel { background: #fee2e2; color: #991b1b; }
</style>
