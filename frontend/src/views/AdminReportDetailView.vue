<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import ReportVisuals from '@/components/ReportVisuals.vue'

type Report = {
  totalScore: number
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
  summary: string
  strengths: string
  weaknesses: string
  improvementSuggestions: string
  status: number
}

const route = useRoute()
const router = useRouter()
const interviewId = computed(() => String(route.params.id))
const report = ref<Report>()
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    report.value = await api.get<Report>(`/v1/interviews/${interviewId.value}/report`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '报告加载失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="topbar">
    <div>
      <p class="eyebrow">REPORT DETAIL</p>
      <h1>候选人评测报告</h1>
    </div>
    <el-button @click="router.push('/admin/reports')">返回报告列表</el-button>
  </section>

  <section v-if="report" v-loading="loading" class="report-layout">
    <div class="report-summary">
      <div>
        <p class="eyebrow">INTERVIEW REPORT · #{{ interviewId }}</p>
        <h2>综合评测结论</h2>
        <p>{{ report.summary }}</p>
      </div>
      <div class="score-ring"><strong>{{ report.totalScore }}</strong><span>综合得分</span></div>
      <el-tag :type="report.status === 1 ? 'success' : 'warning'">{{ report.status === 1 ? '已发布' : '草稿' }}</el-tag>
    </div>
    <div class="dimension-grid">
      <article><span>专业能力</span><strong>{{ report.professionalScore }}</strong></article>
      <article><span>表达能力</span><strong>{{ report.expressionScore }}</strong></article>
      <article><span>逻辑思维</span><strong>{{ report.logicScore }}</strong></article>
      <article><span>应变能力</span><strong>{{ report.adaptabilityScore }}</strong></article>
    </div>
    <ReportVisuals :report="report" />
    <div class="report-notes">
      <article><h3>优势分析</h3><p>{{ report.strengths }}</p></article>
      <article><h3>待提升项</h3><p>{{ report.weaknesses }}</p></article>
      <article><h3>改进建议</h3><p>{{ report.improvementSuggestions }}</p></article>
    </div>
  </section>

  <section v-else v-loading="loading" class="panel report-empty">
    <el-empty description="未找到该面试报告">
      <el-button type="primary" @click="router.push('/admin/reports')">返回报告列表</el-button>
    </el-empty>
  </section>
</template>

<style scoped>
.report-empty {
  display: grid;
  min-height: 360px;
  place-items: center;
}
</style>
