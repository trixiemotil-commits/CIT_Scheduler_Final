import { getToken, getUser, isLoggedIn, setActiveRole } from '@/auth.js'
const ForgotPasswordView = () => import('@/views/ForgotPasswordView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const AddScheduleView = () => import('@/views/admin/AddScheduleView.vue')
const AcademicTermsView = () => import('@/views/admin/AcademicTermsView.vue')
const AdminDashboardView = () => import('@/views/admin/AdminDashboardView.vue')
const ActivityLogsView = () => import('@/views/admin/ActivityLogsView.vue')
const AdminProfileView = () => import('@/views/admin/AdminProfileView.vue')
const EventsView = () => import('@/views/admin/EventsView.vue')
const NewScheduleWeekView = () => import('@/views/admin/NewScheduleWeekView.vue')
const ScheduleView = () => import('@/views/admin/ScheduleView.vue')
const SettingsView = () => import('@/views/admin/SettingsView.vue')
const TeacherAssignmentsView = () => import('@/views/admin/TeacherAssignmentsView.vue')
const UserManagementView = () => import('@/views/admin/UserManagementView.vue')
const ViewScheduleView = () => import('@/views/admin/ViewScheduleView.vue')
const StudentConsultationsView = () => import('@/views/student/StudentConsultationsView.vue')
const StudentChangePasswordView = () => import('@/views/student/StudentChangePasswordView.vue')
const StudentDashboardView = () => import('@/views/student/StudentDashboardView.vue')
const StudentEventsView = () => import('@/views/student/StudentEventsView.vue')
const StudentFaqsView = () => import('@/views/student/StudentFaqsView.vue')
const StudentNotificationsView = () => import('@/views/student/StudentNotificationsView.vue')
const StudentProfileView = () => import('@/views/student/StudentProfileView.vue')
const StudentSettingsView = () => import('@/views/student/StudentSettingsView.vue')
const StudentTeachersView = () => import('@/views/student/StudentTeachersView.vue')
const StudentTabsView = () => import('@/views/student/StudentTabsView.vue')
const TeacherConsultationView = () => import('@/views/teacher/TeacherConsultationView.vue')
const TeacherDashboardView = () => import('@/views/teacher/TeacherDashboardView.vue')
const TeacherEventsView = () => import('@/views/teacher/TeacherEventsView.vue')
const TeacherProfileView = () => import('@/views/teacher/TeacherProfileView.vue')
const TeacherScheduleView = () => import('@/views/teacher/TeacherScheduleView.vue')
const TeacherSettingsView = () => import('@/views/teacher/TeacherSettingsView.vue')
import { createRouter, createWebHistory } from '@ionic/vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
    { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboardView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/activity-logs', name: 'admin-activity-logs', component: ActivityLogsView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/schedule', name: 'admin-schedule', component: ScheduleView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/schedule/view', name: 'admin-schedule-view', component: ViewScheduleView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/schedule/add', name: 'admin-schedule-add', component: AddScheduleView, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/academic-terms', name: 'admin-academic-terms', component: AcademicTermsView, meta: { requiresAuth: true, role: 'admin' } },
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
    {
      path: '/student',
      component: StudentTabsView,
      meta: { requiresAuth: true, role: 'student' },
      children: [
        { path: '', redirect: '/student/dashboard' },
        { path: 'dashboard',     name: 'student-dashboard',     component: StudentDashboardView },
        { path: 'teachers',      name: 'student-teachers',      component: StudentTeachersView },
        { path: 'events',        name: 'student-events',        component: StudentEventsView },
        { path: 'consultations', name: 'student-consultations', component: StudentConsultationsView },
        { path: 'profile',       name: 'student-profile',       component: StudentProfileView },
        { path: 'change-password', name: 'student-change-password', component: StudentChangePasswordView },
        { path: 'faqs',          name: 'student-faqs',          component: StudentFaqsView },
        { path: 'settings',      name: 'student-settings',      component: StudentSettingsView },
        { path: 'notifications', name: 'student-notifications', component: StudentNotificationsView },
      ],
    },
  ]
})

router.beforeEach((to, _from, next) => {
  const user = getUser()
  let role = (user?.role || '').toString().toLowerCase()
  const requiredRole = to.meta.role ? String(to.meta.role).toLowerCase() : ''
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [role].filter(Boolean)
  const canUseRequiredRole = requiredRole && roles.map(item => String(item).toLowerCase()).includes(requiredRole)

  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/')
  } else if (requiredRole && role !== requiredRole && canUseRequiredRole) {
    setActiveRole(requiredRole)
    next()
  } else if (requiredRole && role !== requiredRole) {
    if (role === 'teacher') next('/teacher/dashboard')
    else if (role === 'admin') next('/admin/dashboard')
    else if (role === 'student') next('/student/dashboard')
    else next('/')
  } else {
    next()
  }
})

const activityRouteLabels = {
  '/teacher/dashboard': 'Teacher Dashboard',
  '/teacher/schedule': 'Teacher Schedule',
  '/teacher/events': 'Teacher Events',
  '/teacher/consultation': 'Teacher Consultation',
  '/teacher/settings': 'Teacher Settings',
  '/teacher/profile': 'Teacher Profile',
  '/student/dashboard': 'Student Dashboard',
  '/student/teachers': 'Student Teachers',
  '/student/events': 'Student Events',
  '/student/consultations': 'Student Consultations',
  '/student/profile': 'Student Profile',
  '/student/settings': 'Student Settings',
  '/student/notifications': 'Student Notifications',
}

router.afterEach((to) => {
  const currentUser = getUser()
  const role = String(currentUser?.role || '').toLowerCase()
  const token = getToken()
  const routeLabel = activityRouteLabels[to.path]
  if (!token || !routeLabel || !['teacher', 'student'].includes(role)) return

  fetch(`${API_BASE}/activity-logs/navigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ routeLabel, routePath: to.path }),
  }).catch(() => {})
})

export default router
