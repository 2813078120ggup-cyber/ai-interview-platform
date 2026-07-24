<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ report: { professionalScore: number; expressionScore: number; logicScore: number; adaptabilityScore: number } }>()
const dimensions = computed(() => [
  { name: '专业能力', value: Number(props.report.professionalScore ?? 0), color: '#d98656' },
  { name: '表达能力', value: Number(props.report.expressionScore ?? 0), color: '#5f83aa' },
  { name: '逻辑思维', value: Number(props.report.logicScore ?? 0), color: '#4e9b81' },
  { name: '应变能力', value: Number(props.report.adaptabilityScore ?? 0), color: '#8b6fb6' }
])
const center = 130
const radius = 86
function point(value: number, index: number, scale = 1) {
  const angle = (-90 + index * 90) * Math.PI / 180
  const distance = radius * scale * value / 100
  return `${(center + Math.cos(angle) * distance).toFixed(1)},${(center + Math.sin(angle) * distance).toFixed(1)}`
}
const gridPoints = computed(() => dimensions.value.map((_, index) => point(100, index)).join(' '))
const valuePoints = computed(() => dimensions.value.map((item, index) => point(item.value, index)).join(' '))
const axisPoints = computed(() => dimensions.value.map((_, index) => point(100, index)))
const labels = computed(() => dimensions.value.map((item, index) => ({ ...item, point: point(122, index) })))
</script>

<template>
  <section class="report-visuals">
    <article class="radar-card"><div class="visual-heading"><div><span>ABILITY RADAR</span><h3>能力雷达图</h3></div><small>四维能力分布</small></div><svg viewBox="0 0 260 260" role="img" aria-label="能力雷达图"><polygon :points="gridPoints" class="radar-grid"/><line v-for="(axis, index) in axisPoints" :key="index" :x1="center" :y1="center" :x2="axis.split(',')[0]" :y2="axis.split(',')[1]" class="radar-axis"/><polygon :points="valuePoints" class="radar-value"/><circle v-for="(axis, index) in dimensions" :key="axis.name" :cx="point(axis.value, index).split(',')[0]" :cy="point(axis.value, index).split(',')[1]" r="4" class="radar-dot"/><text v-for="label in labels" :key="label.name" :x="label.point.split(',')[0]" :y="label.point.split(',')[1]" text-anchor="middle" class="radar-label">{{ label.name }}</text></svg></article>
    <article class="bar-card"><div class="visual-heading"><div><span>DIMENSION SCORES</span><h3>能力维度对比</h3></div><small>满分 100</small></div><div class="score-bars"><div v-for="item in dimensions" :key="item.name" class="score-bar"><div class="bar-label"><span>{{ item.name }}</span><strong>{{ item.value.toFixed(1) }}</strong></div><div class="bar-track"><i :style="{ width: `${Math.min(100, Math.max(0, item.value))}%`, background: item.color }"></i></div></div></div></article>
  </section>
</template>

<style scoped>
.report-visuals { display: grid; grid-template-columns: minmax(270px, .9fr) minmax(300px, 1.1fr); gap: 18px; }.radar-card, .bar-card { min-height: 322px; padding: 23px; border: 1px solid #e4e1dc; border-radius: 12px; background: #fffefb; }.visual-heading { display: flex; align-items: start; justify-content: space-between; }.visual-heading span { color: #a16b52; font-size: 10px; font-weight: 800; letter-spacing: .11em; }.visual-heading h3 { margin: 5px 0 0; color: #172236; font-size: 17px; }.visual-heading small { color: #9aa2ad; font-size: 12px; }.radar-card svg { display: block; width: min(100%, 280px); height: 260px; margin: 5px auto -10px; overflow: visible; }.radar-grid { fill: rgba(217, 134, 86, .06); stroke: #d8d5cf; stroke-width: 1; }.radar-axis { stroke: #e6e2dc; stroke-width: 1; }.radar-value { fill: rgba(63, 112, 170, .2); stroke: #3f70aa; stroke-width: 2.2; }.radar-dot { fill: #d98656; stroke: #fff; stroke-width: 2; }.radar-label { fill: #707985; font-size: 10px; }.score-bars { display: grid; gap: 22px; margin-top: 36px; }.bar-label { display: flex; justify-content: space-between; margin-bottom: 8px; color: #4e5967; font-size: 14px; }.bar-label strong { color: #172236; }.bar-track { height: 9px; overflow: hidden; border-radius: 999px; background: #edeae5; }.bar-track i { display: block; height: 100%; border-radius: inherit; transition: width .4s ease; }
@media (max-width: 760px) { .report-visuals { grid-template-columns: 1fr; } }
</style>
