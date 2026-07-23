<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

defineProps<{
  text?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="hover-btn"
    :disabled="loading"
    @click="emit('click')"
  >
    <span class="hover-btn__label-default">{{ loading ? 'Loading...' : text }}</span>
    <div class="hover-btn__overlay">
      <span>{{ loading ? 'Loading...' : text }}</span>
      <slot name="icon">
        <ArrowRight class="hover-btn__arrow" />
      </slot>
    </div>
  </button>
</template>

<style scoped>
.hover-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 3rem;
  padding: 0 1.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-full);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}

.hover-btn:hover {
  border-color: hsl(var(--primary));
}

.hover-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hover-btn__label-default {
  display: inline-block;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hover-btn:hover .hover-btn__label-default {
  transform: translateX(3rem);
  opacity: 0;
}

.hover-btn__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.hover-btn:hover .hover-btn__overlay {
  opacity: 1;
}

.hover-btn__arrow {
  width: 1rem;
  height: 1rem;
}
</style>
