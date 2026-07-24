import axios from 'axios'
import { accessToken, clearSession } from '@/auth-session'

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api', timeout: 10000 })
client.interceptors.request.use((config) => {
  const token = accessToken.value
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) clearSession()
    return Promise.reject(new Error(error.response?.data?.message ?? '请求失败，请检查服务连接'))
  }
)

export const api = {
  get: <T>(url: string) => client.get<{ data: T }>(url).then(response => response.data.data),
  post: <T>(url: string, data?: unknown) => client.post<{ data: T }>(url, data).then(response => response.data.data),
  put: <T>(url: string, data?: unknown) => client.put<{ data: T }>(url, data).then(response => response.data.data)
}

export interface Interview {
  id: string; title: string; candidateId: string; interviewerId: string; scheduledAt: string; duration: number; status: number; type: string; meetingUrl?: string; remark?: string
}

export const statusLabel: Record<number, string> = { 0: '待开始', 1: '进行中', 2: '已结束', 3: '已取消' }
