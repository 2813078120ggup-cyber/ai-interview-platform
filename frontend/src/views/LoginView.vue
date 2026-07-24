<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { clearSession, establishSession } from '@/auth-session'

const router = useRouter()
const mode = ref<'login' | 'register'>('login')
const busy = ref(false)
const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', realName: '', email: '', phone: '' })

// Reaching this page intentionally starts an account switch.
onMounted(clearSession)

async function submitLogin() {
  busy.value = true
  try {
    const result: any = await api.post<any>('/v1/auth/login', loginForm)
    establishSession(result)
    const roles: string[] = result.user?.roles ?? []
    await router.replace(roles.includes('ADMIN') ? '/admin' : '/candidate/interviews')
  } catch (error: any) { ElMessage.error(error.message) } finally { busy.value = false }
}
async function submitRegister() {
  busy.value = true
  try {
    await api.post('/v1/auth/register', registerForm)
    ElMessage.success('注册成功，请登录')
    loginForm.username = registerForm.username; loginForm.password = registerForm.password; mode.value = 'login'
  } catch (error: any) { ElMessage.error(error.message) } finally { busy.value = false }
}
</script>

<template>
  <main class="login-page">
    <section class="login-intro"><div class="intro-brand"><span class="brand-mark">M</span> 多模态面试评测平台</div><h1>让每一次面试<br />都有清晰的成长坐标</h1><p>整合文本、语音与视频信号，完成模拟面试、结构化评估和可行动的反馈。</p><div class="signal-grid"><span>语音识别</span><span>行为分析</span><span>智能评测</span></div></section>
    <section class="login-panel"><div class="login-card"><h2>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2><p>{{ mode === 'login' ? '登录后继续你的面试流程' : '新账号默认注册为候选人' }}</p>
      <el-form v-if="mode === 'login'" label-position="top" @submit.prevent="submitLogin"><el-form-item label="用户名"><el-input v-model="loginForm.username" autocomplete="username" /></el-form-item><el-form-item label="密码"><el-input v-model="loginForm.password" type="password" show-password autocomplete="current-password" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy" class="full-button">登录</el-button></el-form>
      <el-form v-else label-position="top" @submit.prevent="submitRegister"><el-form-item label="姓名"><el-input v-model="registerForm.realName" /></el-form-item><el-form-item label="用户名"><el-input v-model="registerForm.username" /></el-form-item><el-form-item label="密码"><el-input v-model="registerForm.password" type="password" show-password /></el-form-item><el-form-item label="邮箱"><el-input v-model="registerForm.email" /></el-form-item><el-button type="primary" native-type="submit" :loading="busy" class="full-button">注册</el-button></el-form>
      <el-button link type="primary" class="mode-switch" @click="mode = mode === 'login' ? 'register' : 'login'">{{ mode === 'login' ? '没有账号？创建账号' : '已有账号？去登录' }}</el-button>
    </div></section>
  </main>
</template>
