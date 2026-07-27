<template>
  <div class="layout">
    <aside class="sidebar admin-sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
      </div>

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
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg></span>
          <span>Settings</span>
        </RouterLink>
      </nav>
      <RoleSwitchButton />
      <button class="logout-btn" @click="showLogoutModal = true">Logout</button>
    </aside>

    <main class="main">
      <header class="main-header">
        <div>
          <h1 class="page-title">Academic Terms</h1>
          <p class="page-sub">Create semesters, define section counts and rooms, and publish the term that other users should use.</p>
        </div>
        <button class="new-sched-btn" @click="resetForm(); showCreateForm = true">New Term</button>
      </header>

      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Current Published Term</h2>
            <p class="card-sub">The active term is used by the scheduling workflow and other screens.</p>
          </div>
        </div>
        <div v-if="publishedTerm" class="published-term">
          <div>
            <div class="pill">{{ publishedTerm.schoolYear }} · {{ publishedTerm.semester }}</div>
            <div class="published-meta">Published {{ formatDate(publishedTerm.publishedAt) }}</div>
          </div>
          <div class="published-details">
            <div><strong>Sections</strong><br>{{ describeSectionCounts(publishedTerm.sectionCounts, publishedTerm.sectionNames) }}</div>
            <div><strong>Rooms</strong><br>{{ publishedTerm.rooms?.length || 0 }} room(s)</div>
          </div>
        </div>
        <div v-else class="empty-state">No term is published yet.</div>
      </section>

      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Term Setup</h2>
            <p class="card-sub">Create a term and choose which year levels and rooms are available for that semester.</p>
          </div>
        </div>

        <div v-if="showCreateForm" class="term-form">
          <div class="form-row">
            <label class="form-label">School Year</label>
            <input v-model="form.schoolYear" class="form-input" placeholder="SY26-27" />
          </div>
          <div class="form-row">
            <label class="form-label">Semester</label>
            <select v-model="form.semester" class="form-select">
              <option value="">Select semester</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
            </select>
          </div>

                  <div class="form-row">
            <label class="form-label">Sections per Year</label>
            <div class="count-grid">
              <label v-for="year in yearOptions" :key="year" class="count-card">
                <span>{{ year }}</span>
                <input v-model.number="form.sectionCounts[year]" type="number" min="0" max="10" />
              </label>
            </div>
          </div>

          <div class="form-row section-name-row">
            <label class="form-label">Section Names</label>
            <div class="section-name-grid">
              <div v-for="year in yearOptions" :key="year" class="section-name-block">
                <div class="section-name-heading">{{ year }}</div>
                <div v-if="(form.sectionCounts[year] || 0) > 0" class="section-name-fields">
                  <label v-for="(name, index) in form.sectionNames[year]" :key="`${year}-${index}`" class="section-name-field">
                    <span>Section {{ index + 1 }}</span>
                    <input v-model="form.sectionNames[year][index]" class="form-input" type="text" />
                  </label>
                </div>
                <div v-else class="section-name-empty">Set the section count above to edit names.</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">Available Rooms</label>
            <div class="room-grid">
              <div v-for="floor in roomFloors" :key="floor.label" class="floor-group">
                <div class="floor-header">
                  <div class="floor-label">{{ floor.label }}</div>
                  <div class="floor-room-count">{{ floor.rooms.length }} rooms</div>
                </div>
                <div class="floor-room-grid">
                  <label v-for="roomName in floor.rooms" :key="roomName" class="room-card" :class="{ 'room-card-comlab': roomTypeMap[roomName] === 'Comlab' }">
                    <div class="room-card-top">
                      <input type="checkbox" :value="roomName" v-model="selectedRoomNames" />
                      <span class="room-name">{{ roomName }}</span>
                    </div>
                    <div class="room-card-bottom">
                      <span class="room-type-label">{{ roomTypeMap[roomName] === 'Comlab' ? 'Comlab' : 'Lecture' }}</span>
                      <label class="comlab-toggle">
                        <input
                          type="checkbox"
                          :checked="roomTypeMap[roomName] === 'Comlab'"
                          :disabled="!selectedRoomNames.includes(roomName)"
                          @change="(event) => { roomTypeMap[roomName] = event.target.checked ? 'Comlab' : 'Lecture' }"
                        />
                        <span>Comlab</span>
                      </label>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="showCreateForm = false">Cancel</button>
            <button class="save-btn" @click="submitTerm">Save Term</button>
          </div>
        </div>

        <div v-else class="terms-list">
          <div v-for="term in terms" :key="term._id" class="term-item">
            <div class="term-main">
              <div class="term-title-row">
                <h3>{{ term.schoolYear }} · {{ term.semester }}</h3>
                <span v-if="term.isPublished" class="pill active">Published</span>
              </div>
              <p class="term-sub">Sections: {{ describeSectionCounts(term.sectionCounts, term.sectionNames) }}</p>
              <p class="term-sub">Rooms: {{ term.rooms?.map(getRoomLabel).join(', ') || 'None' }}</p>
            </div>
            <div class="term-actions">
              <button class="secondary-btn" @click="editTerm(term)">Edit</button>
              <button class="save-btn" @click="publishTerm(term._id)">Publish</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import RoleSwitchButton from '@/components/RoleSwitchButton.vue'
