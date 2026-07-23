<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import EyeBall from './EyeBall.vue'
import Pupil from './Pupil.vue'

/* ===== Props ===== */
const props = withDefaults(defineProps<{
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
}>(), {
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
})

/* ===== Mouse tracking ===== */
const mouseX = ref(0)
const mouseY = ref(0)

function onMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

onMounted(() => window.addEventListener('mousemove', onMouseMove))
onUnmounted(() => window.removeEventListener('mousemove', onMouseMove))

/* ===== Blinking state ===== */
const isPurpleBlinking = ref(false)
const isBlackBlinking = ref(false)

function scheduleBlink(setter: (v: boolean) => void) {
  const interval = Math.random() * 4000 + 3000
  const timer = setTimeout(() => {
    setter(true)
    setTimeout(() => {
      setter(false)
      scheduleBlink(setter)
    }, 150)
  }, interval)
  return timer
}

onMounted(() => {
  const t1 = scheduleBlink((v) => (isPurpleBlinking.value = v))
  const t2 = scheduleBlink((v) => (isBlackBlinking.value = v))
  return () => {
    clearTimeout(t1)
    clearTimeout(t2)
  }
})

/* ===== Look at each other when typing ===== */
const isLookingAtEachOther = ref(false)

watch(() => props.isTyping, (val) => {
  if (val) {
    isLookingAtEachOther.value = true
    setTimeout(() => (isLookingAtEachOther.value = false), 800)
  } else {
    isLookingAtEachOther.value = false
  }
})

/* ===== Purple peeking when password visible ===== */
const isPurplePeeking = ref(false)
let peekTimer: ReturnType<typeof setTimeout> | null = null

function schedulePeek() {
  const delay = Math.random() * 3000 + 2000
  peekTimer = setTimeout(() => {
    isPurplePeeking.value = true
    setTimeout(() => {
      isPurplePeeking.value = false
      schedulePeek()
    }, 800)
  }, delay)
}

watch(
  () => props.passwordLength > 0 && props.showPassword,
  (shouldPeek) => {
    if (shouldPeek) {
      schedulePeek()
    } else {
      isPurplePeeking.value = false
      if (peekTimer) clearTimeout(peekTimer)
    }
  },
)

onUnmounted(() => {
  if (peekTimer) clearTimeout(peekTimer)
})

/* ===== Position calculations ===== */
const purpleRef = ref<HTMLElement | null>(null)
const blackRef = ref<HTMLElement | null>(null)
const yellowRef = ref<HTMLElement | null>(null)
const orangeRef = ref<HTMLElement | null>(null)

function calcPosition(el: HTMLElement | null) {
  if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouseX.value - cx
  const dy = mouseY.value - cy
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  }
}

const purplePos = computed(() => calcPosition(purpleRef.value))
const blackPos = computed(() => calcPosition(blackRef.value))
const yellowPos = computed(() => calcPosition(yellowRef.value))
const orangePos = computed(() => calcPosition(orangeRef.value))

/* ===== Derived states ===== */
const isHidingPassword = computed(() => props.passwordLength > 0 && !props.showPassword)
const isShowingPassword = computed(() => props.passwordLength > 0 && props.showPassword)

/* ===== Computed styles ===== */
const purpleTransform = computed(() => {
  const skew = purplePos.value.bodySkew
  if (isShowingPassword.value) return 'skewX(0deg)'
  if (props.isTyping || isHidingPassword.value) return `skewX(${skew - 12}deg) translateX(40px)`
  return `skewX(${skew}deg)`
})

const blackTransform = computed(() => {
  const skew = blackPos.value.bodySkew
  if (isShowingPassword.value) return 'skewX(0deg)'
  if (isLookingAtEachOther.value) return `skewX(${skew * 1.5 + 10}deg) translateX(20px)`
  if (props.isTyping || isHidingPassword.value) return `skewX(${skew * 1.5}deg)`
  return `skewX(${skew}deg)`
})

const orangeTransform = computed(() => {
  if (isShowingPassword.value) return 'skewX(0deg)'
  return `skewX(${orangePos.value.bodySkew}deg)`
})

const yellowTransform = computed(() => {
  if (isShowingPassword.value) return 'skewX(0deg)'
  return `skewX(${yellowPos.value.bodySkew}deg)`
})

/* Eye positions */
function eyePos(baseX: number, baseY: number, faceX: number, faceY: number, pwX: number, pwY: number) {
  return {
    left: isShowingPassword.value ? `${pwX}px` : `${baseX + faceX}px`,
    top: isShowingPassword.value ? `${pwY}px` : `${baseY + faceY}px`,
  }
}

const purpleEyePos = computed(() => {
  if (isShowingPassword.value) return { left: '20px', top: '35px' }
  if (isLookingAtEachOther.value) return { left: '55px', top: '65px' }
  return { left: `${45 + purplePos.value.faceX}px`, top: `${40 + purplePos.value.faceY}px` }
})

const blackEyePos = computed(() => {
  if (isShowingPassword.value) return { left: '10px', top: '28px' }
  if (isLookingAtEachOther.value) return { left: '32px', top: '12px' }
  return { left: `${26 + blackPos.value.faceX}px`, top: `${32 + blackPos.value.faceY}px` }
})

const orangePupilPos = computed(() => ({
  left: isShowingPassword.value ? '50px' : `${82 + orangePos.value.faceX}px`,
  top: isShowingPassword.value ? '85px' : `${90 + orangePos.value.faceY}px`,
}))

const yellowPupilPos = computed(() => ({
  left: isShowingPassword.value ? '20px' : `${52 + yellowPos.value.faceX}px`,
  top: isShowingPassword.value ? '35px' : `${40 + yellowPos.value.faceY}px`,
}))

