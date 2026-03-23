<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
      </div>

      <!-- Nav -->
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

      <!-- Logout -->
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
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="page-sub">Manage schedules, rooms, and teacher assignments</p>
        </div>
        <div class="notif-wrap" v-click-outside="() => showNotif = false">
          <button class="notif-btn" @click="showNotif = !showNotif">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="notif-dot"></span>
          </button>

          <!-- Notification Dropdown -->
          <div v-if="showNotif" class="notif-panel">
            <div class="notif-panel-header">
              <span class="notif-panel-title">Notifications</span>
            </div>
            <div class="notif-tabs">
              <button :class="['notif-tab', { active: notifTab === 'all' }]" @click="notifTab = 'all'">All</button>
              <button :class="['notif-tab', { active: notifTab === 'unread' }]" @click="notifTab = 'unread'">Unread</button>
              <span class="notif-see-all">See all</span>
            </div>

            <div class="notif-list-wrap">
              <!-- New section -->
              <template v-if="newNotifs.length">
                <div class="notif-section-label">New</div>
                <ul class="notif-list">
                  <li v-for="n in newNotifs" :key="n.id" class="notif-item">
                    <img :src="n.avatar" class="notif-avatar" alt="" />
                    <span class="notif-text">{{ n.message }}</span>
                    <span v-if="!n.read" class="notif-unread-dot"></span>
                  </li>
                </ul>
              </template>

              <!-- Today section -->
              <template v-if="todayNotifs.length">
                <div class="notif-section-label">Today</div>
                <ul class="notif-list">
                  <li v-for="n in todayNotifs" :key="n.id" class="notif-item">
                    <img :src="n.avatar" class="notif-avatar" alt="" />
                    <span class="notif-text">{{ n.message }}</span>
                    <span v-if="!n.read" class="notif-unread-dot"></span>
                  </li>
                </ul>
              </template>

              <div v-if="!newNotifs.length && !todayNotifs.length" class="notif-empty">
                No notifications
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Dashboard Content ── -->

      <!-- Stat Cards -->
      <section class="stat-cards">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-top">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-icon" v-html="stat.icon"></span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div v-if="stat.sub" class="stat-sub">{{ stat.sub }}</div>
        </div>
      </section>

      <!-- Charts -->
      <section class="charts-row">
        <!-- Consultation Trends -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'line', 'chart-hidden': expandedChart === 'bar' }">
          <div class="chart-header">
            <span class="chart-title">Consultation Trends</span>
            <button class="expand-btn" @click="toggleExpand('line')">
              <svg v-if="expandedChart === 'line'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="chart-wrap"><canvas ref="lineChartRef"></canvas></div>
        </div>

        <!-- Teacher Workload -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'bar', 'chart-hidden': expandedChart === 'line' }">
          <div class="chart-header">
            <span class="chart-title">Teacher Workload</span>
            <button class="expand-btn" @click="toggleExpand('bar')">
              <svg v-if="expandedChart === 'bar'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="chart-wrap"><canvas ref="barChartRef" style="cursor:pointer"></canvas></div>
        </div>
      </section>

    </main>

    <!-- ═══ Teacher Workload Modal ═══ -->
    <Teleport to="body">
      <div v-if="showWorkloadModal" class="modal-overlay" @click.self="showWorkloadModal = false">
        <div class="modal-box">
          <!-- Close -->
          <button class="modal-close" @click="showWorkloadModal = false">✕</button>

          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Teacher Workload Details</h2>
            <p class="modal-sub">View their complete schedule breakdown</p>
          </div>

          <template v-if="selectedTeacher">
            <!-- Teacher identity -->
            <div class="modal-teacher-row">
              <img :src="selectedTeacher.avatar" class="modal-teacher-avatar" alt="" />
              <div class="modal-teacher-info">
                <span class="modal-teacher-name">{{ selectedTeacher.name }}</span>
              </div>
              <span class="modal-hours-badge">{{ selectedTeacher.totalHours }} Hours/Week</span>
            </div>

            <!-- Schedule cards grid -->
            <div class="modal-schedule-grid">
              <div v-for="(sc, i) in selectedTeacher.schedule" :key="i" class="modal-sched-card">
                <div class="modal-sched-top">
                  <span class="modal-day-badge">{{ sc.day }}</span>
                  <span class="modal-sched-time">{{ sc.time }}</span>
                  <span class="modal-sched-dur">{{ sc.duration }}</span>
                </div>
                <div class="modal-sched-subject">{{ sc.subject }}</div>
                <div class="modal-sched-section">{{ sc.section }}</div>
              </div>
            </div>

            <!-- Summary -->
            <div class="modal-summary">
              <div class="modal-summary-label">Schedule Summary</div>
              <div class="modal-summary-stats">
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Classes</span>
                  <span class="modal-summary-val">{{ selectedTeacher.schedule.length }}</span>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Hours per Week</span>
                  <span class="modal-summary-val">{{ selectedTeacher.totalHours }}h</span>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Days Teaching</span>
                  <span class="modal-summary-val">{{ selectedTeacher.daysTeaching }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <!-- Icon -->
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
import { logout } from '@/auth.js'
import Chart from 'chart.js/auto'
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._clickOutside) }
}

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)

