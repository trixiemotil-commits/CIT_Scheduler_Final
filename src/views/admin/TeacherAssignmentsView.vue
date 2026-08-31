<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems.filter(item => item.to !== '/admin/settings')"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: currentRoute === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.name }}</span>
        </RouterLink>
        <RouterLink to="/admin/activity-logs" class="nav-item admin-secondary-nav" :class="{ active: currentRoute === '/admin/activity-logs' }">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/></svg></span>
          <span>Activity Logs</span>
        </RouterLink>
        <RouterLink to="/admin/settings" class="nav-item admin-secondary-nav" :class="{ active: currentRoute === '/admin/settings' }">
          <AdminSettingsIcon />
          <span>Settings</span>
        </RouterLink>
        <PublishedTermScheduleLink />
      </nav>
      <RoleSwitchButton />

      <!-- Logout -->
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
      <!-- Header -->
      <header class="main-header">
        <div>
          <span class="page-eyebrow">Faculty management</span>
          <h1 class="page-title">Teacher Assignments</h1>
          <p class="page-sub">Manage teacher availability, designated areas, and substitute coverage.</p>
        </div>
        <button class="add-teacher-btn header-add-btn" @click="showAddModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Add teacher
        </button>
      </header>

      <!-- Teachers Card Section -->
      <section class="teachers-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Faculty overview</h2>
            <p class="section-sub">
              <template v-if="loadingTeachers">Loading teachers...</template>
              <template v-else>{{ filteredTeachers.length }} teacher{{ filteredTeachers.length === 1 ? '' : 's' }} shown</template>
            </p>
          </div>
          <div class="summary-counts">
            <span class="summary-count summary-count--total"><b>{{ teachers.length }}</b><small>Total</small></span>
            <span class="summary-count available"><b>{{ teachers.filter(item => item.status === 'In School').length }}</b><small>In school</small></span>
            <span class="summary-count summary-count--leave"><b>{{ teachers.filter(item => item.status === 'On Leave').length }}</b><small>On leave</small></span>
          </div>
        </div>

        <!-- Status Tabs -->
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab"
            :class="['status-tab', { active: activeTab === tab }]"
            @click="selectStatusTab(tab)"
          >
            {{ tab }}
            <span>{{ tab === 'All' ? teachers.length : teachers.filter(item => item.status === tab).length }}</span>
          </button>
        </div>

        <!-- Teachers Grid/Carousel -->
        <div class="teachers-carousel-wrap">
          <button v-if="currentIndex > 0" class="carousel-arrow prev" @click="previousTeachers">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div class="teachers-grid">
            <div v-if="loadingTeachers" class="teachers-loading" aria-live="polite" aria-label="Loading teachers">
              <div v-for="index in 3" :key="index" class="teacher-skeleton">
                <div class="teacher-skeleton-badge"></div>
                <div class="teacher-skeleton-avatar"></div>
                <div class="teacher-skeleton-line teacher-skeleton-line--name"></div>
                <div class="teacher-skeleton-line teacher-skeleton-line--college"></div>
                <div class="teacher-skeleton-line teacher-skeleton-line--email"></div>
                <div class="teacher-skeleton-field"></div>
                <div class="teacher-skeleton-line teacher-skeleton-line--tag"></div>
              </div>
            </div>
            <div v-else-if="!filteredTeachers.length" class="teachers-empty-state">
              <span class="teachers-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M17 8h5M19.5 5.5v5" />
                </svg>
              </span>
              <h3>No teachers are {{ emptyStatusDescription }}</h3>
              <p>There are currently no teacher records under the “{{ activeTab }}” status.</p>
              <button type="button" @click="selectStatusTab('All')">View all teachers</button>
            </div>
            <div
              v-for="teacher in visibleTeachers"
              :key="teacher.id"
              :class="['teacher-card', `card-${teacher.status.toLowerCase().replace(/\s+/g, '-')}`]"  
            >
              <!-- Status Badge -->
              <div :class="['status-badge', `badge-${teacher.status.toLowerCase().replace(/\s+/g, '-')}`]">
                {{ teacher.status }}
              </div>

              <!-- Avatar -->
              <div class="teacher-avatar-wrap">
                <img :src="teacher.avatar" :alt="teacher.name" class="teacher-avatar" />
              </div>

              <!-- Name -->
              <h3 class="teacher-name">{{ teacher.name }}</h3>

              <!-- College -->
              <p class="teacher-college">{{ teacher.college }}</p>

              <!-- Email -->
              <div class="teacher-email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{{ teacher.email }}</span>
              </div>

              <!-- Status Dropdown -->
              <div class="teacher-status-wrap">
                <label>Availability status</label>
                <select
                  v-model="teacher.status"
                  :class="['status-dropdown', `status-${teacher.status.toLowerCase().replace(/\s+/g, '-')}`]"
                  @change="updateTeacherStatus(teacher)"
                >
                  <option value="In School">In School</option>
                  <option value="On Leave">On Leave</option>
                  <option value="On Meeting">On Meeting</option>
                </select>
              </div>

              <!-- Substitute Teacher -->
              <div v-if="teacher.status === 'On Leave'" class="leave-coverage-block">
                <div class="leave-coverage-notice">
                  <span class="leave-coverage-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M8 2v4M16 2v4M3 10h18" />
                      <rect x="3" y="4" width="18" height="17" rx="2" />
                      <path d="m9 15 2 2 4-4" />
                    </svg>
                  </span>
                  <span>
                    <strong>Substitute coverage</strong>
                    <small v-if="getTeacherWeeklySchedule(teacher).length">
                      {{ getAssignedCoverageCount(teacher) }} of {{ getTeacherWeeklySchedule(teacher).length }} classes assigned
                    </small>
                    <small v-else>No scheduled classes to cover</small>
                  </span>
                  <button
                    v-if="getTeacherWeeklySchedule(teacher).length"
                    type="button"
                    class="manage-coverage-btn"
                    title="Manage substitute assignments"
                    @click="openCoverageModal(teacher)"
                  >
                    Manage
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- Designated Areas -->
              <div v-if="teacher.designatedAreas.length" class="designated-areas">
                <div class="designated-label">Designated Areas:</div>
                <div class="areas-list">
                  <div v-for="(area, idx) in teacher.designatedAreas" :key="idx" class="area-tag">
                    {{ area }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button v-if="currentIndex < maxIndex" class="carousel-arrow next" @click="nextTeachers">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <!-- Carousel Indicators -->
        <div class="carousel-indicators">
          <button
            v-for="(_, idx) in carouselPages"
            :key="idx"
            :class="['indicator', { active: currentIndex === idx * itemsPerPage }]"
            @click="currentIndex = idx * itemsPerPage"
          />
        </div>
      </section>
    </main>

    <!-- ═══ Add Teacher Modal ═══ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-box add-teacher-modal" role="dialog" aria-modal="true" aria-labelledby="add-teacher-title">
          <!-- Header -->
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">Faculty record</span>
              <h2 id="add-teacher-title" class="modal-title">Add New Teacher</h2>
              <p class="modal-sub">Create a teacher profile and assign their designated teaching areas.</p>
            </div>
            <button type="button" class="modal-close-btn" aria-label="Close add teacher modal" @click="showAddModal = false">
              ×
            </button>
          </div>

          <div class="add-teacher-modal-body">
            <!-- Avatar placeholder -->
            <div class="modal-avatar-section">
              <div class="modal-avatar-placeholder" @click="$refs.fileInput.click()">
                <img v-if="previewImage" :src="previewImage" alt="Preview" class="modal-avatar-preview" />
                <template v-else>
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="1.6">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </template>
                <div class="modal-avatar-checkmark">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.2" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
              <div class="modal-avatar-copy">
                <strong>Profile photo</strong>
                <span>Click the circle to upload an image.</span>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="modal-file-input"
                @change="handleImageUpload"
              />
            </div>

            <!-- Form Fields -->
            <div class="modal-form">
              <label class="modal-field">
                <span>Teacher name</span>
                <input v-model="newTeacherName" type="text" placeholder="Enter teacher's name" class="modal-input" />
              </label>
              <label class="modal-field">
                <span>Email address</span>
                <div class="modal-email-input-wrap">
                  <input
                    v-model="newTeacherEmail"
                    type="text"
                    placeholder="Enter teacher's email"
                    class="modal-input modal-email-input"
                  />
                  <span class="modal-email-suffix">.au@phinmaed.com</span>
                </div>
              </label>
              
              <!-- Multiple Designated Areas Custom Dropdown -->
              <div class="modal-areas-group">
                <label class="modal-areas-label">Designated areas</label>
                <div class="modal-custom-dropdown" v-click-outside="() => showAreasDropdown = false">
                  <button type="button" class="modal-dropdown-btn" @click="showAreasDropdown = !showAreasDropdown">
                    <span v-if="newTeacherAreas.length === 0" class="modal-dropdown-placeholder">Select designated areas</span>
                    <span v-else class="modal-dropdown-selected">
                      {{ newTeacherAreas.length }} area{{ newTeacherAreas.length === 1 ? '' : 's' }} selected
                    </span>
                    <svg class="modal-dropdown-icon" :class="{ open: showAreasDropdown }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  <div v-if="showAreasDropdown" class="modal-dropdown-menu">
                    <label v-for="area in ['Data Structure', 'Database', 'OOP', 'Web Development', 'Mobile Dev', 'UI/UX', 'Algorithms', 'Software Engineering']" :key="area" class="modal-dropdown-option">
                      <input
                        type="checkbox"
                        :value="area"
                        :checked="newTeacherAreas.includes(area)"
                        @change="(e) => {
                          if (e.target.checked) {
                            newTeacherAreas.push(area)
                          } else {
                            newTeacherAreas.splice(newTeacherAreas.indexOf(area), 1)
                          }
                        }"
                        class="modal-dropdown-checkbox"
                      />
                      <span class="modal-dropdown-label">{{ area }}</span>
                    </label>
                  </div>
                </div>
                <div v-if="newTeacherAreas.length" class="modal-selected-areas">
                  <span v-for="area in newTeacherAreas" :key="area">{{ area }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="modal-cancel-btn" @click="showAddModal = false">Cancel</button>
            <button class="modal-add-btn" :disabled="isSavingNewTeacher" @click="addNewTeacher">
              {{ isSavingNewTeacher ? 'Saving…' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="coverageTeacher" class="modal-overlay coverage-modal-overlay" @click.self="closeCoverageModal">
        <section class="coverage-modal" role="dialog" aria-modal="true" aria-labelledby="coverage-modal-title">
          <header class="coverage-modal-header">
            <div class="coverage-modal-heading">
              <span class="coverage-modal-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="17" rx="2" /><path d="m9 15 2 2 4-4" />
                </svg>
              </span>
              <div>
                <span class="coverage-modal-eyebrow">Substitute management</span>
                <h2 id="coverage-modal-title">Coverage for {{ coverageTeacher.name }}</h2>
                <p>Assign an available teacher to each scheduled class.</p>
              </div>
            </div>
            <button class="coverage-modal-close" type="button" aria-label="Close substitute management" @click="closeCoverageModal">&times;</button>
          </header>

          <div class="coverage-modal-progress">
            <span>{{ getAssignedCoverageCount(coverageTeacher) }} of {{ getTeacherWeeklySchedule(coverageTeacher).length }} classes covered</span>
            <div class="coverage-progress-track"><span :style="{ width: `${getCoverageProgress(coverageTeacher)}%` }"></span></div>
          </div>

          <div class="coverage-modal-list">
            <article v-for="entry in getTeacherWeeklySchedule(coverageTeacher)" :key="getEntryKey(entry)" class="coverage-modal-row">
              <div class="coverage-class-details">
                <strong>{{ entry.subject }}</strong>
                <span>{{ entry.day }} · {{ entry.timeIn }}–{{ entry.timeOut }}</span>
                <small v-if="entry.section || entry.room">{{ [entry.section, entry.room].filter(Boolean).join(' · ') }}</small>
              </div>
              <div class="coverage-assignment-field">
                <label :for="`substitute-${getEntryKey(entry)}`">Covering teacher</label>
                <div class="substitute-select-row">
                  <select
                    :id="`substitute-${getEntryKey(entry)}`"
                    :value="getAssignedSubstitute(coverageTeacher, entry)"
                    :class="['substitute-dropdown', { 'is-placeholder': !getAssignedSubstitute(coverageTeacher, entry) }]"
                    @change="updateCoverageSubstitute(entry, $event.target.value)"
                  >
                    <option value="" disabled>Choose a substitute teacher</option>
                    <option v-for="sub in getAvailableSubstitutesForEntry(coverageTeacher, entry)" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                  </select>
                  <button v-if="coverageTeacher.substituteAssignments[getEntryKey(entry)]" type="button" class="substitute-remove-btn" @click="removeEntrySubstitute(coverageTeacher, entry)">Clear</button>
                </div>
              </div>
            </article>
          </div>

          <footer class="coverage-modal-footer">
            <span>Assignments are saved only when you confirm.</span>
            <div>
              <button type="button" class="coverage-cancel-btn" @click="closeCoverageModal">Cancel</button>
              <button type="button" class="substitute-save-btn" :disabled="savingSubstitute[coverageTeacher.id]" @click="saveCoverageAndClose">
                {{ savingSubstitute[coverageTeacher.id] ? 'Saving…' : 'Save assignments' }}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
          <div class="logout-modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 id="logout-modal-title" class="logout-modal-title">Log out?</h2>
          <p class="logout-modal-sub">You will be returned to the login page.</p>
          <div class="logout-modal-actions">
            <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
            <button class="logout-confirm-btn" @click="confirmLogout">Log out</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import Swal from 'sweetalert2'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)

const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const showLogoutModal = ref(false)
const showAddModal = ref(false)
const coverageTeacher = ref(null)
const coverageSnapshot = ref({})
const showAreasDropdown = ref(false)
const newTeacherName = ref('')
const newTeacherEmail = ref('')
const newTeacherAreas = ref([])
const previewImage = ref('')
const TEACHER_EMAIL_SUFFIX = '.au@phinmaed.com'
const fileInput = ref(null)
const isSavingNewTeacher = ref(false)

const activeTab = ref('All')
const currentIndex = ref(0)
const itemsPerPage = 3

function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

function openCoverageModal(teacher) {
  coverageTeacher.value = teacher
  coverageSnapshot.value = { ...(teacher.substituteAssignments || {}) }
}

function closeCoverageModal({ preserve = false } = {}) {
  if (!preserve && coverageTeacher.value) {
    coverageTeacher.value.substituteAssignments = { ...coverageSnapshot.value }
    if (unsavedChanges.value?.[coverageTeacher.value.id]) delete unsavedChanges.value[coverageTeacher.value.id]
  }
  coverageTeacher.value = null
  coverageSnapshot.value = {}
}

function getCoverageProgress(teacher) {
  const total = getTeacherWeeklySchedule(teacher).length
  return total ? Math.round((getAssignedCoverageCount(teacher) / total) * 100) : 0
}

function updateCoverageSubstitute(entry, substituteId) {
  if (!coverageTeacher.value) return
  updateEntrySubstitute(coverageTeacher.value, entry, substituteId)
  markUnsaved(coverageTeacher.value)
}

async function saveCoverageAndClose() {
  if (!coverageTeacher.value) return
  const saved = await saveSubstituteAssignment(coverageTeacher.value)
  if (saved) closeCoverageModal({ preserve: true })
}

function markUnsaved(teacher) {
  if (!teacher || !teacher.id) return
  unsavedChanges.value = { ...(unsavedChanges.value || {}), [teacher.id]: true }
}

function canAutoRefresh() {
  return !Object.keys(unsavedChanges.value || {}).length
}

const statusTabs = ['All', 'In School', 'On Meeting', 'On Leave']

function selectStatusTab(tab) {
  activeTab.value = tab
  currentIndex.value = 0
}

const emptyStatusDescription = computed(() => {
  const descriptions = {
    'In School': 'currently in school',
    'On Meeting': 'currently in a meeting',
    'On Leave': 'currently on leave',
  }
  return descriptions[activeTab.value] || 'available'
})

const teachers = ref([])
const loadingTeachers = ref(false)
const scheduleCache = ref({})
const scheduleLoading = ref({})
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) {
    logout()
    router.push('/')
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
    if (response.status === 401 || response.status === 403) {
      logout()
      router.push('/')
    }
    throw new Error(body.error || body.message || 'Request failed.')
  }

  return body
}

