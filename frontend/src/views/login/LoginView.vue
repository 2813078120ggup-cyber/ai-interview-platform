<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import AnimatedCharacters from '@/components/AnimatedCharacters.vue'
import InteractiveHoverButton from '@/components/InteractiveHoverButton.vue'

const router = useRouter()
const authStore = useAuthStore()

/* ===== Form State ===== */
const formRef = ref<FormInstance>()
const showPassword = ref(false)
const isTyping = ref(false)
const loginError = ref('')

const form = reactive({
  account: '',
  password: '',
  remember: false,
})

const rules: FormRules = {
  account: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
}

/* ===== Submit ===== */
const loading = ref(false)

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  loginError.value = ''
  try {
    await authStore.login({
      username: form.account,
      password: form.password,
    })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (err: any) {
    loginError.value = err.message || '用户名或密码错误，请重试。'
  } finally {
    loading.value = false
  }
}

/* ===== Google Sign-In (placeholder) ===== */
function handleGoogleSignIn() {
  ElMessage.info('Google 登录将在后续版本中支持')
}

function handleDemoLogin() {
  authStore.setAuth({
    token: 'demo-token',
    user: { id: 1, username: 'demo', realName: '体验用户', email: 'demo@example.com', avatarUrl: '', roles: ['CANDIDATE'] },
  })
  router.push('/dashboard')
}

/* ===== Form watching for animation ===== */
const passwordLength = computed(() => form.password.length)
</script>

<template>
  <div class="login-page">
    <!-- ====== Left: Branding + Animation ====== -->
    <div class="login-left">
      <div class="login-left__content">
        <!-- Logo -->
        <router-link to="/" class="login-left__logo">
          <div class="logo-icon">AI</div>
          <span>多模态智能模拟面试评测平台</span>
        </router-link>

        <!-- Animated Characters -->
        <div class="login-left__animation">
          <AnimatedCharacters
            :is-typing="isTyping"
            :show-password="showPassword"
            :password-length="passwordLength"
          />
        </div>

        <!-- Footer links -->
        <div class="login-left__links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="login-left__grid-bg" />
      <div class="login-left__blur login-left__blur--1" />
      <div class="login-left__blur login-left__blur--2" />
    </div>

    <!-- ====== Right: Login Form ====== -->
    <div class="login-right">
      <div class="login-card">
        <!-- Mobile Logo -->
        <div class="login-card__mobile-logo">
          <div class="logo-icon logo-icon--small">AI</div>
          <span>多模态智能模拟面试评测平台</span>
        </div>

        <!-- Header -->
        <div class="login-card__header">
          <h1>Welcome back!</h1>
          <p>Please enter your details</p>
        </div>

        <!-- Form -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="用户名 / 邮箱" prop="account">
            <el-input
              v-model="form.account"
              placeholder="请输入用户名或邮箱"
              autocomplete="off"
              @focus="isTyping = true"
              @blur="isTyping = false"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
            >
              <template #suffix>
                <button
                  type="button"
                  class="pwd-toggle"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="20" />
                  <Eye v-else :size="20" />
                </button>
              </template>
            </el-input>
          </el-form-item>

          <!-- Remember + Forgot -->
          <div class="form-extra">
            <el-checkbox v-model="form.remember">
              Remember for 30 days
            </el-checkbox>
            <router-link to="/forgot-password" class="forgot-link">
              Forgot password?
            </router-link>
          </div>

          <!-- Error message -->
          <div v-if="loginError" class="form-error">
            {{ loginError }}
          </div>

          <!-- Submit -->
          <InteractiveHoverButton
            :text="loading ? 'Signing in...' : 'Log in'"
            :loading="loading"
            @click="handleSubmit"
          />
        </el-form>

        <!-- Google Sign-In -->
        <div class="google-btn-wrap">
          <InteractiveHoverButton
            text="Log in with Google"
            @click="handleGoogleSignIn"
          >
            <template #icon>
              <svg class="google-icon" viewBox="0 0 488 512" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C322.3 113.2 289.4 96 248 96c-88.8 0-160.1 71.9-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"
                />
              </svg>
            </template>
          </InteractiveHoverButton>
        </div>

        <!-- Sign Up Link -->
        <div class="signup-link">
          Don't have an account?
          <router-link to="/signup">Sign Up</router-link>
        </div>

        <!-- Demo entry -->
        <div class="demo-divider">
          <span>快速体验</span>
        </div>
        <button class="demo-btn" @click="handleDemoLogin">
          演示登录 · 查看报告 Demo
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Layout ===== */
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

/* ===== Left Panel ===== */
.login-left {
  position: relative;
  display: none;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  background: linear-gradient(135deg, #9ca3af, #6b7280, #4b5563);
  color: #fff;
}

@media (min-width: 1024px) {
  .login-left {
    display: flex;
  }
}

.login-left__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
}

.login-left__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #fff;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.logo-icon--small {
  width: 28px;
  height: 28px;
}

.login-left__animation {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 500px;
}

.login-left__links {
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.2s;
}

.login-left__links a:hover {
  color: rgba(255, 255, 255, 0.9);
}

/* Decorative */
.login-left__grid-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

.login-left__blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
}

.login-left__blur--1 {
  top: 25%;
  right: 25%;
  width: 256px;
  height: 256px;
  background: rgba(156, 163, 175, 0.2);
}

.login-left__blur--2 {
  bottom: 25%;
  left: 25%;
  width: 384px;
  height: 384px;
  background: rgba(209, 213, 219, 0.2);
}

/* ===== Right Panel ===== */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #fff;
  height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-card__mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 3rem;
}

@media (min-width: 1024px) {
  .login-card__mobile-logo {
    display: none;
  }
}

.login-card__header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-card__header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
  color: hsl(var(--foreground));
}

.login-card__header p {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

/* ===== Form ===== */
:deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

:deep(.el-form-item__label) {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  padding-bottom: 0.375rem;
}

:deep(.el-input__wrapper) {
  height: 3rem;
  border-radius: var(--radius-full);
  border-color: hsl(var(--border) / 0.6);
  box-shadow: none;
  padding: 0 1rem;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary));
}

:deep(.el-input__inner) {
  font-size: 0.875rem;
  font-family: var(--font-family);
}

.password-field :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
}

.pwd-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  padding: 0;
  transition: color 0.2s;
}

.pwd-toggle:hover {
  color: hsl(var(--foreground));
}

.form-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

:deep(.el-checkbox__label) {
  font-size: 0.875rem;
  color: hsl(var(--foreground));
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
}

.forgot-link {
  font-size: 0.875rem;
  color: hsl(var(--primary));
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}

.form-error {
  padding: 0.75rem;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  border-radius: 0.5rem;
}

/* Google button */
.google-btn-wrap {
  margin-top: 1.5rem;
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Sign up */
.signup-link {
  text-align: center;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-top: 2rem;
}

.signup-link a {
  color: hsl(var(--foreground));
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* ===== Demo Entry ===== */
.demo-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.demo-divider::before,
.demo-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: hsl(var(--border));
}

.demo-divider span {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.demo-btn {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px dashed hsl(var(--primary) / 0.4);
  border-radius: var(--radius-full);
  background: hsl(var(--primary) / 0.04);
  color: hsl(var(--primary));
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.demo-btn:hover {
  background: hsl(var(--primary) / 0.08);
  border-color: hsl(var(--primary));
}
</style>
