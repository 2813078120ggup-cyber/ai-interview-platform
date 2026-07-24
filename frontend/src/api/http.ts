import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000
})

export const api = {
  async get<T>(url: string, config?: Parameters<typeof http.get>[1]) {
    const response = await http.get<T>(url, config)
    return response.data
  },
  async post<T>(url: string, data?: unknown, config?: Parameters<typeof http.post>[2]) {
    const response = await http.post<T>(url, data, config)
    return response.data
  },
  async put<T>(url: string, data?: unknown, config?: Parameters<typeof http.put>[2]) {
    const response = await http.put<T>(url, data, config)
    return response.data
  },
  async delete<T>(url: string, config?: Parameters<typeof http.delete>[1]) {
    const response = await http.delete<T>(url, config)
    return response.data
  }
}
