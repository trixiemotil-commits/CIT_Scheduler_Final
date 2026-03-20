<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="userAvatar" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ userEmail }}</div>
      </div>
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
      <header class="main-header">
        <div>
          <h1 class="page-title">My Schedule</h1>
          <p class="page-sub">View your teaching schedule and availability</p>
        </div>
      </header>

      <!-- Schedule Card -->
      <section class="schedule-card">
        <div class="card-top">
          <div>
            <div class="card-title">My Teaching Schedule</div>
            <div class="card-sub">{{ loadError || (isLoading ? 'Loading your schedule...' : 'Your weekly class schedule and room assignments') }}</div>
          </div>
          <div class="filter-wrap">
            <select class="subject-select" v-model="selectedSubject">
              <option value="">All Subject</option>
              <option v-for="opt in subjectOptions" :key="opt.code" :value="opt.code">
                {{ opt.label }}
              </option>
            </select>
            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <!-- Grid -->
        <div class="table-scroll">
          <table class="sched-table">
            <thead>
              <tr>
                <th class="th-time">Time</th>
                <th
                  v-for="(day, di) in DAYS"
                  :key="day"
                  :class="['th-day', { 'th-day-active': expandedDay === day }]"
                  :style="expandedDay === day ? { width: '300px', minWidth: '300px' } : expandedDay ? { width: '60px', minWidth: '60px' } : { width: '120px', minWidth: '120px' }"
                  @click="toggleExpand(day)"
                >
                  {{ expandedDay && expandedDay !== day ? DAY_SHORT[day] : day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rowCells, ri) in tableMatrix" :key="ri">
                <td class="td-time">{{ TIME_SLOTS[ri].label }}</td>
                <template v-for="(cell, ci) in rowCells" :key="ci">
                  <!-- Class cell -->
                  <td
                    v-if="cell.type === 'start'"
                    :rowspan="cell.rowspan"
                    :class="['td-class', cell.cls.color === 'green' ? 'cell-green' : 'cell-yellow', { 'col-expanded': expandedDay === DAYS[ci] }]"
                    @click="expandedDay === DAYS[ci] ? openModal(cell.cls) : toggleExpand(DAYS[ci])"
                  >
                    <!-- Compact view -->
                    <template v-if="expandedDay !== DAYS[ci]">
                      <div class="cell-room-sm">{{ cell.cls.room }}</div>
                      <div class="cell-subject-sm">{{ cell.cls.subject }}</div>
                      <div class="cell-tag-sm">{{ cell.cls.parallel ? 'Parallel' : 'Non-parallel' }}</div>
                    </template>
                    <!-- Expanded view -->
                    <template v-else>
                      <div class="cell-badge-row">
                        <span :class="['cell-badge', cell.cls.parallel ? 'badge-p' : 'badge-np']">
                          {{ cell.cls.parallel ? 'Parallel' : 'Non-parallel' }}
                        </span>
                      </div>
                      <div class="cell-exp-line">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cell-exp-icon">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <span class="cell-exp-room">{{ cell.cls.room }}</span>
                      </div>
                      <div class="cell-exp-line">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cell-exp-icon">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        <strong class="cell-exp-subject">{{ cell.cls.subject }}</strong>
                      </div>
                      <div class="cell-exp-section">{{ cell.cls.section }}</div>
                    </template>
                  </td>
                  <!-- Consultation cell -->
                  <td
                    v-else-if="cell.type === 'consult'"
                    :rowspan="cell.rowspan"
                    :class="['td-class', 'cell-blue', { 'col-expanded': expandedDay === DAYS[ci] }]"
                  >
                    <template v-if="expandedDay !== DAYS[ci]">
                      <div class="cell-room-sm">Consultation</div>
                      <div class="cell-subject-sm">{{ formatTimeRange12(cell.consult.start, cell.consult.end) }}</div>
                      <div class="cell-tag-sm">Office Hours</div>
                    </template>
                    <template v-else>
                      <div class="cell-badge-row">
                        <span class="cell-badge badge-consult">Consultation</span>
                      </div>
                      <div class="cell-exp-line">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cell-exp-icon">
                          <circle cx="12" cy="12" r="9"/>
                          <polyline points="12 7 12 12 15 15"/>
                        </svg>
                        <strong class="cell-exp-subject">Consultation Hours</strong>
                      </div>
                      <div class="cell-exp-section">{{ formatTimeRange12(cell.consult.start, cell.consult.end) }}</div>
                    </template>
                  </td>
                  <!-- Empty cell -->
                  <td
                    v-else-if="cell.type === 'empty'"
                    :class="['td-empty', { 'col-expanded': expandedDay === DAYS[ci] }]"
                  ></td>
                  <!-- occupied: skip -->
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- ═══ View Schedule Modal (non-parallel) ═══ -->
    <Teleport to="body">
      <div v-if="showModal && selectedClass && !selectedClass.parallel" class="modal-overlay" @click.self="closeModal">
        <div class="view-modal">
          <button class="modal-close" @click="closeModal">✕</button>
          <h2 class="modal-title">View Schedule</h2>
          <div class="modal-info-row">
            <span class="modal-key">Subject:</span>
            <span class="modal-val">{{ selectedClass.subject }}</span>
          </div>
          <div class="modal-info-row">
            <span class="modal-key">Room:</span>
            <span class="modal-val">{{ selectedClass.room }}</span>
          </div>
          <div class="modal-info-row">
            <span class="modal-key">Teacher:</span>
            <span class="modal-val">{{ selectedClass.teacher }}</span>
          </div>
          <div class="modal-info-row">
            <span class="modal-key">Section:</span>
            <span class="modal-val">{{ selectedClass.section }}</span>
          </div>
          <div class="modal-time-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ formatTimeRange12(selectedClass.start, selectedClass.end) }}</span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Teacher Schedule Modal (parallel) ═══ -->
    <Teleport to="body">
      <div v-if="showModal && selectedClass && selectedClass.parallel" class="modal-overlay" @click.self="closeModal">
        <div class="teacher-modal">
          <button class="modal-close" @click="closeModal">✕</button>
          <h2 class="modal-title">Teacher Schedule</h2>
          <div class="modal-teacher-row">
            <img :src="selectedClass.avatar" class="modal-teacher-avatar" alt="" />
            <div class="modal-teacher-info">
              <div class="modal-teacher-name">{{ selectedClass.teacher }}</div>
              <div class="modal-parallel-label">Parallel Schedule</div>
            </div>
          </div>
          <div v-for="(sr, idx) in selectedClass.parallelSections" :key="idx" class="modal-section-row">
            <span class="modal-key">Section &amp; Room {{ idx + 1 }}:</span>
            <span class="modal-section-val">{{ sr.section }} /{{ sr.room }}</span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Modal ═══ -->
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
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/* ── User ── */
const user = computed(() => getUser())
const userEmail = computed(() => user.value?.email || 'teacher@example.com')
const userAvatar = computed(() => user.value?.avatar || 'https://i.pravatar.cc/100?img=47')
const userName = computed(() => {
  const fullName = typeof user.value?.name === 'string' ? user.value.name.trim() : ''
  if (fullName) return fullName

  const fromParts = `${user.value?.firstName || ''} ${user.value?.lastName || ''}`.trim()
  return fromParts
})

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

/* ── Schedule grid constants ── */
const ALL_STARTS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']
const TIME_SLOTS = ALL_STARTS.slice(0, -1).map((s, i) => ({
  start: s,
  end:   ALL_STARTS[i + 1],
  label: `${formatTime12(s)}-${formatTime12(ALL_STARTS[i + 1])}`
}))
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = { Monday: 'Monday', Tuesday: 'Tues', Wednesday: 'Wed', Thursday: 'Thurs', Friday: 'Fri', Saturday: 'Sat' }

/* ── Schedule data ── */
const scheduleData = ref([])
const consultationData = ref([])
const isLoading = ref(false)
const loadError = ref('')

function to24Hour(value) {
  const normalized = (value || '').toString().trim()
  const plainTime = normalized.match(/^(\d{2}):(\d{2})$/)
  if (plainTime) {
    return `${plainTime[1]}:${plainTime[2]}`
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) {
    return ''
  }

  let hour = Number(match[1])
  const minute = match[2]
  const period = match[3].toUpperCase()

  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${minute}`
}

function formatTime12(value) {
  const normalized = to24Hour(value)
  if (!normalized) {
    return value || ''
  }

  const [hourRaw, minute] = normalized.split(':').map(Number)
  const suffix = hourRaw >= 12 ? 'pm' : 'am'
  const hour12 = (hourRaw % 12) || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function formatTimeRange12(start, end) {
  const start12 = formatTime12(start)
  const end12 = formatTime12(end)
  if (!start12 && !end12) {
    return ''
  }
  return `${start12}-${end12}`
}

function scheduleColor(colorToken) {
  return colorToken === 'color-yellow' ? 'yellow' : 'green'
}

function timeToMinutes(value) {
  const hhmm = to24Hour(value)
  if (!hhmm) {
    return Number.NaN
  }

  const [hour, minute] = hhmm.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return Number.NaN
  }

  return (hour * 60) + minute
}

function dayLabel(day) {
  const normalized = (day || '').toString().trim().toLowerCase()
  return DAYS.find((d) => d.toLowerCase() === normalized) || ''
}

function slotIndexFromMinutes(totalMinutes) {
  if (Number.isNaN(totalMinutes)) {
    return -1
  }

  const hour = Math.floor(totalMinutes / 60)
  return ALL_STARTS.findIndex((start) => Number(start.slice(0, 2)) === hour)
}

function mapConsultationsToSchedule(consultations) {
  if (!Array.isArray(consultations)) {
    return []
  }

  return consultations
    .map((slot) => {
      const day = dayLabel(slot.dayOfWeek)
      const startMinutes = timeToMinutes(slot.startTime)
      const endMinutes = timeToMinutes(slot.endTime)
      const startIndex = slotIndexFromMinutes(startMinutes)
      const endIndex = slotIndexFromMinutes(endMinutes)

      if (!day || startIndex < 0 || endIndex <= startIndex) {
        return null
      }

      return {
        id: slot.id,
        day,
        start: to24Hour(slot.startTime),
        end: to24Hour(slot.endTime),
        startIndex,
        rowspan: endIndex - startIndex,
      }
    })
    .filter(Boolean)
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
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.')
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to load schedules.')
    }

    throw new Error(body.message || 'Unable to load schedule.')
  }

  return body
}

function mapEntriesToSchedule(entries) {
  const grouped = new Map()
  const avatar = user.value?.avatar || 'https://i.pravatar.cc/100?img=47'

  entries.forEach((entry) => {
    const day = entry.day
    const start = to24Hour(entry.timeIn)
    const end = to24Hour(entry.timeOut)
    if (!day || !start || !end) {
      return
    }

    const baseRecord = {
      day,
      start,
      end,
      room: entry.room || '',
      subject: entry.subject || 'Untitled Subject',
      code: entry.subject || 'Untitled Subject',
      section: entry.section || '',
      parallel: Boolean(entry.parallel),
      color: scheduleColor(entry.color),
      teacher: entry.teacher || userName.value || 'Teacher',
      avatar,
      parallelSections: [],
    }

    if (baseRecord.parallel) {
      const key = entry.parallelGroupId || `${day}|${start}|${end}|${baseRecord.subject}|${baseRecord.teacher}`
      if (!grouped.has(key)) {
        grouped.set(key, baseRecord)
      }

      const groupedEntry = grouped.get(key)
      if (entry.section && !groupedEntry.parallelSections.some((slot) => slot.section === entry.section && slot.room === (entry.room || ''))) {
        groupedEntry.parallelSections.push({
          section: entry.section,
          room: entry.room || '',
        })
      }

      if (!groupedEntry.section) {
        groupedEntry.section = entry.section || ''
      }
      if (!groupedEntry.room) {
        groupedEntry.room = entry.room || ''
      }
      return
    }

    const key = `${day}|${start}|${end}|${entry.section || ''}|${baseRecord.subject}|${baseRecord.teacher}`
    grouped.set(key, baseRecord)
  })

  return Array.from(grouped.values()).sort((a, b) => {
    const byDay = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    if (byDay !== 0) return byDay
    return a.start.localeCompare(b.start)
  })
}

async function loadSchedule() {
  isLoading.value = true
  loadError.value = ''

  try {
    const teacherName = userName.value
    if (!teacherName) {
      scheduleData.value = []
      consultationData.value = []
      return
    }

    const [directPayload, consultationPayload] = await Promise.all([
      apiRequest(`/schedules?teacher=${encodeURIComponent(teacherName)}`),
      apiRequest(`/consultations?teacher=${encodeURIComponent(teacherName)}`).catch(() => ({ consultations: [] })),
    ])
    const apiEntries = Array.isArray(directPayload.entries) ? directPayload.entries : []
    const consultations = Array.isArray(consultationPayload.consultations) ? consultationPayload.consultations : []

    scheduleData.value = mapEntriesToSchedule(apiEntries)
    consultationData.value = mapConsultationsToSchedule(consultations)
  } catch (error) {
    scheduleData.value = []
    consultationData.value = []
    loadError.value = error.message || 'Unable to load schedule.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSchedule)

/* ── Subject filter ── */
const selectedSubject = ref('')
const CONSULTATION_FILTER_CODE = '__consultation__'

const filteredClasses = computed(() =>
  !selectedSubject.value
    ? scheduleData.value
    : selectedSubject.value === CONSULTATION_FILTER_CODE
      ? []
      : scheduleData.value.filter((c) => c.code === selectedSubject.value)
)

const filteredConsultations = computed(() => {
  if (!selectedSubject.value) {
    return consultationData.value
  }
  return selectedSubject.value === CONSULTATION_FILTER_CODE ? consultationData.value : []
})

const subjectOptions = computed(() => {
  const seen = new Set()
  const subjects = scheduleData.value
    .filter((c) => {
      if (seen.has(c.code)) return false
      seen.add(c.code)
      return true
    })
    .map((c) => ({ code: c.code, label: c.code }))

  return [
    ...subjects,
    { code: CONSULTATION_FILTER_CODE, label: 'Consultation Hours' },
  ]
})

/* ── Expand day column ── */
const expandedDay = ref(null)
function toggleExpand(day) {
  expandedDay.value = expandedDay.value === day ? null : day
}

/* ── Build table matrix (handles rowspan occupation) ── */
const tableMatrix = computed(() => {
  const data = filteredClasses.value
  const consultations = filteredConsultations.value
  const occupied = Array.from({ length: DAYS.length }, () => new Array(TIME_SLOTS.length).fill(false))

  return TIME_SLOTS.map((slot, ri) =>
    DAYS.map((day, ci) => {
      if (occupied[ci][ri]) return { type: 'occupied' }

      const cls = data.find(c => c.day === day && c.start === slot.start)
      if (cls) {
        const startIndex = ALL_STARTS.indexOf(cls.start)
        const endIndex = ALL_STARTS.indexOf(cls.end)
        const span = startIndex >= 0 && endIndex > startIndex ? endIndex - startIndex : 1
        for (let r = ri + 1; r < ri + span && r < TIME_SLOTS.length; r++) occupied[ci][r] = true
        return { type: 'start', cls, rowspan: span }
      }

      const consult = consultations.find((slotItem) => slotItem.day === day && slotItem.startIndex === ri)
      if (consult) {
        for (let r = ri + 1; r < ri + consult.rowspan && r < TIME_SLOTS.length; r++) occupied[ci][r] = true
        return { type: 'consult', consult, rowspan: consult.rowspan }
      }

      return { type: 'empty' }
    })
  )
})

/* ── Modal ── */
const showModal    = ref(false)
const selectedClass = ref(null)
function openModal(cls) { selectedClass.value = cls; showModal.value = true }
function closeModal()   { showModal.value = false }

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
  margin-bottom: 28px;
}
.page-title {
  font-size: 2.4rem;
  font-weight: 700;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub { font-size: 0.95rem; color: #777; margin-top: 4px; }

/* ── Schedule Card ── */
.schedule-card {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
  padding: 24px 24px 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.card-title { font-size: 1.05rem; font-weight: 700; color: #111; }
.card-sub   { font-size: 0.82rem; color: #888; margin-top: 2px; }

/* Filter dropdown */
.filter-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.subject-select {
  appearance: none;
  border: 1.5px solid #d0d0d0;
  border-radius: 8px;
  padding: 7px 36px 7px 14px;
  font-family: inherit;
  font-size: 0.85rem;
  color: #333;
  background: #fff;
  cursor: pointer;
  outline: none;
}
.subject-select:focus { border-color: #1b4332; }
.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #555;
}

/* ── Table ── */
.table-scroll {
  flex: 1;
  overflow: auto;
}

.sched-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

/* ─ Header: Time Column ─ */
.th-time {
  background: #1b4332;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  padding: 14px 12px;
  white-space: nowrap;
  width: 110px;
  position: sticky;
  top: 0;
  z-index: 2;
  border-right: 1px solid #2d6a4f;
}

/* ─ Header: Day Columns ─ */
.th-day {
  background: #1b4332;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  padding: 14px 8px;
  cursor: pointer;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  border-left: 1px solid #2d6a4f;
  user-select: none;
  transition: background 0.2s ease, width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.th-day:hover { background: #2d6a4f; }
.th-day-active { background: #2d6a4f; }

/* ─ Body: Time Column ─ */
.td-time {
  background: #f9fafb;
  font-size: 0.78rem;
  color: #555;
  text-align: center;
  padding: 0 10px;
  white-space: nowrap;
  border: 1px solid #e8e8e8;
  height: 52px;
  vertical-align: middle;
}

/* ─ Body: Empty Cells ─ */
.td-empty {
  border: 1px solid #e8e8e8;
  vertical-align: top;
  width: 120px;
  min-width: 120px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.td-empty.col-expanded {
  width: 300px;
  min-width: 300px;
}

/* ─ Body: Class Cells ─ */
.td-class {
  border: 1px solid rgba(0, 0, 0, 0.08);
  vertical-align: middle;
  padding: 10px 12px;
  cursor: pointer;
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  transition: filter 0.2s ease, width 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.td-class:hover {
  filter: brightness(0.94);
}

.td-class.col-expanded {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  padding: 14px 16px;
}

/* ─ Cell Colors ─ */
.cell-green {
  background: #1b4332;
  color: #fff;
}

.cell-yellow {
  background: #e8a020;
  color: #fff;
}

.cell-blue {
  background: #4a90d9;
  color: #fff;
}

/* ─ Compact View: Text Styling ─ */
.cell-room-sm {
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 3px;
  text-align: left;
}

.cell-subject-sm {
  font-size: 0.75rem;
  line-height: 1.35;
  margin-bottom: 4px;
  text-align: left;
}

.cell-tag-sm {
  font-size: 0.7rem;
  opacity: 0.85;
  text-align: left;
}

/* ─ Expanded View: Badge ─ */
.cell-badge-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.cell-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.badge-np {
  background: rgba(255, 255, 255, 0.9);
  color: #1b4332;
}

.badge-p {
  background: rgba(255, 255, 255, 0.9);
  color: #e8a020;
}

.badge-consult {
  background: rgba(255, 255, 255, 0.92);
  color: #2f6fb0;
}

/* ─ Expanded View: Info Lines ─ */
.cell-exp-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}

.cell-exp-icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.cell-exp-room {
  font-size: 0.9rem;
  font-weight: 500;
}

.cell-exp-subject {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.cell-exp-section {
  font-size: 0.82rem;
  opacity: 0.85;
  margin-top: 4px;
  margin-left: 24px;
}

/* ── Modals — overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── View Schedule & Teacher Schedule — shared panel ── */
.view-modal,
.teacher-modal {
  position: relative;
  width: 420px;
  max-width: 94vw;
  padding: 32px 32px 28px;
  background: #fff;
  border-radius: 24px;
  border-top: 5px solid #1b4332;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
}

/* Close button */
.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffeaea;
  border: none;
  border-radius: 50%;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  color: #e63946;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.modal-close:hover {
  background: #e63946;
  color: #fff;
  transform: scale(1.08);
}

/* Title with divider */
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1b4332;
  margin: 0 0 20px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid #e6f2ec;
  letter-spacing: -0.3px;
}

/* Info rows — card tiles */
.modal-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: #f6faf8;
  border-radius: 10px;
  font-size: 0.92rem;
}

.modal-key {
  min-width: 80px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #40916c;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.modal-val {
  font-weight: 500;
  color: #1a1a1a;
}

/* Time pill at bottom */
.modal-time-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 9px 20px;
  background: #1b4332;
  color: #fff;
  border-radius: 20px;
  font-size: 0.92rem;
  font-weight: 600;
}

/* ── Teacher Schedule Modal extras ── */
.modal-teacher-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f3faf5;
  border-radius: 14px;
}

.modal-teacher-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #74c69d;
  flex-shrink: 0;
}

.modal-teacher-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-teacher-name { font-size: 1.1rem; font-weight: 700; color: #111; }

.modal-parallel-label {
  display: inline-block;
  padding: 3px 12px;
  background: #d8f3dc;
  color: #1b4332;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
}

.modal-section-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: #f6faf8;
  border-radius: 10px;
  font-size: 0.92rem;
}

.modal-section-val { font-weight: 600; color: #40916c; }

/* ── Logout Modal ── */
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
  .main { padding: 20px 16px 32px; }
  .sidebar { width: 200px; min-width: 200px; }
}
</style>
