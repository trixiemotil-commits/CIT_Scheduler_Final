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
          <span class="page-eyebrow">Schedule Management</span>
          <h1 class="page-title">{{ pageHeaderTitle }}</h1>
          <p class="page-sub">{{ pageHeaderSub }}</p>
        </div>
        <div class="header-right">
          <div v-if="selectedTermLabel" class="term-banner">
            <span>Viewing: {{ selectedTermLabel }}</span>
          </div>
        </div>
      </header>

      <!-- ── Mode Selection -->
      <div v-if="!viewMode" class="mode-select-container">
        <p class="step-hint">Choose how you want to view schedules</p>
        <div class="mode-grid">
          <button class="mode-card" @click="viewMode = 'room'">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div class="mode-label">Room</div>
            <div class="mode-desc">Select a floor and room to see its weekly schedule</div>
          </button>
          <button class="mode-card" @click="viewMode = 'teacher'; loadTeachers()">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="mode-label">Faculty</div>
            <div class="mode-desc">Select a faculty member to see their full weekly schedule</div>
          </button>
        </div>
      </div>

      <!-- ── BY ROOM ── -->
      <template v-else-if="viewMode === 'room'">
        <!-- Step 1: Floor -->
        <div v-if="!selectedFloor" class="step-container">
          <p class="step-hint">Choose a floor to see available rooms</p>
          <div class="floor-grid">
              <div v-if="!availableFloors.length" class="empty-state">
                <p>No rooms are enabled for this academic term.</p>
              </div>
              <div v-for="floor in availableFloors" :key="floor.label" class="floor-card floor-card-expanded">
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
        <!-- Step 2: Room -->
        <div v-else-if="!selectedRoom" class="step-container">
          <p class="step-hint">Select a room to view its weekly schedule</p>
          <div class="teacher-search-wrap room-search-wrap">
            <svg class="teacher-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model.trim="roomSearchQuery" type="text" class="teacher-search-input" placeholder="Search room..." />
          </div>
          <div v-if="filteredCurrentFloorRooms.length" class="room-grid">
            <button v-for="room in filteredCurrentFloorRooms" :key="room" class="room-card" :class="{ 'room-card-comlab': room.toLowerCase().includes('comlab') }" @click="selectedRoom = room">
              <svg class="room-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <div class="room-card-number">{{ room }}</div>
              <div class="room-card-floor">{{ selectedFloor }}</div>
            </button>
          </div>
          <div v-else class="empty-state small-empty-state">
            <p>No rooms found for <strong>“{{ roomSearchQuery }}”</strong>.</p>
          </div>
        </div>
        <!-- Step 3: Room grid -->
        <div v-else class="schedule-card">
          <div class="sched-topbar">
            <button class="schedule-back-btn" aria-label="Back to room selection" title="Back to room selection" @click="returnToScheduleSelection">&larr;</button>
            <div class="sched-topbar-left">
              <span class="sched-context-label">Schedule for</span>
              <h2 class="sched-grid-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                Room {{ selectedRoom }}
              </h2>
              <p class="sched-grid-sub">{{ selectedFloor }} &bull; Read-only view</p>
            </div>
            <div class="sched-topbar-right">
              <button class="icon-btn" title="Print" @click="printSchedule">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
            </div>
          </div>
          <div v-if="loading" class="loading-state">
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            Loading schedule…
          </div>
          <div v-else-if="roomHasNoEntries" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No schedules assigned to <strong>Room {{ selectedRoom }}</strong> yet.</p>
          </div>
          <div v-else class="sched-grid-wrap">
            <table class="sched-grid">
              <thead><tr><th class="th-time">Time</th><th v-for="day in days" :key="day">{{ day }}</th></tr></thead>
              <tbody>
                <tr v-for="slot in timeSlots30" :key="slot" class="time-row" :class="{ 'half-hour': slot.includes(':30') }">
                  <td class="td-time">{{ slot }}</td>
                  <template v-for="day in days" :key="day">
                    <td
                      v-if="!isSpannedRoomCell(slot, day)"
                      :rowspan="getEntriesForRoomCell(slot, day).length ? getRoomRowspan(getEntriesForRoomCell(slot, day)[0]) : 1"
                      class="td-cell"
                      :class="{
                        'has-entry': getEntriesForRoomCell(slot, day).length,
                        'free-time-cell': !getEntriesForRoomCell(slot, day).length
                      }"
                    >
                      <template v-if="getEntriesForRoomCell(slot, day).length">
                        <div
                          class="sched-entry sched-entry-clickable"
                          :class="getEntriesForRoomCell(slot, day)[0].color"
                          :style="roomEntryStyle(slot, getEntriesForRoomCell(slot, day)[0])"
                          role="button"
                          tabindex="0"
                          @click="openScheduleDetails(getEntriesForRoomCell(slot, day))"
                          @keydown.enter.space.prevent="openScheduleDetails(getEntriesForRoomCell(slot, day))"
                        >
                          <span
                            v-if="getEntriesForRoomCell(slot, day)[0].isSubstitute"
                            class="subbed-badge"
                            :title="getEntriesForRoomCell(slot, day)[0].subbedLabel"
                          >{{ getEntriesForRoomCell(slot, day)[0].subbedLabel || 'SUBSTITUTE' }}</span>
                          <div class="entry-teacher">{{ getEntriesForRoomCell(slot, day)[0].teacher }}</div>
                          <div class="entry-subject">{{ getEntriesForRoomCell(slot, day)[0].subject }}</div>
                          <div class="entry-time-range">{{ getEntriesForRoomCell(slot, day)[0].slot }}</div>
                          <div v-if="getEntriesForRoomCell(slot, day).some((entry) => entry.section)" class="entry-section-rows">
                            <div v-for="e in getEntriesForRoomCell(slot, day).filter((entry) => entry.section)" :key="e._key" class="entry-section-row">
                              <span class="entry-section-badge">{{ e.section }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <span class="free-time-label">Free time</span>
                      </template>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ── BY TEACHER ── -->
      <template v-else-if="viewMode === 'teacher'">
        <!-- Step 1: Teacher selection -->
        <div v-if="!selectedTeacher" class="step-container">
          <div v-if="loadingTeachers" class="loading-state">
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            Loading teachers…
          </div>
          <template v-else>
            <p class="step-hint">Select a teacher to view their weekly schedule</p>
            <div class="teacher-search-wrap">
              <svg class="teacher-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input v-model.trim="teacherSearchQuery" type="text" class="teacher-search-input" placeholder="Search teacher name..." />
            </div>
            <div v-if="filteredTeacherList.length" class="teacher-grid">
              <button v-for="teacher in filteredTeacherList" :key="teacher.name" class="teacher-card" @click="chooseTeacher(teacher)">
                <img v-if="teacher.avatar" :src="teacher.avatar" :alt="teacher.name" class="teacher-avatar-img" />
                <div v-else class="teacher-avatar">{{ getTeacherInitials(teacher.name) }}</div>
                <div class="teacher-name">Prof. {{ teacher.name }}</div>
              </button>
            </div>
            <div v-else class="empty-state small-empty-state">
              <p>No teachers found for <strong>“{{ teacherSearchQuery }}”</strong>.</p>
            </div>
          </template>
        </div>
        <!-- Step 2: Teacher schedule grid -->
        <div v-else class="schedule-card">
          <div class="sched-topbar">
            <button class="schedule-back-btn" aria-label="Back to teacher selection" title="Back to teacher selection" @click="returnToScheduleSelection">&larr;</button>
            <div class="sched-topbar-left">
              <span class="sched-context-label">Schedule for</span>
              <h2 class="sched-grid-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Prof. {{ selectedTeacher }}
              </h2>
              <p class="sched-grid-sub">Read-only view</p>
            </div>
            <div class="sched-topbar-right">
              <button class="icon-btn" title="Print" @click="printSchedule">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
            </div>
          </div>
          <div v-if="loading" class="loading-state">
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            Loading schedule…
          </div>
          <div v-else-if="teacherHasNoEntries" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No schedules found for <strong>Prof. {{ selectedTeacher }}</strong>.</p>
          </div>
          <div v-else class="sched-grid-wrap">
            <table class="sched-grid">
              <thead><tr><th class="th-time">Time</th><th v-for="day in days" :key="day">{{ day }}</th></tr></thead>
              <tbody>
                <tr v-for="slot in timeSlots30" :key="slot" class="time-row" :class="{ 'half-hour': slot.includes(':30') }">
                  <td class="td-time">{{ slot }}</td>
                  <template v-for="day in days" :key="day">
                    <td
                    v-if="!isSpannedTeacherCell(slot, day) && !isSpannedConsultTeacherCell(slot, day)"
                    :rowspan="getEntriesForTeacherCell(slot, day).length ? getRoomRowspan(getEntriesForTeacherCell(slot, day)[0]) : (getConsultationForTeacherCell(slot, day) ? getConsultRowspan(getConsultationForTeacherCell(slot, day)) : 1)"
                    class="td-cell"
                    :class="{
                      'has-entry': getEntriesForTeacherCell(slot, day).length,
                      'consult-cell': !getEntriesForTeacherCell(slot, day).length && !!getConsultationForTeacherCell(slot, day),
                      'free-time-cell': !getEntriesForTeacherCell(slot, day).length && !getConsultationForTeacherCell(slot, day)
                    }"
                  >
                      <template v-if="getEntriesForTeacherCell(slot, day).length">
                        <div
                          class="sched-entry sched-entry-clickable"
                          :class="getEntriesForTeacherCell(slot, day)[0].color"
                          :style="roomEntryStyle(slot, getEntriesForTeacherCell(slot, day)[0])"
                          role="button"
                          tabindex="0"
                          @click="openScheduleDetails(getEntriesForTeacherCell(slot, day))"
                          @keydown.enter.space.prevent="openScheduleDetails(getEntriesForTeacherCell(slot, day))"
                        >
                          <span
                            v-if="getEntriesForTeacherCell(slot, day)[0].isSubstitute"
                            class="subbed-badge"
                            :title="getEntriesForTeacherCell(slot, day)[0].subbedLabel"
                          >{{ getEntriesForTeacherCell(slot, day)[0].subbedLabel || 'SUBSTITUTE' }}</span>
                          <div class="entry-teacher">{{ getEntriesForTeacherCell(slot, day)[0].subject }}</div>
                          <div class="entry-subject">{{ getEntriesForTeacherCell(slot, day)[0].slot }}</div>
                          <div
                            v-if="getEntriesForTeacherCell(slot, day).some((entry) => entry.section || entry.room)"
                            class="entry-section-rows"
                          >
                            <template v-for="e in getEntriesForTeacherCell(slot, day)" :key="e._key">
                              <div v-if="e.section || e.room" class="entry-section-row">
                                <span v-if="e.section" class="entry-section-badge">{{ e.section }}</span>
                                <span v-if="e.room" class="entry-room">{{ e.room }}</span>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                      <template v-else-if="getConsultationForTeacherCell(slot, day)">
                        <div
                          class="sched-entry color-blue consult-entry sched-entry-clickable"
                          :style="consultEntryStyle(slot, getConsultationForTeacherCell(slot, day))"
                          role="button"
                          tabindex="0"
                          @click="openConsultationDetails(getConsultationForTeacherCell(slot, day))"
                          @keydown.enter.space.prevent="openConsultationDetails(getConsultationForTeacherCell(slot, day))"
                        >
                          <div class="entry-teacher">Consultation</div>
                          <div class="entry-subject">{{ getConsultationForTeacherCell(slot, day).startTime }} – {{ getConsultationForTeacherCell(slot, day).endTime }}</div>
                        </div>
                      </template>
                      <template v-else>
                        <span class="free-time-label">Free time</span>
                      </template>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>

    <!-- ═══ Schedule Details Modal ═══ -->
    <Teleport to="body">
      <div v-if="selectedScheduleEntry" class="modal-overlay schedule-details-overlay" @click.self="closeScheduleDetails">
        <div class="schedule-details-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-details-title">
          <button class="schedule-modal-close" type="button" aria-label="Close schedule details" @click="closeScheduleDetails">&times;</button>
          <div class="schedule-modal-teacher">
            <span class="schedule-modal-avatar">{{ (selectedScheduleEntry.teacher || selectedTeacher || 'T').charAt(0) }}</span>
            <div>
              <span>Teacher</span>
              <strong>{{ selectedScheduleEntry.teacher || selectedTeacher || '—' }}</strong>
            </div>
          </div>

          <section class="schedule-modal-focus" aria-label="Focused schedule information">
            <div class="schedule-focus-kicker">
              <span v-if="selectedScheduleEntry.isSubstitute" class="schedule-modal-subbed">
                {{ selectedScheduleEntry.subbedLabel || 'Substitute schedule' }}
              </span>
              <span v-else>{{ selectedScheduleEntry.entryType === 'lunch' ? 'Break time' : (selectedScheduleEntry.isConsultation ? 'Consultation slot' : 'Schedule focus') }}</span>
            </div>
            <h2 id="schedule-details-title">{{ selectedScheduleEntry.subject || 'Schedule Details' }}</h2>
            <div class="schedule-focus-meta">
              <span>{{ selectedScheduleEntry.day }}</span>
              <span>{{ selectedScheduleEntry.slot }}</span>
            </div>
          </section>

          <div v-if="selectedScheduleEntry.entryType !== 'lunch'" class="schedule-detail-grid">
            <template v-if="selectedScheduleEntry.isConsultation">
              <div class="schedule-detail-item">
                <span>Type</span>
                <strong>Consultation</strong>
              </div>
              <div class="schedule-detail-item">
                <span>Duration</span>
                <strong>{{ selectedScheduleEntry.duration || '—' }}</strong>
              </div>
              <div class="schedule-detail-item">
                <span>Availability</span>
                <strong>Open slot</strong>
              </div>
            </template>
            <template v-else>
              <div class="schedule-detail-item">
                <span>Room</span>
                <strong>{{ selectedScheduleEntry.room || '—' }}</strong>
              </div>
              <div class="schedule-detail-item">
                <span>Section</span>
                <strong>{{ selectedScheduleSections || '—' }}</strong>
              </div>
              <div class="schedule-detail-item">
                <span>Year</span>
                <strong>{{ selectedScheduleEntry.year || '—' }}</strong>
              </div>
              <div v-if="selectedScheduleEntry.campus" class="schedule-detail-item schedule-detail-wide">
                <span>Campus</span>
                <strong>{{ selectedScheduleEntry.campus }}</strong>
              </div>
            </template>
          </div>

          <div v-else class="schedule-detail-grid schedule-detail-grid-minimal">
            <div class="schedule-detail-item">
              <span>Type</span>
              <strong>Lunch Break</strong>
            </div>
            <div class="schedule-detail-item">
              <span>Duration</span>
              <strong>{{ selectedScheduleEntry.duration || scheduleEntryDuration(selectedScheduleEntry) || '—' }}</strong>
            </div>
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
    colorForRoomType,
    days,
    entries,
    parseTime,
    timeOptions,
} from '@/composables/useSchedule.js'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
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
const viewSource = computed(() => String(route.query.source || '').toLowerCase())
const pageHeaderTitle = computed(() => {
  if (viewSource.value === 'academic') return 'Academic Terms'
  if (viewSource.value === 'current') return 'Current Term Schedule'
  return 'View Schedules'
})
const pageHeaderSub = computed(() => {
  if (viewSource.value === 'academic') {
    return 'Create school terms, organize schedules, and choose what teachers and students can currently view.'
  }
  if (viewSource.value === 'current') {
    return 'View the currently published weekly schedule for rooms and teachers.'
  }
  return 'Browse schedules by room or by teacher.'
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

watch(selectedTerm, async () => {
  if (viewMode.value === 'room' || viewMode.value === 'teacher') {
    await loadScheduleData()
  }
  if (viewMode.value === 'teacher') {
    await fetchConsultationsForTeacher()
  }
})

/* 30-minute grid slots (matches AddScheduleView) */
const timeSlots30 = timeOptions

const showLogoutModal = ref(false)
const selectedScheduleEntries = ref([])
const loading = ref(false)
const consultationSlots = ref([])

const selectedScheduleEntry = computed(() => selectedScheduleEntries.value[0] || null)
const selectedScheduleSections = computed(() => {
  const sections = selectedScheduleEntries.value.map((entry) => entry.section).filter(Boolean)
  return [...new Set(sections)].join(', ')
})

function openScheduleDetails(scheduleEntries) {
  selectedScheduleEntries.value = Array.isArray(scheduleEntries)
    ? scheduleEntries.filter(Boolean)
    : [scheduleEntries].filter(Boolean)
}

function openConsultationDetails(consultation) {
  if (!consultation) return
  const start = consultation.startTime || ''
  const end = consultation.endTime || ''
  const durationMinutes = start && end ? Math.max(0, parseTime(end) - parseTime(start)) : 0
  selectedScheduleEntries.value = [{
    _key: consultation.id || consultation._id || `consult-${consultation.dayOfWeek}-${start}-${end}`,
    isConsultation: true,
    teacher: consultation.teacher || selectedTeacher.value,
    subject: 'Consultation Availability',
    day: consultation.dayOfWeek || '',
    slot: start && end ? `${start} – ${end}` : '—',
    duration: durationMinutes ? `${durationMinutes} minutes` : '',
  }]
}

function scheduleEntryDuration(entry) {
  const start = entry?.timeIn || ''
  const end = entry?.timeOut || ''
  if (!start || !end) return ''
  const minutes = Math.max(0, parseTime(end) - parseTime(start))
  return minutes ? `${minutes} minutes` : ''
}

function closeScheduleDetails() {
  selectedScheduleEntries.value = []
}

function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) { logout(); router.push('/'); throw new Error('Session expired.') }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options,
  })
  let body = {}
  try { body = await response.json() } catch (_) { body = {} }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) { logout(); router.push('/') }
    const error = new Error(body.message || 'Request failed.')
    error.status = response.status
    throw error
  }
  return body
}

