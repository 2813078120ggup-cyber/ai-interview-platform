import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
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

/* 响应拦截器 — 统一解包 ApiResult.data，统一错误处理 */
http.interceptors.response.use(
  (res) => {
    const body = res.data
    // If response wraps with ApiResult {code, message, data}, unwrap it
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      if (body.code >= 200 && body.code < 300) {
        res.data = body.data
      } else {
        return Promise.reject(new Error(body.message || '请求失败'))
      }
    }
    return res
  },
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
  },
}

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

export interface RegisterParams {
  username: string
  password: string
  realName: string
  email?: string
}

export const authApi = {
  login(params: LoginParams) {
    return http.post<LoginResult>('/auth/login', params)
  },
  register(params: RegisterParams) {
    return http.post<LoginResult>('/auth/register', params)
  },
  getUserInfo() {
    return http.get<LoginResult['user']>('/auth/me')
  },
}

/* ===== Interview API ===== */
export interface InterviewVO {
  id: number
  title: string
  candidateId: number
  candidateName: string
  interviewerId: number
  interviewerName: string
  scheduledAt: string
  duration: number
  startedAt: string | null
  endedAt: string | null
  status: number
  statusText: string
  type: string
  meetingUrl: string
  remark: string
  createdBy: number
  createdAt: string
}

export interface CreateInterviewParams {
  title: string
  candidateId: number
  interviewerId: number
  scheduledAt: string
  duration: number
  type: string
  meetingUrl?: string
  remark?: string
  questionIds: number[]
}

export const interviewApi = {
  create(params: CreateInterviewParams) {
    return http.post<InterviewVO>('/interviews', params)
  },
  update(id: number, params: any) {
    return http.put<InterviewVO>(`/interviews/${id}`, params)
  },
  cancel(id: number, reason: string) {
    return http.put(`/interviews/${id}/cancel`, { reason })
  },
  markAbsent(id: number) {
    return http.put(`/interviews/${id}/absent`)
  },
  list(params: { status?: number; page?: number; size?: number }) {
    return http.get<{ records: InterviewVO[]; total: number }>('/interviews', { params })
  },
  getDetail(id: number) {
    return http.get<InterviewVO>(`/interviews/${id}`)
  },
}

/* ===== Interview Room API ===== */
export interface InterviewQuestion {
  id: number
  interviewId: number
  questionId: number
  sequenceNo: number
  maxScore: number
  questionSnapshot: string
}

export interface InterviewAnswer {
  id: number
  interviewQuestionId: number
  answerContent: string
  answerData: string
  audioUrl: string
  durationSeconds: number
  answeredAt: string
}

export const interviewRoomApi = {
  start(interviewId: number) {
    return http.put<InterviewQuestion[]>(`/interview-room/${interviewId}/start`)
  },
  end(interviewId: number) {
    return http.put(`/interview-room/${interviewId}/end`)
  },
  submitAnswer(interviewQuestionId: number, params: {
    answerContent: string
    answerData?: string
    audioUrl?: string
    durationSeconds?: number
  }) {
    return http.post<InterviewAnswer>(`/interview-room/questions/${interviewQuestionId}/answer`, params)
  },
  getQuestions(interviewId: number) {
    return http.get<InterviewQuestion[]>(`/interview-room/${interviewId}/questions`)
  },
  getAnswers(interviewId: number) {
    return http.get<InterviewAnswer[]>(`/interview-room/${interviewId}/answers`)
  },
}

/* ===== Question API ===== */
export interface QuestionBank {
  id: number
  bankCode: string
  name: string
  description: string
  visibility: number
  status: number
}

export interface QuestionVO {
  id: number
  bankId: number
  bankName: string
  questionType: string
  difficulty: number
  content: string
  options: string
  answerTemplate: string
  explanation: string
  tags: string
  score: number
  sortOrder: number
  status: number
  createdAt: string
}

