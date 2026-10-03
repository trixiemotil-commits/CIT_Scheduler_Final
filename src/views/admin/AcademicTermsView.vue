<template>
  <div class="layout">
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" @click="router.push('/admin/profile')">
          <img :src="user.avatar || initialsAvatar(user)" class="avatar" alt="Admin" />
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
      <button class="logout-btn" @click="logoutAndLeave">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>

    <main class="main">
      <Teleport to="body">
        <Transition name="term-toast">
          <div
            v-if="statusToast"
            class="term-status-toast"
            :class="`is-${statusToast.type}`"
            :role="statusToast.type === 'error' ? 'alert' : 'status'"
            aria-live="polite"
          >
            <span class="term-status-toast__icon" aria-hidden="true">{{ statusToast.type === 'success' ? '✓' : statusToast.type === 'info' ? 'i' : '!' }}</span>
            <span>{{ statusToast.message }}</span>
          </div>
        </Transition>
      </Teleport>
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
          <button class="mode-card" :class="{ 'is-loading': workspacePendingMode === 'student' }" :disabled="workspaceLoading" :aria-busy="workspacePendingMode === 'student'" @click="chooseWorkspaceMode('student')">
            <span class="mode-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg></span>
            <span class="mode-copy"><strong>Student</strong><small>{{ workspaceAction === 'add' ? 'Choose a year and section to manage schedules' : 'Browse schedules by student group' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">{{ workspacePendingMode === 'student' ? 'Loading…' : '→' }}</span>
          </button>
          <button class="mode-card" :class="{ 'is-loading': workspacePendingMode === 'room' }" :disabled="workspaceLoading" :aria-busy="workspacePendingMode === 'room'" @click="chooseWorkspaceMode('room')">
            <span class="mode-icon" v-html="roomIcon"></span>
            <span class="mode-copy"><strong>Room</strong><small>{{ workspaceAction === 'add' ? 'Choose a room to manage its schedule' : 'See the classes assigned to each room' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">{{ workspacePendingMode === 'room' ? 'Loading…' : '→' }}</span>
          </button>
          <button class="mode-card" :class="{ 'is-loading': workspacePendingMode === 'teacher' }" :disabled="workspaceLoading" :aria-busy="workspacePendingMode === 'teacher'" @click="chooseWorkspaceMode('teacher')">
            <span class="mode-icon" v-html="teacherIcon"></span>
            <span class="mode-copy"><strong>Faculty</strong><small>{{ workspaceAction === 'add' ? 'Choose a faculty member to manage their schedule' : 'See each faculty member’s complete schedule' }}</small></span>
            <span class="mode-arrow" aria-hidden="true">{{ workspacePendingMode === 'teacher' ? 'Loading…' : '→' }}</span>
          </button>
          <p v-if="workspaceLoading" class="mode-loading-note" role="status">Loading {{ workspacePendingMode === 'teacher' ? 'faculty' : workspacePendingMode }} schedules…</p>
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
            <div class="preview-toolbar__intro section-selection-toolbar">
              <button class="back-btn" @click="studentYearSelection = null"><span aria-hidden="true">&larr;</span> Choose another year</button>
              <div style="margin-left:12px"><strong>{{ studentYearSelection }}</strong><small style="display:block;color:#6b7680">Select a section to manage schedules</small></div>
            </div>
            <div v-if="!filteredWorkspaceEntries.length" class="empty-state">No schedules found for this term.</div>
            <div v-else class="section-grid">
              <button v-for="s in (workspaceTerm.sectionNames?.[studentYearSelection] || [])" :key="s" class="preview-card" :disabled="!!openingScheduleKey" :aria-busy="openingScheduleKey === `student:${studentYearSelection}:${s}`" @click="openSchedule({ value: { year: studentYearSelection, section: s } }, `student:${studentYearSelection}:${s}`)">
                <div class="preview-card-head">
                  <span class="preview-avatar"><span>{{ studentYearSelection.slice(0,1) }}</span></span>
                  <div><strong>{{ studentYearSelection }} · {{ s }}</strong><small>{{ filteredWorkspaceEntries.filter(e => e.year === studentYearSelection && e.section === s).length }} scheduled class{{ filteredWorkspaceEntries.filter(e => e.year === studentYearSelection && e.section === s).length === 1 ? '' : 'es' }}</small></div>
                  <span class="open-arrow" aria-hidden="true">{{ openingScheduleKey === `student:${studentYearSelection}:${s}` ? 'Opening…' : '→' }}</span>
                </div>
              </button>
            </div>
          </div>

          <div v-else-if="!pagedPreviewTargets.length" class="empty-state">No matching {{ workspaceMode === 'room' ? 'rooms' : (workspaceMode === 'teacher' ? 'teachers' : 'student groups') }} found.</div>

          <div v-else class="preview-grid">
            <button v-for="target in pagedPreviewTargets" :key="target.key" class="preview-card" :disabled="!!openingScheduleKey" :aria-busy="openingScheduleKey === target.key" @click="openSchedule(target, target.key)">
              <div class="preview-card-head">
                <span class="preview-avatar">
                  <span>{{ target.initials }}</span>
                  <img v-if="target.avatar" :src="target.avatar" :alt="`${target.label} profile photo`" @error="hideBrokenAvatar" />
                </span>
                <div><strong>{{ target.label }}</strong><small>{{ target.entries.length }} scheduled class{{ target.entries.length === 1 ? '' : 'es' }}</small></div>
                <span class="open-arrow" aria-hidden="true">{{ openingScheduleKey === target.key ? 'Opening…' : '→' }}</span>
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

          <footer v-if="previewTotalPages > 1 && workspaceMode !== 'student'" class="preview-pagination">
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
                <span v-for="(year, index) in yearOptions" :key="year" class="term-metric" :class="`section-metric--year-${index + 1}`"><b>{{ sectionCount(term, year) }}</b>{{ year.replace(' Year', '') }} year sections</span>
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
              <button class="excel-btn" :class="{ 'is-loading': isTermActionLoading(term, 'download') }" :disabled="!!activeTermAction" title="Download all schedules for this term" @click="downloadTermExcel(term)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/></svg>
                <span>{{ isTermActionLoading(term, 'download') ? 'Downloading…' : 'Download Excel' }}</span>
              </button>
              <button class="edit-btn" title="Edit this term's details" @click="openTermModal(term)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l3.5-.7L19 7.8 16.2 5 4.7 16.5 4 20Z"/></svg>
                <span>Edit details</span>
              </button>
              <button class="publish-btn" :class="{ 'is-loading': isTermActionLoading(term, 'publish') }" :disabled="term.isPublished || !!activeTermAction" :title="term.isPublished ? 'This is the current published term' : 'Make this term visible to teachers and students'" @click="publishTerm(term)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>
                <span>{{ isTermActionLoading(term, 'publish') ? 'Publishing…' : term.isPublished ? 'Currently published' : 'Publish term' }}</span>
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
          <nav class="term-stepper" aria-label="Academic term setup steps">
            <span :class="['term-stepper__item', { 'is-active': modalStep === 1, 'is-done': modalStep > 1 }]" @click="modalStep > 1 && (modalStep = 1)"><b>1</b><span>Term details</span></span>
            <i aria-hidden="true"></i>
            <span :class="['term-stepper__item', { 'is-active': modalStep === 2, 'is-done': modalStep > 2 }]" @click="modalStep > 2 && (modalStep = 2)"><b>2</b><span>Sections</span></span>
            <i aria-hidden="true"></i>
            <span :class="['term-stepper__item', { 'is-active': modalStep === 3 }]" @click="modalStep === 3 && (modalStep = 3)"><b>3</b><span>Available rooms</span></span>
          </nav>
          <div v-if="form.schoolYear || form.semester" class="term-progress-summary">
            <span class="term-progress-summary__label">Term details</span>
            <strong>{{ form.schoolYear || 'School year not set' }}</strong>
            <span v-if="form.semester" class="term-progress-summary__divider">·</span>
            <span v-if="form.semester">{{ form.semester }}</span>
            <template v-if="modalStep > 2">
              <span class="term-progress-summary__divider">·</span>
              <span>{{ sectionSummaryText }}</span>
            </template>
          </div>
          <div class="modal-body">
            <section v-if="modalStep === 1" class="form-section setup-section">
              <div class="setup-section__heading"><span class="step-number">1</span><div><h3>Term details</h3><p>Name the school year and semester.</p></div></div>
              <div class="two-columns">
                <label :class="{ 'is-invalid': termDetailsAttempted && !form.schoolYear }"><span>School year</span><select v-model="form.schoolYear" :aria-invalid="termDetailsAttempted && !form.schoolYear" required><option value="">Choose a school year</option><option v-for="schoolYear in schoolYearOptions" :key="schoolYear" :value="schoolYear">{{ schoolYear }}</option></select><small v-if="termDetailsAttempted && !form.schoolYear" class="field-error-hint">Please select a school year.</small></label>
                <label :class="{ 'is-invalid': termDetailsAttempted && !form.semester }"><span>Semester</span><select v-model="form.semester" :aria-invalid="termDetailsAttempted && !form.semester"><option value="">Choose a semester</option><option>1st Semester</option><option>2nd Semester</option></select><small v-if="termDetailsAttempted && !form.semester" class="field-error-hint">Please select a semester.</small></label>
              </div>
            </section>
            <section v-else-if="modalStep === 2" class="form-section setup-section">
              <div class="setup-section__heading"><span class="step-number">2</span><div><h3>Sections</h3><p>Enter how many sections each year level will have.</p></div></div>
              <div class="count-grid">
                <label v-for="year in yearOptions" :key="year" :class="{ 'is-invalid': sectionCountsAttempted && (form.sectionCounts[year] === undefined || form.sectionCounts[year] === '') }"><span>{{ year }}</span><input :value="form.sectionCounts[year] ?? ''" type="text" inputmode="numeric" maxlength="2" pattern="[0-9]{0,2}" placeholder="0" :aria-invalid="sectionCountsAttempted && (form.sectionCounts[year] === undefined || form.sectionCounts[year] === '')" @input="limitSectionCountInput($event, year)" /><small v-if="sectionCountsAttempted && (form.sectionCounts[year] === undefined || form.sectionCounts[year] === '')" class="field-error-hint">Enter a count, or 0 if none.</small></label>
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
            <section v-else class="form-section setup-section">
              <div class="setup-section__heading room-heading"><span class="step-number">3</span><div><h3>Available rooms</h3><p>Select rooms that schedulers may use during this term.</p></div><span class="selection-count" :class="{ 'is-invalid': roomSelectionAttempted && !selectedRooms.length }">{{ selectedRooms.length }} selected</span></div>
              <label class="select-all-rooms" :class="{ selected: allRoomsSelected }">
                <input type="checkbox" :checked="allRoomsSelected" :indeterminate="someRoomsSelected" @change="toggleAllRooms" />
                <span><strong>{{ allRoomsSelected ? 'All rooms selected' : 'Select all rooms' }}</strong><small>{{ allRoomsSelected ? 'Uncheck to clear every room' : `Select all ${allRoomNames.length} available rooms` }}</small></span>
              </label>
              <p v-if="roomSelectionAttempted && !selectedRooms.length" class="room-selection-error" role="alert">Please select at least one room before creating the term.</p>
              <div v-for="floor in roomFloors" :key="floor.label" class="room-group">
                <div class="room-group-heading">
                  <strong>{{ floor.label }}</strong>
                  <label class="select-floor-rooms" :class="{ selected: areFloorRoomsSelected(floor), partial: areSomeFloorRoomsSelected(floor) }">
                    <input type="checkbox" :checked="areFloorRoomsSelected(floor)" :indeterminate="areSomeFloorRoomsSelected(floor)" :aria-label="`Select all rooms on ${floor.label}`" @change="toggleFloorRooms(floor, $event)" />
                    <span>Select all</span>
                  </label>
                </div>
                <div class="room-grid">
                  <label v-for="room in floor.rooms" :key="room" :class="{ selected: selectedRooms.includes(room) }">
                    <input v-model="selectedRooms" type="checkbox" :value="room" />
                    <span>{{ room }}</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <footer><span class="footer-help">Step {{ modalStep }} of 3 · You can edit these details later.</span><button v-if="modalStep > 1" class="cancel-btn step-back-btn" @click="modalStep--">Back</button><button v-if="modalStep < 3" class="primary-btn save-term-btn" @click="nextModalStep">Continue</button><button v-else class="primary-btn save-term-btn" :class="{ 'is-loading': saving }" :aria-busy="saving" :disabled="saving" @click="saveTerm">{{ saving ? (editingTermId ? 'Updating term…' : 'Creating term…') : editingTermId ? 'Save changes' : 'Create term' }}</button></footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import PublishedTermScheduleLink from '@/components/PublishedTermScheduleLink.vue'
import RoleSwitchButton from '@/components/RoleSwitchButton.vue'
import { initialsAvatar } from '@/utils/avatar.js'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const schoolYearOptions = ref([])
function refreshSchoolYearOptions() {
  const currentCalendarYear = new Date().getFullYear()
  schoolYearOptions.value = Array.from({ length: 10 }, (_, index) => {
    const startYear = currentCalendarYear + index
    return `SY${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`
  })
}
refreshSchoolYearOptions()
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
const workspacePendingMode = ref('')
const openingScheduleKey = ref('')
const previewSearch = ref('')
const previewPage = ref(1)
const previewPageSize = 4
const showTermModal = ref(false)
const editingTermId = ref('')
const editingTermSnapshot = ref('')
const modalStep = ref(1)
const termDetailsAttempted = ref(false)
const sectionCountsAttempted = ref(false)
const saving = ref(false)
const activeTermAction = ref('')
const statusToast = ref(null)
let statusToastTimer = null
let statusToastId = 0
const selectedRooms = ref([])
const roomSelectionAttempted = ref(false)
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
function isTermActionLoading(term, action) {
  return activeTermAction.value === `${termId(term)}:${action}`
}

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

function toggleAllRooms(event) {
  selectedRooms.value = event.target.checked ? [...allRoomNames.value] : []
}

function areFloorRoomsSelected(floor) {
  return floor.rooms.length > 0 && floor.rooms.every(room => selectedRooms.value.includes(room))
}

function areSomeFloorRoomsSelected(floor) {
  return floor.rooms.some(room => selectedRooms.value.includes(room)) && !areFloorRoomsSelected(floor)
}

function toggleFloorRooms(floor, event) {
  const floorRooms = new Set(floor.rooms)
  selectedRooms.value = event.target.checked
    ? [...new Set([...selectedRooms.value, ...floor.rooms])]
    : selectedRooms.value.filter(room => !floorRooms.has(room))
}

const filteredWorkspaceEntries = computed(() => workspaceEntries.value)

const filteredTerms = computed(() => terms.value
  .filter(term => {
    if (termFilter.value === 'current') return term.isPublished
    if (termFilter.value === 'archived') return !term.isPublished
    return true
  })
  .sort((first, second) => Number(Boolean(second.isPublished)) - Number(Boolean(first.isPublished))))
const sectionCount = (term, year) => Number(term?.sectionCounts?.[year] ?? term?.sectionNames?.[year]?.length ?? 0)
const sectionSummaryText = computed(() => {
  const parts = yearOptions
    .map((year) => `${year.replace(' Year', '')}: ${Number(form.sectionCounts[year]) || 0}`)
    .filter((part) => !part.endsWith(': 0'))
  return parts.length ? parts.join(' · ') : 'No sections configured'
})
const previewTargets = computed(() => {
  const query = previewSearch.value.toLowerCase()
  if (workspaceMode.value === 'room') {
    const source = [...new Set(termRooms(workspaceTerm.value))].map(room => ({ key: room, label: `Room ${room}`, initials: room, value: room }))
    return source
      .filter(target => target.label.toLowerCase().includes(query))
      .map(target => ({ ...target, entries: filteredWorkspaceEntries.value.filter(entry => entry.room === target.value) }))
  }
  if (workspaceMode.value === 'teacher') {
    const source = teachers.value.map(teacher => ({ key: teacher.id || teacher.name, label: teacher.name, initials: initials(teacher.name), avatar: teacher.avatar, value: teacher.name }))
    return source
      .filter(target => target.label.toLowerCase().includes(query))
      .map(target => ({ ...target, entries: filteredWorkspaceEntries.value.filter(entry => entry.teacher === target.value) }))
  }
  // student mode: group by year + section
  const groups = {}
  filteredWorkspaceEntries.value.forEach(entry => {
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
        const requestedMode = String(route.query.mode || '')
        if (['teacher', 'room', 'student'].includes(requestedMode)) chooseWorkspaceMode(requestedMode)
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
function limitSectionCountInput(event, year) {
  const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 2)
  event.target.value = digits
  form.sectionCounts[year] = digits === '' ? '' : Number(digits)
}
watch(() => ({ ...form.sectionCounts }), ensureSectionNames, { deep: true })

async function loadPage() {
  loading.value = true
  try {
    const [termResponse, teacherResponse] = await Promise.all([apiRequest('/academic-terms'), apiRequest('/users?role=teacher')])
    terms.value = termResponse.terms || []
    publishedTerm.value = terms.value.find(term => term.isPublished) || null
    teachers.value = (teacherResponse.users || []).filter(item => (Array.isArray(item.roles) ? item.roles.includes('teacher') : String(item.role).toLowerCase() === 'teacher') && String(item.account_status || 'Active') === 'Active').map(item => ({
      id: item._id || item.id,
      employeeId: item.employeeId || item.registeredId || '',
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      avatar: item.avatar || '',
      position: item.position || '',
      status: item.teacher_status || item.account_status || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
    })).filter(item => item.name).sort((a, b) => a.name.localeCompare(b.name))
    const requestedTermId = String(route.query.term || '').trim()
    const requestedTerm = terms.value.find(term => termId(term) === requestedTermId)
    if (requestedTerm && ['view', 'add'].includes(String(route.query.action || ''))) {
      openWorkspace(requestedTerm, String(route.query.action))
      const requestedMode = String(route.query.mode || '')
      if (['teacher', 'room', 'student'].includes(requestedMode)) await chooseWorkspaceMode(requestedMode)
    }
    return true
  } catch (error) {
    showStatusToast('error', error.message || 'Unable to load academic terms.')
    return false
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
  if (workspaceLoading.value) return
  workspacePendingMode.value = mode
  if (mode === 'student') {
    const requestedYear = String(route.query.year || '')
    studentYearSelection.value = yearOptions.includes(requestedYear) ? requestedYear : null
  }
  previewPage.value = 1
  previewSearch.value = ''
  workspaceLoading.value = true
  try {
    const response = await apiRequest(`/schedules?academicTermId=${encodeURIComponent(termId(workspaceTerm.value))}`)
    workspaceEntries.value = response.entries || []
    workspaceMode.value = mode
  } catch (error) {
    workspaceEntries.value = []
    workspaceMode.value = mode
    showStatusToast('error', error.message || 'Unable to load schedules for this term.')
  } finally {
    workspaceLoading.value = false
    workspacePendingMode.value = ''
  }
}

async function downloadTermExcel(term) {
  const academicTermId = termId(term)
  if (!academicTermId) return
  if (activeTermAction.value) return

  activeTermAction.value = `${academicTermId}:download`
  try {
    const XLSX = await import('xlsx-js-style')
    const [scheduleResponse, consultationResponse] = await Promise.all([
      apiRequest(`/schedules?academicTermId=${encodeURIComponent(academicTermId)}`),
      apiRequest(`/consultations?academicTermId=${encodeURIComponent(academicTermId)}`),
    ])
    const entries = Array.isArray(scheduleResponse.entries) ? scheduleResponse.entries : []
    const consultations = (Array.isArray(consultationResponse.consultations) ? consultationResponse.consultations : []).map(consultation => ({
      ...consultation,
      day: consultation.dayOfWeek,
      timeIn: consultation.startTime,
      timeOut: consultation.endTime,
      subject: 'Consultation Hours',
      teacher: consultation.teacher || 'CIT Faculty',
      entryType: 'consultation',
      color: 'color-blue',
    }))
    const exportEntries = [...entries, ...consultations]
    const loadByFaculty = new Map()

    entries.forEach(entry => {
      if (!entry?.teacher || entry.entryType === 'lunch') return
      const start = Number(entry.timeInMinutes)
      const end = Number(entry.timeOutMinutes)
      const minutes = Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0
      loadByFaculty.set(entry.teacher, (loadByFaculty.get(entry.teacher) || 0) + minutes / 60)
    })

    const headers = ['ID', 'No.', 'FULL NAME', 'POSITION', 'STATUS', 'START DATE', 'END DATE', 'TOTAL LOAD', 'TEACHING LOAD', 'OVERLOAD', 'DELOAD', 'MODULE WRITING']
    const facultyRows = teachers.value.map((teacher, index) => {
      const teachingLoad = Number((loadByFaculty.get(teacher.name) || 0).toFixed(2))
      return [
        teacher.employeeId,
        index + 1,
        teacher.name.toUpperCase(),
        teacher.position,
        '',
        teacher.startDate,
        teacher.endDate,
        teachingLoad,
        teachingLoad,
        0,
        0,
        0,
      ]
    })
    const totals = headers.map((_, index) => index >= 7 ? facultyRows.reduce((sum, row) => sum + (Number(row[index]) || 0), 0) : '')
    const matrix = [
      [],
      ['', termLabel(term)],
      headers,
      [],
      ['[AU] MAIN & SOUTH FULL-TIME FACULTY'],
      ...facultyRows,
      totals,
    ]
    const sheet = XLSX.utils.aoa_to_sheet(matrix)
    sheet['!merges'] = [
      { s: { r: 1, c: 1 }, e: { r: 1, c: headers.length - 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } },
    ]
    sheet['!cols'] = [
      { wch: 15 }, { wch: 7 }, { wch: 30 }, { wch: 28 }, { wch: 20 }, { wch: 16 },
      { wch: 18 }, { wch: 13 }, { wch: 15 }, { wch: 13 }, { wch: 12 }, { wch: 18 },
    ]
    sheet['!rows'] = [{ hpt: 8 }, { hpt: 24 }, { hpt: 52 }, { hpt: 8 }, { hpt: 20 }]
    sheet['!freeze'] = { xSplit: 2, ySplit: 5 }

    const border = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    }
    const headerStyle = { fill: { fgColor: { rgb: '365F91' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border }
    const loadHeaderStyle = { fill: { fgColor: { rgb: 'FFF2CC' } }, font: { bold: true, color: { rgb: '5A4300' }, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border }
    const bodyStyle = { font: { color: { rgb: '263238' }, sz: 9 }, alignment: { vertical: 'center', wrapText: true }, border }
    const groupStyle = { fill: { fgColor: { rgb: 'D9EAD3' } }, font: { bold: true, color: { rgb: '274E13' }, sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' }, border }
    const totalStyle = { fill: { fgColor: { rgb: 'FFF2CC' } }, font: { bold: true, color: { rgb: '5A4300' }, sz: 9 }, alignment: { horizontal: 'right', vertical: 'center' }, border }

    sheet.B2.s = { font: { bold: true, color: { rgb: '1F1F1F' }, sz: 14 }, alignment: { horizontal: 'left', vertical: 'center' } }
    headers.forEach((_, index) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: 2, c: index })]
      if (cell) cell.s = index >= 7 ? loadHeaderStyle : headerStyle
    })
    for (let column = 0; column < headers.length; column += 1) {
      const groupCell = sheet[XLSX.utils.encode_cell({ r: 4, c: column })]
      if (groupCell) groupCell.s = groupStyle
    }
    for (let row = 5; row < 5 + facultyRows.length; row += 1) {
      for (let column = 0; column < headers.length; column += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })]
        if (cell) cell.s = bodyStyle
      }
    }
    for (let column = 0; column < headers.length; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 5 + facultyRows.length, c: column })]
      if (cell) cell.s = totalStyle
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const slots = ['7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM']
    const toMinutes = (value) => {
      const match = String(value || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) return 0
      let hour = Number(match[1])
      const minute = Number(match[2])
      if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12
      if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0
      return hour * 60 + minute
    }
    const slotText = (entry) => [entry.subject || (entry.entryType === 'lunch' ? 'Lunch Break' : ''), entry.teacher || 'CIT Faculty', entry.room].filter(Boolean).join(' / ')
    const legend = [
      ['Lecture', 'color-yellow'],
      ['Laboratory', 'color-green'],
      ['CIT Faculty', 'color-pink'],
      ['Lunch', 'color-gray'],
      ['Consultation', 'color-blue'],
      ['Main Campus', 'color-orange'],
    ]
    const scheduleColors = {
      'color-green': { fill: 'D9EAD3', font: '274E13' },
      'color-yellow': { fill: 'FFF2CC', font: '5A4300' },
      'color-orange': { fill: 'FCE4D6', font: '7F4122' },
      'color-blue': { fill: 'CFE2F3', font: '1F4E79' },
      'color-gray': { fill: 'D9D9D9', font: '404040' },
      'color-pink': { fill: 'F4CCCC', font: '761C3B' },
      'color-purple': { fill: '7B5EA7', font: 'FFFFFF' },
      'color-red': { fill: 'E63946', font: 'FFFFFF' },
    }
    const entryColor = (entry) => {
      if (!entry?.teacher || entry.teacher === 'CIT Faculty') return scheduleColors['color-pink']
      return scheduleColors[entry?.color] || scheduleColors['color-yellow']
    }
    const gridGroups = (groups, bandLabel) => {
      const matrix = legend.map(([label]) => [label])
      const gridEntries = []
      groups.forEach(group => {
        matrix.push([])
        matrix.push([group.label])
        matrix.push([bandLabel])
        matrix.push(['Time', '', ...days])
        const dataStartRow = matrix.length
        const occupied = days.map(() => new Set())
        slots.forEach((slot, index) => {
          const start = toMinutes(slot)
          const end = start + 30
          const values = days.map(day => {
            const dayIndex = days.indexOf(day)
            if (occupied[dayIndex].has(index)) return ''
            const entry = group.entries.find(item => item.day === day && toMinutes(item.timeIn) >= start && toMinutes(item.timeIn) < end)
            if (!entry) return ''
            const span = Math.max(1, Math.ceil((toMinutes(entry.timeOut) - toMinutes(entry.timeIn)) / 30))
            for (let offset = 1; offset < span && index + offset < slots.length; offset += 1) occupied[dayIndex].add(index + offset)
            gridEntries.push({ row: dataStartRow + index, column: dayIndex + 2, span, entry })
            return slotText(entry)
          })
          matrix.push([slot, index + 1 < slots.length ? slots[index + 1] : '', ...values])
        })
      })
      const sheet = XLSX.utils.aoa_to_sheet(matrix)
      sheet.__gridEntries = gridEntries
      return sheet
    }
    const styleGridSheet = (gridSheet) => {
      gridSheet['!cols'] = [{ wch: 11 }, { wch: 11 }, ...days.map(() => ({ wch: 25 }))]
      gridSheet['!freeze'] = { xSplit: 2, ySplit: 8 }
      const range = XLSX.utils.decode_range(gridSheet['!ref'])
      for (let row = 0; row <= range.e.r; row += 1) {
        const firstValue = gridSheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v
        if (row < legend.length) {
          const legendColor = entryColor({ color: legend[row][1], teacher: 'legend' })
          for (let column = 0; column < 2; column += 1) {
            const cell = gridSheet[XLSX.utils.encode_cell({ r: row, c: column })]
            if (cell) cell.s = { fill: { fgColor: { rgb: legendColor.fill } }, font: { bold: true, color: { rgb: legendColor.font }, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border }
          }
          continue
        }
        const rowType = (row - legend.length) % (slots.length + 4)
        if (rowType === 1 || rowType === 2) {
          gridSheet['!merges'] = gridSheet['!merges'] || []
          gridSheet['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: days.length + 1 } })
        }
        for (let column = 0; column <= days.length + 1; column += 1) {
          const cell = gridSheet[XLSX.utils.encode_cell({ r: row, c: column })]
          if (!cell) continue
          if (rowType === 1 || rowType === 2) cell.s = groupStyle
          else if (rowType === 3) cell.s = loadHeaderStyle
          else if (row >= 8) cell.s = bodyStyle
        }
      }
      ;(gridSheet.__gridEntries || []).forEach(({ row, column, span, entry }) => {
        const color = entryColor(entry)
        const cell = gridSheet[XLSX.utils.encode_cell({ r: row, c: column })]
        if (cell) {
          cell.s = { fill: { fgColor: { rgb: color.fill } }, font: { bold: true, color: { rgb: color.font }, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border }
        }
        if (span > 1) {
          gridSheet['!merges'] = gridSheet['!merges'] || []
          gridSheet['!merges'].push({ s: { r: row, c: column }, e: { r: row + span - 1, c: column } })
        }
      })
      delete gridSheet.__gridEntries
    }
    const facultyGroups = teachers.value.map(teacher => ({ label: teacher.name, entries: exportEntries.filter(entry => entry.teacher === teacher.name) }))
    const unassignedEntries = exportEntries.filter(entry => !entry.teacher || entry.teacher === 'CIT Faculty')
    if (unassignedEntries.length) facultyGroups.push({ label: 'CIT Faculty', entries: unassignedEntries })
    const facultyScheduleSheet = gridGroups(facultyGroups, 'Faculty Schedule')
    const studentGroups = [...new Set(entries.filter(entry => entry.year || entry.section).map(entry => `${entry.year || 'Unknown'} · ${entry.section || 'Unassigned'}`))]
      .map(label => ({ label, entries: entries.filter(entry => `${entry.year || 'Unknown'} · ${entry.section || 'Unassigned'}` === label) }))
    const studentScheduleSheet = gridGroups(studentGroups, 'FACE-TO-FACE')
    styleGridSheet(facultyScheduleSheet)
    styleGridSheet(studentScheduleSheet)

    const scheduleColumns = ['Subj Code', 'Subj Desc', 'Section', 'Teacher', 'Lec Room', 'Lec Day', 'Lec S Time', 'Lec E Time', 'Session', 'Lab Room', 'Lab Day', 'Lab S Time', 'Lab E Time', 'Session']
    const splitSubject = (subject) => {
      const value = String(subject || '').trim()
      const separatorIndex = value.indexOf('|')
      if (separatorIndex < 0) return { code: '', description: value }
      return {
        code: value.slice(0, separatorIndex).trim(),
        description: value.slice(separatorIndex + 1).trim(),
      }
    }
    const scheduleRows = exportEntries.map(entry => {
      const subject = splitSubject(entry.subject)
      return [
      subject.code, subject.description, entry.section || '', entry.teacher || 'CIT Faculty', entry.roomType === 'Comlab/Laboratory' ? '' : entry.room || '',
      entry.roomType === 'Comlab/Laboratory' ? '' : entry.day || '', entry.roomType === 'Comlab/Laboratory' ? '' : entry.timeIn || '', entry.roomType === 'Comlab/Laboratory' ? '' : entry.timeOut || '',
      entry.roomType === 'Comlab/Laboratory' ? '' : 'Lec', entry.roomType === 'Comlab/Laboratory' ? entry.room || '' : '', entry.roomType === 'Comlab/Laboratory' ? entry.day || '' : '',
      entry.roomType === 'Comlab/Laboratory' ? entry.timeIn || '' : '', entry.roomType === 'Comlab/Laboratory' ? entry.timeOut || '' : '', entry.roomType === 'Comlab/Laboratory' ? 'Lab' : '',
      ]
    })
    const scheduleSheet = XLSX.utils.aoa_to_sheet([
      ['CLASS DETAILS', '', '', '', '', 'SESSION 1 : LEC', '', '', '', 'SESSION 1 : LAB', '', '', '', ''],
      scheduleColumns,
      ...scheduleRows,
    ])
    scheduleSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 0, c: 5 }, e: { r: 0, c: 8 } }, { s: { r: 0, c: 9 }, e: { r: 0, c: 13 } }]
    scheduleSheet['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    scheduleSheet['!freeze'] = { xSplit: 0, ySplit: 2 }
    for (let column = 0; column < scheduleColumns.length; column += 1) {
      const titleCell = scheduleSheet[XLSX.utils.encode_cell({ r: 0, c: column })]
      const headerCell = scheduleSheet[XLSX.utils.encode_cell({ r: 1, c: column })]
      if (titleCell) titleCell.s = groupStyle
      if (headerCell) headerCell.s = loadHeaderStyle
      for (let row = 2; row < scheduleRows.length + 2; row += 1) {
        const cell = scheduleSheet[XLSX.utils.encode_cell({ r: row, c: column })]
        if (cell) {
          const color = entryColor(exportEntries[row - 2])
          cell.s = { fill: { fgColor: { rgb: color.fill } }, font: { color: { rgb: color.font }, sz: 9 }, alignment: { vertical: 'center', wrapText: true }, border }
        }
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Faculty Loading')
    XLSX.utils.book_append_sheet(workbook, facultyScheduleSheet, 'Faculty Schedule')
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Schedule')
    XLSX.utils.book_append_sheet(workbook, studentScheduleSheet, 'Student Schedule')
    const safeTermLabel = termLabel(term).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
    XLSX.writeFile(workbook, `faculty-loading-${safeTermLabel || 'academic-term'}.xlsx`)
    showStatusToast('success', 'Excel workbook downloaded.')
  } catch (error) {
    showStatusToast('error', error.message || 'Unable to download the Excel workbook.')
  } finally {
    activeTermAction.value = ''
  }
}

async function downloadScheduleWorkbook(term) {
  const academicTermId = termId(term)
  if (!academicTermId) return

  const colors = {
    'color-green': { fill: '1F6B45', font: 'FFFFFF' },
    'color-yellow': { fill: 'E9C46A', font: '5A3E00' },
    'color-orange': { fill: 'F4A261', font: '5A2D00' },
    'color-blue': { fill: '4A90D9', font: 'FFFFFF' },
    'color-gray': { fill: '626C76', font: 'FFFFFF' },
    'color-purple': { fill: '7B5EA7', font: 'FFFFFF' },
    'color-red': { fill: 'E63946', font: 'FFFFFF' },
  }
  const columns = ['Name', 'Day', 'Start', 'End', 'Subject', 'Year', 'Section', 'Room', 'Type']
  const dayOrder = Object.fromEntries(weekdays.map((day, index) => [day, index]))

  try {
    Swal.fire({ title: 'Preparing Excel file', text: 'Loading this term\'s schedules…', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() })
    const XLSX = await import('xlsx-js-style')
    const response = await apiRequest(`/schedules?academicTermId=${encodeURIComponent(academicTermId)}`)
    const entries = Array.isArray(response.entries) ? response.entries : []
    const sortEntries = (first, second) => (dayOrder[first.day] ?? 99) - (dayOrder[second.day] ?? 99) || String(first.timeIn || '').localeCompare(String(second.timeIn || '')) || String(first.subject || '').localeCompare(String(second.subject || ''))
    const masterColumns = ['Faculty', 'Room', 'Year', 'Section', 'Day', 'Start', 'End', 'Subject', 'Type']
    const exportFormula = (sheetName, column, sourceRow) => {
      const source = "'Schedule Data'!"
      if (column === 'Name') {
        if (sheetName === 'Room') return `${source}B${sourceRow}`
        if (sheetName === 'Faculty') return `${source}A${sourceRow}`
        return `IF(AND(${source}C${sourceRow}<>"",${source}D${sourceRow}<>""),${source}C${sourceRow}&" · "&${source}D${sourceRow},IF(${source}C${sourceRow}<>"",${source}C${sourceRow},IF(${source}D${sourceRow}<>"",${source}D${sourceRow},"Unassigned group")))`
      }
      const sourceColumn = { Day: 'E', Start: 'F', End: 'G', Subject: 'H', Year: 'C', Section: 'D', Room: 'B', Type: 'I' }[column]
      return `${source}${sourceColumn}${sourceRow}`
    }
    const masterRows = entries.map(entry => ({
      Faculty: entry.teacher || '',
      Room: entry.room || '',
      Year: entry.year || '',
      Section: entry.section || '',
      Day: entry.day || '',
      Start: entry.timeIn || '',
      End: entry.timeOut || '',
      Subject: entry.subject || (entry.entryType === 'lunch' ? 'Lunch Break' : ''),
      Type: (() => {
        const type = String(entry.entryType || 'class').trim()
        return type.charAt(0).toUpperCase() + type.slice(1)
      })(),
      _color: colors[entry.color] || colors['color-yellow'],
    }))
    const rowFor = (nameKey) => entries
      .slice()
      .sort(sortEntries)
      .map(entry => ({
        Name: nameKey(entry),
        Day: entry.day || '',
        Start: entry.timeIn || '',
        End: entry.timeOut || '',
        Subject: entry.subject || (entry.entryType === 'lunch' ? 'Lunch Break' : ''),
        Year: entry.year || '',
        Section: entry.section || '',
        Room: entry.room || '',
        Type: (() => {
          const type = String(entry.entryType || 'class').trim()
          return type.charAt(0).toUpperCase() + type.slice(1)
        })(),
        _color: colors[entry.color] || colors['color-yellow'],
        _sourceRow: entries.indexOf(entry) + 2,
      }))

    const sheetDefinitions = [
      { name: 'Room', nameKey: entry => entry.room || 'Unassigned room' },
      { name: 'Student', nameKey: entry => [entry.year, entry.section].filter(Boolean).join(' · ') || 'Unassigned group' },
      { name: 'Faculty', nameKey: entry => entry.teacher || 'Unassigned faculty' },
    ]
    const workbook = XLSX.utils.book_new()
    workbook.Workbook = { CalcPr: { calcMode: 'auto', fullCalcOnLoad: true, forceFullCalc: true } }
    const masterSheet = XLSX.utils.json_to_sheet(masterRows, { header: masterColumns })
    const masterHeaderStyle = { fill: { fgColor: { rgb: '354653' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } }
    masterColumns.forEach((_, columnIndex) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: columnIndex })
      if (masterSheet[cell]) masterSheet[cell].s = masterHeaderStyle
    })
    masterRows.forEach((row, rowIndex) => {
      const style = { fill: { fgColor: { rgb: row._color.fill } }, font: { color: { rgb: row._color.font } } }
      masterColumns.forEach((_, columnIndex) => {
        const cell = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex })
        if (masterSheet[cell]) masterSheet[cell].s = style
      })
    })
    masterSheet['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 13 }, { wch: 18 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 30 }, { wch: 12 }]
    masterSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
    XLSX.utils.book_append_sheet(workbook, masterSheet, 'Schedule Data')
    const legendRows = [
      ['Color', 'Meaning'],
      ['Green', 'Laboratory'],
      ['Yellow', 'Lecture'],
      ['Orange', 'Main Campus'],
      ['Blue', 'Consultation'],
      ['Gray', 'Lunch'],
      ['Purple', 'Other schedule'],
      ['Red', 'Other schedule'],
    ]
    const legendSheet = XLSX.utils.aoa_to_sheet(legendRows)
    legendSheet['!cols'] = [{ wch: 16 }, { wch: 24 }]
    legendRows.forEach((row, rowIndex) => {
      const colorKey = rowIndex === 0 ? null : `color-${row[0].toLowerCase()}`
      const color = colorKey ? colors[colorKey] : null
      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
        if (legendSheet[cell]) legendSheet[cell].s = rowIndex === 0
          ? masterHeaderStyle
          : { fill: { fgColor: { rgb: color?.fill || 'FFFFFF' } }, font: { color: { rgb: color?.font || '000000' } } }
      }
    })
    XLSX.utils.book_append_sheet(workbook, legendSheet, 'Legend')
    const headerStyle = { fill: { fgColor: { rgb: '354653' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } }
    const titleStyle = { fill: { fgColor: { rgb: '1F6B45' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 }, alignment: { horizontal: 'left' } }
    sheetDefinitions.forEach(({ name, nameKey }) => {
      const groups = new Map()
      rowFor(nameKey).forEach(row => {
        if (!groups.has(row.Name)) groups.set(row.Name, [])
        groups.get(row.Name).push(row)
      })
      const matrix = []
      const titleRows = []
      const headerRows = []
      const dataRows = []
      groups.forEach((rows, groupName) => {
        titleRows.push(matrix.length)
        matrix.push([`${name} schedule: ${groupName}`])
        headerRows.push(matrix.length)
        matrix.push(columns)
        rows.forEach(row => {
          dataRows.push({ rowIndex: matrix.length, color: row._color })
          matrix.push(columns.map(column => ({ f: exportFormula(name, column, row._sourceRow) })))
        })
        matrix.push([])
      })
      if (!matrix.length) matrix.push([`No schedules found for this term.`])
      const sheet = XLSX.utils.aoa_to_sheet(matrix)
      titleRows.forEach(rowIndex => {
        sheet['!merges'] = sheet['!merges'] || []
        sheet['!merges'].push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: columns.length - 1 } })
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 })
        if (sheet[cell]) sheet[cell].s = titleStyle
      })
      headerRows.forEach(rowIndex => columns.forEach((_, columnIndex) => {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
        if (sheet[cell]) sheet[cell].s = headerStyle
      }))
      dataRows.forEach(({ rowIndex, color }) => {
        const style = { fill: { fgColor: { rgb: color.fill } }, font: { color: { rgb: color.font } } }
        columns.forEach((_, columnIndex) => {
          const cell = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
          if (sheet[cell]) sheet[cell].s = style
        })
      })
      sheet['!cols'] = [{ wch: 24 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 30 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(workbook, sheet, name)
    })

    const safeTermLabel = termLabel(term).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
    XLSX.writeFile(workbook, `schedules-${safeTermLabel || 'academic-term'}.xlsx`)
    Swal.close()
  } catch (error) {
    Swal.close()
    await Swal.fire({ icon: 'error', title: 'Unable to download schedules', text: error.message })
  }
}

async function openSchedule(target, targetKey = '') {
  if (openingScheduleKey.value) return
  openingScheduleKey.value = targetKey || String(target?.value || target?.key || 'schedule')
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
  try {
    await router.push({ path: workspaceAction.value === 'add' ? '/admin/schedule/add' : '/admin/schedule/view', query })
  } catch (error) {
    showStatusToast('error', error?.message || 'Unable to open this schedule.')
  } finally {
    openingScheduleKey.value = ''
  }
}
function resetForm() {
  form.schoolYear = ''; form.semester = ''; form.sectionCounts = {}; form.sectionNames = {}
  selectedRooms.value = []
  ensureSectionNames()
}
function getTermFormSnapshot() {
  return JSON.stringify({
    schoolYear: form.schoolYear,
    semester: form.semester,
    sectionCounts: yearOptions.map(year => [year, String(form.sectionCounts[year] ?? '')]),
    sectionNames: yearOptions.map(year => [year, (form.sectionNames[year] || []).map(name => String(name ?? '').trim())]),
    rooms: [...new Set(selectedRooms.value)].sort(),
  })
}
function openTermModal(term = null) {
  refreshSchoolYearOptions()
  resetForm()
  modalStep.value = 1
  termDetailsAttempted.value = false
  sectionCountsAttempted.value = false
  roomSelectionAttempted.value = false
  editingTermId.value = termId(term)
  editingTermSnapshot.value = ''
  if (term) {
    form.schoolYear = term.schoolYear || ''; form.semester = term.semester || ''
    form.sectionCounts = { ...(term.sectionCounts || {}) }
    form.sectionNames = Object.fromEntries(yearOptions.map(year => [year, [...(term.sectionNames?.[year] || [])]]))
    selectedRooms.value = termRooms(term)
    ensureSectionNames()
    editingTermSnapshot.value = getTermFormSnapshot()
  }
  showTermModal.value = true
}
function closeTermModal() { showTermModal.value = false; editingTermId.value = ''; editingTermSnapshot.value = ''; modalStep.value = 1; termDetailsAttempted.value = false; sectionCountsAttempted.value = false; roomSelectionAttempted.value = false }
async function nextModalStep() {
  if (modalStep.value === 1) {
    termDetailsAttempted.value = true
    if (!form.schoolYear || !form.semester) {
      return
    }
    if (!schoolYearOptions.value.includes(form.schoolYear)) {
      await Swal.fire({ icon: 'warning', title: 'Check the school year', text: 'Choose the current school year or a future school year.' })
      return
    }
  }
  if (modalStep.value === 2) {
    sectionCountsAttempted.value = true
    if (yearOptions.some(year => form.sectionCounts[year] === undefined || form.sectionCounts[year] === '')) return
    ensureSectionNames()
  }
  modalStep.value = Math.min(3, modalStep.value + 1)
}
async function saveTerm() {
  if (!form.schoolYear || !form.semester) return Swal.fire({ icon: 'warning', title: 'Missing details', text: 'School year and semester are required.' })
  if (!schoolYearOptions.value.includes(form.schoolYear)) return Swal.fire({ icon: 'warning', title: 'Invalid school year', text: 'Choose the current school year or a future school year.' })
  roomSelectionAttempted.value = true
  if (!selectedRooms.value.length) return
  ensureSectionNames()
  if (editingTermId.value && getTermFormSnapshot() === editingTermSnapshot.value) {
    showStatusToast('info', 'No changes made.')
    return
  }
  saving.value = true
  const payload = {
    schoolYear: form.schoolYear, semester: form.semester, sectionCounts: form.sectionCounts, sectionNames: form.sectionNames,
    rooms: selectedRooms.value.map(name => ({ name, type: 'Lecture' })), createdBy: user.name || user.email || 'Admin',
  }
  try {
    await apiRequest(editingTermId.value ? `/academic-terms/${editingTermId.value}` : '/academic-terms', { method: editingTermId.value ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
    const successMessage = editingTermId.value ? 'Academic term updated.' : 'Academic term created.'
    closeTermModal()
    const refreshed = await loadPage()
    if (!refreshed) showStatusToast('error', `${successMessage} The term list could not be refreshed.`)
    else showStatusToast('success', successMessage)
  } catch (error) { showStatusToast('error', error.message || 'Unable to save this academic term.') } finally { saving.value = false }
}
async function publishTerm(term) {
  if (activeTermAction.value) return
  const result = await Swal.fire({
    icon: 'question',
    title: `Publish ${termLabel(term)}?`,
    text: 'This becomes the current schedule for teachers and students.',
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: 'Publish',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#2f704b',
    cancelButtonColor: '#6c757d',
    background: '#fff',
    customClass: {
      popup: 'publish-confirm-popup',
      title: 'publish-confirm-title',
      icon: 'publish-confirm-icon',
      confirmButton: 'publish-confirm-button',
      cancelButton: 'publish-cancel-button',
    },
  })
  if (!result.isConfirmed) return
  activeTermAction.value = `${termId(term)}:publish`
  try {
    await apiRequest(`/academic-terms/${termId(term)}/publish`, { method: 'POST' })
    const refreshed = await loadPage()
    if (!refreshed) showStatusToast('error', 'Term published, but the term list could not be refreshed.')
    else showStatusToast('success', `${termLabel(term)} is now published.`)
  } catch (error) {
    showStatusToast('error', error.message || 'Unable to publish this academic term.')
  } finally {
    activeTermAction.value = ''
  }
}
function logoutAndLeave() { logout(); router.push('/') }

loadPage()
</script>

<style scoped>
*{box-sizing:border-box}.layout{display:flex;height:100vh;background:linear-gradient(135deg,#f4f6f7,#dfe3e5);font-family:Poppins,Arial,sans-serif;color:#111827}.sidebar{width:288px;min-width:288px;height:100vh;position:sticky;top:0;padding:24px 17px;display:flex;flex-direction:column;background:linear-gradient(145deg,#eef1f2,#c5cbd0);border-right:1px solid #aeb5ba;overflow:auto}.sidebar-profile{text-align:center;border-bottom:1px solid #aeb5ba;padding-bottom:18px;margin-bottom:15px}.avatar-wrap{width:78px;height:78px;border-radius:50%;overflow:hidden;margin:0 auto 8px;cursor:pointer;border:3px solid #fff}.avatar{width:100%;height:100%;object-fit:cover}.brand{font-weight:700}.role,.email{font-size:.76rem;color:#51606a}.email{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sidebar-nav{display:flex;flex-direction:column;gap:5px;flex:1}.nav-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:12px;text-decoration:none;color:#111827;font-size:.88rem;font-weight:600}.nav-item:hover,.nav-item.active{background:rgba(255,255,255,.75);box-shadow:inset 0 0 0 1px #fff}.nav-icon{display:flex}.logout-btn{border:0;border-radius:10px;padding:11px;background:#e63946;color:#fff;font:inherit;cursor:pointer}.main{flex:1;overflow:auto;padding:28px 40px 50px}.page-header,.section-heading,.workspace-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.page-header{margin-bottom:24px}.page-header h1{font-size:2rem;margin:0}.page-header p,.section-heading p,.workspace-heading p{margin:4px 0 0;color:#5e6870;font-size:.87rem}.primary-btn,.dark-btn{border:1px solid #263746;background:#344657;color:#fff;border-radius:9px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.terms-card,.workspace-card{background:rgba(255,255,255,.88);border:1px solid #fff;border-radius:17px;padding:23px;box-shadow:0 10px 30px rgba(34,45,55,.08)}.section-heading{align-items:center;margin-bottom:18px}.section-heading h2,.workspace-heading h2{margin:0;font-size:1.15rem}.term-filter{display:flex;gap:5px;background:#eef1f3;padding:4px;border-radius:10px}.term-filter button{border:0;background:transparent;padding:7px 12px;border-radius:7px;font:inherit;font-size:.75rem;cursor:pointer}.term-filter button.active{background:#fff;box-shadow:0 2px 8px #ccd2d6}.term-list{display:flex;flex-direction:column;gap:11px}.term-row{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px;border:1px solid #dce1e4;border-radius:12px;background:#fafbfc}.term-title{display:flex;align-items:center;gap:8px}.term-title h3{margin:0;font-size:.95rem}.term-summary p{margin:7px 0 3px;color:#53606a;font-size:.76rem}.term-summary small{color:#879097}.pill,.action-chip{border-radius:99px;padding:4px 9px;font-size:.65rem;font-weight:700}.pill.in-use{background:#d5f8df;color:#08752d}.pill.published{background:#dff1ff;color:#075f99}.term-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.term-actions button{border:1px solid #d4dade;background:#edf0f2;border-radius:8px;padding:8px 11px;font:inherit;font-size:.75rem;cursor:pointer}.term-actions .dark-btn{background:#303c47;color:#fff}.term-actions .publish-btn{background:#e4f4ff;color:#075f99}.term-actions button:disabled{opacity:.5;cursor:default}.workspace-heading{align-items:center;padding-bottom:18px;border-bottom:1px solid #e3e7e9}.back-btn{border:0;background:transparent;color:#3e586b;font:inherit;font-size:.78rem;cursor:pointer}.action-chip.view{background:#e4f4ff;color:#075f99}.action-chip.add{background:#dff7e7;color:#08752d}.mode-grid{display:grid;grid-template-columns:repeat(2,minmax(230px,290px));gap:24px;margin:35px auto;justify-content:center}.mode-card{min-height:220px;border:1px solid #fff;border-radius:16px;background:linear-gradient(145deg,#fff,#e7eaec);box-shadow:0 12px 25px rgba(30,45,55,.12);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:13px;font:inherit;cursor:pointer}.mode-card:hover{transform:translateY(-3px)}.mode-icon{width:65px;height:65px;display:grid;place-items:center;border-radius:50%;background:#e6eaed;color:#30465a}.mode-icon :deep(svg){width:31px;height:31px}.mode-card small{max-width:210px;color:#66717a}.preview-toolbar{display:flex;align-items:flex-end;justify-content:space-between;margin:18px 0}.preview-search{display:flex;flex-direction:column;gap:4px;font-size:.7rem;color:#59656e}.preview-search input{width:260px;border:1px solid #ccd3d7;border-radius:8px;padding:9px 11px;font:inherit}.preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.preview-card{text-align:left;border:1px solid #d8dfe3;border-radius:14px;padding:15px;background:linear-gradient(145deg,#fff,#f0f2f3);font:inherit;cursor:pointer}.preview-card:hover{border-color:#718291;box-shadow:0 8px 20px rgba(30,45,55,.1)}.preview-card-head{display:flex;align-items:center;gap:10px}.preview-avatar{width:39px;height:39px;border-radius:50%;display:grid;place-items:center;background:#dce5eb;color:#2d4658;font-size:.7rem;font-weight:700}.preview-card-head div{display:flex;flex:1;flex-direction:column}.preview-card-head strong{font-size:.85rem}.preview-card-head small{font-size:.66rem;color:#7b858c}.open-arrow{font-size:1.2rem}.mini-schedule{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin:13px 0}.mini-day{min-height:75px;padding:5px 3px;background:#e9edef;border-radius:5px;overflow:hidden}.mini-day b{display:block;font-size:.55rem;color:#56636d;margin-bottom:4px}.mini-day span{display:block;background:#526474;color:#fff;border-radius:3px;padding:3px;margin-bottom:2px;font-size:.45rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mini-day em{font-size:.55rem;color:#9aa1a6}.preview-action{font-size:.68rem;color:#35566d;font-weight:600}.preview-pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:18px;font-size:.75rem}.preview-pagination button{width:32px;height:30px;border:1px solid #d3dade;border-radius:7px;background:#fff}.empty-state{text-align:center;color:#7b858c;padding:45px}.modal-overlay{position:fixed;inset:0;background:rgba(13,22,29,.58);z-index:1000;display:grid;place-items:center;padding:22px}.term-modal{width:min(1050px,96vw);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:17px;box-shadow:0 25px 70px rgba(0,0,0,.3)}.term-modal>header,.term-modal>footer{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e5e8ea}.term-modal>header h2{margin:0}.term-modal>header p{margin:3px 0 0;color:#748089;font-size:.78rem}.term-modal>footer{border-top:1px solid #e5e8ea;border-bottom:0;justify-content:flex-end;gap:9px}.modal-close{border:0;background:transparent;font-size:1.7rem;cursor:pointer}.modal-body{padding:20px 22px;overflow:auto}.two-columns,.count-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.two-columns label,.count-grid label,.name-grid label{display:flex;flex-direction:column;gap:5px;font-size:.72rem;font-weight:600}.two-columns input,.two-columns select,.count-grid input,.name-grid input{border:1px solid #ccd4d9;border-radius:8px;padding:9px;font:inherit}.form-section{margin-top:20px}.form-section h3{font-size:.88rem;margin:0 0 10px}.count-grid{grid-template-columns:repeat(4,1fr)}.name-groups{display:flex;flex-direction:column;gap:13px}.name-group>strong,.room-group>strong{display:block;font-size:.76rem;margin-bottom:7px}.name-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.room-group{margin-bottom:13px}.room-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.room-grid label{display:flex;align-items:center;gap:5px;padding:8px;border:1px solid #dce1e4;border-radius:8px;font-size:.7rem}.room-grid label.selected{background:#e9f3ee;border-color:#87a99a}.room-grid select{min-width:0;width:80px;margin-left:auto;border:1px solid #ccd4d9;border-radius:5px;font-size:.62rem}.cancel-btn{border:1px solid #d4dade;background:#fff;border-radius:9px;padding:10px 16px;font:inherit;cursor:pointer}@media(max-width:900px){.sidebar{display:none}.main{padding:22px 16px}.term-row{align-items:flex-start;flex-direction:column}.term-actions{justify-content:flex-start}.preview-grid,.mode-grid{grid-template-columns:1fr}.count-grid,.name-grid,.room-grid{grid-template-columns:repeat(2,1fr)}.two-columns{grid-template-columns:1fr}.preview-toolbar{align-items:flex-start;flex-direction:column;gap:10px}.preview-search input{width:100%}}
.field-help{margin:-4px 0 10px;color:#748089;font-size:.72rem}
/* Academic terms readability refresh */
.main { padding: 24px 42px 56px; }
.page-header { align-items: center; margin-bottom: 28px; }
.page-eyebrow { display: block; margin-bottom: 5px; color: #68747d; font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.page-header h1 { color: #1f2933; font-size: clamp(2rem, 3vw, 2.65rem); font-weight: 800; letter-spacing: -.04em; line-height: 1.08; }
.page-header p { max-width: 670px; margin-top: 9px; color: #66727c; font-size: .94rem; line-height: 1.55; }
.new-term-btn { display: inline-flex; align-items: center; gap: 9px; min-height: 48px; padding: 0 20px; border-radius: 12px; box-shadow: 0 9px 20px rgba(37, 48, 58, .2); }
.new-term-btn span { font-size: 1.35rem; font-weight: 400; line-height: 1; }
.terms-card { padding: 28px; border-radius: 20px; box-shadow: 0 14px 38px rgba(40, 52, 61, .1); border-color: rgba(145, 155, 162, .22); }
.section-heading { padding-bottom: 21px; border-bottom: 1px solid #e3e7ea; }
.section-heading h2 { color: #202830; font-size: 1.35rem; letter-spacing: -.02em; }
.section-heading p { margin-top: 6px; color: #6b7680; font-size: .83rem; }
.term-filter { padding: 5px; gap: 3px; border: 1px solid #e1e5e8; border-radius: 12px; background: #f1f3f5; }
.term-filter button { min-height: 36px; padding: 7px 14px; color: #59646e; font-size: .74rem; font-weight: 600; }
.term-filter button.active { color: #1f2933; box-shadow: 0 3px 10px rgba(39, 49, 57, .12); }
.term-list { gap: 14px; }
.term-row { position: relative; align-items: stretch; min-height: 170px; padding: 22px; overflow: hidden; border: 1px solid #dce2e6; border-radius: 16px; background: linear-gradient(135deg, #fcfcfc 0%, #f1f4f5 100%); transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.term-row:hover { border-color: #b9c4cc; box-shadow: 0 10px 25px rgba(41, 52, 60, .09); transform: translateY(-1px); }
.term-row.is-published { border-color: #a7cab0; background: linear-gradient(110deg, #fbfefc 0%, #edf7f2 100%); }
.term-row.is-published::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: linear-gradient(180deg, #4a9b6c, #2c6a4b); }
.term-summary { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.term-title { flex-wrap: wrap; gap: 10px; }
.term-title h3 { color: #202830; font-size: 1.08rem; letter-spacing: -.01em; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 999px; }
.pill.published { color: #14643c; background: #dff4e7; }
.pill.draft { color: #69747d; background: #edf0f2; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #238354; box-shadow: 0 0 0 3px rgba(35, 131, 84, .12); }
.term-guidance { margin: 7px 0 17px !important; color: #717c85 !important; font-size: .76rem !important; }
.term-metrics { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
.term-metric { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px 5px 6px; color: #64707a; border: 1px solid #e2e6e9; border-radius: 999px; background: #f8fafb; font-size: .68rem; white-space: nowrap; }
.term-metric b { display: inline-grid; width: 25px; height: 25px; flex: 0 0 25px; place-items: center; color: #47545e; border-radius: 50%; background: #e8ecef; font-size: .72rem; font-weight: 800; }
.section-metric--year-1 b { color: #286647; background: #dff0e6; }
.section-metric--year-2 b { color: #285f85; background: #e0edf6; }
.section-metric--year-3 b { color: #8a5a16; background: #f8eedb; }
.section-metric--year-4 b { color: #8f3e5b; background: #f5e4eb; }
.room-metric { color: #476579; border-color: #cddfe8; background: #f1f7fa; }
.room-metric b { color: #375e70; background: #e0ebf0; }
.term-actions { display: grid; width: min(330px, 36%); grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: center; align-items: center; justify-content: flex-end; }
.term-actions__label { grid-column: 1 / -1; margin: 0 0 2px 2px; color: #818b93; font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.term-actions button { display: inline-flex; min-height: 42px; padding: 9px 12px; align-items: center; justify-content: flex-start; gap: 8px; color: #39444d; border: 1px solid #d7dde1; border-radius: 10px; background: linear-gradient(180deg, #f8f9fa, #eef1f3); font-size: .7rem; font-weight: 600; text-align: left; transition: transform .15s ease, background .15s ease, border-color .15s ease; }
.term-actions button svg { width: 17px; height: 17px; flex: 0 0 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.term-actions button:hover:not(:disabled) { border-color: #aeb9c0; background: linear-gradient(180deg, #ffffff, #f3f5f6); transform: translateY(-1px); }
.term-actions button:focus-visible { outline: 3px solid rgba(50, 80, 98, .2); outline-offset: 2px; }
.term-actions .view-btn { color: #fff; border-color: #354653; background: linear-gradient(180deg, #526271, #374755); }
.term-actions .view-btn:hover:not(:disabled) { color: #fff; background: linear-gradient(180deg, #3b4f5f, #263744); }
.term-actions .add-btn { color: #315e47; border-color: #bed4c8; background: linear-gradient(180deg, #f0faf3, #e3f4ea); }
.term-actions .excel-btn { color: #176a94; border-color: #b9d7e6; background: linear-gradient(180deg, #f3fbff, #e6f4fb); }
.term-actions .publish-btn { grid-column: 1 / -1; justify-content: center; color: #176a94; border-color: #b9d7e6; background: linear-gradient(180deg, #f3fbff, #e6f4fb); }
.term-actions .publish-btn:disabled { color: #668176; border-color: #cfddd5; background: linear-gradient(180deg, #edf7f1, #e2efe5); opacity: 1; }
.empty-state { border: 1px dashed #ccd4d9; border-radius: 14px; background: #f8fafb; }

/* Schedule browser: compact, high-contrast metallic workspace */
.workspace-card {
  padding: 0;
  overflow: hidden;
  border-color: rgba(255, 255, 255, .9);
  max-width: 1180px;
  margin: 0 auto;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(250, 251, 251, .96), rgba(227, 233, 237, .95));
  box-shadow: 0 18px 44px rgba(39, 46, 52, .13), inset 0 1px 0 #fff;
}
.workspace-heading {
  display: flex;
  align-items: center;
  min-height: 96px;
  padding: 20px 26px;
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
  display: grid;
  width: min(980px, calc(100% - 64px));
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 34px auto 40px;
  align-items: stretch;
}
.mode-card {
  display: flex;
  position: relative;
  min-height: 170px;
  width: 100%;
  padding: 24px 26px;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 22px;
  color: #283139;
  border: 1px solid #dfe3e7;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7f8f8 0%, #f1f3f4 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 10px 22px rgba(40, 48, 54, .08);
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.mode-card:hover {
  border-color: #8e9aa3;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 14px 28px rgba(40, 48, 54, .12);
  transform: translateY(-2px);
}
.mode-icon {
  display: flex;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  align-items: center;
  justify-content: center;
  color: #f4f7f8;
  border: 1px solid #4a535c;
  border-radius: 16px;
  background: linear-gradient(145deg, #5e6972, #2c353d);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 9px 16px rgba(42, 49, 56, .18);
}
.mode-icon :deep(svg) { width: 26px; height: 26px; stroke-width: 1.8; }
.mode-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: flex-start;
}
.mode-copy strong {
  color: #222b31;
  font-size: 1.05rem;
  letter-spacing: -.015em;
  line-height: 1.2;
}
.mode-card .mode-copy small {
  max-width: 260px;
  color: #68747d;
  font-size: .78rem;
  line-height: 1.55;
}
.mode-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  min-width: 20px;
  color: #535f68;
  font-size: 1.65rem;
  line-height: 1;
  transition: transform .18s ease, color .18s ease;
}
.mode-card:hover .mode-arrow {
  color: #1f2933;
  transform: translateX(3px);
}
.preview-toolbar {
  align-items: center;
  gap: 24px;
  margin: 0;
  padding: 14px 24px;
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
.schedule-type-filter {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px;
  border: 1px solid #d5dce0;
  border-radius: 10px;
  background: #edf1f3;
}
.schedule-type-filter button {
  min-height: 32px;
  padding: 6px 11px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #63717a;
  font: inherit;
  font-size: .68rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background .16s ease, color .16s ease, box-shadow .16s ease;
}
.schedule-type-filter button:hover { color: #27343c; background: rgba(255,255,255,.7); }
.schedule-type-filter button.active {
  color: #fff;
  background: linear-gradient(145deg, #687780, #3f4b54);
  box-shadow: 0 3px 8px rgba(39, 49, 57, .16);
}
.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 22px 24px 28px;
  background: linear-gradient(180deg, #eef1f3 0%, #f6f7f8 100%);
  border-top: 1px solid #e0e5e8;
}
.preview-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 82px;
  padding: 15px 16px;
  overflow: hidden;
  color: #283139;
  border-color: #d6dde1;
  border-radius: 14px;
  background: linear-gradient(145deg, #fff 0%, #f4f5f6 100%);
  box-shadow: 0 5px 14px rgba(41, 49, 55, .055), inset 0 1px 0 #fff;
  transition: border-color .17s ease, box-shadow .17s ease, transform .17s ease;
}
.preview-card:hover {
  border-color: #909ca4;
  box-shadow: 0 11px 23px rgba(38, 47, 53, .12), inset 0 1px 0 #fff;
  transform: translateY(-2px);
}
.preview-card:disabled { cursor: progress; opacity: .72; transform: none; }
.preview-card:disabled:hover { border-color: #d6dde1; box-shadow: 0 5px 14px rgba(41, 49, 55, .055), inset 0 1px 0 #fff; }
.preview-card:focus-visible { outline: 3px solid rgba(49, 72, 86, .19); outline-offset: 2px; }
.preview-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
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
.mini-schedule {
  display: grid;
  gap: 5px;
  margin: 16px 0 13px;
}
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

.section-grid {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.section-selection-toolbar {
  grid-column: 1 / -1;
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  justify-content: flex-start;
  padding: 0 0 4px;
  border-bottom: 1px solid #dce2e5;
}
.section-selection-toolbar .back-btn { flex: 0 0 auto; }
.section-selection-toolbar > div { margin-left: 2px !important; }
.section-grid .preview-card { min-height: 76px; }
.preview-toolbar__intro > div strong { color: #27343c; font-size: .9rem; }
.preview-toolbar__intro > div small { color: #73808a !important; font-size: .68rem; }
.preview-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 58px;
  border-top: 1px solid #dde3e6;
  background: #f7f8f9;
  color: #65717a;
  font-size: .7rem;
  font-weight: 700;
}
.preview-pagination button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 1px solid #c5ced3;
  border-radius: 8px;
  background: linear-gradient(145deg, #fff, #e4e8ea);
  color: #4b5962;
  font-weight: 800;
  cursor: pointer;
}
.preview-pagination button:not(:disabled):hover { border-color: #7d8a93; background: #fff; }
.preview-pagination button:disabled { cursor: not-allowed; opacity: .45; }
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
@media (max-width: 1200px) {
  .main { padding-inline: 28px; }
  .terms-card { padding: 24px; }
  .page-header h1 { font-size: clamp(1.8rem, 3vw, 2.25rem); }
  .page-header p { font-size: .82rem; }
  .new-term-btn { min-height: 42px; padding-inline: 14px; font-size: .8rem; white-space: nowrap; }
  .term-row { flex-direction: column; padding: 18px; }
  .term-actions { width: min(100%, 480px); margin-top: 4px; }
  .term-actions button { min-height: 38px; padding: 7px 9px; gap: 6px; font-size: .64rem; }
  .term-actions button svg { width: 15px; height: 15px; flex-basis: 15px; }
  .mode-grid { width: min(980px, calc(100% - 40px)); gap: 12px; }
  .mode-card { min-height: 145px; padding: 18px; gap: 14px; }
  .mode-card .mode-copy small { font-size: .7rem; line-height: 1.4; }
}
@media (max-width: 1100px) {
  .term-row { flex-direction: column; }
  .term-actions { width: min(100%, 480px); justify-content: flex-start; }
}
@media (max-width: 920px) {
  .mode-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .preview-grid { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
  .mode-grid { grid-template-columns: 1fr; }
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
  .schedule-type-filter { width: 100%; overflow-x: auto; }
  .schedule-type-filter button { flex: 1 0 auto; }
  .preview-search { margin-left: 0; align-items: stretch; flex-direction: column; }
  .preview-search input { width: 100%; }
  .preview-grid { padding: 18px 20px 24px; }
  .section-grid { grid-template-columns: 1fr; }
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
.term-modal { width: min(980px, 96vw); max-height: 92vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,.8); border-radius: 22px; box-shadow: 0 30px 90px rgba(0,0,0,.38); }
.term-modal > header { flex: 0 0 auto; padding: 24px 28px 21px; background: linear-gradient(135deg, #fff, #f5f7f8); }
.term-modal > header h2 { color: #202830; font-size: 1.55rem; letter-spacing: -.03em; }
.term-modal > header p { max-width: 650px; margin-top: 7px; color: #65727c; font-size: .86rem; line-height: 1.55; }
.modal-eyebrow { display: block; margin-bottom: 5px; color: #667781; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.modal-close { display: grid; width: 38px; height: 38px; place-items: center; padding: 0; color: #59636b; border-radius: 10px; line-height: 1; }
.modal-close:hover { color: #202830; background: #e9edef; }
.modal-close:focus-visible { outline: 3px solid rgba(49, 75, 91, .2); }
.term-stepper { display: flex; width: 100%; box-sizing: border-box; flex: 0 0 auto; align-items: center; gap: 14px; padding: 18px 32px; border-top: 1px solid #e5e9eb; border-bottom: 1px solid #dce2e5; background: linear-gradient(180deg, #fbfcfc, #f1f4f5); }
.term-stepper__item { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 10px; color: #7a858d; font-size: .78rem; font-weight: 750; white-space: nowrap; }
.term-stepper__item.is-done { color: #344957; cursor: pointer; }
.term-stepper__item b { display: grid; width: 34px; height: 34px; place-items: center; color: #69757d; border: 1px solid #c7d0d5; border-radius: 50%; background: #fff; font-size: .78rem; box-shadow: 0 3px 8px rgba(45,58,67,.08); }
.term-stepper__item.is-active { color: #344957; }
.term-stepper__item.is-active b { color: #fff; border-color: #344957; background: linear-gradient(145deg, #687985, #344957); box-shadow: 0 5px 12px rgba(52,73,87,.24); }
.term-stepper__item.is-done b { color: #fff; border-color: #71818b; background: #71818b; }
.term-stepper > i { width: auto; height: 2px; flex: 1 1 auto; border-radius: 2px; background: #cbd4d9; }
.term-progress-summary { display: flex; align-items: center; gap: 7px; min-height: 34px; padding: 7px 28px; color: #4c5c65; border-bottom: 1px solid #e1e6e8; background: #fff; font-size: .72rem; }
.term-progress-summary__label { color: #8a959c; font-size: .62rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.term-progress-summary strong { color: #344957; }
.term-progress-summary__divider { color: #a6b0b5; }
.modal-body { flex: 0 1 auto; min-height: 0; max-height: calc(92vh - 220px); overflow-y: auto; padding: 24px 28px 34px; background: #f4f6f7; scrollbar-width: thin; scrollbar-color: #aebbc3 transparent; }
.modal-body::-webkit-scrollbar { width: 7px; }
.modal-body::-webkit-scrollbar-thumb { border-radius: 8px; background: #aebbc3; }
.setup-section { margin: 0 0 18px; padding: 26px; border: 1px solid #dfe4e7; border-radius: 17px; background: #fff; box-shadow: 0 7px 20px rgba(41, 51, 58, .07); }
.setup-section:last-child { margin-bottom: 0; }
.setup-section__heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
.setup-section__heading h3 { margin: 1px 0 4px; color: #222b32; font-size: 1.12rem; }
.setup-section__heading p { margin: 0; color: #6f7b84; font-size: .82rem; line-height: 1.5; }
.step-number { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; color: #fff; border-radius: 10px; background: linear-gradient(145deg, #687985, #344957); box-shadow: 0 5px 12px rgba(52,73,87,.18); font-size: .82rem; font-weight: 800; }
.room-heading .selection-count { margin-left: auto; }
.selection-count { padding: 6px 9px; color: #356047; border: 1px solid #c8ddd0; border-radius: 999px; background: #edf7f1; font-size: .64rem; font-weight: 700; white-space: nowrap; }
.selection-count.is-invalid { color: #a51f1f; border-color: #d98a8a; background: #fff0f0; }
.room-selection-error { margin: -8px 0 16px; padding: 9px 12px; color: #a51f1f; border: 1px solid #e2a0a0; border-radius: 8px; background: #fff4f4; font-size: .72rem; font-weight: 650; }
.select-all-rooms { display: flex; align-items: center; gap: 11px; margin: -2px 0 18px; padding: 12px 14px; color: #46535c; border: 1px solid #d7dfe3; border-radius: 11px; background: #f7f9fa; cursor: pointer; transition: border-color .15s, background .15s; }
.select-all-rooms:hover { border-color: #aebdc5; background: #fff; }
.select-all-rooms.selected { color: #26543a; border-color: #9fc6ae; background: #eaf6ee; }
.select-all-rooms input { width: 17px; height: 17px; flex: 0 0 17px; accent-color: #35684b; }
.select-all-rooms > span { display: flex; flex-direction: column; gap: 2px; }
.select-all-rooms strong { font-size: .76rem; }
.select-all-rooms small { color: #7b858d; font-size: .65rem; }
.two-columns label,.count-grid label,.name-grid label { gap: 7px; color: #3d4850; font-size: .75rem; font-weight: 650; }
.two-columns input,.two-columns select,.count-grid input,.name-grid input { min-height: 43px; padding: 10px 12px; color: #202830; border-color: #cfd7dc; background: #fbfcfc; font-size: .78rem; font-weight: 500; transition: border-color .15s, box-shadow .15s, background .15s; }
.two-columns label.is-invalid { color: #3d4850; }
.two-columns label.is-invalid select { border-color: #b52222; background: #fff5f5; box-shadow: 0 0 0 3px rgba(181, 34, 34, .2); }
.count-grid label.is-invalid { color: #3d4850; }
.count-grid label.is-invalid input { border-color: #b52222; background: #fff5f5; box-shadow: 0 0 0 3px rgba(181, 34, 34, .2); }
.field-error-hint { margin-top: -2px; color: #a51f1f; font-size: .68rem; font-weight: 650; }
.two-columns input:focus,.two-columns select:focus,.count-grid input:focus,.name-grid input:focus { outline: none; border-color: #708592; background: #fff; box-shadow: 0 0 0 3px rgba(73, 99, 114, .12); }
.two-columns input::placeholder,.count-grid input::placeholder,.name-grid input::placeholder { color: #a0a8ae; }
.count-grid { gap: 10px; }
.name-groups { margin-top: 20px; padding-top: 18px; gap: 16px; border-top: 1px solid #e6e9eb; }
.name-group { padding: 15px; border: 1px solid #e1e6e9; border-radius: 12px; background: #f8fafb; }
.name-group > strong { margin-bottom: 11px; color: #354149; font-size: .8rem; }
.inline-empty { margin-top: 18px; padding: 13px 15px; color: #707c85; border: 1px dashed #ccd5da; border-radius: 10px; background: #f8fafb; font-size: .76rem; }
.room-group { margin-bottom: 18px; }
.room-group:last-child { margin-bottom: 0; }
.room-group-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
.room-group-heading > strong { color: #3d4951; font-size: .79rem; }
.select-floor-rooms { display: inline-flex; align-items: center; gap: 6px; color: #63717a; cursor: pointer; font-size: .68rem; font-weight: 600; }
.select-floor-rooms input { width: 15px; height: 15px; margin: 0; accent-color: #35684b; }
.select-floor-rooms.selected,.select-floor-rooms.partial { color: #26543a; }
.room-grid { gap: 8px; }
.room-grid label { min-height: 39px; padding: 8px 10px; color: #536069; border-color: #dce2e5; background: #fafbfc; cursor: pointer; transition: border-color .15s, background .15s, transform .15s; }
.room-grid label:hover { border-color: #aebbc3; background: #fff; transform: translateY(-1px); }
.room-grid label.selected { color: #24543a; border-color: #9fc6ae; background: #eaf6ee; box-shadow: inset 0 0 0 1px rgba(69, 128, 91, .08); }
.room-grid input { accent-color: #35684b; }
.term-modal > footer { flex: 0 0 auto; gap: 10px; padding: 16px 28px; border-top: 1px solid #e0e5e8; background: rgba(255,255,255,.98); box-shadow: 0 -8px 24px rgba(41, 50, 57, .07); }
.footer-help { margin-right: auto; color: #78838b; font-size: .74rem; }
.term-modal > footer button { min-height: 40px; padding: 9px 17px; border-radius: 10px; font-size: .78rem; font-weight: 650; line-height: 1; }
.term-modal > footer .cancel-btn { color: #46515a; border-color: #cfd6da; background: #fff; }
.term-modal > footer .cancel-btn:hover { border-color: #aeb9bf; background: #f5f7f8; }
.step-back-btn { margin-left: 0; }
.save-term-btn { min-width: 124px; border-color: #344957; background: #344957; box-shadow: 0 6px 14px rgba(42, 61, 73, .18); }
.save-term-btn:hover:not(:disabled) { background: #263b49; transform: translateY(-1px); }
.save-term-btn:disabled { opacity: .65; cursor: wait; }
@media (max-width: 700px) {
  .modal-overlay { padding: 0; }
  .term-modal { width: 100%; max-height: 100vh; border-radius: 0; }
  .term-modal > header,.modal-body,.term-modal > footer { padding-inline: 18px; }
  .term-stepper { gap: 8px; padding: 15px 18px; }
  .term-stepper__item { gap: 0; }
  .term-stepper__item b { width: 30px; height: 30px; }
  .term-stepper__item span { display: none; }
  .term-stepper > i { flex: 1; }
  .setup-section { padding: 17px 14px; }
  .count-grid,.name-grid,.room-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .footer-help { display: none; }
}

.term-status-toast {
  position: fixed;
  z-index: 2000;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  display: flex;
  width: min(380px, calc(100vw - 32px));
  align-items: center;
  gap: 11px;
  padding: 13px 16px;
  border: 1px solid #d8dee2;
  border-radius: 12px;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 12px 34px rgba(27, 37, 45, .18);
  color: #303a42;
  font-size: .82rem;
  font-weight: 600;
  line-height: 1.45;
}
.term-status-toast__icon {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border-radius: 50%;
  background: #edf0f2;
  color: #303a42;
  font-size: .82rem;
  font-weight: 800;
}
.term-status-toast.is-info .term-status-toast__icon,
.term-status-toast.is-error .term-status-toast__icon {
  color: #c97818;
}
.mode-card:disabled { cursor: wait; }
.mode-card.is-loading { border-color: #c8d0d5; background: linear-gradient(145deg, #f7f8f9, #e3e7e9); }
.mode-card.is-loading .mode-arrow { color: #53616b; font-size: .78rem; font-weight: 700; }
.mode-loading-note { grid-column: 1 / -1; margin: -19px 0 25px; color: #69757d; text-align: center; font-size: .78rem; font-weight: 600; }
.term-status-toast.is-success { border-left: 3px solid #547b66; }
.term-status-toast.is-info { border-left: 3px solid #7b8790; }
.term-status-toast.is-error { border-left: 3px solid #a84c4c; }
.term-toast-enter-active,
.term-toast-leave-active { transition: opacity .18s ease, transform .18s ease; }
.term-toast-enter-from,
.term-toast-leave-to { opacity: 0; transform: translateY(-8px); }
.term-actions button.is-loading { cursor: progress; opacity: .78; }
.term-actions button:disabled { cursor: wait; }

@media (max-width: 600px) {
  .term-status-toast {
    top: max(12px, env(safe-area-inset-top));
    right: 12px;
    width: min(360px, calc(100vw - 24px));
    padding: 12px 14px;
    font-size: .78rem;
  }
}
:global(.publish-confirm-popup) {
  width: min(460px, calc(100vw - 32px)) !important;
  padding: 22px 30px 20px !important;
  border-radius: 20px !important;
  box-shadow: 0 16px 48px rgba(24, 30, 36, .2) !important;
}
:global(.publish-confirm-popup .swal2-icon) {
  width: 76px !important;
  height: 76px !important;
  margin: 4px auto 6px !important;
}
:global(.publish-confirm-popup .swal2-title) {
  margin: 0 0 4px !important;
  color: #34383d !important;
  font-size: 1.3rem !important;
  font-weight: 700 !important;
}
:global(.publish-confirm-popup .swal2-html-container) {
  margin: .25em 0 .65em !important;
  color: #45494e !important;
  font-size: 1rem !important;
  line-height: 1.5 !important;
}
:global(.publish-confirm-popup .swal2-actions) {
  display: flex;
  width: 100%;
  justify-content: center;
  gap: 10px;
  margin-top: .5em;
}
:global(.publish-confirm-button),
:global(.publish-cancel-button) {
  flex: 1 1 0;
  min-height: 42px;
  margin: 0 !important;
  padding: 8px 12px !important;
  border-radius: 9px !important;
  font-size: .88rem !important;
  font-weight: 600 !important;
}
:global(.publish-confirm-button) {
  border: 1px solid #24583b !important;
  background: #2f704b !important;
  color: #fff !important;
  box-shadow: 0 4px 10px rgba(36, 88, 59, .22) !important;
}
:global(.publish-confirm-button:hover) { background: #24583b !important; filter: none !important; }
:global(.publish-cancel-button) {
  border: 1px solid #e2e3e5 !important;
  background: #e9eaec !important;
  color: #363a3e !important;
  box-shadow: none !important;
}
:global(.publish-cancel-button:hover) { background: #dcdfe1 !important; filter: none !important; }

/* Keep the terms workspace usable from compact phones through large displays. */
@media (min-width: 1600px) {
  .main { padding: clamp(36px, 2.5vw, 64px) clamp(48px, 3vw, 88px) 72px; }
  .page-header { margin-bottom: clamp(30px, 2vw, 44px); }
  .terms-card, .workspace-card { padding: clamp(30px, 2vw, 42px); }
  .term-row { padding: clamp(24px, 1.7vw, 34px); }
  .term-title h3 { font-size: clamp(1.08rem, 1.1vw, 1.35rem); }
  .term-actions { width: clamp(330px, 25vw, 430px); }
  .term-actions button { min-height: 48px; font-size: .82rem; }
}

@media (min-width: 2200px) {
  .main { padding-inline: max(88px, calc((100vw - 1900px) / 2)); }
}

@media (max-width: 900px) {
  .layout { height: auto; min-height: 100vh; min-height: 100dvh; }
  .main { width: 100%; min-width: 0; height: auto; min-height: 100vh; min-height: 100dvh; overflow: visible; }
  .terms-card, .workspace-card { min-width: 0; }
  .term-row { width: 100%; min-width: 0; }
  .term-summary { width: 100%; }
  .term-actions { max-width: none; }
  .term-metrics { row-gap: 7px; }
  .workspace-heading { flex-wrap: wrap; }
  .workspace-heading__context { min-width: 0; }
}

@media (max-width: 700px) {
  .main { padding: 20px 14px 32px; }
  .page-header { gap: 14px; margin-bottom: 20px; }
  .page-header h1 { font-size: clamp(1.8rem, 8vw, 2.35rem); overflow-wrap: anywhere; }
  .page-header p { max-width: 100%; font-size: .86rem; }
  .terms-card, .workspace-card { padding: 16px; border-radius: 16px; }
  .section-heading { gap: 14px; }
  .section-heading > div:first-child { min-width: 0; }
  .term-filter { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .term-filter button { min-width: 0; padding-inline: 7px; font-size: .7rem; }
  .term-row { gap: 16px; padding: 17px 14px; }
  .term-title { align-items: flex-start; }
  .term-title h3 { min-width: 0; overflow-wrap: anywhere; }
  .term-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .term-actions button { min-width: 0; min-height: 42px; justify-content: center; padding: 8px 7px; white-space: normal; }
  .term-metric { max-width: 100%; white-space: normal; }
  .term-metric b { flex: 0 0 25px; }
  .mode-grid { width: 100%; margin: 22px 0; }
  .preview-grid { min-width: 0; }
  .preview-card { min-width: 0; }
  .mini-schedule { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .term-modal { max-height: 100dvh; }
  .modal-body { max-height: none; }
}

@media (max-width: 420px) {
  .main { padding: 16px 10px 26px; }
  .terms-card, .workspace-card { padding: 13px; }
  .section-heading h2 { font-size: 1.15rem; }
  .term-filter button { min-height: 38px; padding-inline: 4px; font-size: .64rem; }
  .term-row { padding: 15px 12px; }
  .term-actions { grid-template-columns: 1fr; }
  .term-actions__label { grid-column: 1; }
  .term-actions button { justify-content: flex-start; padding-inline: 12px; }
  .term-title { gap: 7px; }
  .term-title h3 { font-size: .98rem; }
  .term-metric { gap: 5px; padding-right: 8px; font-size: .64rem; }
  .workspace-heading { gap: 10px; padding: 15px; }
  .preview-toolbar, .preview-grid { padding-inline: 12px; }
  .preview-card { padding: 12px; }
  .two-columns, .count-grid, .name-grid, .room-grid { grid-template-columns: minmax(0, 1fr); }
  .setup-section { padding: 15px 12px; }
  .setup-section__heading { gap: 9px; }
  .room-heading, .room-group-heading { flex-wrap: wrap; }
  .selection-count { margin-left: 0 !important; }
  .term-modal > header, .modal-body, .term-modal > footer { padding-inline: 14px; }
  .term-modal > footer { flex-wrap: wrap; }
  .term-modal > footer button { flex: 1 1 auto; }
}

@media (min-width: 701px) and (max-width: 1200px) {
  .main { padding: 20px clamp(18px, 2.2vw, 28px) 36px; }
  .page-header { gap: 14px; margin-bottom: 20px; }
  .page-header h1 { font-size: clamp(1.75rem, 2.4vw, 2.1rem); }
  .page-header p { margin-top: 6px; font-size: .78rem; line-height: 1.45; }
  .new-term-btn { min-height: 39px; padding-inline: 12px; border-radius: 9px; font-size: .72rem; }
  .terms-card, .workspace-card { padding: 18px; border-radius: 15px; }
  .section-heading { gap: 12px; padding-bottom: 14px; }
  .section-heading h2 { font-size: 1.18rem; }
  .section-heading p { font-size: .73rem; }
  .term-filter { padding: 3px; }
  .term-filter button { min-height: 31px; padding: 5px 9px; font-size: .66rem; }
  .term-row { min-height: 0; gap: 12px; padding: 15px; border-radius: 13px; }
  .term-title h3 { font-size: .96rem; }
  .term-guidance { margin: 5px 0 12px !important; font-size: .7rem !important; }
  .term-metric { gap: 5px; padding: 4px 8px 4px 5px; font-size: .62rem; }
  .term-metric b { width: 22px; height: 22px; flex-basis: 22px; font-size: .65rem; }
  .term-actions { width: min(100%, 500px); gap: 6px; }
  .term-actions__label { font-size: .58rem; }
  .term-actions button { min-height: 34px; padding: 6px 8px; gap: 6px; border-radius: 7px; font-size: .62rem; }
  .term-actions button svg { width: 14px; height: 14px; flex-basis: 14px; }
  .mode-grid { gap: 12px; margin-block: 24px; }
  .mode-card { min-height: 125px; padding: 14px; gap: 10px; }
  .mode-card strong { font-size: .88rem; }
  .mode-card .mode-copy small { font-size: .66rem; }
  .preview-toolbar { margin-block: 12px; }
  .preview-card { padding: 12px; }
  .preview-card-head strong { font-size: .78rem; }
  .preview-card-head small { font-size: .61rem; }
  .mini-day { min-height: 62px; }
  .mini-day b { font-size: .5rem; }
  .mini-day span { font-size: .42rem; }
  .term-modal { width: min(900px, 94vw); max-height: 90dvh; border-radius: 18px; }
  .term-modal > header { padding: 18px 22px 16px; }
  .term-modal > header h2 { font-size: 1.3rem; }
  .term-modal > header p { font-size: .76rem; }
  .term-stepper { gap: 10px; padding: 13px 22px; }
  .term-stepper__item { gap: 7px; font-size: .7rem; }
  .term-stepper__item b { width: 30px; height: 30px; font-size: .7rem; }
  .term-progress-summary { padding: 6px 22px; font-size: .66rem; }
  .modal-body { max-height: calc(90dvh - 190px); padding: 18px 22px 24px; }
  .setup-section { margin-bottom: 14px; padding: 19px; border-radius: 14px; }
  .setup-section__heading { margin-bottom: 13px; }
  .setup-section__heading h3 { font-size: 1rem; }
  .setup-section__heading p { font-size: .74rem; }
  .two-columns label, .count-grid label, .name-grid label { font-size: .69rem; }
  .two-columns input, .two-columns select, .count-grid input, .name-grid input { min-height: 38px; padding: 8px 10px; font-size: .72rem; }
  .room-grid { gap: 6px; }
  .room-grid label { min-height: 34px; padding: 6px 8px; font-size: .65rem; }
  .term-modal > footer { padding: 12px 22px; }
  .term-modal > footer button { min-height: 36px; padding: 7px 13px; font-size: .72rem; }
  .footer-help { font-size: .68rem; }
  .term-metrics { align-items: flex-start; }
  .term-filter { flex: 0 0 auto; }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .layout { height: 100vh; }
  .sidebar { width: 220px; min-width: 220px; padding: 18px 12px; }
  .main { height: 100vh; overflow: auto; }
  .nav-item { gap: 9px; padding: 10px 11px; font-size: .76rem; }
  .avatar-wrap { width: 62px; height: 62px; }
  .brand { font-size: .86rem; }
  .role, .email { font-size: .68rem; }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .term-row { flex-direction: row; align-items: center; gap: 12px; padding: 14px; }
  .term-summary { width: auto; min-width: 0; flex: 1 1 auto; }
  .term-actions { width: clamp(250px, 29vw, 310px); flex: 0 0 clamp(250px, 29vw, 310px); margin: 0 0 0 auto; justify-content: end; }
  .term-actions__label { text-align: right; }
  .term-actions button { min-height: 31px; padding: 5px 7px; gap: 5px; font-size: .57rem; }
  .term-actions button svg { width: 12px; height: 12px; flex-basis: 12px; }
  .term-metrics { gap: 5px; }
  .term-metric { padding: 3px 6px 3px 4px; font-size: .56rem; }
  .term-metric b { width: 20px; height: 20px; flex-basis: 20px; font-size: .6rem; }
  .term-title h3 { font-size: .88rem; }
  .term-guidance { margin-bottom: 9px !important; font-size: .64rem !important; }
}

@media (max-width: 700px) {
  .page-header h1 { font-size: clamp(1.55rem, 6.5vw, 1.9rem); }
  .page-header p { font-size: .78rem; }
  .terms-card, .workspace-card { padding: 14px; }
  .section-heading h2 { font-size: 1.1rem; }
  .section-heading p { font-size: .7rem; }
  .term-row { padding: 14px 12px; }
  .term-title h3 { font-size: .9rem; }
  .pill { padding: 4px 7px; font-size: .59rem; }
  .term-guidance { font-size: .68rem !important; }
  .term-metric { font-size: .59rem; }
  .term-actions button { min-height: 37px; font-size: .61rem; }
  .mode-card { min-height: 116px; padding: 15px; }
  .mode-icon { width: 48px; height: 48px; }
  .mode-icon :deep(svg) { width: 24px; height: 24px; }
  .mode-card strong { font-size: .9rem; }
  .mode-card .mode-copy small { font-size: .67rem; }
  .preview-card-head strong { font-size: .76rem; }
  .preview-card-head small { font-size: .6rem; }
  .term-modal { max-height: 100dvh; }
  .term-modal > header { padding-block: 16px 13px; }
  .term-modal > header h2 { font-size: 1.2rem; }
  .term-modal > header p { font-size: .72rem; }
  .term-stepper { padding-block: 12px; }
  .modal-body { padding-block: 15px 20px; }
  .setup-section { padding: 14px 12px; }
  .setup-section__heading h3 { font-size: .94rem; }
  .setup-section__heading p { font-size: .7rem; }
  .two-columns label, .count-grid label, .name-grid label { font-size: .68rem; }
  .two-columns input, .two-columns select, .count-grid input, .name-grid input { min-height: 38px; font-size: .72rem; }
  .room-grid label { min-height: 34px; padding: 6px; font-size: .63rem; }
  .term-modal > footer { padding-block: 11px; }
  .term-modal > footer button { min-height: 36px; padding: 7px 12px; font-size: .7rem; }
  :global(.publish-confirm-popup) { padding: 18px 20px 16px !important; }
  :global(.publish-confirm-popup .swal2-title) { font-size: 1.12rem !important; }
  :global(.publish-confirm-popup .swal2-html-container) { font-size: .88rem !important; }
  :global(.publish-confirm-button), :global(.publish-cancel-button) { min-height: 38px; font-size: .78rem !important; }
}

@media (max-width: 420px) {
  .main { padding: 14px 9px 24px; }
  .page-header h1 { font-size: 1.5rem; }
  .new-term-btn { min-height: 36px; font-size: .68rem; }
  .terms-card, .workspace-card { padding: 11px; }
  .section-heading h2 { font-size: 1rem; }
  .section-heading p { font-size: .66rem; }
  .term-filter button { min-height: 34px; font-size: .59rem; }
  .term-row { padding: 12px 10px; }
  .term-title h3 { font-size: .83rem; }
  .term-actions button { min-height: 35px; font-size: .59rem; }
  .term-metric { font-size: .56rem; }
  .mode-card { min-height: 102px; padding: 12px; }
  .mode-card strong { font-size: .84rem; }
  .mode-card .mode-copy small { font-size: .62rem; }
  .term-modal > header, .modal-body, .term-modal > footer { padding-inline: 12px; }
  .term-modal > header h2 { font-size: 1.05rem; }
  .term-stepper { gap: 6px; padding-inline: 12px; }
  .term-stepper__item b { width: 27px; height: 27px; }
  .term-progress-summary { flex-wrap: wrap; padding-inline: 12px; font-size: .62rem; }
  .setup-section { padding: 12px 10px; }
  .setup-section__heading { gap: 7px; }
  .step-number { width: 30px; height: 30px; flex-basis: 30px; border-radius: 8px; font-size: .72rem; }
  .setup-section__heading h3 { font-size: .86rem; }
  .setup-section__heading p { font-size: .65rem; }
  .two-columns input, .two-columns select, .count-grid input, .name-grid input { min-height: 35px; padding: 7px 8px; font-size: .68rem; }
  .room-grid label { min-height: 32px; font-size: .6rem; }
  .selection-count { font-size: .58rem; }
  .term-modal > footer button { min-height: 34px; font-size: .66rem; }
}

@media (max-width: 350px) {
  .term-filter button { font-size: .54rem; }
  .term-actions { grid-template-columns: 1fr; }
  .term-metric { gap: 4px; padding-inline: 4px 6px; }
  .term-metric b { width: 20px; height: 20px; flex-basis: 20px; }
  .term-stepper__item b { width: 24px; height: 24px; }
  .term-modal > footer { gap: 6px; }
}

@media (max-height: 620px) and (min-width: 701px) {
  .term-modal { max-height: 96dvh; }
  .modal-body { max-height: calc(96dvh - 190px); }
}

@media (min-width: 701px) and (max-width: 1200px) and (max-height: 700px) {
  .main { padding-top: 14px; padding-bottom: 24px; }
  .page-header { margin-bottom: 14px; }
  .page-header h1 { font-size: 1.72rem; }
  .page-header p { margin-top: 4px; font-size: .68rem; }
  .new-term-btn { min-height: 34px; padding-inline: 10px; font-size: .66rem; }
  .terms-card, .workspace-card { padding: 14px; }
  .section-heading { padding-bottom: 10px; }
  .section-heading h2 { font-size: 1.08rem; }
  .section-heading p { font-size: .66rem; }
  .term-list { gap: 9px; }
  .term-row { gap: 10px; padding: 12px; }
  .term-title h3 { font-size: .88rem; }
  .pill { padding: 3px 7px; font-size: .57rem; }
  .term-guidance { margin: 4px 0 8px !important; font-size: .63rem !important; }
  .term-metrics { gap: 5px; }
  .term-metric { gap: 4px; padding: 3px 7px 3px 4px; font-size: .56rem; }
  .term-metric b { width: 19px; height: 19px; flex-basis: 19px; font-size: .59rem; }
  .term-actions { gap: 4px; }
  .term-actions__label { margin-bottom: 0; font-size: .52rem; }
  .term-actions button { min-height: 29px; padding: 4px 6px; gap: 5px; border-radius: 6px; font-size: .56rem; }
  .term-actions button svg { width: 12px; height: 12px; flex-basis: 12px; }

  .term-modal { width: min(820px, 92vw); max-height: 94dvh; border-radius: 16px; }
  .term-modal > header { padding: 13px 18px 11px; }
  .term-modal > header h2 { font-size: 1.12rem; }
  .term-modal > header p { margin-top: 4px; font-size: .67rem; }
  .modal-eyebrow { margin-bottom: 3px; font-size: .57rem; }
  .modal-close { width: 30px; height: 30px; }
  .term-stepper { gap: 8px; padding: 9px 18px; }
  .term-stepper__item { gap: 6px; font-size: .62rem; }
  .term-stepper__item b { width: 26px; height: 26px; font-size: .62rem; }
  .term-progress-summary { min-height: 28px; padding: 5px 18px; font-size: .59rem; }
  .modal-body { max-height: calc(94dvh - 150px); padding: 12px 18px 16px; }
  .setup-section { margin-bottom: 10px; padding: 14px; border-radius: 11px; }
  .setup-section__heading { gap: 8px; margin-bottom: 9px; }
  .setup-section__heading h3 { font-size: .88rem; }
  .setup-section__heading p { font-size: .64rem; }
  .step-number { width: 29px; height: 29px; flex-basis: 29px; border-radius: 8px; font-size: .68rem; }
  .two-columns label, .count-grid label, .name-grid label { gap: 4px; font-size: .62rem; }
  .two-columns input, .two-columns select, .count-grid input, .name-grid input { min-height: 33px; padding: 6px 8px; font-size: .65rem; }
  .count-grid, .name-grid, .room-grid { gap: 6px; }
  .room-group { margin-bottom: 10px; }
  .room-grid label { min-height: 29px; padding: 4px 7px; font-size: .59rem; }
  .room-grid input, .select-floor-rooms input { width: 13px; height: 13px; }
  .select-all-rooms { gap: 8px; margin-bottom: 11px; padding: 8px 10px; }
  .select-all-rooms strong { font-size: .66rem; }
  .select-all-rooms small { font-size: .57rem; }
  .term-modal > footer { gap: 7px; padding: 9px 18px; }
  .term-modal > footer button { min-height: 31px; padding: 6px 11px; font-size: .63rem; }
  .footer-help { font-size: .59rem; }
}

@media (prefers-reduced-motion: reduce) {
  .term-row, .mode-card, .preview-card, .preview-pagination button { transition: none; }
}
</style>
