<template>
  <div class="layout">
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" class="avatar" alt="Admin" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" :class="{ active: route.path === item.to }">
          <span class="nav-icon" v-html="item.icon"></span><span>{{ item.name }}</span>
        </RouterLink>
        <RouterLink to="/admin/academic-terms" class="nav-item unified-academic-link" :class="{ active: route.path === '/admin/academic-terms' && !route.query.term }">
          <span class="nav-icon" v-html="academicIcon"></span><span>Academic Terms</span>
        </RouterLink>
        <RouterLink
          v-if="publishedTerm"
          :to="{ path: '/admin/academic-terms', query: { term: termId(publishedTerm), action: 'view' } }"
          class="nav-item current-term-link"
          :class="{ active: String(route.query.term || '') === termId(publishedTerm) }"
        >
          <span class="nav-icon" v-html="calendarIcon"></span><span>Current Term Schedule</span>
        </RouterLink>
      </nav>
      <RoleSwitchButton />
      <button class="logout-btn" @click="logoutAndLeave">Logout</button>
    </aside>

    <main class="main">
      <header class="page-header">
        <div>
          <h1>Academic Terms</h1>
          <p>Choose a term to view, add, edit, or publish its schedules.</p>
        </div>
        <button class="primary-btn" @click="openTermModal()">New Term</button>
      </header>

      <section v-if="workspaceTerm" class="workspace-card">
        <div class="workspace-heading">
          <button class="back-btn" @click="closeWorkspace">&larr; All terms</button>
          <div>
            <h2>{{ termLabel(workspaceTerm) }}</h2>
            <p>{{ workspaceAction === 'add' ? 'Choose where you want to add schedules.' : 'Choose how you want to browse schedules.' }}</p>
          </div>
          <span :class="['action-chip', workspaceAction]">{{ workspaceAction === 'add' ? 'Add Schedule' : 'View Schedules' }}</span>
        </div>

        <div v-if="!workspaceMode" class="mode-grid">
          <button class="mode-card" @click="chooseWorkspaceMode('room')">
            <span class="mode-icon" v-html="roomIcon"></span>
            <strong>By Room</strong>
            <small>{{ workspaceAction === 'add' ? 'Choose a room to manage its schedule' : 'Preview schedules assigned to each room' }}</small>
          </button>
          <button class="mode-card" @click="chooseWorkspaceMode('teacher')">
            <span class="mode-icon" v-html="teacherIcon"></span>
            <strong>By Teacher</strong>
            <small>{{ workspaceAction === 'add' ? 'Choose a teacher to manage their schedule' : 'Preview every teacher schedule' }}</small>
          </button>
        </div>

        <template v-else>
          <div class="preview-toolbar">
            <button class="back-btn" @click="workspaceMode = ''; previewPage = 1">&larr; Choose another mode</button>
            <label class="preview-search">
              <span>Search {{ workspaceMode === 'room' ? 'room' : 'teacher' }}</span>
              <input v-model.trim="previewSearch" type="search" :placeholder="workspaceMode === 'room' ? 'Search rooms...' : 'Search teachers...'" />
            </label>
          </div>
          <div v-if="workspaceLoading" class="empty-state">Loading schedule previews...</div>
          <div v-else-if="!pagedPreviewTargets.length" class="empty-state">No matching {{ workspaceMode === 'room' ? 'rooms' : 'teachers' }} found.</div>
          <div v-else class="preview-grid">
            <button v-for="target in pagedPreviewTargets" :key="target.key" class="preview-card" @click="openSchedule(target)">
              <div class="preview-card-head">
                <span class="preview-avatar">{{ target.initials }}</span>
                <div><strong>{{ target.label }}</strong><small>{{ target.entries.length }} scheduled class{{ target.entries.length === 1 ? '' : 'es' }}</small></div>
                <span class="open-arrow">&rarr;</span>
              </div>
              <div class="mini-schedule">
                <div v-for="day in weekdays" :key="day" class="mini-day">
                  <b>{{ day.slice(0, 3) }}</b>
                  <span v-for="entry in target.entries.filter(item => item.day === day).slice(0, 2)" :key="entry.id || `${entry.timeIn}-${entry.subject}`">
                    {{ entry.timeIn }} {{ entry.subject }}
                  </span>
                  <em v-if="!target.entries.some(item => item.day === day)">—</em>
                </div>
              </div>
              <span class="preview-action">{{ workspaceAction === 'add' ? 'Open schedule editor' : 'Open full schedule' }}</span>
            </button>
          </div>
          <footer v-if="previewTotalPages > 1" class="preview-pagination">
            <button :disabled="previewPage <= 1" @click="previewPage--">&lt;</button>
            <span>Page {{ previewPage }} of {{ previewTotalPages }}</span>
            <button :disabled="previewPage >= previewTotalPages" @click="previewPage++">&gt;</button>
          </footer>
        </template>
      </section>

      <section v-else class="terms-card">
        <div class="section-heading">
          <div><h2>Terms</h2><p>Each term keeps its own schedules, rooms, sections, and consultation hours.</p></div>
          <div class="term-filter">
            <button :class="{ active: termFilter === 'all' }" @click="termFilter = 'all'">All</button>
            <button :class="{ active: termFilter === 'current' }" @click="termFilter = 'current'">Current</button>
            <button :class="{ active: termFilter === 'archived' }" @click="termFilter = 'archived'">Other</button>
          </div>
        </div>
        <div v-if="loading" class="empty-state">Loading academic terms...</div>
        <div v-else-if="!filteredTerms.length" class="empty-state">No academic terms found.</div>
        <div v-else class="term-list">
          <article v-for="term in filteredTerms" :key="termId(term)" class="term-row">
            <div class="term-summary">
              <div class="term-title">
                <h3>{{ termLabel(term) }}</h3>
                <span v-if="term.isPublished" class="pill published">Published</span>
              </div>
              <p>{{ sectionSummary(term) }}</p>
              <small>{{ roomCount(term) }} rooms available · Room type is selected per schedule.</small>
            </div>
            <div class="term-actions">
              <button @click="openWorkspace(term, 'view')">View Schedule</button>
              <button @click="openWorkspace(term, 'add')">Add Schedule</button>
              <button @click="openTermModal(term)">Edit Term</button>
              <button class="publish-btn" :disabled="term.isPublished" @click="publishTerm(term)">{{ term.isPublished ? 'Published Term' : 'Publish Term' }}</button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div v-if="showTermModal" class="modal-overlay" @click.self="closeTermModal">
        <div class="term-modal">
          <header><div><h2>{{ editingTermId ? 'Edit Term Setup' : 'New Academic Term' }}</h2><p>Configure sections and rooms for this term.</p></div><button class="modal-close" @click="closeTermModal">&times;</button></header>
          <div class="modal-body">
            <div class="two-columns">
              <label><span>School Year</span><input v-model.trim="form.schoolYear" placeholder="SY26-27" /></label>
              <label><span>Semester</span><select v-model="form.semester"><option value="">Select semester</option><option>1st Semester</option><option>2nd Semester</option></select></label>
            </div>
            <div class="form-section">
              <h3>Sections per Year</h3>
              <div class="count-grid">
                <label v-for="year in yearOptions" :key="year"><span>{{ year }}</span><input v-model.number="form.sectionCounts[year]" type="number" min="0" step="1" /></label>
              </div>
            </div>
            <div class="form-section">
              <h3>Section Names</h3>
              <div class="name-groups">
                <div v-for="year in yearOptions" :key="year" class="name-group">
                  <strong>{{ year }}</strong>
                  <div class="name-grid">
                    <label v-for="(_name, index) in form.sectionNames[year]" :key="`${year}-${index}`">
                      <span>Section {{ index + 1 }}</span><input v-model.trim="form.sectionNames[year][index]" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-section">
              <h3>Available Rooms</h3>
              <p class="field-help">Enable the rooms that can be selected when adding schedules for this term.</p>
              <div v-for="floor in roomFloors" :key="floor.label" class="room-group">
                <strong>{{ floor.label }}</strong>
                <div class="room-grid">
                  <label v-for="room in floor.rooms" :key="room" :class="{ selected: selectedRooms.includes(room) }">
                    <input v-model="selectedRooms" type="checkbox" :value="room" />
                    <span>{{ room }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <footer><button class="cancel-btn" @click="closeTermModal">Cancel</button><button class="primary-btn" :disabled="saving" @click="saveTerm">{{ saving ? 'Saving...' : 'Save Term' }}</button></footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import RoleSwitchButton from '@/components/RoleSwitchButton.vue'
import Swal from 'sweetalert2'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const roomFloors = [
  { label: '2nd Floor', rooms: ['201', '202', '204', '205', '208', '209'] },
  { label: '3rd Floor', rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309'] },
  { label: '4th Floor', rooms: ['401', '402', '403', '404', '405', '406', '407', '408', '409'] },
]
const icon = path => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
const calendarIcon = icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>')
const roomIcon = icon('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>')
const teacherIcon = icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>')
const academicIcon = icon('<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>')
const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
  { name: 'Teachers', to: '/admin/teachers', icon: teacherIcon },
  { name: 'Events', to: '/admin/events', icon: icon('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>') },
  { name: 'Users', to: '/admin/users', icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
  { name: 'Activity Logs', to: '/admin/activity-logs', icon: icon('<path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/>') },
  { name: 'Settings', to: '/admin/settings', icon: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') },
]

const terms = ref([])
const teachers = ref([])
const publishedTerm = ref(null)
const loading = ref(true)
const termFilter = ref('all')
const workspaceTerm = ref(null)
const workspaceAction = ref('')
const workspaceMode = ref('')
const workspaceEntries = ref([])
const workspaceLoading = ref(false)
const previewSearch = ref('')
const previewPage = ref(1)
const previewPageSize = 4
const showTermModal = ref(false)
const editingTermId = ref('')
const saving = ref(false)
const selectedRooms = ref([])
const form = reactive({ schoolYear: '', semester: '', sectionCounts: {}, sectionNames: {} })

const filteredTerms = computed(() => terms.value.filter(term => {
  if (termFilter.value === 'current') return term.isPublished
  if (termFilter.value === 'archived') return !term.isPublished
  return true
}))
const previewTargets = computed(() => {
  const query = previewSearch.value.toLowerCase()
  const source = workspaceMode.value === 'room'
    ? [...new Set(termRooms(workspaceTerm.value))]
      .map(room => ({ key: room, label: `Room ${room}`, initials: room, value: room }))
    : teachers.value.map(teacher => ({ key: teacher.id || teacher.name, label: teacher.name, initials: initials(teacher.name), value: teacher.name }))
  return source
    .filter(target => target.label.toLowerCase().includes(query))
    .map(target => ({
      ...target,
      entries: workspaceEntries.value.filter(entry => workspaceMode.value === 'room' ? entry.room === target.value : entry.teacher === target.value),
    }))
})
const previewTotalPages = computed(() => Math.max(1, Math.ceil(previewTargets.value.length / previewPageSize)))
const pagedPreviewTargets = computed(() => previewTargets.value.slice((previewPage.value - 1) * previewPageSize, previewPage.value * previewPageSize))
watch(previewSearch, () => { previewPage.value = 1 })
watch(
  () => [route.query.term, route.query.action],
  ([requestedId, action]) => {
    if (!requestedId) {
      closeWorkspace()
      return
    }
    const requestedTerm = terms.value.find(term => termId(term) === String(requestedId))
    if (requestedTerm && action === 'view') openWorkspace(requestedTerm, 'view')
  }
)

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) throw new Error('Session expired.')
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Request failed.')
  return body
}
function termId(term) { return String(term?._id || term?.id || '') }
function termLabel(term) { return `${term?.schoolYear || ''} · ${term?.semester || ''}` }
function initials(name) { return String(name).split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() }
function termRooms(term) {
  return (Array.isArray(term?.rooms) ? term.rooms : []).map(room => typeof room === 'string' ? room : room.name).filter(Boolean)
}
function roomCount(term) { return termRooms(term).length }
function sectionSummary(term) {
  return yearOptions.map(year => `${year}: ${Number(term?.sectionCounts?.[year]) || 0}`).join(' · ')
}
function ensureSectionNames() {
  yearOptions.forEach(year => {
    const count = Math.max(0, Math.floor(Number(form.sectionCounts[year]) || 0))
    const old = Array.isArray(form.sectionNames[year]) ? form.sectionNames[year] : []
    form.sectionNames[year] = Array.from({ length: count }, (_, index) => old[index] || `South ${index + 1}`)
  })
}
watch(() => ({ ...form.sectionCounts }), ensureSectionNames, { deep: true })

async function loadPage() {
  loading.value = true
  try {
    const [termResponse, teacherResponse] = await Promise.all([apiRequest('/academic-terms'), apiRequest('/users?role=teacher')])
    terms.value = termResponse.terms || []
    publishedTerm.value = terms.value.find(term => term.isPublished) || null
    teachers.value = (teacherResponse.users || []).filter(item => Array.isArray(item.roles) ? item.roles.includes('teacher') : String(item.role).toLowerCase() === 'teacher').map(item => ({
      id: item._id || item.id,
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
    })).filter(item => item.name).sort((a, b) => a.name.localeCompare(b.name))
    const requestedTermId = String(route.query.term || '').trim()
    const requestedTerm = terms.value.find(term => termId(term) === requestedTermId)
    if (requestedTerm && route.query.action === 'view') openWorkspace(requestedTerm, 'view')
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Unable to load terms', text: error.message })
  } finally { loading.value = false }
}
function openWorkspace(term, action) {
  workspaceTerm.value = term
  workspaceAction.value = action
  workspaceMode.value = ''
  previewSearch.value = ''
  previewPage.value = 1
  workspaceEntries.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function closeWorkspace() { workspaceTerm.value = null; workspaceMode.value = ''; workspaceEntries.value = [] }
async function chooseWorkspaceMode(mode) {
  workspaceMode.value = mode
  previewPage.value = 1
  previewSearch.value = ''
  workspaceLoading.value = true
  try {
    const response = await apiRequest(`/schedules?academicTermId=${encodeURIComponent(termId(workspaceTerm.value))}`)
    workspaceEntries.value = response.entries || []
  } catch (error) {
    workspaceEntries.value = []
    await Swal.fire({ icon: 'error', title: 'Unable to load schedules', text: error.message })
  } finally { workspaceLoading.value = false }
}
function openSchedule(target) {
  const query = { academicTermId: termId(workspaceTerm.value), mode: workspaceMode.value }
  if (workspaceMode.value === 'teacher') query.teacher = target.value
  else query.room = target.value
  router.push({ path: workspaceAction.value === 'add' ? '/admin/schedule/add' : '/admin/schedule/view', query })
}
function resetForm() {
  form.schoolYear = ''; form.semester = ''; form.sectionCounts = {}; form.sectionNames = {}
  selectedRooms.value = []
  ensureSectionNames()
}
function openTermModal(term = null) {
  resetForm()
  editingTermId.value = termId(term)
  if (term) {
    form.schoolYear = term.schoolYear || ''; form.semester = term.semester || ''
    form.sectionCounts = { ...(term.sectionCounts || {}) }
    form.sectionNames = Object.fromEntries(yearOptions.map(year => [year, [...(term.sectionNames?.[year] || [])]]))
    selectedRooms.value = termRooms(term)
    ensureSectionNames()
  }
  showTermModal.value = true
}
function closeTermModal() { showTermModal.value = false; editingTermId.value = '' }
async function saveTerm() {
  if (!form.schoolYear || !form.semester) return Swal.fire({ icon: 'warning', title: 'Missing details', text: 'School year and semester are required.' })
  ensureSectionNames(); saving.value = true
  const payload = {
    schoolYear: form.schoolYear, semester: form.semester, sectionCounts: form.sectionCounts, sectionNames: form.sectionNames,
    rooms: selectedRooms.value.map(name => ({ name, type: 'Lecture' })), createdBy: user.name || user.email || 'Admin',
  }
  try {
    await apiRequest(editingTermId.value ? `/academic-terms/${editingTermId.value}` : '/academic-terms', { method: editingTermId.value ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
    closeTermModal(); await loadPage()
    await Swal.fire({ icon: 'success', title: 'Term saved', timer: 1300, showConfirmButton: false })
  } catch (error) { await Swal.fire({ icon: 'error', title: 'Unable to save term', text: error.message }) } finally { saving.value = false }
}
async function publishTerm(term) {
  const result = await Swal.fire({ icon: 'question', title: `Publish ${termLabel(term)}?`, text: 'This becomes the current schedule for teachers and students.', showCancelButton: true, confirmButtonText: 'Publish' })
  if (!result.isConfirmed) return
  try { await apiRequest(`/academic-terms/${termId(term)}/publish`, { method: 'POST' }); await loadPage() }
  catch (error) { await Swal.fire({ icon: 'error', title: 'Unable to publish term', text: error.message }) }
}
function logoutAndLeave() { logout(); router.push('/') }

loadPage()
</script>

<style scoped>
*{box-sizing:border-box}.layout{display:flex;height:100vh;background:linear-gradient(135deg,#f4f6f7,#dfe3e5);font-family:Poppins,Arial,sans-serif;color:#111827}.sidebar{width:288px;min-width:288px;height:100vh;position:sticky;top:0;padding:24px 17px;display:flex;flex-direction:column;background:linear-gradient(145deg,#eef1f2,#c5cbd0);border-right:1px solid #aeb5ba;overflow:auto}.sidebar-profile{text-align:center;border-bottom:1px solid #aeb5ba;padding-bottom:18px;margin-bottom:15px}.avatar-wrap{width:78px;height:78px;border-radius:50%;overflow:hidden;margin:0 auto 8px;cursor:pointer;border:3px solid #fff}.avatar{width:100%;height:100%;object-fit:cover}.brand{font-weight:700}.role,.email{font-size:.76rem;color:#51606a}.email{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sidebar-nav{display:flex;flex-direction:column;gap:5px;flex:1}.nav-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:12px;text-decoration:none;color:#111827;font-size:.88rem;font-weight:600}.nav-item:hover,.nav-item.active{background:rgba(255,255,255,.75);box-shadow:inset 0 0 0 1px #fff}.nav-icon{display:flex}.logout-btn{border:0;border-radius:10px;padding:11px;background:#e63946;color:#fff;font:inherit;cursor:pointer}.main{flex:1;overflow:auto;padding:28px 40px 50px}.page-header,.section-heading,.workspace-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.page-header{margin-bottom:24px}.page-header h1{font-size:2rem;margin:0}.page-header p,.section-heading p,.workspace-heading p{margin:4px 0 0;color:#5e6870;font-size:.87rem}.primary-btn,.dark-btn{border:1px solid #263746;background:#344657;color:#fff;border-radius:9px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.terms-card,.workspace-card{background:rgba(255,255,255,.88);border:1px solid #fff;border-radius:17px;padding:23px;box-shadow:0 10px 30px rgba(34,45,55,.08)}.section-heading{align-items:center;margin-bottom:18px}.section-heading h2,.workspace-heading h2{margin:0;font-size:1.15rem}.term-filter{display:flex;gap:5px;background:#eef1f3;padding:4px;border-radius:10px}.term-filter button{border:0;background:transparent;padding:7px 12px;border-radius:7px;font:inherit;font-size:.75rem;cursor:pointer}.term-filter button.active{background:#fff;box-shadow:0 2px 8px #ccd2d6}.term-list{display:flex;flex-direction:column;gap:11px}.term-row{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px;border:1px solid #dce1e4;border-radius:12px;background:#fafbfc}.term-title{display:flex;align-items:center;gap:8px}.term-title h3{margin:0;font-size:.95rem}.term-summary p{margin:7px 0 3px;color:#53606a;font-size:.76rem}.term-summary small{color:#879097}.pill,.action-chip{border-radius:99px;padding:4px 9px;font-size:.65rem;font-weight:700}.pill.in-use{background:#d5f8df;color:#08752d}.pill.published{background:#dff1ff;color:#075f99}.term-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.term-actions button{border:1px solid #d4dade;background:#edf0f2;border-radius:8px;padding:8px 11px;font:inherit;font-size:.75rem;cursor:pointer}.term-actions .dark-btn{background:#303c47;color:#fff}.term-actions .publish-btn{background:#e4f4ff;color:#075f99}.term-actions button:disabled{opacity:.5;cursor:default}.workspace-heading{align-items:center;padding-bottom:18px;border-bottom:1px solid #e3e7e9}.back-btn{border:0;background:transparent;color:#3e586b;font:inherit;font-size:.78rem;cursor:pointer}.action-chip.view{background:#e4f4ff;color:#075f99}.action-chip.add{background:#dff7e7;color:#08752d}.mode-grid{display:grid;grid-template-columns:repeat(2,minmax(230px,290px));gap:24px;margin:35px auto;justify-content:center}.mode-card{min-height:220px;border:1px solid #fff;border-radius:16px;background:linear-gradient(145deg,#fff,#e7eaec);box-shadow:0 12px 25px rgba(30,45,55,.12);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:13px;font:inherit;cursor:pointer}.mode-card:hover{transform:translateY(-3px)}.mode-icon{width:65px;height:65px;display:grid;place-items:center;border-radius:50%;background:#e6eaed;color:#30465a}.mode-icon :deep(svg){width:31px;height:31px}.mode-card small{max-width:210px;color:#66717a}.preview-toolbar{display:flex;align-items:flex-end;justify-content:space-between;margin:18px 0}.preview-search{display:flex;flex-direction:column;gap:4px;font-size:.7rem;color:#59656e}.preview-search input{width:260px;border:1px solid #ccd3d7;border-radius:8px;padding:9px 11px;font:inherit}.preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.preview-card{text-align:left;border:1px solid #d8dfe3;border-radius:14px;padding:15px;background:linear-gradient(145deg,#fff,#f0f2f3);font:inherit;cursor:pointer}.preview-card:hover{border-color:#718291;box-shadow:0 8px 20px rgba(30,45,55,.1)}.preview-card-head{display:flex;align-items:center;gap:10px}.preview-avatar{width:39px;height:39px;border-radius:50%;display:grid;place-items:center;background:#dce5eb;color:#2d4658;font-size:.7rem;font-weight:700}.preview-card-head div{display:flex;flex:1;flex-direction:column}.preview-card-head strong{font-size:.85rem}.preview-card-head small{font-size:.66rem;color:#7b858c}.open-arrow{font-size:1.2rem}.mini-schedule{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin:13px 0}.mini-day{min-height:75px;padding:5px 3px;background:#e9edef;border-radius:5px;overflow:hidden}.mini-day b{display:block;font-size:.55rem;color:#56636d;margin-bottom:4px}.mini-day span{display:block;background:#526474;color:#fff;border-radius:3px;padding:3px;margin-bottom:2px;font-size:.45rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mini-day em{font-size:.55rem;color:#9aa1a6}.preview-action{font-size:.68rem;color:#35566d;font-weight:600}.preview-pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:18px;font-size:.75rem}.preview-pagination button{width:32px;height:30px;border:1px solid #d3dade;border-radius:7px;background:#fff}.empty-state{text-align:center;color:#7b858c;padding:45px}.modal-overlay{position:fixed;inset:0;background:rgba(13,22,29,.58);z-index:1000;display:grid;place-items:center;padding:22px}.term-modal{width:min(1050px,96vw);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:17px;box-shadow:0 25px 70px rgba(0,0,0,.3)}.term-modal>header,.term-modal>footer{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e5e8ea}.term-modal>header h2{margin:0}.term-modal>header p{margin:3px 0 0;color:#748089;font-size:.78rem}.term-modal>footer{border-top:1px solid #e5e8ea;border-bottom:0;justify-content:flex-end;gap:9px}.modal-close{border:0;background:transparent;font-size:1.7rem;cursor:pointer}.modal-body{padding:20px 22px;overflow:auto}.two-columns,.count-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.two-columns label,.count-grid label,.name-grid label{display:flex;flex-direction:column;gap:5px;font-size:.72rem;font-weight:600}.two-columns input,.two-columns select,.count-grid input,.name-grid input{border:1px solid #ccd4d9;border-radius:8px;padding:9px;font:inherit}.form-section{margin-top:20px}.form-section h3{font-size:.88rem;margin:0 0 10px}.count-grid{grid-template-columns:repeat(4,1fr)}.name-groups{display:flex;flex-direction:column;gap:13px}.name-group>strong,.room-group>strong{display:block;font-size:.76rem;margin-bottom:7px}.name-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.room-group{margin-bottom:13px}.room-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.room-grid label{display:flex;align-items:center;gap:5px;padding:8px;border:1px solid #dce1e4;border-radius:8px;font-size:.7rem}.room-grid label.selected{background:#e9f3ee;border-color:#87a99a}.room-grid select{min-width:0;width:80px;margin-left:auto;border:1px solid #ccd4d9;border-radius:5px;font-size:.62rem}.cancel-btn{border:1px solid #d4dade;background:#fff;border-radius:9px;padding:10px 16px;font:inherit;cursor:pointer}@media(max-width:900px){.sidebar{display:none}.main{padding:22px 16px}.term-row{align-items:flex-start;flex-direction:column}.term-actions{justify-content:flex-start}.preview-grid,.mode-grid{grid-template-columns:1fr}.count-grid,.name-grid,.room-grid{grid-template-columns:repeat(2,1fr)}.two-columns{grid-template-columns:1fr}.preview-toolbar{align-items:flex-start;flex-direction:column;gap:10px}.preview-search input{width:100%}}
.field-help{margin:-4px 0 10px;color:#748089;font-size:.72rem}
</style>