function mapTeacherStatus(status) {
  if (status === 'On Meeting' || status === 'On-Meeting') return 'On Meeting'
  if (status === 'On Leave') return 'On Leave'
  return 'In School'
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null
  const normalized = timeStr.trim().toUpperCase()
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3]
  if (hour === 12) {
    hour = period === 'AM' ? 0 : 12
  } else if (period === 'PM') {
    hour += 12
  }
  return hour * 60 + minute
}

function isTimeRangeOverlap(startA, endA, startB, endB) {
  const aStart = parseTimeToMinutes(startA)
  const aEnd = parseTimeToMinutes(endA)
  const bStart = parseTimeToMinutes(startB)
  const bEnd = parseTimeToMinutes(endB)
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false
  return aStart < bEnd && bStart < aEnd
}

function normalizeTeacherName(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : ''
}

function getScheduleForTeacher(teacherName) {
  return Array.isArray(scheduleCache.value[normalizeTeacherName(teacherName)])
    ? scheduleCache.value[normalizeTeacherName(teacherName)]
    : []
}

async function loadTeacherSchedule(teacherName) {
  const key = normalizeTeacherName(teacherName)
  if (!teacherName || scheduleLoading.value[key] || scheduleCache.value[key]) {
    return
  }

  scheduleLoading.value[key] = true
  try {
    const payload = await apiRequest(`/schedules?teacher=${encodeURIComponent(teacherName)}`)
    scheduleCache.value[key] = Array.isArray(payload.entries) ? payload.entries : []
  } catch (error) {
    console.error(`Failed to load schedule for ${teacherName}:`, error)
    scheduleCache.value[key] = []
  } finally {
    scheduleLoading.value[key] = false
  }
}

