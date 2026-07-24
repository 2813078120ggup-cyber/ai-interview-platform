import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { LoginParams, LoginResult } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<LoginResult['user'] | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(result: LoginResult) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
  }

  function restoreAuth() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        logout()
      }
    }
  }

  async function login(params: LoginParams) {
    loading.value = true
    error.value = ''
    try {
      const res = await authApi.login(params)
      setAuth(res.data)
      return res.data
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请检查用户名和密码。'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, loading, error, isLoggedIn, login, logout, restoreAuth, setAuth }
})
