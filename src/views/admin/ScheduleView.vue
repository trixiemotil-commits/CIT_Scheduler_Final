<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
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
      <!-- Page Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Schedule Management</h1>
          <p class="page-sub">View and manage teacher plotting schedule</p>
        </div>
      </header>

      <!-- Schedule Card -->
      <div class="schedule-card">
        <!-- Card Top Bar -->
        <div class="sched-topbar">
          <div class="sched-topbar-left">
            <h2 class="sched-grid-title">Teacher Schedule Grid</h2>
            <p class="sched-grid-sub" :class="{ 'teacher-selected': !!selectedTeacher }" style="margin:4px 0 0">{{ selectedTeacher ? `Showing schedule for Prof. ${selectedTeacher}` : 'Select a teacher from the dropdown to view their schedule' }}</p>
          </div>
          <div class="sched-topbar-right">
            <!-- Year filter selector -->
            <div class="sched-select-wrap">
              <select class="sched-select" :value="yearDropdown" @change="jumpToYear($event.target.value)">
                <option value="All">All Years</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Section filter selector -->
            <div class="sched-select-wrap">
              <select class="sched-select" v-model="filterSection">
                <option value="All">All Sections</option>
                <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Teacher filter selector -->
            <div class="sched-select-wrap teacher-select-wrap">
              <select class="sched-select teacher-select" v-model="selectedTeacher">
                <option value="">-- All Teachers --</option>
                <option v-for="t in scheduledTeachers" :key="t" :value="t">Prof. {{ t }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Print -->
            <button class="icon-btn" title="Print" @click="printSchedule">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pagination: year filter chips -->
        <div class="sched-pagination">
          <span
            v-for="y in ['All', ...years]"
            :key="y"
            class="page-dot"
            :class="{ active: yearDropdown === y }"
            @click="jumpToYear(y)"
          >{{ y }}</span>
        </div>

        <!-- Grid -->
        <div class="sched-grid-wrap">
          <table class="sched-grid">
            <thead>
              <tr>
                <th class="th-time">Time</th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot" class="time-row">
                <td class="td-time">{{ slot }}</td>
                <template v-for="day in days" :key="day">
                  <td
                    v-if="!isSpannedCell(slot, day)"
                    :rowspan="getEntriesForCell(slot, day).length ? getRowspan(getEntriesForCell(slot, day)[0]) : 1"
                    class="td-cell"
                    :class="{ 'has-entry': getEntriesForCell(slot, day).length }"
                    @click="handleCellClick(slot, day)"
                  >
                    <!-- Filled cell: ONE box, all sections inside -->
                    <template v-if="getEntriesForCell(slot, day).length">
                      <div
                        class="sched-entry"
                        :class="getEntriesForCell(slot, day)[0].color"
                        :style="entryStyle(slot, getEntriesForCell(slot, day)[0])"
                      >
                        <div class="entry-teacher">{{ getEntriesForCell(slot, day)[0].teacher }}</div>
                        <div class="entry-subject">{{ getEntriesForCell(slot, day)[0].subject }}</div>
                        <div class="entry-time-range">{{ getEntriesForCell(slot, day)[0].slot }}</div>
                        <!-- Section rows (one per section) -->
                        <div class="entry-section-rows">
                          <div
                            v-for="e in getEntriesForCell(slot, day)"
                            :key="e._key"
                            class="entry-section-row"
                          >
                            <span class="entry-section-badge">{{ e.section }}</span>
                            <span class="entry-room">{{ e.room }}</span>
                          </div>
                        </div>
                        <div v-if="getEntriesForCell(slot, day)[0].addedAt" class="entry-timestamp">Added: {{ getEntriesForCell(slot, day)[0].addedAt }}</div>
                        <div class="entry-edit-hint">Click to edit</div>
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
      </div>
    </main>



    <!-- ═══ Add / Edit Schedule Modal ═══ -->
    <Teleport to="body">
      <div v-if="showSchedModal" class="modal-overlay" @click.self="showSchedModal = false">
        <div class="sched-modal-box">
          <!-- Title -->
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
            <!-- Day (only when opened from New Schedule button) -->
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
            <!-- Time In / Time Out (always shown) -->
            <div class="form-row-inline">
                <label class="form-label">Time In</label>
                <div class="form-select-wrap">
                  <select v-model="form.timeIn" class="form-select">
                    <option value="" disabled>Select Time In</option>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-row-inline">
                <label class="form-label">Time Out</label>
                <div class="form-select-wrap">
                  <select v-model="form.timeOut" class="form-select">
                    <option value="" disabled>Select Time Out</option>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            <!-- Teacher (locked if selected from topbar, dropdown otherwise) -->
            <div class="form-row-inline">
              <label class="form-label">Teacher</label>
              <div v-if="selectedTeacher" class="form-value-locked">Prof. {{ selectedTeacher }}</div>
              <div v-else class="form-select-wrap">
                <select v-model="form.teacher" class="form-select">
                  <option value="" disabled>Select Teacher</option>
                  <option v-for="t in teacherOptions" :key="t" :value="t">Prof. {{ t }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <!-- Year -->
            <div class="form-row-inline">
              <label class="form-label">Year</label>
              <div class="form-select-wrap">
                <select v-model="form.year" class="form-select">
                  <option value="" disabled>Select Year</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <!-- Section (only when not parallel; parallel uses per-slot sections) -->
            <div class="form-row-inline" v-if="!form.parallel">
              <label class="form-label">Section</label>
              <div class="form-select-wrap">
                <select v-model="form.section" class="form-select">
                  <option value="" disabled>Select Section</option>
                  <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <!-- Subject -->
            <div class="form-row-inline">
              <label class="form-label">Subject</label>
              <div class="form-select-wrap">
                <select v-model="form.subject" class="form-select">
                  <option value="" disabled>Select Subject</option>
                  <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
                </select>
                <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <!-- Room (Not Parallel) -->
            <template v-if="!form.parallel">
              <div class="form-row-inline">
                <label class="form-label">Room</label>
                <div class="form-select-wrap">
                  <select v-model="form.room" class="form-select">
                    <option value="" disabled>Select Room</option>
                    <option v-for="r in roomOptions" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </template>

            <!-- Parallel: How many sections → generates N Section+Room pairs -->
            <template v-else>
              <!-- Step 1: how many sections -->
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
              <!-- Step 2: one Section + Room pair per slot -->
              <template v-for="(ps, i) in form.parallelSlots" :key="i">
                <div class="parallel-slot-divider">Slot {{ i + 1 }}</div>
                <div class="form-row-inline">
                  <label class="form-label">Section {{ i + 1 }}</label>
                  <div class="form-select-wrap">
                    <select v-model="ps.section" class="form-select">
                      <option value="" disabled>Select Section</option>
                      <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div class="form-row-inline">
                  <label class="form-label">Room {{ i + 1 }}</label>
                  <div class="form-select-wrap">
                    <select v-model="ps.room" class="form-select">
                      <option value="" disabled>Select Room</option>
                      <option v-for="r in roomOptions" :key="r" :value="r">{{ r }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </template>
            </template>

            <!-- Parallel toggle -->
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

    <!-- ═══ Add Schedule Panel ═══ -->
    <Teleport to="body">
      <transition name="panel">
        <div v-if="showAddPanel" class="panel-overlay" @click.self="showAddPanel = false">
          <div class="add-panel">
            <!-- Panel Header -->
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
              <!-- Day -->
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
              <!-- Time In -->
              <div class="form-row-inline">
                <label class="form-label">Time In</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.timeIn" class="form-select">
                    <option value="" disabled>Select Time In</option>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Time Out -->
              <div class="form-row-inline">
                <label class="form-label">Time Out</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.timeOut" class="form-select">
                    <option value="" disabled>Select Time Out</option>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Teacher (locked if selected from topbar, dropdown otherwise) -->
              <div class="form-row-inline">
                <label class="form-label">Teacher</label>
                <div v-if="selectedTeacher" class="form-value-locked">Prof. {{ selectedTeacher }}</div>
                <div v-else class="form-select-wrap">
                  <select v-model="addForm.teacher" class="form-select">
                    <option value="" disabled>Select Teacher</option>
                    <option v-for="t in teacherOptions" :key="t" :value="t">Prof. {{ t }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Year -->
              <div class="form-row-inline">
                <label class="form-label">Year</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.year" class="form-select">
                    <option value="" disabled>Select Year</option>
                    <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Parallel toggle -->
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
              <!-- Section (not parallel) -->
              <div class="form-row-inline" v-if="!addForm.parallel">
                <label class="form-label">Section</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.section" class="form-select">
                    <option value="" disabled>Select Section</option>
                    <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Subject -->
              <div class="form-row-inline">
                <label class="form-label">Subject</label>
                <div class="form-select-wrap">
                  <select v-model="addForm.subject" class="form-select">
                    <option value="" disabled>Select Subject</option>
                    <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <!-- Room (not parallel) -->
              <template v-if="!addForm.parallel">
                <div class="form-row-inline">
                  <label class="form-label">Room</label>
                  <div class="form-select-wrap">
                    <select v-model="addForm.room" class="form-select">
                      <option value="" disabled>Select Room</option>
                      <option v-for="r in roomOptions" :key="r" :value="r">{{ r }}</option>
                    </select>
                    <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </template>
              <!-- Parallel section+room pairs -->
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
                    <div class="form-select-wrap">
                      <select v-model="ps.section" class="form-select">
                        <option value="" disabled>Select Section</option>
                        <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
                      </select>
                      <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  <div class="form-row-inline">
                    <label class="form-label">Room {{ i + 1 }}</label>
                    <div class="form-select-wrap">
                      <select v-model="ps.room" class="form-select">
                        <option value="" disabled>Select Room</option>
                        <option v-for="r in roomOptions" :key="r" :value="r">{{ r }}</option>
                      </select>
                      <svg class="sel-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                </template>
              </template>
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

            <!-- Sticky footer -->
            <div class="panel-footer">
              <button class="reset-btn" @click="resetAddForm">Reset</button>
              <button
                class="save-btn"
                @click="addEntry"
                :disabled="!addFormValid"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      </transition>
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
import { getToken, logout } from '@/auth.js'
import {
  colorForRoom,
  days,
  entries,
  getRowspan, parseTime,
  roomOptions,
  sections,
  subjectOptions,
  teacherOptions,
  timeOptions,
  timeSlots,
  years,
} from '@/composables/useSchedule.js'
import Swal from 'sweetalert2'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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

    const error = new Error(body.message || 'Request failed.')
    error.status = response.status
    error.code = body.code
    throw error
  }

  return body
}

/* ── Nav ── */
const navItems = [
  { name: 'Dashboard',    to: '/admin/dashboard', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { name: 'Schedule',     to: '/admin/schedule',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { name: 'Teachers',     to: '/admin/teachers',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events',       to: '/admin/events',    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Manage Users', to: '/admin/users',     icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { name: 'Settings',     to: '/admin/settings',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

/* ── Filters ── */

/* ── Pagination — one page per teacher ── */
const currentPage = ref(0)
const pages = ref([
  { label: 'All', section: 'All' },
])
// filterYear = current page LABEL (teacher name, or 'All')
const filterYear = ref('All')
// yearDropdown = secondary year filter for the grid
const yearDropdown = ref('All')
watch(currentPage, (i) => {
  filterYear.value = pages.value[i]?.label ?? filterYear.value
})
const filterSection = ref('All')
const selectedTeacher = ref('')
watch(selectedTeacher, (teacher) => { jumpToTeacher(teacher) })

// Only teachers who have at least one schedule entry (derived directly from entries)
const scheduledTeachers = computed(() =>
  [...new Set(Object.values(entries).map(e => e.teacher).filter(Boolean))].sort()
)
function prevPage() { if (currentPage.value > 0) currentPage.value-- }
function nextPage() { if (currentPage.value < pages.value.length - 1) currentPage.value++ }
// Year dropdown just filters the grid — no page navigation
function jumpToYear(year) {
  yearDropdown.value = year
}
// Teacher dropdown is a pure grid filter — no page navigation required
function jumpToTeacher(_teacher) {
  // selectedTeacher reactive ref drives getEntriesForCell directly
}
// Show all teacher pages
const filteredPages = computed(() =>
  pages.value.map((pg, i) => ({ ...pg, realIndex: i }))
)



function resetEntriesStore() {
  Object.keys(entries).forEach((key) => {
    delete entries[key]
  })
}

function formatAddedAt(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return (
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

function syncPagesFromApi(apiTables, preferredLabel = '') {
  const sorted = Array.isArray(apiTables)
    ? apiTables
        .map((table) => ({ label: table.label, section: 'All' }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : []

  pages.value = [{ label: 'All', section: 'All' }, ...sorted]

  let nextIndex = 0
  if (preferredLabel) {
    const preferredIndex = pages.value.findIndex((p) => p.label === preferredLabel)
    if (preferredIndex >= 0) nextIndex = preferredIndex
  } else {
    const previousIndex = pages.value.findIndex((p) => p.label === filterYear.value)
    if (previousIndex >= 0) nextIndex = previousIndex
  }

  currentPage.value = nextIndex
}

function syncEntriesFromApi(apiEntries) {
  resetEntriesStore()

  if (!Array.isArray(apiEntries)) {
    return
  }

  apiEntries.forEach((entry) => {
    const tableLabel = entry.tableLabel || entry.teacher
    const section = entry.section
    const day = entry.day
    const slot = `${entry.timeIn} - ${entry.timeOut}`

    if (!tableLabel || !section || !day || !entry.timeIn || !entry.timeOut) {
      return
    }

    const key = `${tableLabel}|${section}|${slot}|${day}`

    entries[key] = {
      teacher: entry.teacher,
      subject: entry.subject,
      room: entry.room,
      year: entry.year,
      tableLabel,
      section,
      day,
      slot,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      parallel: Boolean(entry.parallel),
      parallelGroupId: entry.parallelGroupId || null,
      parallelCount: entry.parallelCount || 1,
      parallelSlots: Array.isArray(entry.parallelSlots) ? entry.parallelSlots.map((slotItem) => ({ ...slotItem })) : [],
      color: entry.color || colorForRoom(entry.room) || 'color-green',
      addedAt: formatAddedAt(entry.addedAt),
    }
  })
}

function resolveBaseYear(tableLabel) {
  return pages.value.find((table) => table.label === tableLabel)?.year || years[0]
}

function buildSchedulePayload(source) {
  const payload = {
    tableLabel: source.teacher,
    baseYear: source.year,
    day: source.day,
    timeIn: source.timeIn,
    timeOut: source.timeOut,
    teacher: source.teacher,
    subject: source.subject,
    parallel: Boolean(source.parallel),
    parallelCount: source.parallel ? source.parallelCount : 1,
  }

  if (source.parallel) {
    payload.parallelSlots = source.parallelSlots.map((slot) => ({
      section: slot.section,
      room: slot.room,
    }))
  } else {
    payload.section = source.section
    payload.room = source.room
  }

  return payload
}

function setVisibleSection(source) {
  if (source.parallel) {
    const firstSection = source.parallelSlots.find((slot) => slot.section)?.section
    if (firstSection) {
      filterSection.value = firstSection
    }
    return
  }

  if (source.section) {
    filterSection.value = source.section
  }
}

function buildOldDescriptor() {
  const oldTableLabel = form._oldTableLabel || form.teacher

  if (form._parallelGroupId) {
    return {
      tableLabel: oldTableLabel,
      parallelGroupId: form._parallelGroupId,
    }
  }

  const [oldTimeIn = '', oldTimeOut = ''] = (form._oldSlot || '').split(' - ')

  return {
    tableLabel: oldTableLabel,
    section: form._oldSection,
    day: form._oldDay,
    timeIn: oldTimeIn,
    timeOut: oldTimeOut,
  }
}

async function refreshScheduleData(preferredLabel = '') {
  const [tablesPayload, schedulesPayload] = await Promise.all([
    apiRequest('/schedules/tables'),
    apiRequest('/schedules'),
  ])

  syncPagesFromApi(tablesPayload.tables, preferredLabel)
  syncEntriesFromApi(schedulesPayload.entries)
}

async function showScheduleError(error, fallbackTitle = 'Unable to save schedule') {
  const isConflict = error?.status === 409

  await Swal.fire({
    icon: isConflict ? 'error' : 'warning',
    title: isConflict ? 'Schedule Conflict' : fallbackTitle,
    html: `<span style="font-size:0.95rem;color:#444">${error?.message || 'Something went wrong. Please try again.'}</span>`,
    confirmButtonText: 'Got it',
    confirmButtonColor: isConflict ? '#e63946' : '#1b4332',
    background: '#fff',
    customClass: {
      popup: 'swal-cit-popup',
      title: 'swal-cit-title',
      confirmButton: 'swal-cit-btn',
    },
  })
}

// ── Get entries for a specific cell ──
// Entries sharing the same parallelGroupId are returned so they render in one box.
function getEntriesForCell(rowHour, day) {
  const rowStart = parseTime(rowHour)
  const rowEnd   = rowStart + 60

  // Filter by selected teacher, year, section
  const sectionMatch = Object.entries(entries).find(([k, v]) => {
    const parts = k.split('|')
    if (parts.length < 4) return false
    if (selectedTeacher.value && v.teacher !== selectedTeacher.value) return false
    if (yearDropdown.value !== 'All' && v.year !== yearDropdown.value) return false
    if (filterSection.value !== 'All' && parts[1] !== filterSection.value) return false
    if (parts[3] !== day) return false
    const t = parseTime(v.timeIn)
    return t >= rowStart && t < rowEnd
  })

  if (!sectionMatch) return []

  const [, matchedEntry] = sectionMatch

  // If parallel, pull ALL entries with the same parallelGroupId for this year+day
  if (matchedEntry.parallel && matchedEntry.parallelGroupId) {
    return Object.entries(entries)
      .filter(([k, v]) => {
        const parts = k.split('|')
        if (parts.length < 4) return false
        if (selectedTeacher.value && v.teacher !== selectedTeacher.value) return false
        if (yearDropdown.value !== 'All' && v.year !== yearDropdown.value) return false
        if (filterSection.value !== 'All' && parts[1] !== filterSection.value) return false
        if (parts[3] !== day) return false
        if (v.parallelGroupId !== matchedEntry.parallelGroupId) return false
        const t = parseTime(v.timeIn)
        return t >= rowStart && t < rowEnd
      })
      .map(([k, v]) => ({ ...v, _key: k }))
  }

  // Not parallel — just return the single section entry
  return [{ ...matchedEntry, _key: sectionMatch[0] }]
}

/* Exact pixel height for the entry card; top offset for :30 starts (70 px = 1 hour row) */
const ROW_HEIGHT = 70
function entryStyle(rowHour, entry) {
  if (!entry?.timeIn || !entry?.timeOut) return {}
  const rowStart   = parseTime(rowHour)
  const entryStart = parseTime(entry.timeIn)
  const mins       = Math.max(1, parseTime(entry.timeOut) - entryStart)
  const offsetMins = entryStart - rowStart
  return {
    top:    (offsetMins / 60) * ROW_HEIGHT + 3 + 'px',
    height: Math.max(24, (mins / 60) * ROW_HEIGHT - 6) + 'px',
  }
}

// Returns true if a prior row's entry already spans into this slot
function isSpannedCell(slot, day) {
  const slotIndex = timeSlots.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForCell(timeSlots[i], day)
    if (prev.length > 0 && i + getRowspan(prev[0]) > slotIndex) return true
  }
  return false
}

/* ── Modal state ── */
const showSchedModal = ref(false)
const editMode = ref(false)
const fromButton = ref(false)

const form = reactive({
  slot: '', day: '', teacher: '', subject: '',
  year: '', section: '',
  room: '', parallel: false,
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

function buildSlots(count) {
  return Array.from({ length: count }, () => ({ section: '', room: '' }))
}

// Watch for time validation in modal
watch([() => form.timeIn, () => form.timeOut], () => {
  if (form.timeIn && form.timeOut) {
    modalTimeError.value = parseTime(form.timeOut) <= parseTime(form.timeIn)
      ? 'Time Out must be after Time In' : ''
  } else {
    modalTimeError.value = ''
  }
})

// Resize parallelSlots when count changes
watch(() => form.parallelCount, (val) => {
  while (form.parallelSlots.length < val)  form.parallelSlots.push({ section: '', room: '' })
  while (form.parallelSlots.length > val)  form.parallelSlots.pop()
})

// Auto-color (not parallel): Cl.* = green, Room * = yellow
watch(() => form.room, (val) => {
  const auto = colorForRoom(val)
  if (auto) form.color = auto
})

async function handleCellClick(slot, day) {
  const cell = getEntriesForCell(slot, day)
  if (cell.length > 0) {
    openEditModal(slot, day, cell[0])
  } else {
    if (!selectedTeacher.value) {
      await Swal.fire({
        icon: 'info', title: 'No Teacher Selected',
        text: 'Please select a teacher from the dropdown first.',
        confirmButtonText: 'OK', confirmButtonColor: '#1b4332', background: '#fff',
        customClass: { popup: 'swal-cit-popup', title: 'swal-cit-title', confirmButton: 'swal-cit-btn' },
      })
      return
    }
    openAddModal(slot, day)
  }
}

function openAddModal(slot, day) {
  yearDropdown.value     = 'All'
  filterSection.value    = 'All'
  editMode.value         = false
  fromButton.value       = (slot === null && day === null)
  form.day               = day  ?? ''
  form.timeIn            = slot ?? ''
  form.timeOut           = ''
  form.slot              = ''
  form._oldSlot          = ''
  form._oldYear          = ''
  form._oldSection       = ''
  form._oldDay           = ''
  form.year              = ''
  form.section           = (filterSection.value !== 'All' ? filterSection.value : '') || ''
  form.teacher           = selectedTeacher.value || ''
  form.subject           = ''
  form.room              = ''
  form.parallel          = false
  form.parallelCount     = 2
  form._parallelGroupId  = null
  form._oldTableLabel    = ''
  form.addedAt           = ''
  form.parallelSlots.splice(0, form.parallelSlots.length, ...buildSlots(2))
  form.color             = 'color-green'
  modalTimeError.value   = ''
  showSchedModal.value   = true
}

function openEditModal(slot, day, e) {
  yearDropdown.value     = 'All'
  filterSection.value    = 'All'
  editMode.value         = true
  fromButton.value       = false
  form.slot              = slot
  form.day               = day
  form.year              = e.year ?? ''
  form.section           = e.section ?? sections[0]
  form.teacher           = selectedTeacher.value || e.teacher
  form.subject           = e.subject
  form.room              = e.room ?? ''
  form.parallel          = e.parallel ?? false
  form.parallelCount     = e.parallelCount ?? 2
  form.color             = e.color
  form._parallelGroupId  = e.parallelGroupId ?? null
  form.addedAt           = e.addedAt ?? ''
  const slotParts = (e.slot || '').split(' - ')
  form.timeIn            = slotParts[0] || ''
  form.timeOut           = slotParts[1] || ''
  form._oldSlot          = e.slot || ''
  form._oldYear          = e.year ?? years[0]
  form._oldTableLabel    = e.tableLabel ?? e.teacher ?? ''
  form._oldSection       = e.section ?? sections[0]
  form._oldDay           = day
  form.parallelSlots.splice(
    0, form.parallelSlots.length,
    ...(e.parallelSlots?.length ? e.parallelSlots.map(s => ({ ...s })) : buildSlots(form.parallelCount))
  )
  modalTimeError.value   = ''
  showSchedModal.value   = true
}

// skipFilter(key, entry) → true means skip this existing entry (e.g. the one being edited)
function checkScheduleConflict(payload, skipFilter = null) {
  const newTimeIn  = parseTime(payload.timeIn)
  const newTimeOut = parseTime(payload.timeOut)
  const conflicts  = []
  const seen       = new Set()

  // All rooms claimed by the new payload (covers parallel slots too)
  const newRooms = payload.parallel
    ? (payload.parallelSlots || []).map(s => s.room).filter(Boolean)
    : [payload.room].filter(Boolean)

  Object.entries(entries).forEach(([key, entry]) => {
    if (skipFilter && skipFilter(key, entry)) return

    const isSameDay     = entry.day === payload.day
    const isTimeOverlap = newTimeIn < parseTime(entry.timeOut) && newTimeOut > parseTime(entry.timeIn)
    if (!isSameDay || !isTimeOverlap) return

    // ── Teacher conflict: same teacher teaching at the same time on the same day ──
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

    // ── Room conflict: same room occupied at the same time on the same day ──
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
      <p style="font-size:0.83rem;color:#666;margin:0 0 12px;">The following conflicts were found. You can proceed anyway or go back to adjust.</p>
      <div style="max-height:260px;overflow-y:auto;padding-right:2px;">
        ${buildConflictHtml(conflicts)}
      </div>`,
    confirmButtonText: 'Proceed Anyway',
    cancelButtonText: 'Go Back',
    showCancelButton: true,
    confirmButtonColor: '#e63946',
    cancelButtonColor: '#6c757d',
    background: '#fff',
    customClass: {
      popup: 'swal-cit-popup',
      title: 'swal-cit-title',
    },
  })
}

async function saveEntry() {
  if (!form.teacher || !form.subject) return
  if (form.parallel && form.parallelSlots.every((slotItem) => !slotItem.section)) return

  try {
    const payload = buildSchedulePayload(form)

    // Build a skip filter so we don't flag the entry currently being edited
    const skipFilter = editMode.value
      ? (key, entry) => {
          // For parallel edits: skip all entries in the same parallel group
          if (form._parallelGroupId && entry.parallelGroupId === form._parallelGroupId) return true
          // For non-parallel edits: skip the specific entry by its key
          const [oldTimeIn = '', oldTimeOut = ''] = (form._oldSlot || '').split(' - ')
          const oldTableLabel = form._oldYear || form.year
          const expectedKey = `${oldTableLabel}|${form._oldSection}|${oldTimeIn} - ${oldTimeOut}|${form._oldDay}`
          return key === expectedKey
        }
      : null

    // Check for conflicts
    const conflicts = checkScheduleConflict(payload, skipFilter)
    if (conflicts.length > 0) {
      const result = await showConflictDialog(conflicts)
      if (!result.isConfirmed) return
      await proceedWithSave(payload)
      return
    }

    await proceedWithSave(payload)
  } catch (error) {
    await showScheduleError(error)
  }
}

async function proceedWithSave(payload) {
  try {
    if (editMode.value && form._oldDay) {
      payload.day = form._oldDay
    }

    if (editMode.value) {
      await apiRequest('/schedules/replace', {
        method: 'POST',
        body: JSON.stringify({
          old: buildOldDescriptor(),
          next: payload,
        }),
      })
    } else {
      await apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    setVisibleSection(form)
    await refreshScheduleData(form.teacher)
    yearDropdown.value   = 'All'
    filterSection.value  = 'All'
    showSchedModal.value = false
  } catch (error) {
    await showScheduleError(error)
  }
}

async function clearSlot() {
  try {
    await apiRequest('/schedules/delete', {
      method: 'POST',
      body: JSON.stringify({
        old: buildOldDescriptor(),
      }),
    })

    await refreshScheduleData(form._oldYear || form.year)
    yearDropdown.value   = 'All'
    filterSection.value  = 'All'
    showSchedModal.value = false
  } catch (error) {
    await showScheduleError(error, 'Unable to remove schedule')
  }
}

/* ── Add Schedule Panel ── */
const showAddPanel   = ref(false)
const addSavedCount  = ref(0)
const addShowFlash   = ref(false)
const addTimeError   = ref('')

const addForm = reactive({
  day: '', timeIn: '', timeOut: '',
  year: '', section: '',
  teacher: '', subject: '', room: '',
  parallel: false, parallelCount: 2,
  parallelSlots: [{ section: '', room: '' }, { section: '', room: '' }],
})

watch(() => addForm.parallelCount, (val) => {
  while (addForm.parallelSlots.length < val) addForm.parallelSlots.push({ section: '', room: '' })
  while (addForm.parallelSlots.length > val) addForm.parallelSlots.pop()
})

watch([() => addForm.timeIn, () => addForm.timeOut], () => {
  if (addForm.timeIn && addForm.timeOut) {
    addTimeError.value = parseTime(addForm.timeOut) <= parseTime(addForm.timeIn)
      ? 'Time Out must be after Time In'
      : ''
  } else {
    addTimeError.value = ''
  }
})

function openAddPanel() {
  addForm.year = ''
  addForm.day = ''; addForm.timeIn = ''; addForm.timeOut = ''
  addForm.section = ''
  addForm.teacher = selectedTeacher.value || ''
  addForm.parallel = false; addForm.parallelCount = 2
  addForm.parallelSlots.splice(0, addForm.parallelSlots.length,
    { section: '', room: '' }, { section: '', room: '' })
  addTimeError.value = ''
  addSavedCount.value = 0
  showAddPanel.value = true
}

function resetAddForm() {
  addForm.day = ''; addForm.timeIn = ''; addForm.timeOut = ''
  addForm.year = ''; addForm.section = ''
  addForm.teacher = selectedTeacher.value || ''; addForm.subject = ''; addForm.room = ''
  addForm.parallel = false; addForm.parallelCount = 2
  addForm.parallelSlots.splice(0, addForm.parallelSlots.length,
    { section: '', room: '' }, { section: '', room: '' })
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

    // Check for conflicts before saving
    const conflicts = checkScheduleConflict(payload)
    if (conflicts.length > 0) {
      const result = await showConflictDialog(conflicts)
      if (!result.isConfirmed) return
      // User acknowledged — save and silently swallow any server-side 409 (already confirmed)
      try {
        await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
      } catch (e) {
        if (e?.status !== 409) await showScheduleError(e)
        return
      }
    } else {
      await apiRequest('/schedules', { method: 'POST', body: JSON.stringify(payload) })
    }

    setVisibleSection(addForm)
    await refreshScheduleData(addForm.teacher)
    yearDropdown.value = 'All'
    filterSection.value = 'All'
    addSavedCount.value++
    const targetIdx = pages.value.findIndex(pg => pg.label === addForm.teacher)
    if (targetIdx >= 0) currentPage.value = targetIdx
    resetAddForm()
    addShowFlash.value = true
    setTimeout(() => { addShowFlash.value = false }, 2200)
  } catch (error) {
    await showScheduleError(error)
  }
}

onMounted(async () => {
  try {
    // Fetch teachers from database (role=teacher)
    const response = await apiRequest('/users?role=teacher')
    if (response.users && Array.isArray(response.users)) {
      const teachers = response.users
        .filter(user => user.role === 'Teacher') // Ensure only Teacher role
        .map(user => `${user.firstName} ${user.lastName}`.trim())
        .filter(name => name.length > 0)
      if (teachers.length > 0) {
        teacherOptions.value = teachers
        console.log('Loaded teachers:', teachers)
      }
    }
    
    await refreshScheduleData(filterYear.value)
  } catch (error) {
    await showScheduleError(error, 'Unable to load schedules')
  }
})

/* ── Print ── */
function printSchedule() {
  const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const SLOTS = [
    '7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM',
    '5:00 PM','6:00 PM','7:00 PM',
  ]

  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  // Convert "7:30 AM" → minutes since midnight
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

  // All entries for the current page — match by KEY prefix (same logic as getEntriesForCell)
  const pageEntries = Object.entries(entries)
    .filter(([k]) => k.split('|')[0] === filterYear.value)
    .map(([, v]) => v)

  // Find ALL entries whose timeIn falls within [slotMins[si], slotMins[si+1]) for a given day
  function entriesAt(si, day) {
    const from = slotMins[si]
    const to   = si + 1 < slotMins.length ? slotMins[si + 1] : from + 60
    return pageEntries.filter(v => {
      if (v.day !== day) return false
      const t = toMins(v.timeIn)
      return t >= from && t < to
    })
  }

  // How many SLOTS rows does this entry span?
  function rowspanFor(entry) {
    const startMins = toMins(entry.timeIn)
    const endMins   = toMins(entry.timeOut)
    const si = slotMins.findIndex((m, i) => {
      const next = i + 1 < slotMins.length ? slotMins[i + 1] : m + 60
      return startMins >= m && startMins < next
    })
    if (si < 0) return 1
    let span = 1
    for (let i = si + 1; i < SLOTS.length; i++) {
      if (slotMins[i] >= endMins) break
      span++
    }
    return Math.max(1, span)
  }

  // Build occupied map to skip cells already covered by a rowspan
  const occupied = Array.from({length: SLOTS.length}, () => Array(DAYS.length).fill(false))

  let bodyHTML = ''
  for (let si = 0; si < SLOTS.length; si++) {
    bodyHTML += '<tr>'
    bodyHTML += `<td class="time-col">${esc(SLOTS[si])}</td>`
    for (let di = 0; di < DAYS.length; di++) {
      if (occupied[si][di]) continue
      const matched = entriesAt(si, DAYS[di])
      if (matched.length > 0) {
        // Use the first entry's span (all entries in same slot share same approximate duration)
        const rs = rowspanFor(matched[0])
        for (let r = 1; r < rs; r++) {
          if (si + r < SLOTS.length) occupied[si + r][di] = true
        }
        const inner = matched.map(entry => `
          <div class="entry-block">
            <span class="e-time">${esc(entry.timeIn)} – ${esc(entry.timeOut)}</span>
            <span class="e-section">${esc(entry.section)}</span>
            <span class="e-teacher">${esc(entry.teacher)}</span>
            <span class="e-subject">${esc(entry.subject)}</span>
            <span class="e-room">${esc(entry.room)}</span>
            ${entry.parallel ? `<span class="e-parallel">Parallel (${esc(entry.parallelCount)})</span>` : ''}
          </div>`).join('<hr class="entry-sep">')
        bodyHTML += `<td class="entry-cell" rowspan="${rs}">${inner}</td>`
      } else {
        bodyHTML += '<td class="empty-cell"></td>'
      }
    }
    bodyHTML += '</tr>'
  }

  const dayHeaders = DAYS.map(d => `<th>${esc(d)}</th>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Schedule – ${esc(filterYear.value)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:11px;color:#1a1a2e;}
    h2{font-size:15px;font-weight:700;margin-bottom:3px;}
    .sub{font-size:10px;color:#666;margin-bottom:12px;}
    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    th{
      background:#1a1a2e;color:#fff;padding:7px 6px;
      text-align:center;font-size:10px;font-weight:600;letter-spacing:0.04em;
      border:1px solid #0d0d1e;
    }
    th.time-hdr{width:72px;}
    td{border:1px solid #dde;vertical-align:top;padding:0;}
    td.time-col{
      background:#f0f2fa;font-size:10px;font-weight:600;
      color:#444;text-align:center;padding:5px 3px;width:72px;
    }
    td.empty-cell{background:#fafbff;}
    td.entry-cell{
      background:#eef1fb;padding:4px 5px;vertical-align:top;
    }
    .entry-block{padding:2px 0;}
    .entry-sep{border:none;border-top:1px dashed #c5cadf;margin:3px 0;}
    td.entry-cell span{display:block;line-height:1.45;}
    .e-time{font-size:9px;color:#888;margin-bottom:2px;}
    .e-section{font-weight:700;font-size:10px;color:#1a1a2e;}
    .e-teacher{font-size:10px;color:#333;}
    .e-subject{font-size:9.5px;color:#555;font-style:italic;}
    .e-room{font-size:9.5px;color:#777;}
    .e-parallel{font-size:9px;color:#a855f7;font-weight:600;margin-top:2px;}
    @media print{
      body{padding:8px;}
      td.entry-cell{background:#e8ecf8 !important;}
      td.empty-cell{background:#fafbff !important;}
    }
  </style>
</head>
<body>
  <h2>Teacher Schedule – ${esc(filterYear.value)}</h2>
  <p class="sub">Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
  <table>
    <thead>
      <tr><th class="time-hdr">Time</th>${dayHeaders}</tr>
    </thead>
    <tbody>${bodyHTML}</tbody>
  </table>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=1000,height=700')
  w.document.write(html)
  w.document.close()
}

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
.brand  { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
.role   { font-size: 0.88rem; color: #444; font-weight: 500; }
.email  { font-size: 0.82rem; color: #888; word-break: break-all; }

.sidebar-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; border-radius: 10px;
  font-size: 0.88rem; font-weight: 400; color: #444;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
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
.main-header { margin-bottom: 24px; }
.page-title { font-size: 2rem; font-weight: 600; color: #1b4332; letter-spacing: -0.5px; line-height: 1.2; }
.page-sub   { font-size: 0.95rem; color: #777; margin-top: 4px; }

/* ═══ SCHEDULE CARD ═══ */
.schedule-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 28px 28px 20px;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.sched-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.sched-grid-title { font-size: 1.65rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.sched-grid-sub {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  font-weight: 400;
  transition: all 0.3s ease;
}

/* When teacher is selected */
.sched-grid-sub.teacher-selected {
  font-size: 0.92rem;
  color: #1b4332;
  font-weight: 600;
  background: linear-gradient(120deg, #e8f5e9 0%, #e1f5fe 100%);
  padding: 10px 14px;
  border-left: 4px solid #40916c;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(64, 145, 108, 0.15);
}
.sched-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* Selects */
.sched-select-wrap { position: relative; display: flex; align-items: center; }
.sched-select {
  appearance: none;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 7px 32px 7px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #333;
  cursor: pointer;
  outline: none;
}
.sched-select:focus { border-color: #40916c; }
.sched-select-arrow { position: absolute; right: 10px; pointer-events: none; color: #666; }

/* Teacher Select - Prominent Styling (Matches App Theme) */
.teacher-select-wrap {
  padding: 3px 6px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f6 100%);
  border-radius: 10px;
  border: 2px solid #40916c;
  box-shadow: 0 4px 12px rgba(64, 145, 108, 0.2);
  transition: all 0.2s ease;
}
.teacher-select-wrap:hover {
  border-color: #1b4332;
  box-shadow: 0 6px 16px rgba(27, 67, 50, 0.25);
  background: linear-gradient(135deg, #d4edda 0%, #e8f5e9 100%);
}

.teacher-select {
  background: linear-gradient(to bottom, #f8fffe, #eef9f7);
  border: 1px solid #40916c !important;
  border-radius: 8px;
  padding: 8px 32px 8px 13px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #1b4332;
  box-shadow: inset 0 1px 3px rgba(27, 67, 50, 0.08);
}
.teacher-select:hover {
  background: linear-gradient(to bottom, #f0fdf9, #e8faf6);
  color: #1b4332;
}
.teacher-select:focus {
  border-color: #1b4332 !important;
  outline: 2px solid rgba(64, 145, 108, 0.4);
  outline-offset: 1px;
  color: #1b4332;
}
.teacher-select-wrap .sched-select-arrow {
  color: #40916c;
  font-weight: 600;
}

/* Buttons */
.new-sched-btn {
  display: flex; align-items: center; gap: 6px;
  background: #1b4332; color: #fff;
  border: none; border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: background 0.18s;
}
.new-sched-btn:hover { background: #2d6a4f; }

.icon-btn {
  background: none; border: 1px solid #ddd;
  border-radius: 8px; padding: 6px 10px;
  cursor: pointer; color: #555;
  display: flex; align-items: center;
  transition: border-color 0.15s, color 0.15s;
}
.icon-btn:hover { border-color: #40916c; color: #1b4332; }

/* Pagination */
.sched-pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-bottom: 16px;
}
.page-arrow {
  background: none; border: none; font-size: 1.2rem;
  color: #888; cursor: pointer; padding: 2px 6px;
  border-radius: 4px; transition: color 0.15s;
}
.page-arrow:disabled { opacity: 0.3; cursor: default; }
.page-arrow:not(:disabled):hover { color: #1b4332; }
.page-dot {
  padding: 4px 12px;
  border-radius: 20px;
  background: #e8f0eb;
  color: #555;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
  user-select: none;
  line-height: 1.6;
}
.page-dot:hover { background: #c8ddd4; color: #1b4332; }
.page-dot.active { background: #1b4332; color: #fff; border-radius: 20px; width: auto; }

/* Grid */
.sched-grid-wrap {
  width: 100%;
  overflow-x: auto;
  margin-top: 8px;
}
.sched-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 800px;
}
.sched-grid th {
  background: #1b4332;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 12px 10px;
  text-align: center;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}
.th-time {
  width: 100px;
  position: sticky;
  left: 0;
  z-index: 20;
  background: #1b4332;
}
.sched-grid tbody tr { height: 70px; }
.sched-grid td {
  border: 1px solid #ececec;
  padding: 0;
  vertical-align: top;
  position: relative;
}
.sched-grid td.td-time {
  background: #f8f9fa;
  text-align: center;
  vertical-align: middle;
  font-size: 0.8rem;
  color: #1b4332;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #ececec;
  position: sticky;
  left: 0;
  z-index: 15;
  width: 100px;
  padding: 0 8px;
}
.sched-grid td.td-time::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  height: 100%;
  width: 2px;
  background: linear-gradient(to right, rgba(0,0,0,0.05), transparent);
  pointer-events: none;
}
.time-row:hover .td-time { background: #e9ecef; }
.td-cell {
  cursor: pointer;
  transition: background 0.15s;
  padding: 0;
  position: relative;
}
.td-cell:hover { background: #f7faf8; }
.td-cell.has-entry { padding: 0; }

/* Entry card */
.sched-entry {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  cursor: pointer;
  transition: filter 0.15s;
  gap: 2px;
  box-sizing: border-box;
  overflow: hidden;
}
.sched-entry:hover { filter: brightness(0.95); }

.entry-teacher {
  font-size: 0.92rem; font-weight: 700; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 60px;
}
.entry-subject {
  font-size: 0.84rem; opacity: 0.9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 60px;
}
.entry-time-range {
  font-size: 0.76rem; opacity: 0.75; font-style: italic; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 60px;
}
.entry-section-rows {
  display: flex; flex-direction: column; gap: 2px;
  margin-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.25);
  padding-top: 4px;
}
.entry-section-row {
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
}
.entry-section-badge {
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.9;
  white-space: nowrap; flex-shrink: 0;
  background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 3px;
}
.entry-room {
  font-size: 0.78rem; opacity: 0.75;
  text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 60px;
}
.entry-edit-hint {
  font-size: 0.6rem; opacity: 0; transition: opacity 0.15s;
  font-style: italic; position: absolute; bottom: 2px; right: 6px;
  background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;
  color: white; z-index: 2;
}
.sched-entry:hover .entry-edit-hint { opacity: 0.9; }
.entry-timestamp {
  font-size: 0.55rem; opacity: 0.6; font-style: italic;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: absolute; bottom: 2px; left: 6px;
  background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 3px;
  color: rgba(255,255,255,0.9); z-index: 2;
}
.click-to-add {
  display: flex; align-items: center; justify-content: center;
  height: 100%; text-align: center; font-size: 0.75rem; color: #aaa;
  user-select: none; padding: 8px;
}
.form-value-locked {
  display: flex; align-items: center;
  padding: 6px 12px; border-radius: 8px;
  background: #f0f4f2; border: 1px solid #d0e0d8;
  font-size: 0.875rem; color: #1b4332; font-weight: 600;
  min-width: 0; flex: 1;
}

/* Entry colors */
.color-green  { background: #1b4332; color: #fff; }
.color-yellow { background: #e9c46a; color: #5a3e00; }
.color-blue   { background: #4a90d9; color: #fff; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }

/* ═══ Schedule Modal ═══ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.sched-modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 32px 36px 28px;
  width: 500px; max-width: 96vw; max-height: 90vh;
  overflow-y: auto; position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}
.sched-modal-header { margin-bottom: 20px; }
.sched-modal-mode-badge {
  display: inline-block;
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 3px 10px; border-radius: 20px; margin-bottom: 6px;
}
.badge-add  { background: #e8f5ee; color: #1b4332; }
.badge-edit { background: #fff3cd; color: #7a5500; }
.sched-modal-title { font-size: 1.25rem; font-weight: 700; color: #1b4332; margin: 0 0 3px; }
.sched-modal-sub   { font-size: 0.84rem; color: #888; margin: 0; }

.sched-form { display: flex; flex-direction: column; gap: 13px; margin-bottom: 22px; }
.form-row-inline {
  display: grid; grid-template-columns: 100px 1fr;
  align-items: center; gap: 12px;
}
.form-label { font-size: 0.95rem; font-weight: 700; color: #111; }
.form-select-wrap { position: relative; display: flex; align-items: center; }
.form-select {
  width: 100%; appearance: none;
  border: 1px solid #ccc; border-radius: 10px;
  padding: 9px 34px 9px 14px;
  font-size: 0.88rem; font-family: inherit; color: #333;
  background: #fff; cursor: pointer; outline: none;
  transition: border-color 0.15s;
}
.form-select:focus { border-color: #40916c; }
.sel-arrow { position: absolute; right: 12px; pointer-events: none; color: #666; }

.parallel-slot-divider {
  font-size: 0.78rem; font-weight: 700; color: #40916c;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 6px 0 2px; border-top: 1px solid #e8f5ee; margin-top: 4px;
}
.parallel-row { display: flex; align-items: center; gap: 24px; margin-top: 4px; }
.parallel-btn {
  display: flex; align-items: center; gap: 8px;
  background: none; border: none; font-family: inherit;
  font-size: 0.92rem; font-weight: 500; color: #444;
  cursor: pointer; padding: 0; transition: color 0.15s;
}
.parallel-btn.active { color: #1b4332; font-weight: 600; }
.par-radio {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid #bbb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s, border-color 0.15s;
}
.par-radio.checked { background: #1b4332; border-color: #1b4332; }

.sched-modal-actions {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 12px; margin-top: 4px;
}
.clear-slot-btn {
  margin-right: auto;
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid #e63946; color: #e63946;
  font-family: inherit; font-size: 0.85rem; font-weight: 600;
  padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s;
}
.clear-slot-btn:hover { background: #ffeaea; }
.cancel-btn-text {
  background: none; border: none; color: #e63946;
  font-family: inherit; font-size: 1rem; font-weight: 600;
  cursor: pointer; padding: 8px 12px; transition: opacity 0.15s;
}
.cancel-btn-text:hover { opacity: 0.75; }
.save-btn {
  display: flex; align-items: center; gap: 6px;
  background: #1b4332; color: #fff; border: none;
  font-family: inherit; font-size: 0.88rem; font-weight: 600;
  padding: 10px 26px; border-radius: 10px; cursor: pointer;
  transition: background 0.18s;
}
.save-btn:hover:not(:disabled) { background: #2d6a4f; }
.save-btn:disabled { opacity: 0.5; cursor: default; }

/* ═══ Add Schedule Panel ═══ */
.panel-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.30);
  z-index: 900;
  display: flex; justify-content: flex-end;
}
.add-panel {
  width: 420px; max-width: 96vw;
  background: #fff; height: 100vh;
  display: flex; flex-direction: column;
  box-shadow: -4px 0 32px rgba(0,0,0,0.14);
  overflow: hidden;
}
.panel-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.panel-badge {
  display: inline-block; font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 3px 10px; border-radius: 20px;
  background: #e8f5ee; color: #1b4332; margin-bottom: 6px;
}
.panel-title { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0 0 3px; }
.panel-sub   { font-size: 0.84rem; color: #888; margin: 0; }
.panel-close {
  background: none; border: 1px solid #ddd; border-radius: 8px;
  padding: 6px 8px; cursor: pointer; color: #555; flex-shrink: 0;
  display: flex; align-items: center; transition: all 0.15s;
}
.panel-close:hover { border-color: #e63946; color: #e63946; }
.panel-form {
  display: flex; flex-direction: column; gap: 13px;
  padding: 20px 28px 8px; overflow-y: auto; flex: 1;
}
.panel-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding: 14px 28px 20px; border-top: 1px solid #f0f0f0;
  flex-shrink: 0; background: #fff;
}
.reset-btn {
  background: none; border: 1px solid #ccc; border-radius: 8px;
  padding: 8px 16px; font-family: inherit; font-size: 0.85rem;
  color: #666; cursor: pointer; transition: all 0.15s;
}
.reset-btn:hover { border-color: #999; color: #333; }

.time-error {
  display: flex; align-items: center; gap: 6px;
  color: #e63946; font-size: 0.8rem; font-weight: 500;
  background: #ffeaea; border-radius: 8px;
  padding: 8px 12px; margin: 0 28px;
}
.flash-msg {
  display: flex; align-items: center; gap: 8px;
  background: #d8f3dc; color: #1b4332;
  border-radius: 8px; padding: 10px 16px;
  font-size: 0.88rem; font-weight: 600;
  margin: 4px 28px 0;
}
.flash-enter-active, .flash-leave-active { transition: opacity 0.3s; }
.flash-enter-from, .flash-leave-to { opacity: 0; }

/* Panel slide transition */
.panel-enter-active { transition: opacity 0.25s ease; }
.panel-leave-active { transition: opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; }
.panel-enter-active .add-panel { animation: slideInPanel 0.25s ease; }
.panel-leave-active .add-panel { animation: slideOutPanel 0.2s ease; }
@keyframes slideInPanel  { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideOutPanel { from { transform: translateX(0); }    to { transform: translateX(100%); } }

/* ═══ Add Year Modal ═══ */
.add-year-modal-box {
  background: #fff; border-radius: 20px;
  padding: 32px 36px 28px; width: 380px; max-width: 96vw;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}

/* ═══ Logout Modal ═══ */
.logout-modal-box {
  background: #fff; border-radius: 20px;
  padding: 36px 40px 32px; width: 360px; max-width: 94vw;
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; box-shadow: 0 16px 48px rgba(0,0,0,0.18); text-align: center;
}
.logout-modal-icon {
  width: 68px; height: 68px; border-radius: 50%;
  background: #ffeaea;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; margin-top: 6px; width: 100%;
}
.logout-cancel-btn {
  background: none; border: none; font-family: inherit;
  font-size: 1rem; font-weight: 600; color: #e63946;
  cursor: pointer; padding: 8px 18px; border-radius: 10px;
}
.logout-cancel-btn:hover  { background: #ffeaea; }
.logout-confirm-btn {
  background: #1b4332; color: #fff; border: none;
  font-family: inherit; font-size: 1rem; font-weight: 600;
  padding: 10px 32px; border-radius: 10px; cursor: pointer;
}
.logout-confirm-btn:hover { background: #2d6a4f; }  
</style>

<style>
/* ── SweetAlert2 conflict modal ── */
.swal-cit-popup {
  font-family: 'Poppins', sans-serif !important;
  border-radius: 18px !important;
  padding: 32px 28px 24px !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.18) !important;
}
.swal-cit-title {
  font-family: 'Poppins', sans-serif !important;
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  margin-bottom: 8px !important;
}
.swal-cit-btn {
  font-family: 'Poppins', sans-serif !important;
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  padding: 9px 28px !important;
  letter-spacing: 0.02em !important;
}
</style>
