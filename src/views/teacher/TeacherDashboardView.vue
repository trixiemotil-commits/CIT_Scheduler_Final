<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar teacher-sidebar">
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
      </div>
      <TeacherSidebarStatus />

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: currentRoute === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <RoleSwitchButton />

      <!-- Logout -->
      <button class="logout-btn" @click="showLogoutModal = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="main">
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Teacher Dashboard</h1>
          <p class="page-sub">Manage your schedule and student consultations</p>
        </div>
        <div class="notif-wrap" v-click-outside="() => showNotif = false">
          <button class="notif-btn" @click="toggleNotifications">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span v-if="unreadNotifs.length" class="notif-dot"></span>
          </button>

          <!-- Notification Dropdown -->
          <div v-if="showNotif" class="notif-panel">
            <div class="notif-panel-header">
              <span class="notif-panel-title">Notifications</span>
            </div>
            <div class="notif-tabs">
              <button :class="['notif-tab', { active: notifTab === 'all' }]" @click="notifTab = 'all'">All</button>
              <button :class="['notif-tab', { active: notifTab === 'unread' }]" @click="notifTab = 'unread'">Unread</button>
              <button :class="['notif-tab', { active: notifTab === 'read' }]" @click="notifTab = 'read'">Read</button>
            </div>
            <div class="notif-list-wrap">
              <!-- Unread tab: all unread items under a single New section -->
              <template v-if="notifTab === 'unread'">
                <template v-if="unreadNotifs.length">
                  <div class="notif-section-label">New</div>
                  <ul class="notif-list">
                    <li v-for="n in unreadNotifs" :key="n.id" class="notif-item" @click="openNotification(n)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.studentName }}</strong> submitted a <strong>consultation request</strong> for <strong>{{ n.subject }}</strong><small>{{ n.consultationTime }}</small></span>
                      <span class="notif-read-status unread">Unread</span>
                      <span class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>
                <div v-else class="notif-empty">No unread notifications</div>
              </template>

              <template v-else-if="notifTab === 'read'">
                <template v-if="readNotifs.length">
                  <div class="notif-section-label">Read</div>
                  <ul class="notif-list">
                    <li v-for="n in readNotifs" :key="n.id" class="notif-item" @click="openNotification(n)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.studentName }}</strong> submitted a <strong>consultation request</strong> for <strong>{{ n.subject }}</strong><small>{{ n.consultationTime }}</small></span>
                      <span class="notif-read-status read">Read</span>
                    </li>
                  </ul>
                </template>
                <div v-else class="notif-empty">No read notifications</div>
              </template>

              <!-- All tab: split by New / today groups -->
              <template v-else>
                <template v-if="newNotifs.length">
                  <div class="notif-section-label">New</div>
                  <ul class="notif-list">
                    <li v-for="n in newNotifs" :key="n.id" class="notif-item" @click="openNotification(n)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.studentName }}</strong> submitted a <strong>consultation request</strong> for <strong>{{ n.subject }}</strong><small>{{ n.consultationTime }}</small></span>
                      <span :class="['notif-read-status', n.read ? 'read' : 'unread']">{{ n.read ? 'Read' : 'Unread' }}</span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>
                <template v-if="todayNotifs.length">
                  <div class="notif-section-label">today</div>
                  <ul class="notif-list">
                    <li v-for="n in todayNotifs" :key="n.id" class="notif-item" @click="openNotification(n)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.studentName }}</strong> submitted a <strong>consultation request</strong> for <strong>{{ n.subject }}</strong><small>{{ n.consultationTime }}</small></span>
                      <span :class="['notif-read-status', n.read ? 'read' : 'unread']">{{ n.read ? 'Read' : 'Unread' }}</span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>
                <div v-if="!newNotifs.length && !todayNotifs.length" class="notif-empty">No notifications</div>
              </template>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Stat Cards ── -->
      <section class="stat-cards">
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Pending Requests</div>
            <div class="stat-value">24</div>
            <div class="stat-sub">Awaiting response</div>
          </div>
          <div class="stat-icon">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Person body -->
              <circle cx="40" cy="26" r="12" fill="#aab0b5" />
              <path d="M18 62c0-12 10-20 22-20s22 8 22 20" fill="#626a72" />
              <!-- Chat bubble -->
              <rect x="46" y="10" width="26" height="18" rx="6" fill="#e8eaeb" stroke="#626a72" stroke-width="1.5"/>
              <path d="M50 32 L46 38 L56 32" fill="#e8eaeb" stroke="#626a72" stroke-width="1.5" stroke-linejoin="round"/>
              <line x1="52" y1="17" x2="66" y2="17" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
              <line x1="52" y1="22" x2="62" y2="22" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Upcoming Consults</div>
            <div class="stat-value">24</div>
            <div class="stat-sub">This week</div>
          </div>
          <div class="stat-icon">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Calendar body -->
              <rect x="12" y="20" width="44" height="40" rx="6" fill="#e8eaeb" stroke="#626a72" stroke-width="2"/>
              <rect x="12" y="20" width="44" height="14" rx="6" fill="#626a72"/>
              <rect x="12" y="28" width="44" height="6" fill="#626a72"/>
              <!-- Calendar lines -->
              <line x1="21" y1="44" x2="29" y2="44" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
              <line x1="34" y1="44" x2="42" y2="44" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
              <line x1="21" y1="52" x2="29" y2="52" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
              <line x1="34" y1="52" x2="42" y2="52" stroke="#626a72" stroke-width="2" stroke-linecap="round"/>
              <!-- Pegs -->
              <rect x="22" y="14" width="5" height="12" rx="2.5" fill="#4b5259"/>
              <rect x="41" y="14" width="5" height="12" rx="2.5" fill="#4b5259"/>
              <!-- Clock overlay -->
              <circle cx="58" cy="56" r="14" fill="#fff" stroke="#e8a020" stroke-width="2"/>
              <circle cx="58" cy="56" r="11" fill="#fff3cd"/>
              <line x1="58" y1="50" x2="58" y2="56" stroke="#e8a020" stroke-width="2" stroke-linecap="round"/>
              <line x1="58" y1="56" x2="63" y2="59" stroke="#e8a020" stroke-width="2" stroke-linecap="round"/>
              <circle cx="58" cy="56" r="1.5" fill="#e8a020"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- ── Today's Class ── -->
      <section class="today-class">
        <div class="today-class-header">
          <h2 class="today-class-title">Today's Class</h2>
          <div class="legend">
            <span class="legend-item"><span class="legend-dot lecture"></span>Lecture</span>
            <span class="legend-item"><span class="legend-dot laboratory"></span>Laboratory</span>
            <span class="legend-item"><span class="legend-dot main-campus"></span>Main Campus</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="class-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>SUBJECT CODE &amp; NAME</th>
                <th>CLASS YEAR &amp; SECTION</th>
                <th>PARALLEL CLASS</th>
                <th>ROOM</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="classesLoading || classesError || !todayClasses.length">
                <td colspan="5" class="td-empty-state">
                  {{ classesLoading ? 'Loading classes...' : (classesError || `No classes or consultation hours scheduled for ${todayDayName}.`) }}
                </td>
              </tr>
              <tr v-else v-for="(cls, i) in todayClasses" :key="i">
                <td class="td-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ cls.time }}
                </td>
                <td v-if="cls.isConsultation" colspan="4" class="td-consultation-center">
                  <span class="consultation-chip">Consultation Hours</span>
                </td>
                <template v-else>
                  <td class="td-subject">{{ cls.subject }}</td>
                  <td class="td-section">{{ cls.section }}</td>
                  <td class="td-parallel">
                    <span :class="['parallel-badge', cls.parallel ? 'badge-parallel' : 'badge-not']">
                      {{ cls.parallel ? 'Parallel' : 'Not Parallel' }}
                    </span>
                  </td>
                  <td class="td-room">
                    <span :class="['room-badge', cls.roomColor]">{{ cls.room }}</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- ═══ Logout Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <div class="logout-modal-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 class="logout-modal-title">Log Out</h2>
          <p class="logout-modal-sub">Are you sure you want to log out?</p>
          <div class="logout-modal-actions">
            <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
            <button class="logout-confirm-btn" @click="confirmLogout">Log Out</button>
          </div>
        </div>
      </div>
    </Teleport>

      <Teleport to="body">
        <div v-if="showMorningPrompt" class="modal-overlay" @click.self="showMorningPrompt = false">
          <div class="logout-modal-box">
            <div class="logout-modal-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                <path d="M12 8v6l4 2" />
              </svg>
            </div>
            <h2 class="logout-modal-title">Daily status check</h2>
            <p class="logout-modal-sub">Are you on school or on leave today?</p>
            <div class="logout-modal-actions">
              <button class="logout-cancel-btn" @click="setMorningStartStatus('On Leave')">On Leave</button>
              <button class="logout-confirm-btn" @click="setMorningStartStatus('On School')">On School</button>
            </div>
          </div>
        </div>
      </Teleport>
      <Teleport to="body">
        <div v-if="showClockOutConfirm" class="modal-overlay" @click.self="cancelClockOut">
          <div class="logout-modal-box">
            <div class="logout-modal-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                <path d="M15 12l-3 3-3-3" />
              </svg>
            </div>
            <h2 class="logout-modal-title">Confirm Clock Out</h2>
            <p class="logout-modal-sub">Are you sure you want to clock out for today?</p>
            <div class="logout-modal-actions">
              <button class="logout-cancel-btn" @click="cancelClockOut">Cancel</button>
              <button class="logout-confirm-btn" @click="confirmClockOut">Yes, Clock Out</button>
            </div>
          </div>
        </div>
      </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout, saveMergedUser } from '@/auth.js'
