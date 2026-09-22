<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshConsultations" />
      <div class="mobile-app">
    <!-- Header -->
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Consultation Sessions</div>
      <div style="width:32px"></div>
    </div>

    <!-- Tabs -->
    <div class="tabs-row">
      <button
        v-for="tab in tabs" :key="tab"
        :class="['tab-btn', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >{{ tab }}</button>
    </div>

    <!-- Sessions -->
    <div :class="['sessions-list', { 'is-loading': isLoadingSessions }]">
      <div v-if="isLoadingSessions" class="empty-state loading-state">
        <div class="loading-panel" role="status" aria-label="Loading consultation sessions">
          <div class="loading-orbit" aria-hidden="true"><span></span></div>
          <div class="loading-copy">
            <strong>Loading your sessions</strong>
            <span>Getting your latest consultation details...</span>
          </div>
          <div class="session-skeleton" aria-hidden="true">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-chips"><span></span><span></span></div>
            </div>
          </div>
          <div class="session-skeleton second" aria-hidden="true">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-chips"><span></span><span></span></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="sessionsError" class="empty-state">
        <div class="empty-icon error-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v4M12 16h.01"/></svg></div>
        <div>{{ sessionsError }}</div>
      </div>
      <div v-else-if="filteredSessions.length === 0" class="empty-state">
        <div class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6M8.5 10h7M8.5 14h7M8.5 18h4"/></svg></div>
        <div>No sessions found.</div>
      </div>
      <template v-for="s in filteredSessions" :key="s.id">
        <div v-if="!isLoadingSessions && !sessionsError" class="session-card">
        <div class="session-top">
          <div class="session-avatar" :style="{ background: s.teacherColor }">
            <img v-if="s.teacherAvatar" :src="s.teacherAvatar" :alt="`${s.teacher} profile`" />
            <span v-else>{{ s.teacherInitials }}</span>
          </div>
          <div class="session-meta">
            <div class="session-subject">{{ s.subject }}</div>
            <div class="session-teacher">{{ s.teacher }}</div>
            <div class="session-info-row">
              <span class="info-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>{{ formatWeekday(s.date) }}, {{ formatDate(s.date) }}</span>
              <span class="info-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{{ formatTimeRange(s.timeStart, s.timeEnd) }}</span>
              <span class="info-chip" v-if="s.status === 'Approved' && s.ticketNumber"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14v12H5zM8 9h8M8 12h5M8 15h7"/></svg>{{ s.ticketNumber }}</span>
            </div>
            <div v-if="s.status === 'Approved' && s.queuePosition" class="queue-row">
              <span :class="['queue-chip', { 'queue-next': s.isNextInQueue }]">
                {{ queueLineLabel(s) }}
              </span>
              <span v-if="queueWaitNote(s)" class="queue-note">{{ queueWaitNote(s) }}</span>
            </div>
          </div>
          <span :class="['status-pill', pillClass(s.status)]">{{ s.status }}</span>
        </div>

        <!-- Reschedule reason -->
        <div v-if="s.status === 'Reschedule' && s.reason" class="rejection-msg">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>{{ s.reason }}
        </div>

        <!-- Actions -->
        <div class="session-actions">
          <template v-if="s.status === 'Approved'">
            <button class="act-btn outline full" @click="openDetails(s)">View Details</button>
          </template>
          <template v-else-if="s.status === 'Pending'">
            <button class="act-btn outline" @click="openEdit(s)">Edit</button>
            <button class="act-btn red" @click="openCancel(s)">Cancel</button>
          </template>
          <template v-else-if="s.status === 'Reschedule'">
            <button class="act-btn green" @click="openEdit(s)">Reschedule</button>
            <button class="act-btn red" @click="openCancel(s)">Cancel</button>
          </template>
          <template v-else-if="s.status === 'Completed'">
            <button class="act-btn outline full" @click="openDetails(s)">View Notes</button>
          </template>
        </div>
        </div>
      </template>
    </div>

    <!-- ══ VIEW DETAILS MODAL ══ -->
    <Teleport to="body">
      <div v-if="showDetails" class="modal-overlay" @click.self="showDetails = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Session Details</span><button class="modal-close" @click="showDetails = false">✕</button></div>
        <div class="modal-body" v-if="activeSession">
          <div class="detail-hero">
            <div class="session-avatar-lg" :style="{ background: activeSession.teacherColor }">
              <img v-if="activeSession.teacherAvatar" :src="activeSession.teacherAvatar" :alt="`${activeSession.teacher} profile`" />
              <span v-else>{{ activeSession.teacherInitials }}</span>
            </div>
            <div class="detail-main">
              <div class="detail-subject">{{ activeSession.subject }}</div>
              <div class="detail-teacher">{{ activeSession.teacher }}</div>
            </div>
            <span :class="['status-pill', pillClass(activeSession.status)]">{{ activeSession.status }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Date</span><span class="detail-val">{{ formatWeekday(activeSession.date) }}, {{ formatDate(activeSession.date) }}</span></div>
          <div class="detail-row"><span class="detail-label">Time</span><span class="detail-val">{{ formatTimeRange(activeSession.timeStart, activeSession.timeEnd) }}</span></div>
          <div v-if="detailNotes(activeSession)" class="detail-row">
            <span class="detail-label">{{ detailNotesLabel(activeSession) }}</span>
            <span class="detail-val">{{ detailNotes(activeSession) }}</span>
          </div>
          <div v-if="activeSession?.status === 'Approved'" class="queue-card">
            <div class="queue-card-header">
              <div>
                <div class="queue-card-title">Queue Ticket</div>
                <div class="queue-card-subtitle">{{ queueLineLabel(activeSession) }}</div>
              </div>
              <div class="queue-ticket-badge">{{ activeSession.ticketNumber || 'Queue' }}</div>
            </div>
            <div class="queue-qr-panel" role="img" aria-label="Queue ticket barcode">
              <div class="qr-grid">
                <div v-for="(cell, index) in qrCells" :key="index" class="qr-cell" :class="{ filled: cell }"></div>
              </div>
            </div>
            <div class="queue-ticket-details">
              <div class="queue-ticket-line"><span>Ticket</span><strong>{{ activeSession.ticketNumber || `#${activeSession.id}` }}</strong></div>
              <div class="queue-ticket-line"><span>Teacher</span><strong>{{ activeSession.teacher }}</strong></div>
              <div class="queue-ticket-line"><span>Subject</span><strong>{{ activeSession.subject }}</strong></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-submit" @click="downloadQueueDetails">Download Queue Details</button>
        </div>
      </div>
      </div>
    </Teleport>

    <!-- ══ EDIT SESSION MODAL ══ -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Edit Session</span><button class="modal-close" @click="showEdit = false">✕</button></div>
        <div class="modal-body">
          <div class="teacher-pill" v-if="activeSession">
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">
              <img v-if="activeSession.teacherAvatar" :src="activeSession.teacherAvatar" :alt="`${activeSession.teacher} profile`" />
              <span v-else>{{ activeSession.teacherInitials }}</span>
            </div>
            <div><div class="tp-name">{{ activeSession.subject }}</div><div class="tp-subj">{{ activeSession.teacher }}</div></div>
          </div>
          <div class="field-group">
            <label class="field-label">Subject</label>
            <select v-model="editForm.subject" class="field-input">
              <option value="" disabled>Select subject</option>
              <option v-for="subject in activeSession?.subjectList || []" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Reason</label>
            <select v-model="editForm.reason" class="field-input">
              <option v-for="reason in CONSULTATION_REASONS" :key="reason" :value="reason">
                {{ reason }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Consultation Schedule</label>
            <select v-model="editForm.availabilityId" class="field-input">
              <option value="" disabled>Select assigned availability</option>
              <option v-for="slot in activeSession?.consultationSlots || []" :key="slot.id" :value="slot.id">
                {{ formatSlotLabel(slot) }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Short Description <span class="optional">(optional)</span></label>
            <textarea v-model="editForm.description" class="field-input field-textarea" rows="3" placeholder="Briefly describe your concern..."></textarea>
          </div>
          <div v-if="editError" class="msg-err">{{ editError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showEdit = false">Cancel</button>
          <button class="modal-submit" :disabled="isSavingEdit" @click="saveEdit">
            {{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ CANCEL CONFIRMATION MODAL ══ -->
    <div v-if="showCancel" class="modal-overlay alert-overlay" @click.self="showCancel = false">
      <div class="cancel-alert">
        <div class="cancel-alert-icon">!</div>
        <div class="cancel-alert-text">Are you sure you want to cancel your consultation to that teacher?</div>
        <div class="cancel-alert-actions">
          <button class="alert-cancel" @click="showCancel = false">Cancel</button>
          <button class="alert-continue" @click="confirmCancel">Continue</button>
        </div>
      </div>
    </div>

    <!-- ══ RESCHEDULE MODAL ══ -->
    <div v-if="showReschedule" class="modal-overlay" @click.self="showReschedule = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Reschedule Session</span><button class="modal-close" @click="showReschedule = false">✕</button></div>
        <div class="modal-body">
          <div class="teacher-pill" v-if="activeSession">
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">
              <img v-if="activeSession.teacherAvatar" :src="activeSession.teacherAvatar" :alt="`${activeSession.teacher} profile`" />
              <span v-else>{{ activeSession.teacherInitials }}</span>
            </div>
            <div><div class="tp-name">{{ activeSession.subject }}</div><div class="tp-subj">{{ activeSession.teacher }}</div></div>
          </div>
          <div class="form-row-2">
            <div class="field-group">
              <label class="field-label">New Date</label>
              <input v-model="reschedForm.date" class="field-input" type="date" :min="today" />
            </div>
            <div class="field-group">
              <label class="field-label">New Time</label>
              <input v-model="reschedForm.time" class="field-input" type="time" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Notes <span class="optional">(optional)</span></label>
            <textarea v-model="reschedForm.notes" class="field-input field-textarea" rows="2" placeholder="Any additional details..."></textarea>
          </div>
          <div v-if="reschedError" class="msg-err">{{ reschedError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showReschedule = false">Cancel</button>
          <button class="modal-submit" @click="confirmReschedule">Reschedule</button>
        </div>
      </div>
    </div>

    <!-- ══ LEAVE REVIEW MODAL ══ -->
    <div v-if="showReview" class="modal-overlay" @click.self="showReview = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Leave a Review</span><button class="modal-close" @click="showReview = false">✕</button></div>
        <div class="modal-body">
          <div class="teacher-pill" v-if="activeSession">
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">
              <img v-if="activeSession.teacherAvatar" :src="activeSession.teacherAvatar" :alt="`${activeSession.teacher} profile`" />
              <span v-else>{{ activeSession.teacherInitials }}</span>
            </div>
            <div><div class="tp-name">{{ activeSession.subject }}</div><div class="tp-subj">{{ activeSession.teacher }}</div></div>
          </div>
          <div class="field-group">
            <label class="field-label">Rating</label>
            <div class="star-row">
              <button v-for="n in 5" :key="n" type="button" class="star-btn" :class="{ active: reviewForm.rating >= n }" @click="reviewForm.rating = n">★</button>
            </div>
            <div v-if="reviewForm.rating" class="star-label">{{ ratingLabel }}</div>
          </div>
          <div class="field-group">
            <label class="field-label">Comment <span class="optional">(optional)</span></label>
            <textarea v-model="reviewForm.comment" class="field-input field-textarea" rows="4" placeholder="Share your experience with this teacher..."></textarea>
          </div>
          <div v-if="reviewError" class="msg-err">{{ reviewError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showReview = false">Cancel</button>
          <button class="modal-submit" @click="submitReview">Submit Review</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>

      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh.js'
import { useStudentData } from '@/composables/useStudentData.js'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'

const { sessions, cancelSession, updateSession, isLoadingSessions, sessionsError, loadSessions } = useStudentData()
const { refresh: refreshConsultations } = useAutoRefresh(
  () => loadSessions(true, { includeArchived: true })
)

const CONSULTATION_REASONS = [
  'Lesson Clarification',
  'Assignment Assistance',
  'Project Consultation',
  'Exam Preparation',
  'Grade Inquiry',
  'Career Guidance',
  'Other Academic Concern',
]

const tabs       = ['All', 'Pending', 'Approved', 'Reschedule', 'Completed', 'Cancelled', 'Archived']
const activeTab  = ref('All')

const filteredSessions = computed(() =>
  activeTab.value === 'All' ? sessions.value : sessions.value.filter(s => s.status === activeTab.value)
)

function pillClass(s) {
  return {
    Approved: 'pill-green',
    Pending: 'pill-blue',
    Reschedule: 'pill-red',
    Completed: 'pill-yellow',
    Cancelled: 'pill-red',
    Archived: 'pill-gray',
  }[s] || 'pill-gray'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}

function formatWeekday(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(`${dateStr}T00:00:00`)
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  } catch {
    return ''
  }
}

function formatTime(timeStr) {
  if (!timeStr) return ''

  const text = String(timeStr).trim()

  const plainMatch = text.match(/^(\d{1,2}):(\d{2})$/)
  if (plainMatch) {
    const h = Number(plainMatch[1])
    const m = Number(plainMatch[2])
    if (Number.isNaN(h) || Number.isNaN(m)) return text
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const ampmMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampmMatch) {
    const h = Number(ampmMatch[1])
    const m = Number(ampmMatch[2])
    const ap = ampmMatch[3].toUpperCase()
    if (Number.isNaN(h) || Number.isNaN(m)) return text
    return `${h}:${String(m).padStart(2, '0')} ${ap}`
  }

  try {
    const [h, m] = text.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  } catch { return text }
}

function formatTimeRange(start, end) {
  const startText = formatTime(start)
  const endText = formatTime(end)
  if (startText && endText) return `${startText} - ${endText}`
  if (startText) return startText
  if (endText) return endText
  return '--:--'
}

function ordinal(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return ''
  const mod100 = v % 100
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`
  const mod10 = v % 10
  if (mod10 === 1) return `${v}st`
  if (mod10 === 2) return `${v}nd`
  if (mod10 === 3) return `${v}rd`
  return `${v}th`
}

function parseStartDateTime(session) {
  const dateText = String(session?.date || '').trim()
  const timeText = String(session?.timeStart || '').trim()
  if (!dateText || !timeText) return null

  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dateMatch) return null

  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!timeMatch) return null

  let hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const ampm = (timeMatch[3] || '').toUpperCase()

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (ampm) {
    if (ampm === 'PM' && hour !== 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
  }

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hour,
    minute,
    0,
    0
  )
}

function hasConsultationStarted(session) {
  const start = parseStartDateTime(session)
  if (!start || Number.isNaN(start.getTime())) return false
  return Date.now() >= start.getTime()
}

function queueLineLabel(session) {
  const position = Number(session?.queuePosition)
  if (!Number.isFinite(position) || position <= 0) {
    return 'In queue'
  }

  const started = hasConsultationStarted(session)
  if (!started) {
    return `Queue #${position}`
  }

  if (position === 1) {
    return 'Go to faculty now (Queue #1)'
  }

  if (position === 2) {
    return 'You are next for consultation (1 ahead)'
  }

  return `Queue #${position}`
}

function queueWaitNote(session) {
  if (hasConsultationStarted(session)) return ''
  return 'Please wait for the start of consultation hours.'
}

const qrCells = computed(() => {
  const seed = String(activeSession.value?.ticketNumber || activeSession.value?.id || 'queue')
  const size = 9
  const cells = []

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const edge = row < 2 || row > size - 3 || col < 2 || col > size - 3
      const corner = (row < 3 && col < 3) || (row < 3 && col > size - 4) || (row > size - 4 && col < 3)
      const hash = (seed.charCodeAt((row + col) % seed.length) + row * 7 + col * 5) % 2
      cells.push(edge || corner ? 1 : hash === 0)
    }
  }

  return cells
})

function downloadQueueDetails() {
  const session = activeSession.value
  if (!session) return

  const ticketNumber = String(session.ticketNumber || `#${session.id || 'queue'}`).trim()
  const title = 'CIT Scheduler Consultation Ticket'
  const details = [
    `Teacher: ${session.teacher || '-'}`,
    `Subject: ${session.subject || '-'}`,
    `Date: ${formatWeekday(session.date)}, ${formatDate(session.date)}`,
    `Time: ${formatTimeRange(session.timeStart, session.timeEnd)}`,
    `Reason: ${session.reason || session.notes || 'N/A'}`,
  ]

  const canvasWidth = 900
  const canvasHeight = 780
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#f5f7fb'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = '#111827'
  ctx.font = '28px Poppins, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(title, 48, 64)

  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(48, 84)
  ctx.lineTo(canvasWidth - 48, 84)
  ctx.stroke()

  ctx.font = '22px Poppins, sans-serif'
  ctx.fillStyle = '#1f2937'
  ctx.fillText(`Ticket: ${ticketNumber}`, 48, 130)

  const bodyTop = 180
  const lineHeight = 46
  ctx.font = '20px Poppins, sans-serif'
  details.forEach((line, index) => {
    const y = bodyTop + index * lineHeight
    ctx.fillText(line, 48, y)
  })

  ctx.fillStyle = '#4b5563'
  ctx.font = '18px Poppins, sans-serif'
  ctx.fillText('Present this image to your teacher at consultation time.', 48, canvasHeight - 72)

  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = `consultation-ticket-${ticketNumber.replace(/\s+/g, '-').toLowerCase()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('Consultation ticket image downloaded.')
}

function detailNotes(session) {
  if (!session) return ''
  if (session.status === 'Completed') {
    return String(session.consultationNotes || '').trim()
  }
  return String(session.notes || '').trim()
}

function detailNotesLabel(session) {
  if (session?.status === 'Completed') {
    return 'Consultation Notes'
  }
  return 'Notes'
}

const today         = new Date().toISOString().split('T')[0]
const activeSession = ref(null)
const toastMsg      = ref('')

/* ── View Details ── */
const showDetails = ref(false)
function openDetails(s) { activeSession.value = s; showDetails.value = true }

/* ── Edit Session ── */
const showEdit  = ref(false)
const editForm  = ref({ subject: '', reason: CONSULTATION_REASONS[0], availabilityId: '', description: '' })
const editError = ref('')
const isSavingEdit = ref(false)

function formatSlotLabel(slot) {
  return `${slot.dayOfWeek} • ${slot.startTime} - ${slot.endTime}`
}

function openEdit(s) {
  activeSession.value = s
  editForm.value = {
    subject: s.subject || (s.subjectList?.[0] || ''),
    reason: s.reason || CONSULTATION_REASONS[0],
    availabilityId: s.availabilityId || (s.consultationSlots?.[0]?.id || ''),
    description: s.description || '',
  }
  editError.value = ''
  showEdit.value  = true
}
async function saveEdit() {
  if (isSavingEdit.value) return
  editError.value = ''
  if (!editForm.value.subject.trim()) { editError.value = 'Please select a subject.'; return }
  if (!editForm.value.reason.trim()) { editError.value = 'Please select a reason.'; return }
  if (!editForm.value.availabilityId) { editError.value = 'Please select consultation availability.'; return }

  const hasDuplicatePending = sessions.value.some((item) => {
    if (String(item.id) === String(activeSession.value.id)) {
      return false
    }

    const sameTeacher = (item.employeeId && activeSession.value.employeeId)
      ? String(item.employeeId) === String(activeSession.value.employeeId)
      : String(item.teacher || '').trim().toLowerCase() === String(activeSession.value.teacher || '').trim().toLowerCase()

    return sameTeacher
      && item.status === 'Pending'
      && String(item.availabilityId || '') === String(editForm.value.availabilityId)
  })

  if (hasDuplicatePending) {
    editError.value = 'You already have a pending request for this teacher and consultation schedule. Please choose another time slot or another teacher.'
    return
  }

  const notes = [
    `Reason: ${editForm.value.reason}`,
    editForm.value.description ? `Description: ${editForm.value.description.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  isSavingEdit.value = true
  try {
    await updateSession(
      activeSession.value.id,
      {
        subject: editForm.value.subject.trim(),
        availabilityId: editForm.value.availabilityId,
        notes,
        reason: editForm.value.reason,
        description: editForm.value.description,
      },
      { requireBackend: true }
    )

    await loadSessions(true)
    showEdit.value = false
    showToast('Session updated. Queue position refreshed.')
  } catch (error) {
    editError.value = error.message || 'Failed to save changes. Please try again.'
  } finally {
    isSavingEdit.value = false
  }
}

/* ── Cancel Confirmation ── */
const showCancel = ref(false)
function openCancel(s) { activeSession.value = s; showCancel.value = true }
async function confirmCancel() {
  try {
    await cancelSession(activeSession.value.id)
    await loadSessions(true)
    showCancel.value = false
    showToast('Session cancelled.')
  } catch (error) {
    showCancel.value = false
    showToast(error.message || 'Failed to cancel session.')
  }
}

/* ── Reschedule ── */
const showReschedule = ref(false)
const reschedForm    = ref({ date: '', time: '', notes: '' })
const reschedError   = ref('')
function openReschedule(s) {
  activeSession.value = s
  reschedForm.value = { date: '', time: '', notes: '' }
  reschedError.value = ''
  showReschedule.value = true
}
function confirmReschedule() {
  reschedError.value = ''
  if (!reschedForm.value.date) { reschedError.value = 'Please select a new date.'; return }
  if (!reschedForm.value.time) { reschedError.value = 'Please select a new time.'; return }
  updateSession(activeSession.value.id, {
    date: reschedForm.value.date,
    time: reschedForm.value.time,
    notes: reschedForm.value.notes,
    status: 'Pending',
    reason: null,
  })
  showReschedule.value = false
  showToast('Session rescheduled! Awaiting approval.')
}

/* ── Leave Review ── */
const showReview  = ref(false)
const reviewForm  = ref({ rating: 0, comment: '' })
const reviewError = ref('')
const ratingLabel = computed(() =>
  ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][reviewForm.value.rating] || ''
)
function openReview(s) {
  activeSession.value = s
  reviewForm.value = { rating: 0, comment: '' }
  reviewError.value = ''
  showReview.value  = true
}
function submitReview() {
  reviewError.value = ''
  if (!reviewForm.value.rating) { reviewError.value = 'Please select a rating.'; return }
  updateSession(activeSession.value.id, { reviewed: true })
  showReview.value = false
  showToast('Thank you for your review! ⭐')
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

onMounted(() => {
  loadSessions(true, { includeArchived: true })
})
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100%;
  margin: 0 auto;
  background:
    radial-gradient(1100px 380px at 50% -260px, #e7e9ea 0%, rgba(231, 244, 237, 0) 70%),
    #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 16px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  padding: 16px 18px;
  border-bottom: 1px solid #e8ece9;
  position: sticky;
  top: 0;
  z-index: 20;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #444; padding: 4px; display: flex; align-items: center;
  border-radius: 6px; margin-left: -4px; transition: color 0.15s;
}
.back-btn:hover { color: #4b5563; }
.header-title { font-weight: 700; font-size: 1rem; color: #4b5563; }

/* Tabs */
.tabs-row {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e9eeeb;
  padding: 10px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  position: sticky;
  top: 65px;
  z-index: 19;
}
.tabs-row::-webkit-scrollbar { display: none; }
.tab-btn {
  flex: 0 0 auto;
  padding: 8px 15px;
  background: #fff;
  border: 1.5px solid #e4e8e6;
  border-radius: 20px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.16s ease;
}
.tab-btn:hover { border-color: #cbd0d4; color: #34423b; }
.tab-btn.active {
  color: #fff;
  font-weight: 700;
  background: #4b5563;
  border-color: #4b5563;
  box-shadow: 0 6px 14px rgba(48, 53, 58, 0.22);
}

/* Sessions */
.sessions-list { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px 10px; }
.sessions-list.is-loading { min-height: calc(100dvh - 126px); padding: 0; }
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  text-align: center; color: #9ba3ab; font-size: 0.9rem; padding: 54px 0;
}
.empty-state.loading-state { align-items: stretch; min-height: 100%; padding: 0; }
.empty-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: #697680;
  background: #e8ecee;
}
.empty-icon svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.empty-icon.error-icon { color: #d34b58; background: #ffedf0; }
.loading-panel {
  width: 100%;
  min-height: calc(100dvh - 126px);
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
.session-skeleton {
  display: flex;
  gap: 12px;
  padding: 13px;
  border: 1px solid #e7ebeb;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.72);
}
.session-skeleton.second { margin-top: 8px; opacity: 0.58; }
.skeleton-avatar,
.skeleton-line,
.skeleton-chips span {
  background: linear-gradient(90deg, #e7ecec 25%, #f5f7f7 50%, #e7ecec 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
.skeleton-avatar { width: 38px; height: 38px; flex: 0 0 auto; border-radius: 50%; }
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
.session-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(91, 99, 106, 0.14);
  padding: 15px;
  box-shadow: 0 8px 18px rgba(38, 44, 49, 0.09), inset 0 1px rgba(255, 255, 255, 0.9);
}

.session-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.session-avatar {
  width: 42px; height: 42px; flex-shrink: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 0.95rem; overflow: hidden;
}
.session-avatar img,
.session-avatar-lg img,
.tp-avatar img { width: 100%; height: 100%; object-fit: cover; }
.session-meta { flex: 1; }
.session-subject { font-weight: 800; font-size: 0.92rem; line-height: 1.35; color: #252a2f; }
.session-teacher { font-size: 0.79rem; color: #66727c; margin: 2px 0 8px; }
.session-info-row { display: flex; gap: 8px; flex-wrap: wrap; }
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.73rem;
  color: #6b7280;
  background: #eef0f1;
  border: 1px solid #d9dde0;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.info-chip svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
.queue-row { margin-top: 6px; }
.queue-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.74rem;
  font-weight: 600;
  color: #4b5259;
  background: #e9ebec;
  border: 1px solid #d0d4d7;
  padding: 4px 10px;
  border-radius: 999px;
}
.queue-chip.queue-next {
  color: #0b6b3a;
  background: #d8dcdf;
  border-color: #9fd6b4;
}
.queue-note {
  display: block;
  margin-top: 5px;
  font-size: 0.72rem;
  color: #5f6b76;
}

.status-pill {
  font-size: 0.71rem; font-weight: 700;
  padding: 4px 11px; border-radius: 999px; white-space: nowrap; flex-shrink: 0;
}
.pill-green  { background: #e0f2e7; color: #287344; }
.pill-blue   { background: #e1efff; color: #2563a8; }
.pill-yellow { background: #fff4cc; color: #9a6700; }
.pill-red    { background: #ffeaea; color: #e63946; }
.pill-gray   { background: #f0f0f0; color: #666; }

.rejection-msg {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: #fff1f2; color: #c0392b;
  border: 1px solid #ffd8dd;
  font-size: 0.8rem; padding: 9px 12px;
  border-radius: 10px; margin-bottom: 10px;
}
.rejection-msg svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

.session-actions { display: flex; gap: 8px; }
.act-btn {
  flex: 1; padding: 10px;
  border-radius: 10px; border: none;
  font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
}
.act-btn:active { transform: translateY(1px); }
.act-btn.outline { background: #fff; color: #333; border: 1.5px solid #ddd; }
.act-btn.red     { background: #e63946; color: #fff; }
.act-btn.green   { background: #4b5563; color: #fff; }
.act-btn.full    { flex: 1; }
.reviewed-badge  { flex: 1; text-align: center; font-size: 0.82rem; font-weight: 600; color: #6b7280; padding: 10px; }

/* ── Modals ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 2000; display: flex; align-items: flex-end; justify-content: center;
}
.alert-overlay {
  align-items: center;
  backdrop-filter: blur(1.5px);
}
.modal-sheet {
  position: relative;
  z-index: 2001;
  width: 100%; max-width: 430px; background: #fff;
  border-radius: 22px 22px 0 0;
  max-height: 92dvh;
  overflow-y: auto;
  padding-bottom: 24px;
  border: 1px solid #edf1ee;
}
.modal-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 12px auto 0; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 14px; font-weight: 700; font-size: 1rem;
  border-bottom: 1px solid #eef0f1;
}
.modal-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #999; line-height: 1; }
.modal-body  { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; gap: 10px; padding: 12px 20px 0; }
.modal-cancel {
  flex: 1; padding: 12px; background: #f0f0f0; color: #555;
  border: none; border-radius: 10px;
  font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.modal-submit {
  flex: 2; padding: 12px; background: #4b5563; color: #fff;
  border: none; border-radius: 10px;
  font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.modal-danger {
  flex: 2; padding: 12px; background: #e63946; color: #fff;
  border: none; border-radius: 10px;
  font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.full-btn { flex: 1; }

/* Cancel alert */
.cancel-alert {
  width: 270px;
  background: #fff;
  border: 1px solid #6f7b85;
  border-radius: 14px;
  padding: 14px 12px 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}
.cancel-alert-icon {
  width: 48px;
  height: 48px;
  margin: 2px auto 10px;
  border: 3px solid #f0c541;
  border-radius: 14px;
  color: #f0c541;
  font-weight: 700;
  font-size: 1.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cancel-alert-text {
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #30343a;
  margin-bottom: 10px;
}
.cancel-alert-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.alert-cancel,
.alert-continue {
  border: none;
  background: transparent;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  padding: 2px 4px;
}
.alert-cancel { color: #f4434f; }
.alert-continue {
  color: #fff;
  background: #1b7741;
  border-radius: 999px;
  padding: 2px 12px;
}

/* Form fields */
.field-group   { display: flex; flex-direction: column; gap: 6px; }
.field-label   { font-size: 0.8rem; font-weight: 600; color: #444; }
.optional      { font-weight: 400; color: #aaa; }
.field-input   {
  width: 100%; padding: 10px 12px; border: 1.5px solid #e5e7eb;
  border-radius: 8px; font-family: inherit; font-size: 0.87rem;
  outline: none; box-sizing: border-box;
}
.field-input:focus {
  border-color: #4b5563;
  box-shadow: 0 0 0 3px rgba(48, 53, 58, 0.12);
}
.field-textarea { resize: none; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg-err { color: #e63946; font-size: 0.8rem; font-weight: 500; }

/* Teacher pill */
.teacher-pill {
  display: flex; align-items: center; gap: 12px;
  background: #f6f8f7;
  border: 1px solid #e7ece9;
  border-radius: 12px;
  padding: 12px;
}
.tp-avatar {
  width: 44px; height: 44px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem; flex-shrink: 0; overflow: hidden;
}
.tp-name { font-weight: 700; font-size: 0.9rem; color: #111; }
.tp-subj { font-size: 0.75rem; color: #777; margin-top: 2px; }

/* Details modal */
.detail-hero {
  display: flex; align-items: center; gap: 12px;
  padding: 4px 0 8px; border-bottom: 1px solid #f0f0f0;
}
.session-avatar-lg {
  width: 50px; height: 50px; border-radius: 50%; color: #fff; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem; overflow: hidden;
}
.detail-main  { flex: 1; }
.detail-subject { font-weight: 700; font-size: 0.95rem; color: #111; }
.detail-teacher { font-size: 0.8rem; color: #666; margin-top: 2px; }
.detail-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 10px 0; border-bottom: 1px solid #f0f3f1;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.8rem; color: #888; flex-shrink: 0; }
.detail-val   { font-size: 0.85rem; font-weight: 600; color: #1a1d21; text-align: right; max-width: 60%; }

/* Confirm modal */
.confirm-icon { font-size: 2.5rem; text-align: center; }
.confirm-text { font-size: 0.92rem; color: #111; text-align: center; line-height: 1.5; }
.confirm-sub  { font-size: 0.8rem; color: #aaa; text-align: center; }

/* Review stars */
.star-row { display: flex; gap: 6px; }
.star-btn {
  background: none; border: none; font-size: 2rem; cursor: pointer;
  color: #ddd; padding: 2px; line-height: 1; transition: color 0.15s;
}
.star-btn.active { color: #f4a261; }
.star-label { font-size: 0.82rem; font-weight: 700; color: #f4a261; margin-top: 2px; }

/* Toast */
.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: #4b5563; color: #fff; padding: 10px 22px;
  border-radius: 20px; font-size: 0.85rem; font-weight: 600;
  z-index: 200; white-space: nowrap;
  box-shadow: 0 10px 22px rgba(48, 53, 58, 0.24);
  animation: fadeUp 0.25s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
/* Queue ticket */
.queue-card {
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f4f7fb 100%);
}
.queue-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.queue-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
}
.queue-card-subtitle {
  font-size: 0.76rem;
  color: #6b7280;
  margin-top: 2px;
}
.queue-ticket-badge {
  background: #4b5563;
  color: #fff;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 0.72rem;
  font-weight: 700;
}
.queue-qr-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
}
.qr-grid {
  display: grid;
  grid-template-columns: repeat(9, 8px);
  gap: 2px;
}
.qr-cell {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #e5e7eb;
}
.qr-cell.filled {
  background: #111827;
}
.queue-ticket-details {
  margin-top: 10px;
  display: grid;
  gap: 6px;
}
.queue-ticket-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.76rem;
  color: #4b5563;
}
.queue-ticket-line strong {
  color: #111827;
  text-align: right;
}

/* Metallic bottom-sheet modal system */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 30000 !important;
  align-items: flex-end;
  background: rgba(31,35,39,.58);
  backdrop-filter: blur(7px);
}

.modal-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 30001;
  margin: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  max-height: 92dvh;
  overflow-y: auto;
  border: 1px solid rgba(255,255,255,.85);
  border-radius: 28px 28px 0 0;
  background: linear-gradient(145deg, #f8f9f9, #dfe3e5);
  box-shadow: 0 -14px 32px rgba(22,26,30,.26), inset 0 1px rgba(255,255,255,.95);
}

.modal-handle { width: 48px; height: 5px; margin: 12px auto 2px; border-radius: 999px; background: #aeb6bc; }
.modal-header { padding: 17px 22px 16px; border-bottom-color: rgba(104,112,120,.18); color: #252b30; font-size: 1.08rem; font-weight: 800; }
.modal-close { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid rgba(255,255,255,.8); border-radius: 50%; background: linear-gradient(145deg,#f8f9f9,#d8dde0); color: #69747d; box-shadow: inset 0 1px rgba(255,255,255,.9); }
.modal-body { padding: 18px 20px 6px; gap: 16px; }
.modal-footer { gap: 10px; padding: 14px 20px 24px; }
.modal-cancel, .modal-submit, .modal-danger { min-height: 46px; border-radius: 13px; }
.modal-cancel { border: 1px solid #cbd2d6; background: linear-gradient(145deg,#f3f4f4,#dfe2e3); color: #59646d; }
.modal-submit { border: 1px solid #303940; background: linear-gradient(145deg,#59636b,#303940); box-shadow: inset 0 1px rgba(255,255,255,.18), 0 6px 13px rgba(39,44,49,.2); }
.detail-hero { padding: 6px 0 14px; border-bottom-color: rgba(104,112,120,.18); }
.detail-subject { color: #252b31; }
.detail-teacher { color: #68747d; }
.detail-row { padding: 13px 0; border-bottom-color: rgba(104,112,120,.16); }
.detail-label { color: #68747d; }
.detail-val { color: #303940; }
.queue-card { border-color: #ccd5dc; border-radius: 16px; background: linear-gradient(145deg,#f1f4f5,#e0e5e8); box-shadow: inset 0 1px rgba(255,255,255,.82); }
.queue-card-title { color: #303940; }
.queue-card-subtitle { color: #68747d; }
.queue-ticket-badge { border-radius: 12px; background: linear-gradient(145deg,#59636b,#303940); }
.queue-qr-panel { border-color: #d1d8dc; background: #f8f9f9; }
.queue-ticket-line { color: #68747d; }
.queue-ticket-line strong { color: #303940; }

/* Metallic consultation workspace */
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

.tabs-row {
  gap: 9px;
  padding: 12px 18px 8px;
  background: rgba(232,235,236,.7);
  border-bottom: 1px solid rgba(255,255,255,.64);
  box-shadow: 0 5px 12px rgba(39,44,49,.06);
}

.tab-btn {
  min-height: 38px;
  padding: 7px 16px;
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 999px;
  background: linear-gradient(145deg, #f8f9f9, #dfe3e5);
  color: #56616b;
  box-shadow: inset 0 1px rgba(255,255,255,.9), 0 2px 5px rgba(39,44,49,.045);
}

.tab-btn.active {
  background: linear-gradient(145deg, #59636b, #303940);
  border-color: #414a51;
  box-shadow: inset 0 1px rgba(255,255,255,.2), 0 3px 7px rgba(39,44,49,.11);
}

.sessions-list { gap: 14px; padding: 16px 18px 24px; }
.session-card {
  padding: 17px;
  border: 1px solid rgba(255,255,255,.76);
  border-radius: 21px;
  background: linear-gradient(145deg, rgba(250,251,251,.96), rgba(224,228,230,.9));
  box-shadow: inset 0 1px rgba(255,255,255,.94), 0 10px 22px rgba(39,44,49,.13);
}

.session-top { gap: 13px; margin-bottom: 15px; }
.session-avatar { width: 58px; height: 58px; border-radius: 17px; box-shadow: inset 0 1px rgba(255,255,255,.45), 0 5px 10px rgba(39,44,49,.14); }
.session-meta { min-width: 0; }
.session-subject { font-size: .96rem; color: #252b31; }
.session-teacher { color: #68747d; }
.info-chip,
.queue-chip {
  border-color: #cdd4d9;
  background: rgba(241,244,245,.8);
  color: #59656e;
  border-radius: 999px;
}

.queue-chip { border-radius: 12px; }
.queue-chip.queue-next { color: #287344; background: #e1eee6; border-color: #a6d2b5; border-radius: 12px; }
.status-pill { border: 1px solid rgba(255,255,255,.7); padding: 6px 10px; }
.pill-green { background: #e0eee5; color: #397051; }
.pill-blue { background: #e1e8ef; color: #526f8c; }
.pill-yellow { background: #eee7d9; color: #9a713a; }
.pill-red { background: #eee0e1; color: #a95159; }
.pill-gray { background: #e3e6e8; color: #68727a; }

.session-actions { padding-top: 2px; }
.act-btn { min-height: 44px; border-radius: 13px; }
.act-btn.outline { background: linear-gradient(145deg,#f7f8f8,#e0e3e5); color: #4d5963; border-color: #cbd2d6; }
.act-btn.green { background: linear-gradient(145deg,#59636b,#303940); box-shadow: inset 0 1px rgba(255,255,255,.18), 0 6px 12px rgba(39,44,49,.2); }
.act-btn.red { background: linear-gradient(145deg,#b96a70,#91474e); }
.rejection-msg { border-color: #e3c5c8; background: #f2e5e6; color: #9a4d55; }
</style>
