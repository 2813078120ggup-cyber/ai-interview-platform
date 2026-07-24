<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  Calendar,
  Collection,
  DataAnalysis,
  Document,
  EditPen,
  MagicStick,
  Plus,
  VideoPlay
} from '@element-plus/icons-vue'

type InterviewStatus = 0 | 1 | 2 | 3
type InterviewType = 'tech' | 'hr' | 'comprehensive'
type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'coding'

type Interview = {
  id: number
  title: string
  candidateName: string
  interviewerName: string
  scheduledAt: string
  duration: number
  status: InterviewStatus
  type: InterviewType
  meetingUrl: string
  remark: string
}

type QuestionBank = {
  id: number
  bankCode: string
  name: string
  description: string
  visibility: 0 | 1 | 2
  status: 0 | 1
  questionCount: number
}

type Question = {
  id: number
  bankId: number
  questionType: QuestionType
  difficulty: 1 | 2 | 3
  content: string
  tags: string[]
  score: number
  status: 0 | 1 | 2
}

type InterviewRecord = {
  id: number
  interviewTitle: string
  question: string
  answerContent: string
  durationSeconds: number
  answeredAt: string
  aiScore: number
}

const activeModule = ref('flow')
const interviewStatusFilter = ref<'all' | InterviewStatus>('all')
const questionKeyword = ref('')

const interviewForm = reactive({
  title: '',
  candidateName: '',
  interviewerName: '',
  scheduledAt: '',
  duration: 60,
  type: 'tech' as InterviewType,
  bankId: 1
})

const generatorForm = reactive({
  bankId: 1,
  role: 'Java 后端工程师',
  difficulty: 2,
  count: 5,
  focus: 'Spring Boot、数据库事务、接口设计'
})

const interviews = ref<Interview[]>([
  {
    id: 1001,
    title: 'Java 后端一面',
    candidateName: '李明',
    interviewerName: '张岚',
    scheduledAt: '2026-07-25 10:00',
    duration: 60,
    status: 0,
    type: 'tech',
    meetingUrl: 'https://meet.example.com/iv-1001',
    remark: '重点关注项目经历和数据库设计'
  },
  {
    id: 1002,
    title: '产品运营 HR 面',
    candidateName: '王悦',
    interviewerName: '陈妍',
    scheduledAt: '2026-07-24 15:30',
    duration: 45,
    status: 1,
    type: 'hr',
    meetingUrl: 'https://meet.example.com/iv-1002',
    remark: '候选人已进入面试间'
  },
  {
    id: 1003,
    title: '全栈综合复试',
    candidateName: '赵航',
    interviewerName: '刘川',
    scheduledAt: '2026-07-23 16:00',
    duration: 75,
    status: 2,
    type: 'comprehensive',
    meetingUrl: 'https://meet.example.com/iv-1003',
    remark: '报告待 HR 发布'
  }
])

const banks = ref<QuestionBank[]>([
  { id: 1, bankCode: 'JAVA-BE-001', name: 'Java 后端题库', description: '覆盖集合、并发、Spring、数据库与系统设计', visibility: 2, status: 1, questionCount: 128 },
  { id: 2, bankCode: 'HR-COM-001', name: 'HR 通用题库', description: '动机、沟通、稳定性与团队协作问题', visibility: 1, status: 1, questionCount: 52 },
  { id: 3, bankCode: 'FE-VUE-001', name: 'Vue 前端题库', description: 'Vue、TypeScript、工程化与浏览器基础', visibility: 0, status: 1, questionCount: 96 }
])

const questions = ref<Question[]>([
  { id: 501, bankId: 1, questionType: 'short_answer', difficulty: 2, content: '说明 Spring 事务失效的常见场景，并给出规避方案。', tags: ['Spring', '事务'], score: 10, status: 1 },
  { id: 502, bankId: 1, questionType: 'coding', difficulty: 3, content: '实现一个支持过期时间的本地缓存，并说明并发控制策略。', tags: ['并发', '缓存'], score: 20, status: 1 },
  { id: 503, bankId: 2, questionType: 'short_answer', difficulty: 1, content: '请描述一次你主动推动协作改进的经历。', tags: ['沟通', '协作'], score: 10, status: 1 },
  { id: 504, bankId: 3, questionType: 'single_choice', difficulty: 2, content: 'Vue 组合式 API 中用于创建响应式对象的函数是？', tags: ['Vue'], score: 5, status: 0 }
])

