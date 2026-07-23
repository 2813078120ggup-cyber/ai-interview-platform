import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/* 请求拦截器 — 附加 JWT token */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* 响应拦截器 — 统一错误处理 */
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default http

/* ===== Auth API ===== */
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    realName: string
    email: string
    avatarUrl: string
    roles: string[]
  }
}

export const authApi = {
  login(params: LoginParams) {
    return http.post<LoginResult>('/auth/login', params)
  },
  getUserInfo() {
    return http.get<LoginResult['user']>('/auth/me')
  },
}
