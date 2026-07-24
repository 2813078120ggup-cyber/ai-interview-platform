<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api, statusLabel, type Interview } from '@/api'

type Candidate = { id: string; username: string; realName: string }
type Question = { id: string; content: string; questionType: string; difficulty: number; score: number }
type QuestionBank = { id: string; name: string; bankCode: string; description?: string; status: number }
type PageResult<T> = { records: T[]; total: number; pageNo: number; pageSize: number }

const router = useRouter()
const interviews = ref<Interview[]>([])
const candidates = ref<Candidate[]>([])
const questions = ref<Question[]>([])
const banks = ref<QuestionBank[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const bankDialogVisible = ref(false)
const submitting = ref(false)
const bankSubmitting = ref(false)
const query = ref('')
const status = ref<number | ''>('')
const candidateFilter = ref('')
const timeFilter = ref<'all' | 'today' | 'tomorrow' | 'next7days' | 'thisMonth' | 'past'>('all')
const form = reactive({
  title: '', candidateId: undefined as string | undefined, scheduledAt: '', duration: 60, type: 'tech', meetingUrl: '',
  sourceType: 'question' as 'question' | 'bank', questionIds: [] as string[], questionBankId: undefined as string | undefined, questionCount: 5
})
const newBank = reactive({ bankCode: '', name: '', description: '', visibility: 0, status: 1 })
const typeLabel: Record<string, string> = { tech: '技术面试', hr: '沟通面试', comprehensive: '综合面试', ai: 'AI 面试' }
const candidateMap = computed(() => new Map(candidates.value.map(item => [String(item.id), item])))
const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return interviews.value.filter(item => {
    if (status.value !== '' && item.status !== status.value) return false
    if (candidateFilter.value && String(item.candidateId) !== candidateFilter.value) return false
    if (!matchesTimeFilter(item.scheduledAt)) return false
    if (!keyword) return true
    const candidate = candidateMap.value.get(String(item.candidateId))
    return [item.title, candidate?.realName, candidate?.username].some(value => value?.toLowerCase().includes(keyword))
  })
})

