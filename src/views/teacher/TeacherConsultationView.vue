<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">teacher@gmail.com</div>
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
          <h1 class="page-title">Consultation Requests</h1>
          <p class="page-sub">Review and manage student consultation requests</p>
        </div>
      </header>

      <!-- Consultation Card -->
      <section class="consult-card">
        <div class="card-header">
          <div class="card-title">Consultation Requests</div>
          <div class="card-sub">Review and manage student consultation requests</div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['filter-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}({{ tab.count }})
          </button>
        </div>

        <!-- Request List -->
        <div class="request-list">
          <div v-if="isLoadingRequests" class="empty-state">Loading consultation requests...</div>
          <div v-else-if="requestsError" class="empty-state">{{ requestsError }}</div>
          <div
            v-if="!isLoadingRequests && !requestsError"
            v-for="req in filteredRequests"
            :key="req.id"
            :class="['request-card', `border-${req.status}`]"
            @click="openDetail(req)"
          >
            <!-- Top row: avatar + name + badge + actions -->
            <div class="req-top">
              <div class="req-avatar-wrap">
                <img :src="req.avatar" class="req-avatar" alt="" />
              </div>
              <div class="req-info">
                <div class="req-name-row">
                  <span class="req-name">{{ req.name }}</span>
                  <span :class="['status-badge', `badge-${req.status}`]">{{ statusLabel(req.status) }}</span>
                </div>
                <div class="req-id">{{ req.studentId }}</div>
                <div v-if="req.ticketNumber" class="req-ticket">Ticket: {{ req.ticketNumber }}</div>
                <div v-if="req.status === 'approved' && req.queuePosition" class="req-queue">
                  Queue #{{ req.queuePosition }}<span v-if="req.queueTotal"> of {{ req.queueTotal }}</span>
                </div>
              </div>
              <div class="req-actions">
                <!-- Pending actions -->
                <template v-if="req.status === 'pending'">
                  <button class="btn-approve" @click.stop="approve(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Approve
                  </button>
                  <button class="btn-reject" @click.stop="reject(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Resched
                  </button>
                </template>
                <!-- Approved actions -->
                <template v-else-if="req.status === 'approved'">
                  <button class="btn-edit" title="Edit" @click.stop="editReq(req.id)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button v-if="Number(req.queuePosition) === 1" class="btn-done" @click.stop="openDoneModal(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Done
                  </button>
                </template>
              </div>
            </div>

            <!-- Body -->
            <div class="req-subject">{{ req.subject }}</div>
            <div class="req-message">{{ req.message }}</div>
            <div class="req-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ req.schedule || req.date }}
            </div>
          </div>

          <div v-if="!isLoadingRequests && !requestsError && filteredRequests.length === 0" class="empty-state">
            No {{ activeTab === 'all' ? '' : activeTab }} requests.
          </div>
        </div>
      </section>
    </main>

    <!-- ═══ Approve Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showApproveModal" class="modal-overlay" @click.self="cancelApprove">
        <div class="approve-modal">
          <div class="approve-modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 class="approve-modal-title">Approve Request</h3>
          <p class="approve-modal-text">Are you sure you want to approve this consultation request?</p>
          <div class="approve-modal-actions">
            <button class="approve-cancel-btn" @click="cancelApprove">Cancel</button>
            <button class="approve-ok-btn" @click="confirmApprove">Yes, Approve</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Mark Done Modal ═══ -->
    <Teleport to="body">
      <div v-if="showDoneModal" class="modal-overlay" @click.self="closeDoneModal">
        <div class="done-modal">
          <h2 class="done-modal-title">Mark Consultation as Done</h2>
          <p class="done-modal-sub">Add optional notes about what happened during the consultation.</p>

          <label class="done-label">Optional Notes</label>
          <textarea
            v-model="doneNotes"
            class="done-textarea"
            rows="4"
            maxlength="500"
            placeholder="Example: Discussed assignment requirements and gave implementation tips."
          ></textarea>

          <div class="done-modal-actions">
            <button class="done-cancel-btn" @click="closeDoneModal">Cancel</button>
            <button class="done-confirm-btn" @click="confirmDone">Mark as Done</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Resched Consultation Modal ═══ -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="reject-modal">
          <h2 class="reject-modal-title">Resched Consultation Request</h2>
          <p class="reject-modal-sub">Provide a reason for rescheduling this consultation request</p>

          <div class="reject-student-box">
            <div class="reject-student-name">{{ rejectTarget?.name }}</div>
            <div class="reject-student-subject">{{ rejectTarget?.subject }}</div>
          </div>

          <label class="reject-label">Resched Reason <span class="reject-required">*</span></label>
          <div class="reject-select-wrap">
            <select class="reject-select" v-model="rejectionReason">
              <option value="" disabled>Select a reason...</option>
              <option value="Schedule conflict">Schedule conflict</option>
              <option value="Outside consultation scope">Outside consultation scope</option>
              <option value="Already addressed">Already addressed</option>
              <option value="Insufficient details">Insufficient details</option>
              <option value="Other">Other</option>
            </select>
            <svg class="reject-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <div v-if="rejectionReason === 'Other'" class="reject-other-wrap">
            <input
              v-model="otherReason"
              class="reject-other-input"
              type="text"
              placeholder="Please specify your reason..."
              maxlength="200"
            />
          </div>

          <p v-if="rejectReasonError" class="reject-reason-error">Please select a rejection reason before continuing.</p>

          <div class="reject-modal-actions">
            <button class="reject-cancel-btn" @click="closeRejectModal">Cancel</button>
            <button class="reject-confirm-btn" @click="submitReject">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Resched request
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Confirm Resched Modal ═══ -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="modal-overlay" @click.self="cancelConfirm">
        <div class="confirm-modal">
          <div class="confirm-modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 class="confirm-modal-title">Resched Request</h3>
          <p class="confirm-modal-text">Are you sure you want to resched this consultation request?</p>
          <div class="confirm-modal-actions">
            <button class="confirm-cancel-btn" @click="cancelConfirm">Cancel</button>
            <button class="confirm-ok-btn" @click="confirmReject">Yes, Resched</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Detail Modal ═══ -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetail">
        <div class="detail-modal">
          <button class="detail-close" @click="closeDetail">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="detail-head">
            <img :src="selectedRequest?.avatar" class="detail-avatar" alt="" />
            <div class="detail-identity">
              <div class="detail-name">{{ selectedRequest?.name }}</div>
              <div class="detail-sid">{{ selectedRequest?.studentId }}</div>
              <span :class="['status-badge', `badge-${selectedRequest?.status}`]">{{ statusLabel(selectedRequest?.status || '') }}</span>
            </div>
          </div>
          <div class="detail-divider"></div>
          <div class="detail-row">
            <div class="detail-label">Subject</div>
            <div class="detail-value">{{ selectedRequest?.subject }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Message</div>
            <div class="detail-value detail-msg">{{ selectedRequest?.message }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Consultation Schedule</div>
            <div class="detail-value">{{ selectedRequest?.schedule || selectedRequest?.date }}</div>
          </div>
          <div v-if="selectedRequest?.ticketNumber" class="detail-row">
            <div class="detail-label">Ticket Number</div>
            <div class="detail-value">{{ selectedRequest?.ticketNumber }}</div>
          </div>
          <div v-if="selectedRequest?.status === 'resched' && selectedRequest?.rejectionReason" class="detail-row">
            <div class="detail-label detail-label-reject">Resched Reason</div>
            <div class="detail-value detail-reject-reason">{{ selectedRequest?.rejectionReason }}</div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Edit Modal ═══ -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="edit-modal">
          <div class="edit-modal-header">
            <div>
              <h2 class="edit-modal-title">Edit Consultation</h2>
              <p class="edit-modal-sub">Update the details for this request</p>
            </div>
            <button class="edit-modal-close" @click="closeEditModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="edit-modal-body">
            <label class="edit-label">Update Status</label>
            <div class="edit-status-options">
              <label
                v-for="opt in statusOptions"
                :key="opt.value"
                :class="['edit-status-opt', `opt-${opt.value}`, { selected: editForm.status === opt.value }]"
              >
                <input type="radio" v-model="editForm.status" :value="opt.value" hidden />
                <span class="opt-dot"></span>
                {{ opt.label }}
              </label>
            </div>
          </div>

          <div class="edit-modal-actions">
            <button class="edit-cancel-btn" @click="closeEditModal">Cancel</button>
            <button class="edit-save-btn" @click="saveEdit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Changes
            </button>
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
import Swal from 'sweetalert2'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}

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

/* ── Consultation requests ── */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const requests = ref([])
const isLoadingRequests = ref(false)
const requestsError = ref('')

function mapStatusFromApi(status) {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'APPROVED') return 'approved'
  if (normalized === 'RESCHED') return 'resched'
  if (normalized === 'COMPLETED') return 'completed'
  if (normalized === 'CANCELLED') return 'cancelled'
  return 'pending'
}

function mapStatusToApi(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'approved') return 'APPROVED'
  if (normalized === 'resched') return 'RESCHED'
  if (normalized === 'completed') return 'COMPLETED'
  if (normalized === 'cancelled') return 'CANCELLED'
  return 'PENDING'
}

function parseReschedReason(text) {
  return String(text || '')
    .split('\n')
    .find((line) => line.toLowerCase().startsWith('resched reason:'))
    ?.replace(/^resched reason:\s*/i, '') || ''
}

function formatRequestDate(consultationDate, requestDate) {
  const raw = consultationDate || requestDate
  if (!raw) return '--'

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateOnly(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimeLabel(value) {
  const text = String(value || '').trim()
  if (!text) return ''

  const plain = text.match(/^(\d{1,2}):(\d{2})$/)
  if (plain) {
    const hours = Number(plain[1])
    const minutes = Number(plain[2])
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return text
    const suffix = hours >= 12 ? 'PM' : 'AM'
    const clock = hours % 12 || 12
    return `${clock}:${String(minutes).padStart(2, '0')} ${suffix}`
  }

  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    return `${Number(ampm[1])}:${ampm[2]} ${ampm[3].toUpperCase()}`
  }

  return text
}

function formatScheduleLabel(doc) {
  const dateText = formatDateOnly(doc.consultationDate)
  const dayText = String(doc.consultationDayOfWeek || '').trim()
  const startText = formatTimeLabel(doc.consultationStartTime)
  const endText = formatTimeLabel(doc.consultationEndTime)
  const timeText = startText && endText ? `${startText} - ${endText}` : startText || endText

  const parts = [dateText, dayText, timeText].filter(Boolean)
  if (parts.length) return parts.join(' • ')
  return formatRequestDate(doc.consultationDate, doc.requestDate)
}

function buildAvatar(name, avatarUrl) {
  if (avatarUrl) return avatarUrl
  const seed = encodeURIComponent(String(name || 'student'))
  return `https://i.pravatar.cc/100?u=${seed}`
}

function mapRequest(doc) {
  const parsedReason = parseReschedReason(doc.purpose)
  const studentName = String(doc.studentName || '').trim() || 'Student'
  return {
    id: doc.id,
    name: studentName,
    studentId: doc.studentNumber || doc.studentId || '--',
    ticketNumber: doc.ticketNumber || '',
    status: mapStatusFromApi(doc.status),
    subject: doc.subject || 'Consultation',
    message: doc.purpose || 'No message provided.',
    date: formatRequestDate(doc.consultationDate, doc.requestDate),
    schedule: formatScheduleLabel(doc),
    avatar: buildAvatar(studentName, doc.studentAvatar),
    rejectionReason: parsedReason,
    queuePosition: Number.isFinite(Number(doc.queuePosition)) ? Number(doc.queuePosition) : null,
    queueTotal: Number.isFinite(Number(doc.queueTotal)) ? Number(doc.queueTotal) : null,
  }
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

async function loadRequests() {
  isLoadingRequests.value = true
  requestsError.value = ''

  try {
    const payload = await apiRequest('/consultations/requests')
    const rows = Array.isArray(payload.requests) ? payload.requests : []
    requests.value = rows.map(mapRequest)
  } catch (error) {
    requests.value = []
    requestsError.value = error.message || 'Failed to load consultation requests.'
  } finally {
    isLoadingRequests.value = false
  }
}

/* ── Active filter tab ── */
const activeTab = ref('all')

const tabs = computed(() => [
  { key: 'all',       label: 'All',       count: requests.value.length },
  { key: 'pending',   label: 'Requested', count: requests.value.filter(r => r.status === 'pending').length },
  { key: 'approved',  label: 'Approved',  count: requests.value.filter(r => r.status === 'approved').length },
  { key: 'resched',   label: 'Resched',   count: requests.value.filter(r => r.status === 'resched').length },
  { key: 'completed', label: 'Completed', count: requests.value.filter(r => r.status === 'completed').length },
  { key: 'cancelled', label: 'Cancelled', count: requests.value.filter(r => r.status === 'cancelled').length },
])

const filteredRequests = computed(() =>
  activeTab.value === 'all'
    ? requests.value
    : requests.value.filter(r => r.status === activeTab.value)
)

function statusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'resched') return 'Resched'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

async function patchRequestStatus(id, nextStatus, successTitle = 'Status Updated', notes = '') {
  await apiRequest(`/consultations/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: mapStatusToApi(nextStatus), notes }),
  })

  await loadRequests()

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: successTitle,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: '#1b4332',
    color: '#fff',
    iconColor: '#74c69d',
  })
}

/* ── Actions ── */
const showApproveModal  = ref(false)
const pendingApproveId  = ref(null)

function approve(id) {
  pendingApproveId.value = id
  showApproveModal.value = true
}

function cancelApprove() {
  showApproveModal.value = false
  pendingApproveId.value = null
}

async function confirmApprove() {
  showApproveModal.value = false
  if (!pendingApproveId.value) return
  try {
    await patchRequestStatus(pendingApproveId.value, 'approved', 'Approve Successful')
  } catch (error) {
    Swal.fire('Unable to approve', error.message || 'Failed to update request status.', 'error')
  }
  pendingApproveId.value = null
}

/* Reject flow — step 1: open reject modal */
const showRejectModal  = ref(false)
const rejectTarget     = ref(null)
const rejectionReason  = ref('')
const otherReason      = ref('')
const rejectReasonError = ref(false)

function reject(id) {
  rejectTarget.value     = requests.value.find(r => r.id === id) || null
  rejectionReason.value  = ''
  otherReason.value      = ''
  rejectReasonError.value = false
  showRejectModal.value  = true
}

function closeRejectModal() {
  showRejectModal.value = false
  rejectTarget.value    = null
}

/* Reject flow — step 2: open confirm modal */
const showConfirmModal  = ref(false)
const pendingRejectTarget = ref(null)

function submitReject() {
  const hasReason = rejectionReason.value && (rejectionReason.value !== 'Other' || otherReason.value.trim())
  if (!hasReason) {
    rejectReasonError.value = true
    return
  }
  rejectReasonError.value   = false
  pendingRejectTarget.value = rejectTarget.value
  closeRejectModal()
  showConfirmModal.value = true
}

function cancelConfirm() {
  showConfirmModal.value = false
  pendingRejectTarget.value = null
}

async function confirmReject() {
  showConfirmModal.value = false
  if (!pendingRejectTarget.value?.id) {
    pendingRejectTarget.value = null
    return
  }

  try {
    await patchRequestStatus(pendingRejectTarget.value.id, 'resched', 'Resched Successful')
  } catch (error) {
    Swal.fire('Unable to resched', error.message || 'Failed to update request status.', 'error')
  }

  pendingRejectTarget.value = null
}

const showDoneModal = ref(false)
const doneTargetId = ref(null)
const doneNotes = ref('')

function openDoneModal(id) {
  doneTargetId.value = id
  doneNotes.value = ''
  showDoneModal.value = true
}

function closeDoneModal() {
  showDoneModal.value = false
  doneTargetId.value = null
  doneNotes.value = ''
}

async function confirmDone() {
  if (!doneTargetId.value) return

  try {
    await patchRequestStatus(doneTargetId.value, 'completed', 'Marked as Done', doneNotes.value.trim())
    closeDoneModal()
  } catch (error) {
    Swal.fire('Unable to mark done', error.message || 'Failed to update request status.', 'error')
  }
}

/* ── Edit modal ── */
const showEditModal = ref(false)
const editTarget    = ref(null)
const editForm      = ref({ status: '' })

const statusOptions = [
  { value: 'pending',   label: 'Pending'   },
  { value: 'approved',  label: 'Approved'  },
  { value: 'resched',   label: 'Resched'   },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function editReq(id) {
  const r = requests.value.find(r => r.id === id)
  if (!r) return
  editTarget.value    = r
  editForm.value      = { status: r.status }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editTarget.value    = null
}

async function saveEdit() {
  if (!editTarget.value) return
  if (editForm.value.status === 'resched') {
    const targetId = editTarget.value.id
    closeEditModal()
    reject(targetId)
    return
  }
  const label = statusOptions.find(o => o.value === editForm.value.status)?.label ?? editForm.value.status
  const result = await Swal.fire({
    title: `Set as ${label}?`,
    text: `This will update the request status to "${label}".`,
    icon: 'question',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Yes, update',
    confirmButtonColor: '#1b4332',
    customClass: { cancelButton: 'swal-cancel-text', popup: 'swal-rounded' },
    reverseButtons: false
  })
  if (!result.isConfirmed) return
  try {
    await patchRequestStatus(editTarget.value.id, editForm.value.status, 'Status Updated')
    closeEditModal()
  } catch (error) {
    Swal.fire('Unable to update', error.message || 'Failed to update request status.', 'error')
  }
}

/* ── Detail Modal ── */
const selectedRequest = ref(null)
const showDetailModal = ref(false)

function openDetail(req) {
  selectedRequest.value = req
  showDetailModal.value = true
}
function closeDetail() {
  showDetailModal.value = false
  selectedRequest.value = null
}

onMounted(() => {
  loadRequests()
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

/* ── Consultation Card ── */
.consult-card {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
  padding: 24px 24px 28px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.card-header { margin-bottom: 18px; }
.card-title { font-size: 1.05rem; font-weight: 700; color: #111; }
.card-sub   { font-size: 0.82rem; color: #888; margin-top: 2px; }

/* ── Filter Tabs ── */
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f5f6f8;
  border-radius: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.filter-tab:hover { background: #e8f4ee; color: #1b4332; }
.filter-tab.active { background: #1b4332; color: #fff; font-weight: 600; }

/* ── Request List ── */
.request-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Request Card */
.request-card {
  padding: 16px 18px;
  border-radius: 12px;
  border: 1.5px solid #e8e8e8;
  border-left-width: 5px;
  background: #fff;
  transition: box-shadow 0.15s;
  cursor: pointer;
}
.request-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

.border-pending   { border-left-color: #e8a020; background: #fffdf5; }
.border-approved  { border-left-color: #1b4332; background: #f6faf8; }
.border-resched   { border-left-color: #e63946; background: #fff8f8; }
.border-completed { border-left-color: #74c69d; background: #f5fdf8; }
.border-cancelled { border-left-color: #8d99ae; background: #f6f7f9; }

/* Top row */
.req-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.req-avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ddd;
}
.req-avatar { width: 100%; height: 100%; object-fit: cover; }

.req-info { flex: 1; min-width: 0; }

.req-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.req-name { font-size: 0.98rem; font-weight: 700; color: #111; }
.req-id   { font-size: 0.8rem; color: #888; margin-top: 2px; }
.req-ticket { font-size: 0.78rem; color: #2d6a4f; font-weight: 600; margin-top: 4px; }
.req-queue { font-size: 0.78rem; color: #1b4332; font-weight: 600; margin-top: 4px; }

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-pending   { background: #fff0cc; color: #b06000; }
.badge-approved  { background: #d8f3dc; color: #1b4332; }
.badge-resched   { background: #ffd6d8; color: #c1121f; }
.badge-completed { background: #d0f0e0; color: #2d6a4f; }
.badge-cancelled { background: #e9ecef; color: #5c677d; }

/* Action buttons */
.req-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-approve {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-approve:hover { background: #2d6a4f; }

.btn-reject {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reject:hover { background: #c1121f; }

.btn-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  color: #444;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-edit:hover { background: #e0e0e0; }

.btn-done {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-done:hover { background: #2d6a4f; }

/* Card body */
.req-subject {
  font-size: 0.9rem;
  font-weight: 600;
  color: #40916c;
  margin-bottom: 5px;
}
.req-message {
  font-size: 0.88rem;
  color: #444;
  line-height: 1.5;
  margin-bottom: 8px;
}
.req-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #888;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  font-size: 0.9rem;
  color: #aaa;
}

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

/* ── Reject Consultation Modal ── */
.reject-modal {
  width: 460px;
  max-width: 94vw;
  padding: 36px 40px 32px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  font-family: 'Poppins', sans-serif;
}

.reject-modal-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 6px;
  text-align: center;
}

.reject-modal-sub {
  font-size: 0.85rem;
  color: #888;
  text-align: center;
  margin: 0 0 22px;
}

.reject-student-box {
  padding: 14px 18px;
  border: 1.5px solid #e63946;
  border-radius: 10px;
  margin-bottom: 22px;
  background: #fff;
}

.reject-student-name    { font-size: 1rem; font-weight: 600; color: #111; margin-bottom: 4px; }
.reject-student-subject { font-size: 0.9rem; color: #444; }

.reject-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.reject-select-wrap {
  position: relative;
  margin-bottom: 28px;
}

.reject-select {
  width: 100%;
  appearance: none;
  padding: 10px 36px 10px 14px;
  border: 1.5px solid #d0d0d0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #333;
  background: #fff;
  cursor: pointer;
  outline: none;
}
.reject-select:focus { border-color: #1b4332; }

.reject-select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #555;
}

.reject-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.reject-cancel-btn {
  padding: 9px 22px;
  background: none;
  border: 1.5px solid #d0d0d0;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: background 0.15s;
}
.reject-cancel-btn:hover { background: #f5f5f5; }

.reject-confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 22px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.reject-confirm-btn:hover { background: #c1121f; }

/* Other reason input */
.reject-other-wrap {
  margin-top: -16px;
  margin-bottom: 28px;
}
.reject-other-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d0d0d0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #333;
  outline: none;
  transition: border-color 0.15s;
}
.reject-other-input::placeholder { color: #bbb; }
.reject-other-input:focus { border-color: #1b4332; }

/* ── Approve Modal ── */
.approve-modal {
  width: 400px;
  max-width: 94vw;
  padding: 44px 44px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.16);
  text-align: center;
}

.approve-modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #d8f3dc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.approve-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 10px;
}

.approve-modal-text {
  font-size: 0.88rem;
  color: #888;
  line-height: 1.65;
  margin: 0 0 32px;
}

.approve-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.approve-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  padding: 10px 28px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.approve-cancel-btn:hover { background: #f5f5f5; border-color: #c8c8c8; }

.approve-ok-btn {
  padding: 10px 28px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.approve-ok-btn:hover { background: #2d6a4f; }

/* ── Reject reason required ── */
.reject-required { color: #e63946; margin-left: 2px; }

.reject-reason-error {
  font-size: 0.82rem;
  color: #e63946;
  margin: -12px 0 16px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.reject-reason-error::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e63946;
  flex-shrink: 0;
}

/* ── Mark done modal ── */
.done-modal {
  width: 460px;
  max-width: 94vw;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.2);
}
.done-modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
}
.done-modal-sub {
  margin: 8px 0 16px;
  color: #666;
  font-size: 0.86rem;
  line-height: 1.45;
}
.done-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #444;
}
.done-textarea {
  width: 100%;
  border: 1.5px solid #d9dde1;
  border-radius: 10px;
  padding: 11px 12px;
  font-family: inherit;
  font-size: 0.87rem;
  resize: vertical;
  box-sizing: border-box;
}
.done-textarea:focus {
  outline: none;
  border-color: #1b4332;
}
.done-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.done-cancel-btn,
.done-confirm-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}
.done-cancel-btn {
  background: #f1f1f1;
  color: #555;
}
.done-confirm-btn {
  background: #1b4332;
  color: #fff;
}

/* ── Confirm Modal ── */
.confirm-modal {
  width: 400px;
  max-width: 94vw;
  padding: 44px 44px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.16);
  text-align: center;
}

.confirm-modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.confirm-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 10px;
}

.confirm-modal-text {
  font-size: 0.88rem;
  color: #888;
  line-height: 1.65;
  margin: 0 0 32px;
}

.confirm-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.confirm-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  padding: 10px 28px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.confirm-cancel-btn:hover { background: #f5f5f5; border-color: #c8c8c8; }

.confirm-ok-btn {
  padding: 10px 28px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.confirm-ok-btn:hover { background: #c1121f; }

/* ── Detail Modal ── */
.detail-modal {
  width: 460px;
  max-width: 94vw;
  padding: 32px 36px 36px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  font-family: 'Poppins', sans-serif;
  position: relative;
}

.detail-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: background 0.15s;
}
.detail-close:hover { background: #ebebeb; }

.detail-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-right: 40px;
}

.detail-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid #c8ddd4;
  flex-shrink: 0;
}

.detail-identity { flex: 1; min-width: 0; }
.detail-name { font-size: 1.1rem; font-weight: 700; color: #111; margin-bottom: 2px; }
.detail-sid  { font-size: 0.82rem; color: #888; margin-bottom: 8px; }

.detail-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 0 20px;
}

.detail-row { margin-bottom: 16px; }
.detail-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #aaa;
  margin-bottom: 4px;
}
.detail-value { font-size: 0.92rem; color: #222; line-height: 1.55; }
.detail-msg   { color: #555; }
.detail-label-reject { color: #e63946; }
.detail-reject-reason {
  color: #c1121f;
  background: #fff0f0;
  border-left: 3px solid #e63946;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.88rem;
}

/* ── Edit Modal ── */
.edit-modal {
  width: 500px;
  max-width: 96vw;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.edit-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px 0;
}

.edit-modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px;
}

.edit-modal-sub {
  font-size: 0.82rem;
  color: #888;
  margin: 0;
}

.edit-modal-close {
  background: #f5f6f8;
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  flex-shrink: 0;
  transition: background 0.15s;
}
.edit-modal-close:hover { background: #e8e8e8; }

.edit-modal-body {
  padding: 24px 32px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888;
  margin-bottom: 2px;
  margin-top: 10px;
}
.edit-label:first-child { margin-top: 0; }

.edit-status-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.edit-status-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #444;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.edit-status-opt:hover { background: #f9f9f9; }

.edit-status-opt.selected { border-color: currentColor; font-weight: 700; }

/* Per-status dot + selected colour */
.opt-pending   { color: #b06000; }
.opt-approved  { color: #1b4332; }
.opt-resched   { color: #c1121f; }
.opt-completed { color: #2d6a4f; }
.opt-cancelled { color: #5c677d; }

.opt-pending.selected   { background: #fffdf5; }
.opt-approved.selected  { background: #f6faf8; }
.opt-resched.selected   { background: #fff8f8; }
.opt-completed.selected { background: #f5fdf8; }
.opt-cancelled.selected { background: #f4f5f7; }

.opt-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.edit-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 32px 28px;
}

.edit-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  padding: 9px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.edit-cancel-btn:hover { background: #f5f5f5; border-color: #c8c8c8; }

.edit-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 22px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.edit-save-btn:hover { background: #2d6a4f; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .main { padding: 20px 16px 32px; }
  .sidebar { width: 200px; min-width: 200px; }
}
</style>
