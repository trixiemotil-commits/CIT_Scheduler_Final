<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshDashboard" />
      <div class="mobile-app">
    <!-- Header -->
    <div class="app-header">
      <div class="header-left">
        <div class="avatar-sm">{{ initials }}</div>
        <div>
          <div class="header-title">Student Dashboard</div>
          <div class="header-sub">{{ user.name }}</div>
        </div>
      </div>
      <button class="header-notif-btn" @click="$router.push('/student/notifications')" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span v-if="unreadCount > 0" class="notif-dot"></span>
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card green">
        <div class="stat-label">Approved</div>
        <div class="stat-num">{{ stats.approved }}</div>
        <div class="stat-desc">sessions approved</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Reschedule</div>
        <div class="stat-num">{{ stats.reschedule }}</div>
        <div class="stat-desc">needs reschedule</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Pending</div>
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-desc">awaiting response</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Completed</div>
        <div class="stat-num">{{ stats.completed }}</div>
        <div class="stat-desc">all time</div>
      </div>
    </div>

    <!-- Recent Consultations -->
    <div class="section-card">
      <div class="section-title">Recent Consultations</div>
      <div v-for="c in recentConsultations" :key="c.id" class="consult-row">
        <div class="consult-info">
          <div class="consult-name">{{ c.subject }}</div>
          <div class="consult-teacher">{{ c.teacher }} · {{ formatDate(c.date) }}</div>
        </div>
        <span :class="['badge', badgeClass(c.status)]">{{ c.status }}</span>
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
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken, getUser } from '@/auth.js'
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh.js'
import useNotifications from '@/composables/useNotifications.js'
import { useStudentData } from '@/composables/useStudentData.js'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const user     = getUser() || { name: 'Anna Cooper', email: 'student@gmail.com' }
const initials = computed(() => user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const { sessions, stats, loadSessions } = useStudentData()
const { refresh: refreshDashboard } = useAutoRefresh(() => loadSessions(true))

const recentConsultations = computed(() => sessions.value.slice(0, 4))

onMounted(() => {
  loadNotifications()
  loadRecentEvents()
  useNotifications.addNotificationListener(handleNotification)
})

onUnmounted(() => {
  useNotifications.removeNotificationListener(handleNotification)
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const unreadCount = ref(0)
const recentEvents = ref([])

function handleNotification(notification) {
  if (!notification?.read) unreadCount.value += 1
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
    recentEvents.value = events.slice(0, 2).map((event) => ({
      ...event,
      date: formatDate(event.date),
    }))
  } catch (_err) {
    recentEvents.value = []
  }
}

function badgeClass(status) {
  return {
    Approved: 'badge-green',
    Pending: 'badge-orange',
    Reschedule: 'badge-red',
    Completed: 'badge-gray',
    Cancelled: 'badge-red',
    Done: 'badge-gray',
  }[status] || 'badge-gray'
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
.mobile-app {
  max-width: 430px;
  min-height: 100%;
  margin: 0 auto;
  background: #eef0f2;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
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
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(37, 42, 47, 0.2);
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
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
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
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 14px;
  padding: 14px 14px 13px;
  border-left: 4px solid;
  box-shadow: 0 5px 14px rgba(45, 50, 55, 0.1), inset 0 1px rgba(255, 255, 255, 0.9);
  min-height: 82px;
}
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
.stat-label { font-size: 0.72rem; font-weight: 600; color: #737b82; margin-bottom: 5px; }
.stat-num   { font-size: 1.72rem; font-weight: 800; color: #252a2f; line-height: 1; }
.stat-desc  { font-size: 0.68rem; color: #9aa1a7; margin-top: 5px; }

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
.badge {
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

@media (max-width: 360px) {
  .stats-grid { gap: 8px; padding-left: 12px; padding-right: 12px; }
  .section-card, .events-card { margin-left: 12px; margin-right: 12px; }
  .cta-row { padding-left: 12px; padding-right: 12px; }
  .cta-btn { font-size: 0.78rem; }
}
</style>
