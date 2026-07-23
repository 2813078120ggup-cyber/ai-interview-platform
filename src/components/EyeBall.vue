<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  forceLookX?: number
  forceLookY?: number
  mouseX: number
  mouseY: number
}>(), {
  size: 48,
  pupilSize: 16,
  maxDistance: 10,
  eyeColor: 'white',
  pupilColor: 'black',
})

const eyeRef = ref<HTMLElement | null>(null)

const pupilTranslation = computed(() => {
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }
  if (!eyeRef.value) return { x: 0, y: 0 }
  const rect = eyeRef.value.getBoundingClientRect()
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
    ref="eyeRef"
    class="eyeball"
    :style="{
      width: `${size}px`,
      height: isBlinking ? '2px' : `${size}px`,
      backgroundColor: eyeColor,
    }"
  >
    <div
      v-if="!isBlinking"
      class="eyeball__pupil"
      :style="{
        width: `${pupilSize}px`,
        height: `${pupilSize}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilTranslation.x}px, ${pupilTranslation.y}px)`,
      }"
    />
  </div>
</template>

<style scoped>
.eyeball {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  transition: height 0.15s ease;
}

.eyeball__pupil {
  border-radius: 50%;
  transition: transform 0.1s ease-out;
}
</style>