/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/admin/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Manage Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Stats ── */
const stats = [
  {
    label: 'Total Teachers', value: 24, sub: '',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    label: 'Available Rooms', value: 24, sub: 'Classrooms and labs',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
  },
  {
    label: 'Scheduled Classes', value: 42, sub: 'This week',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    label: 'Consultations', value: 42, sub: 'Per Week',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#40916c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  }
]

/* ── Notifications ── */
const showNotif = ref(false)
const notifTab = ref('all')
const notifications = ref([
  { id: 1, avatar: 'https://i.pravatar.cc/100?img=12', message: 'Prof. John has finished the class session.', read: false, group: 'new' },
  { id: 2, avatar: 'https://i.pravatar.cc/100?img=15', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 3, avatar: 'https://i.pravatar.cc/100?img=22', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 4, avatar: 'https://i.pravatar.cc/100?img=33', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
  { id: 5, avatar: 'https://i.pravatar.cc/100?img=44', message: 'Prof. John has finished the class session.', read: true,  group: 'today' },
])
const visibleNotifs = computed(() =>
  notifTab.value === 'unread' ? notifications.value.filter(n => !n.read) : notifications.value
)
const newNotifs   = computed(() => visibleNotifs.value.filter(n => n.group === 'new'))
const todayNotifs = computed(() => visibleNotifs.value.filter(n => n.group === 'today'))

/* ── Charts ── */
const lineChartRef = ref(null)
const barChartRef = ref(null)
const expandedChart = ref(null) // null | 'line' | 'bar'
let lineChartInstance = null
let barChartInstance = null

/* ── Workload Modal ── */
const showWorkloadModal = ref(false)
const selectedTeacher = ref(null)

const teacherWorkloads = [
  {
    name: 'Sir. Jhon', avatar: 'https://i.pravatar.cc/100?img=51',
    totalHours: 19, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '08:00-09:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section A' },
      { day: 'Monday',    time: '09:00-10:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section B' },
      { day: 'Tuesday',   time: '08:00-09:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section A' },
      { day: 'Wednesday', time: '10:00-11:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section B' },
    ]
  },
  {
    name: 'Maam. Aira', avatar: 'https://i.pravatar.cc/100?img=47',
    totalHours: 12, daysTeaching: 3,
    schedule: [
      { day: 'Monday',  time: '10:00-11:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section A' },
      { day: 'Tuesday', time: '13:00-14:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section B' },
      { day: 'Friday',  time: '08:00-09:00', duration: '1h', subject: 'UI/UX Design',    section: '3rd Year - Section A' },
    ]
  },
  {
    name: 'Sir. Gab', avatar: 'https://i.pravatar.cc/100?img=53',
    totalHours: 24, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section A' },
      { day: 'Tuesday',   time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section B' },
      { day: 'Wednesday', time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section A' },
      { day: 'Thursday',  time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Sir.Bads', avatar: 'https://i.pravatar.cc/100?img=57',
    totalHours: 19, daysTeaching: 4,
    schedule: [
      { day: 'Monday',   time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section A' },
      { day: 'Tuesday',  time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section B' },
      { day: 'Thursday', time: '13:00-14:00', duration: '1h', subject: 'Cybersecurity', section: '4th Year - Section A' },
    ]
  },
  {
    name: 'Maam. Daniella', avatar: 'https://i.pravatar.cc/100?img=44',
    totalHours: 9, daysTeaching: 2,
    schedule: [
      { day: 'Wednesday', time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section A' },
      { day: 'Friday',    time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section B' },
    ]
  },
  {
    name: 'Sir. Jolo', avatar: 'https://i.pravatar.cc/100?img=60',
    totalHours: 8, daysTeaching: 2,
    schedule: [
      { day: 'Tuesday',  time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section A' },
      { day: 'Thursday', time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Maam.Aj', avatar: 'https://i.pravatar.cc/100?img=35',
    totalHours: 11, daysTeaching: 3,
    schedule: [
      { day: 'Monday',   time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section A' },
      { day: 'Wednesday',time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section B' },
      { day: 'Friday',   time: '10:00-11:00', duration: '1h', subject: 'Research Methods',  section: '3rd Year - Section A' },
    ]
  },
]

function openWorkloadModal(index) {
  selectedTeacher.value = teacherWorkloads[index]
  showWorkloadModal.value = true
}

// Compact (5) vs full (7) bar chart datasets
const BAR_LABELS_SHORT = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella']
const BAR_DATA_SHORT   = [19, 12, 24, 19, 9]
const BAR_LABELS_FULL  = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella', 'Sir. Jolo', 'Maam.Aj']
const BAR_DATA_FULL    = [19, 12, 24, 19, 9, 8, 11]

function toggleExpand(which) {
  const isCollapsing = expandedChart.value === which
  expandedChart.value = isCollapsing ? null : which

  // Destroy both charts, let the DOM re-layout, then recreate so canvases
  // measure their new container size correctly.
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  if (barChartInstance)  { barChartInstance.destroy();  barChartInstance  = null }

  nextTick(() => {
    setTimeout(() => {
      createLineChart()
      createBarChart()
    }, 50)
  })
}

function createLineChart() {
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  lineChartInstance = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        data: [52, 43, 27, 47],
        borderColor: '#2d6a4f',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#2d6a4f',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.45,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Consultation : ${ctx.parsed.y}`
          },
          backgroundColor: '#fff',
          titleColor: '#333',
          bodyColor: '#1b9e5a',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#888', font: { size: 12 } } },
        y: {
          beginAtZero: true,
          max: 80,
          ticks: { stepSize: 20, color: '#888', font: { size: 12 } },
          grid: { color: '#f0f0f0' }
        }
      }
    }
  })
}

function createBarChart() {
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null }
  const expanded = expandedChart.value === 'bar'
  barChartInstance = new Chart(barChartRef.value, {
    type: 'bar',
    data: {
      labels: [...(expanded ? BAR_LABELS_FULL : BAR_LABELS_SHORT)],
      datasets: [{
        data: [...(expanded ? BAR_DATA_FULL : BAR_DATA_SHORT)],
        backgroundColor: '#2d6a4f',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Hours : ${ctx.parsed.y}`
          },
          backgroundColor: '#fff',
          titleColor: '#333',
          bodyColor: '#1b9e5a',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      onClick: (_e, elements) => {
        if (elements.length) openWorkloadModal(elements[0].index)
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#888', font: { size: 11 } } },
        y: {
          beginAtZero: true,
          max: expanded ? 28 : 24,
          ticks: { stepSize: 6, color: '#888', font: { size: 12 } },
          grid: { color: '#f0f0f0' }
        }
      }
    }
  })
}

onMounted(() => {
  createLineChart()
  createBarChart()
})

function handleLogout() {
  logout()
  router.push('/')
}

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

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1b4332;
}
.role {
  font-size: 0.88rem;
  color: #444;
  font-weight: 500;
}
.email {
  font-size: 0.82rem;
  color: #888;
  word-break: break-all;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 400;
  color: #444;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
}
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

/* Logout */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ═══ MAIN ═══ */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* Notification */
.notif-wrap {
  position: relative;
  padding-top: 6px;
}
.notif-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.notif-btn:hover { color: #1b4332; }
.notif-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 13px;
  height: 13px;
  background: #e8a020;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

/* Notification Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 540px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  z-index: 999;
  overflow: hidden;
}
.notif-panel-header {
  padding: 20px 20px 0;
}
.notif-panel-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
}
.notif-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 0;
}
.notif-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 20px;
  transition: background 0.18s, color 0.18s;
}
.notif-tab.active {
  background: #1b4332;
  color: #fff;
}
.notif-see-all {
  margin-left: auto;
  font-size: 0.82rem;
  color: #888;
  cursor: pointer;
  text-decoration: underline;
}
.notif-see-all:hover { color: #1b4332; }
.notif-section-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #333;
  padding: 12px 20px 6px;
}
.notif-list-wrap {
  max-height: 340px;
  overflow-y: auto;
  padding-bottom: 8px;
}
.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-empty {
  text-align: center;
  font-size: 0.85rem;
  color: #aaa;
  padding: 24px 20px;
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background 0.15s;
  cursor: pointer;
}
.notif-item:hover { background: #f7faf8; }
.notif-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.notif-text {
  flex: 1;
  font-size: 0.85rem;
  color: #333;
  line-height: 1.45;
}
.notif-unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #40916c;
  flex-shrink: 0;
}

/* Stat Cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  border-radius: 16px;
  padding: 26px 28px 22px;
  box-shadow: 0 4px 18px rgba(27,67,50,0.10);
  background: #fff;
  color: #1b4332;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 0.88rem;
  color: #888;
  font-weight: 400;
}
.stat-icon { display: flex; align-items: center; }
.stat-value {
  font-size: 2.8rem;
  font-weight: 600;
  color: #1b4332;
  line-height: 1.1;
}
.stat-sub {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 4px;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}
.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  min-height: 320px;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}
.chart-card.chart-expanded {
  grid-column: 1 / -1;
}
.chart-card.chart-hidden {
  display: none;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  display: flex;
  transition: color 0.2s;
}
.expand-btn:hover { color: #1b4332; }
.chart-wrap {
  flex: 1;
  min-height: 0;
  height: 260px;
  position: relative;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 36px 28px;
  width: 560px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}
.modal-close {
  position: absolute;
  top: 18px;
  right: 22px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #555;
  line-height: 1;
}
.modal-close:hover { color: #111; }
.modal-header { margin-bottom: 18px; }
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}
.modal-sub {
  font-size: 0.88rem;
  color: #888;
}
.modal-teacher-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-teacher-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #c8ddd4;
  flex-shrink: 0;
}
.modal-teacher-info { flex: 1; }
.modal-teacher-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
}
.modal-hours-badge {
  background: #52b788;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 6px 18px;
  border-radius: 20px;
  white-space: nowrap;
}
.modal-schedule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-sched-card {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 14px 16px;
}
.modal-sched-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.modal-day-badge {
  background: #e0f0ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.modal-sched-time {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-dur {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-subject {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}
.modal-sched-section {
  font-size: 0.82rem;
  color: #888;
}
.modal-summary {
  background: #52b788;
  border-radius: 14px;
  padding: 18px 22px;
  color: #fff;
}
.modal-summary-label {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 14px;
}
.modal-summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}
.modal-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.modal-summary-key {
  font-size: 0.78rem;
  opacity: 0.85;
}
.modal-summary-val {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

/* Logout Modal */
.logout-modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 360px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
}
.logout-modal-icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.logout-modal-sub {
  font-size: 0.9rem;
  color: #777;
  margin: 0 0 8px;
}
.logout-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 6px;
  width: 100%;
}
.logout-cancel-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #e63946;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  transition: background 0.15s;
}
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #1b4332;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.logout-confirm-btn:hover { background: #2d6a4f; }

/* Responsive */
@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .main { padding: 20px 16px 32px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .sidebar { width: 200px; min-width: 200px; }
}

</style>
