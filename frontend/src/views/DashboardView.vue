<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, statusLabel, type Interview } from '@/api'

const router = useRouter()
const interviews = ref<Interview[]>([])
const loading = ref(true)
const statistics = computed(() => ({ pending: interviews.value.filter(item => item.status === 0).length, running: interviews.value.filter(item => item.status === 1).length, finished: interviews.value.filter(item => item.status === 2).length }))
const upcoming = computed(() => [...interviews.value].filter(item => item.status < 2).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 5))
onMounted(async () => { try { interviews.value = await api.get<Interview[]>('/v1/interviews') } finally { loading.value = false } })
</script>

<template>
  <section class="page-header"><div><p class="eyebrow">OVERVIEW</p><h1>工作台</h1><p>查看面试安排、当前流程和评测进度。</p></div><el-button type="primary" @click="router.push('/admin/interviews')">管理面试</el-button></section>
  <section class="metric-grid"><article><span>待开始</span><strong>{{ statistics.pending }}</strong><small>已安排面试</small></article><article><span>进行中</span><strong>{{ statistics.running }}</strong><small>当前面试场次</small></article><article><span>已结束</span><strong>{{ statistics.finished }}</strong><small>等待评测或已归档</small></article></section>
  <section class="content-section"><div class="section-heading"><div><h2>近期安排</h2><p>按预约时间排序的未结束面试</p></div><el-button link type="primary" @click="router.push('/admin/interviews')">查看全部</el-button></div>
    <el-table v-loading="loading" :data="upcoming" empty-text="暂无待处理面试"><el-table-column prop="title" label="面试主题" min-width="220" /><el-table-column label="预约时间" min-width="180"><template #default="{ row }">{{ row.scheduledAt.replace('T', ' ') }}</template></el-table-column><el-table-column prop="duration" label="时长" width="100"><template #default="{ row }">{{ row.duration }} 分钟</template></el-table-column><el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ statusLabel[row.status] }}</el-tag></template></el-table-column></el-table>
  </section>
</template>
