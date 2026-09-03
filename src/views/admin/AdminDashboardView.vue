<template>
  <div class="layout admin-dashboard">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
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
        <PublishedTermScheduleLink />
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
          <span class="page-eyebrow">Dashboard</span>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="page-sub">Manage schedules, rooms, and teacher assignments</p>
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
              <span class="notif-see-all">See all</span>
            </div>

            <div class="notif-list-wrap">
              <!-- New section -->
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

              <!-- Today section -->
              <template v-if="todayNotifs.length">
                <div class="notif-section-label">Today</div>
                <ul class="notif-list">
                  <li v-for="n in todayNotifs" :key="n.id" class="notif-item">
                    <img :src="n.avatar" class="notif-avatar" alt="" />
                    <span class="notif-text">{{ n.message }}</span>
                    <span v-if="!n.read" class="notif-unread-dot"></span>
                  </li>
                </ul>
              </template>

              <div v-if="!newNotifs.length && !todayNotifs.length" class="notif-empty">
                No notifications
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Dashboard Content ── -->

      <!-- Stat Cards -->
      <section class="stat-cards">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-top">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-icon" v-html="stat.icon"></span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div v-if="stat.sub" class="stat-sub">{{ stat.sub }}</div>
        </div>
      </section>

      <section class="today-teachers-section">
        <div class="today-teachers-header">
          <div>
            <span class="today-section-eyebrow"><i></i> Live schedule</span>
            <h2>Teachers with classes today</h2>
            <p>{{ todayDateLabel }} <span>Updated {{ currentTimeLabel }}</span></p>
          </div>
          <div class="today-carousel-controls" v-if="todayTeachers.length > teachersPerSlide">
            <span>Showing {{ teachersPerSlide }} of {{ todayTeachers.length }} teachers • Continuous carousel</span>
          </div>
        </div>

        <div
          v-if="todayScheduleLoading"
          class="today-teachers-loading"
        >Loading today’s teaching schedule…</div>
        <div
          v-else-if="todayTeachers.length"
          ref="todayScheduleWrap"
          class="today-schedule-table-wrap"
          :class="{ 'carousel-enabled': shouldAnimateTodaySchedule, 'dragging': isCarouselDragging }"
          @pointerdown="beginCarouselSwipe"
          @pointermove="onCarouselSwipe"
          @pointerup="endCarouselSwipe"
          @pointerleave="endCarouselSwipe"
          @pointercancel="endCarouselSwipe"
        >
          <table class="today-schedule-table" :class="{ 'carousel-table': shouldAnimateTodaySchedule }">
            <thead>
              <tr>
                <th v-for="teacher in visibleTodayTeachers" :key="teacher.name" class="teacher-col-header">
                  <img :src="teacher.avatar" :alt="teacher.name" class="teacher-header-avatar" />
                  <div class="teacher-header-info">
                    <span class="teacher-header-name">{{ teacher.name }}</span>
                    <span :class="['teacher-header-status', teacher.currentStatus.className]">{{ teacher.currentStatus.label }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rowIndex) in getMaxScheduleLength(visibleTodayTeachers)" :key="`row-${rowIndex}`" class="schedule-row">
                <td v-for="teacher in visibleTodayTeachers" :key="`${teacher.name}-${rowIndex}`" class="schedule-cell">
                  <div v-if="teacher.schedule[rowIndex - 1]" :class="['schedule-entry', getTodayEntryState(teacher.schedule[rowIndex - 1])]">
                    <time class="schedule-time">{{ teacher.schedule[rowIndex - 1].timeIn }}<small>{{ teacher.schedule[rowIndex - 1].timeOut }}</small></time>
                    <div class="schedule-details">
                      <strong class="schedule-subject">{{ teacher.schedule[rowIndex - 1].subject }}</strong>
                      <span class="schedule-section">{{ [teacher.schedule[rowIndex - 1].section, teacher.schedule[rowIndex - 1].room].filter(Boolean).join(' · ') || 'Class details unavailable' }}</span>
                    </div>
                    <em class="schedule-label">{{ getTodayEntryLabel(teacher.schedule[rowIndex - 1]) }}</em>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="today-teachers-empty">
          <span>No classes scheduled today</span>
          <p>Teachers with scheduled classes will appear here automatically.</p>
        </div>
      </section>

      <!-- Charts -->
      <section class="charts-row">
        <!-- Consultation Trends -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'line', 'chart-hidden': expandedChart === 'bar' }">
          <div class="chart-header">
            <span class="chart-title">Consultation Trends</span>
            <button class="expand-btn" @click="toggleExpand('line')">
              <svg v-if="expandedChart === 'line'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="chart-wrap"><canvas ref="lineChartRef"></canvas></div>
        </div>

        <!-- Teacher Workload -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'bar', 'chart-hidden': expandedChart === 'line' }">
          <div class="chart-header">
            <span class="chart-title">Teacher Workload</span>
            <button class="expand-btn" @click="toggleExpand('bar')">
              <svg v-if="expandedChart === 'bar'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="chart-wrap"><canvas ref="barChartRef" style="cursor:pointer"></canvas></div>
        </div>
      </section>

    </main>

    <!-- ═══ Teacher Workload Modal ═══ -->
    <Teleport to="body">
      <div v-if="showWorkloadModal" class="modal-overlay" @click.self="showWorkloadModal = false">
        <div class="modal-box">
          <!-- Close -->
          <button class="modal-close" @click="showWorkloadModal = false">✕</button>

          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Teacher Workload Details</h2>
            <p class="modal-sub">View their complete schedule breakdown</p>
          </div>

          <template v-if="selectedTeacher">
            <!-- Teacher identity -->
            <div class="modal-teacher-row">
              <img :src="selectedTeacher.avatar" class="modal-teacher-avatar" alt="" />
              <div class="modal-teacher-info">
                <span class="modal-teacher-name">{{ selectedTeacher.name }}</span>
              </div>
              <span class="modal-hours-badge">{{ selectedTeacher.totalHours }} Hours/Week</span>
            </div>

            <!-- Schedule cards grid -->
            <div class="modal-schedule-grid">
              <div v-for="(sc, i) in selectedTeacher.schedule" :key="i" class="modal-sched-card">
                <div class="modal-sched-top">
                  <span class="modal-day-badge">{{ sc.day }}</span>
                  <span class="modal-sched-time">{{ sc.time }}</span>
                  <span class="modal-sched-dur">{{ sc.duration }}</span>
                </div>
                <div class="modal-sched-subject">{{ sc.subject }}</div>
                <div class="modal-sched-section">{{ sc.section }}</div>
              </div>
            </div>

            <!-- Summary -->
            <div class="modal-summary">
              <div class="modal-summary-label">Schedule Summary</div>
              <div class="modal-summary-stats">
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Classes</span>
                  <span class="modal-summary-val">{{ selectedTeacher.schedule.length }}</span>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Hours per Week</span>
                  <span class="modal-summary-val">{{ selectedTeacher.totalHours }}h</span>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Days Teaching</span>
                  <span class="modal-summary-val">{{ selectedTeacher.daysTeaching }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <!-- Icon -->
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
import Chart from 'chart.js/auto'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
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
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function apiRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = {}
  try { body = await response.json() } catch (_error) { body = {} }

  if (!response.ok) {
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

const user = getUser() || {}

const todayScheduleEntries = ref([])
const teacherDirectory = ref([])
const todayScheduleLoading = ref(true)
const currentDateTime = ref(new Date())
const carouselAnimating = ref(true)
const teachersPerSlide = 4
const todayScheduleWrap = ref(null)
const isCarouselDragging = ref(false)
const carouselDragStartX = ref(0)
const carouselDragStartOffset = ref(0)
const carouselDragOffset = ref(0)
let dashboardRealtimeTimer = null

const todayName = computed(() => currentDateTime.value.toLocaleDateString('en-US', { weekday: 'long' }))
const todayDateLabel = computed(() => currentDateTime.value.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}))
const currentTimeLabel = computed(() => currentDateTime.value.toLocaleTimeString('en-US', {
  hour: 'numeric', minute: '2-digit',
}))

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function timeToMinutes(value) {
  if (!value) return Number.MAX_SAFE_INTEGER
  const match = String(value).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
  if (!match) return Number.MAX_SAFE_INTEGER
  let hour = Number(match[1])
  const minute = Number(match[2])
  if (match[3] === 'PM' && hour !== 12) hour += 12
  if (match[3] === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}

function teacherAvatar(name) {
  const match = teacherDirectory.value.find((teacher) => {
    const fullName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
    return normalizeName(fullName) === normalizeName(name)
  })
  return match?.avatar || `https://i.pravatar.cc/120?u=${encodeURIComponent(name)}`
}

function getTodayEntryState(entry) {
  const now = currentDateTime.value.getHours() * 60 + currentDateTime.value.getMinutes()
  const start = timeToMinutes(entry.timeIn)
  const end = timeToMinutes(entry.timeOut)
  if (now >= start && now < end) return 'is-current'
  if (now >= end) return 'is-complete'
  return 'is-upcoming'
}

function getTodayEntryLabel(entry) {
  const state = getTodayEntryState(entry)
  if (state === 'is-current') return 'Now'
  if (state === 'is-complete') return 'Finished'
  return 'Upcoming'
}

const todayTeachers = computed(() => {
  const grouped = new Map()
  todayScheduleEntries.value
    .filter((entry) => normalizeName(entry.day) === normalizeName(todayName.value))
    .filter((entry) => normalizeName(entry.entryType) !== 'lunch' && !normalizeName(entry.subject).includes('lunch break'))
    .filter((entry) => entry.teacher)
    .forEach((entry) => {
      const key = normalizeName(entry.teacher)
      if (!grouped.has(key)) grouped.set(key, { name: entry.teacher, avatar: teacherAvatar(entry.teacher), schedule: [] })
      grouped.get(key).schedule.push(entry)
    })

  const now = currentDateTime.value.getHours() * 60 + currentDateTime.value.getMinutes()
  return [...grouped.values()].map((teacher) => {
    teacher.schedule.sort((a, b) => timeToMinutes(a.timeIn) - timeToMinutes(b.timeIn))
    const current = teacher.schedule.find((entry) => now >= timeToMinutes(entry.timeIn) && now < timeToMinutes(entry.timeOut))
    const next = teacher.schedule.find((entry) => timeToMinutes(entry.timeIn) > now)
    teacher.currentStatus = current
      ? { label: 'Teaching now', className: 'is-live' }
      : next
        ? { label: `Next ${next.timeIn}`, className: 'is-next' }
        : { label: 'Classes complete', className: 'is-done' }
    return teacher
  }).sort((a, b) => {
    // Prioritize "Teaching now" status first
    if (a.currentStatus.className === 'is-live' && b.currentStatus.className !== 'is-live') return -1
    if (a.currentStatus.className !== 'is-live' && b.currentStatus.className === 'is-live') return 1
    // Then sort by time
    return timeToMinutes(a.schedule[0]?.timeIn) - timeToMinutes(b.schedule[0]?.timeIn) || a.name.localeCompare(b.name)
  })
})

const todayTeacherMaxIndex = computed(() => todayTeachers.value.length)
const shouldAnimateTodaySchedule = computed(() => todayTeachers.value.length > 3)
// Create a duplicated list for a smooth infinite carousel without visible breaks
const infiniteTeachers = computed(() => {
  const teachers = todayTeachers.value
  if (!shouldAnimateTodaySchedule.value || teachers.length <= 3) return teachers
  return [...teachers, ...teachers, ...teachers]
})
const visibleTodayTeachers = computed(() => infiniteTeachers.value)
const todayCarouselPages = computed(() => Array.from(
  { length: Math.ceil(todayTeachers.value.length / teachersPerSlide) },
  (_, index) => ({ index, start: index * teachersPerSlide })
))

function previousTodayTeachers() {
  // Placeholder - carousel is fully automatic via CSS
}

function nextTodayTeachers() {
  // Placeholder - carousel is fully automatic via CSS
}

function beginCarouselSwipe(event) {
  if (!shouldAnimateTodaySchedule.value) return
  const table = todayScheduleWrap.value?.querySelector('.today-schedule-table')
  if (!table) return

  isCarouselDragging.value = true
  carouselDragStartX.value = event.clientX
  carouselDragStartOffset.value = carouselDragOffset.value
  table.style.transition = 'transform 0.12s linear'
}

function onCarouselSwipe(event) {
  if (!isCarouselDragging.value) return

  const deltaX = event.clientX - carouselDragStartX.value
  const nextOffset = carouselDragStartOffset.value + deltaX
  carouselDragOffset.value = Math.max(-220, Math.min(220, nextOffset))

  const table = todayScheduleWrap.value?.querySelector('.today-schedule-table')
  if (!table) return

  table.style.setProperty('--drag-shift', `${carouselDragOffset.value}px`)
}

function endCarouselSwipe() {
  if (!isCarouselDragging.value) return

  isCarouselDragging.value = false
  const table = todayScheduleWrap.value?.querySelector('.today-schedule-table')
  if (!table) return

  const deltaX = carouselDragOffset.value
  const direction = deltaX < 0 ? -1 : 1
  const distance = Math.abs(deltaX)
  const momentumBoost = distance > 30 ? Math.min(90, distance * 0.4) : 0
  const finalOffset = direction * momentumBoost

  table.style.transition = 'transform 0.45s ease'
  carouselDragOffset.value = finalOffset
  table.style.setProperty('--drag-shift', `${finalOffset}px`)

  window.setTimeout(() => {
    carouselDragOffset.value = 0
    table.style.setProperty('--drag-shift', '0px')
    table.style.transition = ''
  }, 450)
}

function startCarouselAutoAdvance() {
  // Animation is handled purely by CSS @keyframes
  // This function is kept for compatibility
}

function getMaxScheduleLength(teachers) {
  return Math.max(...teachers.map(t => t.schedule.length), 0)
}

async function loadTodayTeacherSchedules({ quiet = false } = {}) {
  if (!quiet) todayScheduleLoading.value = true
  try {
    const [schedulePayload, usersPayload] = await Promise.all([
      apiRequest('/schedules'),
      apiRequest('/users?role=teacher'),
    ])
    todayScheduleEntries.value = Array.isArray(schedulePayload.entries) ? schedulePayload.entries : []
    teacherDirectory.value = Array.isArray(usersPayload.users) ? usersPayload.users : []
    todayTeacherIndex.value = Math.min(todayTeacherIndex.value, todayTeacherMaxIndex.value)
  } catch (error) {
    console.error('Failed to load today’s teacher schedules:', error)
  } finally {
    todayScheduleLoading.value = false
  }
}
/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'View Schedules', to: '/admin/schedule/view',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Add Schedule', to: '/admin/schedule/add',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    name: 'Academic Terms', to: '/admin/academic-terms',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Activity Logs', to: '/admin/activity-logs',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Stats ── */
const stats = ref([
  {
    label: 'Available Teachers', value: 0, sub: 'On School status',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    label: 'Available Rooms', value: 0, sub: 'Distinct rooms in schedules',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
  },
  {
    label: 'Classes Today', value: 0, sub: 'Scheduled for today',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    label: 'Active Consultations', value: 0, sub: 'Pending / Approved / Rescheduled',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  }
])

async function loadDashboardSummary() {
  try {
    const payload = await apiRequest('/schedules/dashboard-summary')
    stats.value[0].value = payload.availableTeachers
    stats.value[1].value = payload.availableRooms
    stats.value[2].value = payload.classesToday
    stats.value[3].value = payload.consultations
  } catch (error) {
    console.error('Failed to load dashboard summary:', error)
  }
}

/* ── Notifications ── */
const showNotif = ref(false)
const notifTab = ref('all')
const notifications = ref([
  { id: 1, avatar: 'https://i.pravatar.cc/100?img=12', message: 'Prof. John has finished the class session.', read: false, group: 'new' },
  { id: 2, avatar: 'https://i.pravatar.cc/100?img=15', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 3, avatar: 'https://i.pravatar.cc/100?img=22', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 4, avatar: 'https://i.pravatar.cc/100?img=33', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 5, avatar: 'https://i.pravatar.cc/100?img=44', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
])
const visibleNotifs = computed(() =>
  notifTab.value === 'unread' ? notifications.value.filter(n => !n.read) : notifications.value
)
const newNotifs   = computed(() => visibleNotifs.value.filter(n => n.group === 'new'))
const todayNotifs = computed(() => visibleNotifs.value.filter(n => n.group === 'today'))

/* ── Charts ── */
const lineChartRef = ref(null)
const barChartRef = ref(null)
const expandedChart = ref(null) // null | 'line' | 'bar'
let lineChartInstance = null
let barChartInstance = null

/* ── Workload Modal ── */
const showWorkloadModal = ref(false)
const selectedTeacher = ref(null)

const teacherWorkloads = [
  {
    name: 'Sir. Jhon', avatar: 'https://i.pravatar.cc/100?img=51',
    totalHours: 19, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '08:00-09:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section A' },
      { day: 'Monday',    time: '09:00-10:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section B' },
      { day: 'Tuesday',   time: '08:00-09:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section A' },
      { day: 'Wednesday', time: '10:00-11:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section B' },
    ]
  },
  {
    name: 'Maam. Aira', avatar: 'https://i.pravatar.cc/100?img=47',
    totalHours: 12, daysTeaching: 3,
    schedule: [
      { day: 'Monday',  time: '10:00-11:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section A' },
      { day: 'Tuesday', time: '13:00-14:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section B' },
      { day: 'Friday',  time: '08:00-09:00', duration: '1h', subject: 'UI/UX Design',    section: '3rd Year - Section A' },
    ]
  },
  {
    name: 'Sir. Gab', avatar: 'https://i.pravatar.cc/100?img=53',
    totalHours: 24, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section A' },
      { day: 'Tuesday',   time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section B' },
      { day: 'Wednesday', time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section A' },
      { day: 'Thursday',  time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Sir.Bads', avatar: 'https://i.pravatar.cc/100?img=57',
    totalHours: 19, daysTeaching: 4,
    schedule: [
      { day: 'Monday',   time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section A' },
      { day: 'Tuesday',  time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section B' },
      { day: 'Thursday', time: '13:00-14:00', duration: '1h', subject: 'Cybersecurity', section: '4th Year - Section A' },
    ]
  },
  {
    name: 'Maam. Daniella', avatar: 'https://i.pravatar.cc/100?img=44',
    totalHours: 9, daysTeaching: 2,
    schedule: [
      { day: 'Wednesday', time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section A' },
      { day: 'Friday',    time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section B' },
    ]
  },
  {
    name: 'Sir. Jolo', avatar: 'https://i.pravatar.cc/100?img=60',
    totalHours: 8, daysTeaching: 2,
    schedule: [
      { day: 'Tuesday',  time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section A' },
      { day: 'Thursday', time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Maam.Aj', avatar: 'https://i.pravatar.cc/100?img=35',
    totalHours: 11, daysTeaching: 3,
    schedule: [
      { day: 'Monday',   time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section A' },
      { day: 'Wednesday',time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section B' },
      { day: 'Friday',   time: '10:00-11:00', duration: '1h', subject: 'Research Methods',  section: '3rd Year - Section A' },
    ]
  },
]

function openWorkloadModal(index) {
  selectedTeacher.value = teacherWorkloads[index]
  showWorkloadModal.value = true
}

// Compact (5) vs full (7) bar chart datasets
const BAR_LABELS_SHORT = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella']
const BAR_DATA_SHORT   = [19, 12, 24, 19, 9]
const BAR_LABELS_FULL  = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella', 'Sir. Jolo', 'Maam.Aj']
const BAR_DATA_FULL    = [19, 12, 24, 19, 9, 8, 11]

function toggleExpand(which) {
  const isCollapsing = expandedChart.value === which
  expandedChart.value = isCollapsing ? null : which

  // Destroy both charts, let the DOM re-layout, then recreate so canvases
  // measure their new container size correctly.
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  if (barChartInstance)  { barChartInstance.destroy();  barChartInstance  = null }

  nextTick(() => {
    setTimeout(() => {
      createLineChart()
      createBarChart()
    }, 50)
  })
}

function createLineChart() {
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  lineChartInstance = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        data: [52, 43, 27, 47],
        borderColor: '#4b5259',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#7d858d',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.45,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Consultation : ${ctx.parsed.y}`
          },
          backgroundColor: '#30353a',
          titleColor: '#f4f5f5',
          bodyColor: '#d8dcdf',
          borderColor: '#7d858d',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#69727c', font: { size: 12 } } },
        y: {
          beginAtZero: true,
          max: 80,
          ticks: { stepSize: 20, color: '#69727c', font: { size: 12 } },
          grid: { color: 'rgba(83, 91, 100, 0.16)' }
        }
      }
    }
  })
}

function createBarChart() {
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null }
  const expanded = expandedChart.value === 'bar'
  barChartInstance = new Chart(barChartRef.value, {
    type: 'bar',
    data: {
      labels: [...(expanded ? BAR_LABELS_FULL : BAR_LABELS_SHORT)],
      datasets: [{
        data: [...(expanded ? BAR_DATA_FULL : BAR_DATA_SHORT)],
        backgroundColor: '#596169',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Hours : ${ctx.parsed.y}`
          },
          backgroundColor: '#30353a',
          titleColor: '#f4f5f5',
          bodyColor: '#d8dcdf',
          borderColor: '#7d858d',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      onClick: (_e, elements) => {
        if (elements.length) openWorkloadModal(elements[0].index)
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#69727c', font: { size: 11 } } },
        y: {
          beginAtZero: true,
          max: expanded ? 28 : 24,
          ticks: { stepSize: 6, color: '#69727c', font: { size: 12 } },
          grid: { color: 'rgba(83, 91, 100, 0.16)' }
        }
      }
    }
  })
}

onMounted(() => {
  loadDashboardSummary()
  loadTodayTeacherSchedules()
  createLineChart()
  createBarChart()
  dashboardRealtimeTimer = window.setInterval(() => {
    currentDateTime.value = new Date()
    loadTodayTeacherSchedules({ quiet: true })
  }, 60000)
  // Start carousel auto-advance after initial load
  nextTick(() => startCarouselAutoAdvance())
})

onUnmounted(() => {
  if (dashboardRealtimeTimer) window.clearInterval(dashboardRealtimeTimer)
  if (lineChartInstance) lineChartInstance.destroy()
  if (barChartInstance) barChartInstance.destroy()
})

function handleLogout() {
  logout()
  router.push('/')
}

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

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #30353a;
}
.role {
  font-size: 0.88rem;
  color: #444;
  font-weight: 500;
}
.email {
  font-size: 0.82rem;
  color: #888;
  word-break: break-all;
}

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
  margin-bottom: 28px;
}
.page-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #68747d;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.page-title {
  margin: 0;
  color: #202830;
  font-size: clamp(2rem, 3vw, 2.55rem);
  font-weight: 700;
  letter-spacing: -0.04em;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* Notification */
.notif-wrap {
  position: relative;
  padding-top: 6px;
}
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
  width: 540px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  z-index: 999;
  overflow: hidden;
}
.notif-panel-header {
  padding: 20px 20px 0;
}
.notif-panel-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
}
.notif-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 0;
}
.notif-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 20px;
  transition: background 0.18s, color 0.18s;
}
.notif-tab.active {
  background: #30353a;
  color: #fff;
}
.notif-see-all {
  margin-left: auto;
  font-size: 0.82rem;
  color: #888;
  cursor: pointer;
  text-decoration: underline;
}
.notif-see-all:hover { color: #30353a; }
.notif-section-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #333;
  padding: 12px 20px 6px;
}
.notif-list-wrap {
  max-height: 340px;
  overflow-y: auto;
  padding-bottom: 8px;
}
.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-empty {
  text-align: center;
  font-size: 0.85rem;
  color: #aaa;
  padding: 24px 20px;
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background 0.15s;
  cursor: pointer;
}
.notif-item:hover { background: #f4f5f5; }
.notif-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.notif-text {
  flex: 1;
  font-size: 0.85rem;
  color: #333;
  line-height: 1.45;
}
.notif-unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #626a72;
  flex-shrink: 0;
}

/* Stat Cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  border-radius: 16px;
  padding: 26px 28px 22px;
  box-shadow: 0 4px 18px rgba(48, 53, 58,0.10);
  background: #fff;
  color: #30353a;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 0.88rem;
  color: #888;
  font-weight: 400;
}
.stat-icon { display: flex; align-items: center; }
.stat-value {
  font-size: 2.8rem;
  font-weight: 600;
  color: #30353a;
  line-height: 1.1;
}
.stat-sub {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 4px;
}

/* Today's teacher schedule carousel */
.today-teachers-section { position: relative; margin-bottom: 28px; padding: 26px 28px 18px; overflow: visible; border: 1px solid #bcc4c9; border-radius: 20px; background: linear-gradient(145deg, #f7f8f9 0%, #dfe3e6 52%, #f2f4f5 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 12px 32px rgba(36,47,55,.13); }
.today-teachers-header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.today-section-eyebrow { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; color: #52655d; font-size: .68rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.today-section-eyebrow i { width: 8px; height: 8px; border: 2px solid #c9e1d2; border-radius: 50%; background: #4b8b65; box-shadow: 0 0 0 3px #e8f3ec; }
.today-teachers-header h2 { margin: 0; color: #202a31; font-size: 1.35rem; letter-spacing: -.025em; line-height: 1.35; }
.today-teachers-header p { margin: 5px 0 0; color: #63717a; font-size: .8rem; }
.today-teachers-header p span { margin-left: 7px; padding-left: 9px; border-left: 1px solid #ccd4d8; color: #89939a; }
/* Table format styles */
.today-schedule-table-wrap { 
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255,255,255,0.7);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  position: relative;
  animation: tableSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
}
.today-schedule-table-wrap.dragging {
  cursor: grabbing;
}
@keyframes tableSlideIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.today-schedule-table {
  --drag-shift: 0px;
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  background: #fff;
  animation: none;
  will-change: transform;
}
.carousel-enabled .today-schedule-table {
  animation: infiniteCarousel 34s linear infinite;
}
@keyframes infiniteCarousel {
  0% {
    transform: translateX(var(--drag-shift, 0px));
  }
  100% {
    transform: translateX(calc(var(--drag-shift, 0px) - 50%));
  }
}
.teacher-col-header { 
  padding: 22px 18px 20px;
  text-align: center;
  border-bottom: 3px solid #e1e6e9;
  border-right: 1px solid #e8ecf0;
  background: linear-gradient(180deg, #fbfcfd 0%, #f3f5f7 100%);
  position: relative;
  min-width: 240px;
  width: 240px;
  max-width: 240px;
  transition: all 0.3s ease;
  vertical-align: top;
}
.teacher-col-header:last-child {
  border-right: none;
}
.teacher-header-avatar { 
  width: 64px; 
  height: 64px; 
  border: 3px solid #fff; 
  border-radius: 16px; 
  object-fit: cover; 
  box-shadow: 0 6px 16px rgba(36,48,56,0.14); 
  margin: 0 auto 12px;
  display: block;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.teacher-col-header:hover .teacher-header-avatar {
  transform: scale(1.08) rotate(2deg);
}
.teacher-header-info { 
  text-align: center; 
}
.teacher-header-name { 
  display: block; 
  font-weight: 700; 
  color: #202830; 
  font-size: 0.95rem; 
  margin-bottom: 6px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  line-height: 1.3;
}
.teacher-header-status { 
  display: inline-block; 
  flex: 0 0 auto; 
  padding: 6px 10px; 
  border-radius: 8px; 
  font-size: 0.62rem; 
  font-weight: 800; 
  letter-spacing: 0.05em; 
  white-space: nowrap;
  text-transform: uppercase;
  animation: statusPulse 1.5s ease-in-out infinite;
}
.teacher-header-status.is-live { 
  color: #146a3a; 
  border: 1.5px solid #4caf50; 
  background: #e8f5e9;
  box-shadow: 0 2px 6px rgba(76,175,80,0.15);
}
@keyframes statusPulse {
  0%, 100% { box-shadow: 0 2px 6px rgba(76,175,80,0.15); }
  50% { box-shadow: 0 2px 12px rgba(76,175,80,0.3); }
}
.teacher-header-status.is-next { 
  color: #5d4e1f; 
  border: 1.5px solid #ffa726; 
  background: #fff3e0;
  box-shadow: 0 2px 6px rgba(255,167,38,0.12);
}
.teacher-header-status.is-done { 
  color: #546e7a; 
  border: 1.5px solid #90a4ae; 
  background: #eceff1;
  box-shadow: 0 2px 6px rgba(144,164,174,0.12);
}
.schedule-row {
  border-bottom: 1px solid #e8ecf0;
  transition: background 0.15s ease;
}
.schedule-row:hover {
  background: #f8f9fa;
}
.schedule-cell {
  padding: 14px 12px;
  border-right: 1px solid #e8ecf0;
  text-align: center;
  vertical-align: top;
  min-height: 130px;
  display: table-cell;
  min-width: 240px;
  width: 240px;
  max-width: 240px;
}
.schedule-cell:last-child { 
  border-right: none; 
}
.schedule-entry { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  min-height: 110px; 
  padding: 13px 12px 12px;
  border: 1.5px solid #e1e6e9;
  border-radius: 12px; 
  background: #f9fafb;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(25, 35, 45, 0.04);
}
.schedule-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: all 0.3s ease;
}
.schedule-entry.is-current { 
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-color: #4caf50;
  box-shadow: 0 3px 10px rgba(76,175,80,0.12), inset 0 1px 0 rgba(255,255,255,0.5);
}
.schedule-entry.is-current::before {
  background: #4caf50;
  animation: liveIndicator 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes liveIndicator {
  0%, 100% { height: 3px; background: #4caf50; }
  50% { height: 4px; background: #66bb6a; }
}
.schedule-entry.is-upcoming { 
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-color: #ffa726;
  box-shadow: 0 3px 10px rgba(255,167,38,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
}
.schedule-entry.is-upcoming::before {
  background: #ffa726;
}
.schedule-entry.is-complete { 
  opacity: 0.6; 
  background: #eceff1;
  border-color: #90a4ae;
  box-shadow: 0 2px 8px rgba(144,164,174,0.08);
}
.schedule-entry.is-complete::before {
  background: #90a4ae;
}
.schedule-entry:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.12);
}
.schedule-time { 
  display: block; 
  font-weight: 700; 
  font-size: 0.78rem; 
  color: #1a2332; 
  text-align: center;
  letter-spacing: 0.01em;
}
.schedule-time small { 
  display: block; 
  margin-top: 3px; 
  font-size: 0.66rem; 
  font-weight: 600; 
  color: #64727d;
}
.schedule-details { 
  display: flex; 
  flex-direction: column; 
  gap: 3px;
  flex: 1;
  justify-content: center;
}
.schedule-subject { 
  display: block; 
  color: #1f2937; 
  font-size: 0.79rem; 
  font-weight: 700; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  line-height: 1.2;
}
.schedule-section { 
  display: block; 
  color: #64727d; 
  font-size: 0.68rem; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  font-weight: 500;
}
.schedule-label { 
  display: inline-block; 
  padding: 4px 8px; 
  border-radius: 6px; 
  background: #f0f3f5; 
  color: #546e7a; 
  font-size: 0.56rem; 
  font-style: normal; 
  font-weight: 800; 
  text-transform: uppercase; 
  text-align: center;
  letter-spacing: 0.04em;
  margin: 0 auto;
  min-width: max-content;
  animation: labelFadeIn 0.6s ease forwards;
  opacity: 0;
}
@keyframes labelFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.schedule-entry.is-upcoming .schedule-label { 
  color: #5d4e1f; 
  background: #ffd699;
}
.schedule-entry.is-current .schedule-label { 
  color: #146a3a; 
  background: #81c784;
  animation: labelPulse 1.5s ease-in-out infinite;
  opacity: 1;
}
@keyframes labelPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.today-teachers-loading, .today-teachers-empty { 
  display: flex; 
  min-height: 150px; 
  align-items: center; 
  justify-content: center; 
  flex-direction: column; 
  color: #747d84; 
  font-size: 0.76rem; 
  text-align: center;
}
.today-teachers-empty span { 
  color: #2c3e50; 
  font-size: 0.92rem; 
  font-weight: 700;
  margin-bottom: 6px;
}
.today-teachers-empty p { 
  margin: 0; 
  color: #818c93; 
  font-size: 0.72rem;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}
.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  min-height: 320px;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}
.chart-card.chart-expanded {
  grid-column: 1 / -1;
}
.chart-card.chart-hidden {
  display: none;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  display: flex;
  transition: color 0.2s;
}
.expand-btn:hover { color: #30353a; }
.chart-wrap {
  flex: 1;
  min-height: 0;
  height: 260px;
  position: relative;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 36px 28px;
  width: 560px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}
.modal-close {
  position: absolute;
  top: 18px;
  right: 22px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #555;
  line-height: 1;
}
.modal-close:hover { color: #111; }
.modal-header { margin-bottom: 18px; }
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}
.modal-sub {
  font-size: 0.88rem;
  color: #888;
}
.modal-teacher-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-teacher-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #c4c9cd;
  flex-shrink: 0;
}
.modal-teacher-info { flex: 1; }
.modal-teacher-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
}
.modal-hours-badge {
  background: #8b9298;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 6px 18px;
  border-radius: 20px;
  white-space: nowrap;
}
.modal-schedule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-sched-card {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 14px 16px;
}
.modal-sched-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.modal-day-badge {
  background: #e0f0ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.modal-sched-time {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-dur {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-subject {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}
.modal-sched-section {
  font-size: 0.82rem;
  color: #888;
}
.modal-summary {
  background: #8b9298;
  border-radius: 14px;
  padding: 18px 22px;
  color: #fff;
}
.modal-summary-label {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 14px;
}
.modal-summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}
.modal-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.modal-summary-key {
  font-size: 0.78rem;
  opacity: 0.85;
}
.modal-summary-val {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

/* Logout Modal */
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
.logout-modal-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.logout-modal-sub {
  font-size: 0.9rem;
  color: #777;
  margin: 0 0 8px;
}
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
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .today-teachers-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .main { padding: 20px 16px 32px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .today-teachers-section { padding: 18px 16px 18px; }
  .today-teachers-header { align-items: flex-start; flex-direction: column; }
  .today-teachers-grid { grid-template-columns: 1fr; }
  .today-carousel-stage { padding-inline: 23px; }
  .today-stage-arrow { width: 36px; height: 36px; font-size: 1.7rem; }
  .today-stage-arrow.previous { left: 0; }
  .today-stage-arrow.next { right: 0; }
  .sidebar { width: 200px; min-width: 200px; }
}

</style>