import TeacherSidebarStatus from '@/components/teacher/TeacherSidebarStatus.vue'
import useNotifications from '@/composables/useNotifications'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._clickOutside) }
}

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/teacher/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/teacher/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Events', to: '/teacher/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Consultation', to: '/teacher/consultation',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    name: 'Settings', to: '/teacher/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Notifications ── */
const showNotif = ref(false)
const notifTab = ref('all')
const notifications = ref([])
const readNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('cit_teacher_read_notifications') || '[]')))
let notificationRefreshTimer
const unreadNotifs = computed(() => notifications.value.filter(n => !n.read))
const readNotifs = computed(() => notifications.value.filter(n => n.read))
const newNotifs    = computed(() => notifications.value.filter(n => n.group === 'new'))
const todayNotifs  = computed(() => notifications.value.filter(n => n.group === 'today'))

function notificationGroup(createdAt) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 'today'
  return Date.now() - created.getTime() < 24 * 60 * 60 * 1000 ? 'new' : 'today'
}

async function loadConsultationNotifications() {
  try {
    const payload = await apiRequest('/notifications')
    const notifs = Array.isArray(payload.notifications) ? payload.notifications : []
    notifications.value = notifs.slice(0, 50).map(n => {
      return {
        id: n.id,
        avatar: n.data?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.title||'Notif')}&background=DDECE5&color=1B4332`,
        studentName: n.data?.studentName || n.title || 'Notification',
        subject: n.data?.subject || '',
        consultationTime: n.data?.consultationTime || '',
        read: Boolean(n.read),
        group: notificationGroup(n.createdAt),
        request: n,
      }
    })
  } catch (_) {
    notifications.value = []
  }
}

function toggleNotifications() {
  showNotif.value = !showNotif.value
  if (showNotif.value) loadConsultationNotifications()
}

function _onNotif(n) {
  try {
    if (!n || !n.id) return
    const item = {
      id: n.id,
      avatar: n.data?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.title||'Notif')}&background=DDECE5&color=1B4332`,
      studentName: n.data?.studentName || n.title || 'Notification',
      subject: n.data?.subject || '',
      consultationTime: n.data?.consultationTime || '',
      read: Boolean(n.read),
      group: notificationGroup(n.createdAt),
      request: n,
    }
    notifications.value = [item, ...notifications.value].slice(0, 100)
  } catch (_) {}
}

