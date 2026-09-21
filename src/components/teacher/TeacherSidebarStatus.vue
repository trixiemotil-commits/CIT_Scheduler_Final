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
        <span :class="['sidebar-status-value', statusDotClass]" aria-label="Current work status">{{ statusDisplay }}</span>
        <div class="sidebar-status-button-wrap">
          <button
            class="sidebar-status-button"
            type="button"
            :disabled="workStatusDisabled || saving"
            @click="handleClockButton"
          >
            <svg class="sidebar-status-clock-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>
            <span>Clock Out</span>
          </button>
          <div v-if="showCollapsedStatusModal" class="collapsed-status-modal" role="dialog" aria-label="Work status" @click.stop>
            <div class="collapsed-status-modal-head">
              <span>Work Status</span>
              <span :class="['sidebar-status-dot', statusDotClass]"></span>
            </div>
            <div :class="['collapsed-status-modal-value', statusDotClass]">{{ statusDisplay }}</div>
            <button class="collapsed-status-modal-action" type="button" :disabled="workStatusDisabled || saving" @click="clockOutAndClose">
              Clock Out
            </button>
            <div class="collapsed-status-modal-time">Time in: {{ formattedTimeIn }}</div>
          </div>
        </div>
      </div>
      <div class="sidebar-time-in">Time in: {{ formattedTimeIn }}</div>
    </div>

    <div class="sidebar-status-panel">
      <div class="sidebar-status-head">
        <span>Office Hours</span>
        <span :class="['sidebar-status-dot', availabilityDotClass]"></span>
      </div>
      <div class="sidebar-status-select-wrap">
        <select v-model="availabilityChoice" class="sidebar-status-select" aria-label="Office hours availability" @pointerdown="handleOfficeHoursPointerDown">
          <option value="Available" :disabled="!canChangeAvailability">Open for consultations</option>
          <option value="Unavailable" :disabled="!canChangeAvailability">Closed for consultations</option>
        </select>
        <svg class="sidebar-status-select-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        <svg class="sidebar-status-office-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12a8 8 0 1 0-8 8" />
          <path d="M12 7v4H8" />
          <rect x="10" y="12" width="11" height="8" rx="1.5" />
          <path d="M13 12v-1.2A1.8 1.8 0 0 1 14.8 9h1.4a1.8 1.8 0 0 1 1.8 1.8V12M10 15h11" />
        </svg>
        <div v-if="showCollapsedOfficeModal" class="collapsed-office-modal" role="dialog" aria-label="Office hours" @click.stop>
          <div class="collapsed-status-modal-head">
            <span>Office Hours</span>
            <span :class="['sidebar-status-dot', availabilityDotClass]"></span>
          </div>
          <select v-model="availabilityChoice" class="collapsed-office-modal-select" aria-label="Office hours availability">
            <option value="Available" :disabled="!canChangeAvailability">Open for consultations</option>
            <option value="Unavailable" :disabled="!canChangeAvailability">Closed for consultations</option>
          </select>
          <div class="collapsed-office-modal-subtext">{{ availabilitySubtext }}</div>
        </div>
      </div>
      <div class="sidebar-status-subtext">{{ availabilitySubtext }}</div>
    </div>
  </div>
</template>

<script setup>
import { getToken, getUser, saveMergedUser } from '@/auth.js'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const user = ref(getUser() || {})
const teacherStatus = ref(user.value.teacher_status || 'On School')
const teacherAvailability = ref(user.value.teacher_availability || 'Available')
const teacherTimeIn = ref(user.value.teacher_time_in || null)
const saving = ref(false)
const message = ref('')
const error = ref(false)
const showCollapsedStatusModal = ref(false)
const showCollapsedOfficeModal = ref(false)
let messageTimer