export const questionApi = {
  // Banks
  createBank(params: { bankCode: string; name: string; description?: string; visibility: number }) {
    return http.post<QuestionBank>('/questions/banks', params)
  },
  updateBank(id: number, params: any) {
    return http.put<QuestionBank>(`/questions/banks/${id}`, params)
  },
  listBanks() {
    return http.get<QuestionBank[]>('/questions/banks')
  },
  deleteBank(id: number) {
    return http.delete(`/questions/banks/${id}`)
  },
  // Questions
  create(params: any) {
    return http.post<QuestionVO>('/questions', params)
  },
  update(id: number, params: any) {
    return http.put<QuestionVO>(`/questions/${id}`, params)
  },
  list(params: any) {
    return http.get<{ records: QuestionVO[]; total: number }>('/questions', { params })
  },
  getById(id: number) {
    return http.get<QuestionVO>(`/questions/${id}`)
  },
  updateStatus(id: number, status: number) {
    return http.put(`/questions/${id}/status?status=${status}`)
  },
  delete(id: number) {
    return http.delete(`/questions/${id}`)
  },
}

/* ===== Report API ===== */
export interface ReportVO {
  id: number
  interviewId: number
  interviewTitle: string
  candidateName: string
  totalScore: number
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
  summary: string
  strengths: string
  weaknesses: string
  improvementSuggestions: string
  generationMethod: string
  published: number
  pdfUrl: string
  generatedAt: string
}

export const reportApi = {
  generate(interviewId: number) {
    return http.post<ReportVO>(`/reports/generate/${interviewId}`)
  },
  publish(interviewId: number) {
    return http.put<ReportVO>(`/reports/publish/${interviewId}`)
  },
  getByInterview(interviewId: number) {
    return http.get<ReportVO>(`/reports/interview/${interviewId}`)
  },
  getById(id: number) {
    return http.get<ReportVO>(`/reports/${id}`)
  },
  list() {
    return http.get<ReportVO[]>('/reports')
  },
}

/* ===== Evaluation API ===== */
export interface EvaluationVO {
  id: number
  interviewQuestionId: number
  evaluatorId: number
  evaluatorName: string
  source: string
  professionalScore: number
  expressionScore: number
  logicScore: number
  adaptabilityScore: number
  overallScore: number
  comment: string
  status: number
}

export const evaluationApi = {
  submitHuman(interviewQuestionId: number, params: any) {
    return http.post<EvaluationVO>(`/evaluations/human/${interviewQuestionId}`, params)
  },
  listByInterview(interviewId: number) {
    return http.get<EvaluationVO[]>(`/evaluations/interview/${interviewId}`)
  },
  confirm(evaluationId: number) {
    return http.put(`/evaluations/${evaluationId}/confirm`)
  },
}

/* ===== User API ===== */
export interface UserVO {
  id: number
  username: string
  realName: string
  email: string
  phone: string
  avatarUrl: string
  status: number
  roles: string[]
  createdAt: string
}

export const userApi = {
  list(params: { page?: number; size?: number; keyword?: string; status?: number }) {
    return http.get<{ records: UserVO[]; total: number }>('/users', { params })
  },
  getById(id: number) {
    return http.get<UserVO>(`/users/${id}`)
  },
}

/* ===== Admin API (user management) ===== */
export interface RoleVO {
  id: number
  roleCode: string
  roleName: string
  description: string
  status: number
}

export const adminApi = {
  // Users
  listUsers(params: { page?: number; size?: number; keyword?: string; status?: number }) {
    return http.get<{ records: UserVO[]; total: number }>('/admin/users', { params })
  },
  getUser(id: number) {
    return http.get<UserVO>(`/admin/users/${id}`)
  },
  updateUser(id: number, params: { realName?: string; email?: string; phone?: string; avatarUrl?: string }) {
    return http.put<void>(`/admin/users/${id}`, params)
  },
  updateStatus(id: number, status: number) {
    return http.put<void>(`/admin/users/${id}/status?status=${status}`)
  },
  assignRoles(id: number, roleIds: number[]) {
    return http.put<void>(`/admin/users/${id}/roles`, { roleIds })
  },
  deleteUser(id: number) {
    return http.delete<void>(`/admin/users/${id}`)
  },
  // Roles
  listRoles() {
    return http.get<RoleVO[]>('/admin/roles')
  },
}
