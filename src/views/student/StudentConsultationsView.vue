<template>
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
    <div class="sessions-list">
      <div v-if="isLoadingSessions" class="empty-state">
        <div class="empty-icon">⏳</div>
        <div>Loading sessions...</div>
      </div>
      <div v-else-if="sessionsError" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div>{{ sessionsError }}</div>
      </div>
      <div v-else-if="filteredSessions.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div>No sessions found.</div>
      </div>
      <div v-for="s in filteredSessions" :key="s.id" class="session-card">
        <div class="session-top">
          <div class="session-avatar" :style="{ background: s.teacherColor }">{{ s.teacherInitials }}</div>
          <div class="session-meta">
            <div class="session-subject">{{ s.subject }}</div>
            <div class="session-teacher">{{ s.teacher }}</div>
            <div class="session-info-row">
              <span class="info-chip">📅 {{ formatWeekday(s.date) }}, {{ formatDate(s.date) }}</span>
              <span class="info-chip">🕐 {{ formatTimeRange(s.timeStart, s.timeEnd) }}</span>
              <span class="info-chip" v-if="s.status === 'Approved' && s.ticketNumber">🎟 {{ s.ticketNumber }}</span>
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
          ✖ {{ s.reason }}
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
    </div>

    <!-- ══ VIEW DETAILS MODAL ══ -->
    <div v-if="showDetails" class="modal-overlay" @click.self="showDetails = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Session Details</span><button class="modal-close" @click="showDetails = false">✕</button></div>
        <div class="modal-body" v-if="activeSession">
          <div class="detail-hero">
            <div class="session-avatar-lg" :style="{ background: activeSession.teacherColor }">{{ activeSession.teacherInitials }}</div>
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
        </div>
        <div class="modal-footer">
          <button class="modal-cancel full-btn" @click="showDetails = false">Close</button>
        </div>
      </div>
    </div>

    <!-- ══ EDIT SESSION MODAL ══ -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Edit Session</span><button class="modal-close" @click="showEdit = false">✕</button></div>
        <div class="modal-body">
          <div class="teacher-pill" v-if="activeSession">
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">{{ activeSession.teacherInitials }}</div>
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
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">{{ activeSession.teacherInitials }}</div>
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
            <div class="tp-avatar" :style="{ background: activeSession.teacherColor }">{{ activeSession.teacherInitials }}</div>
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

    <BottomNav active="consultations" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import BottomNav from '@/components/student/BottomNav.vue'
import { useStudentData } from '@/composables/useStudentData.js'

const { sessions, cancelSession, updateSession, isLoadingSessions, sessionsError, loadSessions } = useStudentData()

const AUTO_REFRESH_MS = 10000
const CONSULTATION_REASONS = [
  'Lesson Clarification',
  'Assignment Assistance',
  'Project Consultation',
  'Exam Preparation',
  'Grade Inquiry',
  'Career Guidance',
  'Other Academic Concern',
]

const tabs       = ['All', 'Pending', 'Approved', 'Reschedule', 'Completed', 'Cancelled']
const activeTab  = ref('All')

const filteredSessions = computed(() =>
  activeTab.value === 'All' ? sessions.value : sessions.value.filter(s => s.status === activeTab.value)
)

function pillClass(s) {
  return {
    Approved: 'pill-green',
    Pending: 'pill-orange',
    Reschedule: 'pill-red',
    Completed: 'pill-gray',
    Cancelled: 'pill-gray',
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

let autoRefreshTimer = null

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    loadSessions(true)
  }
}

function onWindowFocus() {
  loadSessions(true)
}

function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }

  autoRefreshTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') {
      return
    }
    loadSessions(true)
  }, AUTO_REFRESH_MS)
}

onMounted(() => {
  loadSessions(true)
  startAutoRefresh()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onWindowFocus)
})

onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }

  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('focus', onWindowFocus)
})
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100dvh;
  margin: 0 auto; background: #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 72px;
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
.back-btn:hover { color: #1b4332; }
.header-title { font-weight: 700; font-size: 1rem; color: #1b4332; }

/* Tabs */
.tabs-row {
  display: flex;
  gap: 8px;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 10px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-row::-webkit-scrollbar { display: none; }
.tab-btn {
  flex: 0 0 auto;
  padding: 8px 14px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn.active {
  color: #fff;
  font-weight: 700;
  background: #1b4332;
  border-color: #1b4332;
}

/* Sessions */
.sessions-list { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px 0; }
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  text-align: center; color: #bbb; font-size: 0.88rem; padding: 48px 0;
}
.empty-icon { font-size: 2.5rem; }
.session-card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

.session-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.session-avatar {
  width: 42px; height: 42px; flex-shrink: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 0.95rem;
}
.session-meta { flex: 1; }
.session-subject { font-weight: 700; font-size: 0.88rem; color: #111; }
.session-teacher { font-size: 0.76rem; color: #666; margin: 2px 0 6px; }
.session-info-row { display: flex; gap: 8px; flex-wrap: wrap; }
.info-chip { font-size: 0.73rem; color: #2d6a4f; background: #eef7f1; padding: 3px 8px; border-radius: 6px; font-weight: 500; }
.queue-row { margin-top: 6px; }
.queue-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.73rem;
  font-weight: 600;
  color: #1f5138;
  background: #e9f7ee;
  border: 1px solid #cfe9da;
  padding: 4px 9px;
  border-radius: 999px;
}
.queue-chip.queue-next {
  color: #0b6b3a;
  background: #d8f3e8;
  border-color: #9fd6b4;
}
.queue-note {
  display: block;
  margin-top: 5px;
  font-size: 0.72rem;
  color: #5f6b76;
}

.status-pill {
  font-size: 0.69rem; font-weight: 600;
  padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
}
.pill-green  { background: #d8f3e8; color: #1b7a4a; }
.pill-orange { background: #fff3e0; color: #b35e00; }
.pill-red    { background: #ffeaea; color: #e63946; }
.pill-gray   { background: #f0f0f0; color: #666; }

.rejection-msg {
  background: #fef2f2; color: #c0392b;
  font-size: 0.8rem; padding: 8px 12px;
  border-radius: 8px; margin-bottom: 10px;
}

.session-actions { display: flex; gap: 8px; }
.act-btn {
  flex: 1; padding: 10px;
  border-radius: 8px; border: none;
  font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer;
}
.act-btn.outline { background: #fff; color: #333; border: 1.5px solid #ddd; }
.act-btn.red     { background: #e63946; color: #fff; }
.act-btn.green   { background: #1b4332; color: #fff; }
.act-btn.full    { flex: 1; }
.reviewed-badge  { flex: 1; text-align: center; font-size: 0.82rem; font-weight: 600; color: #2d6a4f; padding: 10px; }

/* ── Modals ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 100; display: flex; align-items: flex-end; justify-content: center;
}
.alert-overlay {
  align-items: center;
  backdrop-filter: blur(1.5px);
}
.modal-sheet {
  width: 100%; max-width: 430px; background: #fff;
  border-radius: 20px 20px 0 0;
  max-height: 92dvh; overflow-y: auto; padding-bottom: 28px;
}
.modal-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 12px auto 0; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 14px; font-weight: 700; font-size: 1rem;
  border-bottom: 1px solid #f0f0f0;
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
  flex: 2; padding: 12px; background: #1b4332; color: #fff;
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
.field-input:focus { border-color: #1b4332; }
.field-textarea { resize: none; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg-err { color: #e63946; font-size: 0.8rem; font-weight: 500; }

/* Teacher pill */
.teacher-pill {
  display: flex; align-items: center; gap: 12px;
  background: #f5f6f8; border-radius: 12px; padding: 12px;
}
.tp-avatar {
  width: 44px; height: 44px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
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
  font-weight: 700; font-size: 1.1rem;
}
.detail-main  { flex: 1; }
.detail-subject { font-weight: 700; font-size: 0.95rem; color: #111; }
.detail-teacher { font-size: 0.8rem; color: #666; margin-top: 2px; }
.detail-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 10px 0; border-bottom: 1px solid #f5f5f5;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.8rem; color: #888; flex-shrink: 0; }
.detail-val   { font-size: 0.85rem; font-weight: 600; color: #111; text-align: right; max-width: 60%; }

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
  background: #1b4332; color: #fff; padding: 10px 22px;
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