import Swal from 'sweetalert2'
import { roomOptions } from '@/composables/useSchedule.js'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const roomFloors = [
  { label: '2nd Floor', rooms: ['201', '202', '204', '205', '208', '209'] },
  { label: '3rd Floor', rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309'] },
  { label: '4th Floor', rooms: ['401', '402', '403', '404', '405', '406 (Comlab 1)', '407 (Comlab 2)', '408 (Comlab 3)', '409 (Comlab 4)'] },
]

const allRoomChoices = roomFloors.flatMap((floor) =>
  floor.rooms.map((roomName) => ({
    name: roomName,
    floor: floor.label,
    type: getRoomTypeFromName(roomName),
  }))
)

const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { name: 'View Schedules', to: '/admin/schedule/view', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { name: 'Add Schedule', to: '/admin/schedule/add', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>` },
  { name: 'Academic Terms', to: '/admin/academic-terms', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>` },
  { name: 'Teachers', to: '/admin/teachers', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events', to: '/admin/events', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Users', to: '/admin/users', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { name: 'Settings', to: '/admin/settings', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) { logout(); router.push('/'); throw new Error('Session expired. Please log in again.') }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options,
  })
  let body = {}
  try { body = await response.json() } catch (_) { body = {} }
  if (!response.ok) {
    throw new Error(body.message || 'Request failed.')
  }
  return body
}

const terms = ref([])
const publishedTerm = ref(null)
const showCreateForm = ref(false)
const showLogoutModal = ref(false)
const selectedTermId = ref('')
const selectedRoomNames = ref([])
const roomTypeMap = reactive({})
const form = reactive({ schoolYear: '', semester: '', sectionCounts: {}, sectionNames: {}, rooms: [] })

watch(selectedRoomNames, (roomNames, oldRoomNames = []) => {
  roomNames.forEach((roomName) => {
    if (!Object.prototype.hasOwnProperty.call(roomTypeMap, roomName)) {
      roomTypeMap[roomName] = getRoomTypeFromName(roomName)
    }
  })

  oldRoomNames
    .filter((roomName) => !roomNames.includes(roomName))
    .forEach((roomName) => {
      if (Object.prototype.hasOwnProperty.call(roomTypeMap, roomName)) {
        delete roomTypeMap[roomName]
      }
    })
})

function resetForm() {
  selectedTermId.value = ''
  form.schoolYear = ''
  form.semester = ''
  form.sectionCounts = {}
  form.sectionNames = {}
  form.rooms = []
  selectedRoomNames.value = []
  Object.keys(roomTypeMap).forEach((key) => { delete roomTypeMap[key] })
  ensureSectionNames()
}

watch(
  () => ({ ...form.sectionCounts }),
  () => {
    ensureSectionNames()
  },
  { deep: true }
)

function getRoomTypeFromName(name) {
  if (!name) return 'Lecture'
  return /comlab/i.test(name) ? 'Comlab' : 'Lecture'
}

function getRoomLabel(room) {
  if (!room) return ''
  if (typeof room === 'string') return room
  return `${room.name}${room.type === 'Comlab' ? ' (Comlab)' : ''}`
}

