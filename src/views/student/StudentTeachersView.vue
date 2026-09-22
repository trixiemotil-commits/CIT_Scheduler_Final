<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshTeachers" />
      <div class="mobile-app">
    <!-- Header -->
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Browse Teachers</div>
      <div style="width:32px"></div>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input v-model="search" type="text" class="search-input" placeholder="Search by name or subject..." />
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <button
        v-for="f in filters" :key="f"
        :class="['filter-chip', { active: activeFilter === f }]"
        @click="activeFilter = f"
      >{{ f }}</button>
    </div>

    <!-- Teacher List -->
    <div :class="['teacher-list', { 'is-loading': loadingTeachers }]">
      <div v-if="loadingTeachers" class="empty-state-card loading-state" role="status" aria-label="Loading teachers">
        <div class="loading-panel">
          <div class="loading-orbit" aria-hidden="true"><span></span></div>
          <div class="loading-copy">
            <strong>Loading teachers</strong>
            <span>Finding teachers and consultation hours...</span>
          </div>
          <div class="teacher-skeleton" aria-hidden="true">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-chips"><span></span><span></span></div>
            </div>
          </div>
          <div class="teacher-skeleton second" aria-hidden="true">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-chips"><span></span><span></span></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="loadError" class="empty-state-card error">{{ loadError }}</div>
      <div v-else-if="!visibleTeacherCount" class="empty-state-card">No teachers found.</div>

      <template v-if="(activeFilter === 'All' || activeFilter === 'Subject Teacher') && visibleSubjectTeachers.length">
        <div v-if="activeFilter === 'Subject Teacher'" class="section-title">Subject Teachers</div>
        <div v-for="t in visibleSubjectTeachers" :key="t.id" class="teacher-card">
          <div class="teacher-top">
            <div class="teacher-avatar" :style="{ background: t.color }">
              <img v-if="t.avatar" :src="t.avatar" :alt="`${t.name} profile`" />
              <span v-else>{{ t.initials }}</span>
            </div>
            <div class="teacher-meta">
              <div class="teacher-name">{{ t.name }}</div>
              <div class="teacher-type-pill subject">Subject Teacher</div>
              <div class="teacher-subjects-clean">
                <span v-for="subject in displayedSubjects(t)" :key="subject" class="subject-chip">{{ subject }}</span>
                <span v-if="hiddenSubjectCount(t)" class="subject-chip more">+{{ hiddenSubjectCount(t) }} more</span>
              </div>
              <div v-if="t.status === 'In School' && t.consultationSlots.length" class="consultation-hours">
                <div class="hours-label">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  Consultation hours
                </div>
                <div class="hours-list">
                  <span v-for="slot in t.consultationSlots" :key="slot.id" class="hours-chip">{{ formatSlotLabel(slot) }}</span>
                </div>
              </div>
            </div>
            <span :class="['status-pill', statusClass(t.status)]">{{ t.status }}</span>
          </div>
          <div v-if="t.status === 'In School' && canBookTeacher(t)" class="teacher-footer">
            <span class="price">&nbsp;</span>
            <button
              class="action-btn green"
              @click="openRequest(t)"
            >
              {{ consultationButtonLabel(t) }}
            </button>
          </div>
        </div>
      </template>

      <template v-if="(activeFilter === 'All' || activeFilter === 'Available Teacher') && visibleAvailableTeachers.length">
        <div class="section-title">Available Teachers</div>
        <div v-for="t in visibleAvailableTeachers" :key="t.id" class="teacher-card">
          <div class="teacher-top">
            <div class="teacher-avatar" :style="{ background: t.color }">
              <img v-if="t.avatar" :src="t.avatar" :alt="`${t.name} profile`" />
              <span v-else>{{ t.initials }}</span>
            </div>
            <div class="teacher-meta">
              <div class="teacher-name">{{ t.name }}</div>
              <div class="teacher-type-pill available">Available Teacher</div>
              <div class="teacher-subjects-clean">
                <span v-for="subject in displayedSubjects(t)" :key="subject" class="subject-chip">{{ subject }}</span>
                <span v-if="hiddenSubjectCount(t)" class="subject-chip more">+{{ hiddenSubjectCount(t) }} more</span>
              </div>
            </div>
            <span :class="['status-pill', statusClass(t.status)]">{{ t.status }}</span>
          </div>
          <div v-if="t.status === 'In School' && canBookTeacher(t)" class="teacher-footer">
            <span class="price">&nbsp;</span>
            <button
              class="action-btn green"
              @click="openRequest(t)"
            >
              {{ consultationButtonLabel(t) }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Toast notification -->
    <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>

    <!-- ══ REQUEST CONSULTATION MODAL ══ -->
    <Teleport to="body">
      <Transition name="consultation-modal">
        <div v-if="showReqModal" class="modal-overlay" @click.self="showReqModal = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <span>Request Consultation</span>
          <button class="modal-close" @click="showReqModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="teacher-pill">
            <div class="tp-avatar" :style="{ background: selectedTeacher?.color }">
              <img v-if="selectedTeacher?.avatar" :src="selectedTeacher.avatar" :alt="`${selectedTeacher.name} profile`" />
              <span v-else>{{ selectedTeacher?.initials }}</span>
            </div>
            <div>
              <div class="tp-name">{{ selectedTeacher?.name }}</div>
              <div class="tp-subjects-clean">
                <span v-for="subject in displayedSubjects(selectedTeacher)" :key="subject" class="subject-chip">{{ subject }}</span>
                <span v-if="hiddenSubjectCount(selectedTeacher)" class="subject-chip more">+{{ hiddenSubjectCount(selectedTeacher) }} more</span>
              </div>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Subject</label>
            <select v-model="reqForm.subject" class="field-input">
              <option value="" disabled>Select subject</option>
              <option v-for="subject in selectedTeacher?.subjectList || []" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Reason</label>
            <select v-model="reqForm.reason" class="field-input">
              <option v-for="reason in CONSULTATION_REASONS" :key="reason" :value="reason">
                {{ reason }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Consultation Schedule</label>
            <template v-if="selectedTeacher?.isSubjectTeacher">
              <select v-model="reqForm.availabilityId" class="field-input">
                <option value="" disabled>Select assigned availability</option>
                <option v-for="slot in selectedTeacher?.consultationSlots || []" :key="slot.id" :value="slot.id">
                  {{ formatSlotLabel(slot) }}
                </option>
              </select>
            </template>
            <template v-else>
              <input v-model="reqForm.date" class="field-input" type="date" :min="today" />
              <input v-model="reqForm.time" class="field-input" type="time" min="07:00" max="17:00" />
            </template>
          </div>
          <div class="field-group">
            <label class="field-label">Short Description <span class="optional">(optional)</span></label>
            <textarea v-model="reqForm.description" class="field-input field-textarea" placeholder="Briefly describe your concern..." rows="3"></textarea>
          </div>
          <div v-if="reqError" class="msg-err">{{ reqError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" :disabled="isSubmittingRequest" @click="showReqModal = false">Cancel</button>
          <button class="modal-submit" :disabled="isSubmittingRequest" @click="submitRequest">
            {{ isSubmittingRequest ? 'Sending...' : 'Send Request' }}
          </button>
        </div>
      </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ VIEW PROFILE MODAL ══ -->
    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <span>Teacher Profile</span>
          <button class="modal-close" @click="showProfileModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="profile-hero">
            <div class="profile-avatar-lg" :style="{ background: selectedTeacher?.color }">
              <img v-if="selectedTeacher?.avatar" :src="selectedTeacher.avatar" :alt="`${selectedTeacher.name} profile`" />
              <span v-else>{{ selectedTeacher?.initials }}</span>
            </div>
            <div class="profile-hero-name">{{ selectedTeacher?.name }}</div>
            <div class="profile-subjects-clean">
              <span v-for="subject in displayedSubjects(selectedTeacher)" :key="subject" class="subject-chip">{{ subject }}</span>
              <span v-if="hiddenSubjectCount(selectedTeacher)" class="subject-chip more">+{{ hiddenSubjectCount(selectedTeacher) }} more</span>
            </div>
            <div class="stars-row" style="justify-content:center;margin-top:6px">
              <span class="stars">★★★★</span>
              <span class="rating">{{ selectedTeacher?.rating }} ({{ selectedTeacher?.reviews }} reviews)</span>
            </div>
            <span :class="['status-pill', statusClass(selectedTeacher?.status)]" style="margin-top:8px">{{ selectedTeacher?.status }}</span>
          </div>
          <div class="prof-row">
            <span class="prof-label">Specializations</span>
            <div class="tags-row" style="margin-top:6px">
              <span v-for="tag in selectedTeacher?.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="prof-row">
            <span class="prof-label">Consultation Fee</span>
            <span class="prof-value">N/A</span>
          </div>
          <div class="prof-row">
            <span class="prof-label">Availability</span>
            <span :class="['prof-avail', selectedTeacher?.available ? 'avail-yes' : 'avail-no']">
              {{ selectedTeacher?.available ? '✓ Available for bookings' : '✗ Not accepting bookings' }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showProfileModal = false">Close</button>
          <button v-if="selectedTeacher?.available" class="modal-submit" @click="requestFromProfile">Request Consultation</button>
        </div>
      </div>
    </div>

      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken, getUser } from '@/auth.js'
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import { notifyStudentDataChanged, useAutoRefresh } from '@/composables/useAutoRefresh.js'
import useNotifications from '@/composables/useNotifications'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const search       = ref('')
const activeFilter = ref('All')
const filters      = ['All', 'Subject Teacher', 'Available Teacher']
const loadingTeachers = ref(false)
const loadError = ref('')
const CONSULTATION_REASONS = [
  'Lesson Clarification',
  'Assignment Assistance',
  'Project Consultation',
  'Exam Preparation',
  'Grade Inquiry',
  'Career Guidance',
  'Other Academic Concern',
]

const teachers = ref([])
const currentUser = computed(() => getUser() || {})
const studentYearLevel = computed(() => String(currentUser.value.yearLevel || currentUser.value.grade || '').trim())
const studentSection = computed(() => String(currentUser.value.section || '').trim())

function normalizeSection(section) {
  return String(section || '').trim().toLowerCase()
}

function hasMatchingAssignment(teacher) {
  const year = studentYearLevel.value
  const section = studentSection.value

  if (!year || !section) {
    return true
  }

  const pairs = Array.isArray(teacher.assignedYearSections) ? teacher.assignedYearSections : []
  return pairs.some((pair) =>
    String(pair?.year || '').trim() === year
    && normalizeSection(pair?.section) === normalizeSection(section)
  )
}

function isSubjectTeacher(teacher) {
  return Boolean(teacher?.isSubjectTeacher)
}

function isAvailableTeacher(teacher) {
  return Boolean(teacher?.available)
}

function canBookTeacher(teacher) {
  if (!teacher?.available) return false
  if (!teacher?.isSubjectTeacher) return true
  return Boolean(scheduledSlotForToday(teacher))
}

function consultationButtonLabel(teacher) {
  if (teacher?.isSubjectTeacher) {
    const selectedSlot = scheduledSlotForToday(teacher)
    if (selectedSlot) return `Book ${selectedSlot.dayOfWeek} • ${selectedSlot.startTime}`
    return 'No hours on date'
  }
  return teacher?.available ? 'Book Consultation' : 'Request Consultation'
}

function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] || '?').toUpperCase()
}

function colorForName(name) {
  const palette = ['#e63946', '#3a86ff', '#6b7280', '#f4a261', '#9b5de5', '#00a896', '#577590']
  const text = String(name || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }
  return palette[Math.abs(hash) % palette.length]
}

function normalizeTeacherStatus(statusOrObj) {
  // Accept either a status string or a teacher object with fields from the DB/API.
  if (statusOrObj && typeof statusOrObj === 'object') {
    const t = statusOrObj
    const account = String(t.account_status || '').trim()
    if (account && account !== 'Active') return 'Offline'

    const resolvedStatus = String(t.status || '').trim().toLowerCase()
    if (resolvedStatus === 'offline') return 'Offline'
    if (resolvedStatus === 'on event') return 'On Event'
    if (
      t.teacher_clocked_out
      || (
        String(t.teacher_status || '').toLowerCase() === 'on leave'
        && (String(t.teacherAvailability || '').toLowerCase() === 'unavailable' || !t.teacher_time_in)
      )
    ) {
      return 'Offline'
    }
    if (resolvedStatus === 'on school' || resolvedStatus === 'in school') return 'In School'
    if (resolvedStatus === 'on meeting') return 'On Meeting'

    if (t.teacher_status_expires_at) {
      try {
        const expires = new Date(t.teacher_status_expires_at)
        if (!Number.isNaN(expires.getTime()) && expires <= new Date()) {
          return 'In School'
        }
      } catch (e) {
        // ignore parsing errors and fall through
      }
    }

    const statusRaw = String(t.teacher_status || t.status || '').trim().toLowerCase()
    if (statusRaw === 'on event' || statusRaw === 'on-event') return 'On Event'
    if (statusRaw === 'on meeting' || statusRaw === 'on-meeting') return 'On Meeting'
    if (statusRaw === 'on leave' || statusRaw === 'leave') return 'On Leave'
    return 'In School'
  }

  const normalized = String(statusOrObj || '').trim()
  const lower = normalized.toLowerCase()
  if (lower === 'on leave' || lower === 'leave') return 'On Leave'
  if (lower === 'offline') return 'Offline'
  if (lower === 'on event' || lower === 'on-event') return 'On Event'
  return 'In School'
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

function mapTeacher(teacher) {
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.filter(Boolean) : []
  const studentSubjects = Array.isArray(teacher.studentSubjects) ? teacher.studentSubjects.filter(Boolean) : []
  const assignedYearSections = Array.isArray(teacher.assignedYearSections) ? teacher.assignedYearSections : []
  const subjectAssignments = Array.isArray(teacher.subjectAssignments) ? teacher.subjectAssignments : []
  const resolvedStatus = normalizeTeacherStatus(teacher)
  const consultationSlots = Array.isArray(teacher.consultationSlots) ? teacher.consultationSlots : []
  const teacherAvailability = String(teacher.teacherAvailability || teacher.teacher_availability || 'Available').trim()

  const matchedSubjects = (studentYearLevel.value && studentSection.value)
    ? subjectAssignments
      .filter((entry) =>
        String(entry?.year || '').trim() === studentYearLevel.value
        && normalizeSection(entry?.section) === normalizeSection(studentSection.value)
      )
      .map((entry) => String(entry?.subject || '').trim())
      .filter(Boolean)
    : []

  const backendSubjectTeacher = typeof teacher.isSubjectTeacher === 'boolean'
    ? teacher.isSubjectTeacher
    : null
  const subjectTeacherMatch = backendSubjectTeacher ?? matchedSubjects.length > 0
  const resolvedSubjects = subjectTeacherMatch
    ? [...new Set(studentSubjects.length ? studentSubjects : matchedSubjects)]
    : subjects

  const isStatusAvailable = !['On Leave', 'Offline', 'On Event'].includes(resolvedStatus)
  const hasSlots = consultationSlots.length > 0
  const isAvailable = hasSlots && teacherAvailability.toLowerCase() !== 'unavailable' && isStatusAvailable

  return {
    id: teacher.id,
    employeeId: teacher.employeeId,
    name: teacher.name,
    avatar: teacher.avatar || '',
    subject: resolvedSubjects.length ? resolvedSubjects.join(', ') : 'No subject assigned',
    initials: initialsFor(teacher.name),
    color: colorForName(teacher.name),
    status: resolvedStatus,
    available: isStatusAvailable && teacherAvailability.toLowerCase() !== 'unavailable',
    hasConsultationSlots: hasSlots,
    tags: resolvedSubjects.slice(0, 3),
    subjectList: resolvedSubjects,
    assignedYearSections,
    consultationSlots,
    isSubjectTeacher: subjectTeacherMatch,
  }
}

async function loadTeachers(options = {}) {
  const silent = Boolean(options.silent)
  if (!silent) {
    loadingTeachers.value = true
    loadError.value = ''
  }
  try {
    const payload = await apiRequest(`/consultations/teachers?updatedAt=${Date.now()}`, {
      cache: 'no-store',
    })
    teachers.value = (payload.teachers || []).map(mapTeacher)
  } catch (error) {
    if (!silent) {
      teachers.value = []
      loadError.value = error.message || 'Failed to load teachers.'
    }
  } finally {
    if (!silent) loadingTeachers.value = false
  }
}

const { refresh: refreshTeachers } = useAutoRefresh(() => loadTeachers({ silent: true }))

// Use SSE to receive notifications in real-time and refresh when teacher status changes
function _onNotification(n) {
  try {
    if (!n || !n.type) return
    if (String(n.type || '').trim() === 'teacher_status') {
      // refresh teachers silently
      refreshTeachers().catch(() => {})
      // mark the notification read best-effort
      try { apiRequest(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {}) } catch (_) {}
    }
  } catch (_) {}
}

function matchesSearch(teacher) {
  const query = String(search.value || '').trim().toLowerCase()
  if (!query) return true
  return (String(teacher.name || '').toLowerCase().includes(query)
    || String(teacher.subject || '').toLowerCase().includes(query))
}

const subjectTeachers = computed(() => {
  return teachers.value
    .filter((t) => isSubjectTeacher(t) && matchesSearch(t) && hasMatchingAssignment(t))
    .sort((a, b) => {
      const bHasTodayHours = Boolean(scheduledSlotForToday(b))
      const aHasTodayHours = Boolean(scheduledSlotForToday(a))
      if (Number(bHasTodayHours) !== Number(aHasTodayHours)) {
        return Number(bHasTodayHours) - Number(aHasTodayHours)
      }
      return a.name.localeCompare(b.name)
    })
})

const availableTeachers = computed(() => {
  return teachers.value
    .filter((t) => matchesSearch(t) && !isSubjectTeacher(t) && t.status === 'In School')
    .sort((a, b) => a.name.localeCompare(b.name))
})

const visibleSubjectTeachers = computed(() => {
  if (activeFilter.value === 'Available Teacher') {
    return []
  }
  return subjectTeachers.value
})

const visibleAvailableTeachers = computed(() => availableTeachers.value)

const visibleTeacherCount = computed(() => {
  if (activeFilter.value === 'Subject Teacher') return visibleSubjectTeachers.value.length
  if (activeFilter.value === 'Available Teacher') return visibleAvailableTeachers.value.length
  return visibleSubjectTeachers.value.length + visibleAvailableTeachers.value.length
})

function displayedSubjects(teacher) {
  const list = Array.isArray(teacher?.subjectList) ? teacher.subjectList : []
  return list.slice(0, 4)
}

function hiddenSubjectCount(teacher) {
  const list = Array.isArray(teacher?.subjectList) ? teacher.subjectList : []
  return Math.max(0, list.length - 4)
}

function statusClass(s) {
  return {
    'In School': 'pill-green',
    'On Meeting': 'pill-yellow',
    'On Event': 'pill-blue',
    'On Leave': 'pill-red',
    Offline: 'pill-gray',
  }[s] || 'pill-gray'
}

/* ── Modal state ── */
const showReqModal     = ref(false)
const showProfileModal = ref(false)
const selectedTeacher  = ref(null)
const toastMsg         = ref('')
const reqError         = ref('')
const isSubmittingRequest = ref(false)
const today = formatDateInput(new Date())
const reqForm          = ref({ subject: '', reason: CONSULTATION_REASONS[0], availabilityId: '', date: '', time: '', description: '' })

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayDayName() {
  return new Date(`${today}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
}

function scheduledSlotForToday(teacher) {
  if (!teacher) return null
  const dayName = todayDayName().toLowerCase()
  return (teacher.consultationSlots || []).find((slot) => String(slot.dayOfWeek || '').trim().toLowerCase() === dayName) || null
}

function formatSlotLabel(slot) {
  return `${slot.dayOfWeek} • ${slot.startTime} - ${slot.endTime}`
}

function to24Hour(value) {
  const normalized = (value || '').toString().trim()
  const plainTime = normalized.match(/^(\d{2}):(\d{2})$/)
  if (plainTime) return `${plainTime[1]}:${plainTime[2]}`

  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return ''

  let hour = Number(match[1])
  const minute = match[2]
  const period = match[3].toUpperCase()

  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${minute}`
}

function nextDateForDay(dayOfWeek, startTime) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetIndex = days.indexOf(dayOfWeek)
  const normalizedTime = to24Hour(startTime)
  if (targetIndex < 0 || !normalizedTime) return ''

  const [slotHour, slotMinute] = normalizedTime.split(':').map(Number)
  const now = new Date()
  const todayIndex = now.getDay()
  let delta = (targetIndex - todayIndex + 7) % 7

  if (delta === 0) {
    const nowMinutes = (now.getHours() * 60) + now.getMinutes()
    const slotMinutes = (slotHour * 60) + slotMinute
    if (slotMinutes <= nowMinutes) {
      delta = 7
    }
  }

  const nextDate = new Date(now)
  nextDate.setHours(0, 0, 0, 0)
  nextDate.setDate(now.getDate() + delta)
  const yyyy = nextDate.getFullYear()
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0')
  const dd = String(nextDate.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function openRequest(t) {
  const selectedSlot = scheduledSlotForToday(t)
  selectedTeacher.value = t
  reqForm.value = {
    subject: t.subjectList?.[0] || '',
    reason: CONSULTATION_REASONS[0],
    availabilityId: t.isSubjectTeacher ? selectedSlot?.id || '' : '',
    date: !t.isSubjectTeacher ? today : '',
    time: '',
    description: '',
  }
  reqError.value = ''
  showReqModal.value = true
}

function openProfile(t) {
  selectedTeacher.value = t
  showProfileModal.value = true
}

function requestFromProfile() {
  showProfileModal.value = false
  openRequest(selectedTeacher.value)
}

async function submitRequest() {
  if (isSubmittingRequest.value) return

  reqError.value = ''
  if (!reqForm.value.subject) { reqError.value = 'Please select a subject.'; return }
  if (!reqForm.value.reason) { reqError.value = 'Please select a reason.'; return }

  const notes = [
    `Reason: ${reqForm.value.reason}`,
    reqForm.value.description ? `Description: ${reqForm.value.description.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const body = {
    teacherId: selectedTeacher.value.id,
    topic: reqForm.value.subject,
    consultationType: selectedTeacher.value?.isSubjectTeacher ? 'subject' : 'available',
    notes,
  }

  if (selectedTeacher.value?.isSubjectTeacher) {
    if (!reqForm.value.availabilityId) { reqError.value = 'Please select consultation availability.'; return }

    const slot = (selectedTeacher.value?.consultationSlots || []).find((item) => item.id === reqForm.value.availabilityId)
    if (!slot) { reqError.value = 'Selected consultation availability is invalid.'; return }

    body.availabilityId = reqForm.value.availabilityId
    body.date = today
    body.time = to24Hour(slot.startTime)
    if (!body.date || !body.time) { reqError.value = 'Selected consultation availability is invalid.'; return }
  } else {
    if (!reqForm.value.date) { reqError.value = 'Please pick a consultation date.'; return }
    if (!reqForm.value.time) { reqError.value = 'Please pick a consultation time.'; return }
    if (reqForm.value.time < '07:00' || reqForm.value.time > '17:00') {
      reqError.value = 'Available-teacher consultations must be scheduled between 7:00 AM and 6:00 PM.'
      return
    }

    // Available teachers accept free date/time requests; never attach an admin slot.
    body.availabilityId = undefined
    body.date = reqForm.value.date
    body.time = to24Hour(reqForm.value.time)
    if (!body.time) { reqError.value = 'Selected consultation time is invalid.'; return }
  }

  isSubmittingRequest.value = true
  try {
    await apiRequest('/consultations/requests', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    showReqModal.value = false
    showToast(`Request sent to ${selectedTeacher.value.name}.`)
    notifyStudentDataChanged('consultation-created')
    await loadTeachers()
  } catch (error) {
    reqError.value = error.message || 'Failed to send request.'
  } finally {
    isSubmittingRequest.value = false
  }
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

onMounted(() => {
  loadTeachers()
  useNotifications.addNotificationListener(_onNotification)
})

onUnmounted(() => {
  useNotifications.removeNotificationListener(_onNotification)
  useNotifications.closeNotifications()
})
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100%;
  margin: 0 auto; background: #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 16px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; padding: 16px 18px;
  border-bottom: 1px solid #eee;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #444; padding: 4px; display: flex; align-items: center;
  border-radius: 6px; margin-left: -4px; transition: color 0.15s;
}
.back-btn:hover { color: #4b5563; }
.header-title { font-weight: 700; font-size: 1rem; color: #4b5563; }

/* Search */
.search-wrap {
  position: relative; margin: 15px 16px 0;
}
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); }
.search-input {
  width: 100%; box-sizing: border-box;
  height: 44px;
  padding: 11px 14px 11px 36px;
  border: 1px solid #dfe3e6;
  border-radius: 10px; font-size: 0.87rem;
  background: rgba(255, 255, 255, 0.96); outline: none; font-family: inherit;
  box-shadow: 0 4px 12px rgba(45, 50, 55, 0.07);
}
.search-input:focus { border-color: #7d8992; box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.12); }

/* Filters */
.filter-row { display: flex; gap: 8px; padding: 12px 18px 1px; overflow-x: auto; scrollbar-width: none; }
.filter-row::-webkit-scrollbar { display: none; }
.filter-chip {
  white-space: nowrap; min-height: 34px; padding: 6px 14px;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 10px; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; font-family: inherit; color: #555;
  transition: all 0.15s;
}
.filter-chip.active { background: linear-gradient(145deg, #535d66, #30363c); color: #fff; border-color: #424b53; box-shadow: 0 4px 10px rgba(48, 54, 60, 0.2); }

/* Teacher cards */
.teacher-list { display: flex; flex-direction: column; gap: 12px; padding: 14px 18px 16px; }
.teacher-list.is-loading { min-height: calc(100dvh - 250px); padding: 0; }
.empty-state-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  color: #666;
  border: 1px solid #ececec;
}
.empty-state-card.error {
  color: #b23a48;
  border-color: #f3c3ca;
  background: #fff4f5;
}
.empty-state-card.loading-state {
  display: flex;
  align-items: stretch;
  min-height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
}
.loading-panel {
  width: 100%;
  min-height: calc(100dvh - 250px);
  box-sizing: border-box;
  padding: 28px 16px 24px;
  border: 1px solid rgba(91, 99, 106, 0.12);
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff 0%, #f5f7f7 100%);
  box-shadow: 0 8px 18px rgba(38, 44, 49, 0.08), inset 0 1px rgba(255, 255, 255, 0.95);
}
.loading-orbit {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border: 3px solid #dfe7e7;
  border-top-color: #4b7565;
  border-radius: 50%;
  animation: loading-spin 0.9s linear infinite;
}
.loading-orbit span { width: 8px; height: 8px; border-radius: 50%; background: #4b7565; }
.loading-copy { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 20px; }
.loading-copy strong { color: #34423b; font-size: 0.92rem; font-weight: 700; }
.loading-copy span { color: #9ba3ab; font-size: 0.73rem; }
.teacher-skeleton {
  display: flex;
  gap: 12px;
  padding: 13px;
  border: 1px solid #e7ebeb;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.72);
}
.teacher-skeleton.second { margin-top: 8px; opacity: 0.58; }
.skeleton-avatar,
.skeleton-line,
.skeleton-chips span {
  background: linear-gradient(90deg, #e7ecec 25%, #f5f7f7 50%, #e7ecec 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
.skeleton-avatar { width: 46px; height: 46px; flex: 0 0 auto; border-radius: 14px; }
.skeleton-content { flex: 1; min-width: 0; padding-top: 2px; }
.skeleton-line { height: 9px; border-radius: 6px; }
.skeleton-title { width: 72%; }
.skeleton-subtitle { width: 43%; margin-top: 8px; }
.skeleton-chips { display: flex; gap: 6px; margin-top: 12px; }
.skeleton-chips span { width: 76px; height: 18px; border-radius: 10px; }
.skeleton-chips span:last-child { width: 58px; }
@keyframes loading-spin { to { transform: rotate(360deg); } }
@keyframes skeleton-shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .loading-orbit, .skeleton-avatar, .skeleton-line, .skeleton-chips span { animation: none; }
}
.teacher-card { background: rgba(255, 255, 255, 0.96); border: 1px solid rgba(91, 99, 106, 0.14); border-radius: 15px; padding: 15px; box-shadow: 0 7px 16px rgba(38, 44, 49, 0.09), inset 0 1px rgba(255, 255, 255, 0.9); }
.teacher-top  { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 13px; }
.teacher-avatar {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0;
  overflow: hidden;
}
.teacher-avatar img,
.tp-avatar img,
.profile-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
.teacher-meta { flex: 1; min-width: 0; }
.teacher-name    { font-weight: 800; font-size: 0.88rem; line-height: 1.25; color: #252a2f; }
.teacher-type-pill { display: inline-flex; margin-top: 4px; padding: 3px 7px; border-radius: 6px; font-size: 0.66rem; font-weight: 700; line-height: 1.1; }
.teacher-type-pill.subject { background: #e8eef8; color: #3d618d; }
.teacher-type-pill.available { background: #e5f1e9; color: #34704d; }
.teacher-subjects-clean {
  margin-top: 7px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  overflow: visible;
}
.subject-chip {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 8px;
  background: #f0f2f3;
  border: 1px solid #dce0e3;
  color: #4b5259;
  font-size: 0.66rem;
  font-weight: 600;
  line-height: 1.15;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.subject-chip.more {
  background: #f5f6f8;
  border-color: #e2e6ea;
  color: #586572;
}
.consultation-hours {
  margin-top: 10px;
  padding: 9px 10px;
  border: 1px solid #d9e7de;
  border-radius: 10px;
  background: #f3faf5;
}
.hours-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #34704d;
  font-size: 0.68rem;
  font-weight: 800;
  margin-bottom: 6px;
}
.hours-label svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hours-list { display: flex; flex-wrap: wrap; gap: 5px; }
.hours-chip {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 7px;
  background: #fff;
  border: 1px solid #cfe0d5;
  color: #496154;
  font-size: 0.64rem;
  font-weight: 600;
  line-height: 1.2;
}
.status-pill {
  font-size: 0.68rem; font-weight: 700;
  padding: 5px 9px; border-radius: 8px;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; flex: 0 0 auto;
}
.pill-green  { background: #e0f2e7; color: #287344; }
.pill-orange { background: #fff3e0; color: #b35e00; }
.pill-yellow { background: #fff4cc; color: #9a6700; }
.pill-blue   { background: #e1efff; color: #2563a8; }
.pill-red    { background: #ffeaea; color: #e63946; }
.pill-gray   { background: #f0f0f0; color: #666; }

.teacher-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding-top: 1px; border-top: 1px solid #edf0f1; }
.price { font-size: 0.82rem; font-weight: 600; color: #4b5563; min-width: 12px; }
.action-btn {
  min-height: 38px; padding: 9px 14px; border-radius: 9px;
  border: none; font-family: inherit;
  font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
}
.action-btn:active { opacity: 0.8; }
.action-btn.green   { background: linear-gradient(145deg, #535d66, #30363c); color: #fff; box-shadow: 0 4px 10px rgba(48, 54, 60, 0.18); }
.action-btn.disabled {
  background: #edf0f1;
  color: #7b858d;
  border: 1px solid #d9dee1;
  cursor: not-allowed;
}

/* Metallic teachers directory */
.mobile-app {
  background:
    radial-gradient(circle at 88% 0%, rgba(255,255,255,.82), transparent 16rem),
    linear-gradient(155deg, #eef0f1 0%, #d5dadd 52%, #b9bec1 100%) !important;
}

.mobile-app .app-header {
  min-height: 84px;
  padding: 22px 20px 18px !important;
  background: transparent !important;
  border-bottom: 0 !important;
  box-shadow: none !important;
}

.mobile-app .header-title {
  color: #46515d !important;
  font-size: 1.16rem !important;
  letter-spacing: -.02em;
}

.back-btn {
  width: 36px;
  height: 36px;
  justify-content: center;
  margin-left: -2px;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 50%;
  background: linear-gradient(145deg, #f7f8f8, #d6dade);
  color: #4b555e;
  box-shadow: inset 0 1px rgba(255,255,255,.9), 0 5px 10px rgba(39,44,49,.13);
}

.search-wrap { margin: 2px 18px 0; }
.search-input {
  height: 48px;
  border: 1px solid rgba(255,255,255,.8);
  border-radius: 15px;
  background: rgba(248,249,249,.72) !important;
  color: #303940;
  box-shadow: inset 0 1px rgba(255,255,255,.92), 0 8px 18px rgba(39,44,49,.1);
}
.search-input::placeholder { color: #8a939a; }
.search-input:focus { border-color: #87939d; box-shadow: inset 0 1px rgba(255,255,255,.92), 0 0 0 3px rgba(75,85,99,.12); }
.search-icon { left: 14px; stroke: #66727c; }

.filter-row { gap: 9px; padding: 14px 18px 4px; }
.filter-chip {
  min-height: 38px;
  padding: 7px 16px;
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 999px;
  background: linear-gradient(145deg, #f8f9f9, #dfe3e5);
  color: #56616b;
  box-shadow: inset 0 1px rgba(255,255,255,.9), 0 2px 5px rgba(39,44,49,.045);
}
.filter-chip.active { background: linear-gradient(145deg, #59636b, #303940); border-color: #414a51; box-shadow: inset 0 1px rgba(255,255,255,.2), 0 3px 7px rgba(39,44,49,.11); }

.teacher-list { gap: 14px; padding: 8px 18px 24px; }
.teacher-list > .section-title {
  position: relative;
  margin: 2px 2px 0;
  padding-left: 12px;
  color: #3f4a54;
  font-size: 1.04rem;
  font-weight: 800;
  letter-spacing: -.01em;
  line-height: 1.2;
}
.teacher-list > .section-title::before {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, #697680, #3d474f);
  box-shadow: 0 2px 5px rgba(39,44,49,.16);
}
.teacher-card {
  padding: 17px;
  border: 1px solid rgba(255,255,255,.76) !important;
  border-radius: 21px;
  background: linear-gradient(145deg, rgba(250,251,251,.96), rgba(224,228,230,.9)) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.94), 0 10px 22px rgba(39,44,49,.13) !important;
}
.teacher-top { gap: 13px; margin-bottom: 15px; }
.teacher-avatar { width: 58px; height: 58px; border-radius: 17px; box-shadow: inset 0 1px rgba(255,255,255,.45), 0 5px 10px rgba(39,44,49,.14); }
.teacher-name { font-size: .96rem; color: #252b31; }
.teacher-type-pill { margin-top: 6px; padding: 4px 9px; border-radius: 999px; background: #e1e7ed !important; color: #4b6784 !important; }
.teacher-type-pill.available { background: #dfeae4 !important; color: #397051 !important; }
.subject-chip { border-color: #cdd4d9; border-radius: 999px; background: rgba(245,247,247,.7); color: #56616b; }
.status-pill { border: 1px solid rgba(255,255,255,.7); border-radius: 999px; padding: 6px 10px; }
.pill-green { background: #e0eee5; color: #397051; }
.pill-gray { background: #e3e6e8; color: #68727a; }
.consultation-hours { border-color: #cbded2; border-radius: 14px; background: #edf6f0; }
.hours-chip { border-radius: 999px; background: #f8fbf9; }
.teacher-footer { padding-top: 14px; border-top-color: rgba(104,112,120,.18); }
.action-btn { min-height: 42px; padding: 10px 17px; border-radius: 13px; }
.action-btn.green { background: linear-gradient(145deg, #59636b, #303940); box-shadow: inset 0 1px rgba(255,255,255,.18), 0 6px 12px rgba(39,44,49,.2); }
.action-btn.disabled { background: linear-gradient(145deg, #eef0f1, #dfe3e5); border-color: #ccd3d7; }

/* ── Modals ── */
.modal-overlay {
  position: fixed;
  inset: 0 0 0 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(31,35,39,.58);
  z-index: 30000 !important;
  padding-top: env(safe-area-inset-top, 0px);
  backdrop-filter: blur(7px);
}
.modal-sheet {
  position: relative;
  z-index: 30001;
  align-self: flex-end;
  margin-bottom: 0;
  margin-top: auto;
  width: 100%; max-width: 430px;
  background: linear-gradient(145deg, #f8f9f9, #dfe3e5);
  border: 1px solid rgba(255,255,255,.85);
  border-radius: 28px 28px 0 0;
  max-height: 92dvh; overflow-y: auto; padding-bottom: 30px;
  box-shadow: 0 -14px 32px rgba(22,26,30,.26), inset 0 1px rgba(255,255,255,.95);
}

.consultation-modal-enter-active,
.consultation-modal-leave-active {
  transition: opacity .24s ease;
}

.consultation-modal-enter-active .modal-sheet,
.consultation-modal-leave-active .modal-sheet {
  transition: transform .34s cubic-bezier(.22, 1, .36, 1), opacity .24s ease;
}

.consultation-modal-enter-from,
.consultation-modal-leave-to {
  opacity: 0;
}

.consultation-modal-enter-from .modal-sheet,
.consultation-modal-leave-to .modal-sheet {
  opacity: .7;
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .consultation-modal-enter-active,
  .consultation-modal-leave-active,
  .consultation-modal-enter-active .modal-sheet,
  .consultation-modal-leave-active .modal-sheet {
    transition: none;
  }
}
.modal-handle { width: 48px; height: 5px; background: #aeb6bc; border-radius: 999px; margin: 12px auto 2px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 17px 22px 16px; font-weight: 800; font-size: 1.08rem;
  color: #252b30;
  border-bottom: 1px solid rgba(104,112,120,.18);
}
.modal-close { display: grid; width: 36px; height: 36px; place-items: center; background: linear-gradient(145deg,#f8f9f9,#d8dde0); border: 1px solid rgba(255,255,255,.8); border-radius: 50%; font-size: 1.1rem; cursor: pointer; color: #69747d; line-height: 1; box-shadow: inset 0 1px rgba(255,255,255,.9); }
.modal-body  { padding: 18px 20px 6px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { display: flex; gap: 10px; padding: 14px 20px 0; }
.modal-cancel {
  flex: 1; padding: 13px; background: linear-gradient(145deg,#f3f4f4,#dfe2e3); color: #59646d;
  border: 1px solid #cbd2d6; border-radius: 13px;
  font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.modal-submit {
  flex: 2; padding: 13px; background: linear-gradient(145deg,#59636b,#303940); color: #fff;
  border: 1px solid #303940; border-radius: 13px;
  font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer;
  box-shadow: inset 0 1px rgba(255,255,255,.18), 0 6px 13px rgba(39,44,49,.2);
}

/* Form fields */
.field-group  { display: flex; flex-direction: column; gap: 6px; }
.field-label  { font-size: 0.76rem; font-weight: 800; color: #4b555e; letter-spacing: .03em; text-transform: uppercase; }
.optional     { font-weight: 400; color: #89939a; text-transform: none; letter-spacing: 0; }
.field-input  {
  width: 100%; min-height: 46px; padding: 10px 13px; border: 1px solid #cbd2d6;
  border-radius: 13px; font-family: inherit; font-size: 0.87rem;
  color: #303940; background: rgba(248,249,249,.78);
  outline: none; box-sizing: border-box;
  box-shadow: inset 0 1px rgba(255,255,255,.9);
}
.field-input:focus { border-color: #68747d; box-shadow: 0 0 0 3px rgba(75,85,99,.12), inset 0 1px rgba(255,255,255,.9); }
.field-textarea { resize: none; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg-err { color: #e63946; font-size: 0.8rem; font-weight: 500; }

/* Teacher preview pill */
.teacher-pill {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(145deg,#f1f3f4,#dfe3e5); border: 1px solid rgba(255,255,255,.75); border-radius: 16px; padding: 13px;
  box-shadow: inset 0 1px rgba(255,255,255,.86);
}
.tp-avatar {
  width: 44px; height: 44px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem; flex-shrink: 0; overflow: hidden;
}
.tp-name { font-weight: 700; font-size: 0.9rem; color: #111; }
.tp-subjects-clean {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* Profile hero */
.profile-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 0 12px; gap: 4px;
}
.profile-avatar-lg {
  width: 72px; height: 72px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.6rem; margin-bottom: 8px; overflow: hidden;
}
.profile-hero-name { font-weight: 700; font-size: 1rem; color: #111; }
.profile-subjects-clean {
  margin-top: 4px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
}
.prof-row {
  display: flex; flex-direction: column; gap: 5px;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0;
}
.prof-row:last-child { border-bottom: none; }
.prof-label { font-size: 0.73rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
.prof-value { font-size: 0.88rem; color: #111; font-weight: 500; }
.prof-avail { font-size: 0.88rem; font-weight: 600; }
.avail-yes  { color: #6b7280; }
.avail-no   { color: #e63946; }

/* Toast */
.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: #4b5563; color: #fff; padding: 10px 22px;
  border-radius: 20px; font-size: 0.85rem; font-weight: 600;
  z-index: 200; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  animation: fadeUp 0.25s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