function getLeaveScheduleEntries(teacher) {
  const entries = getScheduleForTeacher(teacher.name)
  if (!entries.length) {
    if (!scheduleLoading.value[normalizeTeacherName(teacher.name)]) {
      loadTeacherSchedule(teacher.name)
    }
    return []
  }

  return [...entries]
    .filter((entry) => entry.day && entry.timeIn && entry.timeOut && entry.subject)
    .filter((entry) => !isLunchBreakEntry(entry))
    .map((entry) => ({
      ...entry,
      dayIndex: DAY_ORDER.indexOf(entry.day),
      startMinutes: parseTimeToMinutes(entry.timeIn) ?? 0,
    }))
    .filter((entry) => entry.dayIndex >= 0)
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
      return a.startMinutes - b.startMinutes
    })
}

function isLunchBreakEntry(entry = {}) {
  return (
    String(entry.entryType || '').trim().toLowerCase() === 'lunch' ||
    String(entry.color || '').trim().toLowerCase() === 'color-gray' ||
    /\blunch(?:\s+break)?\b/i.test(String(entry.subject || ''))
  )
}

function getTeacherWeeklySchedule(teacher) {
  const today = new Date().getDay()
  const currentDay = DAY_ORDER[today - 1] || ''
  return getLeaveScheduleEntries(teacher).filter((entry) => entry.day === currentDay)
}

function hasSubstituteConflict(candidate, leaveEntries) {
  const schedule = getScheduleForTeacher(candidate.name)
  if (!schedule.length) {
    if (!scheduleLoading.value[normalizeTeacherName(candidate.name)]) {
      loadTeacherSchedule(candidate.name)
    }
    return false
  }

  return leaveEntries.some((leaveEntry) =>
    schedule.some((entry) => isTimeRangeOverlap(leaveEntry.timeIn, leaveEntry.timeOut, entry.timeIn, entry.timeOut))
  )
}

function mapTeacherStatusToApi(status) {
  if (status === 'On Meeting' || status === 'On-Meeting') return 'On Meeting'
  if (status === 'On Leave') return 'On Leave'
  return 'On School'
}

function mapTeacherFromApi(user) {
  const firstName = (user.firstName || '').trim()
  const lastName = (user.lastName || '').trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const designatedAreas = Array.isArray(user.designatedAreas) && user.designatedAreas.length
    ? user.designatedAreas
    : (user.department ? [user.department] : [])

  return {
    id: user.id,
    firstName,
    lastName,
    role: 'teacher',
    name: fullName || user.name || 'Prof. Teacher',
    college: user.department || 'College of Information Technology',
    email: user.email || '',
    avatar: user.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.id || user.email || fullName)}`,
    status: mapTeacherStatus(user.teacher_status),
    account_status: user.account_status || 'Active',
    teacher_status: user.teacher_status || 'On School',
    employeeId: user.employeeId || '',
    studentId: user.studentId || '',
    phone: user.phone || '',
    department: user.department || '',
    designatedAreas,
    substituteTeacher: user.substituteTeacher || null,
    substituteAssignments: user.substituteAssignments || {},
    _lastStatus: mapTeacherStatus(user.teacher_status),
  }
}

function getEntryKey(entry) {
  return `${entry.day || ''}|${entry.timeIn || ''}-${entry.timeOut || ''}|${entry.subject || ''}`.trim()
}

function getAssignedCoverageCount(teacher) {
  const assignments = teacher.substituteAssignments || {}
  return getTeacherWeeklySchedule(teacher).filter((entry) => assignments[getEntryKey(entry)]).length
}

function getAssignedSubstitute(teacher, entry) {
  if (!teacher.substituteAssignments) teacher.substituteAssignments = {}
  return teacher.substituteAssignments[getEntryKey(entry)] || ''
}

function updateEntrySubstitute(teacher, entry, substituteId) {
  if (!teacher.substituteAssignments) teacher.substituteAssignments = {}
  teacher.substituteAssignments[getEntryKey(entry)] = substituteId || null
}

function removeEntrySubstitute(teacher, entry) {
  if (!teacher.substituteAssignments) teacher.substituteAssignments = {}
  delete teacher.substituteAssignments[getEntryKey(entry)]
  markUnsaved(teacher)
}

function getTeacherNameById(id) {
  if (!id) return ''
  const found = teachers.value.find((t) => String(t.id) === String(id))
  return found ? found.name : id
}

function getAvailableSubstitutesForEntry(currentTeacher, entry) {
  const candidates = teachers.value.filter((t) => t.id !== currentTeacher.id && t.status === 'In School')

  const filtered = candidates.filter((candidate) => {
    const schedule = getScheduleForTeacher(candidate.name)
    if (!schedule.length) {
      if (!scheduleLoading.value[normalizeTeacherName(candidate.name)]) {
        loadTeacherSchedule(candidate.name)
      }
      return true
    }

    return !schedule.some((candidateEntry) =>
      candidateEntry.day === entry.day &&
      isTimeRangeOverlap(entry.timeIn, entry.timeOut, candidateEntry.timeIn, candidateEntry.timeOut)
    )
  })

  // Ensure the currently assigned substitute (if any) is included so selection doesn't disappear
  const assignedId = getAssignedSubstitute(currentTeacher, entry)
  if (assignedId) {
    const exists = filtered.some((c) => String(c.id) === String(assignedId))
    if (!exists) {
      const assignedTeacher = teachers.value.find((t) => String(t.id) === String(assignedId))
      if (assignedTeacher) filtered.unshift(assignedTeacher)
    }
  }

  return filtered
}

async function loadTeachers() {
  const showLoadingState = teachers.value.length === 0
  if (showLoadingState) loadingTeachers.value = true
  try {
    const payload = await apiRequest('/users?role=teacher')
    teachers.value = Array.isArray(payload.users)
      ? payload.users.map(mapTeacherFromApi)
      : []

    teachers.value
      .filter((teacher) => teacher.status === 'On Leave')
      .forEach((teacher) => loadTeacherSchedule(teacher.name))
  } catch (error) {
    teachers.value = []
    console.error('Failed to load teachers:', error)
  } finally {
    if (showLoadingState) loadingTeachers.value = false
  }
}

const filteredTeachers = computed(() => {
  if (activeTab.value === 'All') return teachers.value
  if (activeTab.value === 'On Leave') return teachers.value.filter(t => t.status === 'On Leave')
  return teachers.value.filter(t => t.status === activeTab.value)
})

const visibleTeachers = computed(() => {
  return filteredTeachers.value.slice(currentIndex.value, currentIndex.value + itemsPerPage)
})

const maxIndex = computed(() => {
  return Math.max(0, filteredTeachers.value.length - itemsPerPage)
})

const carouselPages = computed(() => {
  const pages = Math.ceil(filteredTeachers.value.length / itemsPerPage)
  return Array.from({ length: pages })
})

const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'View Schedules', to: '/admin/schedule/view',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Add Schedule', to: '/admin/schedule/add',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    name: 'Academic Terms', to: '/admin/academic-terms',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

const nextTeachers = () => {
  if (currentIndex.value < maxIndex.value) {
    currentIndex.value += itemsPerPage
  }
}

const previousTeachers = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= itemsPerPage
  }
}

const updateTeacherStatus = async (teacher) => {
  const previousStatus = teacher._lastStatus || teacher.status

  try {
    const payload = {
      firstName: teacher.firstName || teacher.name?.split(' ')[0] || '',
      lastName: teacher.lastName || teacher.name?.split(' ').slice(1).join(' ') || 'Teacher',
      email: teacher.email,
      role: 'teacher',
      department: teacher.department || teacher.college || '',
      phone: teacher.phone || '',
      account_status: teacher.account_status || 'Active',
      teacher_status: mapTeacherStatusToApi(teacher.status),
      employeeId: teacher.employeeId || '',
      studentId: teacher.studentId || '',
    }

    const response = await apiRequest(`/users/${teacher.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    if (response?.user) {
      const mapped = mapTeacherFromApi(response.user)
      Object.assign(teacher, mapped)
      return
    }

    teacher._lastStatus = teacher.status
  } catch (error) {
    teacher.status = previousStatus
    console.error('Failed to update teacher status:', error)
    alert(error.message || 'Failed to update teacher status.')
  }
}

