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
    <main class="main">
      <!-- Page Header -->
      <header class="main-header">
        <div class="header-left">
          <div class="breadcrumb"><button class="bc-btn back-only" @click="router.back()">&larr; Back</button></div>
          <h1 class="page-title">
            <template v-if="scheduleViewMode === ''">Choose View Mode</template>
            <template v-else-if="scheduleViewMode === 'list'">All Schedules</template>
            <template v-else-if="!addMode">Add Schedule</template>
            <template v-else-if="addMode === 'teacher'">{{ selectedTeacher ? `Prof. ${selectedTeacher}` : 'By Teacher' }}</template>
            <template v-else-if="addMode === 'room'">{{ contextRoom ? `Room ${contextRoom}` : contextFloor ? contextFloor : 'By Room' }}</template>
          </h1>
          <p class="page-sub">
            <template v-if="scheduleViewMode === ''">Start by choosing the view mode you want to use.</template>
            <template v-else-if="scheduleViewMode === 'list'">Browse all schedules and add new entries below.</template>
            <template v-else-if="!addMode">Choose a context before adding schedule entries</template>
            <template v-else-if="addMode === 'teacher'">{{ selectedTeacher ? 'Click cells to add or edit entries' : 'Select a teacher to assign schedules' }}</template>
            <template v-else-if="addMode === 'room'">{{ contextRoom ? 'Click empty slots to add entries for this room' : contextFloor ? 'Select a room' : 'Choose a floor first' }}</template>
          </p>
        </div>
        <div class="header-right">
          <div v-if="selectedTermLabel" class="term-banner">
            <span>Viewing: {{ selectedTermLabel }}</span>
          </div>
        </div>
        <div v-if="scheduleViewMode === 'list' || ((addMode === 'teacher' && selectedTeacher) || (addMode === 'room' && contextRoom))" class="header-actions">
          <div class="view-toggle">
            <button type="button" class="view-btn" :class="{ active: scheduleViewMode === 'timetable' }" @click="scheduleViewMode = 'timetable'">Time table View</button>
            <button type="button" class="view-btn" :class="{ active: scheduleViewMode === 'list' }" @click="scheduleViewMode = 'list'">Listed View</button>
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


      <div v-else-if="scheduleViewMode === 'list'" class="schedule-card">
        <!-- Card Top Bar -->
        <div class="sched-topbar">
          <div class="sched-topbar-left">
            <h2 class="sched-grid-title">All Schedules</h2>
            <p class="sched-grid-sub teacher-selected">Browse all schedules currently in the system.</p>
          </div>
          <div class="sched-topbar-right">
            <button class="new-sched-btn" @click="openAddPanel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Schedule
            </button>
          </div>
        </div>
        <div class="schedule-list-wrap">
          <div class="schedule-list-meta">
            <span>{{ visibleScheduleEntries.length }} entries found</span>
            <span class="schedule-list-note">Click a row to edit the selected schedule.</span>
          </div>
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
                  <td>{{ entry.day }}</td>
                  <td>{{ entry.timeIn }} – {{ entry.timeOut }}</td>
                  <td>{{ entry.year }}</td>
                  <td>{{ entry.subject }}</td>
                  <td>{{ entry.teacher }}</td>
                  <td>{{ entry.room }}</td>
                  <td>{{ entry.section }}</td>
                  <td>{{ entry.campus }}</td>
                </tr>
                <tr class="schedule-input-row">
                  <td>
                    <select v-model="listAddForm.day" class="form-select">
                      <option value="" disabled>Select Day</option>
                      <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="time-inputs">
                      <select v-model="listAddForm.timeIn" class="form-select small">
                        <option value="" disabled>Start</option>
                        <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                      </select>
                      <span class="time-separator">–</span>
                      <select v-model="listAddForm.timeOut" class="form-select small">
                        <option value="" disabled>End</option>
                        <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                      </select>
                    </div>
                  </td>
                  <td>
                        <select v-model="listAddForm.year" class="form-select small">
                      <option value="" disabled>Year</option>
                      <option v-for="y in effectiveYears" :key="y" :value="y">{{ y }}</option>
                    </select>
                  </td>
                      <td>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <select v-if="listAddForm.year === '3rd Year' || listAddForm.year === '4th Year'" v-model="listAddForm.major" class="form-select small">
                            <option value="" disabled>Major</option>
                            <option v-for="m in majorOptions" :key="m" :value="m">{{ m || 'None' }}</option>
                          </select>
                          <select v-model="listAddForm.subject" class="form-select">
                            <option value="" disabled>Select Subject</option>
                            <option v-for="s in listSubjectOptions" :key="s" :value="s">{{ s }}</option>
                          </select>
                        </div>
                      </td>
                  <td>
                    <select v-model="listAddForm.teacher" class="form-select">
                      <option value="" disabled>Select Teacher</option>
                      <option v-for="t in teacherOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="room-type-stack">
                      <select v-model="listAddForm.room" class="form-select">
                        <option value="" disabled>Select Room</option>
                        <option v-for="r in effectiveRoomOptions" :key="r.name" :value="r.name">{{ r.label }}</option>
                      </select>
                      <select v-model="listAddForm.roomType" class="form-select">
                        <option value="Lecture">Lecture</option>
                        <option value="Comlab/Laboratory">Comlab/Laboratory</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <select v-model="listAddForm.section" class="form-select">
                      <option value="" disabled>Select Section</option>
                      <option v-for="s in getSectionsForYear(listAddForm.year)" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="inline-campus-row">
                      <button type="button" class="campus-btn small" :class="{ active: listAddForm.campus === 'South Campus' }" @click="listAddForm.campus = 'South Campus'">South</button>
                      <button type="button" class="campus-btn small" :class="{ active: listAddForm.campus === 'Main Campus' }" @click="listAddForm.campus = 'Main Campus'">Main</button>
                      <button type="button" class="save-btn save-inline-btn" @click="addListEntry" :disabled="!listAddFormValid">Add</button>
                    </div>
                    <div v-if="listTimeError" class="time-error table-time-error">{{ listTimeError }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Schedule Card (teacher mode: teacher selected / room mode: room selected) -->
      <div v-else-if="scheduleViewMode === 'timetable' && ((addMode === 'teacher' && selectedTeacher) || (addMode === 'room' && contextRoom))" class="schedule-card">
        <div class="sched-topbar">
          <div class="sched-topbar-left">
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
            <p class="sched-grid-sub teacher-selected">
              {{ addMode === 'teacher' ? `Schedule for Prof. ${selectedTeacher}` : `Schedules assigned to Room ${contextRoom}` }}
            </p>
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
                <td class="td-time">{{ slot }}</td>
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
                      >
                        <div class="entry-teacher">Consultation</div>
                        <div class="entry-subject" style="font-size:0.72rem;opacity:0.9">{{ getConsultationForCell30(slot, day).startTime }} – {{ getConsultationForCell30(slot, day).endTime }}</div>
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
                <td class="td-time">{{ slot }}</td>
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
        <div class="sched-modal-box">
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
          </div>

          <div class="sched-form">
            <div class="form-row-inline" :class="{ 'schedule-for-row': selectedTeacher && !editMode }">
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
            <div class="form-row-inline">
              <label class="form-label">Start of Class</label>
              <div class="form-select-wrap">
                <select v-model="form.timeIn" class="form-select">
                  <option value="" disabled>Select Start of Class</option>
                  <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline">
              <label class="form-label">End of Class</label>
              <div class="form-select-wrap">
                <select v-model="form.timeOut" class="form-select">
                  <option value="" disabled>Select End of Class</option>
                  <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="form-row-inline">
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
            <div class="form-row-inline" v-if="!form.parallel">
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
            <div class="form-row-inline">
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
              <div class="form-row-inline">
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
              <div class="form-row-inline">
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
            <div class="form-row-inline">
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
              Add Lunch Break
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
            <div>
              <h2 id="lunch-break-picker-title">{{ lunchBreakContext.editing ? 'Edit Lunch Break' : 'Set Lunch Break' }}</h2>
              <p>{{ lunchBreakContext.day }} &bull; Select the lunch time.</p>
            </div>
          </div>

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
                <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
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
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
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
            <div>
              <div class="sched-modal-mode-badge badge-add">Consultation Hours</div>
              <h2 class="sched-modal-title">Prof. {{ selectedTeacher }}</h2>
              <p class="sched-modal-sub">
                <span :class="consultWeeklyMins >= 240 ? 'limit-warning' : 'limit-ok'">
                  {{ consultWeeklyMins }} / 240 min used this week
                </span>
              </p>
            </div>
            <button class="panel-close" @click="showConsultModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div v-if="consultationSlots.length" class="consult-slots-list">
            <div v-for="cslot in consultationSlots" :key="cslot.id" class="consult-slot-item">
              <div class="consult-slot-day">{{ cslot.dayOfWeek }}</div>
              <div class="consult-slot-time">{{ cslot.startTime }} – {{ cslot.endTime }}</div>
              <div class="consult-slot-dur">{{ cslot.durationMinutes }} min</div>
              <div class="consult-slot-actions">
                <button class="consult-edit-btn" @click="editConsultSlot(cslot)">Edit</button>
                <button class="consult-del-btn" @click="deleteConsultSlot(cslot.id)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="consult-empty">No consultation slots set for this teacher.</div>
          <div class="sched-form" style="border-top:1px solid #eee;padding-top:12px;margin-top:4px;">
            <div class="consult-form-title">{{ consultEditId ? 'Edit Slot' : 'Add New Slot' }}</div>
            <div class="form-row-inline">
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
                  <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

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
const addMode    = ref(null)    // null | 'teacher' | 'room'
const contextFloor = ref(null)
const contextRoom  = ref(null)

const addFloors = [
  { label: '2nd Floor', number: '2', rooms: ['201', '202', '204', '205', '208', '209'] },
  { label: '3rd Floor', number: '3', rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309'] },
  { label: '4th Floor', number: '4', rooms: ['401', '402', '403', '404', '405', '406 (Comlab 1)', '407 (Comlab 2)', '408 (Comlab 3)', '409 (Comlab 4)'] },
]
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
const selectedTeacher  = ref('')
const yearDropdown      = ref('All')
const scheduleViewMode  = ref('')

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
const listAddFormValid = computed(() =>
  listAddForm.day && listAddForm.timeIn && listAddForm.timeOut &&
  listAddForm.year && listAddForm.teacher && listAddForm.subject && listAddForm.room &&
  !listTimeError.value
)

watch([() => listAddForm.timeIn, () => listAddForm.timeOut], () => {
  if (listAddForm.timeIn && listAddForm.timeOut) {
    listTimeError.value = parseTime(listAddForm.timeOut) <= parseTime(listAddForm.timeIn)
      ? 'End of Class must be after Start of Class' : ''
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

const ROW_HEIGHT_30 = 40
function entryStyle30(rowSlot, entry) {
  if (!entry?.timeIn || !entry?.timeOut) return {}
  const rowStart   = parseTime(rowSlot)
  const entryStart = parseTime(entry.timeIn)
  const mins       = Math.max(1, parseTime(entry.timeOut) - entryStart)
  const offsetMins = entryStart - rowStart
  return {
    top:    (offsetMins / 30) * ROW_HEIGHT_30 + 3 + 'px',
    height: Math.max(24, (mins / 30) * ROW_HEIGHT_30 - 6) + 'px',
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
  const offsetMins   = consultStart - rowStart
  return {
    top:    (offsetMins / 30) * ROW_HEIGHT_30 + 3 + 'px',
    height: Math.max(24, (mins / 30) * ROW_HEIGHT_30 - 6) + 'px',
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

function buildSlots(count) {
  return Array.from({ length: count }, () => ({ section: '', room: '', roomType: 'Lecture' }))
}

watch([() => form.timeIn, () => form.timeOut], () => {
  if (form.timeIn && form.timeOut) {
    modalTimeError.value = parseTime(form.timeOut) <= parseTime(form.timeIn)
      ? 'End of Class must be after Start of Class' : ''
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
    addTimeError.value = parseTime(addForm.timeOut) <= parseTime(addForm.timeIn)
      ? 'End of Class must be after Start of Class' : ''
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
    consultTimeError.value = parseTime(consultForm.endTime) <= parseTime(consultForm.startTime)
      ? 'End time must be after start time' : ''
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
    'color-green': { bg: '#b7ddc3', fg: '#214d30' }, 'color-yellow': { bg: '#efd77c', fg: '#5d4700' },
    'color-orange': { bg: '#efd77c', fg: '#5d4700' }, 'color-blue': { bg: '#b6d8f5', fg: '#1d527d' },
    'color-gray': { bg: '#cdd3d6', fg: '#4e575d' },
    'color-purple': { bg: '#d8c3ef', fg: '#5b417c' }, 'color-red': { bg: '#e63946', fg: '#ffffff' },
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
        const inner = matched.map(e => `<div class="entry-block"><span class="e-time">${esc(e.timeIn)} – ${esc(e.timeOut)}</span><span class="e-section">${esc(e.section)}</span><span class="e-teacher">${esc(e.teacher)}</span><span class="e-subject">${esc(e.subject)}</span><span class="e-room">${esc(e.room)}</span></div>`).join('<hr class="entry-sep">')
        const clr = colorMap[matched[0].color] || { bg: '#eef1fb', fg: '#1a1a2e' }
        bodyHTML += `<td class="entry-cell" rowspan="${rs}" style="background:${clr.bg};color:${clr.fg}">${inner}</td>`
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
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:11px;color:#1a1a2e;}h2{font-size:15px;font-weight:700;margin-bottom:3px;}.sub{font-size:10px;color:#666;margin-bottom:12px;}table{width:100%;border-collapse:collapse;table-layout:fixed;}th{background:#1a1a2e;color:#fff;padding:7px 6px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.04em;border:1px solid #0d0d1e;}th.time-hdr{width:72px;}td{border:1px solid #dde;vertical-align:top;padding:0;}td.time-col{background:#f0f2fa;font-size:10px;font-weight:600;color:#444;text-align:center;padding:5px 3px;width:72px;}td.empty-cell{background:#fafbff;}td.entry-cell{background:#eef1fb;padding:4px 5px;vertical-align:top;}.entry-block{padding:2px 0;}.entry-sep{border:none;border-top:1px dashed #c5cadf;margin:3px 0;}td.entry-cell span{display:block;line-height:1.45;}.e-time{font-size:9px;color:#888;margin-bottom:2px;}.e-section{font-weight:700;font-size:10px;color:#1a1a2e;}.e-teacher{font-size:10px;color:#333;}.e-subject{font-size:9.5px;color:#555;font-style:italic;}.e-room{font-size:9.5px;color:#777;}</style>
<style>body,td,th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.entry-cell span{color:#fff!important;opacity:1!important;}.consultation-cell{background:#4a90d9!important;color:#fff!important;}</style>
</head><body>
<h2>Teacher Schedule${selectedTeacher.value ? ' — Prof. ' + esc(selectedTeacher.value) : ''}</h2>
<p class="sub">Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
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
.color-gray   { background: #9ca3af; color: #1f2937; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }
.consult-entry { cursor: default; pointer-events: none; }
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
</style>

<style>
.swal-cit-popup { font-family: 'Poppins', sans-serif !important; border-radius: 18px !important; padding: 32px 28px 24px !important; box-shadow: 0 12px 48px rgba(0,0,0,0.18) !important; }
.swal-cit-title { font-family: 'Poppins', sans-serif !important; font-size: 1.15rem !important; font-weight: 700 !important; color: #1a1a2e !important; margin-bottom: 8px !important; }
.swal-cit-btn { font-family: 'Poppins', sans-serif !important; font-size: 0.9rem !important; font-weight: 600 !important; border-radius: 10px !important; padding: 9px 28px !important; letter-spacing: 0.02em !important; }
</style>
