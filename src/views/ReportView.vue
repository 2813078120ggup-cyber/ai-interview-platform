<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Download, Trophy, Target, TrendingUp, Zap, Lightbulb, AlertTriangle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import RadarChart from '@/components/RadarChart.vue'
import type { RadarData } from '@/components/RadarChart.vue'

const router = useRouter()

/* ===== Mock Data ===== */
const report = {
  candidateName: '张三',
  interviewTitle: '高级前端工程师技术面试',
  interviewType: '技术面试',
  interviewDate: '2026-07-22 14:00',
  totalScore: 82.5,
  dimensions: [
    { label: '专业能力', score: 85, comment: '前端基础扎实，React/Vue 生态理解深入，能准确回答组件化、状态管理、性能优化等问题。' },
    { label: '表达能力', score: 78, comment: '思路清晰，能够完整表述技术方案。部分术语使用不够精准，可进一步提升表达简洁度。' },
    { label: '逻辑思维', score: 88, comment: '分析问题和设计方案的逻辑链路清晰。在系统设计题中展现出良好的分治与抽象能力。' },
    { label: '应变能力', score: 76, comment: '遇到不熟悉的问题时能保持冷静并尝试推理。在压力场景下偶尔犹豫，可多参与模拟面试训练。' },
  ],
  strengths: [
    '前端工程化经验丰富，熟悉 Webpack/Vite 构建工具链',
    'React 和 Vue 双技术栈均有实际项目经验',
    '系统设计能力突出，能独立完成中等复杂度的架构设计',
    '代码质量和测试意识良好，有单元测试和 E2E 测试实践',
  ],
  weaknesses: [
    '对浏览器底层原理（渲染流程、V8 GC）了解不够系统',
    '高并发场景下的前端性能优化经验有限',
    '部分答案过于技术细节导向，面向非技术听众的沟通需加强',
  ],
  suggestions: [
    '建议深入学习浏览器工作原理，推荐阅读《WebKit 技术内幕》',
    '参与大型开源项目或公司级高性能应用开发，积累极端场景经验',
    '定期进行模拟面试，强化时间压力下的快速思考和表达',
    '关注前端安全领域（XSS、CSRF、CSP），补充安全编码知识',
  ],
}

/* ===== Radar Data ===== */
const radarData = computed<RadarData[]>(() =>
  report.dimensions.map(d => ({ label: d.label, value: d.score, fullMark: 100 })),
)