const getAvailableSubstitutes = (currentTeacher) => {
  const todayEntries = getTeacherWeeklySchedule(currentTeacher)
  const candidates = teachers.value.filter((t) => t.id !== currentTeacher.id && t.status === 'In School')

  if (!todayEntries.length) {
    candidates.forEach((candidate) => {
      if (!getScheduleForTeacher(candidate.name).length && !scheduleLoading.value[normalizeTeacherName(candidate.name)]) {
        loadTeacherSchedule(candidate.name)
      }
    })
    return candidates
  }

  return candidates.filter((candidate) => {
    const candidateSchedule = getScheduleForTeacher(candidate.name)
    if (!candidateSchedule.length) {
      if (!scheduleLoading.value[normalizeTeacherName(candidate.name)]) {
        loadTeacherSchedule(candidate.name)
      }
      return false
    }
    return !hasSubstituteConflict(candidate, todayEntries)
  })
}

const getTeacherSubstituteClass = (teacher) => {
  const leaveEntries = getLeaveScheduleEntries(teacher)
  return leaveEntries.length ? leaveEntries[0] : null
}

const savingSubstitute = ref({})
const unsavedChanges = ref({})

const updateSubstituteTeacher = (teacher, substituteName) => {
  teacher.substituteTeacher = substituteName || null
  if (substituteName && !getScheduleForTeacher(substituteName).length && !scheduleLoading.value[normalizeTeacherName(substituteName)]) {
    loadTeacherSchedule(substituteName)
  }
}

