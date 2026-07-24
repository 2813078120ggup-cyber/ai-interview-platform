<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const generating = ref(false)
let retryTimer: number | undefined

function scheduleRetry() {
  if (retryTimer || report.value) return
  retryTimer = window.setTimeout(() => {
    retryTimer = undefined
    load(true)
  }, 5000)
}

async function load(silent = false) {
  loading.value = !silent
  try {
    report.value = await api.get<Report>(`/v1/interviews/${interviewId.value}/report`)
    generating.value = false
  } catch (error: any) {
    generating.value = true
    if (!silent) ElMessage.info('AI 正在评分并生成报告，完成后会自动展示。')
    scheduleRetry()
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { if (retryTimer) window.clearTimeout(retryTimer) })
</script>

<template>
  <section class="page-header">
    <div><p class="eyebrow">MY INTERVIEW REPORT</p><h1>面试评测报告</h1><p>本报告由 DeepSeek 基于本次作答自动评分生成。</p></div>
    <div class="report-actions"><el-button @click="router.push('/candidate/reports')">能力仪表盘</el-button><el-button @click="router.push('/candidate/interviews')">返回面试大厅</el-button></div>
  </section>

  <section v-if="generating && !report" class="content-section report-pending" v-loading="loading">
    <el-icon class="is-loading"><Loading /></el-icon>
    <h2>正在生成你的评测报告</h2>
    <p>AI 正在逐题评估回答并汇总建议，页面会自动刷新。</p>
    <el-button type="primary" plain @click="load()">立即刷新</el-button>
  </section>

  <section v-else-if="report" class="report-layout">
    <div class="report-summary"><div><p class="eyebrow">INTERVIEW REPORT</p><h2>综合评测</h2><p>{{ report.summary }}</p></div><div class="score-ring"><strong>{{ report.totalScore }}</strong><span>综合得分</span></div><el-tag type="success">已生成</el-tag></div>
    <div class="dimension-grid"><article><span>专业能力</span><strong>{{ report.professionalScore }}</strong></article><article><span>表达能力</span><strong>{{ report.expressionScore }}</strong></article><article><span>逻辑思维</span><strong>{{ report.logicScore }}</strong></article><article><span>应变能力</span><strong>{{ report.adaptabilityScore }}</strong></article></div>
    <ReportVisuals :report="report"/><div class="report-notes"><article><h3>优势分析</h3><p>{{ report.strengths }}</p></article><article><h3>待提升项</h3><p>{{ report.weaknesses }}</p></article><article><h3>改进建议</h3><p>{{ report.improvementSuggestions }}</p></article></div>
  </section>
</template>

<style scoped>
.report-pending { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }.report-pending .el-icon { margin-bottom: 13px; color: #d98656; font-size: 30px; }.report-pending h2 { margin: 0; font-size: 19px; }.report-pending p { margin: 9px 0 20px; color: #737d89; }
</style>
