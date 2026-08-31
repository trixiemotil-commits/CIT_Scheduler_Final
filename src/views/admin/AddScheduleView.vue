<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
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
          <AdminSettingsIcon />
          <span>Settings</span>
        </RouterLink>
        <PublishedTermScheduleLink />
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
    <main class="main" :class="{ 'main-list-view': scheduleViewMode === 'list' }">
      <!-- Page Header -->
      <header class="main-header">
        <div class="header-left">
          <div class="page-heading-row">
            <div class="page-heading-copy">
              <span class="page-eyebrow">Schedule management</span>
              <h1 class="page-title">
                <template v-if="scheduleViewMode === ''">Choose View Mode</template>
                <template v-else-if="scheduleViewMode === 'list'">All Schedules</template>
                <template v-else-if="!addMode">Add Schedule</template>
                <template v-else-if="addMode === 'teacher'">{{ selectedTeacher ? 'Add Schedule' : 'By Teacher' }}</template>
                <template v-else-if="addMode === 'room'">{{ contextRoom ? 'Add Schedule' : contextFloor ? contextFloor : 'By Room' }}</template>
              </h1>
              <p class="page-sub">
                <template v-if="scheduleViewMode === ''">Start by choosing the view mode you want to use.</template>
                <template v-else-if="scheduleViewMode === 'list'">Browse all schedules and add new entries below.</template>
                <template v-else-if="!addMode">Choose a context before adding schedule entries</template>
                <template v-else-if="addMode === 'teacher'">{{ selectedTeacher ? 'Create and manage timetable entries for this teacher.' : 'Select a teacher to assign schedules' }}</template>
                <template v-else-if="addMode === 'room'">{{ contextRoom ? 'Create and manage timetable entries for this room.' : contextFloor ? 'Select a room' : 'Choose a floor first' }}</template>
              </p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div v-if="selectedTermLabel" class="term-banner">
            <span class="term-banner-label">Academic term</span>
            <strong>{{ selectedTermLabel }}</strong>
          </div>
          <div v-if="scheduleViewMode === 'list' || ((addMode === 'teacher' && selectedTeacher) || (addMode === 'room' && contextRoom))" class="header-actions">
            <div class="view-toggle" aria-label="Schedule view">
              <button type="button" class="view-btn" :class="{ active: scheduleViewMode === 'timetable' }" @click="scheduleViewMode = 'timetable'">Timetable</button>
              <button type="button" class="view-btn" :class="{ active: scheduleViewMode === 'list' }" @click="scheduleViewMode = 'list'">List view</button>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Initial View Selection ── -->
      <div v-if="scheduleViewMode === ''" class="mode-select-container">
        <p class="step-hint">Choose whether you want Listed view or Time table view.</p>
        <div class="mode-grid">
          <button class="mode-card" @click="selectViewMode('timetable')">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/><path d="M7 3v18"/><path d="M17 3v18"/></svg>
            </div>
            <div class="mode-label">Time table View</div>
            <div class="mode-desc">Choose schedule slots by teacher or room in a timetable layout.</div>
          </button>
          <button class="mode-card" @click="selectViewMode('list')">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/></svg>
            </div>
            <div class="mode-label">Listed View</div>
            <div class="mode-desc">See every schedule entry and add new ones from the list.</div>
          </button>
        </div>
      </div>

      <!-- ── Step 0: Mode Selection ── -->
      <div v-if="scheduleViewMode === 'timetable' && !addMode" class="mode-select-container">
        <p class="step-hint">Choose how you want to assign schedules</p>
        <div class="mode-grid">
          <button class="mode-card" @click="addMode = 'teacher'; loadAddTeachers()">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="mode-label">By Teacher</div>
            <div class="mode-desc">Select a teacher and manage their weekly schedule</div>
          </button>
          <button class="mode-card" @click="addMode = 'room'">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div class="mode-label">By Room</div>
            <div class="mode-desc">Select a room and assign schedules to available slots</div>
          </button>
        </div>
      </div>

      <!-- ── By Teacher: pick teacher ── -->
      <div v-else-if="scheduleViewMode === 'timetable' && addMode === 'teacher' && !selectedTeacher" class="step-container">
        <div v-if="loadingAddTeachers" class="loading-state">
          <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
          Loading teachers…
        </div>
        <template v-else>
          <p class="step-hint">Select a teacher to manage their schedule</p>
          <div class="teacher-search-wrap">
            <svg class="teacher-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model.trim="addTeacherSearchQuery" type="text" class="teacher-search-input" placeholder="Search teacher name..." />
          </div>
          <div v-if="filteredAddTeacherList.length" class="teacher-grid">
            <button v-for="teacher in filteredAddTeacherList" :key="teacher.name" class="teacher-card" @click="selectedTeacher = teacher.name">
              <img v-if="teacher.avatar" :src="teacher.avatar" :alt="teacher.name" class="teacher-avatar-img" />
              <div v-else class="teacher-avatar">{{ getTeacherInitials(teacher.name) }}</div>
              <div class="teacher-name">Prof. {{ teacher.name }}</div>
            </button>
          </div>
          <div v-else class="empty-state small-empty-state">
            <p>No teachers found for <strong>“{{ addTeacherSearchQuery }}”</strong>.</p>
          </div>
        </template>
      </div>

      <!-- ── By Room: pick floor ── -->
      <div v-else-if="scheduleViewMode === 'timetable' && addMode === 'room' && !contextFloor" class="step-container">
        <p class="step-hint">Choose a floor to see available rooms</p>
        <div class="floor-grid">
          <div v-for="floor in addFloors" :key="floor.label" class="floor-card floor-card-expanded">
            <div class="floor-card-header">
              <div class="floor-number">{{ floor.number }}</div>
              <div class="floor-card-meta">
                <div class="floor-label">{{ floor.label }}</div>
                <div class="floor-room-count">{{ floor.rooms.length }} rooms</div>
              </div>
            </div>
            <div class="floor-room-buttons">
              <button
                v-for="room in floor.rooms"
                :key="room"
                type="button"
                class="floor-room-btn"
                @click="chooseRoomFromFloor(floor.label, room)"
              >
                {{ room }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── By Room: pick room ── -->
      <div v-else-if="scheduleViewMode === 'timetable' && addMode === 'room' && contextFloor && !contextRoom" class="step-container">
        <p class="step-hint">Select a room to assign schedules</p>
        <div class="teacher-search-wrap room-search-wrap">
          <svg class="teacher-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model.trim="roomSearchQuery" type="text" class="teacher-search-input" placeholder="Search room..." />
        </div>
        <div v-if="filteredContextFloorRooms.length" class="room-grid">
          <template v-for="room in filteredContextFloorRooms" :key="room">
            <button v-if="contextFloor === '2nd Floor'" type="button" class="room-card room-card-inline" @click="chooseRoomFromFloor(contextFloor, room)">
              <div class="room-card-number">{{ room }}</div>
              <div class="room-card-floor">{{ contextFloor }}</div>
            </button>
            <button v-else class="room-card" :class="{ 'room-card-comlab': room.toLowerCase().includes('comlab') }" @click="chooseRoomFromFloor(contextFloor, room)">
              <svg class="room-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <div class="room-card-number">{{ room }}</div>
              <div class="room-card-floor">{{ contextFloor }}</div>
            </button>
          </template>
        </div>
        <div v-else class="empty-state small-empty-state">
          <p>No rooms found for <strong>“{{ roomSearchQuery }}”</strong>.</p>
        </div>
      </div>


      <div v-else-if="scheduleViewMode === 'list'" class="schedule-card list-schedule-card">
        <div class="sched-topbar list-schedule-toolbar">
          <div class="list-summary">
            <span class="list-summary-count">{{ visibleScheduleEntries.length }}</span>
            <div>
              <h2 class="list-summary-title">Schedule entries</h2>
              <p class="list-summary-copy">Select any row to review or edit its details.</p>
            </div>
          </div>
          <div class="list-toolbar-actions">
            <button class="new-sched-btn" @click="scrollToListAddForm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Schedule
            </button>
          </div>
        </div>
        <div class="schedule-list-wrap">
          <div class="schedule-list-table-wrap">
            <table class="schedule-list-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Year</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Room</th>
                  <th>Section</th>
                  <th>Campus</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!visibleScheduleEntries.length" class="empty-state-row">
                  <td colspan="8" class="empty-state small-empty-state">No schedules are currently available.</td>
                </tr>
                <tr v-for="entry in visibleScheduleEntries" :key="entry._key" class="schedule-list-row" @click="openEditModal(entry.slot, entry.day, entry)">
                  <td><span class="list-day">{{ entry.day }}</span></td>
                  <td><span class="list-time">{{ entry.timeIn }} – {{ entry.timeOut }}</span></td>
                  <td><span class="list-year">{{ entry.year }}</span></td>
                  <td><span class="list-subject">{{ entry.subject }}</span></td>
                  <td><span class="list-teacher">{{ entry.teacher }}</span></td>
                  <td><span class="list-room">{{ entry.room }}</span></td>
                  <td><span class="list-section">{{ entry.section }}</span></td>
                  <td><span class="list-campus">{{ entry.campus }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <section ref="listAddSection" class="list-add-section" aria-labelledby="list-add-title">
            <div class="list-add-heading">
              <div>
                <span class="list-add-eyebrow">New entry</span>
                <h3 id="list-add-title">Add schedule</h3>
                <p>Complete the details below, then save the new timetable entry.</p>
              </div>
              <span class="list-add-required">All fields are required</span>
            </div>

            <div class="list-add-grid">
              <label class="list-field">
                <span>Day</span>
                <select v-model="listAddForm.day" class="form-select">
                  <option value="" disabled>Day</option>
                  <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <label class="list-field list-field-time">
                <span>Class time</span>
                <div class="time-inputs">
                  <select v-model="listAddForm.timeIn" class="form-select"><option value="" disabled>From</option><option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option></select>
                  <span class="time-separator">to</span>
                  <select v-model="listAddForm.timeOut" class="form-select"><option value="" disabled>To</option><option v-for="t in endTimeOptionsAfter(listAddForm.timeIn)" :key="t" :value="t">{{ t }}</option></select>
                </div>
                <small v-if="listTimeError" class="list-field-error">{{ listTimeError }}</small>
              </label>
              <label class="list-field">
                <span>Year level</span>
                <select v-model="listAddForm.year" class="form-select"><option value="" disabled>Year</option><option v-for="y in effectiveYears" :key="y" :value="y">{{ y }}</option></select>
              </label>
              <label v-if="listAddForm.year === '3rd Year' || listAddForm.year === '4th Year'" class="list-field">
                <span>Major</span>
                <select v-model="listAddForm.major" class="form-select"><option value="" disabled>Major</option><option v-for="m in majorOptions" :key="m" :value="m">{{ m || 'None' }}</option></select>
              </label>
              <label class="list-field list-field-wide">
                <span>Subject</span>
                <select v-model="listAddForm.subject" class="form-select"><option value="" disabled>Subject</option><option v-for="s in listSubjectOptions" :key="s" :value="s">{{ s }}</option></select>
              </label>
              <label class="list-field list-field-wide">
                <span>Teacher</span>
                <select v-model="listAddForm.teacher" class="form-select"><option value="" disabled>Teacher</option><option v-for="t in teacherOptions" :key="t" :value="t">{{ t }}</option></select>
              </label>
              <label class="list-field">
                <span>Room</span>
                <select v-model="listAddForm.room" class="form-select"><option value="" disabled>Room</option><option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option></select>
              </label>
              <label class="list-field">
                <span>Room type</span>
                <select v-model="listAddForm.roomType" class="form-select"><option value="Lecture">Lec</option><option value="Comlab/Laboratory">Lab</option></select>
              </label>
              <label class="list-field">
                <span>Section</span>
                <select v-model="listAddForm.section" class="form-select"><option value="" disabled>Section</option><option v-for="s in getSectionsForYear(listAddForm.year)" :key="s" :value="s">{{ s }}</option></select>
              </label>
              <div class="list-field list-campus-field">
                <span>Campus</span>
                <div class="list-campus-options">
                  <button type="button" :class="{ active: listAddForm.campus === 'South Campus' }" @click="listAddForm.campus = 'South Campus'">South</button>
                  <button type="button" :class="{ active: listAddForm.campus === 'Main Campus' }" @click="listAddForm.campus = 'Main Campus'">Main</button>
                </div>
              </div>
            </div>
            <div class="list-add-actions">
              <span>{{ listAddFormValid ? 'Ready to add this schedule.' : 'Complete the required schedule details.' }}</span>
              <button type="button" class="list-add-submit" :disabled="!listAddFormValid" @click="addListEntry">Add schedule</button>
            </div>
          </section>
          <div v-if="visibleScheduleEntries.length" class="schedule-list-footer">
            <span>Showing all {{ visibleScheduleEntries.length }} schedule entries</span>
            <button type="button" class="list-footer-action" @click="scrollToListAddForm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add another schedule
            </button>
          </div>
        </div>
      </div>
      <!-- Schedule Card (teacher mode: teacher selected / room mode: room selected) -->
      <div v-else-if="scheduleViewMode === 'timetable' && ((addMode === 'teacher' && selectedTeacher) || (addMode === 'room' && contextRoom))" class="schedule-card">
        <div class="sched-topbar">
          <button class="schedule-back-btn" aria-label="Back to teacher selection" title="Back to teacher selection" @click="returnToTermWorkspace">&larr;</button>
          <div class="sched-topbar-left">
            <span class="sched-context-label">Schedule for</span>
            <h2 class="sched-grid-title">
              <template v-if="addMode === 'teacher'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Prof. {{ selectedTeacher }}
              </template>
              <template v-else-if="addMode === 'room'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                Room {{ contextRoom }}
              </template>
            </h2>
          </div>
          <div class="sched-topbar-right">
            <!-- Section filter (teacher mode only) -->
            <div v-if="addMode === 'teacher'" class="sched-select-wrap">
              <select class="sched-select" v-model="filterSection">
                <option value="All">All Sections</option>
                <option v-for="s in getSectionsForYear(form.year)" :key="s" :value="s">{{ s }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Year filter (teacher mode only) -->
            <div v-if="addMode === 'teacher'" class="sched-select-wrap">
              <select class="sched-select" v-model="yearDropdown">
                <option value="All">All Years</option>
                <option v-for="y in effectiveYears" :key="y" :value="y">{{ y }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Consultation hours button (teacher mode only) -->
            <button v-if="addMode === 'teacher'" class="icon-btn consult-btn" title="Manage Consultation Hours" @click="openConsultModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="scheduleViewMode === 'list'" class="schedule-list-wrap">
          <div class="schedule-list-meta">
            <span>{{ visibleScheduleEntries.length }} entries found</span>
            <span class="schedule-list-note">Click an entry to edit it.</span>
          </div>
          <div v-if="visibleScheduleEntries.length" class="schedule-list-table-wrap">
            <table class="schedule-list-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>{{ addMode === 'teacher' ? 'Room' : 'Teacher' }}</th>
                  <th>Section</th>
                  <th>Campus</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in visibleScheduleEntries" :key="entry._key" class="schedule-list-row" @click="openEditModal(entry.slot, entry.day, entry)">
                  <td>{{ entry.day }}</td>
                  <td>{{ entry.timeIn }} – {{ entry.timeOut }}</td>
                  <td>{{ entry.subject }}</td>
                  <td>{{ addMode === 'teacher' ? entry.room : entry.teacher }}</td>
                  <td>{{ entry.section }}</td>
                  <td>{{ entry.campus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state small-empty-state">
            <p>No schedule entries found for the selected {{ addMode === 'teacher' ? 'teacher' : 'room' }}.</p>
          </div>
        </div>

        <div v-else-if="addMode === 'teacher'" class="sched-grid-wrap">
          <table class="sched-grid">
            <thead>
              <tr>
                <th class="th-time">Time</th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots30" :key="slot" class="time-row" :class="{ 'half-hour': slot.includes(':30') }">
                <td class="td-time"><span class="time-boundary-label">{{ slot }}</span></td>
                <template v-for="day in days" :key="day">
                  <td
                    v-if="!isSpannedCell30(slot, day) && !isConsultSpannedCell30(slot, day)"
                    :rowspan="getEntriesForCell30(slot, day).length ? getRowspan30(getEntriesForCell30(slot, day)[0]) : (getConsultationForCell30(slot, day) ? getConsultRowspan30(getConsultationForCell30(slot, day)) : 1)"
                    class="td-cell"
                    :class="{
                      'has-entry': getEntriesForCell30(slot, day).length,
                      'consult-cell': !getEntriesForCell30(slot, day).length && !!getConsultationForCell30(slot, day),
                      'free-time-cell': !getEntriesForCell30(slot, day).length && !getConsultationForCell30(slot, day),
                      'readonly-entry-cell': getEntriesForCell30(slot, day).length && !selectedTeacher,
                    }"
                    @click="canInteractCell30(slot, day) ? handleCellClick30(slot, day) : null"
                  >
                    <!-- Filled cell -->
                    <template v-if="getEntriesForCell30(slot, day).length">
                      <div
                        class="sched-entry"
                        :class="[getEntriesForCell30(slot, day)[0].color, { 'entry-readonly': !selectedTeacher }]"
                        :style="entryStyle30(slot, getEntriesForCell30(slot, day)[0])"
                      >
                        <div
                          v-if="getEntriesForCell30(slot, day)[0].isSubstitute"
                          class="subbed-indication"
                          :title="getEntriesForCell30(slot, day)[0].subbedLabel"
                        >
                          {{ getEntriesForCell30(slot, day)[0].subbedLabel }}
                        </div>
                        <div class="entry-teacher">{{ getEntriesForCell30(slot, day)[0].teacher }}</div>
                        <div class="entry-subject">{{ getEntriesForCell30(slot, day)[0].subject }}</div>
                        <div class="entry-time-range">{{ getEntriesForCell30(slot, day)[0].slot }}</div>
                        <div v-if="getEntriesForCell30(slot, day)[0].section && getEntriesForCell30(slot, day)[0].entryType !== 'lunch'" class="entry-section-rows">
                          <div v-for="e in getEntriesForCell30(slot, day)" :key="e._key" class="entry-section-row">
                            <span v-if="e.section" class="entry-section-badge">{{ e.section }}</span>
                            <span v-if="e.room" class="entry-room">{{ e.room }}</span>
                          </div>
                        </div>
                        <div v-if="getEntriesForCell30(slot, day)[0].addedAt" class="entry-timestamp">Added: {{ getEntriesForCell30(slot, day)[0].addedAt }}</div>
                        <div v-if="selectedTeacher" class="entry-edit-hint">Click to edit</div>
                      </div>
                    </template>
                    <!-- Consultation cell -->
                    <template v-else-if="getConsultationForCell30(slot, day)">
                      <div
                        class="sched-entry color-blue consult-entry"
                        :style="consultEntryStyle30(slot, getConsultationForCell30(slot, day))"
                        role="button"
                        tabindex="0"
                        :aria-label="`Edit consultation on ${day}, ${getConsultationForCell30(slot, day).startTime} to ${getConsultationForCell30(slot, day).endTime}`"
                        @click.stop="openConsultSlotModal(getConsultationForCell30(slot, day))"
                        @keydown.enter.stop.prevent="openConsultSlotModal(getConsultationForCell30(slot, day))"
                        @keydown.space.stop.prevent="openConsultSlotModal(getConsultationForCell30(slot, day))"
                      >
                        <div class="entry-teacher">Consultation</div>
                        <div class="entry-subject" style="font-size:0.72rem;opacity:0.9">{{ getConsultationForCell30(slot, day).startTime }} – {{ getConsultationForCell30(slot, day).endTime }}</div>
                        <div class="consult-edit-hint">Click to manage</div>
                      </div>
                    </template>
                    <!-- Empty cell -->
                    <template v-else>
                      <span class="click-to-add">{{ selectedTeacher ? 'Click to add' : '' }}</span>
                    </template>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Room mode grid ── -->
        <div v-else-if="addMode === 'room'" class="sched-grid-wrap">
          <table class="sched-grid">
            <thead><tr><th class="th-time">Time</th><th v-for="day in days" :key="day">{{ day }}</th></tr></thead>
            <tbody>
              <tr v-for="slot in timeSlots30" :key="slot" class="time-row" :class="{ 'half-hour': slot.includes(':30') }">
                <td class="td-time"><span class="time-boundary-label">{{ slot }}</span></td>
                <template v-for="day in days" :key="day">
                  <td
                    v-if="!isSpannedRoomCell30(slot, day)"
                    :rowspan="getEntriesForRoomCell30(slot, day).length ? getRowspan30(getEntriesForRoomCell30(slot, day)[0]) : 1"
                    class="td-cell"
                    :class="{
                      'has-entry': getEntriesForRoomCell30(slot, day).length,
                      'free-time-cell': !getEntriesForRoomCell30(slot, day).length
                    }"
                    @click="handleRoomCellClick30(slot, day)"
                  >
                    <template v-if="getEntriesForRoomCell30(slot, day).length">
                      <div class="sched-entry" :class="getEntriesForRoomCell30(slot, day)[0].color" :style="entryStyle30(slot, getEntriesForRoomCell30(slot, day)[0])">
                        <div class="entry-teacher">{{ getEntriesForRoomCell30(slot, day)[0].teacher }}</div>
                        <div class="entry-subject">{{ getEntriesForRoomCell30(slot, day)[0].subject }}</div>
                        <div class="entry-time-range">{{ getEntriesForRoomCell30(slot, day)[0].slot }}</div>
                        <div class="entry-section-rows">
                          <div v-for="e in getEntriesForRoomCell30(slot, day)" :key="e._key" class="entry-section-row">
                            <span class="entry-section-badge">{{ e.section }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <span class="click-to-add">Click to add</span>
                    </template>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- ═══ Add / Edit Schedule Modal ═══ -->
    <Teleport to="body">
      <div v-if="showSchedModal" class="modal-overlay" @click.self="showSchedModal = false">
        <div class="sched-modal-box schedule-entry-modal">
          <div class="sched-modal-header">
            <div>
              <div class="sched-modal-mode-badge" :class="editMode ? 'badge-edit' : 'badge-add'">
                {{ editMode ? 'Edit Schedule' : 'New Schedule' }}
              </div>
              <h2 class="sched-modal-title">
                <template v-if="fromButton && !editMode && (!form.day || !form.timeIn)">New Schedule</template>
                <template v-else>{{ form.day }} &bull; {{ form.timeIn }}{{ form.timeOut ? ' – ' + form.timeOut : '' }}</template>
              </h2>
              <p class="sched-modal-sub">
                {{ editMode ? 'Update the existing entry for' : 'Assign schedule for' }}
                {{ form.year }} &ndash; {{ form.section || 'Parallel' }}
              </p>
            </div>
            <button class="panel-close schedule-modal-close" aria-label="Close schedule form" @click="showSchedModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="sched-form">
            <div class="form-row-inline schedule-teacher-field" :class="{ 'schedule-for-row': selectedTeacher && !editMode }">
              <label v-if="!(selectedTeacher && !editMode)" class="form-label">Teacher</label>
              <div v-if="selectedTeacher && !editMode" class="schedule-for-text">Schedule for Prof. {{ selectedTeacher }}</div>
              <div v-else-if="selectedTeacher" class="form-value-locked">Prof. {{ selectedTeacher }}</div>
              <div v-else class="form-select-wrap">
                <select v-model="form.teacher" class="form-select">
                  <option value="" disabled>Select Teacher</option>
                  <option v-for="t in teacherOptions" :key="t" :value="t">Prof. {{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <template v-if="fromButton && !editMode">
              <div class="form-row-inline">
                <label class="form-label">Day</label>
                <div class="form-select-wrap">
                  <select v-model="form.day" class="form-select">
                    <option value="" disabled>Select Day</option>
                    <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </template>
            <div class="form-row-inline schedule-start-field">
              <label class="form-label">Start of Class</label>
              <div class="form-select-wrap">
                <select v-model="form.timeIn" class="form-select">
                  <option value="" disabled>Select Start of Class</option>
                  <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline schedule-end-field">
              <label class="form-label">End of Class</label>
              <div class="form-select-wrap">
                <select v-model="form.timeOut" class="form-select">
                  <option value="" disabled>Select End of Class</option>
                  <option v-for="t in endTimeOptionsAfter(form.timeIn)" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline schedule-year-field">
              <label class="form-label">Year</label>
              <div class="form-select-wrap">
                <select v-model="form.year" class="form-select">
                  <option value="" disabled>Select Year</option>
                  <option v-for="y in effectiveYears" :key="y" :value="y">{{ y }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline" v-if="form.year === '3rd Year' || form.year === '4th Year'">
              <label class="form-label">Major / Track</label>
              <div class="form-select-wrap">
                <select v-model="form.major" class="form-select">
                    <option value="" disabled>Select Major</option>
                    <option v-for="m in majorOptions" :key="m" :value="m">{{ m || 'None' }}</option>
                  </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline schedule-section-field" v-if="!form.parallel">
              <label class="form-label">Section</label>
              <input v-if="form.campus === 'Main Campus'" v-model.trim="form.section" type="text" class="form-input" placeholder="Enter Section"/>
              <div v-else class="form-select-wrap">
                <select v-model="form.section" class="form-select">
                  <option value="" disabled>Select Section</option>
                  <option v-for="s in getSectionsForYear(form.year)" :key="s" :value="s">{{ s }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline schedule-subject-field">
              <label class="form-label">Subject</label>
              <div v-if="form.subject === 'Lunch Break'" class="lunch-subject-selected">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v8M5 3v5a3 3 0 0 0 6 0V3M8 11v10M16 3v18M16 3c2.2 0 3 1.8 3 4v2h-3"/></svg>
                Lunch Break selected
              </div>
              <div v-else class="form-select-wrap">
                <select v-model="form.subject" class="form-select">
                  <option value="" disabled>Select Subject</option>
                  <option v-for="s in modalSubjectOptions" :key="s" :value="s">{{ s }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <template v-if="!form.parallel">
              <div class="form-row-inline schedule-room-field">
                <label class="form-label">Room</label>
                <input v-if="form.campus === 'Main Campus'" v-model.trim="form.room" type="text" class="form-input" placeholder="Enter Room"/>
                <div v-else class="form-select-wrap">
                  <select v-model="form.room" class="form-select">
                    <option value="" disabled>Select Room</option>
                    <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline schedule-room-type-field">
                <label class="form-label">Room Type</label>
                <div class="form-select-wrap">
                  <select v-model="form.roomType" class="form-select">
                    <option value="Lecture">Lecture</option>
                    <option value="Comlab/Laboratory">Comlab/Laboratory</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="form-row-inline">
                <label class="form-label">Section Count</label>
                <div class="form-select-wrap">
                  <select v-model="form.parallelCount" class="form-select">
                    <option :value="2">2 Sections</option>
                    <option :value="3">3 Sections</option>
                    <option :value="4">4 Sections</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <template v-for="(ps, i) in form.parallelSlots" :key="i">
                <div class="parallel-slot-divider">Slot {{ i + 1 }}</div>
                <div class="form-row-inline">
                  <label class="form-label">Section {{ i + 1 }}</label>
                  <input v-if="form.campus === 'Main Campus'" v-model.trim="ps.section" type="text" class="form-input" :placeholder="`Enter Section ${i + 1}`"/>
                  <div v-else class="form-select-wrap">
                    <select v-model="ps.section" class="form-select">
                      <option value="" disabled>Select Section</option>
                      <option v-for="s in getSectionsForYear(form.year)" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div class="form-row-inline">
                  <label class="form-label">Room {{ i + 1 }}</label>
                  <input v-if="form.campus === 'Main Campus'" v-model.trim="ps.room" type="text" class="form-input" :placeholder="`Enter Room ${i + 1}`"/>
                  <div v-else class="form-select-wrap">
                    <select v-model="ps.room" class="form-select">
                      <option value="" disabled>Select Room</option>
                      <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div class="form-row-inline">
                  <label class="form-label">Room Type {{ i + 1 }}</label>
                  <div class="form-select-wrap">
                    <select v-model="ps.roomType" class="form-select">
                      <option value="Lecture">Lecture</option>
                      <option value="Comlab/Laboratory">Comlab/Laboratory</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </template>
            </template>
            <div class="form-row-inline schedule-campus-field">
              <label class="form-label">Campus</label>
              <div class="campus-toggle">
                <button type="button" class="campus-btn" :class="{ active: form.campus === 'South Campus' }" @click="form.campus = 'South Campus'">South Campus</button>
                <button type="button" class="campus-btn" :class="{ active: form.campus === 'Main Campus' }" @click="form.campus = 'Main Campus'">Main Campus</button>
              </div>
            </div>
            <div class="parallel-row">
              <button class="parallel-btn" :class="{ active: form.parallel }" @click="form.parallel = true; form.parallelCount = 2">
                <span class="par-radio" :class="{ checked: form.parallel }">
                  <svg v-if="form.parallel" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                Parallel
              </button>
              <button class="parallel-btn" :class="{ active: !form.parallel }" @click="form.parallel = false">
                <span class="par-radio" :class="{ checked: !form.parallel }">
                  <svg v-if="!form.parallel" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                Not Parallel
              </button>
            </div>
          </div>

          <div v-if="modalTimeError" class="time-error" style="padding: 0 24px 12px 24px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ modalTimeError }}
          </div>

          <div v-if="!editMode && addMode === 'teacher' && lunchBreakContext.teacher && lunchBreakContext.day" class="lunch-break-footer">
            <button type="button" class="lunch-break-modal-btn" @click="openLunchBreakPicker">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v8M5 3v5a3 3 0 0 0 6 0V3M8 11v10M16 3v18M16 3c2.2 0 3 1.8 3 4v2h-3"/></svg>
              Set Lunch Break
            </button>
          </div>

          <div class="sched-modal-actions">
            <button v-if="editMode" class="clear-slot-btn" @click="clearSlot">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Clear Slot
            </button>
            <button class="cancel-btn-text" @click="showSchedModal = false">Cancel</button>
            <button class="save-btn" @click="saveEntry" :disabled="!form.teacher || !form.subject || !form.timeIn || !form.timeOut || (fromButton && !editMode && !form.day) || !!modalTimeError">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ editMode ? 'Update' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Lunch Break Time Picker ═══ -->
    <Teleport to="body">
      <div v-if="showLunchBreakPicker" class="modal-overlay lunch-break-picker-overlay" @click.self="showLunchBreakPicker = false">
        <section class="lunch-break-picker" role="dialog" aria-modal="true" aria-labelledby="lunch-break-picker-title">
          <div class="lunch-break-picker-header">
            <div class="lunch-break-picker-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v8M5 3v5a3 3 0 0 0 6 0V3M8 11v10M16 3v18M16 3c2.2 0 3 1.8 3 4v2h-3"/></svg>
            </div>
            <div class="lunch-break-picker-copy">
              <span class="lunch-break-picker-eyebrow">Break settings</span>
              <h2 id="lunch-break-picker-title">{{ lunchBreakContext.editing ? 'Edit Lunch Break' : 'Set Lunch Break' }}</h2>
              <p>{{ lunchBreakContext.day }}<template v-if="lunchBreakContext.teacher"> · Prof. {{ lunchBreakContext.teacher }}</template></p>
            </div>
            <button type="button" class="lunch-break-picker-close" aria-label="Close lunch break dialog" @click="showLunchBreakPicker = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <p class="lunch-break-picker-help">Choose when this teacher’s lunch break begins and ends. The selected time will be reserved on the timetable.</p>

          <div class="lunch-break-picker-fields">
            <label class="lunch-break-picker-field">
              <span>Start Time</span>
              <select v-model="lunchBreakForm.timeIn">
                <option value="" disabled>Select Start Time</option>
                <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
              </select>
            </label>
            <label class="lunch-break-picker-field">
              <span>End Time</span>
              <select v-model="lunchBreakForm.timeOut">
                <option value="" disabled>Select End Time</option>
                <option v-for="time in endTimeOptionsAfter(lunchBreakForm.timeIn)" :key="time" :value="time">{{ time }}</option>
              </select>
            </label>
          </div>

          <p v-if="lunchBreakTimeError" class="lunch-break-picker-error">{{ lunchBreakTimeError }}</p>

          <div class="lunch-break-picker-actions">
            <button type="button" class="cancel-btn-text" @click="showLunchBreakPicker = false">Cancel</button>
            <button
              type="button"
              class="save-btn"
              :disabled="!lunchBreakForm.timeIn || !lunchBreakForm.timeOut || !!lunchBreakTimeError"
              @click="saveLunchBreakFromPicker"
            >
              {{ lunchBreakContext.editing ? 'Update Lunch Break' : 'Save Lunch Break' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- ═══ Add Schedule Panel ═══ -->
    <Teleport to="body">
      <transition name="panel">
        <div v-if="showAddPanel" class="panel-overlay" @click.self="showAddPanel = false">
          <div class="add-panel">
            <div class="panel-header">
              <div>
                <div class="panel-badge">{{ addSavedCount }} Added This Session</div>
                <h2 class="panel-title">New Schedule Entry</h2>
                <p class="panel-sub">Fill in all fields then click Add</p>
              </div>
              <button class="panel-close" @click="showAddPanel = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="panel-form">
              <div class="form-row-inline" :class="{ 'schedule-for-row': selectedTeacher }">
                <label v-if="!selectedTeacher" class="form-label">Teacher</label>
                <div v-if="selectedTeacher" class="schedule-for-text">Schedule for Prof. {{ selectedTeacher }}</div>
                <div v-else class="form-select-wrap">
                  <select v-model="addForm.teacher" class="form-select">
                    <option value="" disabled>Select Teacher</option>
                    <option v-for="t in teacherOptions" :key="t" :value="t">Prof. {{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline">
                <label class="form-label">Day</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.day" class="form-select">
                    <option value="" disabled>Select Day</option>
                    <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline">
                <label class="form-label">Start of Class</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.timeIn" class="form-select">
                    <option value="" disabled>Select Start of Class</option>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline">
                <label class="form-label">End of Class</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.timeOut" class="form-select">
                    <option value="" disabled>Select End of Class</option>
                    <option v-for="t in endTimeOptionsAfter(addForm.timeIn)" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline">
                <label class="form-label">Year</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.year" class="form-select">
                    <option value="" disabled>Select Year</option>
                    <option v-for="y in effectiveYears" :key="y" :value="y">{{ y }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline" v-if="addForm.year === '3rd Year' || addForm.year === '4th Year'">
                <label class="form-label">Major / Track</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.major" class="form-select">
                    <option value="" disabled>Select Major</option>
                    <option v-for="m in majorOptions" :key="m" :value="m">{{ m || 'None' }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="parallel-row">
                <button class="parallel-btn" :class="{ active: addForm.parallel }" @click="addForm.parallel = true; addForm.parallelCount = 2">
                  <span class="par-radio" :class="{ checked: addForm.parallel }">
                    <svg v-if="addForm.parallel" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  Parallel
                </button>
                <button class="parallel-btn" :class="{ active: !addForm.parallel }" @click="addForm.parallel = false">
                  <span class="par-radio" :class="{ checked: !addForm.parallel }">
                    <svg v-if="!addForm.parallel" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  Not Parallel
                </button>
              </div>
              <div class="form-row-inline" v-if="!addForm.parallel">
                <label class="form-label">Section</label>
                <input v-if="addForm.campus === 'Main Campus'" v-model.trim="addForm.section" list="add-section-suggestions" type="text" class="form-input" placeholder="Enter Section"/>
                <div v-else class="form-select-wrap">
                  <select v-model="addForm.section" class="form-select">
                    <option value="" disabled>Select Section</option>
                    <option v-for="s in getSectionsForYear(addForm.year)" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <datalist id="add-section-suggestions">
                  <option v-for="s in getSectionsForYear(addForm.year)" :key="s" :value="s" />
                </datalist>
              </div>
              <div class="form-row-inline">
                <label class="form-label">Subject</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.subject" class="form-select">
                    <option value="" disabled>Select Subject</option>
                    <option v-for="s in modalSubjectOptionsForAdd" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <template v-if="!addForm.parallel">
                <div class="form-row-inline">
                  <label class="form-label">Room</label>
                  <input v-if="addForm.campus === 'Main Campus'" v-model.trim="addForm.room" list="add-room-suggestions" type="text" class="form-input" placeholder="Enter Room"/>
                  <div v-else class="form-select-wrap">
                    <select v-model="addForm.room" class="form-select">
                      <option value="" disabled>Select Room</option>
                      <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <datalist id="add-room-suggestions">
                    <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name" />
                  </datalist>
                </div>
                <div class="form-row-inline">
                  <label class="form-label">Room Type</label>
                  <div class="form-select-wrap">
                    <select v-model="addForm.roomType" class="form-select">
                      <option value="Lecture">Lecture</option>
                      <option value="Comlab/Laboratory">Comlab/Laboratory</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="form-row-inline">
                  <label class="form-label">Section Count</label>
                  <div class="form-select-wrap">
                    <select v-model="addForm.parallelCount" class="form-select">
                      <option :value="2">2 Sections</option>
                      <option :value="3">3 Sections</option>
                      <option :value="4">4 Sections</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <template v-for="(ps, i) in addForm.parallelSlots" :key="i">
                  <div class="parallel-slot-divider">Slot {{ i + 1 }}</div>
                  <div class="form-row-inline">
                    <label class="form-label">Section {{ i + 1 }}</label>
                    <input v-if="addForm.campus === 'Main Campus'" v-model.trim="ps.section" list="add-section-suggestions" type="text" class="form-input" :placeholder="`Enter Section ${i + 1}`"/>
                    <div v-else class="form-select-wrap">
                      <select v-model="ps.section" class="form-select">
                        <option value="" disabled>Select Section</option>
                        <option v-for="s in getSectionsForYear(addForm.year)" :key="s" :value="s">{{ s }}</option>
                      </select>
                      <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <datalist id="add-section-suggestions">
                      <option v-for="s in getSectionsForYear(addForm.year)" :key="s" :value="s" />
                    </datalist>
                  </div>
                  <div class="form-row-inline">
                    <label class="form-label">Room {{ i + 1 }}</label>
                    <input v-if="addForm.campus === 'Main Campus'" v-model.trim="ps.room" list="add-room-suggestions" type="text" class="form-input" :placeholder="`Enter Room ${i + 1}`"/>
                    <div v-else class="form-select-wrap">
                      <select v-model="ps.room" class="form-select">
                        <option value="" disabled>Select Room</option>
                        <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option>
                      </select>
                      <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  <div class="form-row-inline">
                    <label class="form-label">Room Type {{ i + 1 }}</label>
                    <div class="form-select-wrap">
                      <select v-model="ps.roomType" class="form-select">
                        <option value="Lecture">Lecture</option>
                        <option value="Comlab/Laboratory">Comlab/Laboratory</option>
                      </select>
                      <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                </template>
              </template>
              <div class="form-row-inline">
                <label class="form-label">Campus</label>
                <div class="campus-toggle">
                  <button type="button" class="campus-btn" :class="{ active: addForm.campus === 'South Campus' }" @click="addForm.campus = 'South Campus'">South Campus</button>
                  <button type="button" class="campus-btn" :class="{ active: addForm.campus === 'Main Campus' }" @click="addForm.campus = 'Main Campus'">Main Campus</button>
                </div>
              </div>
            </div>

            <div v-if="addTimeError" class="time-error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ addTimeError }}
            </div>
            <transition name="flash">
              <div v-if="addShowFlash" class="flash-msg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Entry added to grid!
              </div>
            </transition>
            <div class="panel-footer">
              <button class="reset-btn" @click="resetAddForm">Reset</button>
              <button class="save-btn" @click="addEntry" :disabled="!addFormValid">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ═══ Consultation Management Modal ═══ -->
    <Teleport to="body">
      <div v-if="showConsultModal" class="modal-overlay" @click.self="showConsultModal = false">
        <div class="sched-modal-box consult-modal-box">
          <div class="sched-modal-header">
            <div class="consult-header-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </div>
            <div class="consult-heading-copy">
              <div class="sched-modal-mode-badge badge-add">Consultation Hours</div>
              <h2 class="sched-modal-title">Prof. {{ selectedTeacher }}</h2>
              <p class="consult-modal-subtitle">Set the weekly times when students can request a consultation.</p>
            </div>
            <button class="panel-close consult-close" aria-label="Close consultation hours" @click="showConsultModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="consult-modal-content">
            <section class="consult-left-pane" aria-label="Consultation availability and current schedule">
              <div class="consult-usage">
                <div class="consult-usage-copy">
                  <span>Weekly availability</span>
                  <strong :class="consultWeeklyMins >= 240 ? 'limit-warning' : 'limit-ok'">{{ consultWeeklyMins }} of 240 minutes</strong>
                </div>
                <div class="consult-progress" aria-hidden="true"><span :style="{ width: `${Math.min((consultWeeklyMins / 240) * 100, 100)}%` }"></span></div>
              </div>
          <div v-if="consultationSlots.length" class="consult-section-heading">
            <div><span>Current schedule</span><strong>{{ consultationSlots.length }} {{ consultationSlots.length === 1 ? 'slot' : 'slots' }}</strong></div>
            <p>Manage the teacher’s saved consultation availability.</p>
          </div>
          <div v-if="consultationSlots.length" class="consult-slots-list">
            <div v-for="cslot in consultationSlots" :key="cslot.id" class="consult-slot-item">
              <div class="consult-slot-calendar" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
              </div>
              <div class="consult-slot-details">
                <div class="consult-slot-day">{{ cslot.dayOfWeek }}</div>
                <div class="consult-slot-time">{{ cslot.startTime }} – {{ cslot.endTime }}</div>
              </div>
              <div class="consult-slot-dur">{{ cslot.durationMinutes }} min</div>
              <div class="consult-slot-actions">
                <button class="consult-edit-btn" type="button" title="Edit consultation slot" aria-label="Edit consultation slot" @click="editConsultSlot(cslot)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
                <button class="consult-del-btn" @click="deleteConsultSlot(cslot.id)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="consult-empty">
            <span class="consult-empty-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
            </span>
            <div><strong>No consultation hours yet</strong><span>Add the teacher’s first available time below.</span></div>
          </div>
            </section>
            <section class="consult-right-pane" aria-label="Consultation slot form">
          <div class="sched-form consult-form-shell">
            <div class="consult-form-heading">
              <div class="consult-form-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <div><div class="consult-form-title">{{ consultEditId ? 'Edit consultation slot' : 'Add consultation slot' }}</div><p>{{ consultEditId ? 'Update the selected availability below.' : 'Choose a day and available time range.' }}</p></div>
            </div>
            <div class="form-row-inline consult-day-field">
              <label class="form-label">Day</label>
              <div class="form-select-wrap">
                <select v-model="consultForm.dayOfWeek" class="form-select">
                  <option value="" disabled>Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline">
              <label class="form-label">Start Time</label>
              <div class="form-select-wrap">
                <select v-model="consultForm.startTime" class="form-select">
                  <option value="" disabled>Select Time</option>
                  <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline">
              <label class="form-label">End Time</label>
              <div class="form-select-wrap">
                <select v-model="consultForm.endTime" class="form-select">
                  <option value="" disabled>Select Time</option>
                  <option v-for="t in endTimeOptionsAfter(consultForm.startTime)" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div v-if="consultTimeError" class="time-error" style="margin:0 24px 8px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ consultTimeError }}
            </div>
          </div>
          <div class="sched-modal-actions">
            <button v-if="consultEditId" class="cancel-btn-text" @click="consultEditId = null; Object.assign(consultForm, { dayOfWeek: '', startTime: '', endTime: '' })">Cancel Edit</button>
            <button class="cancel-btn-text" @click="showConsultModal = false">Close</button>
            <button class="save-btn" @click="saveConsultSlot" :disabled="!consultForm.dayOfWeek || !consultForm.startTime || !consultForm.endTime || !!consultTimeError">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ consultEditId ? 'Update' : 'Save Slot' }}
            </button>
          </div>
            </section>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Confirm Modal ═══ -->
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
import {
  colorForRoom,
  colorForRoomType,
  days,
  entries,
  parseTime,
  roomOptions,
  sections,
  subjectOptions,
  teacherOptions,
  timeOptions,
  years,
} from '@/composables/useSchedule.js'
import Swal from 'sweetalert2'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()

function endTimeOptionsAfter(startTime) {
  if (!startTime) return timeOptions
  const startMinutes = parseTime(startTime)
  return timeOptions.filter((time) => parseTime(time) > startMinutes)
}
const route  = useRoute()
const currentRoute = computed(() => route.path)

function returnToTermWorkspace() {
  const term = String(route.query.academicTermId || '').trim()
  router.push({
    path: '/admin/academic-terms',
    query: {
      ...(term ? { term } : {}),
      action: 'add',
      mode: route.query.mode === 'room' ? 'room' : 'teacher',
      source: route.query.source === 'current' ? 'current' : 'academic',
    },
  })
}

const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const teacherUserMap = ref({})
const activeTerm = ref(null)
const publishedTerm = ref(null)
const selectedTerm = ref(null)
const activeTermLabel = computed(() => {
  if (!activeTerm.value) return ''
  return `${activeTerm.value.schoolYear} · ${activeTerm.value.semester}`
})
const selectedTermLabel = computed(() => {
  if (!selectedTerm.value) return activeTermLabel.value
  return `${selectedTerm.value.schoolYear} · ${selectedTerm.value.semester}`
})
function getTermId(term) {
  if (!term) return ''
  return String(term._id || term.id || '').trim()
}
function getTermLabel(term) {
  if (!term) return ''
  return `${term.schoolYear || ''} · ${term.semester || ''}`.trim()
}
function getSelectedTermId() {
  return getTermId(selectedTerm.value || publishedTerm.value)
}
function hasTermSwitcher() {
  const inUseId = getTermId(activeTerm.value)
  const publishedId = getTermId(publishedTerm.value)
  return Boolean(inUseId && publishedId && inUseId !== publishedId)
}
function isSelectedTerm(term) {
  return getTermId(term) === getTermId(selectedTerm.value)
}
function selectTerm(term) {
  selectedTerm.value = term || publishedTerm.value || null
}
const effectiveYears = computed(() => {
  const sectionCounts = (selectedTerm.value || publishedTerm.value)?.sectionCounts || {}
  const mapped = Object.keys(sectionCounts)
    .filter(year => Number(sectionCounts[year]) > 0)
    .sort((a, b) => years.indexOf(a) - years.indexOf(b))
  return mapped.length ? mapped : years
})
const effectiveRoomOptions = computed(() => {
  const term = selectedTerm.value || publishedTerm.value
  const configuredRooms = (Array.isArray(term?.rooms) ? term.rooms : [])
    .map(room => typeof room === 'string' ? room : room.name)
    .filter(Boolean)
  const availableRooms = configuredRooms.length ? configuredRooms : roomOptions
  return availableRooms.map((room) => {
    return { name: room, label: room }
  })
})

function getSectionsForYear(year) {
  const term = selectedTerm.value || publishedTerm.value
  const count = Number(term?.sectionCounts?.[year])
  const names = Array.isArray(term?.sectionNames?.[year]) ? term.sectionNames[year] : []
  if (Number.isFinite(count) && count > 0) {
    if (names.length) {
      return names.slice(0, count)
    }
    return Array.from({ length: count }, (_, index) => `South ${index + 1}`)
  }
  return sections
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) { logout(); router.push('/'); throw new Error('Session expired. Please log in again.') }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options,
  })
  let body = {}
  try { body = await response.json() } catch (_error) { body = {} }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) { logout(); router.push('/') }
    const error = new Error(body.message || 'Request failed.')
    error.status = response.status
    error.code = body.code
    throw error
  }
  return body
}

/* ── Nav ── */
const navItems = [
  { name: 'Dashboard',      to: '/admin/dashboard',       icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { name: 'View Schedules', to: '/admin/schedule/view',   icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { name: 'Add Schedule',   to: '/admin/schedule/add',    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>` },
  { name: 'Teachers',       to: '/admin/teachers',        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events',         to: '/admin/events',          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Users',          to: '/admin/users',           icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { name: 'Settings',       to: '/admin/settings',        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

/* ── 30-minute time slots for grid (same as timeOptions) ── */
const timeSlots30 = timeOptions  // ['7:00 AM', '7:30 AM', '8:00 AM', ...]

/* ── Add mode state ── */
const initialAddRouteMode = ['room', 'teacher'].includes(String(route.query.mode || ''))
  ? String(route.query.mode)
  : null
const addMode    = ref(initialAddRouteMode)    // null | 'teacher' | 'room'
const contextFloor = ref(null)
const contextRoom  = ref(initialAddRouteMode === 'room' ? (String(route.query.room || '') || null) : null)

const addFloors = [
  { label: '2nd Floor', number: '2', rooms: ['201', '202', '204', '205', '208', '209'] },
  { label: '3rd Floor', number: '3', rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309'] },
  { label: '4th Floor', number: '4', rooms: ['401', '402', '403', '404', '405', '406 (Comlab 1)', '407 (Comlab 2)', '408 (Comlab 3)', '409 (Comlab 4)'] },
]
if (contextRoom.value) {
  contextFloor.value = addFloors.find(floor => floor.rooms.some(room =>
    room === contextRoom.value
    || room.startsWith(`${contextRoom.value} `)
    || contextRoom.value.startsWith(`${room} `)
  ))?.label || null
}
const contextFloorRooms = computed(
  () => addFloors.find(f => f.label === contextFloor.value)?.rooms ?? []
)

const addTeacherList     = ref([])
const addTeacherSearchQuery = ref('')
const roomSearchQuery = ref('')
const loadingAddTeachers = ref(false)

const filteredAddTeacherList = computed(() => {
  const query = addTeacherSearchQuery.value.trim().toLowerCase()
  if (!query) return addTeacherList.value
  return addTeacherList.value.filter(teacher => teacher.name.toLowerCase().includes(query))
})

const filteredContextFloorRooms = computed(() => {
  const query = roomSearchQuery.value.trim().toLowerCase()
  if (!query) return contextFloorRooms.value
  return contextFloorRooms.value.filter(room => room.toLowerCase().includes(query))
})

function getTeacherInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || 'T'
}

function getTeacherAvatar(name = '', avatar = '') {
  if (avatar) return avatar
  const safeName = encodeURIComponent(name || 'Teacher')
  return `https://ui-avatars.com/api/?name=${safeName}&background=DDECE5&color=1B4332`
}

async function loadTermContext() {
  try {
    const publishedResponse = await apiRequest('/academic-terms/published').catch(() => ({ term: null }))
    activeTerm.value = null
    publishedTerm.value = publishedResponse.term || null
    if (!selectedTerm.value) selectedTerm.value = publishedTerm.value || null
  } catch (_) {
    activeTerm.value = null
    publishedTerm.value = null
  }
}

async function ensureTermSelection() {
  if (selectedTerm.value) return
  selectedTerm.value = publishedTerm.value || null
}

async function loadAddTeachers() {
  if (addTeacherList.value.length) return
  loadingAddTeachers.value = true
  try {
    const res = await apiRequest('/users?role=teacher')
    if (res.users && Array.isArray(res.users)) {
      addTeacherList.value = res.users
        .filter(u => Array.isArray(u.roles) ? u.roles.includes('teacher') : u.role === 'Teacher')
        .map(u => {
          const name = `${u.firstName} ${u.lastName}`.trim()
          return {
            id: u._id || u.id,
            name,
            avatar: getTeacherAvatar(name, u.avatar || ''),
          }
        })
        .filter(teacher => teacher.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name))
    }
  } catch (_) {}
  loadingAddTeachers.value = false
}

function resetAddMode() {
  addMode.value      = null
  selectedTeacher.value = ''
  contextFloor.value = null
  contextRoom.value  = null
}

function chooseRoomFromFloor(floorLabel, room) {
  contextFloor.value = floorLabel
  contextRoom.value = room
}

/* ── Room-context grid helpers (for room add mode) ── */
function getEntriesForRoomCell30(rowSlot, day) {
  if (!contextRoom.value) return []
  const rowStart = parseTime(rowSlot)
  const rowEnd   = rowStart + 30
  return Object.entries(entries)
    .filter(([, v]) => {
      if (!v.room || v.room !== contextRoom.value) return false
      if (v.day !== day) return false
      const t = parseTime(v.timeIn)
      return t >= rowStart && t < rowEnd
    })
    .map(([k, v]) => ({ ...v, _key: k }))
}

function isSpannedRoomCell30(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForRoomCell30(timeSlots30[i], day)
    if (prev.length > 0 && i + getRowspan30(prev[0]) > slotIndex) return true
  }
  return false
}

async function handleRoomCellClick30(slot, day) {
  const cell = getEntriesForRoomCell30(slot, day)
  if (cell.length > 0) {
    // Show info — editing via teacher mode is cleaner
    await Swal.fire({
      icon: 'info', title: 'Slot Occupied',
      html: `<div style="font-size:0.9rem;color:#444"><b>${cell[0].teacher}</b><br>${cell[0].subject}<br>${cell[0].slot}</div><p style="font-size:0.8rem;color:#888;margin-top:8px;">To edit this entry, use the <b>By Teacher</b> mode.</p>`,
      confirmButtonText: 'OK', confirmButtonColor: '#4b5563', background: '#fff',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
  } else {
    openAddModal(slot, day)
  }
}

/* ── Filters ── */
const filterSection    = ref('All')
const selectedTeacher  = ref(initialAddRouteMode === 'teacher' ? String(route.query.teacher || '') : '')
const yearDropdown      = ref('All')
const scheduleViewMode  = ref(initialAddRouteMode ? 'timetable' : '')

function selectViewMode(mode) {
  scheduleViewMode.value = mode
  if (mode === 'timetable') {
    resetAddMode()
  }
  if (mode === 'list') {
    resetAddMode()
  }
}

const visibleScheduleEntries = computed(() => {
  return Object.entries(entries)
    .map(([key, value]) => ({ ...value, _key: key }))
    .filter((entry) => {
      if (scheduleViewMode.value !== 'list') {
        if (addMode.value === 'teacher' && entry.teacher !== selectedTeacher.value) return false
        if (addMode.value === 'room' && entry.room !== contextRoom.value) return false
      }
      if (filterSection.value !== 'All' && entry.entryType !== 'lunch' && entry.section !== filterSection.value) return false
      if (yearDropdown.value !== 'All' && entry.entryType !== 'lunch' && entry.year !== yearDropdown.value) return false
      return true
    })
    .sort((a, b) => {
      if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day)
      if (a.timeIn !== b.timeIn) return parseTime(a.timeIn) - parseTime(b.timeIn)
      return a.section.localeCompare(b.section || '')
    })
})

const listAddForm = reactive({
  day: '', timeIn: '', timeOut: '', year: '', section: '', campus: 'South Campus',
  teacher: '', major: '', subject: '', room: '', roomType: 'Lecture', parallel: false, parallelCount: 1,
})
const listTimeError = ref('')
const listAddSection = ref(null)
const listAddFormValid = computed(() =>
  listAddForm.day && listAddForm.timeIn && listAddForm.timeOut &&
  listAddForm.year && listAddForm.teacher && listAddForm.subject && listAddForm.room &&
  !listTimeError.value
)

watch([() => listAddForm.timeIn, () => listAddForm.timeOut], () => {
  if (listAddForm.timeIn && listAddForm.timeOut) {
    if (parseTime(listAddForm.timeOut) <= parseTime(listAddForm.timeIn)) {
      listAddForm.timeOut = ''
      listTimeError.value = ''
      return
    }
    listTimeError.value = ''
  } else { listTimeError.value = '' }
})

async function addListEntry() {
  if (!listAddFormValid.value) return
  try {
    const payload = buildSchedulePayload(listAddForm)
    const conflicts = checkScheduleConflict(payload)
    if (conflicts.length > 0) { await showConflictDialog(conflicts); return }
    if (!await confirmLongTeacherSession(payload)) return
    await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
    await refreshScheduleData(listAddForm.teacher)
    yearDropdown.value = 'All'; filterSection.value = 'All'
    listAddForm.day = ''; listAddForm.timeIn = ''; listAddForm.timeOut = '';
    listAddForm.year = ''; listAddForm.section = ''; listAddForm.teacher = '';
    listAddForm.subject = ''; listAddForm.room = ''; listAddForm.major = '';
    listAddForm.roomType = 'Lecture'
    listAddForm.campus = 'South Campus'
  } catch (error) {
    await showScheduleError(error)
  }
}

async function scrollToListAddForm() {
  await nextTick()
  listAddSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => listAddSection.value?.querySelector('select')?.focus(), 450)
}

watch(selectedTeacher, async (teacher) => {
  fetchConsultationsForTeacher()
  if (teacher) await refreshScheduleData(teacher)
})

/* ── Pages / tables ── */
const pages = ref([{ label: 'All', section: 'All' }])

/* ── Consultation availability ── */
const consultationSlots = ref([])

async function fetchConsultationsForTeacher() {
  if (!selectedTeacher.value) { consultationSlots.value = []; return }
  try {
    const termId = getSelectedTermId()
    const query = new URLSearchParams({ teacher: selectedTeacher.value })
    if (termId) query.set('academicTermId', termId)
    const res = await apiRequest(`/consultations?${query.toString()}`)
    consultationSlots.value = res.consultations || []
  } catch (_) { consultationSlots.value = [] }
}

watch(selectedTerm, async () => {
  if (selectedTeacher.value || addMode.value === 'teacher' || addMode.value === 'room') {
    await refreshScheduleData(selectedTeacher.value || '')
  }
  if (selectedTeacher.value) {
    await fetchConsultationsForTeacher()
  }
})

/* ── 30-min grid helpers ── */

function getEntriesForCell30(rowSlot, day) {
  const rowStart = parseTime(rowSlot)
  const rowEnd   = rowStart + 30

  const sectionMatch = Object.entries(entries).find(([k, v]) => {
    const parts = k.split('|')
    if (parts.length < 4) return false
    if (selectedTeacher.value && v.teacher !== selectedTeacher.value) return false
    if (yearDropdown.value !== 'All' && v.year !== yearDropdown.value && v.entryType !== 'lunch') return false
    if (filterSection.value !== 'All' && parts[1] !== filterSection.value && v.entryType !== 'lunch') return false
    if (parts[3] !== day) return false
    const t = parseTime(v.timeIn)
    return t >= rowStart && t < rowEnd
  })

  if (!sectionMatch) return []

  const [, matchedEntry] = sectionMatch

  if (matchedEntry.parallel && matchedEntry.parallelGroupId) {
    return Object.entries(entries)
      .filter(([k, v]) => {
        const parts = k.split('|')
        if (parts.length < 4) return false
        if (selectedTeacher.value && v.teacher !== selectedTeacher.value) return false
        if (yearDropdown.value !== 'All' && v.year !== yearDropdown.value && v.entryType !== 'lunch') return false
        if (filterSection.value !== 'All' && parts[1] !== filterSection.value && v.entryType !== 'lunch') return false
        if (parts[3] !== day) return false
        if (v.parallelGroupId !== matchedEntry.parallelGroupId) return false
        const t = parseTime(v.timeIn)
        return t >= rowStart && t < rowEnd
      })
      .map(([k, v]) => ({ ...v, _key: k }))
  }

  return [{ ...matchedEntry, _key: sectionMatch[0] }]
}

function getRowspan30(entry) {
  if (!entry?.timeIn || !entry?.timeOut) return 1
  const start = parseTime(entry.timeIn)
  const end   = parseTime(entry.timeOut)
  const duration = Math.max(1, end - start)
  const startOffset = start % 30
  return Math.max(1, Math.ceil((startOffset + duration) / 30))
}

function isSpannedCell30(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForCell30(timeSlots30[i], day)
    if (prev.length > 0 && i + getRowspan30(prev[0]) > slotIndex) return true
  }
  return false
}

function entryStyle30(rowSlot, entry) {
  if (!entry?.timeIn || !entry?.timeOut) return {}
  const rowStart   = parseTime(rowSlot)
  const entryStart = parseTime(entry.timeIn)
  const mins       = Math.max(1, parseTime(entry.timeOut) - entryStart)
  const offsetMins = Math.max(0, entryStart - rowStart)
  const spannedMins = getRowspan30(entry) * 30
  const trailingMins = Math.max(0, spannedMins - offsetMins - mins)
  const hasFollowingEntry = Object.values(entries).some(candidate =>
    candidate.day === entry.day &&
    parseTime(candidate.timeIn) === parseTime(entry.timeOut) &&
    (addMode.value === 'room'
      ? candidate.room === entry.room
      : candidate.teacher === entry.teacher)
  )
  const bottomGap = hasFollowingEntry ? 4 : -40
  return {
    top: `calc(${(offsetMins / spannedMins) * 100}% + 4px)`,
    bottom: `calc(${(trailingMins / spannedMins) * 100}% + ${bottomGap}px)`,
    height: 'auto',
    zIndex: 3,
  }
}

function getConsultationForCell30(rowSlot, day) {
  if (!selectedTeacher.value) return null
  const rowStart = parseTime(rowSlot)
  const rowEnd   = rowStart + 30
  return consultationSlots.value.find(c => {
    if (c.dayOfWeek !== day) return false
    const t = parseTime(c.startTime)
    return t >= rowStart && t < rowEnd
  }) ?? null
}

function getConsultRowspan30(consult) {
  if (!consult?.startTime || !consult?.endTime) return 1
  return Math.max(1, Math.ceil((parseTime(consult.endTime) - parseTime(consult.startTime)) / 30))
}

function isConsultSpannedCell30(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const consult = getConsultationForCell30(timeSlots30[i], day)
    if (consult && i + getConsultRowspan30(consult) > slotIndex) return true
  }
  return false
}

function consultEntryStyle30(rowSlot, consult) {
  if (!consult?.startTime || !consult?.endTime) return {}
  const rowStart     = parseTime(rowSlot)
  const consultStart = parseTime(consult.startTime)
  const mins         = Math.max(1, parseTime(consult.endTime) - consultStart)
  const offsetMins   = Math.max(0, consultStart - rowStart)
  const spannedMins  = getConsultRowspan30(consult) * 30
  const trailingMins = Math.max(0, spannedMins - offsetMins - mins)
  return {
    top: `calc(${(offsetMins / spannedMins) * 100}% + 4px)`,
    bottom: `calc(${(trailingMins / spannedMins) * 100}% + 4px)`,
    height: 'auto',
  }
}

function canInteractCell30(slot, day) {
  const cellEntries = getEntriesForCell30(slot, day)
  const hasEntry = cellEntries.length > 0
  if (hasEntry && !selectedTeacher.value) return false
  return !getConsultationForCell30(slot, day) || hasEntry
}

async function handleCellClick30(slot, day) {
  const cell = getEntriesForCell30(slot, day)
  if (cell.length > 0) {
    if (!selectedTeacher.value) {
      await Swal.fire({
        icon: 'info', title: 'Select a Teacher',
        text: 'Please select a specific teacher to edit an existing schedule.',
        confirmButtonText: 'OK', confirmButtonColor: '#4b5563', background: '#fff',
        customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
      })
      return
    }
    if (cell[0].entryType === 'lunch') {
      openLunchBreakEditor(cell[0])
      return
    }
    openEditModal(slot, day, cell[0])
  } else {
    if (!selectedTeacher.value) {
      await Swal.fire({
        icon: 'info', title: 'No Teacher Selected',
        text: 'Please select a teacher from the dropdown first.',
        confirmButtonText: 'OK', confirmButtonColor: '#4b5563', background: '#fff',
        customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
      })
      return
    }
    openAddModal(slot, day)
  }
}

/* ── Entries store ── */
function resetEntriesStore() {
  Object.keys(entries).forEach(key => { delete entries[key] })
}

function formatAddedAt(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return (
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

function inferCampus(entry = {}) {
  if (entry.campus === 'Main Campus' || entry.campus === 'South Campus') return entry.campus
  if (entry.color === 'color-orange') return 'Main Campus'
  return 'South Campus'
}

function syncPagesFromApi(apiTables, preferredLabel = '') {
  const sorted = Array.isArray(apiTables)
    ? apiTables.map(table => ({ label: table.label, section: 'All' })).sort((a, b) => a.label.localeCompare(b.label))
    : []
  pages.value = [{ label: 'All', section: 'All' }, ...sorted]
}

function syncEntriesFromApi(apiEntries) {
  resetEntriesStore()
  if (!Array.isArray(apiEntries)) return
  apiEntries.forEach(entry => {
    const tableLabel = entry.tableLabel || entry.teacher
    const isLunch = entry.entryType === 'lunch' || entry.color === 'color-gray' || /\blunch\b/i.test(String(entry.subject || ''))
    const legacySection = entry.section || ''
    const section = isLunch ? '' : legacySection
    const day = entry.day
    const slot = `${entry.timeIn} - ${entry.timeOut}`
    if (!tableLabel || (!legacySection && !isLunch) || !day || !entry.timeIn || !entry.timeOut) return
    const key = `${tableLabel}|${legacySection || `__lunch_${entry.id || slot}`}|${slot}|${day}`
    const inferredCampus = inferCampus(entry)
    const roomBasedColor = colorForRoomType(entry.roomType, entry.room)
    entries[key] = {
      id: entry.id || '',
      teacher: entry.teacher,
      subject: entry.subject,
      campus: inferredCampus,
      room: entry.room,
      roomType: entry.roomType || 'Lecture',
      year: isLunch ? '' : entry.year,
      tableLabel,
      section,
      legacySection: isLunch ? legacySection : '',
      legacyYear: isLunch ? entry.year : '',
      day,
      slot,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      parallel: Boolean(entry.parallel),
      parallelGroupId: entry.parallelGroupId || null,
      parallelCount: entry.parallelCount || 1,
      parallelSlots: Array.isArray(entry.parallelSlots) ? entry.parallelSlots.map(s => ({ ...s })) : [],
      entryType: isLunch ? 'lunch' : (entry.entryType || 'class'),
      isSubstitute: Boolean(entry.isSubstitute),
      subbedLabel: entry.subbedLabel || '',
      color: isLunch
        ? 'color-gray'
        : (roomBasedColor || entry.color || 'color-yellow'),
      addedAt: formatAddedAt(entry.addedAt),
    }
  })
}

async function refreshScheduleData(preferredLabel = '') {
  const termId = getSelectedTermId()
  const scheduleQuery = termId ? `?academicTermId=${encodeURIComponent(termId)}` : ''
  const [tablesPayload, schedulesPayload] = await Promise.all([
    apiRequest('/schedules/tables'),
    apiRequest(`/schedules${scheduleQuery}`),
  ])

  const teacherUser = selectedTeacher.value ? teacherUserMap.value[selectedTeacher.value] : null
  const teacherId = teacherUser?._id || teacherUser?.id
  if (addMode.value === 'teacher' && selectedTeacher.value && teacherId) {
    try {
      const date = new Date().toLocaleDateString('en-CA')
      const substituteQuery = new URLSearchParams({ date, teacherId })
      if (termId) substituteQuery.set('academicTermId', termId)
      const substitutePayload = await apiRequest(`/substitutes?${substituteQuery.toString()}`)
      const assignments = Array.isArray(substitutePayload.assignments) ? substitutePayload.assignments : []
      assignments.forEach((assignment) => {
        const assignmentDate = new Date(assignment.date)
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignmentDate.getDay()]
        const original = assignment.originalTeacher || {}
        const substitute = assignment.substituteTeacher || {}
        const originalName = `${original.firstName || ''} ${original.lastName || ''}`.trim()
        const substituteName = `${substitute.firstName || ''} ${substitute.lastName || ''}`.trim()
        const isSelectedSubstitute = String(substitute._id || substitute.id || '') === String(teacherId)

        ;(assignment.entries || []).forEach((entry) => {
          schedulesPayload.entries = schedulesPayload.entries || []
          schedulesPayload.entries.push({
            ...entry,
            day,
            subject: entry.subject || 'Substitute class',
            teacher: selectedTeacher.value,
            tableLabel: selectedTeacher.value,
            isSubstitute: true,
            subbedLabel: isSelectedSubstitute
              ? `SUBBED TO ${originalName || 'ORIGINAL TEACHER'}`
              : `SUBBED BY ${substituteName || 'SUBSTITUTE TEACHER'}`,
          })
        })
      })
    } catch (_error) {
      // Keep the regular schedule usable if substitute details are unavailable.
    }
  }

  syncPagesFromApi(tablesPayload.tables, preferredLabel)
  syncEntriesFromApi(schedulesPayload.entries)
}

/* ── Conflict checking ── */
function checkScheduleConflict(payload, skipFilter = null) {
  const newTimeIn  = parseTime(payload.timeIn)
  const newTimeOut = parseTime(payload.timeOut)
  const conflicts  = []
  const seen       = new Set()
  const newRooms   = payload.parallel
    ? (payload.parallelSlots || []).map(s => s.room).filter(Boolean)
    : [payload.room].filter(Boolean)

  const selectedId = getSelectedTermId()
  const restrictByTerm = Boolean(selectedId)

  if (payload.parallel) {
    const slots = (payload.parallelSlots || []).filter(Boolean)
    const sections = slots.map(s => String(s.section || '').trim()).filter(Boolean)
    const rooms = slots.map(s => String(s.room || '').trim()).filter(Boolean)

    const duplicateSections = sections.filter((section, index) => sections.indexOf(section) !== index)
    if (duplicateSections.length) {
      conflicts.push({
        type: 'Parallel',
        message: 'Parallel sections must be unique',
        detail: 'Each parallel slot needs a different section.',
      })
    }

    const duplicateRooms = rooms.filter((room, index) => rooms.indexOf(room) !== index)
    if (duplicateRooms.length) {
      conflicts.push({
        type: 'Parallel',
        message: 'Parallel rooms must be unique',
        detail: 'Each parallel slot needs a different room.',
      })
    }
  }

  Object.entries(entries).forEach(([key, entry]) => {
    if (skipFilter && skipFilter(key, entry)) return
    if (restrictByTerm) {
      const entryTermId = String(entry.academicTermId || '').trim()
      if (!entryTermId || entryTermId !== String(selectedId)) return
    }
    const isSameDay     = entry.day === payload.day
    const isTimeOverlap = newTimeIn < parseTime(entry.timeOut) && newTimeOut > parseTime(entry.timeIn)
    if (!isSameDay || !isTimeOverlap) return
    if (entry.teacher === payload.teacher) {
      const dedupKey = `teacher|${payload.teacher}|${entry.timeIn}|${entry.timeOut}`
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey)
        conflicts.push({
          type: 'Teacher',
          message: `${payload.teacher} is already assigned on ${payload.day}`,
          detail: `${entry.timeIn} – ${entry.timeOut} · ${entry.subject} · ${entry.section}`,
        })
      }
    }
    for (const room of newRooms) {
      if (room && room === entry.room) {
        const dedupKey = `room|${room}|${entry.timeIn}|${entry.timeOut}`
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey)
          conflicts.push({
            type: 'Room',
            message: `${room} is already occupied on ${payload.day}`,
            detail: `${entry.timeIn} – ${entry.timeOut} · ${entry.subject} · ${entry.teacher}`,
          })
        }
      }
    }
  })
  return conflicts
}

function buildConflictHtml(conflicts) {
  return conflicts.map(c => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
      <span style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;
        background:${c.type === 'Teacher' ? '#fff3cd' : '#fde8e8'};
        color:${c.type === 'Teacher' ? '#856404' : '#c62828'};
        font-size:0.7rem;font-weight:700;letter-spacing:.04em;
        padding:2px 7px;border-radius:4px;margin-top:2px">${c.type.toUpperCase()}</span>
      <div style="text-align:left;">
        <div style="font-size:0.875rem;font-weight:600;color:#1a1a1a;">${c.message}</div>
        <div style="font-size:0.78rem;color:#666;margin-top:1px;">${c.detail}</div>
      </div>
    </div>`).join('')
}

async function showConflictDialog(conflicts) {
  return Swal.fire({
    icon: 'warning',
    title: '<span style="font-size:1.1rem;font-weight:700;">Schedule Conflict</span>',
    html: `
      <p style="font-size:0.83rem;color:#666;margin:0 0 12px;">The following conflicts were found.</p>
      <div style="max-height:260px;overflow-y:auto;padding-right:2px;">
        ${buildConflictHtml(conflicts)}
      </div>`,
    confirmButtonText: 'OK',
    confirmButtonColor: '#4b5563',
    background: '#fff',
    customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title' },
  })
}

async function showScheduleError(error, fallbackTitle = 'Unable to save schedule') {
  const isConflict = error?.status === 409
  await Swal.fire({
    icon: isConflict ? 'error' : 'warning',
    title: isConflict ? 'Schedule Conflict' : fallbackTitle,
    html: `<span style="font-size:0.95rem;color:#444">${error?.message || 'Something went wrong. Please try again.'}</span>`,
    confirmButtonText: 'Got it',
    confirmButtonColor: isConflict ? '#e63946' : '#4b5563',
    background: '#fff',
    customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
  })
}

function buildTeacherScheduleIntervals(payload) {
  const teacherName = String(payload.teacher || '').trim()
  if (!teacherName) return []

  const scheduleEntries = Object.values(entries)
    .filter(entry => String(entry.teacher || '').trim() === teacherName && entry.day === payload.day)
    .filter(entry => entry.entryType !== 'lunch' && entry.subject !== 'Lunch Break')

  const intervals = scheduleEntries
    .map(entry => ({ start: parseTime(entry.timeIn), end: parseTime(entry.timeOut) }))
    .concat([{ start: parseTime(payload.timeIn), end: parseTime(payload.timeOut) }])
    .filter(interval => interval.start < interval.end)
    .sort((a, b) => a.start - b.start)

  const merged = []
  for (const interval of intervals) {
    if (!merged.length) { merged.push({ ...interval }); continue }
    const last = merged[merged.length - 1]
    if (interval.start <= last.end + 29) {
      last.end = Math.max(last.end, interval.end)
    } else {
      merged.push({ ...interval })
    }
  }
  return merged
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

function formatWarningTime(minutes) {
  if (minutes == null || minutes === '') return ''
  const total = Number(minutes)
  if (Number.isNaN(total)) return ''
  const hours = Math.floor(total / 60)
  const mins = total % 60
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12
  return `${normalizedHour}:${String(mins).padStart(2, '0')}`
}

async function confirmLongTeacherSession(payload) {
  if (!payload.teacher || !payload.day) return true
  const payloadKey = `${payload.teacher}|${payload.day}|${payload.timeIn}|${payload.timeOut}`
  if (lastLongSessionConfirmed.value === payloadKey) return true

  const blocks = buildTeacherScheduleIntervals(payload)
  const longBlock = blocks.find(block => block.end - block.start >= 240)
  if (!longBlock) return true

  const duration = formatDuration(longBlock.end - longBlock.start)
  const startTime = formatWarningTime(longBlock.start)
  const endTime = formatWarningTime(longBlock.end)

  const result = await Swal.fire({
    icon: 'warning',
    title: 'Long teaching block',
    html: `
      <p style="font-size:0.95rem;color:#444;margin:0 0 12px;">${payload.teacher} is scheduled for <strong>${duration}</strong> straight on <strong>${payload.day}</strong>.</p>
      <p style="font-size:0.95rem;color:#444;margin:0 0 12px;"><strong>${startTime} – ${endTime}</strong></p>
      <p style="font-size:0.95rem;color:#444;margin:0;">Please give a 30 mins break if possible.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Yes, continue',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#4b5563',
    cancelButtonColor: '#6c757d',
    background: '#fff',
    customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
  })

  if (result.isConfirmed) {
    lastLongSessionConfirmed.value = payloadKey
    return true
  }
  return false
}

/* ── Modal state ── */
const showSchedModal = ref(false)
const editMode       = ref(false)
const fromButton     = ref(false)
const showLunchBreakPicker = ref(false)
const lastLongSessionConfirmed = ref('')
const lunchBreakContext = reactive({
  id: '',
  teacher: '',
  day: '',
  campus: 'South Campus',
  editing: false,
  oldTableLabel: '',
  oldSection: '',
  oldDay: '',
  oldTimeIn: '',
  oldTimeOut: '',
  legacyYear: '',
})

const form = reactive({
  slot: '', day: '', teacher: '', subject: '',
  year: '', major: '', section: '',
  campus: 'South Campus',
  room: '', roomType: 'Lecture', parallel: false,
  parallelCount: 2,
  parallelSlots: [],
  color: 'color-green',
  _parallelGroupId: null,
  addedAt: '',
  timeIn: '',
  timeOut: '',
  _oldSlot: '',
  _oldYear: '',
  _oldTableLabel: '',
  _oldSection: '',
  _oldDay: '',
})
const modalTimeError = ref('')
// majors and elective -> major mapping (simple heuristic)
const majorOptions = ['','Software','Network','Multimedia','Security','General']
const electiveMajorMap = {
  'Network Security': 'Security',
  'Game Development': 'Multimedia',
  'Intelligent Systems': 'Software',
  '3D Animation': 'Multimedia',
  'Computer Forensics': 'Security',
  'Ethical Hacking': 'Security',
  'Cloud Computing': 'Network',
  'Script Writing': 'Multimedia',
  'Applied Analytics': 'General',
}

function subjectMatchesMajor(subject, major) {
  if (!major) return false
  return Object.keys(electiveMajorMap).some(k => subject.includes(k) && electiveMajorMap[k] === major)
}

const modalSubjectOptions = computed(() => {
  const base = subjectOptions.filter((subject) => subject !== 'Lunch Break')
  // hide electives for 1st/2nd and for years other than 3rd when no special rule
  if (form.year === '1st Year' || form.year === '2nd Year') return base.filter(s => !/Elective/i.test(s))
  if (form.year === '3rd Year') {
    const nonElectives = base.filter(s => !/Elective/i.test(s))
    const electives = base.filter(s => /Elective/i.test(s))
    if (!form.major) return nonElectives
    return nonElectives.concat(electives.filter(s => subjectMatchesMajor(s, form.major)))
  }
  // for other years (including 4th), only non-electives
  return base.filter(s => !/Elective/i.test(s))
})
// computed for add panel (uses addForm.year/addForm.major)
const modalSubjectOptionsForAdd = computed(() => {
  const base = subjectOptions.filter((subject) => subject !== 'Lunch Break')
  if (addForm.year === '1st Year' || addForm.year === '2nd Year') return base.filter(s => !/Elective/i.test(s))
  if (addForm.year === '3rd Year') {
    const nonElectives = base.filter(s => !/Elective/i.test(s))
    const electives = base.filter(s => /Elective/i.test(s))
    if (!addForm.major) return nonElectives
    return nonElectives.concat(electives.filter(s => subjectMatchesMajor(s, addForm.major)))
  }
  return base.filter(s => !/Elective/i.test(s))
})
// list view subject options based on listAddForm.year/major
const listSubjectOptions = computed(() => {
  const base = subjectOptions.filter((subject) => subject !== 'Lunch Break')
  if (listAddForm.year === '1st Year' || listAddForm.year === '2nd Year') return base.filter(s => !/Elective/i.test(s))
  if (listAddForm.year === '3rd Year') {
    const nonElectives = base.filter(s => !/Elective/i.test(s))
    const electives = base.filter(s => /Elective/i.test(s))
    if (!listAddForm.major) return nonElectives
    return nonElectives.concat(electives.filter(s => subjectMatchesMajor(s, listAddForm.major)))
  }
  return base.filter(s => !/Elective/i.test(s))
})
const lunchBreakForm = reactive({ timeIn: '', timeOut: '' })
const lunchBreakTimeError = computed(() => {
  if (!lunchBreakForm.timeIn || !lunchBreakForm.timeOut) return ''
  return parseTime(lunchBreakForm.timeOut) <= parseTime(lunchBreakForm.timeIn)
    ? 'End time must be after start time.'
    : ''
})

watch(() => lunchBreakForm.timeIn, (startTime) => {
  if (startTime && lunchBreakForm.timeOut && parseTime(lunchBreakForm.timeOut) <= parseTime(startTime)) {
    lunchBreakForm.timeOut = ''
  }
})

function buildSlots(count) {
  return Array.from({ length: count }, () => ({ section: '', room: '', roomType: 'Lecture' }))
}

watch([() => form.timeIn, () => form.timeOut], () => {
  if (form.timeIn && form.timeOut) {
    if (parseTime(form.timeOut) <= parseTime(form.timeIn)) {
      form.timeOut = ''
      modalTimeError.value = ''
      return
    }
    modalTimeError.value = ''
  } else { modalTimeError.value = '' }
})

watch(() => form.parallelCount, (val) => {
  while (form.parallelSlots.length < val)  form.parallelSlots.push({ section: '', room: '', roomType: 'Lecture' })
  while (form.parallelSlots.length > val)  form.parallelSlots.pop()
})

watch(() => form.room, (val) => {
  const auto = colorForRoom(val)
  if (auto) form.color = auto
})

function openLunchBreakPicker() {
  lunchBreakContext.id = ''
  lunchBreakContext.editing = false
  lunchBreakContext.oldTableLabel = ''
  lunchBreakContext.oldSection = ''
  lunchBreakContext.oldDay = ''
  lunchBreakContext.oldTimeIn = ''
  lunchBreakContext.oldTimeOut = ''
  lunchBreakContext.legacyYear = ''
  lunchBreakForm.timeIn = form.timeIn || ''
  lunchBreakForm.timeOut = form.timeOut || ''
  showLunchBreakPicker.value = true
}

function openLunchBreakEditor(entry) {
  // Lunch entries use a dedicated time-only editor. They do not require
  // class fields such as year, section, subject, or room.
  lunchBreakContext.id = entry.id || ''
  lunchBreakContext.teacher = entry.teacher || selectedTeacher.value || ''
  lunchBreakContext.day = entry.day || ''
  lunchBreakContext.campus = entry.campus || 'South Campus'
  lunchBreakContext.editing = true
  lunchBreakContext.oldTableLabel = entry.tableLabel || entry.teacher || ''
  lunchBreakContext.oldSection = entry.legacySection || entry.section || 'Lunch Break'
  lunchBreakContext.oldDay = entry.day || ''
  lunchBreakContext.oldTimeIn = entry.timeIn || ''
  lunchBreakContext.oldTimeOut = entry.timeOut || ''
  lunchBreakContext.legacyYear = years.includes(entry.legacyYear || entry.year) ? (entry.legacyYear || entry.year) : years[0]
  lunchBreakForm.timeIn = entry.timeIn || ''
  lunchBreakForm.timeOut = entry.timeOut || ''
  showSchedModal.value = false
  showLunchBreakPicker.value = true
}

function isMissingLunchPatchRoute(error) {
  // A current server returns "Lunch break not found" for an invalid ID. Do
  // not fall back in that case because a replace could recreate a deleted
  // record. Older servers instead return a generic 404 for the PATCH route.
  return error?.status === 404 && !/lunch break not found/i.test(String(error?.message || ''))
}

async function updateLunchBreak(payload) {
  try {
    return await apiRequest(`/schedules/lunch/${encodeURIComponent(lunchBreakContext.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        day: payload.day,
        timeIn: payload.timeIn,
        timeOut: payload.timeOut,
      }),
    })
  } catch (error) {
    if (!isMissingLunchPatchRoute(error)) throw error

    // Compatibility for the already-running server, which has the regular
    // replace endpoint but not the lunch PATCH route. These fields are drawn
    // from the saved legacy entry; the admin still only edits the two times.
    const legacyYear = years.includes(lunchBreakContext.legacyYear)
      ? lunchBreakContext.legacyYear
      : years[0]
    const legacySection = lunchBreakContext.oldSection || 'Lunch Break'
    const old = {
      tableLabel: lunchBreakContext.oldTableLabel || lunchBreakContext.teacher,
      section: legacySection,
      day: lunchBreakContext.oldDay || lunchBreakContext.day,
      timeIn: lunchBreakContext.oldTimeIn,
      timeOut: lunchBreakContext.oldTimeOut,
    }
    const next = {
      tableLabel: lunchBreakContext.teacher,
      baseYear: legacyYear,
      year: legacyYear,
      campus: payload.campus,
      day: payload.day,
      timeIn: payload.timeIn,
      timeOut: payload.timeOut,
      teacher: lunchBreakContext.teacher,
      subject: 'Lunch Break',
      section: legacySection,
      room: '',
      parallel: false,
      parallelCount: 1,
    }

    return apiRequest('/schedules/replace', {
      method: 'POST',
      body: JSON.stringify({ old, next }),
    })
  }
}

async function postLunchBreak(payload) {
  try {
    return await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
  } catch (error) {
    // Older API servers do not recognize `entryType: 'lunch'` and run the
    // normal schedule validator instead. Retry only that exact legacy error
    // with internal values; the lunch popup still needs only day and times.
    const isLegacyValidator = error?.status === 400 && error?.message === 'Missing required schedule fields.'
    if (!isLegacyValidator) throw error

    const legacyYear = years.includes(yearDropdown.value) ? yearDropdown.value : years[0]
    return apiRequest('/schedules', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        subject: 'Lunch Break',
        year: legacyYear,
        baseYear: legacyYear,
        section: 'Lunch Break',
      }),
    })
  }
}

async function saveLunchBreakFromPicker() {
  if (!lunchBreakContext.teacher || !lunchBreakContext.day || !lunchBreakForm.timeIn || !lunchBreakForm.timeOut || lunchBreakTimeError.value) return

  const payload = {
    entryType: 'lunch',
    teacher: lunchBreakContext.teacher,
    day: lunchBreakContext.day,
    timeIn: lunchBreakForm.timeIn,
    timeOut: lunchBreakForm.timeOut,
    campus: lunchBreakContext.campus,
    parallel: false,
    room: '',
    academicTermId: getSelectedTermId() || undefined,
  }
  const skipFilter = lunchBreakContext.editing
    ? (_key, entry) => entry.id === lunchBreakContext.id
    : null
  const conflicts = checkScheduleConflict(payload, skipFilter)
  if (conflicts.length > 0) {
    await showConflictDialog(conflicts)
    return
  }

  try {
    if (lunchBreakContext.editing) {
      if (!lunchBreakContext.id) {
        throw new Error('This lunch break is missing its saved identifier. Refresh the schedule and try again.')
      }
      await updateLunchBreak(payload)
    } else {
      await postLunchBreak(payload)
    }
    await refreshScheduleData(lunchBreakContext.teacher)
    yearDropdown.value = 'All'
    filterSection.value = 'All'
    showLunchBreakPicker.value = false
    showSchedModal.value = false
  } catch (error) {
    await showScheduleError(error, 'Unable to save lunch break')
  }
}

function openAddModal(slot, day) {
  filterSection.value  = 'All'
  editMode.value       = false
  fromButton.value     = (slot === null && day === null)
  showLunchBreakPicker.value = false
  lunchBreakContext.teacher = selectedTeacher.value || ''
  lunchBreakContext.day = day ?? ''
  lunchBreakContext.campus = 'South Campus'
  lunchBreakContext.id = ''
  lunchBreakContext.editing = false
  lunchBreakContext.oldTableLabel = ''
  lunchBreakContext.oldSection = ''
  lunchBreakContext.oldDay = ''
  lunchBreakContext.oldTimeIn = ''
  lunchBreakContext.oldTimeOut = ''
  lunchBreakContext.legacyYear = ''
  form.day             = day ?? ''
  form.timeIn          = slot ?? ''
  form.timeOut         = ''
  form.slot            = ''
  form._oldSlot        = ''
  form._oldYear        = ''
  form._oldSection     = ''
  form._oldDay         = ''
  form.year            = ''
  form.section         = (filterSection.value !== 'All' ? filterSection.value : '') || ''
  form.teacher         = selectedTeacher.value || ''
  form.subject         = ''
  form.campus          = 'South Campus'
  form.room            = (addMode.value === 'room' && contextRoom.value) ? contextRoom.value : ''
  form.roomType        = 'Lecture'
  form.parallel        = false
  form.parallelCount   = 2
  form._parallelGroupId = null
  form._oldTableLabel  = ''
  form.addedAt         = ''
  form.parallelSlots.splice(0, form.parallelSlots.length, ...buildSlots(2))
  form.color           = 'color-green'
  modalTimeError.value = ''
  showSchedModal.value = true
}

function openEditModal(slot, day, e) {
  filterSection.value  = 'All'
  editMode.value       = true
  fromButton.value     = false
  showLunchBreakPicker.value = false
  lunchBreakContext.teacher = ''
  lunchBreakContext.day = ''
  lunchBreakContext.id = ''
  lunchBreakContext.editing = false
  lunchBreakContext.oldTableLabel = ''
  lunchBreakContext.oldSection = ''
  lunchBreakContext.oldDay = ''
  lunchBreakContext.oldTimeIn = ''
  lunchBreakContext.oldTimeOut = ''
  lunchBreakContext.legacyYear = ''
  form.slot            = slot
  form.day             = day
  form.year            = e.year ?? ''
  form.section         = e.section ?? sections[0]
  form.teacher         = selectedTeacher.value || e.teacher
  form.subject         = e.subject
  form.campus          = inferCampus(e)
  form.room            = e.room ?? ''
  form.roomType        = e.roomType || 'Lecture'
  form.parallel        = e.parallel ?? false
  form.parallelCount   = e.parallelCount ?? 2
  form.color           = e.color
  form._parallelGroupId = e.parallelGroupId ?? null
  form.addedAt         = e.addedAt ?? ''
  const slotParts = (e.slot || '').split(' - ')
  form.timeIn          = slotParts[0] || ''
  form.timeOut         = slotParts[1] || ''
  form._oldSlot        = e.slot || ''
  form._oldYear        = e.year ?? years[0]
  form._oldTableLabel  = e.tableLabel ?? e.teacher ?? ''
  form._oldSection     = e.section ?? sections[0]
  form._oldDay         = day
  form.parallelSlots.splice(
    0, form.parallelSlots.length,
    ...(e.parallelSlots?.length ? e.parallelSlots.map(s => ({ ...s })) : buildSlots(form.parallelCount))
  )
  modalTimeError.value = ''
  showSchedModal.value = true
}

function buildOldDescriptor() {
  const oldTableLabel = form._oldTableLabel || form.teacher
  const academicTermId = getSelectedTermId() || undefined
  if (form._parallelGroupId) {
    return { tableLabel: oldTableLabel, parallelGroupId: form._parallelGroupId, academicTermId }
  }
  const [oldTimeIn = '', oldTimeOut = ''] = (form._oldSlot || '').split(' - ')
  return { tableLabel: oldTableLabel, section: form._oldSection, day: form._oldDay, timeIn: oldTimeIn, timeOut: oldTimeOut, academicTermId }
}

async function applyRouteContext() {
  const requestedTermId = String(route.query.academicTermId || '').trim()
  if (requestedTermId) {
    const response = await apiRequest('/academic-terms')
    selectedTerm.value = (response.terms || []).find(term => getTermId(term) === requestedTermId) || selectedTerm.value
  }

  const requestedMode = String(route.query.mode || '')
  if (requestedMode === 'teacher') {
    scheduleViewMode.value = 'timetable'
    addMode.value = 'teacher'
    selectedTeacher.value = String(route.query.teacher || '')
  } else if (requestedMode === 'room') {
    scheduleViewMode.value = 'timetable'
    addMode.value = 'room'
    contextRoom.value = String(route.query.room || '') || null
    contextFloor.value = addFloors.find(floor => floor.rooms.some(room =>
      room === contextRoom.value
      || room.startsWith(`${contextRoom.value} `)
      || contextRoom.value.startsWith(`${room} `)
    ))?.label || null
  }
}

function isEntryBeingEdited(entry) {
  const old = buildOldDescriptor()
  if (old.parallelGroupId) {
    return entry.tableLabel === old.tableLabel && entry.parallelGroupId === old.parallelGroupId
  }
  return (
    entry.tableLabel === old.tableLabel &&
    entry.section    === old.section &&
    entry.day        === old.day &&
    entry.timeIn     === old.timeIn &&
    entry.timeOut    === old.timeOut
  )
}

function buildSchedulePayload(source) {
  const payload = {
    tableLabel: source.teacher,
    baseYear:   source.year,
    campus:     source.campus || 'South Campus',
    day:        source.day,
    timeIn:     source.timeIn,
    timeOut:    source.timeOut,
    teacher:    source.teacher,
    subject:    source.subject,
    parallel:   Boolean(source.parallel),
    parallelCount: source.parallel ? source.parallelCount : 1,
  }
  const termId = getSelectedTermId()
  if (termId) payload.academicTermId = termId
  if (source.parallel) {
    payload.parallelSlots = source.parallelSlots.map(s => ({ section: s.section, room: s.room, roomType: s.roomType || 'Lecture' }))
  } else {
    payload.section = source.section
    payload.room    = source.room
    payload.roomType = source.roomType || 'Lecture'
  }
  return payload
}

function setVisibleSection(source) {
  if (source.parallel) {
    const first = source.parallelSlots.find(s => s.section)?.section
    if (first) filterSection.value = first
    return
  }
  if (source.section) filterSection.value = source.section
}

async function saveEntry() {
  if (!form.teacher || !form.subject) return
  if (form.parallel && form.parallelSlots.every(s => !s.section)) return
  try {
    const payload = buildSchedulePayload(form)
    const skipFilter = editMode.value ? (_key, entry) => isEntryBeingEdited(entry) : null
    const conflicts = checkScheduleConflict(payload, skipFilter)
    if (conflicts.length > 0) { await showConflictDialog(conflicts); return }
    if (!editMode.value && !await confirmLongTeacherSession(payload)) return
    await proceedWithSave(payload)
  } catch (error) { await showScheduleError(error) }
}

async function proceedWithSave(payload) {
  try {
    if (editMode.value && form._oldDay) payload.day = form._oldDay
    if (editMode.value) {
      await apiRequest('/schedules/replace', {
        method: 'POST',
        body: JSON.stringify({ old: buildOldDescriptor(), next: payload }),
      })
    } else {
      await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
    }
    setVisibleSection(form)
    await refreshScheduleData(form.teacher)
    yearDropdown.value   = 'All'
    filterSection.value  = 'All'
    showSchedModal.value = false
  } catch (error) { await showScheduleError(error) }
}

async function clearSlot() {
  const confirmation = await Swal.fire({
    icon: 'warning', title: 'Clear this slot?',
    text: 'This will remove the selected class schedule from the grid.',
    showCancelButton: true, confirmButtonText: 'Yes, clear slot', cancelButtonText: 'Cancel',
    confirmButtonColor: '#e63946', cancelButtonColor: '#6c757d', background: '#fff',
    customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title' },
  })
  if (!confirmation.isConfirmed) return
  try {
    await apiRequest('/schedules/delete', { method: 'POST', body: JSON.stringify({ old: buildOldDescriptor() }) })
    await refreshScheduleData(form._oldYear || form.year)
    yearDropdown.value   = 'All'
    filterSection.value  = 'All'
    showSchedModal.value = false
  } catch (error) { await showScheduleError(error, 'Unable to remove schedule') }
}

/* ── Add Schedule Panel ── */
const showAddPanel  = ref(false)
const addSavedCount = ref(0)
const addShowFlash  = ref(false)
const addTimeError  = ref('')

const addForm = reactive({
  day: '', timeIn: '', timeOut: '',
  year: '', section: '',
  campus: 'South Campus',
  teacher: '', major: '', subject: '', room: '',
  roomType: 'Lecture',
  parallel: false, parallelCount: 2,
  parallelSlots: [{ section: '', room: '', roomType: 'Lecture' }, { section: '', room: '', roomType: 'Lecture' }],
})

watch(() => addForm.parallelCount, (val) => {
  while (addForm.parallelSlots.length < val) addForm.parallelSlots.push({ section: '', room: '', roomType: 'Lecture' })
  while (addForm.parallelSlots.length > val) addForm.parallelSlots.pop()
})

watch([() => addForm.timeIn, () => addForm.timeOut], () => {
  if (addForm.timeIn && addForm.timeOut) {
    if (parseTime(addForm.timeOut) <= parseTime(addForm.timeIn)) {
      addForm.timeOut = ''
      addTimeError.value = ''
      return
    }
    addTimeError.value = ''
  } else { addTimeError.value = '' }
})

function openAddPanel() {
  addForm.year = ''; addForm.day = ''; addForm.timeIn = ''; addForm.timeOut = ''
  addForm.section = ''; addForm.campus = 'South Campus'
  addForm.teacher = selectedTeacher.value || ''
  addForm.subject = ''
  addForm.room = addMode.value === 'room' ? contextRoom.value || '' : ''
  addForm.roomType = 'Lecture'
  addForm.parallel = false; addForm.parallelCount = 2
  addForm.parallelSlots.splice(0, addForm.parallelSlots.length,
    { section: '', room: '', roomType: 'Lecture' }, { section: '', room: '', roomType: 'Lecture' })
  addTimeError.value = ''; addSavedCount.value = 0
  showAddPanel.value = true
}

function resetAddForm() {
  addForm.day = ''; addForm.timeIn = ''; addForm.timeOut = ''
  addForm.year = ''; addForm.section = ''; addForm.campus = 'South Campus'
  addForm.teacher = selectedTeacher.value || ''; addForm.subject = ''; addForm.room = ''; addForm.major = ''
  addForm.roomType = 'Lecture'
  addForm.parallel = false; addForm.parallelCount = 2
  addForm.parallelSlots.splice(0, addForm.parallelSlots.length,
    { section: '', room: '', roomType: 'Lecture' }, { section: '', room: '', roomType: 'Lecture' })
  addTimeError.value = ''
}

const addFormValid = computed(() =>
  addForm.day && addForm.timeIn && addForm.timeOut &&
  addForm.teacher && addForm.subject && !addTimeError.value
)

async function addEntry() {
  if (!addFormValid.value) return
  if (addForm.parallel && addForm.parallelSlots.every(ps => !ps.section)) return
  try {
    const payload = buildSchedulePayload(addForm)
    const conflicts = checkScheduleConflict(payload)
    if (conflicts.length > 0) { await showConflictDialog(conflicts); return }
    if (!await confirmLongTeacherSession(payload)) return
    await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
    setVisibleSection(addForm)
    await refreshScheduleData(addForm.teacher)
    yearDropdown.value = 'All'; filterSection.value = 'All'
    addSavedCount.value++
    resetAddForm()
    addForm.major = ''
    addShowFlash.value = true
    setTimeout(() => { addShowFlash.value = false }, 2200)
  } catch (error) { await showScheduleError(error) }
}

/* ── Consultation modal ── */
const showConsultModal  = ref(false)
const consultEditId     = ref(null)
const consultWeeklyMins = ref(0)
const consultForm = reactive({ dayOfWeek: '', startTime: '', endTime: '' })
const consultTimeError  = ref('')

watch([() => consultForm.startTime, () => consultForm.endTime], () => {
  if (consultForm.startTime && consultForm.endTime) {
    if (parseTime(consultForm.endTime) <= parseTime(consultForm.startTime)) {
      consultForm.endTime = ''
      consultTimeError.value = ''
      return
    }
    consultTimeError.value = ''
  } else { consultTimeError.value = '' }
})

async function openConsultModal() {
  try {
    const termId = getSelectedTermId()
    const res = await apiRequest(`/consultations/summary?teacher=${encodeURIComponent(selectedTeacher.value)}&academicTermId=${encodeURIComponent(termId)}`)
    consultWeeklyMins.value = res.weeklyUsedMinutes || 0
  } catch (_) { consultWeeklyMins.value = 0 }
  await fetchConsultationsForTeacher()
  consultEditId.value = null
  Object.assign(consultForm, { dayOfWeek: '', startTime: '', endTime: '' })
  consultTimeError.value = ''
  showConsultModal.value = true
}

function editConsultSlot(slot) {
  consultEditId.value    = slot.id
  consultForm.dayOfWeek  = slot.dayOfWeek
  consultForm.startTime  = slot.startTime
  consultForm.endTime    = slot.endTime
  consultTimeError.value = ''
}

async function openConsultSlotModal(slot) {
  if (!slot) return
  await openConsultModal()
  const refreshedSlot = consultationSlots.value.find(item => item.id === slot.id) || slot
  editConsultSlot(refreshedSlot)
}

async function saveConsultSlot() {
  if (!consultForm.dayOfWeek || !consultForm.startTime || !consultForm.endTime || consultTimeError.value) return
  try {
    const teacherUser = teacherUserMap.value[selectedTeacher.value]
    const employeeId  = teacherUser?.employeeId || selectedTeacher.value
    const termId = getSelectedTermId()
    const payload = { employeeId, teacher: selectedTeacher.value, dayOfWeek: consultForm.dayOfWeek, startTime: consultForm.startTime, endTime: consultForm.endTime, academicTermId: termId || undefined }
    if (consultEditId.value) {
      await apiRequest(`/consultations/${consultEditId.value}`, { method: 'PUT', body: JSON.stringify(payload) })
    } else {
      await apiRequest('/consultations', { method: 'POST', body: JSON.stringify(payload) })
    }
    consultEditId.value = null
    Object.assign(consultForm, { dayOfWeek: '', startTime: '', endTime: '' })
    consultTimeError.value = ''
    await fetchConsultationsForTeacher()
    const res = await apiRequest(`/consultations/summary?teacher=${encodeURIComponent(selectedTeacher.value)}&academicTermId=${encodeURIComponent(termId)}`)
    consultWeeklyMins.value = res.weeklyUsedMinutes || 0
  } catch (error) {
    await Swal.fire({
      icon: 'error', title: 'Cannot Save Consultation',
      html: `<span style="font-size:0.95rem;color:#444">${error?.message || 'Failed to save consultation slot.'}</span>`,
      confirmButtonText: 'OK', confirmButtonColor: '#4b5563', background: '#fff',
      customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
    })
  }
}

async function deleteConsultSlot(id) {
  const ok = await Swal.fire({
    icon: 'warning', title: 'Remove Consultation Slot?', text: 'This slot will be permanently deleted.',
    showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#e63946',
    cancelButtonText: 'Cancel', cancelButtonColor: '#6c757d', background: '#fff',
    customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title' },
  })
  if (!ok.isConfirmed) return
  try {
    await apiRequest(`/consultations/${id}`, { method: 'DELETE' })
    if (consultEditId.value === id) {
      consultEditId.value = null
      Object.assign(consultForm, { dayOfWeek: '', startTime: '', endTime: '' })
    }
    await fetchConsultationsForTeacher()
    const termId = getSelectedTermId()
    const res = await apiRequest(`/consultations/summary?teacher=${encodeURIComponent(selectedTeacher.value)}&academicTermId=${encodeURIComponent(termId)}`)
    consultWeeklyMins.value = res.weeklyUsedMinutes || 0
  } catch (error) {
    await Swal.fire({ icon: 'error', title: 'Error', text: error?.message || 'Failed to delete.', confirmButtonColor: '#4b5563', background: '#fff' })
  }
}

/* ── Print ── */
function printSchedule() {
  const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const SLOTS = [
    '7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
    '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
    '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM',
    '4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM',
  ]
  const colorMap = {
    'color-green': { bg: '#1f6b45', fg: '#ffffff' }, 'color-yellow': { bg: '#e9c46a', fg: '#5a3e00' },
    'color-orange': { bg: '#f4a261', fg: '#5a2d00' }, 'color-blue': { bg: '#4a90d9', fg: '#ffffff' },
    'color-gray': { bg: '#626c76', fg: '#ffffff' },
    'color-purple': { bg: '#7b5ea7', fg: '#ffffff' }, 'color-red': { bg: '#e63946', fg: '#ffffff' },
  }
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  function toMins(t) {
    if (!t) return 0
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!m) return 0
    let h = parseInt(m[1]), min = parseInt(m[2]), period = m[3].toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + min
  }
  const slotMins = SLOTS.map(toMins)
  const pageEntries = Object.entries(entries)
    .filter(([, v]) => !selectedTeacher.value || v.teacher === selectedTeacher.value)
    .map(([, v]) => v)
  const filteredConsultations = selectedTeacher.value ? consultationSlots.value : []
  function entriesAt(si, day) {
    const from = slotMins[si]
    const to   = si + 1 < slotMins.length ? slotMins[si + 1] : from + 30
    return pageEntries.filter(v => { if (v.day !== day) return false; const t = toMins(v.timeIn); return t >= from && t < to })
  }
  function rowspanFor(entry) {
    const startMins = toMins(entry.timeIn); const endMins = toMins(entry.timeOut)
    const si = slotMins.findIndex((m, i) => { const next = i + 1 < slotMins.length ? slotMins[i + 1] : m + 30; return startMins >= m && startMins < next })
    if (si < 0) return 1
    let span = 1
    for (let i = si + 1; i < SLOTS.length; i++) { if (slotMins[i] >= endMins) break; span++ }
    return Math.max(1, span)
  }
  function consultRowspanFor(consult) {
    return rowspanFor({ timeIn: consult.startTime, timeOut: consult.endTime })
  }
  function entryBlock(e) {
    if (e.entryType === 'lunch') {
      return `<div class="entry-block"><span class="e-subject e-main">Lunch Break</span><span class="e-time">${esc(e.timeIn)} – ${esc(e.timeOut)}</span></div>`
    }
    const meta = [e.section, e.room, e.year].filter(Boolean).join(' · ')
    return `<div class="entry-block"><span class="e-subject e-main">${esc(e.subject || 'Schedule')}</span><span class="e-time">${esc(e.timeIn)} – ${esc(e.timeOut)}</span>${selectedTeacher.value ? '' : `<span class="e-teacher">${esc(e.teacher || '—')}</span>`}${meta ? `<span class="e-section">${esc(meta)}</span>` : ''}</div>`
  }
  const occupied = Array.from({length: SLOTS.length}, () => Array(DAYS.length).fill(false))
  let bodyHTML = ''
  for (let si = 0; si < SLOTS.length; si++) {
    bodyHTML += '<tr>'
    bodyHTML += `<td class="time-col">${esc(SLOTS[si])}</td>`
    for (let di = 0; di < DAYS.length; di++) {
      if (occupied[si][di]) continue
      const matched = entriesAt(si, DAYS[di])
      if (matched.length > 0) {
        const rs = rowspanFor(matched[0])
        for (let r = 1; r < rs; r++) { if (si + r < SLOTS.length) occupied[si + r][di] = true }
        const inner = matched.map(entryBlock).join('<hr class="entry-sep">')
        const clr = colorMap[matched[0].color] || { bg: '#eef1fb', fg: '#1a1a2e' }
        bodyHTML += `<td class="entry-cell" rowspan="${rs}" style="--entry-bg:${clr.bg};--entry-fg:${clr.fg};">${inner}</td>`
      } else {
        const consult = filteredConsultations.find(c => c.dayOfWeek === DAYS[di] && toMins(c.startTime) >= slotMins[si] && toMins(c.startTime) < (si + 1 < slotMins.length ? slotMins[si + 1] : slotMins[si] + 30))
        if (consult) {
          const rs = consultRowspanFor(consult)
          for (let r = 1; r < rs; r++) { if (si + r < SLOTS.length) occupied[si + r][di] = true }
          bodyHTML += `<td class="entry-cell consultation-cell" rowspan="${rs}"><div class="entry-block"><span class="e-teacher">Consultation</span><span class="e-time">${esc(consult.startTime)} - ${esc(consult.endTime)}</span></div></td>`
        } else {
          bodyHTML += '<td class="empty-cell"></td>'
        }
      }
    }
    bodyHTML += '</tr>'
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Schedule</title>
<style>@page{size:landscape;margin:10mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:14px 18px;font-size:11px;color:#1a1a2e;background:#fff;}h2{font-size:15px;font-weight:700;margin-bottom:3px;color:#4b5563;}.sub{font-size:10px;color:#666;margin-bottom:12px;}table{width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid #cfd6df;}th{background:#4b5563;color:#fff;padding:7px 6px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.04em;border:1px solid #0d2a20;}th.time-hdr{width:72px;}tbody tr{height:44px;min-height:44px;max-height:44px;}td{border:1px solid #dde;vertical-align:top;padding:0;}td.time-col{background:#f0f2fa;font-size:10px;font-weight:600;color:#444;text-align:center;padding:5px 3px;width:72px;vertical-align:middle;}td.empty-cell{background:#fafbff;}td.entry-cell{position:relative;background:var(--entry-bg);color:var(--entry-fg);padding:9px 10px;vertical-align:top;border:4px solid #fff;border-radius:9px;box-shadow:inset 0 -1px rgba(0,0,0,.08);overflow:hidden;}.entry-block{padding:1px 0;}.entry-sep{border:none;border-top:1px solid rgba(255,255,255,.28);margin:5px 0;}td.entry-cell span{display:block;line-height:1.45;color:inherit;}.e-main{font-size:10px;font-weight:800;line-height:1.25;}.e-time{font-size:8.7px;opacity:.92;margin-top:2px;}.e-section{font-weight:700;font-size:9.5px;margin-top:2px;}.e-teacher{font-size:9px;font-weight:700;margin-top:2px;}.e-subject{font-size:9.5px;font-weight:700;}.consultation-cell{background:#4a90d9!important;color:#fff!important;}</style>
<style>body,td,th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.entry-cell span{color:inherit!important;}</style>
</head><body>
<h2>Teacher Schedule${selectedTeacher.value ? ' — Prof. ' + esc(selectedTeacher.value) : ''}</h2>
<p class="sub">${esc([selectedTermLabel.value ? `Term: ${selectedTermLabel.value}` : '', `Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`].filter(Boolean).join(' • '))}</p>
<table><thead><tr><th class="time-hdr">Time</th>${DAYS.map(d=>`<th>${esc(d)}</th>`).join('')}</tr></thead>
<tbody>${bodyHTML}</tbody></table>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`
  const w = window.open('', '_blank', 'width=1000,height=700')
  w.document.write(html)
  w.document.close()
}

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() { showLogoutModal.value = false; logout(); router.push('/') }

/* ── onMounted ── */
onMounted(async () => {
  try {
    await loadTermContext()
    await applyRouteContext()
    await ensureTermSelection()
    const response = await apiRequest('/users?role=teacher')
    if (response.users && Array.isArray(response.users)) {
      const teachers = response.users.filter(u => Array.isArray(u.roles) ? u.roles.includes('teacher') : u.role === 'Teacher')
      if (teachers.length > 0) {
        teacherOptions.value = teachers
          .map(u => `${u.firstName} ${u.lastName}`.trim())
          .filter(n => n.length > 0)
          .sort((a, b) => a.localeCompare(b))
        teachers.forEach(u => {
          const name = `${u.firstName} ${u.lastName}`.trim()
          if (name) teacherUserMap.value[name] = u
        })
      }
    }
    await refreshScheduleData()
  } catch (error) {
    await showScheduleError(error, 'Unable to load schedules')
  }
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
.sidebar-profile { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 28px; text-align: center; }
.avatar-wrap { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; margin-bottom: 10px; border: 3px solid #c4c9cd; }
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
.role   { font-size: 0.88rem; color: #444; font-weight: 500; }
.email  { font-size: 0.82rem; color: #888; word-break: break-all; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; border-radius: 10px;
  font-size: 0.88rem; font-weight: 400; color: #444;
  text-decoration: none; cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.nav-item:hover { background: #f8fafc; color: #4b5563; }
.nav-item.active { background: #4b5563; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }
.logout-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 11px 12px;
  background: #e63946; color: #fff; border: none; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: background 0.2s; margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ═══ MAIN ═══ */
.main {
  flex: 1; padding: 40px 44px 32px;
  overflow-y: auto; min-width: 0;
  display: flex; flex-direction: column;
}
.main-header {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.page-title { font-size: 2rem; font-weight: 600; color: #4b5563; letter-spacing: -0.5px; line-height: 1.2; }
.page-sub   { font-size: 0.95rem; color: #777; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 10px; padding-top: 6px; flex-shrink: 0; }
.term-switcher.header-term-switcher { display: flex; align-items: center; gap: 8px; }
.term-current-label { color: #4b5563; font-size: 0.9rem; font-weight: 600; }
.term-switch-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; padding: 8px 13px; border-radius: 999px; font-size: 0.85rem; cursor: pointer; transition: background 0.18s, border-color 0.18s; }
.term-switch-btn.active { background: #4b5563; border-color: #4b5563; color: #fff; }
.term-switch-btn:hover { background: #e2e8f0; }

/* ── Buttons ── */
.new-sched-btn {
  display: flex; align-items: center; gap: 6px;
  background: #4b5563; color: #fff;
  border: none; border-radius: 8px;
  padding: 9px 18px;
  font-size: 0.85rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: background 0.18s;
}
.new-sched-btn:hover { background: #6b7280; }
.lunch-subject-selected {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 12px;
  color: #4e575d;
  background: linear-gradient(145deg, #f0f2f3, #cdd3d6);
  border: 1px solid #aeb5b9;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
}
.lunch-break-footer { padding: 0 24px 12px; }
.lunch-break-modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-height: 40px;
  padding: 9px 14px;
  color: #4e575d;
  background: linear-gradient(145deg, #f0f2f3, #cdd3d6);
  border: 1px solid #aeb5b9;
  border-radius: 10px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s, box-shadow 0.15s, transform 0.15s;
}
.lunch-break-modal-btn:hover {
  filter: brightness(1.04);
  box-shadow: 0 3px 9px rgba(61, 67, 73, 0.16), inset 0 1px rgba(255, 255, 255, 0.76);
}
.lunch-break-modal-btn:active { transform: translateY(1px); }
.lunch-break-picker-overlay { z-index: 1100; }
.lunch-break-picker {
  width: 430px;
  max-width: 94vw;
  padding: 26px;
  color: #31383e;
  background: linear-gradient(145deg, #fafbfb, #dde1e3);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(33, 38, 43, 0.32);
}
.lunch-break-picker-header {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.lunch-break-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  color: #4e575d;
  background: linear-gradient(145deg, #f0f2f3, #cdd3d6);
  border: 1px solid #aeb5b9;
  border-radius: 12px;
}
.lunch-break-picker h2 {
  margin: 0;
  color: #32383e;
  font-size: 1.15rem;
}
.lunch-break-picker-header p {
  margin: 3px 0 0;
  color: #687078;
  font-size: 0.82rem;
  line-height: 1.35;
}
.lunch-break-picker-fields {
  display: grid;
  gap: 12px;
}
.lunch-break-picker-field {
  display: grid;
  grid-template-columns: 92px 1fr;
  align-items: center;
  gap: 12px;
  color: #424950;
  font-size: 0.85rem;
  font-weight: 700;
}
.lunch-break-picker-field select {
  width: 100%;
  padding: 9px 12px;
  color: #343a40;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid #b9c0c4;
  border-radius: 9px;
  font: inherit;
  font-size: 0.84rem;
}
.lunch-break-picker-error {
  margin: 14px 0 0;
  padding: 8px 10px;
  color: #8b2d33;
  background: #fbe5e6;
  border-radius: 8px;
  font-size: 0.8rem;
}
.lunch-break-picker-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.icon-btn {
  background: none; border: 1px solid #ddd;
  border-radius: 8px; padding: 6px 10px;
  cursor: pointer; color: #555;
  display: flex; align-items: center;
  transition: border-color 0.15s, color 0.15s;
}
.icon-btn:hover { border-color: #9ca3af; color: #4b5563; }
.consult-btn { background: #4a90d9 !important; color: #fff !important; border-color: #4a90d9 !important; }
.consult-btn:hover { background: #357abd !important; }

/* ── Mode & context selection ── */
.mode-select-container { display: flex; flex-direction: column; gap: 16px; }
.mode-grid { display: flex; gap: 24px; flex-wrap: wrap; }
.mode-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; width: 260px; min-height: 220px; padding: 36px 28px;
  background: #fff; border: 2px solid #e0e0e0; border-radius: 18px;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.mode-card:hover { border-color: #9ca3af; background: #f8fafc; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(83, 91, 100,0.15); }
.mode-icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #f3f4f6, #d8dcdf);
  display: flex; align-items: center; justify-content: center; color: #4b5563;
}
.mode-label { font-size: 1.1rem; font-weight: 700; color: #4b5563; }
.mode-desc  { font-size: 0.85rem; color: #888; text-align: center; line-height: 1.4; }

.step-container { display: flex; flex-direction: column; gap: 16px; }
.step-hint { font-size: 0.9rem; color: #888; margin: 0; }

.teacher-search-wrap {
  display: flex; align-items: center; gap: 10px;
  width: min(420px, 100%);
  padding: 12px 14px;
  border: 1.5px solid #dce8e1;
  border-radius: 999px;
  background: #f4f5f5;
  margin-bottom: 16px;
}
.teacher-search-icon { color: #9ca3af; flex-shrink: 0; }
.teacher-search-input {
  border: none; outline: none; background: transparent;
  width: 100%; font-size: 0.95rem; color: #4b5563; font-family: inherit;
}
.room-search-wrap { margin-bottom: 14px; }

.floor-grid { display: flex; gap: 20px; flex-wrap: wrap; }
.floor-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  width: 220px; min-height: 190px; padding: 32px 24px;
  background: #fff; border: 2px solid #e0e0e0; border-radius: 18px;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.floor-card:hover { border-color: #9ca3af; background: #f8fafc; transform: translateY(-2px); }
.floor-card-expanded {
  width: 100%;
  min-height: auto;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 24px 28px;
}
.floor-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.floor-card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.floor-room-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}
.floor-room-btn {
  border: 1px solid #dce8e1;
  background: #f4f5f5;
  color: #4b5563;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}
.floor-room-btn:hover {
  border-color: #9ca3af;
  background: #e8f5ea;
  transform: translateY(-1px);
}
.floor-number {
  width: 54px; height: 54px; border-radius: 50%;
  background: linear-gradient(135deg, #4b5563, #9ca3af); color: #fff;
  font-size: 1.4rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.floor-label { font-size: 1rem; font-weight: 600; color: #4b5563; }
.floor-room-count { font-size: 0.78rem; color: #888; }

.room-grid { display: flex; flex-wrap: wrap; gap: 14px; }
.room-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  width: 155px; min-height: 140px; padding: 20px 14px;
  background: #fff; border: 1.5px solid #e0e0e0; border-radius: 14px;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.room-card:hover { border-color: #9ca3af; background: #f8fafc; transform: translateY(-2px); }
.room-card-inline {
  min-height: 110px;
  width: 130px;
  justify-content: center;
}
.room-card-comlab { border-color: #c5e1f9; background: #f0f8ff; }
.room-card-comlab:hover { border-color: #4a90d9; background: #e8f4ff; }
.room-card-icon { color: #4b5563; opacity: 0.5; }
.room-card-comlab .room-card-icon { color: #4a90d9; }
.room-card-number { font-size: 1rem; font-weight: 700; color: #4b5563; text-align: center; }
.room-card-floor { font-size: 0.72rem; color: #888; }

.teacher-grid {
  display: grid;
  /* Responsive grid: auto-fit columns with a sensible min width for cards */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  width: 100%;
  max-width: 1200px;
}
.teacher-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  min-height: 180px; padding: 20px 16px;
  width: 100%; box-sizing: border-box;
  background: #fff; border: 1.5px solid #e0e0e0; border-radius: 16px;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.teacher-card:hover { border-color: #9ca3af; background: #f8fafc; transform: translateY(-2px); }
.teacher-avatar-img {
  width: 88px; height: 88px; border-radius: 50%; object-fit: cover;
  border: 3px solid #dfe2e4; box-shadow: 0 4px 12px rgba(48, 53, 58, 0.12);
}
.teacher-avatar {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, #4b5563, #9ca3af); color: #fff;
  font-size: 1.15rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.teacher-name { font-size: 0.95rem; font-weight: 600; color: #4b5563; text-align: center; line-height: 1.3; }
.small-empty-state {
  padding: 18px 20px; border-radius: 12px; background: #f4f5f5; border: 1px dashed #cfe3d8; color: #5d7a6d;
}

@media (max-width: 900px) {
  .teacher-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .teacher-grid { grid-template-columns: 1fr; }
}

.loading-state { display: flex; align-items: center; gap: 10px; color: #9ca3af; font-size: 0.9rem; padding: 40px 0; justify-content: center; }
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* breadcrumb */
.header-left { display: flex; flex-direction: column; gap: 4px; }
.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.bc-btn { background: none; border: none; font-family: inherit; font-size: 0.83rem; color: #9ca3af; font-weight: 500; cursor: pointer; padding: 0; transition: color 0.15s; text-decoration: underline; text-underline-offset: 2px; }
.bc-btn:hover { color: #4b5563; }
.bc-active { color: #4b5563 !important; text-decoration: none; cursor: default; }
.bc-current { font-size: 0.83rem; font-weight: 700; color: #4b5563; }

/* ═══ SCHEDULE CARD ═══ */
.schedule-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 28px 28px 20px;
  display: flex;
  flex-direction: column;
}
.sched-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.sched-grid-title { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.sched-grid-sub {
  font-size: 0.85rem; color: #666; margin: 0; font-weight: 400;
  transition: all 0.3s ease;
}
.sched-grid-sub.teacher-selected {
  font-size: 0.92rem; color: #4b5563; font-weight: 600;
  background: linear-gradient(120deg, #f3f4f6 0%, #e1f5fe 100%);
  padding: 10px 14px; border-left: 4px solid #9ca3af; border-radius: 6px;
  box-shadow: 0 2px 8px rgba(83, 91, 100, 0.15);
}
.sched-grid-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sched-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* Selects */
.sched-select-wrap { position: relative; display: flex; align-items: center; }
.sched-select {
  appearance: none; background: #fff; border: 1px solid #ddd; border-radius: 8px;
  padding: 7px 32px 7px 12px; font-size: 0.85rem; font-family: inherit; color: #333;
  cursor: pointer; outline: none;
}
.sched-select:focus { border-color: #9ca3af; }
.sched-select-arrow { position: absolute; right: 10px; pointer-events: none; color: #666; }
.teacher-select-wrap {
  padding: 3px 6px;
  background: linear-gradient(135deg, #f3f4f6 0%, #f1f8f6 100%);
  border-radius: 10px; border: 2px solid #9ca3af;
  box-shadow: 0 4px 12px rgba(83, 91, 100, 0.2);
  transition: all 0.2s ease;
}
.teacher-select-wrap:hover { border-color: #4b5563; box-shadow: 0 6px 16px rgba(48, 53, 58, 0.25); }
.teacher-select {
  background: linear-gradient(to bottom, #f8fffe, #eef9f7); border: 1px solid #9ca3af !important;
  border-radius: 8px; padding: 8px 32px 8px 13px; font-size: 0.88rem; font-weight: 500; color: #4b5563;
}

/* Grid */
.sched-grid-wrap {
  width: 100%; overflow-x: auto; margin-top: 8px; position: relative;
}
.sched-grid {
  width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 800px;
}
.sched-grid th {
  background: #4b5563; color: #fff; font-size: 0.85rem; font-weight: 600;
  padding: 12px 10px; text-align: center; white-space: nowrap;
  position: sticky; top: 0; z-index: 10;
}
.th-time { width: 90px; position: sticky; left: 0; z-index: 20; background: #4b5563; }

/* 30-minute rows */
.sched-grid tbody tr { height: 40px; }
.sched-grid tbody tr.half-hour .td-time {
  background: #f4f5f6;
}

.sched-grid td {
  border: 1px solid #ececec; padding: 0; vertical-align: top; position: relative;
}
.sched-grid td.td-time {
  background: #f8f9fa; text-align: center; vertical-align: middle;
  font-size: 0.78rem; color: #4b5563; font-weight: 600; white-space: nowrap;
  border: 1px solid #ececec; position: sticky; left: 0; z-index: 15;
  width: 90px; padding: 0 6px;
}
/* Half-hour rows have lighter borders */
.sched-grid tbody tr.half-hour td { border-top: 1px dashed #eee; }

.view-toggle {
  display: flex; align-items: center; gap: 8px; margin-right: 8px;
}
.view-btn {
  border: 1px solid #d1d5db; background: #f8fafc; color: #374151;
  border-radius: 999px; padding: 8px 12px; font-size: 0.82rem; cursor: pointer;
  transition: all 0.18s ease;
}
.view-btn:hover { background: #eef2ff; }
.view-btn.active {
  background: #4b5563; color: #fff; border-color: #4b5563;
}
.schedule-list-wrap { width: 100%; margin-top: 8px; }
.schedule-list-meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 0.9rem; color: #4b5563; }
.schedule-list-table-wrap { width: 100%; overflow-x: auto; }
.schedule-list-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.schedule-list-table th,
.schedule-list-table td { padding: 12px 10px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.9rem; vertical-align: top; }
.schedule-list-table th { background: #f8fafc; color: #334155; font-weight: 700; }
.schedule-list-row { cursor: pointer; }
.schedule-list-row:hover { background: #f8fafc; }
.schedule-list-note { color: #6b7280; }
.empty-state-row td { padding: 28px 10px; text-align: center; color: #6b7280; }
.schedule-input-row { background: #fbfbfb; }
.schedule-input-row td { padding: 8px 10px; }
.schedule-input-row .form-input,
.schedule-input-row .form-select { width: 100%; min-width: 0; }
.schedule-input-row .form-select.small { padding: 8px 10px; font-size: 0.84rem; }
.time-inputs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 6px; align-items: center; }
.time-separator { color: #6b7280; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; }
.inline-campus-row { display: grid; gap: 6px; }
.inline-campus-row .campus-btn.small { border-radius: 8px; padding: 6px 8px; font-size: 0.78rem; }
.save-inline-btn { width: 100%; justify-content: center; font-size: 0.82rem; padding: 8px 10px; }
.table-time-error { margin-top: 6px; font-size: 0.8rem; color: #e63946; }

.td-cell { cursor: pointer; transition: background 0.15s; padding: 0; position: relative; }
.td-cell:hover { background: #f4f5f5; }
.td-cell.has-entry { padding: 0; }
.td-cell.readonly-entry-cell { cursor: default; }
.td-cell.readonly-entry-cell:hover { background: inherit; }

/* Entry card */
.sched-entry {
  position: absolute; top: 3px; left: 3px; right: 3px;
  border-radius: 6px; padding: 5px 7px;
  display: flex; flex-direction: column; justify-content: flex-start;
  cursor: pointer; transition: filter 0.15s; gap: 1px;
  box-sizing: border-box; overflow: hidden;
}
.sched-entry:hover { filter: brightness(0.95); }
.sched-entry.entry-readonly:hover { filter: none; }
.subbed-indication {
  width: 100%;
  margin-bottom: 3px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 5px;
  background: #b42318;
  color: #fff;
  padding: 3px 6px;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.035em;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}
.entry-teacher { font-size: 0.85rem; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 52px; }
.entry-subject { font-size: 0.78rem; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 52px; }
.entry-time-range { font-size: 0.7rem; opacity: 0.75; font-style: italic; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry-section-rows { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 3px; }
.entry-section-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.entry-section-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.9; background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 3px; }
.entry-room { font-size: 0.72rem; opacity: 0.75; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 56px; }
.entry-edit-hint { font-size: 0.6rem; opacity: 0; transition: opacity 0.15s; font-style: italic; position: absolute; bottom: 2px; right: 6px; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px; color: white; z-index: 2; }
.sched-entry:hover .entry-edit-hint { opacity: 0.9; }
.entry-timestamp { font-size: 0.55rem; opacity: 0.6; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: absolute; bottom: 2px; left: 6px; background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 3px; color: rgba(255,255,255,0.9); z-index: 2; }
.click-to-add { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; font-size: 0.72rem; color: #aaa; user-select: none; padding: 4px; }

/* Colors */
.free-time-cell { background: #ede9fe; }
.free-time-cell .click-to-add { color: #6d28d9; }
.color-green  { background: #1f6b45; color: #fff; }
.color-yellow { background: #e9c46a; color: #5a3e00; }
.color-orange { background: #f4a261; color: #5a2d00; }
.color-blue   { background: #4a90d9; color: #fff; }
.color-gray   { background: #626c76; color: #ffffff; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }
.consult-entry { cursor: pointer; pointer-events: auto; }
.consult-cell  { cursor: default !important; }
.consult-cell:hover { background: inherit !important; }

/* ═══ Modal ═══ */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.sched-modal-box {
  background: #fff; border-radius: 20px; padding: 32px 36px 28px;
  width: 500px; max-width: 96vw; max-height: 90vh; overflow-y: auto; position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}
.sched-modal-header { margin-bottom: 20px; }
.sched-modal-mode-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 3px 10px; border-radius: 20px; margin-bottom: 6px; }
.badge-add  { background: #f3f4f6; color: #4b5563; }
.badge-edit { background: #fff3cd; color: #7a5500; }
.sched-modal-title { font-size: 1.25rem; font-weight: 700; color: #4b5563; margin: 0 0 3px; }
.sched-modal-sub   { font-size: 0.84rem; color: #888; margin: 0; }
.sched-form { display: flex; flex-direction: column; gap: 13px; margin-bottom: 22px; }
.form-row-inline { display: grid; grid-template-columns: 100px 1fr; align-items: center; gap: 12px; }
.form-row-inline.schedule-for-row { grid-template-columns: 1fr; }
.form-label { font-size: 0.95rem; font-weight: 700; color: #111; }
.form-select-wrap { position: relative; display: flex; align-items: center; }
.form-select { width: 100%; appearance: none; border: 1px solid #ccc; border-radius: 10px; padding: 9px 34px 9px 14px; font-size: 0.88rem; font-family: inherit; color: #333; background: #fff; cursor: pointer; outline: none; transition: border-color 0.15s; }
.form-select:focus { border-color: #9ca3af; }
.form-input { width: 100%; border: 1px solid #ccc; border-radius: 10px; padding: 9px 14px; font-size: 0.88rem; font-family: inherit; color: #333; background: #fff; outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: #9ca3af; }
.sel-arrow { position: absolute; right: 12px; pointer-events: none; color: #666; }
.campus-toggle { display: inline-flex; gap: 8px; }
.campus-btn { border: 1px solid #d4d4d4; background: #f8f9fa; color: #666; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.campus-btn.active { background: #f3f4f6; color: #4b5563; border-color: #9ca3af; }
.parallel-slot-divider { font-size: 0.78rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 0 2px; border-top: 1px solid #f3f4f6; margin-top: 4px; }
.parallel-row { display: flex; align-items: center; gap: 24px; margin-top: 4px; }
.parallel-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; font-family: inherit; font-size: 0.92rem; font-weight: 500; color: #444; cursor: pointer; padding: 0; transition: color 0.15s; }
.parallel-btn.active { color: #4b5563; font-weight: 600; }
.par-radio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #bbb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, border-color 0.15s; }
.par-radio.checked { background: #4b5563; border-color: #4b5563; }
.sched-modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; }
.clear-slot-btn { margin-right: auto; display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #e63946; color: #e63946; font-family: inherit; font-size: 0.85rem; font-weight: 600; padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.clear-slot-btn:hover { background: #ffeaea; }
.cancel-btn-text { background: none; border: none; color: #e63946; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; padding: 8px 12px; transition: opacity 0.15s; }
.cancel-btn-text:hover { opacity: 0.75; }
.save-btn { display: flex; align-items: center; gap: 6px; background: #4b5563; color: #fff; border: none; font-family: inherit; font-size: 0.88rem; font-weight: 600; padding: 10px 26px; border-radius: 10px; cursor: pointer; transition: background 0.18s; }
.save-btn:hover:not(:disabled) { background: #6b7280; }
.save-btn:disabled { opacity: 0.5; cursor: default; }
.form-value-locked { display: flex; align-items: center; padding: 6px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e5e7eb; font-size: 0.875rem; color: #4b5563; font-weight: 600; min-width: 0; flex: 1; }
.schedule-for-text { display: flex; align-items: center; justify-content: center; text-align: center; flex: 1; min-height: 42px; padding: 10px 14px; border-left: 5px solid #626a72; border-radius: 10px; background: linear-gradient(135deg, #f3f4f6 0%, #d7efe4 100%); box-shadow: 0 6px 14px rgba(45, 138, 89, 0.14); font-size: 0.94rem; color: #41484f; font-weight: 800; }

/* Consultation modal */
.consult-modal-box { max-width: 480px; }
.consult-slots-list { display: flex; flex-direction: column; gap: 8px; padding: 4px 24px 12px; }
.consult-slot-item { display: flex; align-items: center; gap: 10px; background: #f0f6ff; border: 1px solid #c8dff8; border-radius: 8px; padding: 8px 12px; }
.consult-slot-day  { font-weight: 700; font-size: 0.82rem; color: #4b5563; min-width: 36px; }
.consult-slot-time { flex: 1; font-size: 0.82rem; color: #333; }
.consult-slot-dur  { font-size: 0.78rem; color: #666; white-space: nowrap; }
.consult-slot-actions { display: flex; gap: 6px; }
.consult-edit-btn { padding: 3px 10px; border-radius: 5px; border: 1px solid #4a90d9; background: transparent; color: #4a90d9; font-size: 0.78rem; cursor: pointer; }
.consult-edit-btn:hover { background: #e8f0fb; }
.consult-del-btn { padding: 3px 8px; border-radius: 5px; border: 1px solid #e63946; background: transparent; color: #e63946; cursor: pointer; display: flex; align-items: center; }
.consult-del-btn:hover { background: #fde8e8; }
.consult-empty { padding: 8px 24px 12px; color: #888; font-size: 0.84rem; font-style: italic; }
.consult-form-title { padding: 0 24px 8px; font-weight: 600; font-size: 0.88rem; color: #4b5563; }
.limit-warning { color: #e63946; font-weight: 600; }
.limit-ok { color: #4b5563; }
.time-error { display: flex; align-items: center; gap: 6px; color: #e63946; font-size: 0.8rem; font-weight: 500; background: #ffeaea; border-radius: 8px; padding: 8px 12px; margin: 0 28px; }

/* Consultation modal refresh */
.consult-modal-box {
  width: 520px;
  max-width: calc(100vw - 32px);
  max-height: min(760px,calc(100vh - 40px));
  padding: 0;
  overflow: hidden auto;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 18px;
  background: #f7f8f9;
  box-shadow: 0 26px 70px rgba(20,27,31,.28), inset 0 1px #fff;
}
.consult-modal-box .sched-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin: 0;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #dde2e5;
  background: linear-gradient(135deg,#fff,#edf0f1);
}
.consult-heading-copy { min-width: 0; flex: 1; }
.consult-modal-box .sched-modal-mode-badge { margin-bottom: 8px; padding: 5px 9px; color: #64717a; border: 1px solid #d8dee2; background: #f2f4f5; font-size: .61rem; letter-spacing: .1em; }
.consult-modal-box .sched-modal-title { overflow: hidden; color: #273139; font-size: 1.18rem; font-weight: 680; letter-spacing: -.025em; white-space: nowrap; text-overflow: ellipsis; }
.consult-close { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; padding: 0; border-color: #cbd2d6; border-radius: 9px; background: linear-gradient(145deg,#fff,#e5e9eb); box-shadow: 0 3px 8px rgba(38,46,52,.07); }
.consult-close:hover { color: #232d34; border-color: #929ea6; background: #fff; }
.consult-usage { display: flex; align-items: center; gap: 10px; margin-top: 8px; color: #68747c; font-size: .69rem; font-weight: 600; }
.consult-progress { width: 110px; height: 5px; overflow: hidden; border-radius: 999px; background: #d9dfe2; }
.consult-progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#71808a,#3d4952); transition: width .2s ease; }
.consult-slots-list { gap: 8px; padding: 16px 24px 4px; }
.consult-slot-item { padding: 10px 11px; border-color: #d7dee2; border-radius: 9px; background: #fff; box-shadow: 0 3px 8px rgba(38,46,52,.04); }
.consult-slot-day { color: #35424b; }
.consult-slot-time { color: #536069; }
.consult-slot-dur { padding: 3px 7px; border-radius: 999px; background: #edf1f3; color: #64717a; font-size: .64rem; font-weight: 650; }
.consult-edit-btn { color: #4b5a64; border-color: #bcc6cc; background: #f7f9fa; }
.consult-edit-btn:hover { background: #e9edef; }
.consult-del-btn { color: #8b4b4b; border-color: #dbc4c4; }
.consult-empty { display: flex; align-items: center; gap: 11px; margin: 16px 24px 2px; padding: 13px 14px; color: #68747c; border: 1px dashed #cbd3d8; border-radius: 10px; background: #f0f3f4; font-style: normal; }
.consult-empty-icon { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; color: #5a6872; border-radius: 9px; background: #e2e7e9; }
.consult-empty strong,.consult-empty span { display: block; }
.consult-empty strong { color: #354149; font-size: .74rem; font-weight: 680; }
.consult-empty div span { margin-top: 2px; font-size: .65rem; }
.consult-form-shell { gap: 12px; margin: 16px 24px 0; padding: 17px 0 0; border-top: 1px solid #dce2e5; }
.consult-form-title { padding: 0 0 2px; color: #34414a; font-size: .82rem; font-weight: 680; }
.consult-modal-box .form-row-inline { grid-template-columns: 1fr; gap: 6px; }
.consult-modal-box .form-label { color: #5a6770; font-size: .67rem; font-weight: 680; }
.consult-modal-box .form-select { min-height: 42px; padding: 9px 34px 9px 11px; color: #344149; border-color: #cbd3d8; border-radius: 9px; background: #fff; font-size: .72rem; }
.consult-modal-box .form-select:focus { border-color: #7f8d96; box-shadow: 0 0 0 3px rgba(70,84,94,.09); }
.consult-modal-box .time-error { margin: 0; }
.consult-modal-box .sched-modal-actions { margin: 18px 0 0; padding: 15px 24px 20px; border-top: 1px solid #dce2e5; background: #f0f3f4; }
.consult-modal-box .cancel-btn-text { min-height: 38px; padding: 8px 13px; color: #5d6a73; border: 1px solid transparent; border-radius: 8px; font-size: .72rem; font-weight: 650; }
.consult-modal-box .cancel-btn-text:hover { border-color: #d0d7db; background: #fff; opacity: 1; }
.consult-modal-box .save-btn { min-height: 40px; padding: 9px 17px; border: 1px solid #414d56; border-radius: 9px; background: linear-gradient(145deg,#64717b,#37434c); box-shadow: 0 4px 10px rgba(38,46,52,.16); font-size: .72rem; }
.consult-modal-box .save-btn:disabled { color: #929aa0; border-color: #d1d7db; background: #dfe3e5; box-shadow: none; opacity: 1; }

/* Add/edit schedule modal refresh */
.schedule-entry-modal {
  width: 720px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 36px);
  padding: 0;
  overflow-y: auto;
  border: 1px solid rgba(255,255,255,.92);
  border-radius: 18px;
  background: #f7f8f9;
  box-shadow: 0 26px 70px rgba(20,27,31,.3), inset 0 1px #fff;
}
.schedule-entry-modal .sched-modal-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin: 0;
  padding: 21px 24px 17px;
  border-bottom: 1px solid #dce2e5;
  background: linear-gradient(135deg,#fff,#edf0f1);
}
.schedule-entry-modal .sched-modal-mode-badge { margin-bottom: 7px; padding: 5px 9px; color: #65717a; border: 1px solid #d8dee2; background: #f2f4f5; font-size: .61rem; letter-spacing: .1em; }
.schedule-entry-modal .sched-modal-title { color: #273139; font-size: 1.22rem; font-weight: 680; letter-spacing: -.025em; }
.schedule-entry-modal .sched-modal-sub { margin-top: 5px; color: #758088; font-size: .7rem; }
.schedule-modal-close { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; padding: 0; border-color: #cbd3d8; border-radius: 9px; background: linear-gradient(145deg,#fff,#e5e9eb); box-shadow: 0 3px 8px rgba(38,46,52,.07); }
.schedule-entry-modal .sched-form {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 14px 16px;
  margin: 0;
  padding: 20px 24px;
}
.schedule-entry-modal .form-row-inline { display: grid; grid-template-columns: 1fr; align-content: start; gap: 6px; }
.schedule-entry-modal .form-row-inline.schedule-for-row,
.schedule-entry-modal .parallel-row,
.schedule-entry-modal .parallel-slot-divider { grid-column: 1 / -1; }
.schedule-entry-modal .schedule-for-text { justify-content: flex-start; min-height: 48px; padding: 11px 14px; text-align: left; border-left: 4px solid #59666f; border-radius: 10px; background: linear-gradient(135deg,#f1f3f4,#e2ebe7); box-shadow: none; color: #354149; font-size: .78rem; font-weight: 650; }
.schedule-entry-modal .form-label { color: #59666f; font-size: .69rem; font-weight: 680; }
.schedule-entry-modal .form-select,
.schedule-entry-modal .form-input { min-height: 43px; padding: 9px 34px 9px 11px; color: #344149; border-color: #cbd3d8; border-radius: 9px; background: #fff; font-size: .74rem; }
.schedule-entry-modal .form-select:focus,
.schedule-entry-modal .form-input:focus { border-color: #7f8d96; box-shadow: 0 0 0 3px rgba(70,84,94,.09); }
.schedule-entry-modal .campus-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 4px; border: 1px solid #cbd3d8; border-radius: 9px; background: #e9edef; }
.schedule-entry-modal .campus-btn { min-height: 34px; padding: 7px 9px; border: 0; border-radius: 6px; background: transparent; color: #5d6972; font-size: .68rem; }
.schedule-entry-modal .campus-btn.active { color: #fff; background: linear-gradient(145deg,#66737c,#3d4952); box-shadow: 0 3px 7px rgba(38,46,52,.16); }
.schedule-entry-modal .parallel-row { justify-content: flex-start; gap: 12px; padding: 3px 0; }
.schedule-entry-modal .parallel-btn { min-height: 38px; padding: 7px 12px; border: 1px solid #d1d8dc; border-radius: 9px; background: #fff; color: #58656e; font-size: .72rem; }
.schedule-entry-modal .parallel-btn.active { border-color: #87949c; background: #edf1f3; color: #344149; }
.schedule-entry-modal .par-radio { width: 18px; height: 18px; }
.schedule-entry-modal .parallel-slot-divider { margin-top: 3px; color: #69757e; border-color: #dce2e5; font-size: .64rem; }
.schedule-entry-modal .time-error { margin: 0 24px 12px !important; padding: 9px 11px !important; }
.schedule-entry-modal .lunch-break-footer { margin: 0; padding: 0 24px 18px; }
.schedule-entry-modal .lunch-break-modal-btn { min-height: 42px; border-color: #bdc7cd; border-radius: 9px; background: #e9edef; color: #4d5a63; font-size: .73rem; }
.schedule-entry-modal .sched-modal-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin: 0;
  padding: 14px 24px 18px;
  border-top: 1px solid #dce2e5;
  background: rgba(244,246,247,.97);
  backdrop-filter: blur(8px);
}
.schedule-entry-modal .cancel-btn-text { min-height: 39px; padding: 8px 14px; color: #5c6972; border: 1px solid transparent; border-radius: 8px; font-size: .73rem; }
.schedule-entry-modal .cancel-btn-text:hover { border-color: #d0d7db; background: #fff; opacity: 1; }
.schedule-entry-modal .save-btn { min-height: 41px; padding: 9px 19px; border: 1px solid #414d56; border-radius: 9px; background: linear-gradient(145deg,#64717b,#37434c); box-shadow: 0 4px 10px rgba(38,46,52,.16); font-size: .73rem; }
.schedule-entry-modal .save-btn:disabled { color: #929aa0; border-color: #d1d7db; background: #dfe3e5; box-shadow: none; opacity: 1; }

/* Consultation readability */
.consult-modal-box { width: 560px; }
.consult-modal-box .sched-modal-title { font-size: 1.3rem; }
.consult-usage { font-size: .76rem; }
.consult-empty strong { font-size: .8rem; }
.consult-empty div span { font-size: .72rem; line-height: 1.45; }
.consult-form-title { font-size: .9rem; }
.consult-modal-box .form-label { font-size: .74rem; }
.consult-modal-box .form-select { min-height: 46px; font-size: .8rem; }
.consult-slot-day,.consult-slot-time { font-size: .76rem; }
.consult-modal-box .cancel-btn-text,.consult-modal-box .save-btn { font-size: .76rem; }
@media (max-width: 640px) {
  .schedule-entry-modal .sched-form { grid-template-columns: 1fr; padding: 18px; }
  .schedule-entry-modal .form-row-inline.schedule-for-row,
  .schedule-entry-modal .parallel-row,
  .schedule-entry-modal .parallel-slot-divider { grid-column: auto; }
  .schedule-entry-modal .sched-modal-header,
  .schedule-entry-modal .sched-modal-actions { padding-right: 18px; padding-left: 18px; }
}

/* Modal legibility and metallic lunch-break dialog */
.modal-overlay { background: rgba(28,34,38,.5); backdrop-filter: blur(4px); }
.schedule-entry-modal .form-label { font-size: .76rem; line-height: 1.35; }
.schedule-entry-modal .form-select,
.schedule-entry-modal .form-input { font-size: .81rem; line-height: 1.35; }
.schedule-entry-modal .sched-modal-sub { font-size: .77rem; line-height: 1.45; }
.schedule-entry-modal .schedule-for-text { font-size: .84rem; line-height: 1.4; }

.lunch-break-picker {
  width: 500px;
  max-width: calc(100vw - 32px);
  padding: 0;
  overflow: hidden;
  color: #303b43;
  border: 1px solid rgba(255,255,255,.92);
  border-radius: 18px;
  background: #f6f8f9;
  box-shadow: 0 26px 70px rgba(20,27,31,.3), inset 0 1px #fff;
}
.lunch-break-picker-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 21px 22px 17px;
  border-bottom: 1px solid #dbe1e4;
  background: linear-gradient(135deg,#fff,#e9edef);
}
.lunch-break-picker-icon {
  width: 40px;
  height: 40px;
  color: #44515a;
  border-color: #c4cdd2;
  border-radius: 10px;
  background: linear-gradient(145deg,#fff,#dce2e5);
  box-shadow: 0 3px 8px rgba(38,46,52,.07), inset 0 1px #fff;
}
.lunch-break-picker-copy { min-width: 0; flex: 1; }
.lunch-break-picker-eyebrow { display: block; margin-bottom: 4px; color: #77838b; font-size: .62rem; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.lunch-break-picker h2 { color: #273139; font-size: 1.15rem; font-weight: 680; letter-spacing: -.02em; }
.lunch-break-picker-header p { margin-top: 4px; overflow: hidden; color: #69757d; font-size: .73rem; font-weight: 550; white-space: nowrap; text-overflow: ellipsis; }
.lunch-break-picker-close {
  display: grid;
  width: 35px;
  height: 35px;
  flex: 0 0 35px;
  place-items: center;
  padding: 0;
  color: #5b6871;
  border: 1px solid #c8d0d5;
  border-radius: 9px;
  background: linear-gradient(145deg,#fff,#e1e6e8);
  box-shadow: 0 3px 8px rgba(38,46,52,.07);
  cursor: pointer;
}
.lunch-break-picker-close:hover { color: #222c33; border-color: #929ea6; background: #fff; }
.lunch-break-picker-help { margin: 18px 22px 0; padding: 11px 12px; color: #5f6c74; border-left: 3px solid #64727c; border-radius: 0 8px 8px 0; background: #e9edef; font-size: .75rem; line-height: 1.55; }
.lunch-break-picker-fields { gap: 14px; padding: 18px 22px 2px; }
.lunch-break-picker-field { grid-template-columns: 1fr; gap: 7px; color: #55626b; font-size: .76rem; font-weight: 680; }
.lunch-break-picker-field select { min-height: 46px; padding: 10px 36px 10px 12px; color: #303b43; border-color: #c5ced3; border-radius: 9px; background: #fff; font-size: .82rem; outline: none; }
.lunch-break-picker-field select:focus { border-color: #7d8a93; box-shadow: 0 0 0 3px rgba(70,84,94,.1); }
.lunch-break-picker-error { margin: 14px 22px 0; padding: 10px 11px; color: #884848; border: 1px solid #e2caca; background: #f8eaea; font-size: .74rem; line-height: 1.45; }
.lunch-break-picker-actions { margin: 18px 0 0; padding: 14px 22px 19px; border-top: 1px solid #dbe1e4; background: #edf1f2; }
.lunch-break-picker-actions .cancel-btn-text { min-height: 40px; padding: 8px 14px; color: #5a6770; border: 1px solid transparent; border-radius: 8px; font-size: .76rem; font-weight: 650; }
.lunch-break-picker-actions .cancel-btn-text:hover { border-color: #ced6da; background: #fff; opacity: 1; }
.lunch-break-picker-actions .save-btn { min-height: 42px; padding: 9px 18px; border: 1px solid #414d56; border-radius: 9px; background: linear-gradient(145deg,#64717b,#37434c); box-shadow: 0 4px 10px rgba(38,46,52,.16); font-size: .76rem; }
.lunch-break-picker-actions .save-btn:disabled { color: #929aa0; border-color: #d1d7db; background: #dfe3e5; box-shadow: none; opacity: 1; }

/* Edit schedule hierarchy */
.schedule-entry-modal .schedule-teacher-field,
.schedule-entry-modal .schedule-subject-field,
.schedule-entry-modal .schedule-campus-field { grid-column: 1 / -1; }
.schedule-entry-modal .schedule-teacher-field .form-value-locked {
  min-height: 46px;
  padding: 10px 13px;
  color: #354149;
  border: 1px solid #d2d9dd;
  border-left: 4px solid #64727c;
  border-radius: 9px;
  background: linear-gradient(135deg,#f4f6f7,#e9edef);
  font-size: .82rem;
  font-weight: 650;
}
.schedule-entry-modal .schedule-subject-field .form-select { font-weight: 560; }
.schedule-entry-modal .schedule-campus-field .campus-toggle { max-width: 100%; }
.schedule-entry-modal .clear-slot-btn {
  min-height: 40px;
  padding: 8px 14px;
  color: #7d4747;
  border-color: #d7bcbc;
  border-radius: 9px;
  background: #faf4f4;
  font-size: .72rem;
  box-shadow: none;
}
.schedule-entry-modal .clear-slot-btn:hover { color: #713b3b; border-color: #c99f9f; background: #f5e7e7; }
.schedule-entry-modal.badge-edit,
.schedule-entry-modal .badge-edit { color: #59666f; border-color: #ccd4d9; background: #edf1f3; }
@media (max-width: 640px) {
  .schedule-entry-modal .schedule-teacher-field,
  .schedule-entry-modal .schedule-subject-field,
  .schedule-entry-modal .schedule-campus-field { grid-column: auto; }
}

/* Exact timetable boundary alignment */
.sched-grid td.td-time { position: sticky; overflow: visible; }
.time-boundary-label {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: block;
  width: 100%;
  padding: 2px 4px;
  background: #f7f8f9;
  line-height: 1.2;
  text-align: center;
  transform: translateY(-50%);
}
.sched-grid tbody tr:first-child .time-boundary-label { top: 6px; transform: none; }
.free-time-cell { position: relative; vertical-align: middle !important; }
.free-time-cell .click-to-add {
  position: absolute;
  inset: 0;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 0;
  line-height: 1.2;
  text-align: center;
}
.sched-entry { top: 0; bottom: 0; border-radius: 6px; }

/* ═══ Add Schedule Panel ═══ */
.panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.30); z-index: 900; display: flex; justify-content: flex-end; }
.add-panel { width: 420px; max-width: 96vw; background: #fff; height: 100vh; display: flex; flex-direction: column; box-shadow: -4px 0 32px rgba(0,0,0,0.14); overflow: hidden; }
.panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 24px 28px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.panel-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 3px 10px; border-radius: 20px; background: #f3f4f6; color: #4b5563; margin-bottom: 6px; }
.panel-title { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0 0 3px; }
.panel-sub   { font-size: 0.84rem; color: #888; margin: 0; }
.panel-close { background: none; border: 1px solid #ddd; border-radius: 8px; padding: 6px 8px; cursor: pointer; color: #555; flex-shrink: 0; display: flex; align-items: center; transition: all 0.15s; }
.panel-close:hover { border-color: #e63946; color: #e63946; }
.panel-form { display: flex; flex-direction: column; gap: 13px; padding: 20px 28px 8px; overflow-y: auto; flex: 1; }
.panel-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 14px 28px 20px; border-top: 1px solid #f0f0f0; flex-shrink: 0; background: #fff; }
.reset-btn { background: none; border: 1px solid #ccc; border-radius: 8px; padding: 8px 16px; font-family: inherit; font-size: 0.85rem; color: #666; cursor: pointer; transition: all 0.15s; }
.reset-btn:hover { border-color: #999; color: #333; }
.flash-msg { display: flex; align-items: center; gap: 8px; background: #e5e7eb; color: #4b5563; border-radius: 8px; padding: 10px 16px; font-size: 0.88rem; font-weight: 600; margin: 4px 28px 0; }
.flash-enter-active, .flash-leave-active { transition: opacity 0.3s; }
.flash-enter-from, .flash-leave-to { opacity: 0; }
.panel-enter-active { transition: opacity 0.25s ease; }
.panel-leave-active { transition: opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; }
.panel-enter-active .add-panel { animation: slideInPanel 0.25s ease; }
.panel-leave-active .add-panel { animation: slideOutPanel 0.2s ease; }
@keyframes slideInPanel  { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideOutPanel { from { transform: translateX(0); }    to { transform: translateX(100%); } }

/* ═══ Logout Modal ═══ */
.logout-modal-box { background: #fff; border-radius: 20px; padding: 36px 40px 32px; width: 360px; max-width: 94vw; display: flex; flex-direction: column; align-items: center; gap: 10px; box-shadow: 0 16px 48px rgba(0,0,0,0.18); text-align: center; }
.logout-modal-icon { width: 68px; height: 68px; border-radius: 50%; background: #ffeaea; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 6px; width: 100%; }
.logout-cancel-btn { background: none; border: none; font-family: inherit; font-size: 1rem; font-weight: 600; color: #e63946; cursor: pointer; padding: 8px 18px; border-radius: 10px; }
.logout-cancel-btn:hover  { background: #ffeaea; }
.logout-confirm-btn { background: #4b5563; color: #fff; border: none; font-family: inherit; font-size: 1rem; font-weight: 600; padding: 10px 32px; border-radius: 10px; cursor: pointer; }
.logout-confirm-btn:hover { background: #6b7280; }
.room-type-stack{display:flex;flex-direction:column;gap:6px}

/* Timetable workspace refresh */
.main { padding: 26px 32px 44px; }
.main-header {
  align-items: center;
  margin-bottom: 20px;
  padding: 8px 2px 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.header-left { min-width: 0; gap: 4px; }
.page-heading-row { display: flex; min-width: 0; align-items: center; gap: 14px; }
.page-heading-copy { min-width: 0; }
.page-eyebrow {
  display: block;
  color: #707c85;
  font-size: .63rem;
  font-weight: 750;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.bc-btn {
  display: inline-flex;
  width: max-content;
  align-items: center;
  min-height: 36px;
  padding: 7px 11px;
  color: #4e5a63;
  border: 1px solid #cbd2d6;
  border-radius: 9px;
  background: linear-gradient(145deg, #fff, #e7eaec);
  box-shadow: 0 3px 8px rgba(40,48,54,.07), inset 0 1px 0 #fff;
  text-decoration: none;
}
.page-heading-row .bc-btn {
  width: 42px;
  height: 42px;
  min-height: 42px;
  flex: 0 0 42px;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  text-decoration: none;
}
.page-title {
  margin-top: 4px;
  color: #1f2933;
  font-size: clamp(2rem, 3vw, 2.65rem);
  font-weight: 500;
  letter-spacing: -.04em;
  line-height: 1.08;
}
.page-sub { max-width: 680px; margin-top: 9px; color: #66727c; font-size: .94rem; line-height: 1.55; }
.header-right { align-items: flex-end; gap: 10px; }
.term-banner {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: #343f47;
  white-space: nowrap;
}
.term-banner-label { color: #7a858d; font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.term-banner strong { font-size: .77rem; font-weight: 650; }
.header-actions { padding: 0; }
.term-current-label { color: #4c5861; font-size: .78rem; }
.view-toggle {
  gap: 3px;
  margin: 0;
  padding: 4px;
  border: 1px solid #d1d7db;
  border-radius: 11px;
  background: rgba(238,240,241,.86);
}
.view-btn { min-height: 38px; padding: 8px 14px; border: 0; border-radius: 8px; background: transparent; font-size: .74rem; font-weight: 650; }
.view-btn:hover { background: rgba(255,255,255,.76); }
.view-btn.active { background: linear-gradient(145deg, #626c75, #343c43); box-shadow: 0 4px 9px rgba(38,45,50,.2), inset 0 1px rgba(255,255,255,.18); }
.schedule-card {
  padding: 0;
  overflow: visible;
  border: 1px solid rgba(255,255,255,.88);
  border-radius: 18px;
  background: #eef1f2;
  box-shadow: 0 14px 34px rgba(38,46,52,.11), inset 0 1px 0 #fff;
}
.main .schedule-card {
  border: 1px solid rgba(255,255,255,.88) !important;
  border-radius: 18px !important;
  background: #eef1f2 !important;
  box-shadow: 0 14px 34px rgba(38,46,52,.11), inset 0 1px 0 #fff !important;
}
.sched-topbar {
  align-items: center;
  margin: 0;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid #d7dde1;
  border-radius: 17px 17px 0 0;
  background: linear-gradient(135deg,#fff,#eceff0);
  box-shadow: inset 0 1px 0 #fff;
}
.schedule-back-btn {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  padding: 0;
  color: #46535c;
  border: 1px solid #c8d0d5;
  border-radius: 10px;
  background: linear-gradient(145deg,#fff,#e2e6e8);
  box-shadow: 0 3px 8px rgba(39,47,53,.08), inset 0 1px 0 #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, transform .16s ease;
}
.schedule-back-btn:hover { color: #202a31; border-color: #939fa7; background: #fff; transform: translateX(-2px); }
.schedule-back-btn:focus-visible { outline: 3px solid rgba(49,70,83,.18); outline-offset: 2px; }
.sched-topbar-left { min-width: 0; flex: 1; }
.sched-context-label {
  display: block;
  margin: 0 0 7px;
  color: #76818a;
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .1em;
  line-height: 1;
  text-transform: uppercase;
}
.sched-grid-title { display: flex; align-items: center; color: #252d33; font-size: 1.3rem; line-height: 1.25; letter-spacing: -.025em; }
.sched-grid-title svg { width: 19px; height: 19px; flex: 0 0 19px; margin-right: 9px !important; }
.sched-grid-sub.teacher-selected {
  margin-top: 5px;
  padding: 0;
  color: #707b83;
  border: 0;
  background: transparent;
  box-shadow: none;
  font-size: .72rem;
  font-weight: 500;
}
.sched-topbar-right { padding: 4px; border: 1px solid #d3dade; border-radius: 11px; background: #eef1f2; }
.sched-select { min-height: 38px; border-color: transparent; border-radius: 8px; background: transparent; color: #48545d; font-size: .72rem; font-weight: 600; }
.sched-select:hover,.sched-select:focus { border-color: #bec7cc; background: #fff; }
.icon-btn.consult-btn { width: 38px; height: 38px; border-radius: 8px; color: #fff; border-color: #3e4b55; background: linear-gradient(145deg,#62717b,#35434c); box-shadow: 0 3px 8px rgba(38,48,55,.17); }
.main .sched-grid-wrap {
  width: 100%;
  margin: 0;
  padding: 18px;
  overflow-x: auto;
  border: 0 !important;
  border-radius: 0 0 17px 17px !important;
  background: #eef1f2 !important;
  box-shadow: none !important;
}
.sched-grid { overflow: hidden; border: 1px solid #ccd4d9; border-radius: 12px; border-collapse: separate; border-spacing: 0; background: #fff; box-shadow: 0 5px 16px rgba(39,47,53,.06); }
.sched-grid th { height: 48px; padding: 11px 9px; background: #424c55; font-size: .75rem; letter-spacing: .01em; }
.sched-grid th:first-child { border-radius: 12px 0 0; }
.sched-grid th:last-child { border-radius: 0 12px 0 0; }
.sched-grid tbody tr { height: 44px; }
.sched-grid td { border-width: 0 1px 1px 0; border-color: #e0e4e7; }
.sched-grid tbody tr.half-hour td { border-top: 1px dashed #dfe4e7; }
.sched-grid td.td-time {
  overflow: visible;
  color: #536069;
  border-right: 1px solid #cfd6da;
  background: #f7f8f9;
  font-size: .66rem;
  vertical-align: middle;
}
.sched-grid tbody tr.half-hour .td-time { background: #f7f8f9; }
.time-boundary-label {
  position: static;
  display: block;
  width: 100%;
  padding: 0;
  background: transparent;
  line-height: 1.2;
  text-align: center;
  transform: none;
}
.free-time-cell { background: #f8f9fa; }
.free-time-cell:hover { background: #edf1f3; }
.free-time-cell .click-to-add { color: #8a949b; font-size: .63rem; opacity: 0; transition: opacity .15s ease; }
.free-time-cell:hover .click-to-add { opacity: 1; }
.sched-entry { left: 4px; right: 4px; padding: 7px 8px; border-radius: 7px; box-shadow: 0 3px 8px rgba(30,39,44,.14); }
.entry-teacher {
  display: -webkit-box;
  padding-right: 0;
  overflow: hidden;
  font-size: .72rem;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.entry-subject {
  display: -webkit-box;
  padding-right: 0;
  overflow: hidden;
  font-size: .67rem;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.entry-time-range { font-size: .62rem; font-style: normal; font-weight: 550; }
.entry-timestamp { opacity: .7; }

/* Refined list workspace */
.main-list-view { padding-right: 24px; padding-left: 24px; }
.main-list-view .main-header,
.main-list-view .list-schedule-card { width: 100%; max-width: none; }
.main .list-schedule-card {
  width: 100%;
  max-width: none;
  overflow: visible;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.list-schedule-toolbar {
  min-height: 92px;
  padding: 18px 22px;
  border: 1px solid rgba(255,255,255,.94);
  border-radius: 16px;
  background: linear-gradient(135deg,#fff,#eceff0);
  box-shadow: 0 10px 24px rgba(38,46,52,.09), inset 0 1px 0 #fff;
}
.list-summary { display: flex; min-width: 0; align-items: center; gap: 13px; }
.list-summary-count {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  color: #fff;
  border: 1px solid #69747d;
  border-radius: 12px;
  background: linear-gradient(145deg,#69747d,#354049);
  box-shadow: 0 5px 12px rgba(38,47,54,.18), inset 0 1px rgba(255,255,255,.2);
  font-size: 1rem;
  font-weight: 700;
}
.list-summary-title { margin: 0; color: #283139; font-size: 1rem; font-weight: 680; letter-spacing: -.015em; }
.list-summary-copy { margin: 4px 0 0; color: #748089; font-size: .72rem; line-height: 1.45; }
.list-toolbar-actions { display: flex; align-items: center; }
.list-toolbar-actions .new-sched-btn {
  min-height: 42px;
  padding: 10px 17px;
  border: 1px solid #434f58;
  border-radius: 10px;
  background: linear-gradient(145deg,#626e78,#354049);
  box-shadow: 0 5px 12px rgba(38,47,54,.18), inset 0 1px rgba(255,255,255,.18);
  font-size: .76rem;
  font-weight: 650;
  letter-spacing: .005em;
}
.list-toolbar-actions .new-sched-btn:hover { background: linear-gradient(145deg,#707c85,#424d56); transform: translateY(-1px); }
.schedule-list-wrap { width: 100%; margin: 18px 0 0; background: transparent; }
.schedule-list-table-wrap {
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  border: 1px solid #d6dde1;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(38,46,52,.09);
  scrollbar-color: #aab3b9 transparent;
  -webkit-overflow-scrolling: touch;
}
.schedule-list-table {
  width: 100%;
  min-width: 0;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  background: #fff;
}
.schedule-list-table thead th:first-child { border-radius: 13px 0 0; }
.schedule-list-table thead th:last-child { border-radius: 0 13px 0 0; }
.schedule-list-table th,
.schedule-list-table td { border: 0; border-bottom: 1px solid #e3e7e9; text-align: left; vertical-align: middle; }
.schedule-list-table th {
  height: 46px;
  padding: 11px 14px;
  color: #65717a;
  background: #f1f3f4;
  font-size: .62rem;
  font-weight: 750;
  letter-spacing: .075em;
  text-transform: uppercase;
}
.schedule-list-table td { height: 66px; padding: 12px 14px; color: #343e46; font-size: .76rem; line-height: 1.4; }
.schedule-list-table th + th,
.schedule-list-table td + td { border-left: 1px solid #edf0f1; }
.schedule-list-table th:nth-child(1) { width: 9%; }
.schedule-list-table th:nth-child(2) { width: 13%; }
.schedule-list-table th:nth-child(3) { width: 8%; }
.schedule-list-table th:nth-child(4) { width: 24%; }
.schedule-list-table th:nth-child(5) { width: 16%; }
.schedule-list-table th:nth-child(6) { width: 7%; }
.schedule-list-table th:nth-child(7) { width: 10%; }
.schedule-list-table th:nth-child(8) { width: 13%; }
.schedule-list-row { cursor: pointer; transition: background .14s ease, box-shadow .14s ease; }
.schedule-list-row:nth-child(even) { background: #fbfcfc; }
.schedule-list-row:hover { background: #eef2f4; box-shadow: inset 3px 0 #53616b; }
.schedule-list-row:focus-within { outline: 2px solid #687782; outline-offset: -2px; }
.list-day { color: #2f3a42; font-weight: 680; }
.list-time { display: inline-block; color: #33424c; font-size: .72rem; font-weight: 650; white-space: nowrap; }
.list-year,
.list-room,
.list-section {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid #d9dfe2;
  border-radius: 7px;
  background: #f1f4f5;
  color: #53616a;
  font-size: .68rem;
  font-weight: 620;
}
.list-subject { display: -webkit-box; overflow: hidden; color: #263139; font-weight: 570; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.list-teacher { display: -webkit-box; overflow: hidden; color: #39464f; font-weight: 620; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.list-campus { display: block; overflow: hidden; color: #66727b; white-space: nowrap; text-overflow: ellipsis; }
.empty-state-row td { height: 150px; border-left: 0; color: #748089; text-align: center; }
.schedule-list-table tbody tr:last-child td:first-child { border-radius: 0 0 0 13px; }
.schedule-list-table tbody tr:last-child td:last-child { border-radius: 0 0 13px; }
.list-add-section {
  scroll-margin: 28px;
  margin-top: 20px;
  padding: 22px;
  border: 1px solid #d4dce0;
  border-radius: 15px;
  background: linear-gradient(145deg,#fff,#eef1f2);
  box-shadow: 0 10px 24px rgba(38,46,52,.08), inset 0 1px #fff;
}
.list-add-section:focus-within { border-color: #9ca8b0; box-shadow: 0 12px 28px rgba(38,46,52,.11), 0 0 0 3px rgba(82,98,109,.08); }
.list-add-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 17px; border-bottom: 1px solid #dce2e5; }
.list-add-eyebrow { display: block; margin-bottom: 5px; color: #77838b; font-size: .61rem; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.list-add-heading h3 { margin: 0; color: #273139; font-size: 1.05rem; font-weight: 680; letter-spacing: -.02em; }
.list-add-heading p { margin: 4px 0 0; color: #717d85; font-size: .71rem; }
.list-add-required { flex: 0 0 auto; padding: 5px 9px; color: #66727b; border: 1px solid #d7dde1; border-radius: 999px; background: #f4f6f7; font-size: .6rem; font-weight: 650; }
.list-add-grid {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 19px 2px 16px;
  overflow-x: visible;
  scrollbar-color: #aab3b9 transparent;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}
.list-field { display: flex; min-width: 0; flex-direction: column; gap: 7px; color: #56636c; font-size: .65rem; font-weight: 680; }
.list-field { width: 118px; min-width: 0; flex: 1 1 118px; }
.list-field-time { width: 230px; min-width: 0; flex: 1.5 1 230px; }
.list-field-wide { width: 220px; min-width: 0; flex: 1.6 1 220px; }
.list-campus-field { width: 156px; min-width: 0; flex: 1.1 1 156px; }
.list-field .form-select {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 9px 22px 9px 9px;
  color: #354149;
  border: 1px solid #cbd3d8;
  border-radius: 9px;
  background-color: #fbfcfc;
  font-size: .66rem;
  font-weight: 520;
  text-overflow: ellipsis;
}
.list-field .form-select:focus { border-color: #7e8c95; background-color: #fff; box-shadow: 0 0 0 3px rgba(76,91,102,.09); }
.list-field-time .time-inputs { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: center; gap: 8px; }
.list-field-time .time-separator { color: #7b878f; font-size: .62rem; font-weight: 650; }
.list-field-error { color: #a54545; font-size: .6rem; font-weight: 600; }
.list-campus-options { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 4px; border: 1px solid #cbd3d8; border-radius: 9px; background: #e9edef; }
.list-campus-options button { min-height: 32px; color: #5e6a72; border: 0; border-radius: 6px; background: transparent; font: inherit; cursor: pointer; }
.list-campus-options button.active { color: #fff; background: linear-gradient(145deg,#66727c,#3c4750); box-shadow: 0 3px 7px rgba(38,46,52,.17); }
.list-add-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 16px; border-top: 1px solid #dce2e5; color: #758189; font-size: .66rem; }
.list-add-submit { min-height: 40px; padding: 9px 18px; color: #fff; border: 1px solid #3f4b54; border-radius: 9px; background: linear-gradient(145deg,#626f78,#354149); box-shadow: 0 4px 10px rgba(38,46,52,.16); font: inherit; font-size: .72rem; font-weight: 680; cursor: pointer; }
.list-add-submit:hover:not(:disabled) { background: linear-gradient(145deg,#707d86,#424e57); transform: translateY(-1px); }
.list-add-submit:disabled { color: #8d969c; border-color: #d2d8dc; background: #e1e5e7; box-shadow: none; cursor: not-allowed; }
.schedule-list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 4px 2px;
  color: #748089;
  font-size: .7rem;
}
.list-footer-action {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  color: #46545e;
  border: 1px solid #cbd3d8;
  border-radius: 9px;
  background: linear-gradient(145deg,#fff,#e9edef);
  box-shadow: 0 3px 8px rgba(38,46,52,.07), inset 0 1px #fff;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.list-footer-action:hover { color: #202a31; border-color: #9eabb3; background: #fff; }
@media (max-width: 900px) {
  .main { padding: 24px 20px 40px; }
  .main-header { align-items: flex-start; flex-direction: column; }
  .header-right { width: 100%; align-items: flex-start; }
  .sched-topbar { align-items: flex-start; flex-direction: column; }
  .list-schedule-toolbar { gap: 14px; }
  .list-toolbar-actions { width: 100%; }
  .list-toolbar-actions .new-sched-btn { width: 100%; justify-content: center; }
  .schedule-list-footer { align-items: flex-start; flex-direction: column; }
  .sched-grid-wrap { padding: 14px; }
}
@media (max-width: 560px) {
  .list-add-section { padding: 18px 15px; }
  .list-add-heading,.list-add-actions { align-items: flex-start; flex-direction: column; }
  .list-add-submit { width: 100%; }
}

/* Timetable interaction and event-spacing refinements */
.sched-grid td.td-time {
  position: sticky;
  overflow: visible;
  padding: 0 8px;
  vertical-align: middle;
}
.time-boundary-label {
  position: static;
  width: 100%;
  padding: 0;
  background: transparent;
  line-height: 1.2;
  text-align: center;
  transform: none;
}
.sched-grid tbody tr:first-child .time-boundary-label {
  top: auto;
  transform: none;
}
.free-time-cell {
  position: relative;
  vertical-align: middle !important;
}
.free-time-cell .click-to-add {
  position: absolute;
  inset: 0;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 0;
  line-height: 1.2;
  text-align: center;
}
.sched-entry {
  left: 4px;
  right: 4px;
  border-radius: 7px;
}
.consult-entry {
  overflow: hidden;
  left: 6px;
  right: 6px;
  box-sizing: border-box;
  border: 1px solid rgba(255,255,255,.28);
  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
}
.consult-entry:hover {
  z-index: 6;
  filter: brightness(1.04);
  box-shadow: 0 8px 18px rgba(35,84,132,.28);
  transform: translateY(-1px);
}
.consult-entry:focus-visible {
  z-index: 7;
  outline: 3px solid rgba(74,144,217,.32);
  outline-offset: 2px;
}
.consult-edit-hint {
  position: absolute;
  right: 7px;
  bottom: 6px;
  padding: 3px 7px;
  color: rgba(255,255,255,.94);
  border-radius: 999px;
  background: rgba(24,65,106,.34);
  font-size: .58rem;
  font-weight: 650;
  letter-spacing: .01em;
  opacity: .84;
}
.consult-entry:hover .consult-edit-hint,
.consult-entry:focus-visible .consult-edit-hint { background: rgba(24,65,106,.52); opacity: 1; }

/* Consultation dialog layout */
.consult-modal-box {
  width: 940px;
  max-height: calc(100vh - 48px);
  color: #2f3a42;
  border-radius: 22px;
  background: #f7f9fa;
}
.consult-modal-box .sched-modal-header {
  align-items: flex-start;
  padding: 24px 26px 22px;
  background: linear-gradient(145deg,#fff 0%,#f1f4f5 68%,#e9eef0 100%);
}
.consult-header-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  color: #fff;
  border: 1px solid #45545e;
  border-radius: 13px;
  background: linear-gradient(145deg,#697983,#3d4b54);
  box-shadow: 0 7px 16px rgba(43,56,64,.2), inset 0 1px rgba(255,255,255,.22);
}
.consult-modal-box .sched-modal-mode-badge { margin-bottom: 6px; }
.consult-modal-box .sched-modal-title { font-size: 1.25rem; line-height: 1.25; }
.consult-modal-subtitle { margin: 5px 0 0; color: #738089; font-size: .74rem; line-height: 1.5; }
.consult-modal-content {
  display: grid;
  grid-template-columns: minmax(0,3fr) minmax(0,7fr);
  min-height: 430px;
}
.consult-left-pane {
  min-width: 0;
  padding: 22px 18px 24px;
  border-right: 1px solid #dce2e5;
  background: #f2f5f6;
}
.consult-left-pane .consult-slot-dur { display: none; }
.consult-left-pane .consult-slot-item { gap: 9px; padding: 11px 10px; }
.consult-left-pane .consult-slot-actions { gap: 4px; }
.consult-left-pane .consult-edit-btn { padding: 5px; }
.consult-right-pane {
  display: flex;
  min-width: 0;
  flex-direction: column;
  background: #fafbfb;
}
.consult-usage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
  padding: 14px;
  border: 1px solid #d8dfe3;
  border-radius: 10px;
  background: rgba(255,255,255,.75);
}
.consult-usage-copy { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.consult-usage-copy span { color: #748089; font-size: .67rem; font-weight: 650; }
.consult-usage-copy strong { color: #3f4c55; font-size: .71rem; font-weight: 750; }
.consult-progress { width: 100%; height: 7px; align-self: center; background: #dce2e5; }
.consult-progress span { background: linear-gradient(90deg,#71838e,#3f4e58); }
.consult-section-heading { display: flex; align-items: flex-start; flex-direction: column; justify-content: space-between; gap: 5px; padding: 22px 0 10px; }
.consult-section-heading div { display: flex; align-items: center; gap: 9px; }
.consult-section-heading span { color: #344149; font-size: .83rem; font-weight: 750; }
.consult-section-heading strong { padding: 3px 8px; color: #64727b; border-radius: 999px; background: #e7ecee; font-size: .62rem; }
.consult-section-heading p { margin: 0; color: #849098; font-size: .65rem; }
.consult-slots-list { max-height: 285px; padding: 0 2px 5px 0; overflow-y: auto; }
.consult-slot-item { gap: 12px; padding: 12px 13px; border-radius: 12px; transition: border-color .15s ease, box-shadow .15s ease; }
.consult-slot-item:hover { border-color: #bdc8ce; box-shadow: 0 6px 14px rgba(40,52,60,.08); }
.consult-slot-calendar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; color: #586872; border-radius: 9px; background: #edf1f3; }
.consult-slot-details { min-width: 0; flex: 1; }
.consult-slot-day { min-width: 0; color: #344149; font-size: .77rem; }
.consult-slot-time { margin-top: 2px; color: #748089; font-size: .7rem; }
.consult-slot-dur { flex: 0 0 auto; padding: 4px 8px; }
.consult-slot-actions { margin-left: 2px; }
.consult-edit-btn,.consult-del-btn { min-height: 32px; border-radius: 8px; }
.consult-edit-btn { display: grid; width: 32px; padding: 5px; place-items: center; }
.consult-del-btn { width: 32px; justify-content: center; padding: 5px; }
.consult-form-shell {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 14px 16px;
  margin: 22px 24px 0;
  padding: 19px;
  border: 1px solid #d9e0e4;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 5px 14px rgba(40,52,60,.05);
}
.consult-form-heading { grid-column: 1 / -1; display: flex; align-items: center; gap: 11px; padding-bottom: 2px; }
.consult-form-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; color: #fff; border-radius: 9px; background: #4a5963; }
.consult-form-heading .consult-form-title { padding: 0; font-size: .83rem; }
.consult-form-heading p { margin: 2px 0 0; color: #7c8991; font-size: .65rem; }
.consult-day-field { grid-column: 1 / -1; }
.consult-modal-box .form-row-inline { gap: 7px; }
.consult-modal-box .form-select { min-height: 44px; }
.consult-modal-box .time-error { grid-column: 1 / -1; }
.consult-modal-box .sched-modal-actions {
  position: sticky;
  bottom: 0;
  z-index: 4;
  gap: 9px;
  margin-top: auto;
  padding: 15px 24px 19px;
  background: rgba(240,244,245,.96);
  backdrop-filter: blur(8px);
}
.consult-modal-box .save-btn { min-width: 126px; justify-content: center; }
@media (max-width: 640px) {
  .consult-modal-box { width: calc(100vw - 24px); max-height: calc(100vh - 24px); }
  .consult-modal-box .sched-modal-header { padding: 20px 18px; }
  .consult-header-icon { display: none; }
  .consult-modal-content { display: block; min-height: 0; }
  .consult-left-pane { padding: 18px; border-right: 0; border-bottom: 1px solid #dce2e5; }
  .consult-usage { grid-template-columns: 1fr; }
  .consult-section-heading { padding-right: 0; padding-left: 0; }
  .consult-slots-list { max-height: none; padding-right: 0; padding-left: 0; }
  .consult-slot-dur { display: none; }
  .consult-form-shell { grid-template-columns: 1fr; margin-right: 18px; margin-left: 18px; padding: 16px; }
  .consult-form-heading,.consult-day-field { grid-column: auto; }
  .consult-modal-box .sched-modal-actions { padding-right: 18px; padding-left: 18px; }
}
@media (min-width: 641px) and (max-width: 900px) {
  .consult-modal-box { width: calc(100vw - 32px); }
  .consult-modal-content { grid-template-columns: minmax(0,3fr) minmax(0,7fr); }
  .consult-left-pane { padding: 20px; }
  .consult-form-shell { grid-template-columns: 1fr; margin: 20px; }
  .consult-form-heading,.consult-day-field { grid-column: auto; }
}

/* Metallic gray neumorphic consultation theme */
.consult-modal-box {
  border: 1px solid rgba(255,255,255,.92);
  background: linear-gradient(145deg,#e9edef,#cfd5d9);
  box-shadow: 26px 26px 60px rgba(22,29,34,.38), -12px -12px 34px rgba(255,255,255,.38), inset 0 1px 1px #fff;
}
.consult-modal-box .sched-modal-header {
  border-bottom-color: #bfc7cc;
  background: linear-gradient(145deg,#f4f6f7,#d6dce0);
  box-shadow: inset 0 1px #fff, 0 8px 20px rgba(48,59,66,.1);
}
.consult-header-icon {
  color: #f9fbfc;
  border-color: #39464f;
  background: linear-gradient(145deg,#697984,#36434c);
  box-shadow: 7px 7px 14px rgba(55,65,72,.28), -5px -5px 12px rgba(255,255,255,.9), inset 1px 1px rgba(255,255,255,.25);
}
.consult-modal-box .sched-modal-mode-badge {
  color: #53616a;
  border-color: #c3cbd0;
  background: linear-gradient(145deg,#f5f7f8,#dce1e4);
  box-shadow: 3px 3px 7px rgba(72,83,90,.13), -3px -3px 7px #fff;
}
.consult-close {
  color: #4d5961;
  border-color: #c1c9ce;
  background: linear-gradient(145deg,#f2f4f5,#cfd5d9);
  box-shadow: 6px 6px 12px rgba(68,78,85,.2), -5px -5px 11px rgba(255,255,255,.92), inset 0 1px #fff;
}
.consult-close:hover {
  color: #242e34;
  border-color: #aeb8be;
  background: linear-gradient(145deg,#fff,#d7dde0);
  transform: translateY(-1px);
}
.consult-left-pane {
  border-right-color: #bcc5ca;
  background: linear-gradient(145deg,#dce1e4,#cbd2d6);
  box-shadow: inset -8px 0 18px rgba(74,84,91,.08), inset 1px 0 rgba(255,255,255,.72);
}
.consult-right-pane { background: linear-gradient(145deg,#e7ebed,#d5dbde); }
.consult-usage {
  border-color: rgba(255,255,255,.68);
  background: linear-gradient(145deg,#e9edef,#cdd4d8);
  box-shadow: 8px 8px 17px rgba(76,87,94,.19), -7px -7px 16px rgba(255,255,255,.76), inset 0 1px #fff;
}
.consult-usage-copy span { color: #68757d; }
.consult-usage-copy strong { color: #354149; }
.consult-progress {
  padding: 2px;
  height: 9px;
  background: #c3cbd0;
  box-shadow: inset 3px 3px 6px rgba(78,89,96,.25), inset -2px -2px 5px rgba(255,255,255,.72);
}
.consult-progress span { background: linear-gradient(90deg,#7b8b95,#34414a); box-shadow: 0 1px 3px rgba(31,40,46,.28); }
.consult-section-heading strong,
.consult-slot-dur {
  color: #53616a;
  background: linear-gradient(145deg,#e9edef,#cbd2d6);
  box-shadow: 3px 3px 7px rgba(72,83,90,.14), -3px -3px 7px rgba(255,255,255,.8);
}
.consult-slot-item {
  border-color: rgba(255,255,255,.72);
  background: linear-gradient(145deg,#edf0f2,#d2d8dc);
  box-shadow: 7px 7px 15px rgba(73,84,91,.17), -6px -6px 14px rgba(255,255,255,.74), inset 0 1px #fff;
}
.consult-slot-item:hover {
  border-color: #f7f8f9;
  background: linear-gradient(145deg,#f3f5f6,#d7dde0);
  box-shadow: 9px 9px 19px rgba(65,76,83,.21), -7px -7px 16px rgba(255,255,255,.86), inset 0 1px #fff;
  transform: translateY(-1px);
}
.consult-slot-calendar {
  color: #4e5d66;
  background: linear-gradient(145deg,#e8ecee,#c4ccd1);
  box-shadow: 4px 4px 9px rgba(70,81,88,.18), -4px -4px 9px rgba(255,255,255,.8);
}
.consult-edit-btn {
  color: #46545d;
  border-color: #aeb9c0;
  background: linear-gradient(145deg,#edf0f2,#cbd2d6);
  box-shadow: 4px 4px 8px rgba(70,81,88,.16), -3px -3px 7px rgba(255,255,255,.78);
}
.consult-edit-btn:hover { color: #273139; background: linear-gradient(145deg,#f7f8f9,#d4dade); }
.consult-del-btn {
  color: #854a4a;
  border-color: #c9aaaa;
  background: linear-gradient(145deg,#eee9e9,#d7cdcd);
  box-shadow: 4px 4px 8px rgba(78,67,67,.14), -3px -3px 7px rgba(255,255,255,.75);
}
.consult-form-shell {
  border-color: rgba(255,255,255,.82);
  background: linear-gradient(145deg,#e9edef,#cfd6da);
  box-shadow: 10px 10px 22px rgba(67,78,85,.2), -8px -8px 19px rgba(255,255,255,.82), inset 0 1px #fff;
}
.consult-form-icon {
  border: 1px solid #3d4a53;
  background: linear-gradient(145deg,#687984,#38454e);
  box-shadow: 5px 5px 11px rgba(58,69,76,.25), -4px -4px 10px rgba(255,255,255,.72), inset 0 1px rgba(255,255,255,.2);
}
.consult-modal-box .form-select {
  color: #344149;
  border-color: #b7c1c7;
  background: linear-gradient(145deg,#f0f2f3,#d9dee1);
  box-shadow: inset 3px 3px 7px rgba(77,88,95,.14), inset -3px -3px 7px rgba(255,255,255,.82);
}
.consult-modal-box .form-select:hover { border-color: #9facb3; }
.consult-modal-box .form-select:focus {
  border-color: #7d8b94;
  background: #edf0f2;
  box-shadow: inset 3px 3px 7px rgba(77,88,95,.16), inset -3px -3px 7px rgba(255,255,255,.78), 0 0 0 3px rgba(67,82,91,.13);
}
.consult-modal-box .sched-modal-actions {
  border-top-color: #bec7cc;
  background: linear-gradient(145deg,rgba(225,230,233,.97),rgba(202,210,214,.97));
  box-shadow: 0 -7px 18px rgba(57,68,75,.09), inset 0 1px rgba(255,255,255,.72);
}
.consult-modal-box .cancel-btn-text {
  color: #4d5a62;
  border-color: transparent;
}
.consult-modal-box .cancel-btn-text:hover {
  border-color: #bac4c9;
  background: linear-gradient(145deg,#edf0f2,#d1d7db);
  box-shadow: 4px 4px 9px rgba(69,80,87,.15), -4px -4px 9px rgba(255,255,255,.74);
}
.consult-modal-box .save-btn {
  color: #fff;
  border-color: #35424b;
  background: linear-gradient(145deg,#687984,#34414a);
  box-shadow: 6px 6px 13px rgba(54,65,72,.28), -5px -5px 12px rgba(255,255,255,.6), inset 0 1px rgba(255,255,255,.22);
}
.consult-modal-box .save-btn:not(:disabled):hover { background: linear-gradient(145deg,#778892,#3d4a53); transform: translateY(-1px); }
.consult-modal-box .save-btn:disabled {
  color: #8e989e;
  border-color: #b8c1c6;
  background: linear-gradient(145deg,#dbe0e3,#c4ccd0);
  box-shadow: inset 3px 3px 7px rgba(76,87,94,.12), inset -3px -3px 7px rgba(255,255,255,.55);
}
.consult-empty {
  margin-right: 0;
  margin-left: 0;
  border-color: #aeb9bf;
  background: linear-gradient(145deg,#e4e8ea,#cad1d5);
  box-shadow: inset 3px 3px 7px rgba(74,85,92,.12), inset -3px -3px 7px rgba(255,255,255,.65);
}
.consult-empty-icon { background: linear-gradient(145deg,#e8ecee,#c5cdd1); box-shadow: 3px 3px 7px rgba(70,81,88,.14), -3px -3px 7px rgba(255,255,255,.7); }

/* Use the right modal pane itself as the input surface */
.consult-right-pane {
  background: linear-gradient(145deg,#e8ecee,#d5dbde);
  box-shadow: inset 1px 0 rgba(255,255,255,.66);
}
.consult-right-pane .consult-form-shell {
  align-content: start;
  margin: 0;
  padding: 34px 38px 28px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.consult-right-pane .consult-form-heading {
  margin-bottom: 9px;
  padding-bottom: 19px;
  border-bottom: 1px solid rgba(166,177,184,.72);
}
.consult-right-pane .consult-form-icon {
  width: 42px;
  height: 42px;
  flex-basis: 42px;
}
.consult-right-pane .consult-form-heading .consult-form-title { font-size: .91rem; }
.consult-right-pane .consult-form-heading p { margin-top: 4px; font-size: .7rem; }
.consult-right-pane .form-row-inline { gap: 8px; }
.consult-right-pane .form-label { color: #4e5b64; font-size: .76rem; }
.consult-right-pane .form-select { min-height: 50px; font-size: .82rem; }
.consult-right-pane .sched-modal-actions {
  border-top: 1px solid #bbc4c9;
  background: linear-gradient(145deg,rgba(224,229,232,.98),rgba(202,209,213,.98));
}
@media (max-width: 900px) {
  .consult-right-pane .consult-form-shell { margin: 0; padding: 26px 24px; }
}
@media (max-width: 640px) {
  .consult-right-pane .consult-form-shell { padding: 22px 18px; }
}

/* ── Flat minimalist consultation modal ───────────────────────────────── */
.consult-modal-box {
  border: 1px solid #d9e0e5;
  background: #f8fafb;
  box-shadow: 0 26px 70px rgba(18,24,30,.28);
}
.consult-modal-box .sched-modal-header {
  min-height: 118px;
  padding: 26px 32px;
  border-bottom: 1px solid #e1e7eb;
  background: #fff;
  box-shadow: none;
}
.consult-header-icon {
  color: #44515d;
  border: 1px solid #d9e1e7;
  background: #f2f5f7;
  box-shadow: none;
}
.consult-modal-box .sched-modal-mode-badge {
  color: #5d6873;
  border: 1px solid #d9e1e7;
  background: #f7f9fa;
  box-shadow: none;
}
.consult-modal-box .sched-modal-title { color: #202830; }
.consult-modal-subtitle { color: #7a858e; }
.consult-close {
  color: #5d6873;
  border: 1px solid #d9e1e7;
  background: #f8fafb;
  box-shadow: none;
}
.consult-close:hover {
  color: #202830;
  border-color: #c8d2d9;
  background: #eef2f4;
  transform: none;
}
.consult-modal-content {
  background: #f8fafb;
}
.consult-left-pane {
  border-right: 1px solid #e1e7eb;
  background: #f3f6f8;
  box-shadow: none;
}
.consult-right-pane {
  background: #fff;
  box-shadow: none;
}
.consult-usage,
.consult-slot-item,
.consult-empty {
  border: 1px solid #dfe6eb;
  background: #fff;
  box-shadow: none;
}
.consult-progress {
  height: 8px;
  padding: 0;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8ec;
  box-shadow: none;
}
.consult-progress span {
  background: #44515d;
  box-shadow: none;
}
.consult-section-heading strong,
.consult-slot-dur {
  color: #5d6873;
  background: #eef2f4;
  box-shadow: none;
}
.consult-slot-item:hover {
  border-color: #cfd9df;
  background: #f9fbfc;
  box-shadow: none;
  transform: none;
}
.consult-slot-calendar,
.consult-empty-icon {
  color: #5d6873;
  background: #eef2f4;
  box-shadow: none;
}
.consult-edit-btn,
.consult-del-btn {
  box-shadow: none;
}
.consult-edit-btn {
  color: #44515d;
  border: 1px solid #cfd9df;
  background: #fff;
}
.consult-edit-btn:hover {
  color: #202830;
  background: #eef2f4;
}
.consult-del-btn {
  color: #b34040;
  border: 1px solid #efcaca;
  background: #fff5f5;
}
.consult-form-shell {
  border: 0;
  background: transparent;
  box-shadow: none;
}
.consult-form-icon {
  color: #fff;
  border: 1px solid #3e4a55;
  background: #44515d;
  box-shadow: none;
}
.consult-right-pane .consult-form-shell {
  padding: 32px 38px 26px;
}
.consult-right-pane .consult-form-heading {
  border-bottom: 1px solid #e1e7eb;
}
.consult-modal-box .form-select {
  color: #26313b;
  border: 1px solid #d7e0e6;
  background: #fbfcfd;
  box-shadow: none;
}
.consult-modal-box .form-select:hover { border-color: #aeb9c0; }
.consult-modal-box .form-select:focus {
  border-color: #6b7884;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(100,113,126,.12);
}
.consult-modal-box .sched-modal-actions,
.consult-right-pane .sched-modal-actions {
  border-top: 1px solid #e1e7eb;
  background: #fff;
  box-shadow: none;
}
.consult-modal-box .cancel-btn-text {
  color: #5d6873;
  border: 1px solid transparent;
  background: transparent;
  box-shadow: none;
}
.consult-modal-box .cancel-btn-text:hover {
  border-color: #d7e0e6;
  background: #f6f8f9;
  box-shadow: none;
}
.consult-modal-box .save-btn {
  color: #fff;
  border: 1px solid #3e4a55;
  background: #44515d;
  box-shadow: 0 8px 18px rgba(48,57,66,.16);
}
.consult-modal-box .save-btn:not(:disabled):hover {
  background: #303b45;
  transform: none;
}
.consult-modal-box .save-btn:disabled {
  color: #8e989e;
  border-color: #d7e0e6;
  background: #edf1f3;
  box-shadow: none;
}
@media (max-width: 900px) {
  .consult-left-pane { border-right: 0; border-bottom: 1px solid #e1e7eb; }
  .consult-right-pane .consult-form-shell { padding: 24px; }
}
@media (max-width: 640px) {
  .consult-right-pane .consult-form-shell { padding: 20px 18px; }
}
</style>

<style>
.swal-cit-popup { font-family: 'Poppins', sans-serif !important; border-radius: 18px !important; padding: 32px 28px 24px !important; box-shadow: 0 12px 48px rgba(0,0,0,0.18) !important; }
.swal-cit-title { font-family: 'Poppins', sans-serif !important; font-size: 1.15rem !important; font-weight: 700 !important; color: #1a1a2e !important; margin-bottom: 8px !important; }
.swal-cit-btn { font-family: 'Poppins', sans-serif !important; font-size: 0.9rem !important; font-weight: 600 !important; border-radius: 10px !important; padding: 9px 28px !important; letter-spacing: 0.02em !important; }
</style>