const saveSubstituteAssignment = async (teacher) => {
  const eligibleEntryKeys = new Set(getTeacherWeeklySchedule(teacher).map(getEntryKey))
  const substituteAssignments = Object.fromEntries(
    Object.entries(teacher.substituteAssignments || {}).filter(
      ([key, substituteId]) => substituteId && eligibleEntryKeys.has(key)
    )
  )
  teacher.substituteAssignments = substituteAssignments

  savingSubstitute.value[teacher.id] = true
  try {
    const scheduleByKey = new Map(
      getTeacherWeeklySchedule(teacher).map((entry) => [getEntryKey(entry), entry])
    )
    const assignments = Object.entries(substituteAssignments).flatMap(([key, substituteTeacher]) => {
      const entry = scheduleByKey.get(key)
      if (!entry) return []
      return [{
        substituteTeacher,
        entries: [{
          id: entry.id || null,
          subject: entry.subject || '',
          room: entry.room || '',
          section: entry.section || '',
          year: entry.year || '',
          timeIn: entry.timeIn,
          timeOut: entry.timeOut,
          teacher: teacher.name || '',
          tableLabel: entry.tableLabel || teacher.name || '',
          campus: entry.campus || '',
          color: entry.color || 'color-yellow',
          entryType: entry.entryType || 'class',
          parallel: Boolean(entry.parallel),
          parallelGroupId: entry.parallelGroupId || null,
          parallelSlots: Array.isArray(entry.parallelSlots) ? entry.parallelSlots.map((slot) => ({ ...slot })) : [],
          addedAt: entry.addedAt || undefined,
        }],
      }]
    })

    await apiRequest('/substitutes', {
      method: 'PUT',
      body: JSON.stringify({
        originalTeacher: teacher.id,
        date: new Date().toLocaleDateString('en-CA'),
        substituteAssignments,
        assignments,
      }),
    })

    if (unsavedChanges.value && unsavedChanges.value[teacher.id]) {
      delete unsavedChanges.value[teacher.id]
    }
    await Swal.fire({
      icon: 'success',
      title: assignments.length ? 'Substitutes updated' : 'Substitutes removed',
      text: assignments.length
        ? `Substitute assignments have been updated for ${teacher.name}.`
        : `All substitute assignments have been removed for ${teacher.name}.`,
      confirmButtonColor: '#4b5563',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
    return true
  } catch (error) {
    console.error('Failed to save substitute assignment:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Save failed',
      text: error.message || 'Failed to save substitute assignment.',
      confirmButtonColor: '#4b5563',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
    return false
  } finally {
    savingSubstitute.value[teacher.id] = false
  }
}

const handleImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const getTeacherEmailLocalPart = () => {
  return newTeacherEmail.value
    .trim()
    .replace(/\s+/g, '')
    .replace(new RegExp(`${TEACHER_EMAIL_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '')
    .replace(/@.*$/, '')
}

const splitTeacherName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Teacher' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

const buildDefaultTeacherPassword = (emailLocalPart) => {
  const safeLocal = String(emailLocalPart || 'teacher').replace(/[^a-z0-9]/gi, '')
  return `${safeLocal || 'Teacher'}Teacher@2026`
}

const resetAddTeacherForm = () => {
  newTeacherName.value = ''
  newTeacherEmail.value = ''
  newTeacherAreas.value = []
  previewImage.value = ''
  showAreasDropdown.value = false
}

const addNewTeacher = async () => {
  const emailLocalPart = getTeacherEmailLocalPart()
  const { firstName, lastName } = splitTeacherName(newTeacherName.value)

  if (!firstName || !lastName || !emailLocalPart || newTeacherAreas.value.length === 0) {
    alert('Please fill in all fields and select at least one designated area')
    return
  }

  const payload = {
    firstName,
    lastName,
    email: `${emailLocalPart}${TEACHER_EMAIL_SUFFIX}`.toLowerCase(),
    role: 'teacher',
    roles: ['teacher'],
    password: buildDefaultTeacherPassword(emailLocalPart),
    account_status: 'Active',
    teacher_status: 'On School',
    avatar: previewImage.value || null,
    designatedAreas: [...newTeacherAreas.value],
  }

  isSavingNewTeacher.value = true
  try {
    await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await loadTeachers()
    resetAddTeacherForm()
    showAddModal.value = false
    await Swal.fire({
      icon: 'success',
      title: 'Teacher saved',
      text: 'The teacher profile has been saved to the database.',
      confirmButtonColor: '#4b5563',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
  } catch (error) {
    console.error('Failed to add teacher:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Unable to save teacher',
      text: error.message || 'Failed to save teacher to the database.',
      confirmButtonColor: '#4b5563',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
  } finally {
    isSavingNewTeacher.value = false
  }
}

let teacherRefreshInterval

function refreshTeachersWhenVisible() {
  if (!document.hidden) loadTeachersIfAllowed()
}

function loadTeachersIfAllowed() {
  if (canAutoRefresh()) {
    loadTeachers()
  }
}

onMounted(() => {
  loadTeachers()
  teacherRefreshInterval = window.setInterval(loadTeachersIfAllowed, 15000)
  window.addEventListener('focus', loadTeachersIfAllowed)
  document.addEventListener('visibilitychange', refreshTeachersWhenVisible)
})

onUnmounted(() => {
  window.clearInterval(teacherRefreshInterval)
  window.removeEventListener('focus', loadTeachersIfAllowed)
  document.removeEventListener('visibilitychange', refreshTeachersWhenVisible)
})
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
  border: 3px solid #c4c9cd;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #4b5563;
}
.role {
  font-size: 0.88rem;
  color: #444;
  font-weight: 500;
}
.email {
  font-size: 0.82rem;
  color: #888;
  word-break: break-all;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
  margin: 0;
  padding: 0;
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
  border: none;
  background: transparent;
  font-family: inherit;
  margin: 0;
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
  padding: 24px 32px 32px;
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
  margin-bottom: 28px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #4b5563;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* ════════════════════════ TEACHERS SECTION ════════════════════════ */
.teachers-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px 28px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}

.section-sub {
  font-size: 0.88rem;
  color: #777;
  margin-top: 2px;
}

.add-teacher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.add-teacher-btn:hover {
  background-color: #6b7280;
}

/* ════════════════════════ STATUS TABS ════════════════════════ */
.status-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.status-tab {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: transparent;
  color: #666;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.status-tab:hover {
  border-color: #4b5563;
  color: #4b5563;
}

.status-tab.active {
  background-color: #4b5563;
  color: white;
  border-color: #4b5563;
}

/* ════════════════════════ TEACHERS GRID/CAROUSEL ════════════════════════ */
.teachers-carousel-wrap {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.carousel-arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.carousel-arrow:hover {
  background-color: #4b5563;
  color: white;
  border-color: #4b5563;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  flex: 1;
  min-height: 300px;
  width: 100%;
  min-width: 0;
  align-items: start;
}

/* ════════════════════════ TEACHER CARD ════════════════════════ */
.teacher-card {
  border-radius: 12px;
  padding: 24px 20px 20px;
  position: relative;
  overflow: hidden;
  border: 2px solid #e6e6e6;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 440px;
  box-sizing: border-box;
  min-width: 0;
}

.teacher-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-in-school {
  border: 2px solid #22c55e;
  background-color: #f0fdf4;
}

.card-on-leave {
  border: 2px solid #ef4444;
  background-color: #fef2f2;
}

.card-on-meeting {
  border: 2px solid #eab308;
  background-color: #fefce8;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-in-school {
  background-color: #16a34a;
  color: white;
}

.badge-on-leave {
  background-color: #dc2626;
  color: white;
}

.badge-on-meeting {
  background-color: #eab308;
  color: #422006;
}

.teacher-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.teacher-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}

.teacher-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 6px;
}

.teacher-college {
  font-size: 0.88rem;
  color: #777;
  text-align: center;
  margin-bottom: 16px;
  line-height: 1.4;
}

.teacher-email {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 16px;
}

.teacher-email svg {
  color: #999;
  flex-shrink: 0;
}

.teacher-status-wrap {
  margin-bottom: 16px;
}

.status-dropdown {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #333;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.status-dropdown:hover {
  border-color: #4b5563;
}

.status-dropdown:focus {
  outline: none;
  border-color: #4b5563;
  box-shadow: 0 0 0 2px rgba(48, 53, 58, 0.1);
}

.status-dropdown.status-in-school {
  border-color: #22c55e;
  background-color: #f0fdf4;
  color: #166534;
}

.status-dropdown.status-on-leave {
  border-color: #ef4444;
  background-color: #fef2f2;
  color: #991b1b;
}

.status-dropdown.status-on-meeting {
  border-color: #eab308;
  background-color: #fefce8;
  color: #854d0e;
}

.designated-areas {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.designated-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-tag {
  padding: 5px 10px;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.substitute-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #666;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.substitute-teacher-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.substitute-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.substitute-dropdown {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #333;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.substitute-dropdown:hover {
  border-color: #4b5563;
}

.substitute-dropdown:focus {
  outline: none;
  border-color: #4b5563;
  box-shadow: 0 0 0 2px rgba(48, 53, 58, 0.1);
}
.substitute-select-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.substitute-select-row .substitute-dropdown {
  flex: 1 1 210px;
}
.substitute-selected-name {
  flex: 1 1 100%;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 600;
}
.substitute-remove-btn {
  flex: 0 0 auto;
  border: 1px solid #f1aeb5;
  border-radius: 6px;
  background: #fff5f5;
  color: #b42318;
  padding: 7px 10px;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}
.substitute-remove-btn:hover {
  border-color: #dc3545;
  background: #ffe3e3;
}

.substitute-save-btn {
  margin-top: 10px;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background-color: #4b5563;
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s ease;
}

.substitute-save-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.substitute-schedule-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.substitute-schedule-item {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #333;
}

/* ════════════════════════ CAROUSEL INDICATORS ════════════════════════ */
.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e0e0e0;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator:hover {
  background-color: #4b5563;
}

.indicator.active {
  background-color: #4b5563;
}

/* ════════════════════════ MODAL ════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0;
  width: min(560px, 95vw);
  max-width: 95vw;
  max-height: min(720px, 92vh);
  overflow: visible;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
  position: relative;
}

.add-teacher-modal {
  display: flex;
  flex-direction: column;
  width: min(720px, 94vw);
  overflow: visible;
}

.add-teacher-modal .modal-header,
.add-teacher-modal .add-teacher-modal-body,
.add-teacher-modal .modal-actions {
  background: #ffffff;
}

.add-teacher-modal .modal-form,
.add-teacher-modal .modal-field,
.add-teacher-modal .modal-areas-group {
  min-width: 0;
}

.add-teacher-modal :is(input, select, textarea),
.add-teacher-modal .modal-dropdown-btn {
  background: #ffffff !important;
  box-shadow: none !important;
}

.logout-modal-box {
  width: 360px;
  max-width: 94vw;
  padding: 36px 40px 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.logout-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #ffeaea;
}

.logout-modal-title { margin: 0; font-size: 1.45rem; color: #111; }
.logout-modal-sub { margin: 8px 0 18px; color: #777; }
.logout-modal-actions { display: flex; justify-content: center; gap: 20px; }
.logout-cancel-btn, .logout-confirm-btn { border: none; border-radius: 10px; padding: 10px 22px; font: inherit; font-weight: 600; cursor: pointer; }
.logout-cancel-btn { background: #ffeaea; color: #e63946; }
.logout-confirm-btn { background: #4b5563; color: #fff; }
.logout-confirm-btn:hover { background: #6b7280; }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 0;
  padding: 22px 28px 18px;
  border-bottom: 1px solid #e5eaf0;
  background: #ffffff;
  text-align: left;
  border-radius: 10px 10px 0 0;
}

.modal-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.modal-title {
  font-size: clamp(1.35rem, 2.4vw, 1.65rem);
  font-weight: 700;
  color: #202a34;
  line-height: 1.12;
  letter-spacing: -0.035em;
  margin: 0 0 6px;
}

.modal-sub {
  max-width: 420px;
  font-size: 0.82rem;
  line-height: 1.48;
  color: #66727e;
  margin: 0;
}

.modal-close-btn {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  font-size: 1.55rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.modal-close-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #111827;
}

.add-teacher-modal-body {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  padding: 0;
  background: #ffffff;
}

.modal-avatar-section {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  margin-bottom: 0;
  min-height: 0;
  padding: 26px 24px;
  border: 0;
  border-right: 1px solid #e5eaf0;
  border-radius: 0;
  background: #f8fafc;
}

.modal-avatar-placeholder {
  position: relative;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  overflow: visible;
}

.modal-avatar-placeholder:hover {
  background: #f8fafc;
  border-color: #475569;
}

.modal-avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  overflow: hidden;
}

.modal-file-input {
  display: none;
}

.modal-avatar-checkmark {
  position: absolute;
  bottom: 4px;
  right: -2px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
}

.modal-avatar-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #64748b;
  text-align: center;
  padding: 0 4px;
}

.modal-avatar-copy strong {
  color: #334155;
  font-size: 0.8rem;
}

.modal-avatar-copy span {
  max-width: 170px;
  font-size: 0.68rem;
  line-height: 1.35;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-bottom: 0;
  padding: 26px 28px 28px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.modal-field > span,
.modal-areas-label {
  color: #475569;
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.modal-input,
.modal-select {
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #d4dce4;
  border-radius: 6px;
  background: #fff !important;
  color: #1f2937;
  font-size: 0.86rem;
  font-family: inherit;
  box-shadow: none !important;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.modal-input::placeholder {
  color: #9aa4af;
}

.modal-input:focus,
.modal-select:focus {
  outline: none;
  border-color: #64748b;
  background: #fff !important;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.14) !important;
}

.modal-email-input-wrap {
  display: flex;
  align-items: center;
  min-height: 42px;
  border: 1px solid #d4dce4;
  border-radius: 6px;
  background: #ffffff;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.modal-email-input-wrap:focus-within {
  border-color: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.14);
}

.modal-email-input {
  min-width: 0;
  flex: 1;
  border: 0 !important;
  border-radius: 0;
  box-shadow: none !important;
}

.modal-email-input:focus {
  box-shadow: none !important;
}

.modal-email-suffix {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-left: 1px solid #e5eaf0;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.modal-areas-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.modal-areas-select {
  padding: 12px 14px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background-color: #fff;
  cursor: pointer;
  min-height: 120px;
}

.modal-areas-select:focus {
  outline: none;
  border-color: #4b5563;
  box-shadow: 0 0 0 2px rgba(48, 53, 58, 0.1);
}

.modal-areas-select option {
  padding: 8px;
  background: #fff;
  color: #333;
}

.modal-areas-select option:checked {
  background: #4b5563;
  color: white;
}

.modal-areas-hint {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
  padding: 0;
}

/* Custom Dropdown */
.modal-custom-dropdown {
  position: relative;
  width: 100%;
  z-index: 20;
}

.modal-dropdown-btn {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #d4dce4;
  border-radius: 6px;
  background: #fff !important;
  font-size: 0.86rem;
  font-family: inherit;
  color: #1f2937;
  cursor: pointer;
  box-shadow: none !important;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.modal-dropdown-btn:hover {
  border-color: #94a3b8;
}

.modal-dropdown-btn:focus {
  outline: none;
  border-color: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.14) !important;
}

.modal-dropdown-placeholder {
  color: #9aa4af;
}

.modal-dropdown-selected {
  font-weight: 750;
  color: #334155;
}

.modal-dropdown-icon {
  transition: transform 0.2s;
  color: #666;
  flex-shrink: 0;
}

.modal-dropdown-icon.open {
  transform: rotate(180deg);
}

.modal-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d4dce4;
  border-radius: 6px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.10);
  z-index: 1200;
  max-height: 230px;
  overflow-y: auto;
  padding: 6px;
}

.modal-dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.modal-dropdown-option:hover {
  background: #f1f5f9;
}

.modal-dropdown-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4b5563;
  flex-shrink: 0;
}

.modal-dropdown-label {
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  flex: 1;
}

.modal-selected-areas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 27px;
}

.modal-selected-areas span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 5px 8px;
  border: 1px solid #dbe3ea;
  border-radius: 5px;
  background: #ffffff;
  color: #475569;
  font-size: 0.66rem;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 28px 20px;
  border-top: 1px solid #e5eaf0;
  background: #ffffff;
  border-radius: 0 0 10px 10px;
  position: relative;
  z-index: 1;
}

.modal-cancel-btn,
.modal-add-btn {
  min-height: 42px;
  padding: 9px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.84rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-cancel-btn {
  background: #ffffff;
  color: #dc2626;
  border: 1px solid #e5e7eb;
}

.modal-cancel-btn:hover {
  background: #f0f0f0;
  border-color: #d32f2f;
}

.modal-add-btn {
  min-width: 118px;
  justify-content: center;
  background: #334155;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-add-btn::before {
  content: '+ ';
}

.modal-add-btn:hover {
  background: #1f2937;
}

/* ════════════════════════ RESPONSIVE ════════════════════════ */
/* Teacher assignments readability refresh */
.layout { background: linear-gradient(135deg, #f2f4f5, #dfe3e6); }
.main { padding: 32px 38px 44px; }
.main-header { align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 25px; }
.page-eyebrow { display: block; margin-bottom: 5px; color: #68747d; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.page-title { margin: 0; color: #202830; font-size: clamp(2rem, 3vw, 2.55rem); font-weight: 700; letter-spacing: -.04em; }
.page-sub { max-width: 650px; margin-top: 8px; color: #66727c; font-size: .9rem; line-height: 1.5; }
.header-add-btn { min-height: 46px; padding: 0 18px; border: 1px solid #3e4d58; border-radius: 12px; background: linear-gradient(145deg, #5c6771, #343e47); box-shadow: 0 8px 20px rgba(45,55,63,.2); font-size: .78rem; }
.header-add-btn:hover { background: linear-gradient(145deg, #687580, #3d4852); transform: translateY(-1px); }
.teachers-section { padding: 17px 27px 24px; border: 1px solid rgba(255,255,255,.9); border-radius: 20px; background: rgba(255,255,255,.78); box-shadow: 0 14px 38px rgba(41,51,59,.1); }
.section-header { align-items: center; margin-bottom: 16px; padding-bottom: 15px; border-bottom: 1px solid #e1e6e9; }
.section-title { color: #252e35; font-size: 1.18rem; letter-spacing: -.02em; }
.section-sub { margin-top: 5px; color: #78838b; font-size: .75rem; }
.summary-counts { display: flex; align-items: stretch; gap: 8px; }
.summary-counts span { display: inline-flex; min-width: 78px; align-items: center; justify-content: center; gap: 7px; padding: 8px 11px; color: #66727b; border: 1px solid #dce2e5; border-radius: 11px; background: rgba(247,249,250,.9); font-size: .64rem; font-weight: 600; white-space: nowrap; }
.summary-counts b { color: #2c3740; font-size: .95rem; line-height: 1; }
.summary-counts small { font-size: .64rem; font-weight: 600; }
.summary-counts .summary-count--total { border-color: #cfd7dc; background: #f4f6f7; }
.summary-counts .available { color: #34704e; border-color: #b9d8c5; background: #eef8f2; }
.summary-counts .available b { color: #276743; }
.summary-counts .summary-count--leave { color: #95615d; border-color: #e2c9c7; background: #fbf2f1; }
.summary-counts .summary-count--leave b { color: #874b47; }
.status-tabs { gap: 7px; margin-bottom: 20px; }
.status-tab { display: inline-flex; min-height: 38px; padding: 7px 12px; align-items: center; gap: 7px; color: #59656e; border-color: #d8dee2; border-radius: 10px; background: #f7f8f9; font-size: .72rem; font-weight: 600; }
.status-tab span { display: grid; min-width: 20px; height: 20px; place-items: center; padding: 0 5px; color: #6c7780; border-radius: 99px; background: #e5e9ec; font-size: .61rem; }
.status-tab.active { color: #fff; border-color: #3f4d57; background: #3f4d57; box-shadow: 0 5px 12px rgba(45,56,64,.16); }
.status-tab.active span { color: #27333b; background: #fff; }
.teachers-carousel-wrap { position: relative; align-items: stretch; gap: 12px; }
.teachers-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; align-items: stretch; }
.teachers-empty-state { display: flex; min-height: 360px; grid-column: 1 / -1; align-items: center; justify-content: center; flex-direction: column; padding: 48px 24px; color: #4d5a62; text-align: center; }
.teachers-empty-icon { display: grid; width: 66px; height: 66px; margin-bottom: 17px; place-items: center; border: 1px solid #d9e0e4; border-radius: 18px; background: #f5f7f8; color: #69777f; }
.teachers-empty-icon svg { width: 31px; height: 31px; }
.teachers-empty-state h3 { margin: 0; color: #29333a; font-size: 1.05rem; font-weight: 700; }
.teachers-empty-state p { max-width: 430px; margin: 7px 0 18px; color: #738089; font-size: .78rem; line-height: 1.55; }
.teachers-empty-state button { min-height: 40px; padding: 9px 16px; border: 1px solid #cad3d8; border-radius: 9px; background: #fff; color: #43515a; font: inherit; font-size: .72rem; font-weight: 700; cursor: pointer; transition: background .18s ease, border-color .18s ease, transform .18s ease; }
.teachers-empty-state button:hover { border-color: #9eabb2; background: #f5f7f8; transform: translateY(-1px); }
.teachers-loading { display: contents; }
.teacher-skeleton {
  position: relative;
  display: flex;
  min-height: 360px;
  align-items: center;
  flex-direction: column;
  padding: 20px 19px;
  border: 1px solid #dce2e6;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}
.teacher-skeleton::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: #d8dee2;
}
.teacher-skeleton-badge,
.teacher-skeleton-avatar,
.teacher-skeleton-line,
.teacher-skeleton-field {
  background: linear-gradient(100deg, #edf1f3 25%, #f8fafb 45%, #edf1f3 65%);
  background-size: 220% 100%;
  animation: teacherSkeletonShimmer 1.35s ease-in-out infinite;
}
.teacher-skeleton-badge { width: 58px; height: 22px; align-self: flex-end; border-radius: 999px; }
.teacher-skeleton-avatar { width: 82px; height: 82px; margin: 10px 0 18px; border: 3px solid #fff; border-radius: 50%; }
.teacher-skeleton-line { height: 10px; border-radius: 6px; }
.teacher-skeleton-line--name { width: 66%; height: 14px; }
.teacher-skeleton-line--college { width: 78%; margin-top: 10px; }
.teacher-skeleton-line--email { width: 72%; margin-top: 24px; }
.teacher-skeleton-field { width: 100%; height: 38px; margin-top: 24px; border-radius: 9px; }
.teacher-skeleton-line--tag { width: 48%; align-self: flex-start; margin-top: 24px; }
@keyframes teacherSkeletonShimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.carousel-arrow { align-self: center; width: 38px; height: 38px; border-color: #d9dfe2; background: rgba(255,255,255,.9); box-shadow: 0 5px 14px rgba(42,52,59,.1); }
.teacher-card { min-height: 0; padding: 20px 19px; border: 1px solid #dce2e6 !important; border-radius: 16px; background: #fff !important; box-shadow: 0 7px 20px rgba(42,52,59,.07); }
.teacher-card:hover { transform: translateY(-2px); border-color: #b9c4ca !important; box-shadow: 0 12px 27px rgba(42,52,59,.11); }
.teacher-card::before { content: ''; position: absolute; inset: 0 0 auto; height: 3px; background: #8c979f; }
.teacher-card.card-in-school::before { background: #499067; }
.teacher-card.card-on-leave::before { background: #9b7272; }
.teacher-card.card-on-meeting::before { background: #a78c53; }
.status-badge { top: 14px; right: 14px; display: flex; align-items: center; gap: 5px; padding: 5px 8px; color: #53616a !important; border: 1px solid #d8dee2; border-radius: 999px; background: #f1f3f4 !important; font-size: .58rem; letter-spacing: .04em; }
.badge-in-school { color: #276842 !important; border-color: #bddbc8; background: #e8f5ed !important; }
.badge-on-leave { color: #7d4545 !important; border-color: #dec5c5; background: #f7eded !important; }
.badge-on-meeting { color: #765f2e !important; border-color: #e1d5b8; background: #f8f3e7 !important; }
.teacher-avatar-wrap { margin: 10px 0 14px; }
.teacher-avatar { width: 82px; height: 82px; border: 3px solid #fff; box-shadow: 0 0 0 1px #d7dde1, 0 6px 15px rgba(35,44,51,.13); }
.teacher-name { margin-bottom: 4px; color: #222a31; font-size: 1rem; }
.teacher-college { min-height: 36px; margin-bottom: 10px; color: #77828a; font-size: .73rem; }
.teacher-email { justify-content: center; min-width: 0; margin-bottom: 15px; color: #64717a; font-size: .7rem; }
.teacher-email span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.teacher-status-wrap { display: flex; flex-direction: column; gap: 6px; margin-bottom: 13px; }
.teacher-status-wrap > label { color: #707b83; font-size: .62rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.status-dropdown { min-height: 40px; padding: 8px 11px; border-color: #d6dde1 !important; border-radius: 9px; background: #f8fafb !important; color: #34414a !important; font-size: .72rem; }
.designated-areas { margin-top: auto; padding-top: 13px; border-color: #e5e9eb; }
.designated-label,.substitute-label { color: #727d85; font-size: .62rem; letter-spacing: .06em; }
.area-tag { padding: 6px 9px; color: #50606b; border: 1px solid #dfe5e8; border-radius: 8px; background: #f4f7f8; font-size: .67rem; }
.leave-coverage-block { margin: 3px 0 13px; }
.leave-coverage-notice { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 1px solid #e0d4d1; border-radius: 11px; background: #faf6f4; color: #4a3d3a; text-align: left; }
.leave-coverage-notice > span:nth-child(2) { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.leave-coverage-notice strong { font-size: .72rem; font-weight: 700; }
.leave-coverage-notice small { color: #7f706b; font-size: .64rem; line-height: 1.35; }
.leave-coverage-icon { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 9px; background: #eee2de; color: #75564d; }
.leave-coverage-icon svg { width: 17px; height: 17px; }
.manage-coverage-btn { display: flex; min-height: 32px; align-items: center; justify-content: center; gap: 4px; padding: 6px 9px; flex: 0 0 auto; border: 1px solid #cdbdb7; border-radius: 8px; background: #fff; color: #624b44; font: inherit; font-size: .63rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 5px rgba(70,50,43,.06); transition: border-color .18s ease, background .18s ease, transform .18s ease; }
.manage-coverage-btn svg { width: 15px; height: 15px; }
.manage-coverage-btn:hover { border-color: #aeb9bf; background: #f6f8f9; transform: translateY(-1px); }
.coverage-modal-overlay { padding: 24px; background: rgba(20, 28, 33, .58); backdrop-filter: blur(5px); }
.coverage-modal { display: flex; width: min(760px, 96vw); max-height: min(760px, 90vh); flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,.72); border-radius: 20px; background: #f7f9fa; box-shadow: 0 28px 80px rgba(15, 23, 29, .3); text-align: left; }
.coverage-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 24px 26px 20px; border-bottom: 1px solid #e1e6e9; background: #fff; }
.coverage-modal-heading { display: flex; align-items: center; gap: 14px; }
.coverage-modal-icon { display: grid; width: 46px; height: 46px; flex: 0 0 46px; place-items: center; border-radius: 13px; background: #eee5e1; color: #71584f; }
.coverage-modal-icon svg { width: 22px; height: 22px; }
.coverage-modal-eyebrow { display: block; margin-bottom: 4px; color: #70574f; font-size: .72rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.coverage-modal-heading h2 { margin: 0; color: #20282e; font-size: 1.38rem; font-weight: 700; line-height: 1.25; }
.coverage-modal-heading p { margin: 5px 0 0; color: #64717a; font-size: .84rem; line-height: 1.45; }
.coverage-modal-close { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 0; border-radius: 9px; background: #f1f3f4; color: #5b6870; font-size: 1.45rem; line-height: 1; cursor: pointer; }
.coverage-modal-close:hover { background: #e6eaec; }
.coverage-modal-progress { display: flex; align-items: center; gap: 15px; padding: 13px 26px; border-bottom: 1px solid #e2e7e9; background: #f7f9fa; }
.coverage-modal-progress > span { flex: 0 0 auto; color: #49575f; font-size: .76rem; font-weight: 700; }
.coverage-progress-track { height: 6px; flex: 1; overflow: hidden; border-radius: 999px; background: #e1e5e7; }
.coverage-progress-track span { display: block; height: 100%; border-radius: inherit; background: #527663; transition: width .25s ease; }
.coverage-modal-list { display: grid; gap: 10px; padding: 18px 26px; overflow-y: auto; }
.coverage-modal-row { display: grid; grid-template-columns: minmax(180px, .8fr) minmax(280px, 1.2fr); align-items: center; gap: 22px; padding: 15px 16px; border: 1px solid #dfe5e8; border-radius: 12px; background: #fff; }
.coverage-class-details { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.coverage-class-details strong { overflow: hidden; color: #252e34; font-size: .9rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.coverage-class-details span { color: #596770; font-size: .76rem; font-weight: 500; }
.coverage-class-details small { color: #76828a; font-size: .69rem; }
.coverage-assignment-field label { display: block; margin-bottom: 7px; color: #56636b; font-size: .68rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.coverage-modal .substitute-dropdown { min-height: 44px; padding: 9px 38px 9px 12px; color: #2f3a41; border-color: #cbd3d8; background-color: #fff; font-size: .78rem; font-weight: 500; }
.coverage-modal .substitute-dropdown.is-placeholder { color: #7c878e; }
.coverage-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 26px; border-top: 1px solid #dfe5e8; background: #fff; }
.coverage-modal-footer > span { color: #66737b; font-size: .7rem; }
.coverage-modal-footer > div { display: flex; gap: 11px; }
.coverage-cancel-btn { min-width: 105px; min-height: 46px; padding: 11px 20px; border: 1px solid #cbd4d9; border-radius: 10px; background: #fff; color: #3f4d55; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; }
.coverage-cancel-btn:hover { background: #f2f5f6; }
.coverage-modal .substitute-save-btn { min-width: 175px; min-height: 46px; padding: 11px 21px; border-radius: 10px; font-size: .78rem; }
.substitute-teacher-wrap { display: block; margin: 7px 0 0; padding: 0; overflow: hidden; border: 1px solid #e1e6e9; border-radius: 11px; background: #f8fafb; }
.coverage-summary { display: flex; min-height: 40px; align-items: center; justify-content: space-between; padding: 0 12px; color: #46545d; font-size: .68rem; font-weight: 700; cursor: pointer; list-style: none; }
.coverage-summary::-webkit-details-marker { display: none; }
.coverage-summary:hover { background: #f1f4f5; }
.coverage-chevron { width: 16px; height: 16px; transition: transform .2s ease; }
.substitute-teacher-wrap[open] .coverage-chevron { transform: rotate(180deg); }
.coverage-body { max-height: 350px; padding: 0 10px 10px; overflow-y: auto; border-top: 1px solid #e3e7e9; }
.substitute-info { display: block; margin-top: 2px; padding-top: 0; border: 0; }
.substitute-class-label { display: block; padding: 10px 2px 7px; color: #76828a; font-size: .62rem; font-weight: 600; }
.substitute-schedule-list { gap: 7px; }
.substitute-schedule-item { padding: 10px; border: 1px solid #e1e6e9; border-radius: 9px; background: #fff; }
.substitute-entry-header { gap: 9px; }
.substitute-entry-header strong { color: #2f3940; font-size: .7rem; }
.substitute-entry-meta { margin-top: 2px; color: #7a858d; font-size: .61rem; }
.substitute-entry-label { color: #737f87; font-size: .59rem; letter-spacing: .04em; text-transform: uppercase; }
.substitute-dropdown { min-height: 38px; border-radius: 8px; font-size: .7rem; }
.substitute-remove-btn { min-height: 42px; padding: 9px 13px; border-color: #d2dade; border-radius: 8px; background: #fff; color: #59676f; font-size: .71rem; font-weight: 700; }
.substitute-remove-btn:hover { border-color: #adb7bd; background: #f2f5f6; color: #39464e; }
.coverage-actions { position: sticky; bottom: -10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 9px; padding: 10px 2px 1px; border-top: 1px solid #e3e7e9; background: #f8fafb; }
.coverage-actions > span { color: #818b92; font-size: .58rem; line-height: 1.3; text-align: left; }
.substitute-save-btn { width: auto; min-height: 36px; margin: 0; padding: 8px 12px; flex: 0 0 auto; border-radius: 8px; background: #465762; font-size: .66rem; }
@media (max-width: 650px) {
  .coverage-modal-overlay { padding: 10px; }
  .coverage-modal { width: 100%; max-height: 94vh; border-radius: 16px; }
  .coverage-modal-header,.coverage-modal-progress,.coverage-modal-list,.coverage-modal-footer { padding-left: 16px; padding-right: 16px; }
  .coverage-modal-row { grid-template-columns: 1fr; gap: 13px; }
  .coverage-modal-footer { align-items: stretch; flex-direction: column; }
  .coverage-modal-footer > div { justify-content: flex-end; }
  .coverage-cancel-btn,.coverage-modal .substitute-save-btn { flex: 1; min-width: 0; }
}
.carousel-indicators { margin-top: 16px; }
.indicator { width: 7px; height: 7px; background: #cbd2d6; }
.indicator.active { width: 22px; border-radius: 99px; background: #4b5a64; }

/* Large Desktop (1200px+) - 3 columns */
@media (min-width: 1200px) {
  .teachers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop (900px - 1200px) - 2-3 columns */
@media (max-width: 1199px) and (min-width: 901px) {
  .teachers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet (600px - 900px) - 2 columns */
@media (max-width: 900px) and (min-width: 601px) {
  .teachers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .main { padding: 28px 24px 32px; }
  .section-header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .add-teacher-btn { width: 100%; justify-content: center; }
  .status-tabs { flex-wrap: wrap; }
  .teacher-card { min-height: 520px; }
  .carousel-arrow { display: none; }
}

/* Mobile (<600px) - 1 column */
@media (max-width: 600px) {
  .layout { flex-direction: column; }
  .main { padding: 16px 20px 32px; height: auto; }
  .sidebar { width: 100%; min-width: 100%; height: auto; padding: 20px 16px; display: none; }
  .page-title { font-size: 1.5rem; }
  .page-sub { font-size: 0.85rem; }
  .section-header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .section-title { font-size: 0.95rem; }
  .section-sub { font-size: 0.75rem; }
  .teachers-section { padding: 16px 20px 16px; border-radius: 12px; }
  .status-tabs { flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .status-tab { padding: 6px 12px; font-size: 0.8rem; }
  .add-teacher-btn { width: 100%; padding: 8px 16px; font-size: 0.85rem; justify-content: center; }
  .teachers-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .teacher-card { padding: 20px 18px 18px; min-height: 450px; }
  .teacher-avatar { width: 90px; height: 90px; }
  .carousel-arrow { display: none; }
  .carousel-indicators { gap: 4px; }
  .carousel-dot { width: 6px; height: 6px; }
  .modal-box {
    width: 95vw;
    max-height: 90vh;
  }
  .add-teacher-modal-body {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
  }
  .modal-header {
    padding: 20px;
  }
  .modal-avatar-section {
    flex-direction: column;
    justify-content: center;
    min-height: 0;
    padding: 16px 20px;
    border-right: 0;
    border-bottom: 1px solid #e5eaf0;
  }
  .modal-form {
    padding: 18px 20px;
  }
  .modal-actions {
    padding: 16px 20px 20px;
  }
  .modal-form-group { margin-bottom: 12px; }
  .modal-form-label { font-size: 0.85rem; }
  .modal-form-input { font-size: 0.9rem; padding: 8px; }
}

/* Small Mobile (<480px) - Extra small adjustments */
@media (max-width: 479px) {
  .main { padding: 12px 16px 24px; }
  .teachers-section { padding: 12px 16px 12px; }
  .page-title { font-size: 1.25rem; }
  .modal-box { width: 98vw; }
}
</style>
