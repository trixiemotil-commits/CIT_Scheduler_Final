<template>
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
    <div class="teacher-list">
      <div v-if="loadingTeachers" class="empty-state-card">Loading teachers...</div>
      <div v-else-if="loadError" class="empty-state-card error">{{ loadError }}</div>
      <div v-else-if="!filteredTeachers.length" class="empty-state-card">No teachers found.</div>
      <div v-for="t in filteredTeachers" :key="t.id" class="teacher-card">
        <div class="teacher-top">
          <div class="teacher-avatar" :style="{ background: t.color }">{{ t.initials }}</div>
          <div class="teacher-meta">
            <div class="teacher-name">{{ t.name }}</div>
            <div class="teacher-subject">{{ t.subject }}</div>
          </div>
          <span :class="['status-pill', statusClass(t.status)]">{{ t.status }}</span>
        </div>
        <div class="teacher-footer">
          <span class="price">&nbsp;</span>
          <button
            :class="['action-btn', t.available ? 'green' : 'disabled']"
            :disabled="!t.available"
            @click="openRequest(t)"
          >
            Request Consultations
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>

    <!-- ══ REQUEST CONSULTATION MODAL ══ -->
    <div v-if="showReqModal" class="modal-overlay" @click.self="showReqModal = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <span>Request Consultation</span>
          <button class="modal-close" @click="showReqModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="teacher-pill">
            <div class="tp-avatar" :style="{ background: selectedTeacher?.color }">{{ selectedTeacher?.initials }}</div>
            <div>
              <div class="tp-name">{{ selectedTeacher?.name }}</div>
              <div class="tp-subj">{{ selectedTeacher?.subject }}</div>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Topic / Subject</label>
            <input v-model="reqForm.topic" class="field-input" type="text" placeholder="e.g. Algebra Chapter 3" />
          </div>
          <div class="form-row-2">
            <div class="field-group">
              <label class="field-label">Preferred Date</label>
              <input v-model="reqForm.date" class="field-input" type="date" :min="today" />
            </div>
            <div class="field-group">
              <label class="field-label">Preferred Time</label>
              <input v-model="reqForm.time" class="field-input" type="time" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Notes <span class="optional">(optional)</span></label>
            <textarea v-model="reqForm.notes" class="field-input field-textarea" placeholder="Any additional details..." rows="3"></textarea>
          </div>
          <div v-if="reqError" class="msg-err">{{ reqError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showReqModal = false">Cancel</button>
          <button class="modal-submit" @click="submitRequest">Send Request</button>
        </div>
      </div>
    </div>

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
            <div class="profile-avatar-lg" :style="{ background: selectedTeacher?.color }">{{ selectedTeacher?.initials }}</div>
            <div class="profile-hero-name">{{ selectedTeacher?.name }}</div>
            <div class="profile-hero-subj">{{ selectedTeacher?.subject }}</div>
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

    <BottomNav active="teachers" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getToken } from '@/auth.js'
import BottomNav from '@/components/student/BottomNav.vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const search       = ref('')
const activeFilter = ref('All')
const filters      = ['All', 'On School', 'On Main Campus', 'On Meeting', 'On Leave']
const loadingTeachers = ref(false)
const loadError = ref('')

const teachers = ref([])

function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] || '?').toUpperCase()
}

function colorForName(name) {
  const palette = ['#e63946', '#3a86ff', '#2d6a4f', '#f4a261', '#9b5de5', '#00a896', '#577590']
  const text = String(name || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }
  return palette[Math.abs(hash) % palette.length]
}

function normalizeTeacherStatus(status) {
  const normalized = String(status || '').trim()
  if (normalized === 'Main Campus' || normalized === 'On Main Campus') {
    return 'On Main Campus'
  }
  return normalized || 'On Leave'
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
  const resolvedStatus = normalizeTeacherStatus(teacher.status || teacher.teacher_status)
  return {
    id: teacher.id,
    employeeId: teacher.employeeId,
    name: teacher.name,
    subject: subjects.length ? subjects.join(', ') : 'No subject assigned',
    initials: initialsFor(teacher.name),
    color: colorForName(teacher.name),
    status: resolvedStatus,
    available: Boolean(teacher.available) && ['On School', 'On Main Campus'].includes(resolvedStatus),
    tags: subjects.slice(0, 3),
    consultationSlots: Array.isArray(teacher.consultationSlots) ? teacher.consultationSlots : [],
  }
}

async function loadTeachers() {
  loadingTeachers.value = true
  loadError.value = ''
  try {
    const payload = await apiRequest('/consultations/teachers')
    teachers.value = (payload.teachers || []).map(mapTeacher)
  } catch (error) {
    teachers.value = []
    loadError.value = error.message || 'Failed to load teachers.'
  } finally {
    loadingTeachers.value = false
  }
}

const filteredTeachers = computed(() => teachers.value.filter(t => {
  const matchSearch = !search.value || t.name.toLowerCase().includes(search.value.toLowerCase()) || t.subject.toLowerCase().includes(search.value.toLowerCase())
  const matchFilter = activeFilter.value === 'All' || t.status === activeFilter.value
  return matchSearch && matchFilter
}))