function normalizeTeacherStatus(statusOrObj) {
  // Accept either a status string or a user object similar to server-side logic.
  if (statusOrObj && typeof statusOrObj === 'object') {
    const t = statusOrObj
    const account = String(t.account_status || '').trim()
    if (account && account !== 'Active') return 'On Leave'

    if (t.teacher_status_expires_at) {
      try {
        const expires = new Date(t.teacher_status_expires_at)
        if (!Number.isNaN(expires.getTime()) && expires <= new Date()) {
          return 'On School'
        }
      } catch (e) {
        // ignore parsing errors and fall through
      }
    }

    const statusRaw = String(t.teacher_status || t.status || '').trim().toLowerCase()
    if (statusRaw === 'on leave' || statusRaw === 'leave') return 'On Leave'
    if (statusRaw === 'on meeting' || statusRaw === 'on-meeting') return 'On Meeting'
    if (statusRaw === 'off campus' || statusRaw === 'off-campus') return 'Off Campus'
    return 'On School'
  }

  const normalized = String(statusOrObj || '').trim()
  const lower = normalized.toLowerCase()
  if (lower === 'on leave' || lower === 'leave') return 'On Leave'
  if (lower === 'on meeting' || lower === 'on-meeting') return 'On Meeting'
  if (lower === 'off campus' || lower === 'off-campus') return 'Off Campus'
  return 'On School'
}

const normalizedStatus = computed(() => {
  // Prefer authoritative profile on user.value to keep teacher view consistent with server-side resolution
  if (user.value && typeof user.value === 'object') {
    return normalizeTeacherStatus(user.value)
  }
  return normalizeTeacherStatus(teacherStatus.value)
})
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
    // Revert to server state to avoid local-only divergence
    try { await loadStatus() } catch (_) { /* ignore */ }
  } finally {
    saving.value = false
  }
}

async function clockOut() {
  const result = await Swal.fire({
    title: 'Clock out?',
    text: 'Your work status will be set to Offline and your office hours will close.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Clock Out',
    cancelButtonText: 'Stay Clocked In',
    confirmButtonColor: '#4b5563',
  })
  if (!result.isConfirmed) return
  teacherStatus.value = 'On Leave'
  teacherAvailability.value = 'Unavailable'
  try {
    const payload = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        teacher_status: teacherStatus.value,
        teacher_availability: teacherAvailability.value,
        clockOut: true,
      }),
    })
    const updatedUser = saveMergedUser(payload.user || {})
    user.value = updatedUser
    teacherStatus.value = updatedUser.teacher_status || teacherStatus.value
    teacherAvailability.value = updatedUser.teacher_availability || teacherAvailability.value
    teacherTimeIn.value = updatedUser.teacher_time_in || null
    showMessage('Clocked out.')
  } catch (err) {
    showMessage(err.message || 'Unable to clock out.', true)
    await loadStatus()
  }
}

function handleClockButton() {
  if (document.documentElement.classList.contains('teacher-sidebar-collapsed')) {
    showCollapsedOfficeModal.value = false
    showCollapsedStatusModal.value = !showCollapsedStatusModal.value
    return
  }
  clockOut()
}

function handleOfficeHoursPointerDown(event) {
  if (!document.documentElement.classList.contains('teacher-sidebar-collapsed')) return
  event.preventDefault()
  event.stopPropagation()
  showCollapsedStatusModal.value = false
  showCollapsedOfficeModal.value = !showCollapsedOfficeModal.value
}

async function clockOutAndClose() {
  showCollapsedStatusModal.value = false
  await clockOut()
}

function closeCollapsedStatusModal(event) {
  if (!event.target.closest('.sidebar-status-button-wrap')) showCollapsedStatusModal.value = false
  if (!event.target.closest('.sidebar-status-select-wrap')) showCollapsedOfficeModal.value = false
}

onMounted(() => {
  loadStatus()
  document.addEventListener('click', closeCollapsedStatusModal)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeCollapsedStatusModal)
})
</script>

<style scoped>
.teacher-sidebar-status {
  width: 100%;
  margin: 0 0 14px;
  padding: 8px 0 0;
}

.sidebar-status-panel {
  width: 100%;
  margin-top: 0;
  padding: 11px 10px 10px;
  border: 1px solid rgba(255, 255, 255, .62);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(250,251,251,.96), rgba(211,216,219,.88));
  box-shadow: inset 0 1px rgba(255,255,255,.92), 0 8px 18px rgba(49, 57, 63, .12);
  text-align: left;
}

.sidebar-status-panel + .sidebar-status-panel {
  margin-top: 8px;
}

.sidebar-status-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
  color: #30353a;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
}

.sidebar-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(64,145,108,.12);
}

