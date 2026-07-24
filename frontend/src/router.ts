import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import AdminInterviewsView from './views/AdminInterviewsView.vue'
import CandidateInterviewsView from './views/CandidateInterviewsView.vue'
import LoginView from './views/LoginView.vue'
import ReportsView from './views/ReportsView.vue'
import InterviewRoomView from './views/InterviewRoomView.vue'
import CandidateReportView from './views/CandidateReportView.vue'
import CandidateAbilityDashboardView from './views/CandidateAbilityDashboardView.vue'
import { isAdmin, isAuthenticated } from './auth-session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/', redirect: '/admin' },
    { path: '/admin', component: DashboardView, meta: { admin: true } },
    { path: '/admin/interviews', component: AdminInterviewsView, meta: { admin: true } },
    { path: '/admin/interviews/:id/room', component: InterviewRoomView, meta: { room: true, admin: true } },
    { path: '/admin/reports', component: ReportsView, meta: { admin: true } },
    { path: '/candidate/interviews', component: CandidateInterviewsView, meta: { candidate: true } },
    { path: '/candidate/interviews/:id/room', component: InterviewRoomView, meta: { room: true, candidate: true } },
    { path: '/candidate/interviews/:id/report', component: CandidateReportView, meta: { candidate: true } },
    { path: '/candidate/reports', component: CandidateAbilityDashboardView, meta: { candidate: true } },
    { path: '/interviews', redirect: '/candidate/interviews' },
    { path: '/interviews/:id/room', redirect: to => `/candidate/interviews/${to.params.id}/room` },
    { path: '/reports', redirect: '/admin/reports' }
  ]
})
router.beforeEach((to) => {
  if (!to.meta.public && !isAuthenticated.value) return '/login'
  // Keep the login page reachable: opening it is an explicit account-switch action.
  if (to.path === '/login') return
  if (isAdmin.value && (to.path === '/' || to.meta.candidate)) return '/admin'
  if (!isAdmin.value && (to.path === '/' || to.meta.admin)) return '/candidate/interviews'
})
export default router