function statusClass(s) {
  return {
    'On School': 'pill-green',
    'On Main Campus': 'pill-orange',
    'On Meeting': 'pill-orange',
    'On Leave': 'pill-gray',
  }[s] || 'pill-gray'
}

/* ── Modal state ── */
const showReqModal     = ref(false)
const showProfileModal = ref(false)
const selectedTeacher  = ref(null)
const toastMsg         = ref('')
const today            = new Date().toISOString().split('T')[0]
const reqError         = ref('')
const reqForm          = ref({ topic: '', date: '', time: '', notes: '' })

function openRequest(t) {
  selectedTeacher.value = t
  reqForm.value = { topic: '', date: '', time: '', notes: '' }
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

function submitRequest() {
  reqError.value = ''
  if (!reqForm.value.topic.trim()) { reqError.value = 'Please enter a topic.'; return }
  if (!reqForm.value.date)         { reqError.value = 'Please select a preferred date.'; return }
  if (!reqForm.value.time)         { reqError.value = 'Please select a preferred time.'; return }

  apiRequest('/consultations/requests', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: selectedTeacher.value.id,
      topic: reqForm.value.topic.trim(),
      date: reqForm.value.date,
      time: reqForm.value.time,
      notes: reqForm.value.notes || '',
    }),
  })
    .then(() => {
      showReqModal.value = false
      showToast(`Request sent to ${selectedTeacher.value.name}.`)
      return loadTeachers()
    })
    .catch((error) => {
      reqError.value = error.message || 'Failed to send request.'
    })
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

onMounted(loadTeachers)
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

/* Search */
.search-wrap {
  position: relative; margin: 14px 16px 0;
}
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); }
.search-input {
  width: 100%; box-sizing: border-box;
  padding: 11px 14px 11px 36px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px; font-size: 0.87rem;
  background: #fff; outline: none; font-family: inherit;
}
.search-input:focus { border-color: #2d6a4f; }

/* Filters */
.filter-row { display: flex; gap: 8px; padding: 12px 18px 0; overflow-x: auto; scrollbar-width: none; }
.filter-row::-webkit-scrollbar { display: none; }
.filter-chip {
  white-space: nowrap; padding: 6px 14px;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 20px; font-size: 0.8rem; font-weight: 500;
  cursor: pointer; font-family: inherit; color: #555;
  transition: all 0.15s;
}
.filter-chip.active { background: #1b4332; color: #fff; border-color: #1b4332; }

/* Teacher cards */
.teacher-list { display: flex; flex-direction: column; gap: 12px; padding: 14px 18px 0; }
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
.teacher-card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.teacher-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
.teacher-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0;
}
.teacher-meta { flex: 1; }
.teacher-name    { font-weight: 700; font-size: 0.9rem; color: #111; }
.teacher-subject { font-size: 0.77rem; color: #666; margin-top: 2px; }
.status-pill {
  font-size: 0.7rem; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
  white-space: nowrap; flex-shrink: 0;
}
.pill-green  { background: #d8f3e8; color: #1b7a4a; }
.pill-orange { background: #fff3e0; color: #b35e00; }
.pill-gray   { background: #f0f0f0; color: #666; }

.teacher-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.price { font-size: 0.82rem; font-weight: 600; color: #1b4332; min-width: 12px; }
.action-btn {
  padding: 9px 14px; border-radius: 8px;
  border: none; font-family: inherit;
  font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
}
.action-btn:active { opacity: 0.8; }
.action-btn.green   { background: #1b4332; color: #fff; }
.action-btn.disabled {
  background: #7b8794;
  color: #fff;
  cursor: not-allowed;
}

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

/* Form fields */
.field-group  { display: flex; flex-direction: column; gap: 6px; }
.field-label  { font-size: 0.8rem; font-weight: 600; color: #444; }
.optional     { font-weight: 400; color: #aaa; }
.field-input  {
  width: 100%; padding: 10px 12px; border: 1.5px solid #e5e7eb;
  border-radius: 8px; font-family: inherit; font-size: 0.87rem;
  outline: none; box-sizing: border-box;
}
.field-input:focus { border-color: #1b4332; }
.field-textarea { resize: none; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg-err { color: #e63946; font-size: 0.8rem; font-weight: 500; }

/* Teacher preview pill */
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

/* Profile hero */
.profile-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 0 12px; gap: 4px;
}
.profile-avatar-lg {
  width: 72px; height: 72px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.6rem; margin-bottom: 8px;
}
.profile-hero-name { font-weight: 700; font-size: 1rem; color: #111; }
.profile-hero-subj { font-size: 0.8rem; color: #777; }
.prof-row {
  display: flex; flex-direction: column; gap: 5px;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0;
}
.prof-row:last-child { border-bottom: none; }
.prof-label { font-size: 0.73rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
.prof-value { font-size: 0.88rem; color: #111; font-weight: 500; }
.prof-avail { font-size: 0.88rem; font-weight: 600; }
.avail-yes  { color: #2d6a4f; }
.avail-no   { color: #e63946; }

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