function markNotificationRead(notificationId) {
  if (!notificationId) return
  // Persist read state server-side
  apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' }).catch(() => {})
  // update local view
  notifications.value = notifications.value.map(notification =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  )
}

function openNotification(notification) {
  markNotificationRead(notification.id)
  showNotif.value = false
  router.push('/teacher/consultation')
}

/* ── Teacher status ── */
const teacherStatus = ref(user.teacher_status || 'On School')
const teacherAvailability = ref(user.teacher_availability || 'Available')
const teacherTimeIn = ref(user.teacher_time_in || null)
const teacherIsClockedOut = ref(false)
const savingTeacherStatus = ref(false)
const teacherStatusMessage = ref('')
const teacherStatusError = ref(false)
const showPresenceMenu = ref(false)
const showMorningPrompt = ref(false)
const morningPromptDate = ref(localStorage.getItem(getTeacherMorningPromptDateKey()) || '')
const morningPromptSessionShown = ref(sessionStorage.getItem(getTeacherMorningPromptSessionKey()) === 'true')
const forcedOfflineDate = ref(localStorage.getItem(getTeacherForcedOfflineDateKey()) || '')
let statusMessageTimer
const formattedTimeIn = computed(() => {
  if (!teacherTimeIn.value) return 'Not recorded'
  const date = new Date(teacherTimeIn.value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
})

async function saveTeacherStatus({ record = false, durationMinutes = 0 } = {}) {
  if (savingTeacherStatus.value) return
  savingTeacherStatus.value = true
  teacherStatusMessage.value = ''
  teacherStatusError.value = false

  try {
    const payload = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        teacher_status: teacherStatus.value,
        teacher_availability: teacherAvailability.value,
        recordTimeIn: record,
        statusDurationMinutes: durationMinutes,
      }),
    })
    const updatedUser = saveMergedUser(payload.user || {})
    teacherStatus.value = updatedUser.teacher_status || teacherStatus.value
    teacherAvailability.value = updatedUser.teacher_availability || teacherAvailability.value
    teacherTimeIn.value = updatedUser.teacher_time_in || teacherTimeIn.value
    teacherStatusMessage.value = record ? 'Time in recorded and status saved.' : 'Status saved. Students can request consultations only when you are available and in school.'
    clearTimeout(statusMessageTimer)
    statusMessageTimer = setTimeout(() => {
      teacherStatusMessage.value = ''
    }, 3000)
  } catch (error) {
    clearTimeout(statusMessageTimer)
    teacherStatusError.value = true
    teacherStatusMessage.value = error.message || 'Unable to save your status.'
  } finally {
    savingTeacherStatus.value = false
  }
}

function closePresenceMenu() {
  showPresenceMenu.value = false
}

function normalizeTeacherStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'on school' || normalized === 'in school') return 'On School'
  if (normalized === 'on meeting' || normalized === 'on-meeting') return 'On Meeting'
  if (normalized === 'on leave' || normalized === 'on-leave') return 'On Leave'
  if (normalized === 'off campus' || normalized === 'off-campus') return 'Off Campus'

  return 'On School'
}

function setTeacherStatus(status) {
  const safeStatus = normalizeTeacherStatus(status)

  // Support a "Clock Out" friendly label that maps to On Leave in backend
  if (status === 'Clock Out') {
    teacherIsClockedOut.value = true
    teacherStatus.value = 'On Leave'
    closePresenceMenu()
    saveTeacherStatus()
    return
  }

  // If coming back to school, clear clocked out flag
  if (safeStatus === 'On School') {
    teacherIsClockedOut.value = false
  }

  teacherStatus.value = safeStatus
  closePresenceMenu()
  saveTeacherStatus()
}

const teacherStatusDisplay = computed(() => {
  if (teacherIsClockedOut.value) return 'Offline'
  const status = normalizeTeacherStatus(teacherStatus.value)
  if (status === 'On School') return 'In School'
  if (status === 'On Meeting') return 'On Meeting'
  if (status === 'Off Campus') return 'Off Campus'
  return 'On Leave'
})

const showClockOutConfirm = ref(false)

