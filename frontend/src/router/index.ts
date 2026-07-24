import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  // Interview
  {
    path: '/interview/create',
    name: 'InterviewCreate',
    component: () => import('@/views/interview/InterviewCreateView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/interview/:id',
    name: 'InterviewRoom',
    component: () => import('@/views/interview/InterviewRoomView.vue'),
    meta: { requiresAuth: true },
  },
  // Questions
  {
    path: '/questions',
    name: 'QuestionManage',
    component: () => import('@/views/question/QuestionManageView.vue'),
    meta: { requiresAuth: true },
  },
  // Reports
  {
    path: '/report/:id?',
    name: 'Report',
    component: () => import('@/views/ReportView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/report/interview/:interviewId',
    name: 'ReportByInterview',
    component: () => import('@/views/ReportView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
