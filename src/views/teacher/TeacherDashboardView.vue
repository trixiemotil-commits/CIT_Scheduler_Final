<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
      </div>

      <!-- Nav -->
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
          <button class="notif-btn" @click="showNotif = !showNotif">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="notif-dot"></span>
          </button>

          <!-- Notification Dropdown -->
          <div v-if="showNotif" class="notif-panel">
            <div class="notif-panel-header">
              <span class="notif-panel-title">Notifications</span>
            </div>
            <div class="notif-tabs">
              <button :class="['notif-tab', { active: notifTab === 'all' }]" @click="notifTab = 'all'">All</button>
              <button :class="['notif-tab', { active: notifTab === 'unread' }]" @click="notifTab = 'unread'">Unread</button>
            </div>
            <div class="notif-list-wrap">
              <!-- Unread tab: all unread items under a single New section -->
              <template v-if="notifTab === 'unread'">
                <template v-if="unreadNotifs.length">
                  <div class="notif-section-label">New</div>
                  <ul class="notif-list">
                    <li v-for="n in unreadNotifs" :key="n.id" class="notif-item">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text">{{ n.message }}</span>
                      <span class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>
                <div v-else class="notif-empty">No unread notifications</div>
              </template>

              <!-- All tab: split by New / today groups -->
              <template v-else>
                <template v-if="newNotifs.length">
                  <div class="notif-section-label">New</div>
                  <ul class="notif-list">
                    <li v-for="n in newNotifs" :key="n.id" class="notif-item">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text">{{ n.message }}</span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>
                <template v-if="todayNotifs.length">
                  <div class="notif-section-label">today</div>
                  <ul class="notif-list">
                    <li v-for="n in todayNotifs" :key="n.id" class="notif-item">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text">{{ n.message }}</span>
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
              <circle cx="40" cy="26" r="12" fill="#74c69d" />
              <path d="M18 62c0-12 10-20 22-20s22 8 22 20" fill="#40916c" />
              <!-- Chat bubble -->
              <rect x="46" y="10" width="26" height="18" rx="6" fill="#e8f5e9" stroke="#40916c" stroke-width="1.5"/>
              <path d="M50 32 L46 38 L56 32" fill="#e8f5e9" stroke="#40916c" stroke-width="1.5" stroke-linejoin="round"/>
              <line x1="52" y1="17" x2="66" y2="17" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
              <line x1="52" y1="22" x2="62" y2="22" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
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
              <rect x="12" y="20" width="44" height="40" rx="6" fill="#e8f5e9" stroke="#40916c" stroke-width="2"/>
              <rect x="12" y="20" width="44" height="14" rx="6" fill="#40916c"/>
              <rect x="12" y="28" width="44" height="6" fill="#40916c"/>
              <!-- Calendar lines -->
              <line x1="21" y1="44" x2="29" y2="44" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
              <line x1="34" y1="44" x2="42" y2="44" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
              <line x1="21" y1="52" x2="29" y2="52" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
              <line x1="34" y1="52" x2="42" y2="52" stroke="#40916c" stroke-width="2" stroke-linecap="round"/>
              <!-- Pegs -->
              <rect x="22" y="14" width="5" height="12" rx="2.5" fill="#2d6a4f"/>
              <rect x="41" y="14" width="5" height="12" rx="2.5" fill="#2d6a4f"/>
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
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const notifications = ref([
  { id: 1, avatar: 'https://i.pravatar.cc/100?img=61', message: 'Teddy has submitted a consultation request.', read: false, group: 'new' },
  { id: 2, avatar: 'https://i.pravatar.cc/100?img=52', message: 'Teddy has submitted a consultation request.', read: false, group: 'today' },
  { id: 3, avatar: 'https://i.pravatar.cc/100?img=54', message: 'Teddy has submitted a consultation request.', read: false, group: 'today' },
  { id: 4, avatar: 'https://i.pravatar.cc/100?img=56', message: 'Teddy has submitted a consultation request.', read: true,  group: 'today' },
  { id: 5, avatar: 'https://i.pravatar.cc/100?img=58', message: 'Teddy has submitted a consultation request.', read: true,  group: 'today' },
])
const unreadNotifs = computed(() => notifications.value.filter(n => !n.read))
const newNotifs    = computed(() => notifications.value.filter(n => n.group === 'new'))
const todayNotifs  = computed(() => notifications.value.filter(n => n.group === 'today'))

/* ── Today's Classes ── */
const todayClasses = ref([])
const classesLoading = ref(false)
const classesError = ref('')
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const todayDayName = ref(dayNames[new Date().getDay()])
let midnightRefreshTimer = null

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

function millisUntilNextDay() {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  return Math.max(1000, nextMidnight.getTime() - now.getTime())
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

function roomBadgeClass(room) {
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
          parallel: Boolean(entry.parallel),
          sortValue: parseTimeToMinutes(entry.timeIn),
        })
      }

      const grouped = groups.get(groupKey)

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
        roomColor: roomBadgeClass(rooms[0] || ''),
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

function scheduleMidnightRefresh() {
  if (midnightRefreshTimer) {
    clearTimeout(midnightRefreshTimer)
  }

  midnightRefreshTimer = setTimeout(async () => {
    await loadTodayClasses()
    scheduleMidnightRefresh()
  }, millisUntilNextDay())
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    loadTodayClasses()
  }
}

onMounted(() => {
  loadTodayClasses()
  scheduleMidnightRefresh()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (midnightRefreshTimer) {
    clearTimeout(midnightRefreshTimer)
    midnightRefreshTimer = null
  }

  document.removeEventListener('visibilitychange', onVisibilityChange)
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
  border: 3px solid #c8ddd4;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
.role  { font-size: 0.88rem; color: #444; font-weight: 500; }
.email { font-size: 0.82rem; color: #888; word-break: break-all; }

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
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
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
  color: #1b4332;
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
.notif-btn:hover { color: #1b4332; }
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
  width: 400px;
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
.notif-tab.active { background: #1b4332; color: #fff; }
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
.notif-item:hover { background: #f7faf8; }
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
.stat-value { font-size: 3rem; font-weight: 700; color: #1b4332; line-height: 1.1; }
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
.legend-dot.laboratory { background: #40916c; }

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
.badge-parallel { background: #e0f0e8; color: #2d6a4f; }
.badge-not      { background: #f0f0f0; color: #666; }

/* Room badge */
.room-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}
.room-green  { background: #d8f3dc; color: #1b4332; }
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
  background: #1b4332;
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
.logout-confirm-btn:hover { background: #2d6a4f; }

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
