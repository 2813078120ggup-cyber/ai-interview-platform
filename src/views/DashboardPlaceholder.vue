<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FileText, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
  <div class="dash-page">
    <header class="dash-header">
      <span class="dash-logo">多模态智能模拟面试评测平台</span>
      <button class="dash-logout" @click="auth.logout(); router.push('/login')">
        <LogOut :size="16" />
        退出
      </button>
    </header>

    <main class="dash-main">
      <h1>欢迎回来 👋</h1>
      <p class="dash-sub">这是演示仪表盘，后端功能开发中。</p>

      <div class="dash-cards">
        <div class="dash-card" @click="router.push('/report/1')">
          <FileText :size="28" class="dash-card__icon" />
          <div>
            <h3>查看面试报告</h3>
            <p>张三 · 高级前端工程师 · 综合 82.5 分</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dash-page {
  min-height: 100vh;
  background: hsl(var(--background));
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid hsl(var(--border));
}

.dash-logo {
  font-weight: 700;
  font-size: 1rem;
  color: hsl(var(--primary));
}

.dash-logout {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  background: #fff;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font-size: 0.8125rem;
  font-family: var(--font-family);
}
.dash-logout:hover {
  color: hsl(var(--foreground));
}

.dash-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.dash-main h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.375rem;
}

.dash-sub {
  color: hsl(var(--muted-foreground));
  margin-bottom: 2rem;
}

.dash-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dash-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.dash-card:hover {
  border-color: hsl(var(--primary));
  box-shadow: 0 2px 12px hsl(231 48% 48% / 0.1);
}

.dash-card__icon {
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.dash-card h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.125rem;
}

.dash-card p {
  font-size: 0.8125rem;
  color: hsl(var(--muted-foreground));
}
</style>
