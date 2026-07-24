<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import ReportVisuals from '@/components/ReportVisuals.vue'

type TrendPoint = { interviewId: string; interviewTitle: string; scheduledAt: string; totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number }
type ScoreChange = { totalScore: number; professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number }
type Summary = { reportCount: number; latest?: TrendPoint; previous?: TrendPoint; changeFromPrevious: ScoreChange; trends: TrendPoint[] }

const router = useRouter()
const summary = ref<Summary>()
const loading = ref(false)
const latest = computed(() => summary.value?.latest)
const changes = computed(() => summary.value?.changeFromPrevious ?? { totalScore: 0, professionalScore: 0, expressionScore: 0, logicScore: 0, adaptabilityScore: 0 })
const changeCards = computed(() => [
  { name: '专业能力', value: changes.value.professionalScore }, { name: '表达能力', value: changes.value.expressionScore },
  { name: '逻辑思维', value: changes.value.logicScore }, { name: '应变能力', value: changes.value.adaptabilityScore }
])
async function load() { loading.value = true; try { summary.value = await api.get<Summary>('/v1/reports/my/summary') } catch (error: any) { ElMessage.error(error.message) } finally { loading.value = false } }
function format(value?: string) { return value?.replace('T', ' ').slice(0, 10) ?? '-' }
function trendHeight(value: number) { return `${Math.max(8, Math.min(100, Number(value ?? 0)))}%` }
function changeText(value: number) { const number = Number(value ?? 0); return `${number > 0 ? '+' : ''}${number.toFixed(1)}` }
onMounted(load)
</script>

<template>
  <section class="page-header"><div><p class="eyebrow">ABILITY DASHBOARD</p><h1>我的能力成长</h1><p>基于已发布的历史面试报告，查看能力值与最近变化。</p></div><el-button @click="router.push('/candidate/interviews')">返回面试大厅</el-button></section>
  <main v-loading="loading">
    <template v-if="latest && summary"><section class="ability-hero"><div><p>已完成 {{ summary.reportCount }} 场已评测面试</p><h2>{{ latest.totalScore }}<small>综合能力值</small></h2><span>最近一次：{{ latest.interviewTitle }} · {{ format(latest.scheduledAt) }}</span></div><div class="ability-change"><span>较上一次</span><strong :class="{ positive: changes.totalScore > 0, negative: changes.totalScore < 0 }">{{ changeText(changes.totalScore) }}</strong><small>综合得分变化</small></div></section><section class="ability-change-grid"><article v-for="item in changeCards" :key="item.name"><span>{{ item.name }}</span><strong :class="{ positive: item.value > 0, negative: item.value < 0 }">{{ changeText(item.value) }}</strong><small>相较上一份报告</small></article></section><ReportVisuals :report="latest"/><section class="history-card"><div class="visual-heading"><div><span>HISTORICAL TREND</span><h3>历史综合能力变化</h3></div><small>按面试时间排序</small></div><div class="history-bars"><article v-for="(item, index) in summary.trends" :key="item.interviewId"><div class="bar-area"><i :style="{ height: trendHeight(item.totalScore) }"><b>{{ item.totalScore }}</b></i></div><strong>第 {{ index + 1 }} 次</strong><small>{{ format(item.scheduledAt) }}</small></article></div></section></template>
    <el-empty v-else-if="!loading" description="暂无已发布的历史报告，完成并生成报告后即可查看能力变化。"><el-button type="primary" @click="router.push('/candidate/interviews')">去模拟面试</el-button></el-empty>
  </main>
</template>

<style scoped>
.ability-hero { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-bottom: 18px; padding: 30px 34px; border-radius: 14px; color: #fff; background: linear-gradient(120deg, #1b2e47, #31567a); }.ability-hero p { margin: 0; color: #cdd8e5; font-size: 13px; }.ability-hero h2 { margin: 8px 0; font-size: 48px; letter-spacing: -.06em; }.ability-hero h2 small { margin-left: 12px; color: #cdd8e5; font-size: 14px; font-weight: 500; letter-spacing: 0; }.ability-hero > div > span { color: #dce7f0; font-size: 13px; }.ability-change { min-width: 145px; padding: 18px 22px; border: 1px solid rgba(255,255,255,.18); border-radius: 12px; background: rgba(255,255,255,.08); text-align: center; }.ability-change span, .ability-change small { display: block; color: #d0dbe7; font-size: 12px; }.ability-change strong { display: block; margin: 7px 0; font-size: 29px; }.ability-change strong.positive { color: #8de0bb; }.ability-change strong.negative { color: #ffb4a0; }.ability-change-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 18px; }.ability-change-grid article { padding: 19px; border: 1px solid #e4e1dc; border-radius: 12px; background: #fffefb; }.ability-change-grid span, .ability-change-grid small { display: block; color: #7a838f; font-size: 12px; }.ability-change-grid strong { display: block; margin: 8px 0 4px; color: #536171; font-size: 24px; }.ability-change-grid strong.positive { color: #298668; }.ability-change-grid strong.negative { color: #c95f48; }.history-card { margin-top: 18px; padding: 23px; border: 1px solid #e4e1dc; border-radius: 12px; background: #fffefb; }.visual-heading { display: flex; justify-content: space-between; }.visual-heading span { color: #a16b52; font-size: 10px; font-weight: 800; letter-spacing: .11em; }.visual-heading h3 { margin: 5px 0; color: #172236; font-size: 17px; }.visual-heading small { color: #9aa2ad; font-size: 12px; }.history-bars { display: flex; align-items: end; gap: 16px; min-height: 230px; margin-top: 10px; padding: 0 12px; overflow-x: auto; }.history-bars article { display: grid; flex: 1; min-width: 70px; gap: 6px; text-align: center; }.bar-area { display: flex; align-items: end; height: 160px; padding: 0 8px; border-bottom: 1px solid #dedbd5; }.bar-area i { position: relative; width: 100%; min-height: 10px; border-radius: 7px 7px 0 0; background: linear-gradient(#5f83aa, #2f5c88); }.bar-area b { position: absolute; top: -22px; left: 0; right: 0; color: #344255; font-size: 12px; font-style: normal; }.history-bars strong { color: #445263; font-size: 12px; }.history-bars small { color: #9aa2ad; font-size: 11px; white-space: nowrap; }
@media (max-width: 760px) { .ability-hero { align-items: start; flex-direction: column; }.ability-change-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
