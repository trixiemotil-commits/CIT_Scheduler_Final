import { isLoggedIn, getUser } from '@/auth.js'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import TeacherDashboardView from '@/views/teacher/TeacherDashboardView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import LoginView from '@/views/LoginView.vue'
import NewScheduleWeekView from '@/views/admin/NewScheduleWeekView.vue'
import ScheduleView from '@/views/admin/ScheduleView.vue'
import EventsView from '@/views/admin/EventsView.vue'
import TeacherAssignmentsView from '@/views/admin/TeacherAssignmentsView.vue'
import UserManagementView from '@/views/admin/UserManagementView.vue'
import SettingsView from '@/views/admin/SettingsView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
    { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboardView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/schedule', name: 'admin-schedule', component: ScheduleView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/schedule/new-week', name: 'new-schedule-week', component: NewScheduleWeekView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/teachers', name: 'admin-teachers', component: TeacherAssignmentsView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/events', name: 'admin-events', component: EventsView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/users', name: 'admin-users', component: UserManagementView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/settings', name: 'admin-settings', component: SettingsView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/teacher/dashboard', name: 'teacher-dashboard', component: TeacherDashboardView, meta: { requiresAuth: true, role: 'teacher' } },
  ]
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/')
  } else if (to.meta.role && getUser()?.role !== to.meta.role) {
    const role = getUser()?.role
    if (role === 'teacher') next('/teacher/dashboard')
    else if (role === 'admin') next('/admin/dashboard')
    else next('/')
  } else {
    next()
  }
})

export default router
