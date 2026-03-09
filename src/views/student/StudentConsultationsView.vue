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
      <div v-if="filteredSessions.length === 0" class="empty-state">
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
              <span class="info-chip">📅 {{ formatDate(s.date) }}</span>
              <span class="info-chip">🕐 {{ formatTime(s.time) }}</span>
              <span class="info-chip">{{ s.duration }}</span>
            </div>
          </div>
          <span :class="['status-pill', pillClass(s.status)]">{{ s.status }}</span>
        </div>

        <!-- Rejection reason -->
        <div v-if="s.status === 'Rejected' && s.reason" class="rejection-msg">
          ✖ {{ s.reason }}
        </div>

        <!-- Actions -->
        <div class="session-actions">
          <template v-if="s.status === 'Approved'">
            <button class="act-btn outline" @click="openDetails(s)">View Details</button>
            <button class="act-btn red" @click="openCancel(s)">Cancel</button>
          </template>
          <template v-else-if="s.status === 'Pending'">
            <button class="act-btn outline" @click="openEdit(s)">Edit</button>
            <button class="act-btn red" @click="openCancel(s)">Cancel</button>
          </template>
          <template v-else-if="s.status === 'Rejected'">
            <button class="act-btn green full" @click="openReschedule(s)">Reschedule</button>
          </template>
          <template v-else-if="s.status === 'Completed'">
            <button v-if="!s.reviewed" class="act-btn outline full" @click="openReview(s)">Leave a Review</button>
            <div v-else class="reviewed-badge">✅ Reviewed</div>
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
          <div class="detail-row"><span class="detail-label">Date</span><span class="detail-val">{{ formatDate(activeSession.date) }}</span></div>
          <div class="detail-row"><span class="detail-label">Time</span><span class="detail-val">{{ formatTime(activeSession.time) }}</span></div>
          <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-val">{{ activeSession.duration }}</span></div>
          <div v-if="activeSession.notes" class="detail-row"><span class="detail-label">Notes</span><span class="detail-val">{{ activeSession.notes }}</span></div>
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
            <label class="field-label">Topic / Subject</label>
            <input v-model="editForm.subject" class="field-input" type="text" />
          </div>
          <div class="form-row-2">
            <div class="field-group">
              <label class="field-label">Date</label>
              <input v-model="editForm.date" class="field-input" type="date" :min="today" />
            </div>
            <div class="field-group">
              <label class="field-label">Time</label>
              <input v-model="editForm.time" class="field-input" type="time" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Notes <span class="optional">(optional)</span></label>
            <textarea v-model="editForm.notes" class="field-input field-textarea" rows="3"></textarea>
          </div>
          <div v-if="editError" class="msg-err">{{ editError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showEdit = false">Cancel</button>
          <button class="modal-submit" @click="saveEdit">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ══ CANCEL CONFIRMATION MODAL ══ -->
    <div v-if="showCancel" class="modal-overlay" @click.self="showCancel = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header"><span>Cancel Session</span><button class="modal-close" @click="showCancel = false">✕</button></div>
        <div class="modal-body">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-text">Are you sure you want to cancel <strong>{{ activeSession?.subject }}</strong> with <strong>{{ activeSession?.teacher }}</strong>?</div>
          <div class="confirm-sub">This action cannot be undone.</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showCancel = false">Keep Session</button>
          <button class="modal-danger" @click="confirmCancel">Yes, Cancel It</button>
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
import { ref, computed } from 'vue'
import BottomNav from '@/components/student/BottomNav.vue'
import { useStudentData } from '@/composables/useStudentData.js'

const { sessions, cancelSession, updateSession } = useStudentData()

const tabs       = ['All', 'Pending', 'Approved', 'Rejected']
const activeTab  = ref('All')

const filteredSessions = computed(() =>
  activeTab.value === 'All' ? sessions.value : sessions.value.filter(s => s.status === activeTab.value)
)

function pillClass(s) {
  return { Approved: 'pill-green', Pending: 'pill-orange', Rejected: 'pill-red', Completed: 'pill-gray' }[s] || 'pill-gray'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  } catch { return timeStr }
}

const today         = new Date().toISOString().split('T')[0]
const activeSession = ref(null)
const toastMsg      = ref('')

/* ── View Details ── */
const showDetails = ref(false)
function openDetails(s) { activeSession.value = s; showDetails.value = true }

/* ── Edit Session ── */
const showEdit  = ref(false)
const editForm  = ref({ subject: '', date: '', time: '', notes: '' })
const editError = ref('')
function openEdit(s) {
  activeSession.value = s
  editForm.value = { subject: s.subject, date: s.date, time: s.time, notes: s.notes || '' }
  editError.value = ''
  showEdit.value  = true
}
function saveEdit() {
  editError.value = ''
  if (!editForm.value.subject.trim()) { editError.value = 'Topic cannot be empty.'; return }
  if (!editForm.value.date)           { editError.value = 'Please select a date.'; return }
  if (!editForm.value.time)           { editError.value = 'Please select a time.'; return }
  updateSession(activeSession.value.id, { subject: editForm.value.subject.trim(), date: editForm.value.date, time: editForm.value.time, notes: editForm.value.notes })
  showEdit.value = false
  showToast('Session updated.')
}

/* ── Cancel Confirmation ── */
const showCancel = ref(false)
function openCancel(s) { activeSession.value = s; showCancel.value = true }
function confirmCancel() {
  cancelSession(activeSession.value.id)
  showCancel.value = false
  showToast('Session cancelled.')
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
  display: flex; background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0 16px;
}
.tab-btn {
  flex: 1; padding: 12px 0;
  background: none; border: none;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: #888; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn.active { color: #1b4332; font-weight: 700; border-bottom-color: #1b4332; }

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