const records = ref<InterviewRecord[]>([
  { id: 9001, interviewTitle: '全栈综合复试', question: '如何设计一个可扩展的题库检索能力？', answerContent: '从标签、难度、题型、权限范围和排序策略建立查询模型...', durationSeconds: 326, answeredAt: '2026-07-23 16:32', aiScore: 86 },
  { id: 9002, interviewTitle: '产品运营 HR 面', question: '你如何处理多方目标不一致？', answerContent: '先澄清共同指标，再拆解各方约束和可交换条件...', durationSeconds: 214, answeredAt: '2026-07-24 15:47', aiScore: 78 }
])

const modules = [
  { key: 'flow', label: '面试流程', icon: VideoPlay },
  { key: 'sessions', label: '场次管理', icon: Calendar },
  { key: 'banks', label: '题库管理', icon: Collection },
  { key: 'generator', label: '问题生成', icon: MagicStick },
  { key: 'records', label: '面试记录', icon: Document }
]

const statusText: Record<InterviewStatus, string> = {
  0: '待开始',
  1: '进行中',
  2: '已完成',
  3: '已取消'
}

const typeText: Record<InterviewType, string> = {
  tech: '技术面',
  hr: 'HR 面',
  comprehensive: '综合面'
}

const questionTypeText: Record<QuestionType, string> = {
  single_choice: '单选',
  multiple_choice: '多选',
  true_false: '判断',
  short_answer: '简答',
  coding: '编程'
}

const statusType: Record<InterviewStatus, 'info' | 'primary' | 'success' | 'warning'> = {
  0: 'info',
  1: 'primary',
  2: 'success',
  3: 'warning'
}

const visibleInterviews = computed(() => {
  if (interviewStatusFilter.value === 'all') return interviews.value
  return interviews.value.filter((interview) => interview.status === interviewStatusFilter.value)
})

const filteredQuestions = computed(() => {
  const keyword = questionKeyword.value.trim()
  if (!keyword) return questions.value
  return questions.value.filter((question) => {
    return question.content.includes(keyword) || question.tags.some((tag) => tag.includes(keyword))
  })
})

const dashboardStats = computed(() => [
  { label: '今日面试', value: interviews.value.filter((item) => item.scheduledAt.startsWith('2026-07-24')).length },
  { label: '进行中场次', value: interviews.value.filter((item) => item.status === 1).length },
  { label: '题库总量', value: banks.value.length },
  { label: '题目总数', value: questions.value.length }
])

function createInterview() {
  if (!interviewForm.title || !interviewForm.candidateName || !interviewForm.interviewerName || !interviewForm.scheduledAt) return
  interviews.value.unshift({
    id: Date.now(),
    title: interviewForm.title,
    candidateName: interviewForm.candidateName,
    interviewerName: interviewForm.interviewerName,
    scheduledAt: interviewForm.scheduledAt.replace('T', ' '),
    duration: interviewForm.duration,
    status: 0,
    type: interviewForm.type,
    meetingUrl: `https://meet.example.com/iv-${Date.now()}`,
    remark: `使用题库：${banks.value.find((bank) => bank.id === interviewForm.bankId)?.name ?? '未指定'}`
  })
  Object.assign(interviewForm, { title: '', candidateName: '', interviewerName: '', scheduledAt: '', duration: 60, type: 'tech', bankId: 1 })
}

function updateInterviewStatus(interview: Interview, status: InterviewStatus) {
  interview.status = status
}

function generateQuestions() {
  const bank = banks.value.find((item) => item.id === generatorForm.bankId)
  const nextId = Math.max(...questions.value.map((question) => question.id)) + 1
  const generated = Array.from({ length: generatorForm.count }, (_, index) => ({
    id: nextId + index,
    bankId: generatorForm.bankId,
    questionType: 'short_answer' as QuestionType,
    difficulty: generatorForm.difficulty as 1 | 2 | 3,
    content: `针对${generatorForm.role}生成问题 ${index + 1}：请结合${generatorForm.focus}说明你的实践经验。`,
    tags: [generatorForm.role, ...(bank ? [bank.name] : [])],
    score: 10,
    status: 0 as const
  }))
  questions.value.unshift(...generated)
  activeModule.value = 'banks'
}
</script>