/* ===== Score Color ===== */
function scoreColor(s: number): string {
  if (s >= 85) return '#22c55e'
  if (s >= 70) return 'hsl(231, 48%, 48%)'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(s: number): string {
  if (s >= 90) return '优秀'
  if (s >= 80) return '良好'
  if (s >= 70) return '中等'
  if (s >= 60) return '合格'
  return '待提升'
}

/* ===== Overall score ring ===== */
const circumference = 2 * Math.PI * 54
const dashOffset = computed(() => circumference * (1 - report.totalScore / 100))

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
      backgroundColor: '#ffffff',
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

    pdf.save(`${report.candidateName}-面试报告.pdf`)
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
    <!-- Back nav -->
    <div class="report-nav">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="18" />
        <span>返回</span>
      </button>
      <span class="report-nav__title">面试报告</span>
      <div />
    </div>

    <!-- Report Content -->
    <div ref="reportRef" class="report-body">
      <!-- ====== Hero Section ====== -->
      <div class="report-hero">
        <div class="report-hero__info">
          <div class="report-hero__badge">{{ report.interviewType }}</div>
          <h1 class="report-hero__name">{{ report.candidateName }}</h1>
          <p class="report-hero__title">{{ report.interviewTitle }}</p>
          <p class="report-hero__date">{{ report.interviewDate }}</p>
        </div>

        <!-- Overall score ring -->
        <div class="report-hero__score">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke="hsl(var(--border))"
              stroke-width="10"
            />
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              :stroke="scoreColor(report.totalScore)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 70 70)"
              class="score-ring"
            />
          </svg>
          <div class="score-inner">
            <span class="score-value" :style="{ color: scoreColor(report.totalScore) }">
              {{ report.totalScore }}
            </span>
            <span class="score-tag" :style="{ background: scoreColor(report.totalScore) + '18', color: scoreColor(report.totalScore) }">
              {{ scoreLabel(report.totalScore) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ====== Radar + Dimensions ====== -->
      <div class="report-grid">
        <!-- Radar -->
        <div class="report-card report-card--radar">
          <h2 class="card-title">
            <Target :size="18" />
            综合能力雷达图
          </h2>
          <div class="radar-container">
            <RadarChart
              :data="radarData"
              :size="320"
              color="hsl(231, 48%, 48%)"
            />
          </div>
        </div>

        <!-- Dimension bars -->
        <div class="report-card">
          <h2 class="card-title">
            <TrendingUp :size="18" />
            各维度得分
          </h2>
          <div class="dim-list">
            <div v-for="d in report.dimensions" :key="d.label" class="dim-item">
              <div class="dim-item__header">
                <span class="dim-item__label">{{ d.label }}</span>
                <span class="dim-item__score" :style="{ color: scoreColor(d.score) }">
                  {{ d.score }}<span class="dim-item__unit">/100</span>
                </span>
              </div>
              <div class="dim-item__bar-track">
                <div
                  class="dim-item__bar-fill"
                  :style="{
                    width: `${d.score}%`,
                    background: scoreColor(d.score),
                  }"
                />
              </div>
              <p class="dim-item__comment">{{ d.comment }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== Analysis Section ====== -->
      <div class="report-grid report-grid--3cols">
        <!-- Strengths -->
        <div class="report-card report-card--strengths">
          <h2 class="card-title">
            <Lightbulb :size="18" />
            优势分析
          </h2>
          <ul class="analysis-list">
            <li v-for="(s, i) in report.strengths" :key="'s-' + i">
              <Zap :size="14" class="list-icon list-icon--good" />
              {{ s }}
            </li>
          </ul>
        </div>

        <!-- Weaknesses -->
        <div class="report-card report-card--weaknesses">
          <h2 class="card-title">
            <AlertTriangle :size="18" />
            待提升项
          </h2>
          <ul class="analysis-list">
            <li v-for="(w, i) in report.weaknesses" :key="'w-' + i">
              <span class="list-dot list-dot--warn" />
              {{ w }}
            </li>
          </ul>
        </div>

        <!-- Suggestions -->
        <div class="report-card report-card--suggestions">
          <h2 class="card-title">
            <Target :size="18" />
            改进建议
          </h2>
          <ul class="analysis-list analysis-list--numbered">
            <li v-for="(sg, i) in report.suggestions" :key="'sg-' + i">
              <span class="list-num">{{ i + 1 }}</span>
              {{ sg }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ====== PDF Button (not printed in PDF) ====== -->
      <div class="export-bar no-print">
        <button class="export-btn" :disabled="exporting" @click="exportPDF">
          <Download :size="18" />
          <span>{{ exporting ? '导出中...' : '导出 PDF 报告' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Layout ===== */
.report-page {
  min-height: 100vh;
  background: hsl(var(--background));
  padding-bottom: 4rem;
}

.report-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font-size: 0.875rem;
  font-family: var(--font-family);
  transition: color 0.15s, background 0.15s;
}
.back-btn:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.report-nav__title {
  font-weight: 600;
  font-size: 0.9375rem;
}

.report-body {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ===== Hero ===== */
.report-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, hsl(231, 48%, 48%), hsl(231, 48%, 38%));
  border-radius: 1rem;
  color: #fff;
}

.report-hero__badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,0.18);
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.report-hero__name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.report-hero__title {
  font-size: 0.9375rem;
  opacity: 0.85;
  margin-bottom: 0.25rem;
}

.report-hero__date {
  font-size: 0.8125rem;
  opacity: 0.6;
}

.report-hero__score {
  position: relative;
  flex-shrink: 0;
}

.score-ring {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
}

.score-tag {
  margin-top: 0.25rem;
  padding: 0.125rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
}

/* ===== Cards ===== */
.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.report-grid--3cols {
  grid-template-columns: 1fr 1fr 1fr;
}

.report-card {
  padding: 1.5rem;
  background: #fff;
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 1.25rem;
}

/* ===== Radar container ===== */
.radar-container {
  display: flex;
  justify-content: center;
}

/* ===== Dimension list ===== */
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
}

.dim-item__score {
  font-size: 1.25rem;
  font-weight: 700;
}

.dim-item__unit {
  font-size: 0.75rem;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}

.dim-item__bar-track {
  height: 6px;
  border-radius: 3px;
  background: hsl(var(--secondary));
  overflow: hidden;
  margin-bottom: 0.375rem;
}

.dim-item__bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dim-item__comment {
  font-size: 0.8125rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

/* ===== Analysis lists ===== */
.analysis-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.analysis-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: hsl(var(--foreground));
}

.list-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.list-icon--good {
  color: #22c55e;
}

.list-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.list-dot--warn {
  background: #f59e0b;
}

.list-num {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: hsl(231, 48%, 48%);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-top: 1px;
}

/* ===== Export bar ===== */
.export-bar {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: var(--radius-full);
  background: hsl(var(--primary));
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}
.export-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .report-grid,
  .report-grid--3cols {
    grid-template-columns: 1fr;
  }

  .report-hero {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .report-nav {
    padding: 0.75rem 1rem;
  }
}

@media print {
  .no-print { display: none !important; }
  .report-nav { display: none !important; }
  .report-page { background: #fff; }
}
</style>