const workStatusDisabled = computed(() => {
  const status = normalizeTeacherStatus(teacherStatus.value)
  return teacherIsClockedOut.value || status === 'On Leave' || forcedOfflineDate.value === getTodayKey()
})

const teacherStatusClass = computed(() => {
  if (teacherIsClockedOut.value || forcedOfflineDate.value === getTodayKey()) return 'is-offline'
  return teacherStatus.value === 'On School' ? 'is-in-school' : 'is-on-leave'
})

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getTeacherStorageId() {
  const id = String(user?.email || user?.employeeId || user?._id || 'anonymous').trim().toLowerCase()
  return id.replace(/\s+/g, '_')
}

function getTeacherMorningPromptDateKey() {
  return `cit_teacher_morning_prompt_date_${getTeacherStorageId()}`
}

function getTeacherMorningPromptSessionKey() {
  return `cit_teacher_morning_prompt_shown_${getTeacherStorageId()}`
}

function getTeacherForcedOfflineDateKey() {
  return `cit_teacher_forced_offline_date_${getTeacherStorageId()}`
}

function isWeekday(date = new Date()) {
  const day = date.getDay()
  return day >= 1 && day <= 6
}

function markMorningPromptShown() {
  morningPromptDate.value = getTodayKey()
  morningPromptSessionShown.value = true
  localStorage.setItem(getTeacherMorningPromptDateKey(), morningPromptDate.value)
  sessionStorage.setItem(getTeacherMorningPromptSessionKey(), 'true')
}

function markForcedOfflineToday() {
  forcedOfflineDate.value = getTodayKey()
  localStorage.setItem(getTeacherForcedOfflineDateKey(), forcedOfflineDate.value)
  teacherIsClockedOut.value = true
}

function confirmClockOut() {
  setTeacherStatus('Clock Out')
  showClockOutConfirm.value = false
}

function cancelClockOut() {
  showClockOutConfirm.value = false
}

function clearExpiredDailyState() {
  const today = getTodayKey()
  if (morningPromptDate.value !== today) {
    morningPromptDate.value = ''
    localStorage.removeItem(getTeacherMorningPromptDateKey())
  }
  if (forcedOfflineDate.value !== today) {
    if (teacherIsClockedOut.value && forcedOfflineDate.value) {
      teacherIsClockedOut.value = false
    }
    forcedOfflineDate.value = ''
    localStorage.removeItem(getTeacherForcedOfflineDateKey())
  }
}

function shouldShowMorningPrompt() {
  if (!isWeekday()) return false
  if (morningPromptDate.value === getTodayKey()) return false
  if (morningPromptSessionShown.value) return false
  const now = new Date()
  return now.getHours() > 6 || (now.getHours() === 6 && now.getMinutes() >= 30)
}

function shouldEnforceAutoOffline() {
  if (!isWeekday()) return false
  if (forcedOfflineDate.value === getTodayKey()) return false
  const now = new Date()
  return now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 0)
}

function openMorningPrompt() {
  if (shouldShowMorningPrompt()) {
    showMorningPrompt.value = true
  }
}

function setMorningStartStatus(status) {
  teacherStatus.value = status
  teacherIsClockedOut.value = false
  markMorningPromptShown()
  showMorningPrompt.value = false
  saveTeacherStatus()
}

function enforceAutoOffline() {
  if (!shouldEnforceAutoOffline()) return
  markForcedOfflineToday()
  teacherStatus.value = 'On Leave'
  showMorningPrompt.value = false
  saveTeacherStatus()
  teacherStatusMessage.value = 'You are automatically offline for today because you did not clock out before 8:00 PM.'
  teacherStatusError.value = false
  clearTimeout(statusMessageTimer)
  statusMessageTimer = setTimeout(() => { teacherStatusMessage.value = '' }, 4000)
}

function dailyStatusCheck() {
  clearExpiredDailyState()
  openMorningPrompt()
  enforceAutoOffline()
}

function initDailyStatusTimers() {
  dailyStatusCheck()
  window.setInterval(dailyStatusCheck, 60000)
}

function setAvailability(availability) {
  if (!canChangeAvailability()) {
    teacherStatusMessage.value = 'Cannot change availability while not in a changeable state.'
    teacherStatusError.value = true
    clearTimeout(statusMessageTimer)
    statusMessageTimer = setTimeout(() => { teacherStatusMessage.value = '' ; teacherStatusError.value = false }, 3000)
    closePresenceMenu()
    return
  }

  teacherAvailability.value = availability
  closePresenceMenu()
  saveTeacherStatus()
}

function recordTimeIn() {
  teacherStatus.value = 'On School'
  closePresenceMenu()
  saveTeacherStatus({ record: true })
}

async function loadTeacherStatus() {
  try {
    const payload = await apiRequest('/auth/me')
    const currentUser = saveMergedUser(payload.user || {})
    teacherStatus.value = currentUser.teacher_status || 'On School'
    teacherAvailability.value = currentUser.teacher_availability || 'Available'
    teacherTimeIn.value = currentUser.teacher_time_in || null
  } catch (_) {
    // Keep the session values as a safe offline fallback.
  }
}