<template>
  <el-container class="app-layout">
    <el-aside class="sidebar" width="232px">
      <div class="brand">
        <strong>AI 面试平台</strong>
        <span>面试业务与题库</span>
      </div>
      <el-menu :default-active="activeModule" class="module-menu" @select="(key: string) => (activeModule = key)">
        <el-menu-item v-for="item in modules" :key="item.key" :index="item.key">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="workspace">
      <header class="topbar">
        <div>
          <p class="eyebrow">INTERVIEW OPERATIONS</p>
          <h1>面试流程管理与题库工作台</h1>
        </div>
        <el-button type="primary" :icon="Plus" @click="activeModule = 'sessions'">新建面试</el-button>
      </header>

      <section class="stats-grid">
        <article v-for="stat in dashboardStats" :key="stat.label" class="stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </section>

      <section v-if="activeModule === 'flow'" class="panel">
        <div class="panel-title">
          <h2>面试流程管理</h2>
          <p>覆盖预约、抽题、开始、作答、结束、评估触发的主链路。</p>
        </div>
        <el-steps :active="2" finish-status="success" align-center>
          <el-step title="预约场次" description="写入 interview 待开始记录" />
          <el-step title="关联题目" description="生成 interview_question 快照" />
          <el-step title="进行面试" description="开始时间与状态流转" />
          <el-step title="提交作答" description="保存 interview_answer" />
          <el-step title="生成报告" description="评估完成后汇总 report" />
        </el-steps>
        <div class="flow-board">
          <article v-for="interview in interviews" :key="interview.id" class="flow-item">
            <div>
              <h3>{{ interview.title }}</h3>
              <p>{{ interview.candidateName }} · {{ interview.interviewerName }} · {{ interview.scheduledAt }}</p>
            </div>
            <el-tag :type="statusType[interview.status]">{{ statusText[interview.status] }}</el-tag>
          </article>
        </div>
      </section>

      <section v-if="activeModule === 'sessions'" class="split-layout">
        <div class="panel">
          <div class="panel-title">
            <h2>面试场次管理</h2>
            <p>字段对应 interview 表，支持创建、改期、取消和流程状态更新。</p>
          </div>
          <el-form label-position="top" :model="interviewForm" class="session-form">
            <el-form-item label="面试标题"><el-input v-model="interviewForm.title" placeholder="例如 Java 后端一面" /></el-form-item>
            <el-form-item label="候选人"><el-input v-model="interviewForm.candidateName" /></el-form-item>
            <el-form-item label="面试官"><el-input v-model="interviewForm.interviewerName" /></el-form-item>
            <el-form-item label="预约时间"><el-input v-model="interviewForm.scheduledAt" type="datetime-local" /></el-form-item>
            <el-form-item label="时长"><el-input-number v-model="interviewForm.duration" :min="15" :step="15" /></el-form-item>
            <el-form-item label="面试类型">
              <el-select v-model="interviewForm.type">
                <el-option label="技术面" value="tech" />
                <el-option label="HR 面" value="hr" />
                <el-option label="综合面" value="comprehensive" />
              </el-select>
            </el-form-item>
            <el-form-item label="抽题题库">
              <el-select v-model="interviewForm.bankId">
                <el-option v-for="bank in banks" :key="bank.id" :label="bank.name" :value="bank.id" />
              </el-select>
            </el-form-item>
            <el-button type="primary" :icon="Plus" @click="createInterview">创建场次</el-button>
          </el-form>
        </div>
        <div class="panel">
          <div class="table-toolbar">
            <h2>场次列表</h2>
            <el-segmented v-model="interviewStatusFilter" :options="[{ label: '全部', value: 'all' }, { label: '待开始', value: 0 }, { label: '进行中', value: 1 }, { label: '已完成', value: 2 }]" />
          </div>
          <el-table :data="visibleInterviews" height="520">
            <el-table-column prop="title" label="标题" min-width="150" />
            <el-table-column prop="candidateName" label="候选人" width="100" />
            <el-table-column prop="interviewerName" label="面试官" width="100" />
            <el-table-column prop="scheduledAt" label="预约时间" width="150" />
            <el-table-column label="类型" width="90"><template #default="{ row }">{{ typeText[row.type as InterviewType] }}</template></el-table-column>
            <el-table-column label="状态" width="96"><template #default="{ row }"><el-tag :type="statusType[row.status as InterviewStatus]">{{ statusText[row.status as InterviewStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="updateInterviewStatus(row, 1)">开始</el-button>
                <el-button size="small" @click="updateInterviewStatus(row, 2)">结束</el-button>
                <el-button size="small" type="warning" @click="updateInterviewStatus(row, 3)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section v-if="activeModule === 'banks'" class="panel">
        <div class="table-toolbar">
          <div>
            <h2>题库管理</h2>
            <p>按 question_bank 与 question 字段维护题库、题型、难度、标签和分值。</p>
          </div>
          <el-input v-model="questionKeyword" placeholder="搜索题干或标签" clearable class="search-input" />
        </div>
        <div class="bank-grid">
          <article v-for="bank in banks" :key="bank.id" class="bank-card">
            <div>
              <span>{{ bank.bankCode }}</span>
              <h3>{{ bank.name }}</h3>
              <p>{{ bank.description }}</p>
            </div>
            <strong>{{ bank.questionCount }}</strong>
          </article>
        </div>
        <el-table :data="filteredQuestions">
          <el-table-column prop="content" label="题干" min-width="320" />
          <el-table-column label="题型" width="90"><template #default="{ row }">{{ questionTypeText[row.questionType as QuestionType] }}</template></el-table-column>
          <el-table-column label="难度" width="90"><template #default="{ row }"><el-rate :model-value="row.difficulty" :max="3" disabled /></template></el-table-column>
          <el-table-column label="标签" min-width="180"><template #default="{ row }"><el-tag v-for="tag in row.tags" :key="tag" class="tag">{{ tag }}</el-tag></template></el-table-column>
          <el-table-column prop="score" label="分值" width="80" />
          <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已发布' : '草稿' }}</el-tag></template></el-table-column>
        </el-table>
      </section>

      <section v-if="activeModule === 'generator'" class="split-layout">
        <div class="panel">
          <div class="panel-title">
            <h2>问题生成</h2>
            <p>用于按岗位、难度、知识点生成草稿题目，再进入题库审核发布。</p>
          </div>
          <el-form label-position="top" :model="generatorForm">
            <el-form-item label="目标题库"><el-select v-model="generatorForm.bankId"><el-option v-for="bank in banks" :key="bank.id" :label="bank.name" :value="bank.id" /></el-select></el-form-item>
            <el-form-item label="岗位方向"><el-input v-model="generatorForm.role" /></el-form-item>
            <el-form-item label="难度"><el-rate v-model="generatorForm.difficulty" :max="3" /></el-form-item>
            <el-form-item label="生成数量"><el-input-number v-model="generatorForm.count" :min="1" :max="10" /></el-form-item>
            <el-form-item label="考察重点"><el-input v-model="generatorForm.focus" type="textarea" :rows="4" /></el-form-item>
            <el-button type="primary" :icon="MagicStick" @click="generateQuestions">生成草稿题</el-button>
          </el-form>
        </div>
        <div class="panel generator-preview">
          <el-icon><DataAnalysis /></el-icon>
          <h2>生成策略</h2>
          <p>生成结果写入 question 草稿态，保留题干、题型、难度、标签、分值和评分模板入口，发布前不进入候选人端抽题范围。</p>
        </div>
      </section>

      <section v-if="activeModule === 'records'" class="panel">
        <div class="panel-title">
          <h2>面试记录管理</h2>
          <p>聚合 interview_question、interview_answer 和 evaluation，便于回看作答与评分依据。</p>
        </div>
        <el-table :data="records">
          <el-table-column prop="interviewTitle" label="面试" width="160" />
          <el-table-column prop="question" label="题目" min-width="280" />
          <el-table-column prop="answerContent" label="作答摘要" min-width="260" />
          <el-table-column label="时长" width="100"><template #default="{ row }">{{ row.durationSeconds }} 秒</template></el-table-column>
          <el-table-column prop="answeredAt" label="提交时间" width="150" />
          <el-table-column label="AI 评分" width="100"><template #default="{ row }"><el-tag type="success">{{ row.aiScore }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="100"><el-button size="small" :icon="EditPen">复核</el-button></el-table-column>
        </el-table>
      </section>
    </el-main>
  </el-container>
</template>