function matchesTimeFilter(scheduledAt: string) {
  if (timeFilter.value === 'all') return true
  const target = new Date(scheduledAt)
  if (Number.isNaN(target.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const afterTomorrow = new Date(tomorrow)
  afterTomorrow.setDate(afterTomorrow.getDate() + 1)
  const nextSevenDays = new Date(today)
  nextSevenDays.setDate(nextSevenDays.getDate() + 7)
  if (timeFilter.value === 'today') return target >= today && target < tomorrow
  if (timeFilter.value === 'tomorrow') return target >= tomorrow && target < afterTomorrow
  if (timeFilter.value === 'next7days') return target >= today && target < nextSevenDays
  if (timeFilter.value === 'thisMonth') return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth()
  return target < today
}

async function load() {
  loading.value = true
  try {
    const [items, candidateOptions, questionOptions, bankPage] = await Promise.all([
      api.get<Interview[]>('/v1/interviews'),
      api.get<Candidate[]>('/v1/users/candidates'),
      api.get<Question[]>('/v1/question-banks/options'),
      api.get<PageResult<QuestionBank>>('/v1/question-banks?pageNo=1&pageSize=100&status=1')
    ])
    interviews.value = items
    candidates.value = candidateOptions
    questions.value = questionOptions
    banks.value = bankPage.records
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

function changeSource(source: 'question' | 'bank') {
  form.sourceType = source
  if (source === 'question') form.questionBankId = undefined
  else form.questionIds = []
}

function resetForm() {
  Object.assign(form, {
    title: '', candidateId: undefined, scheduledAt: '', duration: 60, type: 'tech', meetingUrl: '',
    sourceType: 'question', questionIds: [], questionBankId: undefined, questionCount: 5
  })
}

function resetBankForm() { Object.assign(newBank, { bankCode: '', name: '', description: '', visibility: 0, status: 1 }) }

async function createBank() {
  if (!newBank.bankCode.trim() || !newBank.name.trim()) return ElMessage.warning('请填写题库编码和题库名称')
  bankSubmitting.value = true
  try {
    const created = await api.post<QuestionBank>('/v1/question-banks', newBank)
    banks.value = [created, ...banks.value]
    form.sourceType = 'bank'
    form.questionIds = []
    form.questionBankId = created.id
    bankDialogVisible.value = false
    resetBankForm()
    ElMessage.success('题库已创建，请继续添加题目或选择其他已有题库')
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    bankSubmitting.value = false
  }
}

async function create() {
  if (!form.candidateId || !form.scheduledAt) return ElMessage.warning('请选择候选人和预约时间')
  if (form.sourceType === 'question' && !form.questionIds.length) return ElMessage.warning('请至少选择一道题目')
  if (form.sourceType === 'bank' && !form.questionBankId) return ElMessage.warning('请选择题库')
  submitting.value = true
  try {
    await api.post('/v1/interviews', {
      title: form.title,
      candidateId: form.candidateId,
      scheduledAt: form.scheduledAt,
      duration: form.duration,
      type: form.type,
      meetingUrl: form.meetingUrl,
      questionIds: form.sourceType === 'question' ? form.questionIds : [],
      questionBankId: form.sourceType === 'bank' ? form.questionBankId : undefined,
      questionCount: form.sourceType === 'bank' ? form.questionCount : undefined
    })
    ElMessage.success('AI 面试已创建')
    dialogVisible.value = false
    resetForm()
    await load()
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    submitting.value = false
  }
}

function candidateName(row: Interview) {
  const candidate = candidateMap.value.get(String(row.candidateId))
  return candidate ? `${candidate.realName}（${candidate.username}）` : `候选人 #${row.candidateId}`
}
function open(row: Interview) { router.push(`/admin/interviews/${row.id}/room`) }
function format(value: string) { return value?.replace('T', ' ').slice(0, 16) }
onMounted(load)
</script>

<template>
  <section class="page-header"><div><p class="eyebrow">AI INTERVIEW ADMIN</p><h1>AI 面试管理</h1><p>创建、检索和查看 AI 面试安排。</p></div><el-button type="primary" @click="dialogVisible = true">创建 AI 面试</el-button></section>
  <section class="lobby-panel" v-loading="loading">
    <div class="lobby-toolbar"><el-input v-model="query" clearable placeholder="搜索面试主题"/><el-select v-model="candidateFilter" clearable filterable placeholder="选择候选人"><el-option v-for="item in candidates" :key="item.id" :value="item.id" :label="`${item.realName}（${item.username}）`"/></el-select><el-select v-model="timeFilter" placeholder="选择预约时间"><el-option value="all" label="全部时间"/><el-option value="today" label="今天"/><el-option value="tomorrow" label="明天"/><el-option value="next7days" label="未来 7 天"/><el-option value="thisMonth" label="本月"/><el-option value="past" label="已过期"/></el-select><el-select v-model="status" clearable placeholder="全部状态"><el-option label="待开始" :value="0"/><el-option label="进行中" :value="1"/><el-option label="已结束" :value="2"/><el-option label="已取消" :value="3"/></el-select></div>
    <el-table :data="filtered" empty-text="暂无面试" :default-sort="{ prop: 'scheduledAt', order: 'descending' }"><el-table-column prop="title" label="面试主题" min-width="220"/><el-table-column label="候选人" min-width="170"><template #default="{ row }">{{ candidateName(row) }}</template></el-table-column><el-table-column prop="scheduledAt" sortable label="预约时间" min-width="180"><template #default="{ row }">{{ format(row.scheduledAt) }}</template></el-table-column><el-table-column label="状态" width="110"><template #default="{ row }"><el-tag>{{ statusLabel[row.status] }}</el-tag></template></el-table-column><el-table-column label="操作" width="110"><template #default="{ row }"><el-button link type="primary" @click="open(row)">查看</el-button></template></el-table-column></el-table>
  </section>
  <el-dialog v-model="dialogVisible" title="创建 AI 面试" width="620px">
    <el-form label-position="top"><el-form-item label="面试主题"><el-input v-model="form.title"/></el-form-item><el-form-item label="候选人"><el-select v-model="form.candidateId" filterable class="wide-control" placeholder="输入姓名或账号搜索"><el-option v-for="item in candidates" :key="item.id" :value="item.id" :label="`${item.realName}（${item.username}）`"/></el-select></el-form-item><el-form-item label="题目来源"><el-radio-group :model-value="form.sourceType" @change="changeSource"><el-radio-button value="question">自定义选择题目</el-radio-button><el-radio-button value="bank">选择题库抽题</el-radio-button></el-radio-group></el-form-item><el-form-item v-if="form.sourceType === 'question'" label="面试题目（可多选）"><el-select v-model="form.questionIds" multiple filterable collapse-tags class="wide-control" placeholder="选择一道或多道已发布题目"><el-option v-for="item in questions" :key="item.id" :value="item.id" :label="`#${item.id} · ${item.content}`"/></el-select></el-form-item><template v-else><el-form-item><template #label><span>面试题库</span><el-button link type="primary" @click="bankDialogVisible = true">新建题库</el-button></template><el-select v-model="form.questionBankId" filterable class="wide-control" placeholder="选择题库"><el-option v-for="item in banks" :key="item.id" :value="item.id" :label="`${item.name}（${item.bankCode}）`"><span>{{ item.name }}</span><small> {{ item.description }}</small></el-option></el-select></el-form-item><el-form-item label="随机抽题数量"><el-select v-model="form.questionCount"><el-option :value="3" label="3 题"/><el-option :value="5" label="5 题"/><el-option :value="10" label="10 题"/><el-option :value="15" label="15 题"/><el-option :value="20" label="20 题"/></el-select></el-form-item></template><div class="form-grid"><el-form-item label="预约时间"><el-date-picker v-model="form.scheduledAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss"/></el-form-item><el-form-item label="时长（分钟）"><el-input-number v-model="form.duration" :min="1" :max="480"/></el-form-item></div><div class="form-grid"><el-form-item label="面试类型"><el-select v-model="form.type"><el-option v-for="(label,key) in typeLabel" :key="key" :label="label" :value="key"/></el-select></el-form-item><el-form-item label="会议地址（可选）"><el-input v-model="form.meetingUrl"/></el-form-item></div></el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="create">创建</el-button></template>
  </el-dialog>
  <el-dialog v-model="bankDialogVisible" title="新建题库" width="460px" append-to-body><el-form label-position="top"><el-form-item label="题库编码"><el-input v-model="newBank.bankCode" maxlength="64" placeholder="例如 JAVA_ADVANCED_2026"/></el-form-item><el-form-item label="题库名称"><el-input v-model="newBank.name" maxlength="128" placeholder="例如 Java 高级工程师题库"/></el-form-item><el-form-item label="题库说明"><el-input v-model="newBank.description" type="textarea" :rows="3" maxlength="500" show-word-limit/></el-form-item><el-form-item label="可见范围"><el-select v-model="newBank.visibility"><el-option :value="0" label="仅管理端"/><el-option :value="2" label="候选人练习可见"/></el-select></el-form-item></el-form><template #footer><el-button @click="bankDialogVisible = false">取消</el-button><el-button type="primary" :loading="bankSubmitting" @click="createBank">创建题库</el-button></template></el-dialog>
</template>

<style scoped>
.wide-control { width: 100%; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.el-select small { margin-left: 8px; color: #9aa2ad; }
</style>
