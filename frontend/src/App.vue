<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Document, House, SwitchButton } from '@element-plus/icons-vue'
import { clearSession, isAdmin, profile, refreshToken } from '@/auth-session'
import { api } from '@/api'

const route = useRoute()
const router = useRouter()
const isLogin = computed(() => route.path === '/login')
const isRoom = computed(() => Boolean(route.meta.room))
async function logout() {
  const tokenToRevoke = refreshToken.value
  try {
    if (tokenToRevoke) await api.post('/v1/auth/logout', { refreshToken: tokenToRevoke })
  } catch {
    // Local sign-out must still succeed when the access token has already expired.
  } finally {
    clearSession()
    await router.replace('/login')
  }
}
</script>

<template>
  <RouterView v-if="isLogin || isRoom" />
  <el-container v-else-if="!isAdmin" class="candidate-shell">
    <header class="candidate-header"><div class="candidate-brand"><span class="brand-mark">M</span><span>智能面试平台</span></div><div class="candidate-actions"><span>我的 AI 面试</span><div class="avatar">{{ profile.realName?.slice(0, 1) ?? 'U' }}</div><el-button text @click="logout"><el-icon><SwitchButton /></el-icon>退出</el-button></div></header>
    <el-main class="candidate-main"><RouterView /></el-main>
  </el-container>
  <el-container v-else class="app-shell">
    <el-aside class="side-nav" width="220px">
      <div class="brand"><span class="brand-mark">M</span><div>多模态面试<small>评测平台</small></div></div>
      <el-menu :default-active="route.path" router background-color="transparent" text-color="#b9c3d4" active-text-color="#ffffff">
        <el-menu-item index="/admin"><el-icon><House /></el-icon><span>工作台</span></el-menu-item>
        <el-menu-item index="/admin/interviews"><el-icon><Calendar /></el-icon><span>面试管理</span></el-menu-item>
        <el-menu-item index="/admin/reports"><el-icon><Document /></el-icon><span>评测报告</span></el-menu-item>
      </el-menu>
      <div class="side-profile"><div class="avatar">{{ profile.realName?.slice(0, 1) ?? 'U' }}</div><div><strong>{{ profile.realName ?? '当前用户' }}</strong><small>{{ profile.roles?.join(' / ') ?? '未识别角色' }}</small></div><el-button text aria-label="退出登录" @click="logout"><el-icon><SwitchButton /></el-icon></el-button></div>
    </el-aside>
    <el-container><el-main><RouterView /></el-main></el-container>
  </el-container>
</template>