function describeSectionCounts(sectionCounts = {}, sectionNames = {}) {
  return yearOptions
    .map((year) => {
      const count = sectionCounts[year] || 0
      const names = Array.isArray(sectionNames[year]) ? sectionNames[year] : []
      return names.length
        ? `${year}: ${count} section${count === 1 ? '' : 's'} (${names.join(', ')})`
        : `${year}: ${count} section${count === 1 ? '' : 's'}`
    })
    .join(', ')
}

function ensureSectionNames() {
  yearOptions.forEach((year) => {
    const count = Math.max(0, Number(form.sectionCounts[year]) || 0)
    const existing = Array.isArray(form.sectionNames[year]) ? [...form.sectionNames[year]] : []
    const next = []
    for (let i = 0; i < count; i += 1) {
      next[i] = existing[i] || `South ${i + 1}`
    }
    form.sectionNames[year] = next
  })
}

function formatDate(value) {
  if (!value) return 'Not published'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function populateForm(term) {
  selectedTermId.value = term._id || ''
  form.schoolYear = term.schoolYear || ''
  form.semester = term.semester || ''
  form.sectionCounts = { ...(term.sectionCounts || {}) }
  form.sectionNames = { ...(term.sectionNames || {}) }
  form.rooms = Array.isArray(term.rooms) ? [...term.rooms] : []
  selectedRoomNames.value = []
  Object.keys(roomTypeMap).forEach((key) => { delete roomTypeMap[key] })

  if (Array.isArray(term.rooms)) {
    term.rooms.forEach((room) => {
      const roomName = typeof room === 'string' ? room : room.name
      if (!roomName) return
      selectedRoomNames.value.push(roomName)
      roomTypeMap[roomName] = typeof room === 'object' && room.type ? room.type : getRoomTypeFromName(roomName)
    })
  }

  ensureSectionNames()
  showCreateForm.value = true
}

function editTerm(term) {
  populateForm(term)
}

async function loadTerms() {
  const [termsResponse, publishedResponse] = await Promise.all([
    apiRequest('/academic-terms'),
    apiRequest('/academic-terms/published'),
  ])
  terms.value = termsResponse.terms || []
  publishedTerm.value = publishedResponse.term || null
}

async function submitTerm() {
  if (!form.schoolYear || !form.semester) {
    await Swal.fire({ icon: 'warning', title: 'Missing details', text: 'Please provide a school year and semester.' })
    return
  }

  ensureSectionNames()

  const payload = {
    schoolYear: form.schoolYear,
    semester: form.semester,
    sectionCounts: form.sectionCounts,
    sectionNames: form.sectionNames,
    rooms: selectedRoomNames.value.map((roomName) => ({
      name: roomName,
      type: roomTypeMap[roomName] || getRoomTypeFromName(roomName),
    })),
    createdBy: user.name || user.email || 'Admin',
  }

  try {
    if (selectedTermId.value) {
      await apiRequest(`/academic-terms/${selectedTermId.value}`, { method: 'PATCH', body: JSON.stringify(payload) })
    } else {
      await apiRequest('/academic-terms', { method: 'POST', body: JSON.stringify(payload) })
    }
    showCreateForm.value = false
    resetForm()
    await loadTerms()
    await Swal.fire({ icon: 'success', title: 'Term saved', text: 'The semester setup was saved successfully.' })
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Unable to save term', text: error.message })
  }
}

async function publishTerm(termId) {
  try {
    await apiRequest(`/academic-terms/${termId}/publish`, { method: 'POST' })
    await loadTerms()
    await Swal.fire({ icon: 'success', title: 'Term published', text: 'This term is now available to the scheduling workflow.' })
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Unable to publish term', text: error.message })
  }
}

function confirmLogout() {
  showLogoutModal.value = false
  logout(); router.push('/')
}

onMounted(async () => {
  try {
    await loadTerms()
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Unable to load terms', text: error.message })
  }
})
</script>

<style scoped>
.layout { display: flex; height: 100vh; overflow: hidden; background: #f5f6f8; font-family: 'Poppins', sans-serif; }
.sidebar { width: 280px; min-width: 280px; background: #fff; border-right: 1px solid #ececec; display: flex; flex-direction: column; align-items: center; padding: 28px 18px 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.sidebar-profile { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 28px; text-align: center; }
.avatar-wrap { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; margin-bottom: 10px; border: 3px solid #c4c9cd; }
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
.role { font-size: 0.88rem; color: #444; font-weight: 500; }
.email { font-size: 0.82rem; color: #888; word-break: break-all; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 400; color: #444; text-decoration: none; cursor: pointer; transition: background 0.18s, color 0.18s; }
.nav-item:hover { background: #f8fafc; color: #4b5563; }
.nav-item.active { background: #4b5563; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }
.logout-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 12px; background: #e63946; color: #fff; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: background 0.2s; margin-top: 16px; }
.logout-btn:hover { background: #c1121f; }
.main { flex: 1; padding: 40px 44px 32px; overflow-y: auto; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
.main-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.page-title { font-size: 2rem; font-weight: 600; color: #4b5563; letter-spacing: -0.5px; line-height: 1.2; margin: 0; }
.page-sub { font-size: 0.95rem; color: #777; margin-top: 4px; }
.card { background: #fff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.card-title { margin: 0; font-size: 1.05rem; color: #1f2937; }
.card-sub { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }
.published-term { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 16px 18px; border-radius: 12px; background: #f8fafc; }
.published-meta { margin-top: 6px; color: #6b7280; font-size: 0.86rem; }
.published-details { display: flex; gap: 20px; color: #374151; font-size: 0.92rem; }
.pill { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 0.8rem; font-weight: 600; }
.pill.active { background: #dcfce7; color: #15803d; }
.empty-state { padding: 12px 0; color: #6b7280; }
.term-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 0.9rem; font-weight: 600; color: #374151; }
.form-input, .form-select { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; font: inherit; }
.room-textarea { min-height: 120px; resize: vertical; }
.count-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.count-card { display: flex; flex-direction: column; gap: 6px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fafafa; color: #374151; font-size: 0.9rem; }
.count-card input { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; }
.room-grid { display: flex; flex-direction: column; gap: 18px; }
.floor-group { border: 1px solid #e5e7eb; border-radius: 18px; padding: 18px 18px 14px; background: #ffffff; }
.floor-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.floor-label { font-size: 1rem; font-weight: 700; color: #0f172a; }
.floor-room-count { font-size: 0.9rem; color: #475569; }
.floor-room-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.room-card { display: flex; flex-direction: column; gap: 10px; min-width: 158px; flex: 0 1 175px; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px 12px; background: #f8fafc; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05); }
.room-card-comlab { border-color: #c7d5f5; background: #eff6ff; }
.room-card-top { display: flex; align-items: center; gap: 10px; }
.room-card-top input { width: 18px; height: 18px; accent-color: #4b5563; }
.room-name { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
.room-card-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.room-type-label { font-size: 0.88rem; color: #475569; background: #f1f5f9; border-radius: 999px; padding: 6px 10px; }
.comlab-toggle { display: flex; align-items: center; gap: 8px; }
.comlab-toggle input { width: 16px; height: 16px; accent-color: #4b5563; }
.form-actions, .term-actions { display: flex; gap: 10px; justify-content: flex-end; }
.cancel-btn, .secondary-btn, .save-btn { border: none; border-radius: 10px; padding: 10px 14px; font: inherit; cursor: pointer; }
.cancel-btn, .secondary-btn { background: #e5e7eb; color: #374151; }
.save-btn { background: #4b5563; color: #fff; }
.terms-list { display: flex; flex-direction: column; gap: 12px; }
.term-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fcfcfd; }
.term-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.term-title-row h3 { margin: 0; font-size: 1rem; color: #111827; }
.term-sub { margin: 2px 0; color: #6b7280; font-size: 0.9rem; }
.new-sched-btn { background: #4b5563; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font: inherit; cursor: pointer; }
.logout-modal-box { background: #fff; border-radius: 16px; padding: 24px; width: 92%; max-width: 360px; margin: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.16); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 2000; }
.logout-modal-title { margin: 0 0 8px; font-size: 1.1rem; color: #111827; }
.logout-modal-sub { margin: 0 0 16px; color: #6b7280; }
.logout-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.logout-cancel-btn { background: #e5e7eb; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.logout-confirm-btn { background: #e63946; color: #fff; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
@media (max-width: 900px) { .layout { flex-direction: column; height: auto; } .sidebar { width: 100%; min-width: 0; height: auto; } .main { padding: 24px; } .published-term, .term-item { flex-direction: column; align-items: flex-start; } }
</style>
