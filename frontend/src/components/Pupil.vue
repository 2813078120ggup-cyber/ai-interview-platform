<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
  mouseX: number
  mouseY: number
}>(), {
  size: 12,
  maxDistance: 5,
  pupilColor: 'black',
})

const pupilRef = ref<HTMLElement | null>(null)

const translation = computed(() => {
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }
  if (!pupilRef.value) return { x: 0, y: 0 }
  const rect = pupilRef.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = props.mouseX - cx
  const dy = props.mouseY - cy
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), props.maxDistance)
  const angle = Math.atan2(dy, dx)
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
  }
})
</script>

<template>
  <div
    ref="pupilRef"
    class="pupil"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: pupilColor,
      transform: `translate(${translation.x}px, ${translation.y}px)`,
    }"
  />
</template>

<style scoped>
.pupil {
  border-radius: 50%;
  transition: transform 0.1s ease-out;
}
</style>
