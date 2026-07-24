<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Download, Trophy, Target, TrendingUp, Zap, Lightbulb, AlertTriangle } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import RadarChart from '@/components/RadarChart.vue'
import type { RadarData } from '@/components/RadarChart.vue'
import { reportApi } from '@/api'
import type { ReportVO } from '@/api'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const apiReport = ref<ReportVO | null>(null)

interface ReportData {
  candidateName: string
  interviewTitle: string
  interviewType: string
  interviewDate: string
  totalScore: number
  dimensions: { label: string; score: number; comment: string }[]
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

const defaultReport: ReportData = {
  candidateName: '--',
  interviewTitle: '面试报告',
  interviewType: '--',
  interviewDate: '--',
  totalScore: 0,
  dimensions: [
    { label: '专业能力', score: 0, comment: '' },
    { label: '表达能力', score: 0, comment: '' },
    { label: '逻辑思维', score: 0, comment: '' },
    { label: '应变能力', score: 0, comment: '' },
  ],
  strengths: [],
  weaknesses: [],
  suggestions: [],
}

const report = ref<ReportData>({ ...defaultReport })

onMounted(async () => {
  const reportId = route.params.id
  const interviewId = route.params.interviewId

  if (reportId) {
    try {
      loading.value = true
      const res = await reportApi.getById(Number(reportId))
      apiReport.value = res.data
      fillFromApi(res.data)
    } catch {
      ElMessage.warning('报告数据加载失败')
    } finally {
      loading.value = false
    }
  } else if (interviewId) {
    try {
      loading.value = true
      const res = await reportApi.getByInterview(Number(interviewId))
      apiReport.value = res.data
      fillFromApi(res.data)
    } catch {
      ElMessage.warning('报告数据加载失败')
    } finally {
      loading.value = false
    }
  }
})

function fillFromApi(r: ReportVO) {
  report.value = {
    candidateName: r.candidateName || '--',
    interviewTitle: r.interviewTitle || '面试报告',
    interviewType: '--',
    interviewDate: r.generatedAt?.replace('T', ' ') || '--',
    totalScore: Number(r.totalScore) || 0,
    dimensions: [
      { label: '专业能力', score: Number(r.professionalScore) || 0, comment: '' },
      { label: '表达能力', score: Number(r.expressionScore) || 0, comment: '' },
      { label: '逻辑思维', score: Number(r.logicScore) || 0, comment: '' },
      { label: '应变能力', score: Number(r.adaptabilityScore) || 0, comment: '' },
    ],
    strengths: r.strengths ? r.strengths.split('\n').filter(Boolean) : [],
    weaknesses: r.weaknesses ? r.weaknesses.split('\n').filter(Boolean) : [],
    suggestions: r.improvementSuggestions ? r.improvementSuggestions.split('\n').filter(Boolean) : [],
  }
}

/* ===== Radar Data ===== */
const radarData = computed<RadarData[]>(() =>
  report.value.dimensions.map((dimension) => ({ label: dimension.label, value: dimension.score, fullMark: 100 })),
)

/* ===== Score Color ===== */
function scoreColor(s: number): string {
  if (s >= 85) return '#10b981'
  if (s >= 70) return '#7c3aed'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(s: number): string {
  if (s >= 90) return '优秀'
  if (s >= 80) return '良好'
  if (s >= 70) return '中等'
  if (s >= 60) return '合格'
  return '������'
}

/* ===== Overall score ring ===== */
const circumference = 2 * Math.PI * 64
const dashOffset = computed(() => circumference * (1 - report.value.totalScore / 100))

/* ===== PDF Export ===== */
const reportRef = ref<HTMLElement | null>(null)
const exporting = ref(false)

async function exportPDF() {
  if (!reportRef.value) return
  exporting.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')

    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f3ff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20

    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft) + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    pdf.save(`${report.value.candidateName}-���Ա���.pdf`)
    ElMessage.success('PDF 导出成功')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="report-page">
    <!-- ===== Navigation ===== -->
    <nav class="nav">
      <button class="nav__back" @click="router.back()">
        <ArrowLeft :size="18" />
        <span>返回</span>
      </button>
      <span class="nav__title">面试报告</span>
      <div class="nav__spacer" />
    </nav>

    <!-- ===== Report Content ===== -->
    <div ref="reportRef" class="report-body">

      <!-- ===== Hero: centered score + info ===== -->
      <section class="hero">
        <div class="hero__score">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <!-- Track ring -->
            <circle
              cx="80" cy="80" r="64"
              fill="none"
              stroke="#e8e5f3"
              stroke-width="10"
            />
            <!-- Score ring with gradient -->
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#a78bfa" />
              </linearGradient>
            </defs>
            <circle
              cx="80" cy="80" r="64"
              fill="none"
              stroke="url(#scoreGradient)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 80 80)"
              class="score-ring"
            />
          </svg>
          <div class="hero__score-inner">
            <span class="hero__score-value">{{ report.totalScore }}</span>
            <span class="hero__score-label">{{ scoreLabel(report.totalScore) }}</span>
          </div>
        </div>

        <div class="hero__info">
          <span class="hero__badge">{{ report.interviewType }}</span>
          <h1 class="hero__name">{{ report.candidateName }}</h1>
          <p class="hero__title">{{ report.interviewTitle }}</p>
          <p class="hero__date">{{ report.interviewDate }}</p>
        </div>
      </section>

      <!-- ===== Radar + Dimensions (2 columns) ===== -->
      <div class="card-grid card-grid--2col">
        <!-- Radar -->
        <div class="card">
          <h2 class="card__title">
            <Target :size="18" />
            综合能力雷达�?
          </h2>
          <div class="card__radar">
            <RadarChart
              :data="radarData"
              :size="300"
              color="#7c3aed"
            />
          </div>
        </div>

        <!-- Dimension bars -->
        <div class="card">
          <h2 class="card__title">
            <TrendingUp :size="18" />
            各维度得�?
          </h2>
          <div class="dim-list">
            <div v-for="d in report.dimensions" :key="d.label" class="dim-item">
              <div class="dim-item__header">
                <span class="dim-item__label">{{ d.label }}</span>
                <span class="dim-item__score" :style="{ color: scoreColor(d.score) }">
                  {{ d.score }}<span class="dim-item__unit"> / 100</span>
                </span>
              </div>
              <div class="dim-item__track">
                <div
                  class="dim-item__fill"
                  :style="{ width: `${d.score}%`, background: scoreColor(d.score) }"
                />
              </div>
              <p class="dim-item__comment">{{ d.comment }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Analysis (3 columns) ===== -->
      <div class="card-grid card-grid--3col">
        <!-- Strengths -->
        <div class="card">
          <h2 class="card__title">
            <Lightbulb :size="18" />
            优势分析
          </h2>
          <ul class="bullet-list">
            <li v-for="(s, i) in report.strengths" :key="'s-' + i" class="bullet-list__item">
              <span class="bullet-list__dot bullet-list__dot--green" />
              <span>{{ s }}</span>
            </li>
          </ul>
        </div>

        <!-- Weaknesses -->
        <div class="card">
          <h2 class="card__title">
            <AlertTriangle :size="18" />
            待提升项
          </h2>
          <ul class="bullet-list">
            <li v-for="(w, i) in report.weaknesses" :key="'w-' + i" class="bullet-list__item">
              <span class="bullet-list__dot bullet-list__dot--amber" />
              <span>{{ w }}</span>
            </li>
          </ul>
        </div>

        <!-- Suggestions -->
        <div class="card">
          <h2 class="card__title">
            <Target :size="18" />
            改进建议
          </h2>
          <ul class="numbered-list">
            <li v-for="(sg, i) in report.suggestions" :key="'sg-' + i" class="numbered-list__item">
              <span class="numbered-list__num">{{ i + 1 }}</span>
              <span>{{ sg }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ===== Export ===== -->
      <div class="export-bar no-print">
        <button class="export-btn" :disabled="exporting" @click="exportPDF">
          <Download :size="18" />
          <span>{{ exporting ? '导出�?..' : '导出 PDF 报告' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================
   1. PAGE LAYOUT
   ========================================== */
.report-page {
  min-height: 100vh;
  background: #f5f3ff;
}

.report-body {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}

/* ==========================================
   2. NAVIGATION
   ========================================== */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #ede9f6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav__back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: inherit;
  transition: color 0.15s, background 0.15s;
}
.nav__back:hover {
  color: #1e1b4b;
  background: #f5f3ff;
}

.nav__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e1b4b;
}

.nav__spacer {
  width: 64px; /* balance with back button */
}

/* ==========================================
   3. HERO �?centered score + info
   ========================================== */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem 2.5rem;
  margin-bottom: 1.5rem;
}

.hero__score {
  position: relative;
  margin-bottom: 1.5rem;
}

.score-ring {
  transition: stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero__score-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hero__score-value {
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1;
  color: #1e1b4b;
  letter-spacing: -0.02em;
}

.hero__score-label {
  margin-top: 0.25rem;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 600;
}

.hero__badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: #ede9fe;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.hero__name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 0.25rem;
}

.hero__title {
  font-size: 0.9375rem;
  color: #6b7280;
  margin-bottom: 0.125rem;
}

.hero__date {
  font-size: 0.8125rem;
  color: #9ca3af;
}

/* ==========================================
   4. CARD GRID
   ========================================== */
.card-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-grid--2col {
  grid-template-columns: 1fr 1fr;
}

.card-grid--3col {
  grid-template-columns: 1fr 1fr 1fr;
}

/* ==========================================
   5. CARD BASE
   ========================================== */
.card {
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.03);
}

.card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e1b4b;
  margin-bottom: 1.125rem;
}

.card__radar {
  display: flex;
  justify-content: center;
}

/* ==========================================
   6. DIMENSION LIST
   ========================================== */
.dim-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dim-item__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.375rem;
}

