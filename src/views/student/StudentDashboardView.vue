<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshDashboard" />
      <div class="mobile-app">
    <div v-if="isInitialLoading" class="dashboard-skeleton" role="status" aria-label="Loading student dashboard">
      <span class="sr-only">Loading student dashboard…</span>
      <div class="skeleton-header">
        <span class="skeleton-block skeleton-avatar"></span>
        <span class="skeleton-heading"><i class="skeleton-block"></i><i class="skeleton-block"></i></span>
        <span class="skeleton-block skeleton-notification"></span>
      </div>
      <div class="skeleton-kicker skeleton-block"></div>
      <div class="stats-grid skeleton-stats" aria-hidden="true">
        <div v-for="item in 4" :key="`stat-${item}`" class="stat-card skeleton-card"><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i></div>
      </div>
      <section class="section-card skeleton-section" aria-hidden="true">
        <i class="skeleton-kicker skeleton-block"></i>
        <i class="skeleton-block skeleton-title"></i>
        <div class="skeleton-count-grid"><i v-for="item in 4" :key="`count-${item}`" class="skeleton-block"></i></div>
        <div v-for="item in 2" :key="`consult-${item}`" class="skeleton-row"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>
      </section>
      <div class="cta-row skeleton-ctas" aria-hidden="true"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>
      <section class="section-card skeleton-section skeleton-events" aria-hidden="true">
        <i class="skeleton-block skeleton-title"></i>
        <div v-for="item in 2" :key="`event-${item}`" class="skeleton-row"><i class="skeleton-block"></i></div>
      </section>
    </div>
    <template v-else>
    <!-- Header -->
    <div class="app-header">
      <div class="header-left">
        <button type="button" class="avatar-sm" @click="$router.push('/student/profile')" aria-label="Open profile page">
          <img v-if="user.avatar" :src="user.avatar" alt="Profile picture" />
          <span v-else>{{ initials }}</span>
        </button>
        <div>
          <div class="header-title">Student Dashboard</div>
          <div class="header-sub">{{ user.name }}</div>
        </div>
      </div>
      <button class="header-notif-btn" @click="$router.push('/student/notifications')" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span v-if="unreadCount > 0" class="notif-dot" :aria-label="`${unreadCount} unread notifications`">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <button type="button" class="stat-card green" @click="$router.push('/student/teachers')">
        <span class="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h16M6 19V6l6-3 6 3v13M9 19v-4h6v4M8 9h1M15 9h1M8 12h1M15 12h1" /></svg></span>
        <span class="stat-label">On School</span>
        <span class="stat-num">{{ teacherStats.inSchool }}</span>
        <span class="stat-desc">teachers on campus</span>
      </button>
      <button type="button" class="stat-card red" @click="$router.push('/student/teachers')">
        <span class="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3" /><path d="M5 20a7 7 0 0 1 14 0M16 4l4 4M20 4l-4 4" /></svg></span>
        <span class="stat-label">On Leave</span>
        <span class="stat-num">{{ teacherStats.onLeave }}</span>
        <span class="stat-desc">teachers on leave</span>
      </button>
      <button type="button" class="stat-card blue" @click="$router.push('/student/teachers')">
        <span class="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="m8 12 2.5 2.5L16 9" /></svg></span>
        <span class="stat-label">Available Teacher</span>
        <span class="stat-num">{{ teacherStats.available }}</span>
        <span class="stat-desc">ready for consultation</span>
      </button>
      <button type="button" class="stat-card orange" @click="$router.push('/student/teachers')">
        <span class="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M8 8l8 8M16 8l-8 8" /></svg></span>
        <span class="stat-label">Not Available</span>
        <span class="stat-num">{{ teacherStats.notAvailable }}</span>
        <span class="stat-desc">not accepting requests</span>
      </button>
    </div>

    <!-- Recent Consultations -->
    <div class="section-card">
      <div class="consultations-heading">
        <div class="section-title">Recent Consultations</div>
        <div class="consultation-counts" aria-label="Consultation status counts">
          <div class="consultation-count-card count-approved">
            <span class="count-icon" aria-hidden="true">✓</span>
            <span class="count-text"><span class="count-label">Approved</span><strong>{{ consultationStatusCounts.approved }}</strong></span>
          </div>
          <div class="consultation-count-card count-pending">
            <span class="count-icon" aria-hidden="true">◷</span>
            <span class="count-text"><span class="count-label">Pending</span><strong>{{ consultationStatusCounts.pending }}</strong></span>
          </div>
          <div class="consultation-count-card count-reschedule">
            <span class="count-icon" aria-hidden="true">↻</span>
            <span class="count-text"><span class="count-label">Reschedule</span><strong>{{ consultationStatusCounts.reschedule }}</strong></span>
          </div>
          <div class="consultation-count-card count-completed">
            <span class="count-icon" aria-hidden="true">✓</span>
            <span class="count-text"><span class="count-label">Completed</span><strong>{{ consultationStatusCounts.completed }}</strong></span>
          </div>
        </div>
      </div>
      <div v-for="c in recentConsultations" :key="c.id" class="consult-row">
        <div class="consult-info">
          <div class="consult-name">{{ c.subject }}</div>
          <div class="consult-teacher">{{ c.teacher }} · {{ formatDate(c.date) }}</div>
        </div>
        <span :class="['consult-status-card', badgeClass(c.status)]">{{ displayStatus(c.status) }}</span>
      </div>
    </div>

    <!-- CTA Buttons -->
    <div class="cta-row">
      <button class="cta-btn primary" @click="$router.push('/student/teachers')">Browse Teachers</button>
      <button class="cta-btn secondary" @click="$router.push('/student/consultations')">My Sessions</button>
    </div>
    <div class="section-card events-card">
      <div class="section-title">Recent Events</div>
      <div v-for="event in recentEvents" :key="event.id" class="consult-row">
        <div class="consult-info">
          <div class="consult-name">{{ event.title }}</div>
          <div class="consult-teacher">{{ event.date }} · {{ event.location }}</div>
        </div>
      </div>
      <button class="view-events-btn" @click="$router.push('/student/events')">View All Events</button>
    </div>
    </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken, getUser } from '@/auth.js'
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import useNotifications from '@/composables/useNotifications.js'
import { useStudentData } from '@/composables/useStudentData.js'
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const user     = getUser() || { name: 'Anna Cooper', email: 'student@gmail.com' }
const initials = computed(() => user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const { sessions, loadSessions } = useStudentData()
const teachers = ref([])
const isInitialLoading = ref(true)

const teacherStats = computed(() => {
  const list = teachers.value
  const isOnSchool = (teacher) => ['on school', 'in school'].includes(String(teacher.status || '').trim().toLowerCase())
  const isAvailable = (teacher) => isOnSchool(teacher) && teacher.available === true
  return {
    inSchool: list.filter(isOnSchool).length,
    onLeave: list.filter((teacher) => String(teacher.status || '').trim().toLowerCase() === 'on leave').length,
    available: list.filter(isAvailable).length,
    notAvailable: list.filter((teacher) => !isAvailable(teacher)).length,
  }
})

async function loadTeachers() {
  try {
    const payload = await apiRequest(`/consultations/teachers?updatedAt=${Date.now()}`, { cache: 'no-store' })
    teachers.value = Array.isArray(payload.teachers) ? payload.teachers : []
  } catch (_error) {
    teachers.value = []
  }
}

async function refreshDashboard() {
  await Promise.all([loadSessions(true), loadTeachers()])
}

const recentConsultations = computed(() =>
  [...sessions.value]
    .sort((a, b) => {
      const createdAtA = Date.parse(a.createdAt || a.date || '') || 0
      const createdAtB = Date.parse(b.createdAt || b.date || '') || 0
      return createdAtB - createdAtA
    })
    .slice(0, 4)
)
const consultationStatusCounts = computed(() => {
  const counts = { approved: 0, pending: 0, reschedule: 0, completed: 0 }
  sessions.value.forEach((session) => {
    const status = displayStatus(session.status)
    if (status === 'Approved') counts.approved += 1
    else if (status === 'Pending') counts.pending += 1
    else if (status === 'Reschedule') counts.reschedule += 1
    else if (status === 'Completed') counts.completed += 1
  })
  return counts
})

onMounted(() => {
  Promise.all([loadSessions(), loadTeachers(), loadRecentEvents()])
    .finally(() => { isInitialLoading.value = false })
  useNotifications.addNotificationListener(handleNotification)
})

onIonViewWillEnter(() => {
  loadNotifications()
})

onUnmounted(() => {
  useNotifications.removeNotificationListener(handleNotification)
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const unreadCount = ref(0)
const recentEvents = ref([])

function handleNotification(notification) {
  if (!notification?.read) loadNotifications()
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) {
    throw new Error('Session expired. Please log in again.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = {}
  try {
    body = await response.json()
  } catch (_error) {
    body = {}
  }

  if (!response.ok) {
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

async function loadNotifications() {
  try {
    const payload = await apiRequest('/notifications')
    const notifs = Array.isArray(payload.notifications) ? payload.notifications : []
    unreadCount.value = notifs.filter((n) => !n.read).length
  } catch (_err) {
    unreadCount.value = 0
  }
}

async function loadRecentEvents() {
  try {
    const payload = await apiRequest('/events?status=active')
    const events = Array.isArray(payload.events) ? payload.events : []
    recentEvents.value = [...events]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 2)
      .map((event) => ({
        ...event,
        date: formatDate(event.date),
      }))
  } catch (_err) {
    recentEvents.value = []
  }
}

function displayStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled'
  if (normalized === 'resched' || normalized === 'reschedule' || normalized === 'rescheduled') return 'Reschedule'
  if (normalized === 'approved') return 'Approved'
  if (normalized === 'pending') return 'Pending'
  if (normalized === 'completed' || normalized === 'done') return 'Completed'
  return status || 'Pending'
}

function badgeClass(status) {
  return {
    Approved: 'badge-green',
    Pending: 'badge-orange',
    Reschedule: 'badge-red',
    Cancelled: 'badge-red',
    Completed: 'badge-gray',
  }[displayStatus(status)] || 'badge-gray'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return dateStr }
}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.dashboard-skeleton { min-height: 100dvh; padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
.skeleton-header { display: flex; align-items: center; gap: 14px; min-height: 100px; padding: 16px 20px 20px; }
.skeleton-heading { display: grid; flex: 1; gap: 8px; }
.skeleton-block { display: block; position: relative; overflow: hidden; border-radius: 8px; background: rgba(115, 125, 133, .15); }
.skeleton-block::after { position: absolute; inset: 0; content: ''; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.66), transparent); animation: dashboard-shimmer 1.35s ease-in-out infinite; }
.skeleton-avatar { width: 52px; height: 52px; flex: 0 0 52px; border-radius: 50%; }
.skeleton-heading .skeleton-block:first-child { width: min(190px, 80%); height: 17px; }
.skeleton-heading .skeleton-block:last-child { width: min(135px, 60%); height: 12px; }
.skeleton-notification { width: 46px; height: 46px; flex: 0 0 46px; border-radius: 50%; }
.skeleton-kicker { width: 68px; height: 9px; margin: 8px 20px 0; border-radius: 5px; }
.skeleton-stats { padding-top: 16px; }
.skeleton-card { display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; pointer-events: none; }
.skeleton-card .skeleton-block:nth-child(1) { width: 58%; height: 12px; }
.skeleton-card .skeleton-block:nth-child(2) { width: 30%; height: 30px; }
.skeleton-card .skeleton-block:nth-child(3) { width: 78%; height: 10px; }
.skeleton-section { margin-top: 0; }
.skeleton-section > .skeleton-kicker { margin: 0 0 9px; }
.skeleton-title { width: min(220px, 70%); height: 19px; margin-bottom: 12px; }
.skeleton-count-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-bottom: 8px; }
.skeleton-count-grid .skeleton-block { height: 42px; border-radius: 10px; }
.skeleton-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; border-bottom: 1px solid rgba(104,112,120,.12); }
.skeleton-row:last-child { border-bottom: 0; }
.skeleton-row .skeleton-block:first-child { width: 58%; height: 13px; }
.skeleton-row .skeleton-block:last-child { width: 24%; height: 24px; border-radius: 999px; }
.skeleton-ctas > .skeleton-block { flex: 1; height: 50px; border-radius: 14px; }
.skeleton-events { margin-bottom: 18px; }
@keyframes dashboard-shimmer { to { transform: translateX(100%); } }
@media (min-width: 768px) {
  .skeleton-header { min-height: 108px; padding-inline: 28px; }
  .dashboard-skeleton > .skeleton-kicker { margin-left: 28px; }
  .skeleton-section { margin-inline: 28px; padding: 22px 24px 18px; }
  .skeleton-ctas { padding-inline: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-block::after { animation: none; transform: none; opacity: .3; }
}

.mobile-app {
  max-width: 430px;
  min-height: 100%;
  margin: 0 auto;
  background: #eef0f2;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.92);
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(91, 99, 106, 0.16);
  box-shadow: 0 3px 14px rgba(45, 50, 55, 0.08);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.avatar-sm {
  width: 42px; height: 42px;
  background: linear-gradient(145deg, #505860, #252a2f);
  color: #fff;
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(37, 42, 47, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.avatar-sm:active {
  transform: scale(0.96);
}
.avatar-sm img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.header-title { font-weight: 800; font-size: 0.98rem; color: #252a2f; letter-spacing: -0.01em; }
.header-sub   { margin-top: 2px; font-size: 0.74rem; color: #727a81; }
.header-notif-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #d6dade;
  background: #f8f9fa;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease, transform 0.15s ease;
}
.header-notif-btn:active { transform: scale(0.94); background: #e9ecef; }

.header-notif-btn .notif-dot {
  position: absolute;
  top: -5px;
  right: -7px;
  display: grid;
  min-width: 18px;
  height: 18px;
  box-sizing: border-box;
  place-items: center;
  padding: 0 5px;
  border: 2px solid #f8f9fa;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: .62rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
  padding: 17px 16px 14px;
}
.stat-card {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 14px;
  padding: 14px 14px 13px;
  border: 0;
  border-left: 4px solid;
  box-shadow: 0 5px 14px rgba(45, 50, 55, 0.1), inset 0 1px rgba(255, 255, 255, 0.9);
  min-height: 82px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.stat-card:focus-visible { outline: 3px solid #344e67; outline-offset: 2px; }
.stat-card:active { transform: translateY(1px); }
.stat-card::after {
  content: '';
  position: absolute;
  width: 42px;
  height: 42px;
  right: -16px;
  bottom: -18px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.07;
}
.stat-card.green { border-color: #5d8c72; color: #5d8c72; }
.stat-card.red   { border-color: #e63946; }
.stat-card.blue  { border-color: #3a86ff; }
.stat-card.orange{ border-color: #f4a261; }
.stat-label { display: block; font-size: 0.72rem; font-weight: 600; color: #737b82; margin-bottom: 5px; }
.stat-num   { display: block; font-size: 1.72rem; font-weight: 800; color: #252a2f; line-height: 1; }
.stat-desc  { display: block; font-size: 0.68rem; color: #9aa1a7; margin-top: 5px; }

/* Section card */
.section-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(91, 99, 106, 0.12);
  border-radius: 15px;
  margin: 0 16px;
  padding: 15px 14px 12px;
  box-shadow: 0 6px 16px rgba(45, 50, 55, 0.1), inset 0 1px rgba(255, 255, 255, 0.9);
}
.section-title { font-weight: 800; font-size: 0.91rem; margin-bottom: 9px; color: #30353a; }
.consultations-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.consultations-heading .section-title { margin: 5px 0 0; }
.consultation-counts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  width: 100%;
  flex-shrink: 0;
}
.consultation-count-card {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 34px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 0.56rem;
  font-weight: 700;
}
.consultation-count-card .count-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.consultation-count-card .count-label {
  font-size: 0.58rem;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.consultation-count-card strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.38);
  font-size: 0.76rem;
  color: inherit;
  margin-left: auto;
}
.count-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.35);
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1;
  flex-shrink: 0;
}
.count-approved { background: #e1eee6; color: #397051; }
.count-pending { background: #fff3e0; color: #b35e00; }
.count-reschedule { background: #ffeaea; color: #e63946; }
.count-completed { background: #f0f0f0; color: #666; }

/* Consult rows */
.consult-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid #edf0f1;
}
.consult-row:last-child { border-bottom: none; padding-bottom: 6px; }
.consult-info { min-width: 0; }
.consult-name    { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; font-weight: 700; color: #252a2f; }
.consult-teacher { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.7rem; color: #858d94; margin-top: 3px; }

/* Badges */
.consult-status-card {
  min-width: 72px;
  text-align: center;
  font-size: 0.7rem; font-weight: 600;
  padding: 4px 9px; border-radius: 7px;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-green  { background: #e1eee6; color: #397051; }
.badge-orange { background: #fff3e0; color: #b35e00; }
.badge-red    { background: #ffeaea; color: #e63946; }
.badge-gray   { background: #f0f0f0; color: #666; }

/* CTA */
.cta-row {
  display: flex; gap: 10px;
  padding: 15px 16px 16px;
}
.cta-btn {
  flex: 1;
  min-height: 44px;
  padding: 11px 10px;
  border: none; border-radius: 10px;
  font-family: inherit; font-weight: 700; font-size: 0.88rem;
  cursor: pointer; transition: opacity 0.15s, transform 0.15s ease;
}
.cta-btn:active { opacity: 0.85; transform: translateY(1px); }
.cta-btn.primary   { background: linear-gradient(145deg, #454d55, #272c31); color: #fff; box-shadow: 0 5px 12px rgba(39, 44, 49, 0.2); }
.cta-btn.secondary { background: #e63946; color: #fff; box-shadow: 0 5px 12px rgba(230, 57, 70, 0.18); }

.events-card {
  margin: 0 16px 16px;
}

.events-card .consult-row {
  align-items: flex-start;
}

.view-events-btn {
  width: 100%;
  margin-top: 11px;
  border: 1px solid #c6cdd1;
  background: #f3f5f6;
  color: #3f474e;
  border-radius: 10px;
  padding: 11px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
}
.view-events-btn:active { background: #e7eaec; }

/* Dashboard composition */
.mobile-app {
  position: relative;
  gap: 0;
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(circle at 88% 2%, rgba(255,255,255,.82), transparent 15rem),
    linear-gradient(155deg, #eef0f1 0%, #d7dbdd 48%, #b8bec1 100%) !important;
}

.app-header {
  position: relative;
  min-height: 100px;
  padding: 16px 20px 20px !important;
  align-items: flex-start;
}

.app-header::after {
  content: 'OVERVIEW';
  position: absolute;
  left: 20px;
  bottom: 5px;
  color: #7c858d;
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .16em;
}

.header-left { gap: 14px; }
.avatar-sm { width: 52px; height: 52px; }
.header-title { font-size: 1.12rem; line-height: 1.15; }
.header-sub { margin-top: 5px; font-size: .79rem; }
.header-notif-btn { margin-top: 2px; }

.stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 10px 16px 18px;
}

.stat-card {
  min-height: 112px;
  padding: 16px 15px 14px;
  border-left-width: 0;
  border-top: 4px solid;
  border-radius: 18px;
}

.stat-icon {
  position: absolute;
  top: 13px;
  right: 13px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(255,255,255,.78);
  border-radius: 12px;
  background: rgba(255,255,255,.48);
  color: currentColor;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.stat-card.green { border-top-color: #5d8c72; }
.stat-card.red { border-top-color: #c95c65; }
.stat-card.blue { border-top-color: #667f9e; }
.stat-card.orange { border-top-color: #c58a52; }
.stat-card.green { background: linear-gradient(145deg, #f3f7f4, #d9e5df) !important; }
.stat-card.red { background: linear-gradient(145deg, #f7f3f3, #e7dfe0) !important; }
.stat-card.blue { background: linear-gradient(145deg, #f2f5f8, #dce3ea) !important; }
.stat-card.orange { background: linear-gradient(145deg, #f7f5f1, #e8e1d6) !important; }
.stat-card.green .stat-icon { color: #397051; background: rgba(221,237,228,.78); }
.stat-card.red .stat-icon { color: #a95159; background: rgba(239,224,226,.78); }
.stat-card.blue .stat-icon { color: #566f8c; background: rgba(222,231,240,.82); }
.stat-card.orange .stat-icon { color: #a87543; background: rgba(239,230,215,.82); }
.stat-label { box-sizing: border-box; width: 100%; padding-right: 44px; font-size: .7rem; line-height: 1.2; letter-spacing: .02em; overflow-wrap: anywhere; }
.stat-num { margin-top: 8px; font-size: 2rem; }
.stat-desc { margin-top: 8px; font-size: .66rem; }

.section-card {
  border-radius: 22px;
  margin: 0 16px;
  padding: 18px 16px 14px;
}

.section-card:not(.events-card) {
  position: relative;
  padding-top: 20px;
}

.section-card:not(.events-card)::before {
  content: 'ACTIVITY';
  display: block;
  margin-bottom: 5px;
  color: #879099;
  font-size: .56rem;
  font-weight: 800;
  letter-spacing: .16em;
}

.section-card:not(.events-card) .section-title,
.events-card .section-title {
  font-size: 1rem;
  letter-spacing: -.01em;
}

.consultations-heading {
  display: block;
  margin-bottom: 12px;
}

.consultations-heading .section-title { margin: 0; }
.consultation-counts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  gap: 6px;
  margin-top: 13px;
}

.consultation-count-card {
  min-width: 0;
  min-height: 42px;
  justify-content: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(255,255,255,.5);
  border-radius: 10px;
  font-size: .52rem;
}

.consultation-count-card .count-icon {
  width: 22px;
  height: 22px;
  font-size: .9rem;
  font-weight: 800;
  line-height: 1;
}

.consultation-count-card .count-label {
  font-size: .56rem;
}

.consultation-count-card strong { font-size: .72rem; }
.consult-row { padding: 13px 0; border-bottom-color: rgba(104,112,120,.16); }
.consult-name { font-size: .8rem; }
.consult-teacher { margin-top: 4px; font-size: .68rem; }
.consult-status-card { border-radius: 999px; font-size: .66rem; padding: 6px 10px; }

.cta-row {
  gap: 12px;
  padding: 16px 16px 18px;
}

.cta-btn {
  min-height: 48px;
  border-radius: 14px;
  font-size: .82rem;
  letter-spacing: .01em;
}

.events-card {
  margin-bottom: 18px;
  background: rgba(245,246,246,.72) !important;
}

.events-card .consult-row { padding: 11px 0; }
.view-events-btn { border-radius: 999px; padding: 10px; font-size: .78rem; }

@media (min-width: 768px) {
  .mobile-app {
    width: 100%;
    max-width: 100%;
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }

  .app-header {
    min-height: 108px;
    padding: 18px 20px 20px !important;
  }

  .header-title { font-size: 1.18rem; }
  .header-sub { font-size: .81rem; }
  .avatar-sm { width: 50px; height: 50px; }
  .header-notif-btn { width: 42px; height: 42px; }

  .stats-grid {
    gap: 13px;
    padding: 12px 28px 22px;
  }

  .stat-card {
    min-height: 120px;
    padding: 16px 16px 14px;
  }

  .stat-num { font-size: 2.15rem; }
  .stat-desc { font-size: .7rem; }

  .section-card {
    margin-left: 28px;
    margin-right: 28px;
    padding: 22px 24px 18px;
  }

  .consultation-count-card { min-height: 40px; }
  .consult-name { font-size: .85rem; }
  .consult-teacher { font-size: .72rem; }
  .consult-status-card { min-width: 76px; }

  .cta-row { padding: 18px 28px 22px; }
  .cta-btn { min-height: 50px; font-size: .9rem; }
}

@media (min-width: 1024px) {
  .app-header {
    min-height: 124px;
    padding: 24px 36px 28px !important;
  }

  .app-header::after { left: 36px; bottom: 7px; }
  .header-left { gap: 18px; }
  .avatar-sm { width: 58px; height: 58px; }
  .header-title { font-size: 1.3rem; }
  .header-sub { font-size: .9rem; }
  .stats-grid {
    gap: 18px;
    padding: 14px 36px 26px;
  }
  .stat-card {
    min-height: 142px;
    padding: 20px 22px 18px;
  }
  .stat-label { font-size: .83rem; }
  .stat-num { font-size: 2.35rem; }
  .stat-desc { font-size: .78rem; }
  .stat-icon { top: 16px; right: 17px; width: 46px; height: 46px; }
  .section-card { margin-inline: 36px; padding: 25px 28px 20px; }
  .section-card:not(.events-card) .section-title,
  .events-card .section-title { font-size: 1.12rem; }
  .consultation-counts { gap: 10px; }
  .consultation-count-card { min-height: 48px; padding-inline: 12px; }
  .consultation-count-card .count-label { font-size: .68rem; }
  .consultation-count-card strong { font-size: .82rem; }
  .consult-row { padding: 16px 0; }
  .consult-name { font-size: .92rem; }
  .consult-teacher { font-size: .78rem; }
  .cta-row { padding: 20px 36px 24px; }
  .cta-btn { min-height: 58px; font-size: .98rem; }
}

@media (max-width: 360px) {
  .mobile-app { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .app-header { min-height: 92px; padding: 14px 14px 19px !important; }
  .app-header::after { left: 14px; font-size: .54rem; }
  .header-left { gap: 10px; }
  .avatar-sm { width: 44px; height: 44px; }
  .header-title { font-size: .98rem; }
  .header-sub { font-size: .7rem; }
  .header-notif-btn { width: 40px; height: 40px; }
  .stats-grid { gap: 8px; padding: 8px 12px 14px; }
  .stat-card { min-height: 96px; padding: 13px 12px 12px; border-radius: 15px; }
  .stat-icon { top: 10px; right: 10px; width: 32px; height: 32px; }
  .stat-icon svg { width: 19px; height: 19px; }
  .stat-label { font-size: .66rem; }
  .stat-num { margin-top: 6px; font-size: 1.8rem; }
  .stat-desc { margin-top: 6px; font-size: .6rem; }
  .section-card, .events-card { margin-left: 12px; margin-right: 12px; }
  .section-card { padding: 16px 13px 12px; border-radius: 18px; }
  .section-card:not(.events-card) { padding-top: 18px; }
  .section-card:not(.events-card) .section-title, .events-card .section-title { font-size: .92rem; }
  .consultation-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; margin-top: 10px; }
  .consultation-count-card { min-height: 32px; font-size: .58rem; }
  .consult-row { gap: 7px; padding: 10px 0; }
  .consult-name { font-size: .76rem; }
  .consult-teacher { font-size: .64rem; }
  .consult-status-card { min-width: 64px; padding: 5px 8px; font-size: .62rem; }
  .cta-row { gap: 8px; padding: 14px 12px 16px; }
  .cta-btn { min-height: 44px; padding-inline: 8px; font-size: .74rem; }
}

@media (max-width: 430px) and (max-height: 680px) {
  .app-header { min-height: 90px; padding-top: 14px !important; }
  .stats-grid { padding-top: 8px; padding-bottom: 12px; }
  .stat-card { min-height: 98px; }
  .section-card { padding-top: 16px; padding-bottom: 10px; }
  .consult-row { padding-block: 9px; }
  .cta-row { padding-top: 10px; padding-bottom: 12px; }
}
</style>