function getCurrentMinutesOfDay() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function parseRangeToMinutes(rangeText) {
  if (!rangeText) return [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  const parts = rangeText.split(/–|-/).map(p => p.trim())
  if (parts.length < 2) return [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  return [parseTimeToMinutes(parts[0]), parseTimeToMinutes(parts[1])]
}

function isNowWithin(rangeText) {
  const [start, end] = parseRangeToMinutes(rangeText)
  const now = getCurrentMinutesOfDay()
  return now >= start && now <= end
}

const isCurrentlyInClass = computed(() => {
  return todayClasses.value.some(c => {
    if (c.isConsultation || c.hasMainCampus) return false
    if (!isNowWithin(c.time)) return false
    return !/lunch/i.test(c.subject)
  })
})

const isCurrentlyOnMainCampusClass = computed(() => {
  return todayClasses.value.some(c => {
    if (c.isConsultation || !c.hasMainCampus) return false
    if (!isNowWithin(c.time)) return false
    return !/lunch/i.test(c.subject)
  })
})

const isCurrentlyOnLunchBreak = computed(() => {
  return todayClasses.value.some(c => {
    if (c.isConsultation) return false
    if (!isNowWithin(c.time)) return false
    return /lunch/i.test(c.subject)
  })
})

const isCurrentlyInConsultationSlot = computed(() => {
  return todayClasses.value.some(c => c.isConsultation && isNowWithin(c.time))
})

const resolvedSecondStatus = computed(() => {
  const status = normalizeTeacherStatus(teacherStatus.value)

  if (status === 'On Leave' || teacherIsClockedOut.value) return 'Unavailable'
  if (status === 'On Meeting') return 'On Meeting'
  if (status === 'Off Campus') return 'Off Campus'
  if (teacherAvailability.value === 'On Lunch' || isCurrentlyOnLunchBreak.value) return 'On Lunch'
  if (isCurrentlyInMeeting.value) return 'On Meeting'
  if (isCurrentlyInEvent.value) return 'On Event'
  if (isCurrentlyOnMainCampusClass.value) return 'Off Campus'

  if (isCurrentlyInClass.value) return 'In Class'
  if (isCurrentlyInConsultationSlot.value) {
    return teacherAvailability.value === 'Available' ? 'Available for Consultation' : 'Unavailable'
  }

  return teacherAvailability.value === 'Available' ? 'Available for Consultation' : 'Unavailable'
})

const resolvedSecondSubtext = computed(() => {
  if (teacherStatus.value === 'On Leave' || teacherIsClockedOut.value) return 'You are on leave/offline — availability cannot be changed.'
  if (teacherStatus.value === 'On Meeting') return 'You are marked as in a meeting.'
  if (teacherStatus.value === 'Off Campus') return 'You are off campus — availability cannot be changed.'
  if (teacherAvailability.value === 'On Lunch' || isCurrentlyOnLunchBreak.value) return 'Currently on lunch break — availability is hidden from manual selection.'
  if (isCurrentlyInMeeting.value) return 'Marked as in a meeting by the system.'
  if (isCurrentlyInEvent.value) return 'Marked as attending an event.'
  if (isCurrentlyOnMainCampusClass.value) return 'You are on Main Campus class — showing off campus status.'
  if (isCurrentlyInClass.value) return 'System detected class in progress.'
  if (isCurrentlyInConsultationSlot.value) return 'Scheduled consultation hours.'
  return 'Toggle to update your consultation availability.'
})

function canChangeAvailability() {
  if (teacherStatus.value === 'On Leave') return false
  if (teacherStatus.value === 'On Meeting') return false
  if (teacherStatus.value === 'Off Campus') return false
  if (isCurrentlyInClass.value) return false
  if (isCurrentlyOnLunchBreak.value) return false
  return teacherStatus.value === 'On School'
}

const canToggleAvailability = computed(() => canChangeAvailability())

function currentClassInfo() {
  return todayClasses.value.find(c => !c.isConsultation && isNowWithin(c.time)) || null
}

const availabilityOptions = computed(() => {
  const currentStatus = resolvedSecondStatus.value
  const manualDisabled = !canToggleAvailability.value

  const options = [
    {
      value: 'Available',
      label: 'Available for consultations',
      disabled: manualDisabled,
    },
    {
      value: 'Unavailable',
      label: 'Unavailable for consultations',
      disabled: manualDisabled,
    },
  ]

  if (!['Available for Consultation', 'Unavailable'].includes(currentStatus)) {
    options.unshift({
      value: '__current',
      label: `${currentStatus} (current)`,
      disabled: true,
    })
  }

  return options
})

const teacherAvailabilityChoice = computed({
  get() {
    const currentStatus = resolvedSecondStatus.value
    if (currentStatus === 'Available for Consultation') return 'Available'
    if (currentStatus === 'Unavailable') return 'Unavailable'
    return '__current'
  },
  set(val) {
    if (val === 'Available' || val === 'Unavailable') {
      setAvailability(val)
      return
    }

    teacherStatusMessage.value = 'This status is set automatically and cannot be changed manually.'
    teacherStatusError.value = false
    clearTimeout(statusMessageTimer)
    statusMessageTimer = setTimeout(() => { teacherStatusMessage.value = '' }, 2500)
  }
})

/* ── Today's Classes ── */
const todayClasses = ref([])
const classesLoading = ref(false)
const classesError = ref('')
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const todayDayName = ref(dayNames[new Date().getDay()])

const events = ref([])

async function loadEvents() {
  try {
    const teacherName = getTeacherName()
    const url = teacherName ? `/events?teacher=${encodeURIComponent(teacherName)}` : '/events'
    const payload = await apiRequest(url).catch(() => ({ events: [] }))
    events.value = payload.events || payload || []
  } catch (_e) {
    events.value = []
  }
}

const isCurrentlyInEvent = computed(() => {
  const todayISO = new Date().toISOString().slice(0, 10)
  return events.value.some(ev => {
    const evDate = ev.date || ev.eventDate || ''
    if (evDate && !evDate.startsWith(todayISO)) return false
    const timeRange = ev.startTime && ev.endTime ? `${ev.startTime} – ${ev.endTime}` : (ev.time || '')
    if (!timeRange) return false
    return isNowWithin(timeRange)
  })
})

const isCurrentlyInMeeting = computed(() => {
  const todayISO = new Date().toISOString().slice(0, 10)
  return events.value.some(ev => {
    const evDate = ev.date || ev.eventDate || ''
    if (evDate && !evDate.startsWith(todayISO)) return false
    const timeRange = ev.startTime && ev.endTime ? `${ev.startTime} – ${ev.endTime}` : (ev.time || '')
    if (!timeRange) return false
    const within = isNowWithin(timeRange)
    if (!within) return false
    const title = (ev.title || '') + ' ' + (ev.description || '')
    return /meeting/i.test(title) || ev.type === 'meeting' || ev.isMeeting
  })
})

function getTeacherName() {
  const fullName = typeof user?.name === 'string' ? user.name.trim() : ''
  if (fullName) {
    return fullName
  }

  const combined = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  return combined
}

function getCurrentDayName() {
  return dayNames[new Date().getDay()]
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
    throw new Error(body.message || 'Failed to load classes.')
  }

  return body
}

function parseTimeToMinutes(value) {
  const text = (value || '').toString().trim()
  const plain = text.match(/^(\d{2}):(\d{2})$/)
  if (plain) {
    return (Number(plain[1]) * 60) + Number(plain[2])
  }

  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return Number.MAX_SAFE_INTEGER

  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3].toUpperCase()

  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return (hour * 60) + minute
}

