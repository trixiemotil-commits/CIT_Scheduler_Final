<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar teacher-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || initialsAvatar(user)" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
      </div>
      <TeacherSidebarStatus />
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
      <RoleSwitchButton />
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
      <Teleport to="body">
        <Transition name="teacher-status-toast">
          <div
            v-if="statusToast"
            class="teacher-status-toast"
            :class="`is-${statusToast.type}`"
            :role="statusToast.type === 'error' ? 'alert' : 'status'"
            aria-live="polite"
          >
            <span class="teacher-status-toast__icon" aria-hidden="true">{{ statusToast.type === 'success' ? '✓' : '!' }}</span>
            <span>{{ statusToast.message }}</span>
          </div>
        </Transition>
      </Teleport>
      <header class="main-header">
        <div>
          <span class="page-eyebrow">Student support</span>
          <h1 class="page-title">Consultation Requests</h1>
          <p class="page-sub">Review and manage student consultation requests</p>
        </div>
      </header>

      <!-- Consultation Card -->
      <section class="consult-card" :aria-busy="isLoadingRequests">
        <div class="card-header">
          <div class="card-heading">
            <div>
              <template v-if="isLoadingRequests">
                <span class="skeleton card-title-skeleton" aria-hidden="true"></span>
                <span class="skeleton card-sub-skeleton" aria-hidden="true"></span>
              </template>
              <template v-else>
                <div class="card-title">Consultation Requests</div>
                <div class="card-sub">Keep track of incoming student appointments and follow-ups.</div>
              </template>
            </div>
          </div>
        </div>

        <!-- Filter + bulk action row -->
        <div class="controls-row">
          <div v-if="isLoadingRequests" class="filter-tabs filter-tabs-skeleton" aria-hidden="true">
            <span v-for="width in [66, 103, 91, 112, 104, 100]" :key="width" class="skeleton filter-tab-skeleton" :style="{ width: `${width}px` }"></span>
          </div>
          <div v-else class="filter-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['filter-tab', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              <span>{{ tab.label }}</span>
              <span class="filter-tab-count">{{ tab.count }}</span>
            </button>
          </div>

          <button
            v-if="!isLoadingRequests && pendingIncomingCount > 0"
            class="btn-approve-all"
            :disabled="isBulkApproving"
            @click="approveAllIncoming"
          >
            {{ isBulkApproving ? 'Approving...' : 'Approve All' }}
          </button>
        </div>

        <!-- Request List -->
        <div class="request-list" :aria-busy="isLoadingRequests">
          <div v-if="isLoadingRequests" class="consult-skeleton-list" aria-hidden="true">
            <article v-for="index in 3" :key="`skeleton-${index}`" class="request-card consult-skeleton-card">
              <div class="skeleton-card-top">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton-card-info">
                  <div class="skeleton-row">
                    <span class="skeleton skeleton-name"></span>
                    <span class="skeleton skeleton-status"></span>
                  </div>
                  <span class="skeleton skeleton-id"></span>
                  <span class="skeleton skeleton-ticket"></span>
                  <span v-if="index === 1" class="skeleton skeleton-queue"></span>
                </div>
                <div class="skeleton-actions">
                  <span class="skeleton skeleton-action skeleton-action-wide"></span>
                  <span class="skeleton skeleton-action"></span>
                </div>
              </div>
              <div class="skeleton-card-footer">
                <span class="skeleton skeleton-time"></span>
                <span class="skeleton skeleton-details"></span>
              </div>
            </article>
          </div>
          <div v-else-if="requestsError" class="empty-state" role="alert">{{ requestsError }}</div>
          <template v-else>
          <div
            v-for="req in filteredRequests"
            :key="req.id"
            :class="['request-card', `border-${req.status}`]"
            :aria-expanded="expandedRequestId === req.id"
            @click="toggleRequestDetails(req.id)"
          >
            <div class="req-top">
              <div class="req-student">
                <div class="req-avatar-wrap">
                  <img :src="req.avatar" class="req-avatar" alt="" />
                </div>
                <div class="req-info">
                  <div class="req-name-row">
                    <span class="req-name">{{ req.name }}</span>
                    <span :class="['status-badge', `badge-${req.status}`]">{{ statusLabel(req.status) }}</span>
                  </div>
                  <div class="req-id">Student ID: {{ req.studentId }}</div>
                  <div v-if="req.studentYearLevel || req.studentSection" class="req-id">{{ req.studentYearLevel }}<span v-if="req.studentYearLevel && req.studentSection"> · </span>{{ req.studentSection ? `Section ${req.studentSection}` : '' }}</div>
                  <div v-if="req.ticketNumber" class="req-ticket">Ticket: {{ req.ticketNumber }}</div>
                  <div
                    v-if="req.queuePosition"
                    class="req-queue"
                    :class="Number(req.queuePosition) === 1 && Number(req.queueTotal) === 1 ? 'req-queue--solo' : 'req-queue--waiting'"
                  >
                    {{ req.status === 'approved' ? 'Approved queue' : 'Pending queue' }}: #{{ req.queuePosition }}<span v-if="req.queueTotal">{{ ` of ${req.queueTotal}` }}</span>
                  </div>
                </div>
              </div>
              <div class="req-actions">
                <template v-if="req.status === 'pending'">
                  <button class="btn-approve" @click.stop="approve(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Approve
                  </button>
                  <button class="btn-reject" @click.stop="reject(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Reschedule
                  </button>
                </template>
                <template v-else-if="req.status === 'approved'">
                  <button class="btn-reject" @click.stop="reject(req.id)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6m0-6 6 6"/></svg>
                    Reschedule
                  </button>
                  <button class="btn-done" @click.stop="openDoneModal(req.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Mark as Done
                  </button>
                </template>
              </div>
            </div>

            <Transition name="request-details-expand">
              <div v-if="expandedRequestId === req.id" class="req-details">
                <div class="req-detail-row req-subject">
                  <span class="req-detail-label">Subject</span>
                  <span class="req-detail-value">{{ req.subject }}</span>
                </div>
                <div class="req-detail-row req-message">
                  <span class="req-detail-label">Reason</span>
                  <span class="req-detail-value">{{ req.reason || 'Not provided' }}</span>
                </div>
                <div v-if="req.description" class="req-detail-row req-message req-description">
                  <span class="req-detail-label">Description</span>
                  <span class="req-detail-value">{{ req.description }}</span>
                </div>
              </div>
            </Transition>
            <div class="req-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ req.schedule || req.date }}</span>
              <span class="req-details-hint">{{ expandedRequestId === req.id ? 'Hide details' : 'View details' }}</span>
            </div>
          </div>

          <div v-if="filteredRequests.length === 0" class="empty-state">
            No {{ activeTab === 'all' ? '' : activeTab }} requests.
          </div>
          </template>
        </div>
      </section>
    </main>

    <!-- ═══ Approve Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showApproveModal" class="modal-overlay" @click.self="cancelApprove">
        <div class="approve-modal">
          <div class="approve-modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 class="approve-modal-title">Approve Request</h3>
          <p class="approve-modal-text">Are you sure you want to approve this consultation request?</p>
          <div class="approve-modal-actions">
            <button class="approve-cancel-btn" :disabled="isApproving" @click="cancelApprove">Cancel</button>
            <button class="approve-ok-btn" :disabled="isApproving" @click="confirmApprove">
              {{ isApproving ? 'Approving...' : 'Yes, Approve' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Mark Done Modal ═══ -->
    <Teleport to="body">
      <div v-if="showDoneModal" class="modal-overlay" @click.self="closeDoneModal">
        <div class="done-modal">
          <button type="button" class="done-modal-close" aria-label="Close dialog" :disabled="isCompleting" @click="closeDoneModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-12 12M6 6l12 12"/></svg>
          </button>
          <div class="done-modal-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
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
          <div class="done-note-count">{{ doneNotes.length }}/500</div>

          <div class="done-modal-actions">
            <button class="done-confirm-btn" :disabled="isCompleting" @click="confirmDone">
              {{ isCompleting ? 'Saving...' : 'Mark as Done' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Reschedule Consultation Modal ═══ -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="reject-modal">
          <h2 class="reject-modal-title">Reschedule Consultation Request</h2>
          <p class="reject-modal-sub">Provide a reason for rescheduling this consultation request</p>

          <div class="reject-student-box">
            <img :src="rejectTarget?.avatar" class="reject-student-avatar" alt="" />
            <div class="reject-student-copy">
              <div class="reject-student-name">{{ rejectTarget?.name }}</div>
              <div class="reject-student-subject">{{ rejectTarget?.subject }}</div>
            </div>
          </div>

          <label class="reject-label">Reschedule Reason <span class="reject-required">*</span></label>
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
            <textarea
              v-model="otherReason"
              class="reject-other-input"
              rows="3"
              placeholder="Please specify your reason..."
              maxlength="200"
            ></textarea>
          </div>

          <p v-if="rejectReasonError" class="reject-reason-error">Please select a rejection reason before continuing.</p>

          <div class="reject-modal-actions">
            <button class="reject-cancel-btn" :disabled="isRescheduling" @click="closeRejectModal">Cancel</button>
            <button class="reject-confirm-btn" :disabled="isRescheduling" @click="submitReject">
              <svg class="reject-confirm-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6m0-6 6 6"/></svg>
              {{ isRescheduling ? 'Rescheduling...' : 'Reschedule request' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Confirm Reschedule Modal ═══ -->
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
          <h3 class="confirm-modal-title">Reschedule Request</h3>
          <p class="confirm-modal-text">Are you sure you want to reschedule this consultation request?</p>
          <div class="confirm-modal-actions">
            <button class="confirm-cancel-btn" :disabled="isRescheduling" @click="cancelConfirm">Cancel</button>
            <button class="confirm-ok-btn" :disabled="isRescheduling" @click="confirmReject">
              {{ isRescheduling ? 'Rescheduling...' : 'Yes, Reschedule' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="!isLoggingOut && (showLogoutModal = false)">
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
            <button class="logout-cancel-btn" :disabled="isLoggingOut" @click="showLogoutModal = false">Cancel</button>
            <button class="logout-confirm-btn" :disabled="isLoggingOut" :aria-busy="isLoggingOut" @click="confirmLogout">{{ isLoggingOut ? 'Logging out...' : 'Log Out' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import TeacherSidebarStatus from '@/components/teacher/TeacherSidebarStatus.vue'
import { initialsAvatar } from '@/utils/avatar.js'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}
const statusToast = ref(null)
let statusToastTimer = null
let statusToastId = 0

function showStatusToast(type, message) {
  statusToast.value = { type, message }
  const toastId = ++statusToastId
  if (statusToastTimer) window.clearTimeout(statusToastTimer)
  statusToastTimer = window.setTimeout(() => {
    if (toastId === statusToastId) statusToast.value = null
    statusToastTimer = null
  }, 5000)
}

onBeforeUnmount(() => {
  if (statusToastTimer) window.clearTimeout(statusToastTimer)
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

/* ── Consultation requests ── */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const requests = ref([])
const isLoadingRequests = ref(true)
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

function parseRequestDetails(text) {
  const value = String(text || '').trim()
  const match = value.match(/^\s*Reason:\s*([\s\S]*?)(?:\s+Description:\s*([\s\S]*))?\s*$/i)
  if (match) {
    return { reason: match[1].trim(), description: (match[2] || '').trim() }
  }
  return { reason: value, description: '' }
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
  if (!doc.availabilityId && !doc.consultationStartTime) return 'Available now'
  const dateText = formatDateOnly(doc.consultationDate)
  const dayText = String(doc.consultationDayOfWeek || '').trim()
  const startText = formatTimeLabel(doc.consultationStartTime)
  const endText = formatTimeLabel(doc.consultationEndTime)
  const timeText = doc.availabilityId
    ? (startText && endText ? `${startText} - ${endText}` : startText || endText)
    : startText || endText

  const parts = [dateText, dayText, timeText].filter(Boolean)
  if (parts.length) return parts.join(' • ')
  return formatRequestDate(doc.consultationDate, doc.requestDate)
}

function buildAvatar(name, avatarUrl) {
  if (avatarUrl) return avatarUrl
  return initialsAvatar(name)
}

function mapRequest(doc) {
  const parsedReason = parseReschedReason(doc.purpose)
  const requestDetails = parseRequestDetails(doc.purpose)
  const studentName = String(doc.studentName || '').trim() || 'Student'
  return {
    id: doc.id,
    createdAt: doc.createdAt || doc.requestDate || '',
    name: studentName,
    studentId: doc.studentNumber || doc.studentId || '--',
    studentYearLevel: doc.studentYearLevel || '',
    studentSection: doc.studentSection || '',
    ticketNumber: doc.ticketNumber || '',
    availabilityId: doc.availabilityId || '',
    status: doc.rescheduleOfferPending ? 'resched' : doc.availabilityId && String(doc.status || '').toUpperCase() === 'APPROVED' ? 'approved' : mapStatusFromApi(doc.status),
    rescheduleOfferPending: Boolean(doc.rescheduleOfferPending),
    isSubjectTeacher: Boolean(doc.isSubjectTeacher),
    subject: doc.subject || 'Consultation',
    message: doc.purpose || 'No message provided.',
    reason: requestDetails.reason,
    description: requestDetails.description,
    date: formatRequestDate(doc.consultationDate, doc.requestDate),
    schedule: formatScheduleLabel(doc),
    avatar: buildAvatar(studentName, doc.studentAvatar),
    rejectionReason: parsedReason,
    queuePosition: Number.isFinite(Number(doc.queuePosition)) ? Number(doc.queuePosition) : null,
    queueTotal: Number.isFinite(Number(doc.queueTotal)) ? Number(doc.queueTotal) : null,
    pendingQueuePosition: Number.isFinite(Number(doc.pendingQueuePosition)) ? Number(doc.pendingQueuePosition) : null,
    pendingQueueTotal: Number.isFinite(Number(doc.pendingQueueTotal)) ? Number(doc.pendingQueueTotal) : null,
    approvedQueuePosition: Number.isFinite(Number(doc.approvedQueuePosition)) ? Number(doc.approvedQueuePosition) : null,
    approvedQueueTotal: Number.isFinite(Number(doc.approvedQueueTotal)) ? Number(doc.approvedQueueTotal) : null,
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
const consultationTabs = ['all', 'pending', 'approved', 'resched', 'completed', 'cancelled']
const initialConsultationTab = String(route.query.tab || 'all')
const activeTab = ref(consultationTabs.includes(initialConsultationTab) ? initialConsultationTab : 'all')

const tabs = computed(() => [
  { key: 'all',       label: 'All',       count: requests.value.length },
  { key: 'pending',   label: 'Pending',   count: requests.value.filter(r => r.status === 'pending').length },
  { key: 'approved',  label: 'Approved',  count: requests.value.filter(r => r.status === 'approved').length },
  { key: 'resched',   label: 'Reschedule', count: requests.value.filter(r => r.status === 'resched').length },
  { key: 'completed', label: 'Completed', count: requests.value.filter(r => r.status === 'completed').length },
  { key: 'cancelled', label: 'Cancelled', count: requests.value.filter(r => r.status === 'cancelled').length },
])

function oldestRequestFirst(a, b) {
  const aTime = new Date(a.createdAt || 0).getTime()
  const bTime = new Date(b.createdAt || 0).getTime()
  return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0)
}

const filteredRequests = computed(() => {
  const rows = activeTab.value === 'all'
    ? requests.value
    : requests.value.filter(r => r.status === activeTab.value)
  return activeTab.value === 'pending' ? [...rows].sort(oldestRequestFirst) : rows
})

const pendingRequestIds = computed(() =>
  requests.value
    .filter((r) => r.status === 'pending' && !r.isSubjectTeacher && !r.availabilityId && r.id)
    .sort(oldestRequestFirst)
    .map((r) => r.id)
)

const pendingIncomingCount = computed(() => pendingRequestIds.value.length)
const isBulkApproving = ref(false)

function statusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'resched') return 'Reschedule'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

async function patchRequestStatus(id, nextStatus, successTitle = 'Status Updated', notes = '') {
  await apiRequest(`/consultations/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: mapStatusToApi(nextStatus), notes }),
  })

  await loadRequests()

  showStatusToast('success', successTitle)
}

/* ── Actions ── */
const showApproveModal  = ref(false)
const pendingApproveId  = ref(null)
const isApproving = ref(false)

function approve(id) {
  pendingApproveId.value = id
  showApproveModal.value = true
}

function cancelApprove() {
  if (isApproving.value) return
  showApproveModal.value = false
  pendingApproveId.value = null
}

async function confirmApprove() {
  if (!pendingApproveId.value || isApproving.value) return
  isApproving.value = true
  try {
    await patchRequestStatus(pendingApproveId.value, 'approved', 'Approve Successful')
    showApproveModal.value = false
    pendingApproveId.value = null
  } catch (error) {
    Swal.fire('Unable to approve', error.message || 'Failed to update request status.', 'error')
  } finally {
    isApproving.value = false
  }
}

async function approveAllIncoming() {
  if (!pendingIncomingCount.value || isBulkApproving.value) return

  const toApprove = [...pendingRequestIds.value]
  const result = await Swal.fire({
    title: 'Approve all incoming requests?',
    text: `This will approve ${toApprove.length} pending consultation request(s).`,
    icon: 'question',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Yes, approve all',
    confirmButtonColor: '#ed9b38',
    customClass: { cancelButton: 'swal-cancel-text', popup: 'swal-rounded' },
    reverseButtons: false,
  })

  if (!result.isConfirmed) return

  isBulkApproving.value = true
  try {
    await Promise.all(
      toApprove.map((id) =>
        apiRequest(`/consultations/requests/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'APPROVED', notes: '' }),
        })
      )
    )

    await loadRequests()

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${toApprove.length} request(s) approved`,
      showConfirmButton: false,
      timer: 2800,
      timerProgressBar: true,
      background: '#4b5563',
      color: '#fff',
      iconColor: '#cbd5e1',
    })
  } catch (error) {
    Swal.fire('Unable to approve all', error.message || 'Failed to update all pending requests.', 'error')
  } finally {
    isBulkApproving.value = false
  }
}

/* Reject flow — step 1: open reject modal */
const showRejectModal  = ref(false)
const rejectTarget     = ref(null)
const rejectionReason  = ref('')
const otherReason      = ref('')
const rejectReasonError = ref(false)
const isRescheduling = ref(false)

function reject(id) {
  rejectTarget.value     = requests.value.find(r => r.id === id) || null
  rejectionReason.value  = ''
  otherReason.value      = ''
  rejectReasonError.value = false
  showRejectModal.value  = true
}

function closeRejectModal() {
  if (isRescheduling.value) return
  showRejectModal.value = false
  rejectTarget.value = null
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
  showRejectModal.value = false
  showConfirmModal.value = true
}

function getRejectReasonText() {
  if (!rejectionReason.value) return ''
  if (rejectionReason.value === 'Other') {
    return otherReason.value.trim()
  }
  return rejectionReason.value.trim()
}

function cancelConfirm() {
  if (isRescheduling.value) return
  showConfirmModal.value = false
  if (pendingRejectTarget.value) {
    rejectTarget.value = pendingRejectTarget.value
    showRejectModal.value = true
  }
  pendingRejectTarget.value = null
}

async function confirmReject() {
  if (isRescheduling.value) return
  if (!pendingRejectTarget.value?.id) {
    showConfirmModal.value = false
    pendingRejectTarget.value = null
    return
  }

  isRescheduling.value = true
  try {
    await patchRequestStatus(pendingRejectTarget.value.id, 'resched', 'Reschedule Successful', getRejectReasonText())
    showConfirmModal.value = false
    showRejectModal.value = false
  } catch (error) {
    showConfirmModal.value = false
    Swal.fire('Unable to reschedule', error.message || 'Failed to update request status.', 'error')
  } finally {
    isRescheduling.value = false
  }

  pendingRejectTarget.value = null
}

const showDoneModal = ref(false)
const doneTargetId = ref(null)
const doneNotes = ref('')
const isCompleting = ref(false)

function openDoneModal(id) {
  doneTargetId.value = id
  doneNotes.value = ''
  showDoneModal.value = true
}

function closeDoneModal() {
  if (isCompleting.value) return
  showDoneModal.value = false
  doneTargetId.value = null
  doneNotes.value = ''
}

async function confirmDone() {
  if (!doneTargetId.value || isCompleting.value) return

  isCompleting.value = true
  try {
    await patchRequestStatus(doneTargetId.value, 'completed', 'Marked as Done', doneNotes.value.trim())
    showDoneModal.value = false
    doneTargetId.value = null
    doneNotes.value = ''
  } catch (error) {
    Swal.fire('Unable to mark done', error.message || 'Failed to update request status.', 'error')
  } finally {
    isCompleting.value = false
  }
}

/* ── Inline request details ── */
const expandedRequestId = ref(null)

function toggleRequestDetails(requestId) {
  expandedRequestId.value = expandedRequestId.value === requestId ? null : requestId
}

onMounted(() => {
  loadRequests()
})

/* ── Logout ── */
const showLogoutModal = ref(false)
const isLoggingOut = ref(false)
async function confirmLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  await new Promise(resolve => setTimeout(resolve, 650))
  showLogoutModal.value = false
  logout()
  router.push('/')
}
</script>

<style scoped>
.teacher-status-toast {
  position: fixed;
  z-index: 12000;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  display: flex;
  width: min(380px, calc(100vw - 32px));
  align-items: center;
  gap: 11px;
  padding: 13px 16px;
  border: 1px solid #d8dee2;
  border-left: 3px solid #547b66;
  border-radius: 12px;
  background: rgba(255,255,255,.97);
  box-shadow: 0 12px 34px rgba(27,37,45,.18);
  color: #303a42;
  font: 600 .82rem/1.45 'Poppins', sans-serif;
}
.teacher-status-toast.is-error { border-left-color: #a84c4c; }
.teacher-status-toast__icon {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border-radius: 50%;
  background: #e8f2ec;
  color: #3e7657;
  font-size: .82rem;
  font-weight: 800;
}
.teacher-status-toast.is-error .teacher-status-toast__icon { background: #f7eaea; color: #a84c4c; }
.teacher-status-toast-enter-active,
.teacher-status-toast-leave-active { transition: opacity .18s ease, transform .18s ease; }
.teacher-status-toast-enter-from,
.teacher-status-toast-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 600px) {
  .teacher-status-toast {
    top: max(12px, env(safe-area-inset-top));
    right: 12px;
    width: min(360px, calc(100vw - 24px));
    padding: 12px 14px;
    font-size: .78rem;
  }
}

:global(.consult-status-confirm) {
  width: min(390px, calc(100vw - 32px)) !important;
  padding: 25px 26px 23px !important;
  border: 1px solid #edf0f2 !important;
  border-radius: 18px !important;
  background: #fff !important;
  box-shadow: 0 14px 38px rgba(25, 35, 42, .18) !important;
}
:global(.consult-status-confirm .swal2-icon) {
  width: 48px !important;
  height: 48px !important;
  margin: 0 auto 13px !important;
  border-color: #ed9b38 !important;
  color: #ed9b38 !important;
  font-size: 1.1rem !important;
}
:global(.consult-status-confirm .swal2-title) {
  margin: 0 0 4px !important;
  color: #27313a !important;
  font-size: 1.12rem !important;
  font-weight: 700 !important;
}
:global(.consult-status-confirm .swal2-html-container) {
  margin: 0 !important;
  color: #77818a !important;
  font-size: .78rem !important;
  line-height: 1.45 !important;
}
:global(.consult-status-confirm .swal2-actions) {
  display: flex !important;
  flex-direction: row !important;
  gap: 9px !important;
  width: 100% !important;
  justify-content: flex-start !important;
  margin: 18px 0 0 !important;
}
:global(.consult-status-confirm .swal2-confirm),
:global(.consult-status-confirm .swal2-cancel) {
  min-width: 0 !important;
  min-height: 38px !important;
  flex: 1 1 0 !important;
  margin: 0 !important;
  padding: 8px 14px !important;
  border: 0 !important;
  border-radius: 9px !important;
  font-size: .78rem !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}
:global(.consult-status-confirm .swal2-confirm) {
  order: 1 !important;
  background: #ed9b38 !important;
  color: #fff !important;
}
:global(.consult-status-confirm .swal2-cancel) {
  order: 0 !important;
  background: #f3f4f5 !important;
  color: #4c565e !important;
}
:global(.consult-status-confirm .swal2-confirm:hover),
:global(.consult-status-confirm .swal2-cancel:hover) {
  filter: brightness(.95);
}
@media (max-width: 520px) {
  :global(.consult-status-confirm) { padding: 22px 18px 20px !important; }
  :global(.consult-status-confirm .swal2-actions) { width: 100% !important; gap: 8px !important; justify-content: flex-start !important; }
  :global(.consult-status-confirm .swal2-confirm),
  :global(.consult-status-confirm .swal2-cancel) { min-width: 0 !important; flex: 1 1 0 !important; padding-inline: 8px !important; }
}

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

.brand { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
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
.nav-item:hover { background: #f8fafc; color: #4b5563; }
.nav-item.active { background: #4b5563; color: #fff; }
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
  margin-bottom: 22px;
}
.page-title {
  font-size: clamp(2.1rem, 2.5vw, 3rem);
  font-weight: 700;
  color: #2f3740;
  letter-spacing: -0.06em;
  line-height: 1.08;
  margin: 0;
}
.page-sub { font-size: 0.95rem; color: #68727b; margin: 4px 0 0; }

.page-eyebrow {
  display: block;
  margin: 0 0 4px;
  color: #6a7580;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.skeleton {
  display: block;
  position: relative;
  overflow: hidden;
  background: #e3e8ec;
  border-radius: 8px;
}
.skeleton::after {
  position: absolute;
  inset: 0;
  content: '';
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
  animation: consultation-skeleton-shimmer 1.35s ease-in-out infinite;
}
@keyframes consultation-skeleton-shimmer {
  100% { transform: translateX(100%); }
}
.card-title-skeleton { width: 196px; height: 22px; margin-bottom: 8px; }
.card-sub-skeleton { width: min(390px, 72vw); height: 15px; }
.filter-tabs-skeleton { min-height: 56px; }
.filter-tab-skeleton { height: 38px; flex: 0 0 auto; border-radius: 10px; }
.consult-skeleton-list { display: flex; flex-direction: column; gap: 14px; }
.consult-skeleton-card { cursor: default; }
.skeleton-card-top { display: flex; align-items: flex-start; gap: 13px; }
.skeleton-avatar { width: 48px; height: 48px; flex: 0 0 48px; border-radius: 50%; }
.skeleton-card-info { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: flex-start; gap: 8px; padding-top: 2px; }
.skeleton-row { display: flex; align-items: center; gap: 10px; }
.skeleton-name { width: 218px; max-width: 42vw; height: 18px; }
.skeleton-status { width: 76px; height: 26px; border-radius: 999px; }
.skeleton-id { width: 180px; max-width: 38vw; height: 13px; }
.skeleton-ticket { width: 138px; height: 12px; }
.skeleton-queue { width: 100px; height: 24px; border-radius: 999px; }
.skeleton-actions { display: flex; gap: 9px; margin-left: auto; }
.skeleton-action { width: 118px; height: 42px; border-radius: 11px; }
.skeleton-action-wide { width: 150px; }
.skeleton-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 14px; border-top: 1px solid #e8edf1; }
.skeleton-time { width: min(370px, 58%); height: 15px; }
.skeleton-details { width: 82px; height: 13px; }
@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; transform: none; opacity: .35; }
}

/* ── Consultation Card ── */
.consult-card {
  background: linear-gradient(160deg, rgba(255,255,255,.96), rgba(244,247,249,.94));
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 22px;
  padding: 22px 24px 24px;
  flex: 0 0 auto;
  min-height: 0;
  overflow: visible;
  box-shadow: 0 14px 32px rgba(47, 58, 66, .09), inset 0 1px 0 rgba(255,255,255,.9);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
  padding-bottom: 13px;
  border-bottom: 1px solid #e8edf1;
}
.card-heading { display: flex; min-width: 0; align-items: center; gap: 12px; }
.card-heading-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  color: #fff;
  border-radius: 11px;
  background: linear-gradient(145deg, #646d77, #3d4a52);
  box-shadow: 0 6px 12px rgba(61, 74, 82, 0.18);
}
.card-title { font-size: 1.08rem; font-weight: 700; color: #1f2933; }
.card-sub   { font-size: 0.82rem; color: #6b7280; margin-top: 2px; }
.card-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 0 0 auto;
  padding: 7px 11px;
  border: 1px solid #d8e8df;
  border-radius: 10px;
  background: #f3faf6;
  color: #2d7650;
}
.card-total strong { font-size: 1rem; line-height: 1; }
.card-total span { margin-top: 4px; font-size: .62rem; font-weight: 700; }

/* ── Filter Controls ── */
.controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  background: linear-gradient(180deg, #f5f7f8, #eef2f5);
  border: 1px solid #e2e7eb;
  border-radius: 14px;
  flex: 1;
  flex-wrap: nowrap;
  overflow-x: auto;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(15, 23, 42, 0.02);
}

.filter-tabs::-webkit-scrollbar { height: 0; }

.btn-approve-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 142px;
  padding: 11px 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(145deg, #475569, #334155);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(51,65,85,0.18);
}

.btn-approve-all:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(51,65,85,0.2); }

.btn-approve-all:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 13px;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: #53606b;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}
.filter-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 21px;
  height: 21px;
  padding: 0 5px;
  box-sizing: border-box;
  border: 1px solid #d8e0e5;
  border-radius: 50%;
  background: #fff;
  color: #52616b;
  font-size: .67rem;
  font-weight: 750;
  line-height: 1;
}
.filter-tab:hover { background: rgba(148, 163, 184, 0.08); color: #374151; }
.filter-tab.active { background: linear-gradient(180deg, #4f5b66, #374752); color: #fff; box-shadow: 0 8px 16px rgba(55, 71, 82, 0.18); }
.filter-tab.active .filter-tab-count { border-color: rgba(255,255,255,.7); background: rgba(255,255,255,.96); color: #46545d; }

/* ── Request List ── */
.request-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Request Card */
.request-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 17px;
  border: 1px solid rgba(190, 201, 209, .56);
  border-left-width: 4px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafb 100%);
  transition: box-shadow 0.16s ease, transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(31, 41, 55, 0.045);
}
.request-card:hover { border-color: #c5d0d8; box-shadow: 0 12px 24px rgba(51, 65, 85, 0.1); transform: translateY(-1px); }

.border-pending   { border-left-color: #e8a020; background: linear-gradient(180deg, #fffdf9 0%, #fffaf1 100%); }
.border-approved  { border-left-color: #2c9c73; background: linear-gradient(180deg, #f7fffb 0%, #f0faf7 100%); }
.border-resched   { border-left-color: #e63946; background: linear-gradient(180deg, #fff9f9 0%, #fff3f3 100%); }
.border-completed { border-left-color: #4b5563; background: linear-gradient(180deg, #fafafb 0%, #f3f5f7 100%); }
.border-cancelled { border-left-color: #8d99ae; background: linear-gradient(180deg, #f9fafb 0%, #f5f7fa 100%); }

/* Top row */
.req-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 13px;
  border-bottom: 1px solid rgba(148, 163, 184, .22);
}
.req-student {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
}

.req-avatar-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #edf2f6, #dfe7ec);
  border: 2px solid rgba(255,255,255,0.75);
  box-shadow: 0 6px 12px rgba(51, 65, 85, 0.12);
}
.req-avatar { width: 100%; height: 100%; object-fit: cover; }

.req-info { flex: 1; min-width: 0; }

.req-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.req-name { font-size: 0.98rem; font-weight: 700; color: #27333c; }
.req-id   { font-size: 0.76rem; color: #6b7280; margin-top: 4px; }
.req-ticket { font-size: 0.74rem; color: #5e6d7a; font-weight: 600; margin-top: 3px; }
.req-queue {
  display: inline-flex;
  width: fit-content;
  margin-top: 6px;
  padding: 4px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 700;
}
.req-queue--solo { color: #167347; background: #e9f8ef; border-color: #c4ead2; }
.req-queue--waiting { color: #2563a6; background: #edf5ff; border-color: #cfdef3; }

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
}
.status-badge.badge-pending,
.badge-pending   { background: #fef3c7 !important; color: #92400e !important; border-color: rgba(146, 64, 14, 0.18) !important; }
.status-badge.badge-approved,
.badge-approved  { background: #dcfce7 !important; color: #166534 !important; border-color: rgba(22, 101, 52, 0.18) !important; }
.status-badge.badge-resched,
.badge-resched   { background: #fee2e2 !important; color: #b91c1c !important; border-color: rgba(185, 28, 28, 0.18) !important; }
.status-badge.badge-completed,
.badge-completed { background: #e2e8f0 !important; color: #334155 !important; border-color: rgba(51, 65, 85, 0.14) !important; }
.status-badge.badge-cancelled,
.badge-cancelled { background: #f1f5f9 !important; color: #475569 !important; border-color: rgba(71, 85, 105, 0.16) !important; }

/* Action buttons */
.req-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  flex-wrap: wrap;
}

.btn-approve,
.btn-reject,
.btn-done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 6px 12px rgba(31, 41, 55, 0.08);
}
.btn-approve:hover,
.btn-reject:hover,
.btn-done:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.btn-approve {
  background: linear-gradient(180deg, #4f5b66, #3c4b56);
  color: #fff;
}

.btn-reject {
  background: linear-gradient(180deg, #ee525c, #d73945);
  color: #fff;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  background: linear-gradient(180deg, #ffffff, #eef2f6);
  border: 1px solid #e0e6eb;
  border-radius: 10px;
  color: #374151;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}
.btn-edit span {
  line-height: 1;
}
.btn-edit:hover {
  transform: translateY(-1px);
  border-color: #cbd5df;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.06);
}

.btn-done {
  background: linear-gradient(180deg, #5a6775, #4c5963);
  color: #fff;
}
.req-actions .btn-reject,
.req-actions .btn-done {
  gap: 4px;
  padding: 7px 10px;
  font-size: .76rem;
}
.req-actions .btn-reject svg { width: 16px; height: 16px; }

/* Request details */
.req-details { display: flex; flex-direction: column; gap: 8px; }
.req-details {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, .22);
  border-radius: 12px;
  background: rgba(255, 255, 255, .5);
}
.request-details-expand-enter-active,
.request-details-expand-leave-active {
  overflow: hidden;
  transition: max-height .32s cubic-bezier(.2, .75, .25, 1), opacity .22s ease, transform .32s ease, padding .32s ease, border-color .32s ease;
}
.request-details-expand-enter-from,
.request-details-expand-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-color: transparent;
  opacity: 0;
  transform: translateY(-7px);
}
.request-details-expand-enter-to,
.request-details-expand-leave-from { max-height: 800px; opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .request-details-expand-enter-active,
  .request-details-expand-leave-active { transition-duration: .01ms; }
}
.req-detail-row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: start;
  column-gap: 8px;
  row-gap: 2px;
}
.req-detail-label {
  padding-top: 2px;
  color: #75818a;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .035em;
  text-transform: uppercase;
}
.req-detail-value { min-width: 0; color: #34424b; font-size: .84rem; font-weight: 600; }
.req-subject .req-detail-value { color: #34424b; font-size: .88rem; font-weight: 700; }
.req-message {
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, .2);
  border-radius: 11px;
  background: rgba(255, 255, 255, .58);
}
.req-message .req-detail-value {
  color: #4b5961;
  line-height: 1.5;
  font-weight: 500;
}
.req-description { background: rgba(255, 255, 255, .38); }
.req-time {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 2px 1px 0;
  color: #586772;
  font-size: .78rem;
  font-weight: 600;
}
.req-time > svg { flex: 0 0 auto; color: #75818a; }
.req-details-hint { margin-left: auto; color: #65747f; font-size: .7rem; font-weight: 700; }

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
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.modal-overlay button:disabled {
  cursor: wait;
  opacity: .72;
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
  background: #4b5563;
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
.logout-confirm-btn:hover { background: #6b7280; }

/* ── Reject Consultation Modal ── */
.reject-modal {
  position: relative;
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
  font-size: 0.76rem;
  color: #888;
  text-align: center;
  margin: 0 0 22px;
}

.reject-student-box {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 18px;
  border: 1px solid #dfe4e8;
  border-radius: 10px;
  margin-bottom: 22px;
  background: #f8fafb;
}
.reject-student-avatar {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  background: #e7ecef;
  box-shadow: 0 3px 9px rgba(45, 57, 65, .14);
}
.reject-student-copy { min-width: 0; }

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
.reject-select:focus { border-color: #4b5563; }

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
  justify-content: stretch;
  gap: 10px;
  width: 100%;
  margin-top: 6px;
}

.reject-cancel-btn {
  flex: 1 1 0;
  min-height: 46px;
  padding: 9px 18px;
  background: #f7f8f9;
  border: 1px solid #d7dde1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: background 0.15s;
}
.reject-cancel-btn:hover { background: #edf0f2; border-color: #c5cdd2; }

.reject-confirm-btn {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  padding: 9px 8px;
  background: #d92f3b;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}
.reject-confirm-btn:hover { background: #bd2632; }

/* Other reason input */
.reject-other-wrap {
  margin-top: 10px;
  margin-bottom: 18px;
}
.reject-other-input {
  width: 100%;
  min-height: 88px;
  padding: 11px 14px;
  border: 1.5px solid #d0d0d0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #333;
  background: #fff;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.reject-other-input::placeholder { color: #bbb; }
.reject-other-input:focus { border-color: #4b5563; }

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
  background: #e5e7eb;
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
  background: #4b5563;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.approve-ok-btn:hover { background: #6b7280; }

/* ── Reject reason required ── */
.reject-required { color: #e63946; margin-left: 2px; }

.reject-reason-error {
  font-size: 0.82rem;
  color: #e63946;
  margin: -22px 0 16px;
}

/* ── Mark done modal ── */
.done-modal {
  position: relative;
  width: 460px;
  max-width: 94vw;
  background: linear-gradient(160deg, #fff 0%, #f8fafb 100%);
  border-radius: 22px;
  padding: 24px 28px 22px;
  border: 1px solid rgba(255,255,255,.92);
  box-shadow: 0 24px 64px rgba(22, 32, 41, .22), inset 0 1px rgba(255,255,255,.95);
}
.done-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #e1e6e9;
  border-radius: 11px;
  background: #f4f6f7;
  color: #596772;
  cursor: pointer;
  transition: background .16s, color .16s, border-color .16s, transform .16s;
}
.done-modal-close:hover {
  background: #e9eef1;
  border-color: #cbd4da;
  color: #34424b;
  transform: translateY(-1px);
}
.done-modal-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(145deg, #edf0f2, #e1e6e9);
  color: #4b5962;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}
.done-modal-title {
  margin: 0;
  text-align: center;
  font-size: 1.28rem;
  font-weight: 700;
  color: #111;
}
.done-modal-sub {
  max-width: 360px;
  margin: 6px auto 14px;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}
.done-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #444;
}
.done-textarea {
  width: 100%;
  border: 1.5px solid #d7dadd;
  border-radius: 12px;
  padding: 12px 13px;
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #2b2f33;
  background: #f8fafb;
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .04);
  resize: vertical;
  box-sizing: border-box;
  min-height: 112px;
}
.done-textarea:focus {
  outline: none;
  border-color: #4b5563;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.12);
}
.done-note-count {
  margin-top: 4px;
  text-align: right;
  font-size: 0.76rem;
  color: #98a0a7;
}
.done-modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.done-confirm-btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 18px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}
.done-confirm-btn {
  min-width: 164px;
  width: 100%;
  min-height: 46px;
  border-color: #394650;
  background: linear-gradient(145deg, #5e6b75, #3f4b54);
  color: #fff;
  box-shadow: 0 7px 15px rgba(48, 58, 66, .18);
}
.done-confirm-btn:hover {
  background: linear-gradient(145deg, #6d7a84, #4d5a64);
  border-color: #4d5a64;
  box-shadow: 0 9px 18px rgba(48, 58, 66, .22);
  transform: translateY(-1px);
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
  width: 470px;
  max-width: 94vw;
  padding: 26px 26px 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,250,251,0.96));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.16);
  font-family: 'Poppins', sans-serif;
  position: relative;
}

.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.detail-close:hover {
  background: #edf2f7;
  border-color: #d8e0e7;
  transform: scale(1.04);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  padding-right: 42px;
}

.detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dfe7ec;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.detail-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-name {
  font-size: 1.08rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
}
.detail-sid {
  font-size: 0.8rem;
  color: #64748b;
}

.detail-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(226, 232, 240, 0.2));
  margin: 0 0 18px;
}

.detail-row {
  margin-bottom: 16px;
}
.detail-row:last-child { margin-bottom: 0; }
.detail-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 6px;
}
.detail-value {
  font-size: 0.93rem;
  color: #1f2937;
  line-height: 1.6;
  font-weight: 500;
}
.placeholder-box {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 11px 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.04);
  color: #1f2937;
}
.placeholder-box--message {
  min-height: 76px;
  align-items: flex-start;
  white-space: pre-line;
}
.placeholder-box--warning {
  background: #fff1f2;
  border-color: rgba(225, 29, 72, 0.12);
  border-left: 3px solid #e11d48;
  color: #9f1239;
}
.detail-msg {
  color: #374151;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 11px 12px;
}
.detail-label-reject { color: #e11d48; }
.detail-reject-reason {
  color: #9f1239;
  background: #fff1f2;
  border: 1px solid rgba(225, 29, 72, 0.12);
  border-left: 3px solid #e11d48;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 0.88rem;
}

/* ── Edit Modal ── */
.edit-modal {
  width: 480px;
  max-width: 94vw;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 22px;
  box-shadow: 0 18px 54px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.edit-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 26px 28px 0;
}

.edit-modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 3px;
}

.edit-modal-sub {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.edit-modal-close {
  background: #f5f6f8;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;
}
.edit-modal-close:hover { background: #edf2f6; transform: translateY(-1px); }

.edit-modal-body {
  padding: 18px 28px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin: 10px 0 4px;
}
.edit-label:first-child { margin-top: 0; }

.edit-status-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 2px;
}

.edit-status-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.93rem;
  font-weight: 600;
  color: #374151;
  background: #fff;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
  user-select: none;
}
.edit-status-opt:hover {
  background: #fafbfc;
  border-color: #d7dde3;
}

.edit-status-opt.selected {
  border-color: currentColor;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
  font-weight: 700;
}

/* Per-status dot + selected colour */
.opt-pending   { color: #d97706; }
.opt-approved  { color: #15803d; }
.opt-resched   { color: #dc2626; }
.opt-completed { color: #64748b; }
.opt-cancelled { color: #5c677d; }

.opt-pending.selected   { background: #fffaf0; border-color: #f59e0b; }
.opt-approved.selected  { background: #eafaf1; border-color: #15803d; box-shadow: 0 0 0 1px rgba(21, 128, 61, 0.08); }
.opt-resched.selected   { background: #fff5f5; border-color: #dc2626; }
.opt-completed.selected { background: #f8fafc; border-color: #64748b; }
.opt-cancelled.selected { background: #f4f5f7; border-color: #5c677d; }

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
  justify-content: center;
  gap: 10px;
  padding: 18px 28px 26px;
}

.edit-cancel-btn {
  background: #fff;
  border: 1.5px solid #dfe4ea;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  padding: 9px 20px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.edit-cancel-btn:hover { background: #f8fafc; border-color: #cbd5df; transform: translateY(-1px); }

.edit-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: linear-gradient(180deg, #4d5964 0%, #394753 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, filter 0.15s;
  box-shadow: 0 6px 14px rgba(75, 85, 99, 0.16);
}
.edit-save-btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
.edit-save-btn:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; transform: none; filter: none; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .main { padding: 20px 16px 32px; }
  .sidebar { width: 200px; min-width: 200px; }
  .card-header { align-items: flex-start; }
  .controls-row { align-items: stretch; flex-direction: column; }
  .btn-approve-all { width: 100%; }
}

@media (max-width: 560px) {
  .page-title { font-size: 1.8rem; }
  .consult-card { padding: 18px 14px 20px; }
  .card-header { gap: 12px; }
  .card-total { padding: 6px 8px; }
  .card-total span { font-size: .57rem; }
  .req-top { display: flex; flex-wrap: wrap; column-gap: 10px; row-gap: 10px; align-items: flex-start; }
  .req-student { flex: 1 1 100%; }
  .req-avatar-wrap { width: 42px; height: 42px; }
  .req-actions { justify-content: flex-start; margin-left: 52px; }
  .request-card { padding: 15px 13px; }
  .req-detail-row { grid-template-columns: max-content minmax(0, 1fr); column-gap: 6px; }
  .req-message { padding: 9px 10px; }
  .req-details-hint { font-size: .64rem; }
  .req-name { font-size: .9rem; }
  .filter-tabs { flex: 0 0 auto; max-width: 100%; }
  .skeleton-card-top { flex-wrap: wrap; }
  .skeleton-card-info { flex: 1 1 calc(100% - 62px); }
  .skeleton-actions { margin-left: 61px; }
  .skeleton-action { width: 88px; height: 36px; }
  .skeleton-action-wide { width: 118px; }
  .btn-approve,
  .btn-reject,
  .btn-done { padding: 7px 9px; font-size: .72rem; }
}
</style>