const yellowMouthPos = computed(() => ({
  left: isShowingPassword.value ? '10px' : `${40 + yellowPos.value.faceX}px`,
  top: isShowingPassword.value ? '88px' : `${88 + yellowPos.value.faceY}px`,
}))

/* ===== Pupil force-look ===== */
const purpleLookX = computed(() => isShowingPassword.value ? (isPurplePeeking.value ? 4 : -4) : isLookingAtEachOther.value ? 3 : undefined)
const purpleLookY = computed(() => isShowingPassword.value ? (isPurplePeeking.value ? 5 : -4) : isLookingAtEachOther.value ? 4 : undefined)
const blackLookX = computed(() => isShowingPassword.value ? -4 : isLookingAtEachOther.value ? 0 : undefined)
const blackLookY = computed(() => isShowingPassword.value ? -4 : isLookingAtEachOther.value ? -4 : undefined)
const orangeLookX = computed(() => isShowingPassword.value ? -5 : undefined)
const orangeLookY = computed(() => isShowingPassword.value ? -4 : undefined)
const yellowLookX = computed(() => isShowingPassword.value ? -5 : undefined)
const yellowLookY = computed(() => isShowingPassword.value ? -4 : undefined)
</script>

<template>
  <div class="anim-ctn">
    <!-- Purple Character (back) -->
    <div
      ref="purpleRef"
      class="char char--purple"
      :style="{
        left: '70px',
        width: '180px',
        height: (isTyping || isHidingPassword) ? '440px' : '400px',
        zIndex: 1,
        transform: purpleTransform,
      }"
    >
      <div class="eyes-row" :style="purpleEyePos">
        <EyeBall
          :size="18"
          :pupilSize="7"
          :maxDistance="5"
          eyeColor="white"
          pupilColor="#2D2D2D"
          :isBlinking="isPurpleBlinking"
          :forceLookX="purpleLookX"
          :forceLookY="purpleLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
        <EyeBall
          :size="18"
          :pupilSize="7"
          :maxDistance="5"
          eyeColor="white"
          pupilColor="#2D2D2D"
          :isBlinking="isPurpleBlinking"
          :forceLookX="purpleLookX"
          :forceLookY="purpleLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
      </div>
    </div>

    <!-- Black Character (middle) -->
    <div
      ref="blackRef"
      class="char char--black"
      :style="{
        left: '240px',
        width: '120px',
        height: '310px',
        zIndex: 2,
        transform: blackTransform,
      }"
    >
      <div class="eyes-row" :style="blackEyePos">
        <EyeBall
          :size="16"
          :pupilSize="6"
          :maxDistance="4"
          eyeColor="white"
          pupilColor="#2D2D2D"
          :isBlinking="isBlackBlinking"
          :forceLookX="blackLookX"
          :forceLookY="blackLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
        <EyeBall
          :size="16"
          :pupilSize="6"
          :maxDistance="4"
          eyeColor="white"
          pupilColor="#2D2D2D"
          :isBlinking="isBlackBlinking"
          :forceLookX="blackLookX"
          :forceLookY="blackLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
      </div>
    </div>

    <!-- Orange Character (front-left) -->
    <div
      ref="orangeRef"
      class="char char--orange"
      :style="{
        left: '0px',
        width: '240px',
        height: '200px',
        zIndex: 3,
        transform: orangeTransform,
      }"
    >
      <div class="eyes-row" :style="orangePupilPos">
        <Pupil
          :size="12"
          :maxDistance="5"
          pupilColor="#2D2D2D"
          :forceLookX="orangeLookX"
          :forceLookY="orangeLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
        <Pupil
          :size="12"
          :maxDistance="5"
          pupilColor="#2D2D2D"
          :forceLookX="orangeLookX"
          :forceLookY="orangeLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
      </div>
    </div>

    <!-- Yellow Character (front-right) -->
    <div
      ref="yellowRef"
      class="char char--yellow"
      :style="{
        left: '310px',
        width: '140px',
        height: '230px',
        zIndex: 4,
        transform: yellowTransform,
      }"
    >
      <div class="eyes-row" :style="yellowPupilPos">
        <Pupil
          :size="12"
          :maxDistance="5"
          pupilColor="#2D2D2D"
          :forceLookX="yellowLookX"
          :forceLookY="yellowLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
        <Pupil
          :size="12"
          :maxDistance="5"
          pupilColor="#2D2D2D"
          :forceLookX="yellowLookX"
          :forceLookY="yellowLookY"
          :mouseX="mouseX"
          :mouseY="mouseY"
        />
      </div>
      <!-- Mouth -->
      <div class="mouth" :style="yellowMouthPos" />
    </div>
  </div>
</template>

<style scoped>
.anim-ctn {
  position: relative;
  width: 550px;
  height: 400px;
}

.char {
  position: absolute;
  bottom: 0;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;
}

.char--purple {
  background-color: #6C3FF5;
  border-radius: 10px 10px 0 0;
}

.char--black {
  background-color: #2D2D2D;
  border-radius: 8px 8px 0 0;
}

.char--orange {
  background-color: #FF9B6B;
  border-radius: 120px 120px 0 0;
}

.char--yellow {
  background-color: #E8D754;
  border-radius: 70px 70px 0 0;
}

.eyes-row {
  position: absolute;
  display: flex;
  gap: 1.5rem;
  transition: all 0.2s ease-out;
}

.char--purple .eyes-row { gap: 2rem; }
.char--black .eyes-row { gap: 1.5rem; }
.char--orange .eyes-row { gap: 2rem; }
.char--yellow .eyes-row { gap: 1.5rem; }

.mouth {
  position: absolute;
  width: 80px;
  height: 4px;
  background: #2D2D2D;
  border-radius: 9999px;
  transition: all 0.2s ease-out;
}
</style>