.dim-item__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.dim-item__score {
  font-size: 1.25rem;
  font-weight: 700;
}

.dim-item__unit {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
}

.dim-item__track {
  height: 6px;
  border-radius: 3px;
  background: #f3f4f6;
  overflow: hidden;
  margin-bottom: 0.375rem;
}

.dim-item__fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dim-item__comment {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.55;
}

/* ==========================================
   7. BULLET LIST (strengths & weaknesses)
   ========================================== */
.bullet-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.bullet-list__item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #374151;
}

.bullet-list__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
}

.bullet-list__dot--green {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.bullet-list__dot--amber {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}

/* ==========================================
   8. NUMBERED LIST (suggestions)
   ========================================== */
.numbered-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.numbered-list__item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #374151;
}

.numbered-list__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7c3aed;
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-top: 1px;
}

/* ==========================================
   9. EXPORT BUTTON
   ========================================== */
.export-bar {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2.25rem;
  border: none;
  border-radius: 999px;
  background: #7c3aed;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
}
.export-btn:hover {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}
.export-btn:disabled {
  background: #c4b5fd;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

/* ==========================================
   10. RESPONSIVE
   ========================================== */
@media (max-width: 768px) {
  .card-grid--2col,
  .card-grid--3col {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 1.5rem 1rem 2rem;
  }

  .report-body {
    padding: 1rem 1rem 2rem;
  }

  .nav {
    padding: 0.75rem 1rem;
  }
}

/* ==========================================
   11. PRINT
   ========================================== */
@media print {
  .no-print { display: none !important; }
  .nav { display: none !important; }
  .report-page { background: #fff; }
}
</style>