.sidebar-status-dot.is-in-school { background: #40916c; }
.sidebar-status-dot.is-on-leave { background: #e63946; }
.sidebar-status-dot.is-offline { background: #98a2b3; }

.sidebar-status-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.sidebar-status-value,
.sidebar-status-select {
  min-height: 36px;
  color: #30353a;
  background: rgba(255,255,255,.78);
  border: 1px solid #b7c0c5;
  border-radius: 11px;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  box-shadow: inset 0 1px rgba(255,255,255,.88), 0 2px 5px rgba(52,60,66,.08);
}

.sidebar-status-value {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  cursor: default;
  pointer-events: none;
}
.sidebar-status-value.is-in-school { color: #28613f; border-color: #9bc6aa; background: #e8f3ec; }
.sidebar-status-value.is-on-leave { color: #9f3e46; border-color: #d8a3a8; background: #faebec; }
.sidebar-status-value.is-offline { color: #59636a; border-color: #b7c0c5; background: #e5e8ea; }

.sidebar-status-select {
  width: 100%;
  height: 34px;
  padding: 0 12px;
  appearance: none;
  padding-right: 28px;
}
.sidebar-status-select-wrap { position: relative; width: 100%; }
.sidebar-status-select-wrap .sidebar-status-select { display: block; }
.sidebar-status-select-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #59656d;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
  transform: translateY(-50%);
}
.sidebar-status-clock-icon { display: none; }
.sidebar-status-calendar-icon,
.sidebar-status-office-icon { display: none !important; }
.collapsed-status-tooltip { display: none !important; }

.sidebar-status-button {
  min-width: 92px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #30373d;
  border-radius: 11px;
  background: linear-gradient(145deg, #59636b, #303940);
  color: #fff;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: inset 0 1px rgba(255,255,255,.18), 0 4px 9px rgba(38,45,50,.2);
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}
.sidebar-status-button span { display: inline; }
.sidebar-status-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: inset 0 1px rgba(255,255,255,.22), 0 6px 13px rgba(38,45,50,.24); }

.sidebar-status-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: #8d949a;
  border-color: #747b81;
}

.sidebar-status-button-wrap { position: relative; }

.collapsed-status-modal {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  z-index: 30;
  width: 236px;
  padding: 15px;
  border: 1px solid #414950;
  border-radius: 14px;
  background: linear-gradient(145deg, #f8fafb, #dfe4e7);
  box-shadow: 0 12px 24px rgba(26,31,35,.28), inset 0 1px rgba(255,255,255,.9);
  transform: translateY(-50%);
}

.collapsed-status-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #30353a;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.collapsed-status-modal-value {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border: 1px solid #9bc6aa;
  border-radius: 10px;
  background: #e8f3ec;
  color: #28613f;
  font-size: .86rem;
  font-weight: 800;
}

.collapsed-status-modal-value.is-on-leave,
.collapsed-status-modal-value.is-offline {
  border-color: #b7c0c5;
  background: #e5e8ea;
  color: #59636a;
}

.collapsed-status-modal-action {
  width: 100%;
  margin-top: 10px;
  padding: 9px 12px;
  border: 1px solid #303940;
  border-radius: 9px;
  background: linear-gradient(145deg, #4b555e, #2f383f);
  color: #fff;
  font: inherit;
  font-size: .78rem;
  font-weight: 800;
  cursor: pointer;
}

.collapsed-status-modal-action:disabled { cursor: not-allowed; opacity: .55; }

.collapsed-status-modal-time {
  margin-top: 10px;
  color: #687582;
  font-size: .72rem;
}

.collapsed-office-modal {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  z-index: 30;
  width: 236px;
  padding: 15px;
  border: 1px solid #414950;
  border-radius: 14px;
  background: linear-gradient(145deg, #f8fafb, #dfe4e7);
  box-shadow: 0 12px 24px rgba(26,31,35,.28), inset 0 1px rgba(255,255,255,.9);
  transform: translateY(-50%);
}

.collapsed-office-modal-select {
  width: 100%;
  height: 40px;
  margin-top: 10px;
  padding: 0 12px;
  border: 1px solid #b7c0c5;
  border-radius: 10px;
  background: rgba(255,255,255,.78);
  color: #30353a;
  font: inherit;
  font-size: .78rem;
  font-weight: 700;
}

.collapsed-office-modal-subtext {
  margin-top: 10px;
  color: #687582;
  font-size: .72rem;
  line-height: 1.35;
}

.sidebar-time-in,
.sidebar-status-subtext {
  margin-top: 8px;
  color: #66707a;
  font-size: 0.65rem;
  line-height: 1.35;
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
