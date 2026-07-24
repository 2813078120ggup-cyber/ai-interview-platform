const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
export type Interview = { id:string; title:string; scheduledAt:string; duration:number; status:number; remark?:string }
export type PracticeBank = { id:string; name:string; description?:string; questionCount:string }
export async function request<T>(path:string, init:RequestInit = {}):Promise<T>{ const token=localStorage.getItem('access_token'); const response=await fetch(`${baseUrl}${path}`,{...init,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...init.headers}}); const body=await response.json().catch(()=>({})); if(!response.ok) throw new Error(body.message ?? '请求失败，请稍后重试'); return body.data as T }
