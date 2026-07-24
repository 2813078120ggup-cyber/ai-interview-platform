<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from 'lucide-vue-next'
import { questionApi } from '@/api'
import type { QuestionBank, QuestionVO } from '@/api'

const router = useRouter()

const banks = ref<QuestionBank[]>([])
const questions = ref<QuestionVO[]>([])
const loading = ref(true)

const bankForm = ref({ bankCode: '', name: '', description: '', visibility: 0 })
const showBankDialog = ref(false)

const questionForm = ref({
  bankId: null as number | null,
  questionType: 'short_answer',
  difficulty: 2,
  content: '',
  options: '',
  correctAnswer: '',
  answerTemplate: '',
  explanation: '',
  tags: '',
  score: 10,
  sortOrder: 0,
})
const showQuestionDialog = ref(false)
const currentBankId = ref<number | null>(null)

const questionTypes = [
  { label: '单选题', value: 'single_choice' },
  { label: '多选题', value: 'multiple_choice' },
  { label: '判断题', value: 'true_false' },
  { label: '简答题', value: 'short_answer' },
  { label: '编程题', value: 'coding' },
]

onMounted(async () => {
  await loadBanks()
})

async function loadBanks() {
  loading.value = true
  try {
    const res = await questionApi.listBanks()
    banks.value = res.data || []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function selectBank(bankId: number) {
  currentBankId.value = bankId
  try {
    const res = await questionApi.list({ bankId, page: 1, size: 100 })
    questions.value = res.data.records || []
  } catch {
    questions.value = []
  }
}

async function createBank() {
  if (!bankForm.value.bankCode || !bankForm.value.name) {
    ElMessage.warning('请填写题库编码和名称')
    return
  }
  try {
    await questionApi.createBank(bankForm.value)
    ElMessage.success('题库创建成功')
    showBankDialog.value = false
    bankForm.value = { bankCode: '', name: '', description: '', visibility: 0 }
    await loadBanks()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '创建失败')
  }
}

async function deleteBank(bankId: number) {
  try { await ElMessageBox.confirm('确认删除该题库？', '删除确认', { type: 'warning' }) } catch { return }
  try {
    await questionApi.deleteBank(bankId)
    ElMessage.success('题库已删除')
    await loadBanks()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

async function createQuestion() {
  if (!currentBankId.value || !questionForm.value.content) {
    ElMessage.warning('请选择题库并填写题目内容')
    return
  }
  try {
    await questionApi.create({
      ...questionForm.value,
      bankId: currentBankId.value,
    })
    ElMessage.success('题目创建成功')
    showQuestionDialog.value = false
    questionForm.value = { bankId: null, questionType: 'short_answer', difficulty: 2, content: '', options: '', correctAnswer: '', answerTemplate: '', explanation: '', tags: '', score: 10, sortOrder: 0 }
    await selectBank(currentBankId.value)
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '创建失败')
  }
}

async function deleteQuestion(qId: number) {
  try { await ElMessageBox.confirm('确认删除该题目？', '删除确认', { type: 'warning' }) } catch { return }
  try {
    await questionApi.delete(qId)
    ElMessage.success('题目已删除')
    if (currentBankId.value) await selectBank(currentBankId.value)
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

function typeLabel(t: string) {
  const found = questionTypes.find(qt => qt.value === t)
  return found?.label || t
}

function diffLabel(d: number) {
  return ['', '简单', '中等', '困难'][d] || ''
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <button class="nav__back" @click="router.push('/dashboard')">
        <ArrowLeft :size="18" /> 返回
      </button>
      <span class="nav__title">题库管理</span>
      <el-button size="small" type="primary" @click="showBankDialog = true">
        <Plus :size="14" /> 创建题库
      </el-button>
    </nav>

    <main class="content" v-loading="loading">
      <!-- Bank List -->
      <div class="bank-grid">
        <div
          v-for="bank in banks"
          :key="bank.id"
          :class="['bank-card', { 'bank-card--active': currentBankId === bank.id }]"
          @click="selectBank(bank.id)"
        >
          <div class="bank-card__header">
            <span class="bank-code">{{ bank.bankCode }}</span>
            <el-button size="small" type="danger" text @click.stop="deleteBank(bank.id)">删除</el-button>
          </div>
          <h3>{{ bank.name }}</h3>
          <p v-if="bank.description">{{ bank.description }}</p>
        </div>
      </div>

      <!-- Questions -->
      <div v-if="currentBankId" style="margin-top:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h2 style="font-size:1rem;font-weight:600">题目列表</h2>
          <el-button size="small" type="primary" @click="showQuestionDialog = true">
            <Plus :size="14" /> 添加题目
          </el-button>
        </div>

        <div v-if="questions.length === 0" class="empty">暂无题目</div>
        <div class="q-list" v-else>
          <div v-for="q in questions" :key="q.id" class="q-card">
            <div class="q-card__meta">
              <span class="q-tag">{{ typeLabel(q.questionType) }}</span>
              <span class="q-diff">{{ diffLabel(q.difficulty) }}</span>
              <span class="q-score">{{ q.score }}分</span>
            </div>
            <p class="q-content">{{ q.content?.substring(0, 120) }}{{ q.content?.length > 120 ? '...' : '' }}</p>
            <el-button size="small" type="danger" text @click="deleteQuestion(q.id)">删除</el-button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Bank Dialog -->
    <el-dialog v-model="showBankDialog" title="创建题库" width="400px">
      <el-form label-position="top">
        <el-form-item label="题库编码" required>
          <el-input v-model="bankForm.bankCode" placeholder="例：frontend_basic" />
        </el-form-item>
        <el-form-item label="题库名称" required>
          <el-input v-model="bankForm.name" placeholder="例：前端基础题库" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="bankForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBankDialog = false">取消</el-button>
        <el-button type="primary" @click="createBank">创建</el-button>
      </template>
    </el-dialog>

    <!-- Create Question Dialog -->
    <el-dialog v-model="showQuestionDialog" title="添加题目" width="560px">
      <el-form label-position="top">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="题型">
              <el-select v-model="questionForm.questionType">
                <el-option v-for="qt in questionTypes" :key="qt.value" :label="qt.label" :value="qt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-select v-model="questionForm.difficulty">
                <el-option label="简单" :value="1" />
                <el-option label="中等" :value="2" />
                <el-option label="困难" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分数">
              <el-input-number v-model="questionForm.score" :min="1" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="题目内容" required>
          <el-input v-model="questionForm.content" type="textarea" :rows="3" placeholder="输入题目内容" />
        </el-form-item>
        <el-form-item label="标准答案">
          <el-input v-model="questionForm.correctAnswer" type="textarea" :rows="2" placeholder="标准答案（候选人不可见）" />
        </el-form-item>
        <el-form-item label="评分模板">
          <el-input v-model="questionForm.answerTemplate" type="textarea" :rows="2" placeholder="评分要点" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="questionForm.tags" placeholder="JSON数组，如 [&quot;前端&quot;,&quot;React&quot;]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="createQuestion">创建</el-button>
      </template>
    </el-dialog>
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
.content { max-width: 960px; margin: 0 auto; padding: 1.5rem; }

.bank-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
.bank-card {
  padding: 1rem 1.25rem; background: #fff; border: 1px solid #ede9f6;
  border-radius: 12px; cursor: pointer; transition: all 0.15s;
}
.bank-card:hover { border-color: #7c3aed; }
.bank-card--active { border-color: #7c3aed; box-shadow: 0 2px 8px rgba(124,58,237,0.1); }
.bank-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
.bank-code { font-size: 0.75rem; color: #7c3aed; font-weight: 600; }
.bank-card h3 { font-size: 0.9375rem; font-weight: 600; color: #1e1b4b; }
.bank-card p { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }

.q-list { display: flex; flex-direction: column; gap: 0.5rem; }
.q-card {
  padding: 0.75rem 1rem; background: #fff; border: 1px solid #ede9f6;
  border-radius: 8px; display: flex; align-items: center; gap: 1rem;
}
.q-card__meta { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; min-width: 140px; }
.q-tag { font-size: 0.6875rem; background: #ede9fe; color: #7c3aed; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600; }
.q-diff { font-size: 0.6875rem; color: #6b7280; }
.q-score { font-size: 0.6875rem; color: #7c3aed; }
.q-content { flex: 1; font-size: 0.8125rem; color: #374151; line-height: 1.4; }

.empty { padding: 3rem; text-align: center; color: #9ca3af; }
</style>