function roomBadgeClass(room, campus, colorToken) {
  if (campus === 'Main Campus' || colorToken === 'color-orange') {
    return 'room-orange'
  }

  return /^cl\.?/i.test((room || '').trim()) ? 'room-green' : 'room-yellow'
}

function mapTodayClasses(entries) {
  const groups = new Map()

  entries
    .filter((entry) => entry.day === todayDayName.value)
    .forEach((entry) => {
      const groupKey = entry.parallel && entry.parallelGroupId
        ? `parallel:${entry.parallelGroupId}`
        : `single:${entry.id || `${entry.day}|${entry.timeIn}|${entry.timeOut}|${entry.section || ''}`}`

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          time: `${entry.timeIn} – ${entry.timeOut}`,
          subject: entry.subject || 'Untitled Subject',
          sectionSet: new Set(),
          roomSet: new Set(),
          hasMainCampus: entry.campus === 'Main Campus' || entry.color === 'color-orange',
          parallel: Boolean(entry.parallel),
          sortValue: parseTimeToMinutes(entry.timeIn),
        })
      }

      const grouped = groups.get(groupKey)
      if (entry.campus === 'Main Campus' || entry.color === 'color-orange') {
        grouped.hasMainCampus = true
      }

      if (entry.section) grouped.sectionSet.add(entry.section)
      if (entry.room) grouped.roomSet.add(entry.room)

      if (Array.isArray(entry.parallelSlots)) {
        entry.parallelSlots.forEach((slot) => {
          if (slot?.section) grouped.sectionSet.add(slot.section)
          if (slot?.room) grouped.roomSet.add(slot.room)
        })
      }
    })

  return Array.from(groups.values())
    .map((item) => {
      const sections = Array.from(item.sectionSet)
      const rooms = Array.from(item.roomSet)
      return {
        time: item.time,
        subject: item.subject,
        section: sections.length ? sections.join(', ') : 'N/A',
        parallel: item.parallel,
        room: rooms.length ? rooms.join(' and ') : 'TBA',
        hasMainCampus: item.hasMainCampus,
        roomColor: item.hasMainCampus ? 'room-orange' : roomBadgeClass(rooms[0] || ''),
        sortValue: item.sortValue,
      }
    })
    .sort((a, b) => a.sortValue - b.sortValue)
}

function mapTodayConsultations(slots) {
  return (Array.isArray(slots) ? slots : [])
    .filter((slot) => slot?.dayOfWeek === todayDayName.value)
    .map((slot) => ({
      time: `${slot.startTime} – ${slot.endTime}`,
      subject: 'Consultation Hours',
      section: '-',
      parallel: false,
      room: '-',
      roomColor: 'room-green',
      isConsultation: true,
      sortValue: parseTimeToMinutes(slot.startTime),
    }))
}

async function loadTodayClasses() {
  classesLoading.value = true
  classesError.value = ''
  todayDayName.value = getCurrentDayName()

  try {
    const teacherName = getTeacherName()
    const [schedulePayload, consultPayload] = await Promise.all([
      apiRequest('/schedules'),
      teacherName
        ? apiRequest(`/consultations?teacher=${encodeURIComponent(teacherName)}`).catch(() => ({ consultations: [] }))
        : Promise.resolve({ consultations: [] }),
    ])

    const entries = Array.isArray(schedulePayload.entries) ? schedulePayload.entries : []
    const consultations = Array.isArray(consultPayload.consultations) ? consultPayload.consultations : []

    todayClasses.value = [
      ...mapTodayClasses(entries),
      ...mapTodayConsultations(consultations),
    ].sort((a, b) => a.sortValue - b.sortValue)
  } catch (error) {
    todayClasses.value = []
    classesError.value = error.message || 'Unable to load classes.'
  } finally {
    classesLoading.value = false
  }
}

