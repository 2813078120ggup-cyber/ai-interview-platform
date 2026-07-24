<script setup lang="ts">
defineProps<{
  report: {
    professionalScore: number
    expressionScore: number
    logicScore: number
    adaptabilityScore: number
  }
}>()

const dimensions = [
  ['专业', 'professionalScore'],
  ['表达', 'expressionScore'],
  ['逻辑', 'logicScore'],
  ['应变', 'adaptabilityScore']
] as const
</script>

<template>
  <div class="report-visuals">
    <article v-for="[label, key] in dimensions" :key="key" class="visual-row">
      <span>{{ label }}</span>
      <el-progress :percentage="report[key]" :stroke-width="10" />
    </article>
  </div>
</template>
