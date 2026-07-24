<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import ReportVisuals from '@/components/ReportVisuals.vue'

type ReportListItem = { reportId: string; interviewId: string; interviewTitle: string; candidateName: string; candidateUsername: string; scheduledAt: string; totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number; status: number; publishedAt?: string }
type Report = { totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number; summary: string; strengths: string; weaknesses: string; improvementSuggestions: string; status: number }
type PageResult<T> = { records: T[]; total: number }

const reports = ref<ReportListItem[]>([])
const report = ref<Report>()
const selected = ref<ReportListItem>()
const keyword = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const page = await api.get<PageResult<ReportListItem>>(`/v1/reports/page?pageNo=1&pageSize=100&keyword=${encodeURIComponent(keyword.value)}`)
    reports.value = page.records
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
async function view(item: ReportListItem) {
  selected.value = item
  loading.value = true
  try { report.value = await api.get<Report>(`/v1/interviews/${item.interviewId}/report`) } catch (error: any) { ElMessage.error(error.message) } finally { loading.value = false }
}
function format(value?: string) { return value?.replace('T', ' ').slice(0, 16) ?? '-' }
onMounted(load)
</script>

<template>
  <section class="page-header"><div><p class="eyebrow">REPORT CENTER</p><h1>候选人评测报告</h1><p>查看候选人每次面试的评测结论与能力维度分布。</p></div></section>
  <section class="content-section report-toolbar"><el-input v-model="keyword" clearable placeholder="搜索候选人姓名、账号或面试主题" @keyup.enter="load"/><el-button type="primary" :loading="loading" @click="load">搜索报告</el-button></section>
  <section class="content-section report-table" v-loading="loading"><el-table :data="reports" empty-text="暂无已生成报告"><el-table-column prop="candidateName" label="候选人" min-width="130"><template #default="{ row }"><strong>{{ row.candidateName }}</strong><small class="table-sub">{{ row.candidateUsername }}</small></template></el-table-column><el-table-column prop="interviewTitle" label="面试主题" min-width="210"/><el-table-column label="面试时间" min-width="165"><template #default="{ row }">{{ format(row.scheduledAt) }}</template></el-table-column><el-table-column prop="totalScore" sortable label="综合得分" width="120"><template #default="{ row }"><b class="score-number">{{ row.totalScore }}</b></template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已发布' : '草稿' }}</el-tag></template></el-table-column><el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="primary" @click="view(row)">查看报告</el-button></template></el-table-column></el-table></section>
  <section v-if="report && selected" class="report-layout admin-report-detail"><div class="report-summary"><div><p class="eyebrow">{{ selected.candidateName }} · INTERVIEW REPORT</p><h2>{{ selected.interviewTitle }}</h2><p>{{ report.summary }}</p></div><div class="score-ring"><strong>{{ report.totalScore }}</strong><span>综合得分</span></div><el-tag :type="report.status === 1 ? 'success' : 'warning'">{{ report.status === 1 ? '已发布' : '草稿' }}</el-tag></div><div class="dimension-grid"><article><span>专业能力</span><strong>{{ report.professionalScore }}</strong></article><article><span>表达能力</span><strong>{{ report.expressionScore }}</strong></article><article><span>逻辑思维</span><strong>{{ report.logicScore }}</strong></article><article><span>应变能力</span><strong>{{ report.adaptabilityScore }}</strong></article></div><ReportVisuals :report="report"/><div class="report-notes"><article><h3>优势分析</h3><p>{{ report.strengths }}</p></article><article><h3>待提升项</h3><p>{{ report.weaknesses }}</p></article><article><h3>改进建议</h3><p>{{ report.improvementSuggestions }}</p></article></div></section>
  <el-empty v-else-if="reports.length" description="从上方列表选择一份报告查看数据图和评测详情" />
</template>

<style scoped>
.report-toolbar { display: flex; gap: 12px; align-items: center; }.report-toolbar .el-input { max-width: 420px; }.table-sub { display: block; margin-top: 3px; color: #8b929b; font-size: 11px; }.score-number { color: #b6533b; }.admin-report-detail { margin-top: 24px; }
</style>
