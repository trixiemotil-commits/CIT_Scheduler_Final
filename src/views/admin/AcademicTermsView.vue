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
        <PublishedTermScheduleLink />
      </nav>
      <RoleSwitchButton />
      <button class="logout-btn" @click="logoutAndLeave">Logout</button>
    </aside>

    <main class="main">
      <header class="page-header">
        <div>
          <span class="page-eyebrow">Schedule management</span>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDescription }}</p>
        </div>
        <button v-if="!isCurrentTermSource" class="primary-btn new-term-btn" @click="openTermModal()"><span aria-hidden="true">+</span> New Term</button>
      </header>

      <section v-if="workspaceTerm" class="workspace-card">
        <div class="workspace-heading">
          <div class="workspace-heading__context">
            <button v-if="!isCurrentTermSource" class="back-btn" aria-label="Back to all academic terms" @click="closeWorkspace"><span aria-hidden="true">&larr;</span></button>
            <div class="workspace-title">
              <span class="workspace-eyebrow">{{ workspaceEyebrowBase }} <span aria-hidden="true">/</span> {{ workspaceAction === 'add' ? 'Add schedule' : 'Schedule browser' }}</span>
              <h2>{{ termLabel(workspaceTerm) }}</h2>
              <p>{{ workspaceAction === 'add' ? 'Choose where you want to add schedules.' : 'Browse the term schedule by room or teacher.' }}</p>
            </div>
          </div>
          <span :class="['action-chip', workspaceAction]">{{ workspaceAction === 'add' ? 'Add Schedule' : 'View Schedules' }}</span>
        </div>

          <div v-if="!workspaceMode" class="mode-grid">
          <button class="mode-card" @click="chooseWorkspaceMode('room')">
            <span class="mode-icon" v-html="roomIcon"></span>
            <span class="mode-copy"><strong>Room</strong><small>{{ workspaceAction === 'add' ? 'Choose a room to manage its schedule' : 'See the classes assigned to each room' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">&rarr;</span>
          </button>
          <button class="mode-card" @click="chooseWorkspaceMode('teacher')">
            <span class="mode-icon" v-html="teacherIcon"></span>
            <span class="mode-copy"><strong>Teachers</strong><small>{{ workspaceAction === 'add' ? 'Choose a teacher to manage their schedule' : 'See each teacher’s complete schedule' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">&rarr;</span>
          </button>
          <button class="mode-card" @click="chooseWorkspaceMode('student')">
            <span class="mode-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg></span>
            <span class="mode-copy"><strong>Student</strong><small>{{ workspaceAction === 'add' ? 'Choose a year and section to manage schedules' : 'Browse schedules by student group' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <template v-else>
          <div class="preview-toolbar">
            <div class="preview-toolbar__intro">
              <button class="back-btn" @click="workspaceMode = ''; previewPage = 1"><span aria-hidden="true">&larr;</span> Choose another mode</button>
            </div>
            <label class="preview-search">
              <span>Search {{ workspaceMode === 'room' ? 'room' : (workspaceMode === 'teacher' ? 'teacher' : 'student') }}</span>
              <input v-model.trim="previewSearch" type="search" :placeholder="workspaceMode === 'room' ? 'Search rooms...' : (workspaceMode === 'teacher' ? 'Search teachers...' : 'Search student groups...')" />
            </label>
          </div>

          <div v-if="workspaceLoading" class="empty-state">Loading schedule previews...</div>

          <!-- Student: choose year first (uses same preview-card CSS as sections) -->
          <div v-else-if="workspaceMode === 'student' && !studentYearSelection" class="preview-grid">
            <button v-for="y in yearOptions" :key="y" class="preview-card" @click="studentYearSelection = y">
              <div class="preview-card-head">
                <span class="preview-avatar"><span>{{ y.slice(0,1) }}</span></span>
                <div><strong>{{ y }}</strong><small>{{ workspaceTerm.sectionNames?.[y]?.length || 0 }} sections</small></div>
                <span class="open-arrow" aria-hidden="true">&rarr;</span>
              </div>
            </button>
          </div>

          <!-- Student: choose section for selected year -->
          <div v-else-if="workspaceMode === 'student' && studentYearSelection" class="preview-grid">
            <div class="preview-toolbar__intro">
              <button class="back-btn" @click="studentYearSelection = null"><span aria-hidden="true">&larr;</span> Choose another year</button>
              <div style="margin-left:12px"><strong>{{ studentYearSelection }}</strong><small style="display:block;color:#6b7680">Select a section to manage schedules</small></div>
            </div>
            <div v-if="!workspaceEntries.length" class="empty-state">No schedules found for this term.</div>
            <div v-else class="section-grid">
              <button v-for="s in (workspaceTerm.sectionNames?.[studentYearSelection] || [])" :key="s" class="preview-card" @click="openSchedule({ value: { year: studentYearSelection, section: s } })">
                <div class="preview-card-head">
                  <span class="preview-avatar"><span>{{ studentYearSelection.slice(0,1) }}</span></span>
                  <div><strong>{{ studentYearSelection }} · {{ s }}</strong><small>{{ workspaceEntries.filter(e => e.year === studentYearSelection && e.section === s).length }} scheduled class{{ workspaceEntries.filter(e => e.year === studentYearSelection && e.section === s).length === 1 ? '' : 'es' }}</small></div>
                  <span class="open-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </button>
            </div>
          </div>

          <div v-else-if="!pagedPreviewTargets.length" class="empty-state">No matching {{ workspaceMode === 'room' ? 'rooms' : (workspaceMode === 'teacher' ? 'teachers' : 'student groups') }} found.</div>

          <div v-else class="preview-grid">
            <button v-for="target in pagedPreviewTargets" :key="target.key" class="preview-card" @click="openSchedule(target)">
              <div class="preview-card-head">
                <span class="preview-avatar">
                  <span>{{ target.initials }}</span>
                  <img v-if="target.avatar" :src="target.avatar" :alt="`${target.label} profile photo`" @error="hideBrokenAvatar" />
                </span>
                <div><strong>{{ target.label }}</strong><small>{{ target.entries.length }} scheduled class{{ target.entries.length === 1 ? '' : 'es' }}</small></div>
                <span class="open-arrow" aria-hidden="true">&rarr;</span>
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
              <span class="preview-action">{{ workspaceAction === 'add' ? 'Open schedule editor' : 'Open full schedule' }} <span aria-hidden="true">&rarr;</span></span>
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
          <div><h2>School terms</h2><p>Select a term below to view or manage its schedules.</p></div>
          <div class="term-filter">
            <button :class="{ active: termFilter === 'all' }" @click="termFilter = 'all'">All terms</button>
            <button :class="{ active: termFilter === 'current' }" @click="termFilter = 'current'">Published</button>
            <button :class="{ active: termFilter === 'archived' }" @click="termFilter = 'archived'">Unpublished</button>
          </div>
        </div>
        <div v-if="loading" class="empty-state">Loading academic terms...</div>
        <div v-else-if="!filteredTerms.length" class="empty-state">No academic terms found.</div>
        <div v-else class="term-list">
          <article v-for="term in filteredTerms" :key="termId(term)" class="term-row" :class="{ 'is-published': term.isPublished }">
            <div class="term-summary">
              <div class="term-title">
                <h3>{{ termLabel(term) }}</h3>
                <span v-if="term.isPublished" class="pill published"><span class="status-dot"></span> Current published term</span>
                <span v-else class="pill draft">Not published</span>
              </div>
              <p class="term-guidance">{{ term.isPublished ? 'Visible to teachers and students' : 'Only visible in the admin workspace' }}</p>
              <div class="term-metrics" aria-label="Term summary">
                <span v-for="year in yearOptions" :key="year" class="term-metric"><b>{{ sectionCount(term, year) }}</b>{{ year.replace(' Year', '') }} year sections</span>
                <span class="term-metric room-metric"><b>{{ roomCount(term) }}</b>rooms</span>
              </div>
            </div>
            <div class="term-actions">
              <span class="term-actions__label">Term actions</span>
              <button class="view-btn" title="Browse schedules for this term" @click="openWorkspace(term, 'view')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                <span>View schedules</span>
              </button>
              <button class="add-btn" title="Add a schedule to this term" @click="openWorkspace(term, 'add')">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M12 12v5M9.5 14.5h5"/></svg>
                <span>Add schedule</span>
              </button>
              <button class="edit-btn" title="Edit this term's details" @click="openTermModal(term)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l3.5-.7L19 7.8 16.2 5 4.7 16.5 4 20Z"/></svg>
                <span>Edit details</span>
              </button>
              <button class="publish-btn" :disabled="term.isPublished" :title="term.isPublished ? 'This is the current published term' : 'Make this term visible to teachers and students'" @click="publishTerm(term)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>
                <span>{{ term.isPublished ? 'Currently published' : 'Publish term' }}</span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div v-if="showTermModal" class="modal-overlay" @click.self="closeTermModal">
        <div class="term-modal" role="dialog" aria-modal="true" aria-labelledby="term-modal-title">
          <header><div><span class="modal-eyebrow">Academic term setup</span><h2 id="term-modal-title">{{ editingTermId ? 'Edit academic term' : 'New academic term' }}</h2><p>Define the term, create its sections, and choose the rooms available for scheduling.</p></div><button class="modal-close" aria-label="Close term setup" @click="closeTermModal">&times;</button></header>
          <div class="modal-body">
            <section class="form-section setup-section">
              <div class="setup-section__heading"><span class="step-number">1</span><div><h3>Term details</h3><p>Name the school year and semester.</p></div></div>
              <div class="two-columns">
                <label><span>School year</span><input :value="form.schoolYear" inputmode="numeric" maxlength="7" placeholder="Enter School Year (SY00-00)" autocomplete="off" @input="formatSchoolYear" /></label>
                <label><span>Semester</span><select v-model="form.semester"><option value="">Choose a semester</option><option>1st Semester</option><option>2nd Semester</option></select></label>
              </div>
            </section>
            <section class="form-section setup-section">
              <div class="setup-section__heading"><span class="step-number">2</span><div><h3>Sections</h3><p>Enter how many sections each year level will have.</p></div></div>
              <div class="count-grid">
                <label v-for="year in yearOptions" :key="year"><span>{{ year }}</span><input v-model.number="form.sectionCounts[year]" type="number" min="0" step="1" placeholder="0" /></label>
              </div>
              <div v-if="yearOptions.some(year => form.sectionNames[year]?.length)" class="name-groups">
                <div v-for="year in yearOptions.filter(item => form.sectionNames[item]?.length)" :key="year" class="name-group">
                  <strong>{{ year }} section names</strong>
                  <div class="name-grid">
                    <label v-for="(_name, index) in form.sectionNames[year]" :key="`${year}-${index}`">
                      <span>Section {{ index + 1 }}</span><input v-model.trim="form.sectionNames[year][index]" :placeholder="`${year.replace(' Year', '')} year section ${index + 1}`" />
                    </label>
                  </div>
                </div>
              </div>
              <div v-else class="inline-empty">Section-name fields will appear after you enter section counts above.</div>
            </section>
            <section class="form-section setup-section">
              <div class="setup-section__heading room-heading"><span class="step-number">3</span><div><h3>Available rooms</h3><p>Select rooms that schedulers may use during this term.</p></div><span class="selection-count">{{ selectedRooms.length }} selected</span></div>
              <label class="select-all-rooms" :class="{ selected: allRoomsSelected }">
                <input type="checkbox" :checked="allRoomsSelected" :indeterminate="someRoomsSelected" @change="toggleAllRooms" />
                <span><strong>{{ allRoomsSelected ? 'All rooms selected' : 'Select all rooms' }}</strong><small>{{ allRoomsSelected ? 'Uncheck to clear every room' : `Select all ${allRoomNames.length} available rooms` }}</small></span>
              </label>
              <div v-for="floor in roomFloors" :key="floor.label" class="room-group">
                <strong>{{ floor.label }}</strong>
                <div class="room-grid">
                  <label v-for="room in floor.rooms" :key="room" :class="{ selected: selectedRooms.includes(room) }">
                    <input v-model="selectedRooms" type="checkbox" :value="room" />
                    <span>{{ room }}</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <footer><span class="footer-help">You can edit these details later.</span><button class="cancel-btn" @click="closeTermModal">Cancel</button><button class="primary-btn save-term-btn" :disabled="saving" @click="saveTerm">{{ saving ? 'Saving term…' : editingTermId ? 'Save changes' : 'Create term' }}</button></footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import PublishedTermScheduleLink from '@/components/PublishedTermScheduleLink.vue'
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
const roomIcon = icon('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>')
const teacherIcon = icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')
const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
  { name: 'Teachers', to: '/admin/teachers', icon: teacherIcon },
  { name: 'Events', to: '/admin/events', icon: icon('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/>') },
  { name: 'Users', to: '/admin/users', icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>') },
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
const studentYearSelection = ref(null)
const workspaceLoading = ref(false)
const previewSearch = ref('')
const previewPage = ref(1)
const previewPageSize = 4
const showTermModal = ref(false)
const editingTermId = ref('')
const saving = ref(false)
const selectedRooms = ref([])
const form = reactive({ schoolYear: '', semester: '', sectionCounts: {}, sectionNames: {} })
const isCurrentTermSource = computed(() => route.query.source === 'current')
const pageTitle = computed(() => isCurrentTermSource.value ? 'Current Term Schedule' : 'Academic Terms')
const pageDescription = computed(() => isCurrentTermSource.value
  ? 'View the currently published schedule by room, teacher, or student group.'
  : 'Create school terms, organize schedules, and choose what teachers and students can currently view.')
const workspaceEyebrowBase = computed(() => isCurrentTermSource.value ? 'Current Term Schedule' : 'Academic Terms')
const allRoomNames = computed(() => roomFloors.flatMap(floor => floor.rooms))
const allRoomsSelected = computed(() => allRoomNames.value.length > 0 && allRoomNames.value.every(room => selectedRooms.value.includes(room)))
const someRoomsSelected = computed(() => selectedRooms.value.length > 0 && !allRoomsSelected.value)

function toggleAllRooms(event) {
  selectedRooms.value = event.target.checked ? [...allRoomNames.value] : []
}

const filteredTerms = computed(() => terms.value
  .filter(term => {
    if (termFilter.value === 'current') return term.isPublished
    if (termFilter.value === 'archived') return !term.isPublished
    return true
  })
  .sort((first, second) => Number(Boolean(second.isPublished)) - Number(Boolean(first.isPublished))))
const sectionCount = (term, year) => Number(term?.sectionCounts?.[year] ?? term?.sectionNames?.[year]?.length ?? 0)
const previewTargets = computed(() => {
  const query = previewSearch.value.toLowerCase()
  if (workspaceMode.value === 'room') {
    const source = [...new Set(termRooms(workspaceTerm.value))].map(room => ({ key: room, label: `Room ${room}`, initials: room, value: room }))
    return source
      .filter(target => target.label.toLowerCase().includes(query))
      .map(target => ({ ...target, entries: workspaceEntries.value.filter(entry => entry.room === target.value) }))
  }
  if (workspaceMode.value === 'teacher') {
    const source = teachers.value.map(teacher => ({ key: teacher.id || teacher.name, label: teacher.name, initials: initials(teacher.name), avatar: teacher.avatar, value: teacher.name }))
    return source
      .filter(target => target.label.toLowerCase().includes(query))
      .map(target => ({ ...target, entries: workspaceEntries.value.filter(entry => entry.teacher === target.value) }))
  }
  // student mode: group by year + section
  const groups = {}
  workspaceEntries.value.forEach(entry => {
    const y = entry.year || 'Unknown'
    const s = entry.section || '—'
    const key = `${y}||${s}`
    if (!groups[key]) groups[key] = { key, year: y, section: s, entries: [] }
    groups[key].entries.push(entry)
  })
  const source = Object.values(groups).map(g => ({ key: g.key, label: `${g.year} · ${g.section}`, initials: g.year, value: g }))
  return source
    .filter(target => target.label.toLowerCase().includes(query))
    .map(target => ({ ...target, entries: target.value.entries }))
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
    if (requestedTerm && ['view', 'add'].includes(action)) {
        openWorkspace(requestedTerm, action)
        if (['teacher', 'room', 'student'].includes(String(route.query.mode || ''))) chooseWorkspaceMode(String(route.query.mode))
      }
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
function hideBrokenAvatar(event) { event.currentTarget.style.display = 'none' }
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
      avatar: item.avatar || '',
    })).filter(item => item.name).sort((a, b) => a.name.localeCompare(b.name))
    const requestedTermId = String(route.query.term || '').trim()
    const requestedTerm = terms.value.find(term => termId(term) === requestedTermId)
    if (requestedTerm && ['view', 'add'].includes(String(route.query.action || ''))) {
      openWorkspace(requestedTerm, String(route.query.action))
      if (['teacher', 'room'].includes(String(route.query.mode || ''))) await chooseWorkspaceMode(String(route.query.mode))
    }
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Unable to load terms', text: error.message })
  } finally { loading.value = false }
}
function openWorkspace(term, action) {
  workspaceTerm.value = term
  workspaceAction.value = action
  workspaceMode.value = ''
  studentYearSelection.value = null
  previewSearch.value = ''
  previewPage.value = 1
  workspaceEntries.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function closeWorkspace() { workspaceTerm.value = null; workspaceMode.value = ''; workspaceEntries.value = [] }
async function chooseWorkspaceMode(mode) {
  workspaceMode.value = mode
  if (mode === 'student') studentYearSelection.value = null
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
  const query = {
    academicTermId: termId(workspaceTerm.value),
    mode: workspaceMode.value,
    source: route.query.source === 'current' ? 'current' : 'academic',
  }
  if (workspaceMode.value === 'teacher') query.teacher = target.value
  else if (workspaceMode.value === 'room') query.room = target.value
  else if (workspaceMode.value === 'student') {
    // target.value is the object { year, section, entries }
    const v = target.value || {}
    query.year = v.year || ''
    query.section = v.section || ''
  }
  router.push({ path: workspaceAction.value === 'add' ? '/admin/schedule/add' : '/admin/schedule/view', query })
}
function resetForm() {
  form.schoolYear = ''; form.semester = ''; form.sectionCounts = {}; form.sectionNames = {}
  selectedRooms.value = []
  ensureSectionNames()
}
function formatSchoolYear(event) {
  const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 4)
  const firstYear = digits.slice(0, 2)
  const secondYear = digits.slice(2, 4)
  form.schoolYear = digits ? `SY${firstYear}${secondYear ? `-${secondYear}` : ''}` : ''
  event.target.value = form.schoolYear
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
  if (!/^SY\d{2}-\d{2}$/.test(form.schoolYear)) return Swal.fire({ icon: 'warning', title: 'Incomplete school year', text: 'Enter four numbers for the school year, for example 2627.' })
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
/* Academic terms readability refresh */
.main { padding: 34px 42px 56px; }
.page-header { align-items: center; margin-bottom: 28px; }
.page-eyebrow { display: block; margin-bottom: 5px; color: #68747d; font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.page-header h1 { color: #1f2933; font-size: clamp(2rem, 3vw, 2.65rem); letter-spacing: -.04em; line-height: 1.08; }
.page-header p { max-width: 670px; margin-top: 9px; color: #66727c; font-size: .94rem; line-height: 1.55; }
.new-term-btn { display: inline-flex; align-items: center; gap: 9px; min-height: 48px; padding: 0 20px; border-radius: 12px; box-shadow: 0 9px 20px rgba(37, 48, 58, .2); }
.new-term-btn span { font-size: 1.35rem; font-weight: 400; line-height: 1; }
.terms-card { padding: 28px; border-radius: 20px; box-shadow: 0 14px 38px rgba(40, 52, 61, .1); }
.section-heading { padding-bottom: 21px; border-bottom: 1px solid #e3e7ea; }
.section-heading h2 { color: #202830; font-size: 1.35rem; letter-spacing: -.02em; }
.section-heading p { margin-top: 6px; color: #6b7680; font-size: .83rem; }
.term-filter { padding: 5px; gap: 3px; border: 1px solid #e1e5e8; border-radius: 12px; background: #f1f3f5; }
.term-filter button { min-height: 36px; padding: 7px 14px; color: #59646e; font-size: .74rem; font-weight: 600; }
.term-filter button.active { color: #1f2933; box-shadow: 0 3px 10px rgba(39, 49, 57, .12); }
.term-list { gap: 14px; }
.term-row { position: relative; align-items: stretch; min-height: 170px; padding: 22px; overflow: hidden; border-color: #dce2e6; border-radius: 16px; background: #fff; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.term-row:hover { border-color: #b9c4cc; box-shadow: 0 10px 25px rgba(41, 52, 60, .09); transform: translateY(-1px); }
.term-row.is-published { border-color: #9fc7b0; background: linear-gradient(110deg, #fbfefc 0%, #f3faf6 100%); }
.term-row.is-published::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: #2f7d52; }
.term-summary { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.term-title { flex-wrap: wrap; gap: 10px; }
.term-title h3 { color: #202830; font-size: 1.08rem; letter-spacing: -.01em; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; }
.pill.published { color: #14643c; background: #dff4e7; }
.pill.draft { color: #69747d; background: #edf0f2; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #238354; box-shadow: 0 0 0 3px rgba(35, 131, 84, .12); }
.term-guidance { margin: 7px 0 17px !important; color: #717c85 !important; font-size: .76rem !important; }
.term-metrics { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
.term-metric { display: inline-flex; align-items: baseline; gap: 5px; padding: 7px 10px; color: #64707a; border: 1px solid #e2e6e9; border-radius: 9px; background: #f7f8f9; font-size: .68rem; white-space: nowrap; }
.term-metric b { color: #26313a; font-size: .84rem; }
.room-metric { color: #476579; background: #f2f7fa; }
.term-actions { display: grid; width: min(330px, 36%); grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: center; align-items: center; justify-content: flex-end; }
.term-actions__label { grid-column: 1 / -1; margin: 0 0 2px 2px; color: #818b93; font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.term-actions button { display: inline-flex; min-height: 42px; padding: 9px 12px; align-items: center; justify-content: flex-start; gap: 8px; color: #39444d; border-color: #d7dde1; border-radius: 10px; background: #f6f7f8; font-size: .7rem; font-weight: 600; text-align: left; transition: transform .15s ease, background .15s ease, border-color .15s ease; }
.term-actions button svg { width: 17px; height: 17px; flex: 0 0 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.term-actions button:hover:not(:disabled) { border-color: #aeb9c0; background: #fff; transform: translateY(-1px); }
.term-actions button:focus-visible { outline: 3px solid rgba(50, 80, 98, .2); outline-offset: 2px; }
.term-actions .view-btn { color: #fff; border-color: #354653; background: #354653; }
.term-actions .view-btn:hover:not(:disabled) { color: #fff; background: #263744; }
.term-actions .add-btn { color: #315e47; border-color: #bed4c8; background: #edf7f1; }
.term-actions .publish-btn { color: #176a94; border-color: #b9d7e6; background: #eaf6fc; }
.term-actions .publish-btn:disabled { color: #668176; border-color: #cfddd5; background: #e7f1eb; opacity: 1; }
.empty-state { border: 1px dashed #ccd4d9; border-radius: 14px; background: #f8fafb; }

/* Schedule browser: compact, high-contrast metallic workspace */
.workspace-card {
  padding: 0;
  overflow: hidden;
  border-color: rgba(255, 255, 255, .9);
  max-width: 1480px;
  margin: 0 auto;
  border-radius: 18px;
  background: rgba(250, 251, 251, .94);
  box-shadow: 0 18px 44px rgba(39, 46, 52, .13), inset 0 1px 0 #fff;
}
.workspace-heading {
  display: flex;
  align-items: center;
  min-height: 104px;
  padding: 22px 28px;
  border-bottom-color: #d9dee1;
  background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(231,234,236,.76));
}
.workspace-heading__context { display: flex; min-width: 0; align-items: center; gap: 16px; }
.workspace-title { min-width: 0; text-align: left; }
.workspace-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #6f7b84;
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.workspace-eyebrow span { margin: 0 5px; color: #a0a8ae; }
.workspace-heading h2 { color: #222a31; font-size: 1.3rem; letter-spacing: -.025em; }
.workspace-heading p { margin-top: 3px; color: #68737c; font-size: .75rem; }
.workspace-heading .back-btn {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  justify-content: center;
  align-items: center;
  padding: 0;
  color: #46535c;
  border: 1px solid #cbd2d6;
  border-radius: 9px;
  background: linear-gradient(145deg, #fff, #e8ebed);
  box-shadow: 0 3px 8px rgba(41, 49, 55, .08), inset 0 1px 0 #fff;
  font-weight: 600;
  transition: background .16s ease, border-color .16s ease;
}
.workspace-heading .back-btn:hover { color: #202a31; border-color: #9ea9b0; background: #fff; transform: translateY(-1px); }
.workspace-heading .back-btn:focus-visible,.mode-card:focus-visible { outline: 3px solid rgba(48, 66, 78, .2); outline-offset: 3px; }
.workspace-heading .action-chip {
  margin-left: auto;
  padding: 7px 11px;
  color: #3f4b54;
  border: 1px solid #cbd2d7;
  background: linear-gradient(145deg, #f8f9f9, #dce0e2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
}
.mode-grid {
  width: min(860px, calc(100% - 64px));
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 44px auto 52px;
}
.mode-card {
  position: relative;
  min-height: 164px;
  padding: 26px;
  flex-direction: row;
  justify-content: flex-start;
  gap: 18px;
  color: #283139;
  border-color: #d4dade;
  border-radius: 15px;
  background: linear-gradient(145deg, #fff 0%, #f2f4f5 58%, #e1e4e6 100%);
  box-shadow: 0 10px 24px rgba(40, 48, 54, .1), inset 0 1px 0 #fff;
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.mode-card:hover {
  border-color: #89949c;
  box-shadow: 0 15px 30px rgba(40, 48, 54, .15), inset 0 1px 0 #fff;
  transform: translateY(-2px);
}
.mode-icon {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  color: #f6f7f7;
  border: 1px solid #4b555d;
  border-radius: 14px;
  background: linear-gradient(145deg, #66717a, #313940);
  box-shadow: 0 7px 15px rgba(42, 50, 56, .22), inset 0 1px 0 rgba(255,255,255,.2);
}
.mode-icon :deep(svg) { width: 27px; height: 27px; }
.mode-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 7px; }
.mode-copy strong { color: #232b31; font-size: 1rem; letter-spacing: -.015em; }
.mode-card .mode-copy small { max-width: 245px; color: #68747d; font-size: .75rem; line-height: 1.55; }
.mode-arrow { color: #59656e; font-size: 1.25rem; transition: transform .18s ease; }
.mode-card:hover .mode-arrow { transform: translateX(3px); }
.preview-toolbar {
  align-items: center;
  gap: 24px;
  margin: 0;
  padding: 16px 28px;
  border-bottom: 1px solid #dde2e5;
  background: rgba(246, 247, 248, .86);
}
.preview-toolbar__intro { display: flex; align-items: center; gap: 14px; }
.preview-toolbar__intro .back-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 12px;
  color: #34434e;
  border: 1px solid #cbd3d7;
  border-radius: 9px;
  background: linear-gradient(145deg, #fff, #e7eaec);
  box-shadow: 0 3px 8px rgba(40, 49, 55, .07), inset 0 1px 0 #fff;
  font-size: .78rem;
  font-weight: 650;
}
.preview-toolbar__intro .back-btn:hover { color: #1f303c; border-color: #9da9b0; background: #fff; transform: translateY(-1px); }
.preview-toolbar__intro > span { color: #737e86; font-size: .68rem; font-weight: 550; white-space: nowrap; }
.preview-toolbar__intro > span b { color: #2d3941; font-size: .75rem; }
.preview-search { margin-left: auto; flex-direction: row; align-items: center; gap: 10px; color: #536069; font-size: .68rem; font-weight: 650; }
.preview-search input {
  width: 260px;
  min-height: 40px;
  padding: 10px 13px;
  color: #263038;
  border-color: #c6ced3;
  border-radius: 10px;
  background: rgba(255,255,255,.9);
  box-shadow: inset 0 1px 2px rgba(37, 46, 52, .05);
  font-size: .76rem;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.preview-search input:focus { outline: none; border-color: #71808a; box-shadow: 0 0 0 3px rgba(62, 82, 95, .12); }
.preview-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 28px 28px;
  background: #f3f5f6;
}
.preview-card {
  min-width: 0;
  padding: 17px;
  overflow: hidden;
  color: #283139;
  border-color: #d6dde1;
  border-radius: 13px;
  background: linear-gradient(145deg, #fff 0%, #f4f5f6 100%);
  box-shadow: 0 5px 14px rgba(41, 49, 55, .055), inset 0 1px 0 #fff;
  transition: border-color .17s ease, box-shadow .17s ease, transform .17s ease;
}
.preview-card:hover {
  border-color: #909ca4;
  box-shadow: 0 11px 23px rgba(38, 47, 53, .12), inset 0 1px 0 #fff;
  transform: translateY(-2px);
}
.preview-card:focus-visible { outline: 3px solid rgba(49, 72, 86, .19); outline-offset: 2px; }
.preview-card-head { gap: 12px; }
.preview-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  color: #eef2f4;
  border: 1px solid #596772;
  background: linear-gradient(145deg, #687985, #394a56);
  box-shadow: 0 5px 11px rgba(43, 55, 63, .17);
  overflow: hidden;
}
.preview-avatar > span { position: relative; z-index: 0; }
.preview-avatar img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }
.preview-card-head strong { color: #20282e; font-size: .82rem; font-weight: 700; }
.preview-card-head small { margin-top: 2px; color: #7a848c; font-size: .64rem; }
.preview-card-head > .open-arrow { display: none; }
.mini-schedule { gap: 5px; margin: 16px 0 13px; }
.mini-day {
  min-width: 0;
  min-height: 76px;
  padding: 7px 6px;
  border: 1px solid #e0e5e8;
  border-radius: 7px;
  background: #edf0f2;
}
.mini-day b { margin-bottom: 6px; color: #596670; font-size: .55rem; letter-spacing: .01em; }
.mini-day span {
  padding: 4px 5px;
  border-radius: 4px;
  background: #526573;
  font-size: .47rem;
  line-height: 1.25;
}
.mini-day em { color: #9aa3aa; font-size: .6rem; font-style: normal; }
.preview-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  justify-content: center;
  padding: 7px 11px;
  color: #344751;
  border: 1px solid #c5cfd4;
  border-radius: 8px;
  background: linear-gradient(145deg, #fff, #e5e9eb);
  box-shadow: 0 3px 8px rgba(42, 52, 59, .08), inset 0 1px 0 #fff;
  font-size: .67rem;
  font-weight: 700;
}
.preview-card:hover .preview-action { color: #fff; border-color: #3d4b55; background: linear-gradient(145deg, #5a6872, #34424b); box-shadow: 0 5px 11px rgba(39, 48, 55, .16); }
.preview-card:hover .preview-action span { transform: translateX(2px); }
.preview-action span { transition: transform .17s ease; }
.preview-pagination { margin: 0; padding: 0 30px 26px; }
.preview-pagination button {
  color: #33414b;
  border-color: #c4ccd1;
  background: linear-gradient(145deg, #fff, #e5e8ea);
  box-shadow: 0 3px 7px rgba(40, 48, 54, .08), inset 0 1px 0 #fff;
  cursor: pointer;
  transition: border-color .15s ease, transform .15s ease;
}
.preview-pagination button:hover:not(:disabled) { border-color: #929fa7; transform: translateY(-1px); }
.preview-pagination button:disabled { cursor: default; opacity: .45; }
@media (max-width: 1100px) {
  .term-row { flex-direction: column; }
  .term-actions { width: min(100%, 480px); justify-content: flex-start; }
}
@media (max-width: 820px) {
  .mode-grid { grid-template-columns: 1fr; }
  .preview-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .main { padding: 22px 16px 40px; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .new-term-btn { width: 100%; justify-content: center; }
  .terms-card { padding: 18px; }
  .section-heading { align-items: flex-start; flex-direction: column; }
  .term-filter { width: 100%; }
  .term-filter button { flex: 1; }
  .term-row { padding: 18px 16px; }
  .term-actions { display: grid; width: 100%; grid-template-columns: repeat(2, 1fr); }
  .term-actions button { width: 100%; }
  .workspace-heading { min-height: 0; padding: 20px; }
  .workspace-heading h2 { font-size: 1.15rem; }
  .mode-grid { width: calc(100% - 32px); margin: 24px auto 30px; }
  .mode-card { min-height: 138px; padding: 20px; }
  .preview-toolbar { align-items: stretch; flex-direction: column; padding: 18px 20px; }
  .preview-toolbar__intro { justify-content: space-between; }
  .preview-search { margin-left: 0; align-items: stretch; flex-direction: column; }
  .preview-search input { width: 100%; }
  .preview-grid { padding: 18px 20px 24px; }
  .mini-schedule { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 420px) {
  .term-actions { grid-template-columns: 1fr; }
  .term-actions__label { grid-column: 1; }
  .workspace-heading .action-chip { display: none; }
  .workspace-heading { padding: 17px; }
  .workspace-heading__context { align-items: flex-start; }
  .workspace-heading p { display: none; }
  .mode-card { align-items: flex-start; }
  .mode-arrow { display: none; }
}
/* Term setup modal */
.modal-overlay { padding: 28px; background: rgba(20, 27, 32, .68); backdrop-filter: blur(5px); }
.term-modal { width: min(980px, 96vw); max-height: min(92vh, 940px); overflow: hidden; border: 1px solid rgba(255,255,255,.8); border-radius: 22px; box-shadow: 0 30px 90px rgba(0,0,0,.38); }
.term-modal > header { padding: 24px 28px 21px; background: linear-gradient(135deg, #fff, #f5f7f8); }
.term-modal > header h2 { color: #202830; font-size: 1.55rem; letter-spacing: -.03em; }
.term-modal > header p { max-width: 650px; margin-top: 7px; color: #65727c; font-size: .86rem; line-height: 1.55; }
.modal-eyebrow { display: block; margin-bottom: 5px; color: #667781; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.modal-close { display: grid; width: 38px; height: 38px; place-items: center; padding: 0; color: #59636b; border-radius: 10px; line-height: 1; }
.modal-close:hover { color: #202830; background: #e9edef; }
.modal-close:focus-visible { outline: 3px solid rgba(49, 75, 91, .2); }
.modal-body { padding: 24px 28px 34px; background: #f4f6f7; }
.setup-section { margin: 0 0 16px; padding: 21px; border: 1px solid #dfe4e7; border-radius: 15px; background: #fff; box-shadow: 0 5px 15px rgba(41, 51, 58, .04); }
.setup-section:last-child { margin-bottom: 0; }
.setup-section__heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
.setup-section__heading h3 { margin: 1px 0 3px; color: #222b32; font-size: 1rem; }
.setup-section__heading p { margin: 0; color: #6f7b84; font-size: .78rem; line-height: 1.5; }
.step-number { display: grid; width: 28px; height: 28px; flex: 0 0 28px; place-items: center; color: #fff; border-radius: 8px; background: #3d4e5a; font-size: .72rem; font-weight: 700; }
.room-heading .selection-count { margin-left: auto; }
.selection-count { padding: 6px 9px; color: #356047; border: 1px solid #c8ddd0; border-radius: 999px; background: #edf7f1; font-size: .64rem; font-weight: 700; white-space: nowrap; }
.select-all-rooms { display: flex; align-items: center; gap: 11px; margin: -2px 0 18px; padding: 12px 14px; color: #46535c; border: 1px solid #d7dfe3; border-radius: 11px; background: #f7f9fa; cursor: pointer; transition: border-color .15s, background .15s; }
.select-all-rooms:hover { border-color: #aebdc5; background: #fff; }
.select-all-rooms.selected { color: #26543a; border-color: #9fc6ae; background: #eaf6ee; }
.select-all-rooms input { width: 17px; height: 17px; flex: 0 0 17px; accent-color: #35684b; }
.select-all-rooms > span { display: flex; flex-direction: column; gap: 2px; }
.select-all-rooms strong { font-size: .76rem; }
.select-all-rooms small { color: #7b858d; font-size: .65rem; }
.two-columns label,.count-grid label,.name-grid label { gap: 7px; color: #3d4850; font-size: .75rem; font-weight: 650; }
.two-columns input,.two-columns select,.count-grid input,.name-grid input { min-height: 43px; padding: 10px 12px; color: #202830; border-color: #cfd7dc; background: #fbfcfc; font-size: .78rem; font-weight: 500; transition: border-color .15s, box-shadow .15s, background .15s; }
.two-columns input:focus,.two-columns select:focus,.count-grid input:focus,.name-grid input:focus { outline: none; border-color: #708592; background: #fff; box-shadow: 0 0 0 3px rgba(73, 99, 114, .12); }
.two-columns input::placeholder,.count-grid input::placeholder,.name-grid input::placeholder { color: #a0a8ae; }
.count-grid { gap: 10px; }
.name-groups { margin-top: 20px; padding-top: 18px; gap: 16px; border-top: 1px solid #e6e9eb; }
.name-group { padding: 15px; border: 1px solid #e1e6e9; border-radius: 12px; background: #f8fafb; }
.name-group > strong { margin-bottom: 11px; color: #354149; font-size: .8rem; }
.inline-empty { margin-top: 18px; padding: 13px 15px; color: #707c85; border: 1px dashed #ccd5da; border-radius: 10px; background: #f8fafb; font-size: .76rem; }
.room-group { margin-bottom: 18px; }
.room-group:last-child { margin-bottom: 0; }
.room-group > strong { margin-bottom: 9px; color: #3d4951; font-size: .79rem; }
.room-grid { gap: 8px; }
.room-grid label { min-height: 39px; padding: 8px 10px; color: #536069; border-color: #dce2e5; background: #fafbfc; cursor: pointer; transition: border-color .15s, background .15s, transform .15s; }
.room-grid label:hover { border-color: #aebbc3; background: #fff; transform: translateY(-1px); }
.room-grid label.selected { color: #24543a; border-color: #9fc6ae; background: #eaf6ee; box-shadow: inset 0 0 0 1px rgba(69, 128, 91, .08); }
.room-grid input { accent-color: #35684b; }
.term-modal > footer { gap: 10px; padding: 16px 28px; background: rgba(255,255,255,.98); box-shadow: 0 -8px 24px rgba(41, 50, 57, .07); }
.footer-help { margin-right: auto; color: #78838b; font-size: .74rem; }
.term-modal > footer button { min-height: 40px; padding: 9px 17px; border-radius: 10px; font-size: .78rem; font-weight: 650; line-height: 1; }
.term-modal > footer .cancel-btn { color: #46515a; border-color: #cfd6da; background: #fff; }
.term-modal > footer .cancel-btn:hover { border-color: #aeb9bf; background: #f5f7f8; }
.save-term-btn { min-width: 124px; border-color: #344957; background: #344957; box-shadow: 0 6px 14px rgba(42, 61, 73, .18); }
.save-term-btn:hover:not(:disabled) { background: #263b49; transform: translateY(-1px); }
.save-term-btn:disabled { opacity: .65; cursor: wait; }
@media (max-width: 700px) {
  .modal-overlay { padding: 0; }
  .term-modal { width: 100%; max-height: 100vh; border-radius: 0; }
  .term-modal > header,.modal-body,.term-modal > footer { padding-inline: 18px; }
  .setup-section { padding: 17px 14px; }
  .count-grid,.name-grid,.room-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .footer-help { display: none; }
}
</style>
