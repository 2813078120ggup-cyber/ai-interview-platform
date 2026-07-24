<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api, statusLabel, type Interview } from '@/api'

type PracticeBank = { id: string; name: string; description?: string; questionCount: string }
const router = useRouter()
const interviews = ref<Interview[]>([])
const banks = ref<PracticeBank[]>([])
const loading = ref(false)
const practiceVisible = ref(false)
const startingPractice = ref(false)
const query = ref('')
const status = ref<number | ''>('')
const practice = reactive({ questionBankId: undefined as string | undefined, questionCount: 5, duration: 30 })
const filtered = computed(() => interviews.value.filter(item => (status.value === '' || item.status === status.value) && item.title.toLowerCase().includes(query.value.toLowerCase())))
async function load() { loading.value = true; try { const [items, practiceBanks] = await Promise.all([api.get<Interview[]>('/v1/interviews'), api.get<PracticeBank[]>('/v1/interviews/practice/banks')]); interviews.value = items; banks.value = practiceBanks } catch (error: any) { ElMessage.error(error.message) } finally { loading.value = false } }
async function enter(item: Interview) { try { if (item.status === 0) await api.post(`/v1/interviews/${item.id}/start`); router.push(`/candidate/interviews/${item.id}/room`) } catch (error: any) { ElMessage.error(error.message) } }
async function startPractice() { if (!practice.questionBankId) return ElMessage.warning('请选择练习题库'); startingPractice.value = true; try { const interview = await api.post<Interview>('/v1/interviews/practice', practice); ElMessage.success('模拟练习已开始'); router.push(`/candidate/interviews/${interview.id}/room`) } catch (error: any) { ElMessage.error(error.message) } finally { startingPractice.value = false } }
function text(item: Interview) { return item.status === 0 ? '开始 AI 面试' : item.status === 1 ? '继续面试' : item.status === 2 ? '查看回顾' : '已取消' }
function format(value: string) { return value?.replace('T', ' ').slice(0, 16) }
onMounted(load)
</script>

<template>
  <section class="page-header"><div><p class="eyebrow">MY AI INTERVIEWS</p><h1>我的 AI 面试</h1><p>查看安排，或随时开始一场专属模拟练习。</p></div><div class="lobby-header-actions"><el-button @click="router.push('/candidate/reports')">能力仪表盘</el-button><el-button type="primary" @click="practiceVisible = true">开始模拟练习</el-button></div></section>
  <section class="lobby-panel" v-loading="loading"><div class="lobby-toolbar"><el-input v-model="query" clearable placeholder="搜索面试主题"/><el-select v-model="status" clearable placeholder="全部状态"><el-option label="待开始" :value="0"/><el-option label="进行中" :value="1"/><el-option label="已结束" :value="2"/></el-select></div><div class="interview-cards"><article v-for="item in filtered" :key="item.id" class="interview-card"><div class="card-top"><span>{{ item.remark === 'candidate-practice' ? '个人模拟练习' : 'AI 模拟面试' }}</span><el-tag>{{ statusLabel[item.status] }}</el-tag></div><h2>{{ item.title }}</h2><p>{{ format(item.scheduledAt) }} · {{ item.duration }} 分钟</p><div class="card-actions"><span>#{{ item.id }}</span><div><el-button v-if="item.status === 2" @click="router.push(`/candidate/interviews/${item.id}/report`)">查看报告</el-button><el-button type="primary" :disabled="item.status === 3" @click="enter(item)">{{ text(item) }}</el-button></div></div></article></div></section>
  <el-dialog v-model="practiceVisible" title="开始模拟练习" width="520px"><p class="practice-description">选择题库后系统将随机抽题，并立即进入 AI 面试官模拟面试。</p><el-form label-position="top"><el-form-item label="练习题库"><el-select v-model="practice.questionBankId" class="wide-control" filterable placeholder="请选择题库"><el-option v-for="bank in banks" :key="bank.id" :value="bank.id" :label="`${bank.name}（${bank.questionCount} 题）`"><span>{{ bank.name }}</span><small> {{ bank.description }}</small></el-option></el-select></el-form-item><div class="form-grid"><el-form-item label="抽题数量"><el-select v-model="practice.questionCount"><el-option :value="3" label="3 题 · 快速练习"/><el-option :value="5" label="5 题 · 标准练习"/><el-option :value="10" label="10 题 · 深度练习"/></el-select></el-form-item><el-form-item label="练习时长"><el-select v-model="practice.duration"><el-option :value="20" label="20 分钟"/><el-option :value="30" label="30 分钟"/><el-option :value="45" label="45 分钟"/><el-option :value="60" label="60 分钟"/></el-select></el-form-item></div></el-form><template #footer><el-button @click="practiceVisible = false">取消</el-button><el-button type="primary" :loading="startingPractice" @click="startPractice">立即开始</el-button></template></el-dialog>
</template>

<style scoped>
.practice-description { margin: -6px 0 20px; color: #64748b; }.wide-control { width: 100%; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.lobby-header-actions { display: flex; gap: 10px; }
</style>