/* ── Nav ── */
const navItems = [
  { name: 'Dashboard',      to: '/admin/dashboard',       icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { name: 'View Schedules', to: '/admin/schedule/view',   icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { name: 'Add Schedule',   to: '/admin/schedule/add',    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>` },
  { name: 'Academic Terms', to: '/admin/academic-terms', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>` },
  { name: 'Teachers',       to: '/admin/teachers',        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events',         to: '/admin/events',          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Users',          to: '/admin/users',           icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { name: 'Settings',       to: '/admin/settings',        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

/* ── Floor / Room definitions ── */
const floors = [
  {
    label: '2nd Floor', number: '2',
    rooms: ['201', '202', '204', '205', '208', '209'],
  },
  {
    label: '3rd Floor', number: '3',
    rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309'],
  },
  {
    label: '4th Floor', number: '4',
    rooms: ['401', '402', '403', '404', '405', '406 (Comlab 1)', '407 (Comlab 2)', '408 (Comlab 3)', '409 (Comlab 4)'],
  },
]

const enabledTermRooms = computed(() => {
  const rooms = Array.isArray(selectedTerm.value?.rooms) ? selectedTerm.value.rooms : []
  return rooms.map(room => typeof room === 'string' ? room : room.name).filter(Boolean)
})

const availableFloors = computed(() => floors
  .map(floor => ({
    ...floor,
    rooms: enabledTermRooms.value.filter(room => String(room).startsWith(floor.number)),
  }))
  .filter(floor => floor.rooms.length)
)

const initialViewRouteMode = ['room', 'teacher'].includes(String(route.query.mode || ''))
  ? String(route.query.mode)
  : null
const selectedFloor = ref(null)
const selectedRoom  = ref(initialViewRouteMode === 'room' ? (String(route.query.room || '') || null) : null)
if (selectedRoom.value) {
  selectedFloor.value = floors.find(floor => floor.rooms.some(room =>
    room === selectedRoom.value
    || room.startsWith(`${selectedRoom.value} `)
    || selectedRoom.value.startsWith(`${room} `)
  ))?.label || null
}
const roomSearchQuery = ref('')

/* ── View Mode ── */
const viewMode         = ref(initialViewRouteMode)   // null | 'room' | 'teacher'
const selectedTeacher  = ref(initialViewRouteMode === 'teacher' ? (String(route.query.teacher || '') || null) : null)
const selectedTeacherId = ref(null)
const teacherList      = ref([])
const teacherSearchQuery = ref('')
const loadingTeachers  = ref(false)

const filteredTeacherList = computed(() => {
  const query = teacherSearchQuery.value.trim().toLowerCase()
  if (!query) return teacherList.value
  return teacherList.value.filter(teacher => teacher.name.toLowerCase().includes(query))
})

function resetAll() {
  viewMode.value        = null
  selectedFloor.value   = null
  selectedRoom.value    = null
  selectedTeacher.value = null
}

function chooseRoomFromFloor(floorLabel, room) {
  selectedFloor.value = floorLabel
  selectedRoom.value = room
}

function returnToScheduleSelection() {
  const termId = getTermId(selectedTerm.value) || String(route.query.academicTermId || '').trim()
  const mode = viewMode.value || String(route.query.mode || '').trim()
  if (termId && ['room', 'teacher'].includes(mode)) {
    router.push({
      path: '/admin/academic-terms',
      query: {
        term: termId,
        action: 'view',
        mode,
        source: viewSource.value === 'current' ? 'current' : 'academic',
      },
    })
    return
  }

  if (viewMode.value === 'room') {
    selectedRoom.value = null
  } else if (viewMode.value === 'teacher') {
    selectedTeacher.value = null
    selectedTeacherId.value = null
  }
}

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

async function applyRouteContext() {
  const requestedTermId = String(route.query.academicTermId || '').trim()
  if (requestedTermId) {
    const response = await apiRequest('/academic-terms')
    selectedTerm.value = (response.terms || []).find(term => getTermId(term) === requestedTermId) || selectedTerm.value
  }

  const requestedMode = String(route.query.mode || '')
  if (requestedMode === 'room') {
    viewMode.value = 'room'
    selectedRoom.value = String(route.query.room || '') || null
    if (selectedRoom.value) {
      selectedFloor.value = floors.find(floor => floor.rooms.some(room =>
        room === selectedRoom.value
        || room.startsWith(`${selectedRoom.value} `)
        || selectedRoom.value.startsWith(`${room} `)
      ))?.label || null
    }
  } else if (requestedMode === 'teacher') {
    viewMode.value = 'teacher'
    await loadTeachers()
    selectedTeacher.value = String(route.query.teacher || '') || null
    selectedTeacherId.value = teacherList.value.find(teacher => teacher.name === selectedTeacher.value)?.id || null
  }
}

async function loadTeachers() {
  if (teacherList.value.length) return
  loadingTeachers.value = true
  try {
    const res = await apiRequest('/users?role=teacher')
      if (res.users && Array.isArray(res.users)) {
        teacherList.value = res.users
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
  loadingTeachers.value = false
}

async function fetchConsultationsForTeacher() {
  if (!selectedTeacher.value) {
    consultationSlots.value = []
    return
  }
  try {
    const termId = getSelectedTermId()
    const query = new URLSearchParams({ teacher: selectedTeacher.value })
    if (termId) query.set('academicTermId', termId)
    const res = await apiRequest(`/consultations?${query.toString()}`)
    consultationSlots.value = res.consultations || []
  } catch (_) {
    consultationSlots.value = []
  }
}

watch(selectedTeacher, () => {
  if (viewMode.value === 'teacher') {
    fetchConsultationsForTeacher()
  }
})

function chooseTeacher(teacher) {
  selectedTeacher.value = teacher.name
  selectedTeacherId.value = teacher.id || null
  // reload schedules so substitute assignments are merged into entries
  loadScheduleData()
  fetchConsultationsForTeacher()
}

/* ── Teacher-filtered grid helpers ── */
function getEntriesForTeacherCell(rowSlot, day) {
  if (!selectedTeacher.value) return []
  const rowStart = parseTime(rowSlot)
  const rowEnd   = rowStart + 30
  const sectionMatch = Object.entries(entries).find(([, v]) => {
    if (v.teacher !== selectedTeacher.value) return false
    if (v.day !== day) return false
    const t = parseTime(v.timeIn)
    return t >= rowStart && t < rowEnd
  })
  if (!sectionMatch) return []
  const [, matchedEntry] = sectionMatch
  if (matchedEntry.parallel && matchedEntry.parallelGroupId) {
    return Object.entries(entries)
      .filter(([, v]) => {
        if (v.teacher !== selectedTeacher.value) return false
        if (v.day !== day) return false
        if (v.parallelGroupId !== matchedEntry.parallelGroupId) return false
        const t = parseTime(v.timeIn)
        return t >= rowStart && t < rowEnd
      })
      .map(([k, v]) => ({ ...v, _key: k }))
  }
  return [{ ...matchedEntry, _key: sectionMatch[0] }]
}

function isSpannedTeacherCell(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForTeacherCell(timeSlots30[i], day)
    if (prev.length > 0 && i + getRoomRowspan(prev[0]) > slotIndex) return true
  }
  return false
}

function getConsultationForTeacherCell(rowSlot, day) {
  if (!selectedTeacher.value) return null
  const rowStart = parseTime(rowSlot)
  const rowEnd   = rowStart + 30
  return consultationSlots.value.find(c => {
    if (c.dayOfWeek !== day) return false
    const t = parseTime(c.startTime)
    return t >= rowStart && t < rowEnd
  }) ?? null
}

function getConsultRowspan(consult) {
  if (!consult?.startTime || !consult?.endTime) return 1
  return Math.max(1, Math.ceil((parseTime(consult.endTime) - parseTime(consult.startTime)) / 30))
}

function isSpannedConsultTeacherCell(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const consult = getConsultationForTeacherCell(timeSlots30[i], day)
    if (consult && i + getConsultRowspan(consult) > slotIndex) return true
  }
  return false
}

function consultEntryStyle(rowSlot, consult) {
  if (!consult?.startTime || !consult?.endTime) return {}
  const rowStart     = parseTime(rowSlot)
  const consultStart = parseTime(consult.startTime)
  const mins         = Math.max(1, parseTime(consult.endTime) - consultStart)
  const offsetMins   = Math.max(0, consultStart - rowStart)
  const spannedMins  = getConsultRowspan(consult) * 30
  const trailingMins = Math.max(0, spannedMins - offsetMins - mins)
  return {
    top: `calc(${(offsetMins / spannedMins) * 100}% + 4px)`,
    bottom: `calc(${(trailingMins / spannedMins) * 100}% + 4px)`,
    height: 'auto',
    zIndex: 3,
  }
}

const teacherHasNoEntries = computed(() => {
  if (!selectedTeacher.value) return false
  return !Object.values(entries).some(v => v.teacher === selectedTeacher.value)
})

const currentFloorRooms = computed(
  () => availableFloors.value.find(f => f.label === selectedFloor.value)?.rooms ?? []
)

const filteredCurrentFloorRooms = computed(() => {
  const query = roomSearchQuery.value.trim().toLowerCase()
  if (!query) return currentFloorRooms.value
  return currentFloorRooms.value.filter(room => room.toLowerCase().includes(query))
})

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

function resetEntriesStore() {
  Object.keys(entries).forEach(key => { delete entries[key] })
}

function syncEntriesFromApi(apiEntries) {
  resetEntriesStore()
  if (!Array.isArray(apiEntries)) return
  apiEntries.forEach(entry => {
    const tableLabel = entry.tableLabel || entry.teacher || ''
    const entryType = String(entry.entryType || '').trim().toLowerCase()
    const isLunch = entryType === 'lunch' || entry.color === 'color-gray' || /\blunch\b/i.test(String(entry.subject || ''))
    const rawSection = entry.section || ''
    const section = isLunch ? '' : rawSection
    const day = entry.day
    const slot = `${entry.timeIn} - ${entry.timeOut}`
    const sectionKey = String(rawSection || `__entry_${entry.id || slot}`).trim()
    if (!tableLabel || !day || !entry.timeIn || !entry.timeOut) return
    const key = `${tableLabel}|${sectionKey}|${slot}|${day}`
    const inferredCampus = inferCampus(entry)
    const roomBasedColor = colorForRoomType(entry.roomType, entry.room)
    entries[key] = {
      entryType: isLunch ? 'lunch' : (entryType || 'class'),
      teacher: entry.teacher,
      subject: entry.subject,
      campus: inferredCampus,
      room: entry.room,
      year: isLunch ? '' : entry.year,
      tableLabel,
      section,
      day,
      slot,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      parallel: Boolean(entry.parallel),
      parallelGroupId: entry.parallelGroupId || null,
      parallelCount: entry.parallelCount || 1,
      parallelSlots: Array.isArray(entry.parallelSlots) ? entry.parallelSlots.map(s => ({ ...s })) : [],
      isSubstitute: Boolean(entry.isSubstitute),
      subbedLabel: entry.subbedLabel || '',
      color: isLunch
        ? 'color-gray'
        : (roomBasedColor || entry.color || 'color-yellow'),
      addedAt: formatAddedAt(entry.addedAt),
    }
  })
}

/* ── Room-filtered grid helpers ── */
function getEntriesForRoomCell(rowHour, day) {
  if (!selectedRoom.value) return []
  const rowStart = parseTime(rowHour)
  const rowEnd   = rowStart + 30
  return Object.entries(entries)
    .filter(([, v]) => {
      if (!v.room || v.room !== selectedRoom.value) return false
      if (v.day !== day) return false
      const t = parseTime(v.timeIn)
      return t >= rowStart && t < rowEnd
    })
    .map(([k, v]) => ({ ...v, _key: k }))
}

function isSpannedRoomCell(slot, day) {
  const slotIndex = timeSlots30.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForRoomCell(timeSlots30[i], day)
    if (prev.length > 0 && i + getRoomRowspan(prev[0]) > slotIndex) return true
  }
  return false
}

function getRoomRowspan(entry) {
  if (!entry?.timeIn || !entry?.timeOut) return 1
  const start = parseTime(entry.timeIn)
  const end   = parseTime(entry.timeOut)
  const duration = Math.max(1, end - start)
  const startOffset = start % 30
  return Math.max(1, Math.ceil((startOffset + duration) / 30))
}

const ROW_HEIGHT = 44
function roomEntryStyle(rowHour, entry) {
  if (!entry?.timeIn || !entry?.timeOut) return {}
  const rowStart   = parseTime(rowHour)
  const entryStart = parseTime(entry.timeIn)
  const mins       = Math.max(1, parseTime(entry.timeOut) - entryStart)
  const offsetMins = Math.max(0, entryStart - rowStart)
  const spannedMins = getRoomRowspan(entry) * 30
  const trailingMins = Math.max(0, spannedMins - offsetMins - mins)
  const hasFollowingEntry = Object.values(entries).some(candidate =>
    candidate.day === entry.day &&
    parseTime(candidate.timeIn) === parseTime(entry.timeOut) &&
    (viewMode.value === 'room'
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

/* ── Empty state check ── */
const roomHasNoEntries = computed(() => {
  if (!selectedRoom.value) return false
  return !Object.values(entries).some(v => v.room === selectedRoom.value)
})

/* ── Load data ── */
async function loadScheduleData() {
  loading.value = true
  try {
    const termId = getSelectedTermId()
    const scheduleQuery = termId ? `?academicTermId=${encodeURIComponent(termId)}` : ''
    const payload = await apiRequest(`/schedules${scheduleQuery}`)

    // If admin is viewing a specific teacher, also fetch substitute assignments for today
    if (viewMode.value === 'teacher' && selectedTeacher.value && selectedTeacherId.value) {
      try {
        const dateStr = new Date().toLocaleDateString('en-CA')
        const substituteQuery = new URLSearchParams({ date: dateStr, teacherId: selectedTeacherId.value })
        if (termId) substituteQuery.set('academicTermId', termId)
        const subs = await apiRequest(`/substitutes?${substituteQuery.toString()}`)
        const assignments = Array.isArray(subs.assignments) ? subs.assignments : []
        if (assignments.length) {
          assignments.forEach((a) => {
            const adate = new Date(a.date)
            const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][adate.getDay()]
            const original = a.originalTeacher || {}
            const substitute = a.substituteTeacher || {}
            const substituteName = substitute.name || `${substitute.firstName || ''} ${substitute.lastName || ''}`.trim()
            const originalName = `${original.firstName || ''} ${original.lastName || ''}`.trim()
            const selectedName = selectedTeacher.value || substituteName || originalName || 'Substitute'
            ;(a.entries || []).forEach((e) => {
              const isSelectedSubstitute = selectedTeacherId.value && String(substitute._id || substitute.id || '') === String(selectedTeacherId.value)
              payload.entries = payload.entries || []
              payload.entries.push({
                id: e.id || null,
                day: dayName,
                timeIn: e.timeIn,
                timeOut: e.timeOut,
                subject: e.subject || 'Substitute class',
                room: e.room || '',
                section: e.section || '',
                year: e.year || '',
                entryType: e.entryType || 'class',
                teacher: selectedName,
                tableLabel: selectedName,
                campus: e.campus || '',
                color: e.color || 'color-gray',
                parallel: Boolean(e.parallel),
                parallelGroupId: e.parallelGroupId || '',
                parallelCount: Number(e.parallelCount || 1),
                parallelSlots: Array.isArray(e.parallelSlots) ? e.parallelSlots.map((slot) => ({ ...slot })) : [],
                originalTeacherName: originalName,
                substituteTeacherName: substituteName,
                subbedLabel: isSelectedSubstitute
                  ? `SUBBED TO ${originalName || 'ORIGINAL TEACHER'}`
                  : `SUBBED BY ${substituteName || 'SUBSTITUTE TEACHER'}`,
                isSubstitute: true,
              })
            })
          })
        }
      } catch (_err) {
        // continue silently if substitutes fetch fails
      }
    }

    syncEntriesFromApi(payload.entries)
  } catch (_) {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadTermContext()
  await applyRouteContext()
  await ensureTermSelection()
  await loadScheduleData()
})

/* ── Print (color-coded, 30-min intervals) ── */
function printSchedule() {
  const isRoom = viewMode.value === 'room'
  if (isRoom && !selectedRoom.value) return
  if (!isRoom && !selectedTeacher.value) return

  const title = isRoom
    ? `Room ${selectedRoom.value} \u2014 Weekly Schedule`
    : `Prof. ${selectedTeacher.value} \u2014 Weekly Schedule`
  const termInfo = selectedTermLabel.value ? `Term: ${selectedTermLabel.value}` : ''
  const printedOn = `Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`
  const sub = isRoom
    ? [selectedFloor.value, termInfo, printedOn].filter(Boolean).join(' \u2022 ')
    : [termInfo, printedOn].filter(Boolean).join(' \u2022 ')

  const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const SLOTS = [
    '7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
    '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM',
    '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM',
    '4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM',
  ]
  const colorMap = {
    'color-green':  { bg: '#1f6b45', fg: '#ffffff' },
    'color-yellow': { bg: '#e9c46a', fg: '#5a3e00' },
    'color-orange': { bg: '#f4a261', fg: '#5a2d00' },
    'color-blue':   { bg: '#4a90d9', fg: '#ffffff' },
    'color-gray':   { bg: '#626c76', fg: '#ffffff' },
    'color-purple': { bg: '#7b5ea7', fg: '#ffffff' },
    'color-red':    { bg: '#e63946', fg: '#ffffff' },
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
  const filteredEntries = Object.values(entries).filter(v =>
    isRoom ? v.room === selectedRoom.value : v.teacher === selectedTeacher.value
  )
  const filteredConsultations = isRoom ? [] : consultationSlots.value
  function entriesAt(si, day) {
    const from = slotMins[si]
    const to   = si + 1 < slotMins.length ? slotMins[si + 1] : from + 30
    return filteredEntries.filter(v => {
      if (v.day !== day) return false
      const t = toMins(v.timeIn)
      return t >= from && t < to
    })
  }
  function rowspanFor(entry) {
    const startMins = toMins(entry.timeIn)
    const endMins   = toMins(entry.timeOut)
    const si = slotMins.findIndex((m, i) => {
      const next = i + 1 < slotMins.length ? slotMins[i + 1] : m + 30
      return startMins >= m && startMins < next
    })
    if (si < 0) return 1
    let span = 1
    for (let i = si + 1; i < SLOTS.length; i++) { if (slotMins[i] >= endMins) break; span++ }
    return Math.max(1, span)
  }
  function consultRowspanFor(consult) {
    if (!consult?.startTime || !consult?.endTime) return 1
    const startMins = toMins(consult.startTime)
    const endMins   = toMins(consult.endTime)
    const si = slotMins.findIndex((m, i) => {
      const next = i + 1 < slotMins.length ? slotMins[i + 1] : m + 30
      return startMins >= m && startMins < next
    })
    if (si < 0) return 1
    let span = 1
    for (let i = si + 1; i < SLOTS.length; i++) { if (slotMins[i] >= endMins) break; span++ }
    return Math.max(1, span)
  }
  function entryContent(entry, entriesForSlot = []) {
    const allEntries = entriesForSlot.length ? entriesForSlot : [entry]
    const sectionRows = allEntries
      .filter(item => item.section || item.room || item.year)
      .map(item => {
        const pieces = [
          item.section,
          !isRoom ? item.room : '',
          item.year,
        ].filter(Boolean)
        return pieces.length ? `<span class="e-section">${esc(pieces.join(' · '))}</span>` : ''
      })
      .join('')
    if (entry.entryType === 'lunch') {
      return `<span class="e-subject e-main">Lunch Break</span><span class="e-time">${esc(entry.timeIn)} – ${esc(entry.timeOut)}</span>`
    }
    return isRoom
      ? `<span class="e-teacher">${esc(entry.teacher || '—')}</span><span class="e-subject e-main">${esc(entry.subject || 'Schedule')}</span><span class="e-time">${esc(entry.timeIn)} – ${esc(entry.timeOut)}</span>${sectionRows}`
      : `<span class="e-subject e-main">${esc(entry.subject || 'Schedule')}</span><span class="e-time">${esc(entry.timeIn)} – ${esc(entry.timeOut)}</span>${sectionRows}`
  }
  const occupied = Array.from({ length: SLOTS.length }, () => Array(DAYS.length).fill(false))
  let bodyHTML = ''
  for (let si = 0; si < SLOTS.length; si++) {
    const isHalf = SLOTS[si].includes(':30')
    bodyHTML += `<tr${isHalf ? ' class="half"' : ''}>`
    bodyHTML += `<td class="time-col${isHalf ? ' tc-half' : ''}">${esc(SLOTS[si])}</td>`
    for (let di = 0; di < DAYS.length; di++) {
      if (occupied[si][di]) continue
      const matched = entriesAt(si, DAYS[di])
      if (matched.length > 0) {
        const rs = rowspanFor(matched[0])
        for (let r = 1; r < rs; r++) { if (si + r < SLOTS.length) occupied[si + r][di] = true }
        const e = matched[0]
        const clr = colorMap[e.color] || { bg: '#eef1fb', fg: '#1a1a2e' }
        bodyHTML += `<td class="entry-cell" rowspan="${rs}" style="--entry-bg:${clr.bg};--entry-fg:${clr.fg};">${entryContent(e, matched)}</td>`
      } else if (!isRoom) {
        const consult = filteredConsultations.find(c => {
          if (c.dayOfWeek !== DAYS[di]) return false
          const start = toMins(c.startTime)
          const end = toMins(c.endTime)
          return start >= slotMins[si] && start < (si + 1 < slotMins.length ? slotMins[si + 1] : slotMins[si] + 30) && end > start
        })
        if (consult) {
          const rs = consultRowspanFor(consult)
          for (let r = 1; r < rs; r++) { if (si + r < SLOTS.length) occupied[si + r][di] = true }
          const clr = { bg: '#4a90d9', fg: '#ffffff' }
          const content = `<span class="e-teacher">Consultation</span><span class="e-subject">${esc(consult.startTime)} – ${esc(consult.endTime)}</span>`
          bodyHTML += `<td class="entry-cell" rowspan="${rs}" style="--entry-bg:${clr.bg};--entry-fg:${clr.fg};">${content}</td>`
        } else {
          bodyHTML += `<td class="${isHalf ? 'ec-half' : 'ec'}"></td>`
        }
      } else {
        bodyHTML += `<td class="${isHalf ? 'ec-half' : 'ec'}"></td>`
      }
    }
    bodyHTML += '</tr>'
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page{size:landscape;margin:10mm;}*{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:14px 18px;font-size:11px;background:#fff;}
  h2{font-size:15px;font-weight:700;margin-bottom:3px;color:#4b5563;}
  .sub{font-size:10px;color:#666;margin-bottom:12px;}
  table{width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid #cfd6df;}
  th{background:#4b5563;color:#fff;padding:7px 6px;text-align:center;font-size:10px;font-weight:600;border:1px solid #0d2a20;}
  th.time-hdr{width:66px;}
  tbody tr{height:44px;min-height:44px;max-height:44px;}
  td{border:1px solid #dde;vertical-align:top;}
  tr.half td{border-top:1px dashed #e0e0e0;}
  td.time-col{background:#f0f2fa;font-size:9.5px;font-weight:700;color:#4b5563;text-align:center;padding:4px 2px;vertical-align:middle;}
  td.time-col.tc-half{background:#f6f7f9;color:#444;}
  td.ec{background:#fafbff;padding:0;}
  td.ec-half{background:#f9fafb;padding:0;}
  td.entry-cell{position:relative;background:var(--entry-bg);color:var(--entry-fg);padding:9px 10px;vertical-align:top;border:4px solid #fff;border-radius:9px;box-shadow:inset 0 -1px rgba(0,0,0,.08);overflow:hidden;}
  td span{display:block;line-height:1.45;}
  .e-teacher{font-weight:700;font-size:10px;}
  .e-subject{font-size:9px;font-weight:700;margin-top:1px;}
  .e-main{font-size:10px;line-height:1.25;font-weight:800;}
  .e-section{font-size:9.5px;font-weight:600;margin-top:2px;}
  .e-time{font-size:8.7px;opacity:.92;margin-top:2px;}
</style>
<style>body,td,th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}td.entry-cell span{color:inherit!important;}</style>
</head><body>
<h2>${esc(title)}</h2>
<p class="sub">${esc(sub)}</p>
<table><thead><tr><th class="time-hdr">Time</th>${DAYS.map(d=>`<th>${esc(d)}</th>`).join('')}</tr></thead>
<tbody>${bodyHTML}</tbody></table>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`
  const w = window.open('', '_blank', 'width=1100,height=800')
  w.document.write(html)
  w.document.close()
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
  width: 96px; height: 96px;
  border-radius: 50%; overflow: hidden;
  margin-bottom: 10px; border: 3px solid #c4c9cd;
}
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
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.header-left { display: flex; flex-direction: column; gap: 4px; max-width: 780px; }
.header-right { flex-shrink: 0; padding-top: 4px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.term-banner { color: #334155; font-size: 0.95rem; font-weight: 600; }
.page-eyebrow {
  color: #707c85;
  font-size: .63rem;
  font-weight: 750;
  letter-spacing: .11em;
  line-height: 1;
  text-transform: uppercase;
}
.page-title {
  margin-top: 8px;
  color: #1f2933;
  font-size: clamp(2rem, 3vw, 2.65rem);
  font-weight: 500;
  letter-spacing: -.04em;
  line-height: 1.08;
}
.page-sub {
  max-width: 760px;
  margin-top: 9px;
  color: #66727c;
  font-size: .94rem;
  line-height: 1.55;
}

/* Breadcrumb */
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.bc-btn {
  background: none; border: none; font-family: inherit;
  font-size: 0.83rem; color: #9ca3af; font-weight: 500;
  cursor: pointer; padding: 0; transition: color 0.15s;
  text-decoration: underline; text-underline-offset: 2px;
}
.bc-btn:hover { color: #4b5563; }
.bc-active { color: #4b5563 !important; text-decoration: none; cursor: default; }
.bc-current {
  font-size: 0.83rem; font-weight: 700; color: #4b5563;
}

/* Icon button */
.icon-btn {
  background: linear-gradient(145deg, #eef6ff, #d8eaff);
  border: 1px solid #9fc4ee;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  color: #2f7ed8;
  display: flex; align-items: center;
  box-shadow: 0 3px 8px rgba(47, 126, 216, 0.12), inset 0 1px rgba(255,255,255,0.8);
  transition: border-color 0.15s, color 0.15s, background 0.15s, transform 0.15s;
}
.icon-btn:hover {
  border-color: #6ea8e8;
  color: #1f6ec4;
  background: linear-gradient(145deg, #f6fbff, #cfe5ff);
  transform: translateY(-1px);
}

/* ── Mode selection ── */
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
  display: flex; align-items: center; justify-content: center;
  color: #4b5563;
}
.mode-label { font-size: 1.1rem; font-weight: 700; color: #4b5563; }
.mode-desc { font-size: 0.85rem; color: #888; text-align: center; line-height: 1.4; }

/* ── Teacher grid ── */
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
.teacher-grid {
  display: grid;
  /* Responsive grid: auto-fit columns with a sensible min width for cards */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  width: 100%;
  max-width: 1200px;
}
.teacher-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px;
  min-height: 180px; padding: 20px 16px;
  width: 100%; box-sizing: border-box;
  min-width: 0;
  background: #fff; border: 1.5px solid #e0e0e0; border-radius: 16px;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.teacher-card:hover { border-color: #9ca3af; background: #f8fafc; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(83, 91, 100,0.14); }
.teacher-avatar-img {
  width: 88px; height: 88px; border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dfe2e4;
  box-shadow: 0 4px 12px rgba(48, 53, 58, 0.12);
}
.teacher-avatar {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, #4b5563, #9ca3af);
  color: #fff; font-size: 1.15rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: 0.03em;
}
.teacher-name { font-size: 0.95rem; font-weight: 600; color: #4b5563; text-align: center; line-height: 1.3; }
.small-empty-state {
  padding: 18px 20px; border-radius: 12px;
  background: #f4f5f5; border: 1px dashed #cfe3d8;
  color: #5d7a6d;
}

@media (max-width: 900px) {
  .teacher-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .teacher-grid { grid-template-columns: 1fr; }
}

/* ── Step containers ── */
.step-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.step-hint {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

/* Floor grid */
.floor-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  /* Stack floor cards vertically to avoid overflow/overlap when cards are full-width */
  flex-direction: column;
}
.floor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 220px;
  min-height: 190px;
  padding: 32px 24px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  font-family: inherit;
}
.floor-card:hover {
  border-color: #9ca3af;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(83, 91, 100,0.15);
}
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
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4b5563, #9ca3af);
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.floor-label {
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
}
.floor-room-count {
  font-size: 0.78rem;
  color: #888;
}

/* Room grid */
.room-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.room-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 155px;
  min-height: 140px;
  padding: 20px 14px;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.18s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  font-family: inherit;
}
.room-card:hover {
  border-color: #9ca3af;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(83, 91, 100,0.14);
}
.room-card-comlab {
  border-color: #c5e1f9;
  background: #f0f8ff;
}
.room-card-comlab:hover {
  border-color: #4a90d9;
  background: #e8f4ff;
}
.room-card-icon { color: #4b5563; opacity: 0.5; }
.room-card-comlab .room-card-icon { color: #4a90d9; }
.room-card-number {
  font-size: 1rem;
  font-weight: 700;
  color: #4b5563;
  text-align: center;
}
.room-card-floor {
  font-size: 0.72rem;
  color: #888;
}

/* ── Schedule Card ── */
.schedule-card {
  background: #eef1f2;
  border: 1px solid rgba(255,255,255,.88);
  border-radius: 18px;
  box-shadow: 0 14px 34px rgba(38,46,52,.11), inset 0 1px 0 #fff;
  padding: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.sched-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid #d7dde1;
  border-radius: 17px 17px 0 0;
  background: linear-gradient(135deg,#fff,#eceff0);
  box-shadow: inset 0 1px 0 #fff;
  flex-wrap: wrap;
}
.sched-topbar-left { min-width: 0; flex: 1; }
.sched-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  border: 1px solid #d3dade;
  border-radius: 11px;
  background: #eef1f2;
}
.sched-grid-title {
  display: flex;
  align-items: center;
  color: #252d33;
  font-size: 1.3rem;
  font-weight: 750;
  line-height: 1.25;
  letter-spacing: -.025em;
  margin: 0 0 4px;
}
.sched-grid-title svg { width: 19px; height: 19px; flex: 0 0 19px; margin-right: 9px !important; }
.sched-grid-sub { color: #707b83; font-size: .72rem; font-weight: 500; margin: 0; }
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
  font: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, transform .16s ease;
}
.schedule-back-btn:hover {
  color: #202a31;
  border-color: #939fa7;
  background: #fff;
  transform: translateX(-2px);
}
.schedule-back-btn:focus-visible {
  outline: 3px solid rgba(49,70,83,.18);
  outline-offset: 2px;
}
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

/* Loading / Empty */
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ca3af;
  font-size: 0.9rem;
  padding: 40px 0;
  justify-content: center;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #aaa;
  font-size: 0.9rem;
  text-align: center;
}
.empty-state strong { color: #555; }

/* Grid */
.sched-grid-wrap {
  width: 100%;
  overflow-x: auto;
  margin: 0;
  padding: 18px;
  position: relative;
  background: #eef1f2;
  border: 0;
  border-radius: 0 0 17px 17px;
  box-shadow: none;
}
.sched-grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  min-width: 800px;
  overflow: hidden;
  border: 1px solid #ccd4d9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 16px rgba(39,47,53,.06);
}
.sched-grid th {
  height: 48px;
  background: #424c55;
  color: #fff;
  font-size: .75rem;
  font-weight: 750;
  letter-spacing: .01em;
  padding: 11px 9px;
  text-align: center;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  text-shadow: 0 1px rgba(0, 0, 0, 0.22);
}
.sched-grid thead th:first-child {
  border-radius: 12px 0 0;
}
.sched-grid thead th:last-child {
  border-radius: 0 12px 0 0;
  border-right: 0;
}
.th-time {
  width: 90px;
  position: sticky;
  left: 0;
  z-index: 20;
  background: #424c55;
}
.sched-grid tbody tr { height: 44px; }
.sched-grid tbody tr.half-hour .td-time {
  background: #f7f8f9;
}
.sched-grid tbody tr.half-hour td { border-top: 1px dashed #dfe4e7; }
.sched-grid td {
  border-width: 0 1px 1px 0;
  border-style: solid;
  border-color: #e0e4e7;
  padding: 0;
  vertical-align: top;
  position: relative;
}
.sched-grid td.td-time {
  overflow: visible;
  background: #f7f8f9;
  text-align: center;
  vertical-align: middle;
  font-size: .66rem;
  color: #536069;
  font-weight: 750;
  white-space: nowrap;
  border-width: 0 1px 1px 0;
  border-style: solid;
  border-color: #e0e4e7;
  border-right-color: #cfd6da;
  position: sticky;
  left: 0;
  z-index: 15;
  width: 90px;
  padding: 0 6px;
  box-shadow: none;
}
.td-cell {
  padding: 0;
  position: relative;
  background: #fff;
  transition: background 0.15s ease;
}
.td-cell.has-entry { padding: 0; }
.time-row:hover .td-time {
  background: #f7f8f9;
}
.time-row:hover .td-cell:not(.has-entry) {
  background: #f8f9fa;
}

/* Entry card */
.consult-cell {
  background: #f4f9ff;
}
.consult-entry {
  border: 1px solid rgba(74, 144, 217, 0.28);
  box-shadow: inset 0 0 0 1px rgba(74, 144, 217, 0.16);
}
.sched-entry {
  position: absolute;
  top: 4px; left: 4px; right: 4px;
  border-radius: 7px;
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: default;
  border: 0;
  box-shadow: 0 3px 8px rgba(30,39,44,.14);
}
.sched-entry-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
}
.sched-entry-clickable:hover,
.sched-entry-clickable:focus-visible {
  filter: brightness(1.04);
  transform: none;
  box-shadow: 0 6px 14px rgba(30,39,44,.18);
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: -3px;
}
.subbed-badge {
  position: relative;
  width: 100%;
  flex: 0 0 auto;
  padding: 3px 6px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 5px;
  background: #b42318;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.04em;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}
.sched-entry:has(.subbed-badge) .entry-teacher,
.sched-entry:has(.subbed-badge) .entry-subject {
  padding-right: 0;
}
.entry-teacher {
  display: -webkit-box;
  overflow: hidden;
  font-size: .72rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.entry-subject {
  display: -webkit-box;
  overflow: hidden;
  font-size: .67rem;
  opacity: 0.92;
  line-height: 1.3;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.entry-time-range {
  font-size: .62rem; opacity: 0.82; font-style: normal; font-weight: 550; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.entry-section-rows {
  display: flex; flex-direction: column; gap: 2px;
  margin-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.25);
  padding-top: 4px;
}
.entry-section-row {
  display: flex; align-items: center; gap: 4px;
}
.entry-section-badge {
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.9;
  background: rgba(255,255,255,0.24); padding: 2px 6px; border-radius: 5px;
}
.entry-room {
  font-size: 0.72rem; opacity: 0.75;
  text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 56px;
}

/* Entry colors */
.free-time-cell {
  position: relative;
  vertical-align: middle !important;
  background: linear-gradient(135deg, rgba(238, 232, 255, 0.88), rgba(245, 241, 255, 0.74)) !important;
}
.free-time-cell:hover {
  background: linear-gradient(135deg, rgba(230, 220, 255, 0.94), rgba(240, 235, 255, 0.82)) !important;
}
.free-time-label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0 6px;
  color: #6d28d9;
  font-size: 0.78rem;
  font-weight: 750;
  line-height: 1.2;
  text-align: center;
  pointer-events: none;
}
.color-green  { background: #1f6b45; color: #fff; }
.color-yellow { background: #e9c46a; color: #5a3e00; }
.color-orange { background: #f4a261; color: #5a2d00; }
.color-blue   { background: #4a90d9; color: #fff; }
.color-gray   { background: #626c76; color: #ffffff; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }

/* ═══ Logout Modal ═══ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.schedule-details-overlay {
  background: rgba(22, 28, 34, 0.54);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  padding: 20px;
}
.schedule-details-modal {
  position: relative;
  width: min(600px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  border: 1px solid #dfe4ea;
  border-radius: 22px;
  background: #ffffff;
  padding: 28px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}
.schedule-modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 1;
  width: 44px;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: #f8fafc;
  color: #475569;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}
.schedule-modal-close:hover {
  border-color: #cbd5e1;
  background: #eef2f7;
  color: #111827;
}
.schedule-modal-teacher {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 66px;
  margin: 0 58px 18px 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 0 18px;
}
.schedule-modal-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #334155;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 900;
  text-transform: uppercase;
}
.schedule-modal-teacher span:not(.schedule-modal-avatar) {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.schedule-modal-teacher strong {
  display: block;
  margin-top: 3px;
  color: #20262d;
  font-size: 1.02rem;
  line-height: 1.18;
  overflow-wrap: anywhere;
}
.schedule-modal-focus {
  position: relative;
  margin-bottom: 16px;
  border: 1px solid #dde4ec;
  border-left: 5px solid #334155;
  border-radius: 18px;
  background: #f8fafc;
  padding: 22px 24px 20px;
}
.schedule-focus-kicker {
  display: flex;
  align-items: center;
  min-height: 26px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.schedule-modal-focus h2 {
  max-width: 94%;
  margin: 0;
  color: #20262d;
  font-size: clamp(1.5rem, 2.35vw, 1.95rem);
  line-height: 1.12;
  letter-spacing: -0.04em;
}
.schedule-focus-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 18px;
}
.schedule-focus-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  border: 1px solid #dbe3eb;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  padding: 7px 13px;
  font-size: 0.92rem;
  font-weight: 800;
}
.schedule-modal-subbed {
  display: inline-block;
  padding: 6px 11px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.schedule-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 11px;
}
.schedule-detail-grid-minimal {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.schedule-detail-item {
  display: flex;
  min-width: 0;
  min-height: 76px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #ffffff;
  padding: 14px 15px;
}
.schedule-detail-item span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.schedule-detail-item strong {
  overflow-wrap: anywhere;
  color: #232a32;
  font-size: 0.95rem;
  line-height: 1.25;
}
.schedule-detail-wide {
  grid-column: 1 / -1;
  min-height: 72px;
}
@media (max-width: 520px) {
  .schedule-details-modal {
    border-radius: 22px;
    padding: 28px 20px 22px;
  }
  .schedule-modal-teacher {
    margin-right: 48px;
    align-items: flex-start;
  }
  .schedule-modal-focus {
    padding: 20px 18px;
  }
  .schedule-detail-grid { grid-template-columns: 1fr; }
  .schedule-detail-wide { grid-column: auto; }
}
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
  background: #4b5563; color: #fff; border: none;
  font-family: inherit; font-size: 1rem; font-weight: 600;
  padding: 10px 32px; border-radius: 10px; cursor: pointer;
}
.logout-confirm-btn:hover { background: #6b7280; }
</style>
