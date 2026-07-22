<template>
  <div class="teacher-sidebar-status">
    <Teleport to="body">
      <p v-if="message" :class="['teacher-status-toast', error ? 'is-error' : '']">{{ message }}</p>
    </Teleport>

    <div class="sidebar-status-panel">
      <div class="sidebar-status-head">
        <span>Work Status</span>
        <span :class="['sidebar-status-dot', statusDotClass]"></span>
      </div>
      <div class="sidebar-status-action-row">
        <span class="sidebar-status-value">{{ statusDisplay }}</span>
        <button
          class="sidebar-status-button"
          type="button"
          :disabled="workStatusDisabled || saving"
          @click="clockOut"
        >
          Clock Out
        </button>
      </div>
      <div class="sidebar-time-in">Time in: {{ formattedTimeIn }}</div>
    </div>

    <div class="sidebar-status-panel">
      <div class="sidebar-status-head">
        <span>Availability</span>
        <span :class="['sidebar-status-dot', availabilityDotClass]"></span>
      </div>
      <select v-model="availabilityChoice" class="sidebar-status-select" aria-label="Availability">
        <option value="Available" :disabled="!canChangeAvailability">Available for consultations</option>
        <option value="Unavailable" :disabled="!canChangeAvailability">Unavailable for consultations</option>
      </select>
      <div class="sidebar-status-subtext">{{ availabilitySubtext }}</div>
    </div>
  </div>
</template>

<script setup>
import { getToken, getUser, saveMergedUser } from '@/auth.js'
import { computed, onMounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const user = ref(getUser() || {})
const teacherStatus = ref(user.value.teacher_status || 'On School')
const teacherAvailability = ref(user.value.teacher_availability || 'Available')
const teacherTimeIn = ref(user.value.teacher_time_in || null)
const saving = ref(false)
const message = ref('')
const error = ref(false)
let messageTimer

function normalizeTeacherStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'on school' || normalized === 'in school') return 'On School'
  if (normalized === 'on meeting' || normalized === 'on-meeting') return 'On Meeting'
  if (normalized === 'on leave' || normalized === 'on-leave') return 'On Leave'
  if (normalized === 'off campus' || normalized === 'off-campus') return 'Off Campus'
  return 'On School'
}

const normalizedStatus = computed(() => normalizeTeacherStatus(teacherStatus.value))
const isOffline = computed(() => normalizedStatus.value === 'On Leave')

const statusDisplay = computed(() => {
  if (normalizedStatus.value === 'On School') return 'In School'
  if (normalizedStatus.value === 'On Meeting') return 'On Meeting'
  if (normalizedStatus.value === 'Off Campus') return 'Off Campus'
  return 'Offline'
})

const formattedTimeIn = computed(() => {
  if (!teacherTimeIn.value) return 'Not recorded'
  const date = new Date(teacherTimeIn.value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
})

const canChangeAvailability = computed(() => normalizedStatus.value === 'On School')
const workStatusDisabled = computed(() => isOffline.value)
const statusDotClass = computed(() => isOffline.value ? 'is-offline' : (normalizedStatus.value === 'On School' ? 'is-in-school' : 'is-on-leave'))
const availabilityDotClass = computed(() => {
  if (!canChangeAvailability.value) return 'is-offline'
  return teacherAvailability.value === 'Available' ? 'is-in-school' : 'is-on-leave'
})

const availabilitySubtext = computed(() => {
  if (!canChangeAvailability.value) return 'Availability is locked while not in school.'
  return 'Updates your consultation availability.'
})

const availabilityChoice = computed({
  get() {
    return teacherAvailability.value === 'Available' ? 'Available' : 'Unavailable'
  },
  set(value) {
    if (value === 'Available' || value === 'Unavailable') {
      teacherAvailability.value = value
      saveStatus()
    }
  }
})

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) throw new Error('Session expired. Please log in again.')

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = {}
  try { body = await response.json() } catch (_err) { body = {} }
  if (!response.ok) throw new Error(body.message || 'Unable to update status.')
  return body
}

function showMessage(text, isError = false) {
  message.value = text
  error.value = isError
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    message.value = ''
    error.value = false
  }, 2600)
}

async function loadStatus() {
  try {
    const payload = await apiRequest('/auth/me')
    const currentUser = saveMergedUser(payload.user || {})
    user.value = currentUser
    teacherStatus.value = currentUser.teacher_status || 'On School'
    teacherAvailability.value = currentUser.teacher_availability || 'Available'
    teacherTimeIn.value = currentUser.teacher_time_in || null
  } catch (_err) {
    // Session values are enough for the sidebar if the network is briefly unavailable.
  }
}

async function saveStatus() {
  if (saving.value) return
  saving.value = true

  try {
    const payload = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        teacher_status: teacherStatus.value,
        teacher_availability: teacherAvailability.value,
      }),
    })
    const updatedUser = saveMergedUser(payload.user || {})
    user.value = updatedUser
    teacherStatus.value = updatedUser.teacher_status || teacherStatus.value
    teacherAvailability.value = updatedUser.teacher_availability || teacherAvailability.value
    teacherTimeIn.value = updatedUser.teacher_time_in || teacherTimeIn.value
    showMessage('Status saved.')
  } catch (err) {
    showMessage(err.message || 'Unable to save status.', true)
  } finally {
    saving.value = false
  }
}

function clockOut() {
  teacherStatus.value = 'On Leave'
  teacherAvailability.value = 'Unavailable'
  saveStatus()
}

onMounted(loadStatus)
</script>

<style scoped>
.teacher-sidebar-status {
  grid-column: 1 / -1;
  width: 100%;
  margin: -10px 0 12px;
  padding: 10px 0 12px;
  border-top: 1px solid rgba(72, 78, 84, 0.17);
  border-bottom: 1px solid rgba(72, 78, 84, 0.17);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.46),
    0 1px rgba(255, 255, 255, 0.46);
}

.sidebar-status-panel {
  width: 100%;
  margin-top: 0;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 11px;
  background: linear-gradient(145deg, rgba(245, 247, 247, 0.72), rgba(199, 204, 208, 0.58));
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.76),
    0 4px 10px rgba(42, 48, 54, 0.1);
  text-align: left;
}

.sidebar-status-panel + .sidebar-status-panel {
  margin-top: 7px;
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

.sidebar-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.sidebar-status-dot.is-in-school { background: #40916c; }
.sidebar-status-dot.is-on-leave { background: #e63946; }
.sidebar-status-dot.is-offline { background: #98a2b3; }

.sidebar-status-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
}

.sidebar-status-value,
.sidebar-status-select {
  min-height: 28px;
  color: #30353a;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(116, 123, 129, 0.28);
  border-radius: 8px;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
}

.sidebar-status-value {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  padding: 0 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-status-select {
  width: 100%;
  height: 28px;
  padding: 0 8px;
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
  transition: background 0.2s ease, transform 0.2s ease;
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

.teacher-status-toast {
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

.teacher-status-toast.is-error {
  color: #8a1f18;
  background: linear-gradient(145deg, #fff7f6, #ffe2df);
  border-color: rgba(230, 57, 70, 0.28);
}
</style>
