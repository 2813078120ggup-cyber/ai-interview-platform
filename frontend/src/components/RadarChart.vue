<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

export interface RadarData {
  label: string
  value: number  // 0-100
  fullMark: number
}

const props = withDefaults(defineProps<{
  data: RadarData[]
  size?: number
  color?: string
}>(), {
  size: 320,
  color: 'hsl(231, 48%, 48%)',
})

const animated = ref(false)
onMounted(() => { setTimeout(() => (animated.value = true), 200) })

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const radius = computed(() => props.size * 0.36)
const levels = 5

/* Map (index, total) → angle in radians. Start from top, clockwise. */
function angle(i: number, total: number): number {
  return (2 * Math.PI * i) / total - Math.PI / 2
}

function point(i: number, total: number, r: number): { x: number; y: number } {
  const a = angle(i, total)
  return {
    x: cx.value + r * Math.cos(a),
    y: cy.value + r * Math.sin(a),
  }
}

const gridPolygons = computed(() => {
  const polys: string[] = []
  const n = props.data.length
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (radius.value / levels) * lvl
    const pts = props.data.map((_, i) => {
      const p = point(i, n, r)
      return `${p.x},${p.y}`
    })
    polys.push(pts.join(' '))
  }
  return polys
})

const dataPoints = computed(() => {
  return props.data.map((d, i) => {
    const r = (d.value / d.fullMark) * radius.value
    return point(i, props.data.length, r)
  })
})

const dataPolygon = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const axisLabels = computed(() => {
  return props.data.map((d, i) => {
    const labelR = radius.value + 32
    const p = point(i, props.data.length, labelR)
    return { ...p, label: d.label }
  })
})
</script>

<template>
  <div class="radar-wrap" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :viewBox="`0 0 ${size} ${size}`" class="radar-svg">
      <!-- Grid polygons -->
      <polygon
        v-for="(poly, idx) in gridPolygons"
        :key="'grid-' + idx"
        :points="poly"
        fill="none"
        :stroke="idx === levels - 1 ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.4)'"
        :stroke-width="idx === levels - 1 ? 1.5 : 1"
      />

      <!-- Axis lines -->
      <line
        v-for="(d, i) in data"
        :key="'axis-' + i"
        :x1="cx"
        :y1="cy"
        :x2="point(i, data.length, radius).x"
        :y2="point(i, data.length, radius).y"
        stroke="hsl(var(--border) / 0.5)"
        stroke-width="1"
      />

      <!-- Data area -->
      <polygon
        :points="dataPolygon"
        :fill="`${color}20`"
        :stroke="color"
        stroke-width="2"
        class="radar-area"
        :class="{ 'radar-area--animated': animated }"
        :style="{
          transformOrigin: `${cx}px ${cy}px`,
        }"
      />

      <!-- Data dots -->
      <circle
        v-for="(pt, i) in dataPoints"
        :key="'dot-' + i"
        :cx="pt.x"
        :cy="pt.y"
        r="4"
        :fill="color"
        class="radar-dot"
        :class="{ 'radar-dot--animated': animated }"
        :style="{ transitionDelay: `${0.3 + i * 0.1}s` }"
      />

      <!-- Axis labels -->
      <text
        v-for="(lab, i) in axisLabels"
        :key="'label-' + i"
        :x="lab.x"
        :y="lab.y"
        text-anchor="middle"
        dominant-baseline="middle"
        class="radar-label"
      >{{ lab.label }}</text>

      <!-- Score labels next to dots -->
      <text
        v-for="(pt, i) in dataPoints"
        :key="'score-' + i"
        :x="pt.x + (pt.x > cx ? 14 : pt.x < cx ? -14 : 0)"
        :y="pt.y + (pt.y > cy ? 16 : pt.y < cy ? -10 : -10)"
        text-anchor="middle"
        class="radar-score"
        :class="{ 'radar-score--animated': animated }"
        :style="{ transitionDelay: `${0.3 + i * 0.1}s` }"
      >{{ data[i].value }}</text>
    </svg>
  </div>
</template>

<style scoped>
.radar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-svg {
  width: 100%;
  height: 100%;
}

.radar-area {
  opacity: 0;
  transform: scale(0);
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.radar-area--animated {
  opacity: 1;
  transform: scale(1);
}

.radar-dot {
  opacity: 0;
  transform: scale(0);
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.radar-dot--animated {
  opacity: 1;
  transform: scale(1);
}

.radar-label {
  font-size: 13px;
  fill: hsl(var(--foreground));
  font-weight: 500;
  font-family: var(--font-family);
}

.radar-score {
  font-size: 11px;
  font-weight: 600;
  fill: hsl(var(--primary));
  opacity: 0;
  transition: opacity 0.3s ease;
}
.radar-score--animated {
  opacity: 1;
}
</style>
