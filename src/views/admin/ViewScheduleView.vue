<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
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
        <div class="header-left">
          <div v-if="viewMode" class="breadcrumb">
            <button class="bc-btn" @click="resetAll">View Schedules</button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <template v-if="viewMode === 'room'">
              <button class="bc-btn" :class="{ 'bc-active': !selectedFloor }" @click="selectedFloor = null; selectedRoom = null">By Room</button>
              <template v-if="selectedFloor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                <button class="bc-btn" :class="{ 'bc-active': !selectedRoom }" @click="selectedRoom = null">{{ selectedFloor }}</button>
              </template>
              <template v-if="selectedRoom">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="bc-current">Room {{ selectedRoom }}</span>
              </template>
            </template>
            <template v-else-if="viewMode === 'teacher'">
              <button class="bc-btn" :class="{ 'bc-active': !selectedTeacher }" @click="selectedTeacher = null">By Teacher</button>
              <template v-if="selectedTeacher">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="bc-current">Prof. {{ selectedTeacher }}</span>
              </template>
            </template>
          </div>
          <h1 class="page-title">
            <template v-if="!viewMode">View Schedules</template>
            <template v-else-if="viewMode === 'room'">{{ selectedRoom ? `Room ${selectedRoom}` : selectedFloor ? selectedFloor : 'By Room' }}</template>
            <template v-else-if="viewMode === 'teacher'">{{ selectedTeacher ? `Prof. ${selectedTeacher}` : 'By Teacher' }}</template>
          </h1>
          <p class="page-sub">
            <template v-if="!viewMode">Browse schedules by room or by teacher</template>
            <template v-else-if="viewMode === 'room'">{{ selectedRoom ? 'Weekly room schedule — read only' : selectedFloor ? 'Select a room to view its schedule' : 'Choose a floor to see available rooms' }}</template>
            <template v-else-if="viewMode === 'teacher'">{{ selectedTeacher ? 'Weekly teacher schedule — read only' : 'Select a teacher to view their schedule' }}</template>
          </p>
        </div>
      </header>

      <!-- ── Mode Selection ── -->
      <div v-if="!viewMode" class="mode-select-container">
        <p class="step-hint">Choose how you want to view schedules</p>
        <div class="mode-grid">
          <button class="mode-card" @click="viewMode = 'room'">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div class="mode-label">By Room</div>
            <div class="mode-desc">Select a floor and room to see its weekly schedule</div>
          </button>
          <button class="mode-card" @click="viewMode = 'teacher'; loadTeachers()">
            <div class="mode-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="mode-label">By Teacher</div>
            <div class="mode-desc">Select a teacher to see their full weekly schedule</div>
          </button>
        </div>
      </div>

      <!-- ── BY ROOM ── -->
      <template v-else-if="viewMode === 'room'">
        <!-- Step 1: Floor -->
        <div v-if="!selectedFloor" class="step-container">
          <p class="step-hint">Choose a floor to see available rooms</p>
          <div class="floor-grid">
            <button v-for="floor in floors" :key="floor.label" class="floor-card" @click="selectedFloor = floor.label">
              <div class="floor-number">{{ floor.number }}</div>
              <div class="floor-label">{{ floor.label }}</div>
              <div class="floor-room-count">{{ floor.rooms.length }} rooms</div>
            </button>
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
            <div class="sched-topbar-left">
              <h2 class="sched-grid-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
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
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
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
                    <td v-if="!isSpannedRoomCell(slot, day)" :rowspan="getEntriesForRoomCell(slot, day).length ? getRoomRowspan(getEntriesForRoomCell(slot, day)[0]) : 1" class="td-cell" :class="{ 'has-entry': getEntriesForRoomCell(slot, day).length }">
                      <template v-if="getEntriesForRoomCell(slot, day).length">
                        <div class="sched-entry" :class="getEntriesForRoomCell(slot, day)[0].color" :style="roomEntryStyle(slot, getEntriesForRoomCell(slot, day)[0])">
                          <div class="entry-teacher">{{ getEntriesForRoomCell(slot, day)[0].teacher }}</div>
                          <div class="entry-subject">{{ getEntriesForRoomCell(slot, day)[0].subject }}</div>
                          <div class="entry-time-range">{{ getEntriesForRoomCell(slot, day)[0].slot }}</div>
                          <div class="entry-section-rows">
                            <div v-for="e in getEntriesForRoomCell(slot, day)" :key="e._key" class="entry-section-row">
                              <span class="entry-section-badge">{{ e.section }}</span>
                            </div>
                          </div>
                        </div>
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
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
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
              <button v-for="teacher in filteredTeacherList" :key="teacher.name" class="teacher-card" @click="selectedTeacher = teacher.name">
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
            <div class="sched-topbar-left">
              <h2 class="sched-grid-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
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
            <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="2.5"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
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
                    :class="{ 'has-entry': getEntriesForTeacherCell(slot, day).length, 'consult-cell': !getEntriesForTeacherCell(slot, day).length && !!getConsultationForTeacherCell(slot, day) }"
                  >
                      <template v-if="getEntriesForTeacherCell(slot, day).length">
                        <div class="sched-entry" :class="getEntriesForTeacherCell(slot, day)[0].color" :style="roomEntryStyle(slot, getEntriesForTeacherCell(slot, day)[0])">
                          <div class="entry-teacher">{{ getEntriesForTeacherCell(slot, day)[0].subject }}</div>
                          <div class="entry-subject">{{ getEntriesForTeacherCell(slot, day)[0].slot }}</div>
                          <div class="entry-section-rows">
                            <div v-for="e in getEntriesForTeacherCell(slot, day)" :key="e._key" class="entry-section-row">
                              <span class="entry-section-badge">{{ e.section }}</span>
                              <span class="entry-room">{{ e.room }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else-if="getConsultationForTeacherCell(slot, day)">
                        <div class="sched-entry color-blue consult-entry" :style="consultEntryStyle(slot, getConsultationForTeacherCell(slot, day))">
                          <div class="entry-teacher">Consultation</div>
                          <div class="entry-subject">{{ getConsultationForTeacherCell(slot, day).startTime }} – {{ getConsultationForTeacherCell(slot, day).endTime }}</div>
                        </div>
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

/* 30-minute grid slots (matches AddScheduleView) */
const timeSlots30 = timeOptions

const showLogoutModal = ref(false)
const loading = ref(false)
const consultationSlots = ref([])

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
  { name: 'Teachers',       to: '/admin/teachers',        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events',         to: '/admin/events',          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Manage Users',   to: '/admin/users',           icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
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

const selectedFloor = ref(null)
const selectedRoom  = ref(null)
const roomSearchQuery = ref('')

/* ── View Mode ── */
const viewMode         = ref(null)   // null | 'room' | 'teacher'
const selectedTeacher  = ref(null)
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

async function loadTeachers() {
  if (teacherList.value.length) return
  loadingTeachers.value = true
  try {
    const res = await apiRequest('/users?role=teacher')
    if (res.users && Array.isArray(res.users)) {
      teacherList.value = res.users
        .filter(u => u.role === 'Teacher')
        .map(u => {
          const name = `${u.firstName} ${u.lastName}`.trim()
          return {
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
    const res = await apiRequest(`/consultations?teacher=${encodeURIComponent(selectedTeacher.value)}`)
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
  const offsetMins   = consultStart - rowStart
  return {
    top:    (offsetMins / 30) * ROW_HEIGHT + 3 + 'px',
    height: Math.max(24, (mins / 30) * ROW_HEIGHT - 6) + 'px',
  }
}

const teacherHasNoEntries = computed(() => {
  if (!selectedTeacher.value) return false
  return !Object.values(entries).some(v => v.teacher === selectedTeacher.value)
})

const currentFloorRooms = computed(
  () => floors.find(f => f.label === selectedFloor.value)?.rooms ?? []
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
    const tableLabel = entry.tableLabel || entry.teacher
    const section = entry.section
    const day = entry.day
    const slot = `${entry.timeIn} - ${entry.timeOut}`
    if (!tableLabel || !section || !day || !entry.timeIn || !entry.timeOut) return
    const key = `${tableLabel}|${section}|${slot}|${day}`
    const inferredCampus = inferCampus(entry)
    const roomBasedColor = colorForRoom(entry.room)
    entries[key] = {
      teacher: entry.teacher,
      subject: entry.subject,
      campus: inferredCampus,
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
      parallelSlots: Array.isArray(entry.parallelSlots) ? entry.parallelSlots.map(s => ({ ...s })) : [],
      color: inferredCampus === 'Main Campus' ? 'color-orange' : (roomBasedColor || entry.color || 'color-green'),
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

const ROW_HEIGHT = 40
function roomEntryStyle(rowHour, entry) {
  if (!entry?.timeIn || !entry?.timeOut) return {}
  const rowStart   = parseTime(rowHour)
  const entryStart = parseTime(entry.timeIn)
  const mins       = Math.max(1, parseTime(entry.timeOut) - entryStart)
  const offsetMins = entryStart - rowStart
  return {
    top:    (offsetMins / 30) * ROW_HEIGHT + 3 + 'px',
    height: Math.max(24, (mins / 30) * ROW_HEIGHT - 6) + 'px',
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
    const payload = await apiRequest('/schedules')
    syncEntriesFromApi(payload.entries)
  } catch (_) {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(loadScheduleData)

/* ── Print (color-coded, 30-min intervals) ── */
function printSchedule() {
  const isRoom = viewMode.value === 'room'
  if (isRoom && !selectedRoom.value) return
  if (!isRoom && !selectedTeacher.value) return

  const title = isRoom
    ? `Room ${selectedRoom.value} \u2014 Weekly Schedule`
    : `Prof. ${selectedTeacher.value} \u2014 Weekly Schedule`
  const sub = isRoom
    ? `${selectedFloor.value} \u2022 Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`
    : `Printed on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`

  const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const SLOTS = [
    '7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
    '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM',
    '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM',
    '4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM',
  ]
  const colorMap = {
    'color-green':  { bg: '#1b4332', fg: '#ffffff' },
    'color-yellow': { bg: '#e9c46a', fg: '#5a3e00' },
    'color-orange': { bg: '#f4a261', fg: '#5a2d00' },
    'color-blue':   { bg: '#4a90d9', fg: '#ffffff' },
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
        const content = isRoom
          ? `<span class="e-teacher">${esc(e.teacher)}</span><span class="e-subject">${esc(e.subject)}</span><span class="e-section">${esc(e.section)}</span><span class="e-time">${esc(e.timeIn)}\u2013${esc(e.timeOut)}</span>`
          : `<span class="e-subject">${esc(e.subject)}</span><span class="e-section">${esc(e.section)} \u00b7 ${esc(e.room)}</span><span class="e-time">${esc(e.timeIn)}\u2013${esc(e.timeOut)}</span>`
        bodyHTML += `<td rowspan="${rs}" style="background:${clr.bg};color:${clr.fg};padding:4px 5px;vertical-align:top;">${content}</td>`
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
          bodyHTML += `<td rowspan="${rs}" style="background:${clr.bg};color:${clr.fg};padding:4px 5px;vertical-align:top;">${content}</td>`
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
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:11px;}
  h2{font-size:15px;font-weight:700;margin-bottom:3px;color:#1b4332;}
  .sub{font-size:10px;color:#666;margin-bottom:12px;}
  table{width:100%;border-collapse:collapse;table-layout:fixed;}
  th{background:#1b4332;color:#fff;padding:7px 6px;text-align:center;font-size:10px;font-weight:600;border:1px solid #0d2a20;}
  th.time-hdr{width:66px;}
  td{border:1px solid #dde;vertical-align:top;}
  tr.half td{border-top:1px dashed #e0e0e0;}
  td.time-col{background:#f0f2fa;font-size:9.5px;font-weight:700;color:#1b4332;text-align:center;padding:4px 2px;vertical-align:middle;}
  td.time-col.tc-half{background:#f6f7f9;color:#444;}
  td.ec{background:#fafbff;padding:0;}
  td.ec-half{background:#f9fafb;padding:0;}
  td span{display:block;line-height:1.45;}
  .e-teacher{font-weight:700;font-size:10px;}
  .e-subject{font-size:9px;font-style:italic;opacity:.9;margin-top:1px;}
  .e-section{font-size:9.5px;font-weight:600;margin-top:2px;}
  .e-time{font-size:8.5px;opacity:.7;margin-top:2px;}
</style>
<style>body,td,th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}td span{color:#fff!important;opacity:1!important;}</style>
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
  margin-bottom: 10px; border: 3px solid #c8ddd4;
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
  text-decoration: none; cursor: pointer;
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
.main-header {
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.header-left { display: flex; flex-direction: column; gap: 4px; }
.header-right { flex-shrink: 0; padding-top: 4px; }
.page-title { font-size: 2rem; font-weight: 600; color: #1b4332; letter-spacing: -0.5px; line-height: 1.2; }
.page-sub   { font-size: 0.95rem; color: #777; margin-top: 2px; }

/* Breadcrumb */
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.bc-btn {
  background: none; border: none; font-family: inherit;
  font-size: 0.83rem; color: #40916c; font-weight: 500;
  cursor: pointer; padding: 0; transition: color 0.15s;
  text-decoration: underline; text-underline-offset: 2px;
}
.bc-btn:hover { color: #1b4332; }
.bc-active { color: #1b4332 !important; text-decoration: none; cursor: default; }
.bc-current {
  font-size: 0.83rem; font-weight: 700; color: #1b4332;
}

/* Icon button */
.icon-btn {
  background: none; border: 1px solid #ddd;
  border-radius: 8px; padding: 6px 10px;
  cursor: pointer; color: #555;
  display: flex; align-items: center;
  transition: border-color 0.15s, color 0.15s;
}
.icon-btn:hover { border-color: #40916c; color: #1b4332; }

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
.mode-card:hover { border-color: #40916c; background: #f0faf3; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(64,145,108,0.15); }
.mode-icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #e8f5e9, #d4edda);
  display: flex; align-items: center; justify-content: center;
  color: #1b4332;
}
.mode-label { font-size: 1.1rem; font-weight: 700; color: #1b4332; }
.mode-desc { font-size: 0.85rem; color: #888; text-align: center; line-height: 1.4; }

/* ── Teacher grid ── */
.teacher-search-wrap {
  display: flex; align-items: center; gap: 10px;
  width: min(420px, 100%);
  padding: 12px 14px;
  border: 1.5px solid #dce8e1;
  border-radius: 999px;
  background: #f8fcfa;
  margin-bottom: 16px;
}
.teacher-search-icon { color: #40916c; flex-shrink: 0; }
.teacher-search-input {
  border: none; outline: none; background: transparent;
  width: 100%; font-size: 0.95rem; color: #1b4332; font-family: inherit;
}
.teacher-grid {
  display: grid;
  /* Keep search results in their normal three-column slots instead of stretching. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 1200px;
  width: 100%;
}
.teacher-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px;
  min-height: 230px; padding: 24px 18px;
  background: #fff; border: 1.5px solid #e0e0e0; border-radius: 16px;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.teacher-card:hover { border-color: #40916c; background: #f0faf3; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(64,145,108,0.14); }
.teacher-avatar-img {
  width: 88px; height: 88px; border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dfeee6;
  box-shadow: 0 4px 12px rgba(27, 67, 50, 0.12);
}
.teacher-avatar {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, #1b4332, #40916c);
  color: #fff; font-size: 1.15rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: 0.03em;
}
.teacher-name { font-size: 0.95rem; font-weight: 600; color: #1b4332; text-align: center; line-height: 1.3; }
.small-empty-state {
  padding: 18px 20px; border-radius: 12px;
  background: #f8fcfa; border: 1px dashed #cfe3d8;
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
  border-color: #40916c;
  background: #f0faf3;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64,145,108,0.15);
}
.floor-number {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1b4332, #40916c);
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
  color: #1b4332;
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
  border-color: #40916c;
  background: #f0faf3;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(64,145,108,0.14);
}
.room-card-comlab {
  border-color: #c5e1f9;
  background: #f0f8ff;
}
.room-card-comlab:hover {
  border-color: #4a90d9;
  background: #e8f4ff;
}
.room-card-icon { color: #1b4332; opacity: 0.5; }
.room-card-comlab .room-card-icon { color: #4a90d9; }
.room-card-number {
  font-size: 1rem;
  font-weight: 700;
  color: #1b4332;
  text-align: center;
}
.room-card-floor {
  font-size: 0.72rem;
  color: #888;
}

/* ── Schedule Card ── */
.schedule-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 28px 28px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.sched-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.sched-topbar-left { min-width: 0; }
.sched-topbar-right { display: flex; align-items: center; gap: 10px; }
.sched-grid-title { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 4px; }
.sched-grid-sub   { font-size: 0.84rem; color: #888; margin: 0; }

/* Loading / Empty */
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #40916c;
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
  margin-top: 8px;
  position: relative;
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
  width: 90px;
  position: sticky;
  left: 0;
  z-index: 20;
  background: #1b4332;
}
.sched-grid tbody tr { height: 40px; }
.sched-grid tbody tr.half-hour .td-time {
  background: #f4f5f6;
}
.sched-grid tbody tr.half-hour td { border-top: 1px dashed #eee; }
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
  font-size: 0.78rem;
  color: #1b4332;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #ececec;
  position: sticky;
  left: 0;
  z-index: 15;
  width: 90px;
  padding: 0 6px;
}
.td-cell {
  padding: 0;
  position: relative;
}
.td-cell.has-entry { padding: 0; }

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
  top: 3px; left: 3px; right: 3px;
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: default;
}
.entry-teacher {
  font-size: 0.88rem; font-weight: 700; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.entry-subject {
  font-size: 0.8rem; opacity: 0.9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.entry-time-range {
  font-size: 0.72rem; opacity: 0.75; font-style: italic; margin-top: 1px;
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
  background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 3px;
}
.entry-room {
  font-size: 0.72rem; opacity: 0.75;
  text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 56px;
}

/* Entry colors */
.color-green  { background: #1b4332; color: #fff; }
.color-yellow { background: #e9c46a; color: #5a3e00; }
.color-orange { background: #f4a261; color: #5a2d00; }
.color-blue   { background: #4a90d9; color: #fff; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }

/* ═══ Logout Modal ═══ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
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
  background: #1b4332; color: #fff; border: none;
  font-family: inherit; font-size: 1rem; font-weight: 600;
  padding: 10px 32px; border-radius: 10px; cursor: pointer;
}
.logout-confirm-btn:hover { background: #2d6a4f; }
</style>
