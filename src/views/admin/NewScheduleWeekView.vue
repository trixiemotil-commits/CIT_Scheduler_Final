 <template>
  <div class="layout">
    <!-- ═══ SIDEBAR ═══ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=47" alt="Admin" class="avatar" />
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

    <!-- ═══ MAIN ═══ -->
    <main class="main">
      <header class="main-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/admin/schedule')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Schedule
          </button>
          <div>
            <h1 class="page-title">New Schedule Week</h1>
            <p class="page-sub">Add one or more schedule entries for the week</p>
          </div>
        </div>
      </header>

      <div class="nsw-body">
        <!-- ── Left: form card ── -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-card-badge">{{ savedCount }} Added This Session</div>
            <h2 class="form-card-title">Schedule Entry</h2>
            <p class="form-card-sub">Fill in all fields then click Add</p>
          </div>

          <div class="sched-form">
            <!-- Day -->
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
            <!-- Time In -->
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
            <!-- Time Out -->
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
            <!-- Section (not parallel only) -->
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
            <!-- Teacher -->
            <div class="form-row-inline">
              <label class="form-label">Teacher</label>
              <div class="form-select-wrap">
                <select v-model="form.teacher" class="form-select">
                  <option value="" disabled>Select Teacher</option>
                  <option v-for="t in teacherOptions" :key="t" :value="t">{{ t }}</option>
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
            <!-- Room (not parallel) -->
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
            <!-- Parallel: section count + pairs -->
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
              <button class="parallel-btn" :class="{ active: form.parallel }" @click="form.parallel = true">
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

          <div class="form-actions">
            <button class="reset-btn" @click="resetForm">Reset</button>
            <button
              class="add-btn"
              @click="addEntry"
              :disabled="!form.day || !form.timeIn || !form.timeOut || !form.teacher || !form.subject"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add to Schedule
            </button>
          </div>

          <!-- Success flash -->
          <transition name="flash">
            <div v-if="showFlash" class="flash-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Entry added!
            </div>
          </transition>
        </div>

        <!-- ── Right: week mini-grid ── -->
        <div class="preview-card">
          <div class="preview-header">
            <h2 class="preview-title">Week Preview</h2>
            <div class="sched-select-wrap">
              <select class="sched-select" v-model="previewYear">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
              <svg class="sched-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="preview-grid-wrap">
            <table class="sched-grid">
              <thead>
                <tr>
                  <th class="th-time">Time</th>
                  <th v-for="day in days" :key="day">{{ day }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slot in timeSlots" :key="slot">
                  <td class="td-time">{{ slot }}</td>
                  <template v-for="day in days" :key="day">
                    <td
                      v-if="!isSpannedCell(slot, day)"
                      :rowspan="getEntriesForCell(slot, day).length ? getRowspan(getEntriesForCell(slot, day)[0]) : 1"
                      class="td-cell"
                      :class="{ 'has-entry': getEntriesForCell(slot, day).length }"
                    >
                      <template v-if="getEntriesForCell(slot, day).length">
                        <div class="sched-entry" :class="getEntriesForCell(slot, day)[0].color">
                          <div class="entry-teacher">{{ getEntriesForCell(slot, day)[0].teacher }}</div>
                          <div class="entry-subject">{{ getEntriesForCell(slot, day)[0].subject }}</div>
                          <div class="entry-section-rows">
                            <div v-for="e in getEntriesForCell(slot, day)" :key="e._key" class="entry-section-row">
                              <span class="entry-section-badge">{{ e.section }}</span>
                              <span class="entry-room">{{ e.room }}</span>
                            </div>
                          </div>
                          <div class="entry-time-range">{{ getEntriesForCell(slot, day)[0].slot }}</div>
                        </div>
                      </template>
                      <template v-else>
                        <span class="click-to-add"></span>
                      </template>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- Logout Modal -->
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
import { ref, reactive, computed, watch } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { logout } from '@/auth.js'
import {
  entries, years, sections, days, timeSlots, timeOptions,
  teacherOptions, subjectOptions, roomOptions,
  colorForRoom, getRowspan, parseTime,
} from '@/composables/useSchedule.js'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

/* ── Nav ── */
const navItems = [
  { name: 'Dashboard',    to: '/admin/dashboard', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { name: 'Schedule',     to: '/admin/schedule',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { name: 'Teachers',     to: '/admin/teachers',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { name: 'Events',       to: '/admin/events',    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>` },
  { name: 'Manage Users', to: '/admin/users',     icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { name: 'Settings',     to: '/admin/settings',  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

/* ── Preview year filter ── */
const previewYear = ref(years[0])

/* ── Form state ── */
const savedCount = ref(0)
const showFlash  = ref(false)

const form = reactive({
  day: '', timeIn: '', timeOut: '',
  year: years[0], section: sections[0],
  teacher: '', subject: '', room: '',
  parallel: false, parallelCount: 2,
  parallelSlots: [{ section: '', room: '' }, { section: '', room: '' }],
})

function buildSlots(count) {
  return Array.from({ length: count }, () => ({ section: '', room: '' }))
}

watch(() => form.parallelCount, (val) => {
  while (form.parallelSlots.length < val)  form.parallelSlots.push({ section: '', room: '' })
  while (form.parallelSlots.length > val)  form.parallelSlots.pop()
})

function resetForm() {
  form.day = ''; form.timeIn = ''; form.timeOut = ''
  form.year = years[0]; form.section = sections[0]
  form.teacher = ''; form.subject = ''; form.room = ''
  form.parallel = false; form.parallelCount = 2
  form.parallelSlots.splice(0, form.parallelSlots.length, ...buildSlots(2))
}

/* ── Grid helpers ── */
function getEntriesForCell(rowHour, day) {
  return Object.entries(entries)
    .filter(([k]) => {
      const parts = k.split('|')
      return parts.length >= 4 &&
             parts[3] === day &&
             parts[2].startsWith(rowHour) &&
             parts[0] === previewYear.value
    })
    .map(([k, v]) => ({ ...v, _key: k }))
}

function isSpannedCell(slot, day) {
  const slotIndex = timeSlots.indexOf(slot)
  if (slotIndex <= 0) return false
  for (let i = 0; i < slotIndex; i++) {
    const prev = getEntriesForCell(timeSlots[i], day)
    if (prev.length > 0 && i + getRowspan(prev[0]) > slotIndex) return true
  }
  return false
}

/* ── Add entry ── */
function addEntry() {
  if (!form.day || !form.timeIn || !form.timeOut || !form.teacher || !form.subject) return

  const slot = `${form.timeIn} - ${form.timeOut}`
  const d = new Date()
  const addedAt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  if (form.parallel) {
    const groupId = `pg_${Date.now()}`
    form.parallelSlots.forEach((ps) => {
      const color = colorForRoom(ps.room) ?? 'color-green'
      const key = `${form.year}|${ps.section}|${slot}|${form.day}`
      entries[key] = {
        teacher: form.teacher, subject: form.subject,
        room: ps.room, year: form.year, section: ps.section, slot,
        timeIn: form.timeIn, timeOut: form.timeOut,
        parallel: true, parallelGroupId: groupId,
        parallelCount: form.parallelCount,
        parallelSlots: form.parallelSlots.map(s => ({ ...s })),
        color, addedAt,
      }
    })
  } else {
    const color = colorForRoom(form.room) ?? 'color-green'
    entries[`${form.year}|${form.section}|${slot}|${form.day}`] = {
      teacher: form.teacher, subject: form.subject,
      room: form.room, year: form.year, section: form.section, slot,
      timeIn: form.timeIn, timeOut: form.timeOut,
      parallel: false, parallelGroupId: null,
      parallelCount: 1, parallelSlots: [], color, addedAt,
    }
  }

  savedCount.value++
  previewYear.value = form.year
  resetForm()
  showFlash.value = true
  setTimeout(() => { showFlash.value = false }, 2200)
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
.layout {
  display: flex; height: 100vh; overflow: hidden;
  background: #f5f6f8; font-family: 'Poppins', sans-serif;
}

/* Sidebar (same as ScheduleView) */
.sidebar {
  width: 280px; min-width: 280px; background: #fff;
  border-right: 1px solid #ececec;
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 18px 24px; height: 100vh; overflow-y: auto;
}
.sidebar-profile { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 28px; text-align: center; }
.avatar-wrap { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; margin-bottom: 10px; border: 3px solid #c8ddd4; }
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
.role   { font-size: 0.88rem; color: #444; font-weight: 500; }
.email  { font-size: 0.82rem; color: #888; word-break: break-all; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 400; color: #444; text-decoration: none; transition: background 0.18s, color 0.18s; }
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }
.logout-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 12px; background: #e63946; color: #fff; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: background 0.2s; margin-top: 16px; }
.logout-btn:hover { background: #c1121f; }

/* Main */
.main { flex: 1; padding: 40px 44px 32px; overflow-y: auto; min-width: 0; display: flex; flex-direction: column; }
.main-header { margin-bottom: 24px; }
.header-left { display: flex; flex-direction: column; gap: 8px; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: 1px solid #ddd; border-radius: 8px;
  padding: 6px 14px; font-size: 0.82rem; color: #555;
  font-family: inherit; cursor: pointer; transition: all 0.15s; width: fit-content;
}
.back-btn:hover { border-color: #1b4332; color: #1b4332; background: #f0faf3; }
.page-title { font-size: 2rem; font-weight: 600; color: #1b4332; letter-spacing: -0.5px; line-height: 1.2; }
.page-sub   { font-size: 0.95rem; color: #777; margin-top: 4px; }

/* Two-column layout */
.nsw-body {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

/* Form card */
.form-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 28px 28px 24px;
  display: flex; flex-direction: column;
  overflow-y: auto;
}
.form-card-header { margin-bottom: 20px; }
.form-card-badge {
  display: inline-block;
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 3px 10px; border-radius: 20px;
  background: #e8f5ee; color: #1b4332; margin-bottom: 6px;
}
.form-card-title { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0 0 3px; }
.form-card-sub   { font-size: 0.84rem; color: #888; margin: 0; }

.sched-form { display: flex; flex-direction: column; gap: 13px; margin-bottom: 20px; }
.form-row-inline { display: grid; grid-template-columns: 100px 1fr; align-items: center; gap: 12px; }
.form-label { font-size: 0.95rem; font-weight: 700; color: #111; }
.form-select-wrap { position: relative; display: flex; align-items: center; }
.form-select { width: 100%; appearance: none; border: 1px solid #ccc; border-radius: 10px; padding: 9px 34px 9px 14px; font-size: 0.88rem; font-family: inherit; color: #333; background: #fff; cursor: pointer; outline: none; transition: border-color 0.15s; }
.form-select:focus { border-color: #40916c; }
.sel-arrow { position: absolute; right: 12px; pointer-events: none; color: #666; }

.parallel-slot-divider { font-size: 0.78rem; font-weight: 700; color: #40916c; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 0 2px; border-top: 1px solid #e8f5ee; margin-top: 4px; }
.parallel-row { display: flex; align-items: center; gap: 24px; margin-top: 4px; }
.parallel-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; font-family: inherit; font-size: 0.92rem; font-weight: 500; color: #444; cursor: pointer; padding: 0; transition: color 0.15s; }
.parallel-btn.active { color: #1b4332; font-weight: 600; }
.par-radio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #bbb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, border-color 0.15s; }
.par-radio.checked { background: #1b4332; border-color: #1b4332; }

.form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.reset-btn { background: none; border: 1px solid #ccc; border-radius: 8px; padding: 8px 16px; font-family: inherit; font-size: 0.85rem; color: #666; cursor: pointer; transition: all 0.15s; }
.reset-btn:hover { border-color: #999; color: #333; }
.add-btn { display: flex; align-items: center; gap: 6px; background: #1b4332; color: #fff; border: none; font-family: inherit; font-size: 0.88rem; font-weight: 600; padding: 10px 22px; border-radius: 10px; cursor: pointer; transition: background 0.18s; }
.add-btn:hover:not(:disabled) { background: #2d6a4f; }
.add-btn:disabled { opacity: 0.5; cursor: default; }

.flash-msg { display: flex; align-items: center; gap: 8px; background: #d8f3dc; color: #1b4332; border-radius: 8px; padding: 10px 16px; font-size: 0.88rem; font-weight: 600; margin-top: 14px; }
.flash-enter-active, .flash-leave-active { transition: opacity 0.3s; }
.flash-enter-from, .flash-leave-to { opacity: 0; }

/* Preview card */
.preview-card {
  background: #fff; border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 24px 24px 20px;
  display: flex; flex-direction: column; overflow: hidden;
}
.preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.preview-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }

.sched-select-wrap { position: relative; display: flex; align-items: center; }
.sched-select { appearance: none; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 7px 32px 7px 12px; font-size: 0.85rem; font-family: inherit; color: #333; cursor: pointer; outline: none; }
.sched-select:focus { border-color: #40916c; }
.sched-select-arrow { position: absolute; right: 10px; pointer-events: none; color: #666; }

.preview-grid-wrap { flex: 1; overflow: auto; }
.sched-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
.sched-grid th { background: #1b4332; color: #fff; font-size: 0.78rem; font-weight: 600; padding: 10px 6px; text-align: center; white-space: nowrap; }
.th-time { width: 90px; }
.sched-grid td { border: 1px solid #ececec; padding: 0; vertical-align: middle; height: 56px; }
.td-time { background: #fff; text-align: center; font-size: 0.72rem; color: #555; font-weight: 500; white-space: nowrap; border: 1px solid #ececec; }
.td-cell { position: relative; }
.sched-entry { margin: 0; position: absolute; inset: 3px; border-radius: 7px; padding: 5px 7px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.entry-teacher { font-size: 0.72rem; font-weight: 700; }
.entry-subject { font-size: 0.65rem; opacity: 0.9; }
.entry-section-rows { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 3px; }
.entry-section-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.entry-section-badge { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; opacity: 0.9; }
.entry-room { font-size: 0.6rem; opacity: 0.75; text-align: right; }
.entry-time-range { font-size: 0.58rem; opacity: 0.7; font-style: italic; margin-top: 2px; }
.click-to-add { display: block; }

.color-green  { background: #1b4332; color: #fff; }
.color-yellow { background: #e9c46a; color: #5a3e00; }
.color-blue   { background: #4a90d9; color: #fff; }
.color-purple { background: #7b5ea7; color: #fff; }
.color-red    { background: #e63946; color: #fff; }

/* Logout modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.logout-modal-box { background: #fff; border-radius: 20px; padding: 36px 40px 32px; width: 360px; max-width: 94vw; display: flex; flex-direction: column; align-items: center; gap: 10px; box-shadow: 0 16px 48px rgba(0,0,0,0.18); text-align: center; }
.logout-modal-icon { width: 68px; height: 68px; border-radius: 50%; background: #ffeaea; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 6px; width: 100%; }
.logout-cancel-btn  { background: none; border: none; font-family: inherit; font-size: 1rem; font-weight: 600; color: #e63946; cursor: pointer; padding: 8px 18px; border-radius: 10px; }
.logout-cancel-btn:hover  { background: #ffeaea; }
.logout-confirm-btn { background: #1b4332; color: #fff; border: none; font-family: inherit; font-size: 1rem; font-weight: 600; padding: 10px 32px; border-radius: 10px; cursor: pointer; }
.logout-confirm-btn:hover { background: #2d6a4f; }
</style>
