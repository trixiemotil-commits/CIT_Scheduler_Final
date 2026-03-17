import { getUser, isLoggedIn } from '@/auth.js'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import LoginView from '@/views/LoginView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminProfileView from '@/views/admin/AdminProfileView.vue'
import EventsView from '@/views/admin/EventsView.vue'
import NewScheduleWeekView from '@/views/admin/NewScheduleWeekView.vue'
import ScheduleView from '@/views/admin/ScheduleView.vue'
import SettingsView from '@/views/admin/SettingsView.vue'
import TeacherAssignmentsView from '@/views/admin/TeacherAssignmentsView.vue'
import UserManagementView from '@/views/admin/UserManagementView.vue'
import StudentConsultationsView from '@/views/student/StudentConsultationsView.vue'
import StudentDashboardView from '@/views/student/StudentDashboardView.vue'
import StudentNotificationsView from '@/views/student/StudentNotificationsView.vue'
import StudentProfileView from '@/views/student/StudentProfileView.vue'
import StudentSettingsView from '@/views/student/StudentSettingsView.vue'
import StudentTeachersView from '@/views/student/StudentTeachersView.vue'
import TeacherConsultationView from '@/views/teacher/TeacherConsultationView.vue'
import TeacherDashboardView from '@/views/teacher/TeacherDashboardView.vue'
import TeacherEventsView from '@/views/teacher/TeacherEventsView.vue'
import TeacherProfileView from '@/views/teacher/TeacherProfileView.vue'
import TeacherScheduleView from '@/views/teacher/TeacherScheduleView.vue'
import TeacherSettingsView from '@/views/teacher/TeacherSettingsView.vue'
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
    { path: '/admin/profile',  name: 'admin-profile',  component: AdminProfileView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/teacher/dashboard', name: 'teacher-dashboard', component: TeacherDashboardView, meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/teacher/schedule',      name: 'teacher-schedule',      component: TeacherScheduleView,      meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/teacher/events',        name: 'teacher-events',        component: TeacherEventsView,        meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/teacher/consultation',  name: 'teacher-consultation',  component: TeacherConsultationView,  meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/teacher/settings',      name: 'teacher-settings',      component: TeacherSettingsView,      meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/teacher/profile',       name: 'teacher-profile',       component: TeacherProfileView,       meta: { requiresAuth: true, role: 'teacher' } },
    { path: '/student/dashboard',     name: 'student-dashboard',     component: StudentDashboardView,     meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/teachers',      name: 'student-teachers',      component: StudentTeachersView,      meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/consultations', name: 'student-consultations', component: StudentConsultationsView, meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/profile',       name: 'student-profile',       component: StudentProfileView,       meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/settings',      name: 'student-settings',      component: StudentSettingsView,      meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/notifications', name: 'student-notifications', component: StudentNotificationsView, meta: { requiresAuth: true, role: 'student' } },
  ]
})

router.beforeEach((to, _from, next) => {
  const role = (getUser()?.role || '').toString().toLowerCase()

  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/')
  } else if (to.meta.role && role !== String(to.meta.role).toLowerCase()) {
    if (role === 'teacher') next('/teacher/dashboard')
    else if (role === 'admin') next('/admin/dashboard')
    else if (role === 'student') next('/student/dashboard')
    else next('/')
  } else {
    next()
  }
})

export default router