onMounted(() => {
  loadTeacherStatus()
  loadTodayClasses()
  loadConsultationNotifications()
  loadEvents()
  notificationRefreshTimer = window.setInterval(loadConsultationNotifications, 15000)
  initDailyStatusTimers()
  useNotifications.addNotificationListener(_onNotif)
})

onUnmounted(() => {
  window.clearInterval(notificationRefreshTimer)
  useNotifications.removeNotificationListener(_onNotif)
  useNotifications.closeNotifications()
})

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}
</script>

<style scoped>
/* ── Layout ── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

/* Force all form elements to inherit Poppins */
.layout button,
.layout input,
.layout select,
.layout textarea {
  font-family: inherit;
}

/* ═══ SIDEBAR ═══ */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  text-align: center;
}

.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  border: 3px solid #c4c9cd;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand { font-size: 1.05rem; font-weight: 600; color: #30353a; }
.role  { font-size: 0.88rem; color: #444; font-weight: 500; }
.email { font-size: 0.82rem; color: #888; word-break: break-all; }
.sidebar-presence-wrap { position: relative; width: 100%; margin-top: 10px; }
.sidebar-presence-btn { display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 0 10px; border: 0; border-radius: 8px; background: #f2f4f3; color: #475467; font: inherit; font-size: 0.78rem; cursor: pointer; }
.sidebar-presence-btn:hover { background: #e8f1eb; color: #1b4332; }
.sidebar-presence-btn .presence-arrow { margin-left: auto; font-size: 1.25rem; line-height: 1; }
.presence-menu { position: absolute; z-index: 20; width: 245px; padding: 8px; border: 1px solid #d9dedb; border-radius: 10px; background: #fff; box-shadow: 0 10px 28px rgba(0,0,0,.16); text-align: left; }
.presence-menu { top: calc(100% + 7px); left: 0; }
.presence-option { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 7px 9px; border: 0; border-radius: 6px; background: transparent; color: #344054; font: inherit; font-size: 0.78rem; text-align: left; cursor: pointer; }
.presence-option:hover { background: #f1f7f3; color: #1b4332; }
.presence-arrow { margin-left: auto; font-size: 1.2rem; color: #667085; }
.presence-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
.presence-dot.online { background: #40a86b; }.presence-dot.leave { background: #e63946; }.presence-dot.unavailable { border: 3px solid #98a2b3; background: transparent; }
.presence-clock { width: 10px; color: #667085; font-size: 1rem; }
.presence-separator { height: 1px; margin: 6px 4px; background: #eaecf0; }
.presence-time { padding: 4px 9px 2px 29px; color: #98a2b3; font-size: 0.68rem; }
.presence-feedback {
  position: fixed;
  top: 22px;
  right: 24px;
  z-index: 3000;
  max-width: min(320px, calc(100vw - 32px));
  margin: 0;
  padding: 12px 14px;
  color: #173f2a;
  background: linear-gradient(145deg, #f6fbf8, #dcefe4);
  border: 1px solid rgba(64, 145, 108, 0.28);
  border-radius: 12px;
  box-shadow:
    0 16px 34px rgba(31, 35, 39, 0.18),
    inset 0 1px rgba(255, 255, 255, 0.82);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
}
.presence-feedback.is-error {
  color: #8a1f18;
  background: linear-gradient(145deg, #fff7f6, #ffe2df);
  border-color: rgba(230, 57, 70, 0.28);
}
.sidebar-status-panel {
  grid-column: 1 / -1;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 11px;
  background: linear-gradient(145deg, rgba(245, 247, 247, 0.72), rgba(199, 204, 208, 0.58));
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.76),
    0 4px 10px rgba(42, 48, 54, 0.1);
  text-align: left;
}
.sidebar-status-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  margin-bottom: 6px;
  color: #30353a;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
}
.sidebar-status-dot { width: 7px; height: 7px; border-radius: 50%; }
.sidebar-status-dot.is-in-school { background: #40916c; }
.sidebar-status-dot.is-on-leave { background: #e63946; }
.sidebar-status-dot.is-offline { background: #98a2b3; }
.sidebar-status-select {
  width: 100%;
  height: 28px;
  margin-top: 0;
  padding: 0 8px;
  border: 1px solid rgba(116, 123, 129, 0.32);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #30353a;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
}
.sidebar-status-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  margin-top: 0;
}
.sidebar-status-value {
  display: inline-flex;
  min-width: 0;
  min-height: 28px;
  align-items: center;
  justify-content: flex-start;
  padding: 0 9px;
  overflow: hidden;
  color: #30353a;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(116, 123, 129, 0.28);
  border-radius: 8px;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-status-button {
  min-width: 74px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #30353a;
  border-radius: 8px;
  background: linear-gradient(145deg, #424950, #23282e);
  color: #fff;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
}
.sidebar-status-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: #8d949a;
  border-color: #747b81;
}
.sidebar-time-in,
.sidebar-status-subtext {
  margin-top: 5px;
  color: #69727c;
  font-size: 0.62rem;
  line-height: 1.25;
}
.sidebar-status-actions { display: flex; gap: 6px; margin-top: 9px; }
.sidebar-status-actions button { flex: 1; height: 30px; border: 1px solid #1b4332; border-radius: 6px; background: #fff; color: #1b4332; font: inherit; font-size: 0.72rem; font-weight: 600; cursor: pointer; }
.sidebar-status-actions .sidebar-save-status { background: #1b4332; color: #fff; }
.sidebar-status-actions button:disabled { cursor: not-allowed; opacity: .65; }
.sidebar-toggle-available { height: 30px; padding: 6px 10px; border-radius: 6px; background: #1b4332; color: #fff; border: none; cursor: pointer; }
.sidebar-toggle-unavailable { height: 30px; padding: 6px 10px; border-radius: 6px; background: transparent; color: #344054; border: 1px solid #cfe3d8; cursor: pointer; }

.status-row { display:flex; flex-direction:column; gap:5px; margin-top:0 }
.status-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.sidebar-status-message { margin: 8px 0 0; color: #1b4332; font-size: 0.68rem; line-height: 1.35; }
.sidebar-status-message.is-error { color: #b42318; }

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 400;
  color: #444;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
}
.nav-item:hover { background: #f1f2f2; color: #30353a; }
.nav-item.active { background: #30353a; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

/* Logout */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ═══ MAIN ═══ */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}
.page-title {
  font-size: 2.4rem;
  font-weight: 700;
  color: #30353a;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* Notification */
.notif-wrap { position: relative; padding-top: 6px; }
.notif-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.notif-btn:hover { color: #30353a; }
.notif-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 13px;
  height: 13px;
  background: #e8a020;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

/* Notification Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 620px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  z-index: 999;
  overflow: hidden;
}
.notif-panel-header { padding: 22px 22px 0; }
.notif-panel-title { font-size: 1.4rem; font-weight: 700; color: #111; }
.notif-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px 0;
}
.notif-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  padding: 5px 18px;
  border-radius: 20px;
  transition: background 0.18s, color 0.18s;
}
.notif-tab.active { background: #30353a; color: #fff; }
.notif-section-label { font-size: 0.88rem; font-weight: 600; color: #333; padding: 14px 22px 6px; }
.notif-list-wrap { max-height: 340px; overflow-y: auto; padding-bottom: 12px; }
.notif-list { list-style: none; padding: 0; margin: 0; }
.notif-empty { text-align: center; font-size: 0.85rem; color: #aaa; padding: 24px 20px; }
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 22px;
  cursor: pointer;
  transition: background 0.15s;
}
.notif-item:hover { background: #f4f5f5; }
.notif-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.notif-text { flex: 1; font-size: 0.9rem; color: #222; line-height: 1.5; padding-top: 2px; }
.notif-unread-dot { width: 12px; height: 12px; border-radius: 50%; background: #40916c; flex-shrink: 0; margin-top: 6px; }

/* ── Stat Cards ── */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 16px;
  padding: 28px 28px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.stat-left { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.9rem; color: #555; font-weight: 500; }
.stat-value { font-size: 3rem; font-weight: 700; color: #30353a; line-height: 1.1; }
.stat-sub   { font-size: 0.82rem; color: #aaa; }
.stat-icon  { display: flex; align-items: center; flex-shrink: 0; }

/* ── Today's Class ── */
.today-class { flex: 1; display: flex; flex-direction: column; }
.today-class-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.today-class-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #111;
}
.legend { display: flex; align-items: center; gap: 16px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #555; }
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.legend-dot.lecture    { background: #e4c86e; }
.legend-dot.laboratory { background: #626a72; }
.legend-dot.main-campus { background: #f4a261; }

/* Table */
.table-wrap {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  overflow: hidden;
}
.class-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.class-table thead tr {
  background: #f5f6f8;
}
.class-table th {
  padding: 13px 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #555;
  text-align: center;
  letter-spacing: 0.03em;
  border-bottom: 1.5px solid #e4e4e4;
}
.class-table th:first-child { text-align: left; }
.class-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.class-table tbody tr:last-child { border-bottom: none; }
.class-table tbody tr:hover { background: #f9fafb; }
.class-table td { padding: 13px 16px; color: #333; text-align: center; vertical-align: middle; }
.td-empty-state { text-align: center !important; color: #667085 !important; font-weight: 500; padding: 18px !important; }

.td-time {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  color: #444;
  font-size: 0.85rem;
  text-align: left;
}
.td-subject { text-align: left; color: #222; font-weight: 500; }
.td-section { color: #555; }
.td-consultation-center {
  text-align: center !important;
}

.consultation-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: #e8f0fb;
  border: 1px solid #4a90d9;
  color: #2f6fb0;
  font-size: 0.86rem;
  font-weight: 500;
}

/* Parallel badge */
.parallel-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
}
.badge-parallel { background: #e0e3e5; color: #4b5259; }
.badge-not      { background: #f0f0f0; color: #666; }

/* Room badge */
.room-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}
.room-green  { background: #d8dcdf; color: #30353a; }
.room-orange { background: #ffe8c2; color: #b06000; }
.room-yellow { background: #fff3cd; color: #9a6e00; }
.room-beige  { background: #fef9e7; color: #9a6e00; }

/* ── Logout Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.logout-modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 360px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
}
.logout-modal-icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 6px;
  width: 100%;
}
.logout-cancel-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #e63946;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  transition: background 0.15s;
}
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #30353a;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.logout-confirm-btn:hover { background: #4b5259; }

/* Responsive */
@media (max-width: 900px) {
  .stat-cards { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .main { padding: 20px 16px 32px; }
  .sidebar { width: 200px; min-width: 200px; }
  .class-table { font-size: 0.78rem; }
}
</style>
