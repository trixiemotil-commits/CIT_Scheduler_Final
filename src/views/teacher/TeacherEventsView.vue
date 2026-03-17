
<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
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

    <main class="main">
      <header class="main-header">
        <div>
          <h1 class="page-title">Events</h1>
          <p class="page-sub">View school events posted by admin</p>
        </div>
      </header>



      <!-- Events Grid -->
      <div class="events-grid">
        <div v-for="ev in events" :key="ev.id" class="event-card event-card--clickable" @click="openViewEvent(ev)">
          <div v-if="ev.image" class="event-card-img-wrap">
            <img :src="ev.image" class="event-card-img" alt="" />
          </div>
          <div class="event-card-head">
            <span class="event-badge event-badge--active">Active</span>
          </div>
          <div class="event-card-title">{{ ev.title }}</div>
          <div class="event-card-desc">{{ ev.description }}</div>
          <div class="event-card-meta">
            <span class="event-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ ev.date }}
            </span>
            <span class="event-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ ev.time }}
            </span>
            <span class="event-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ ev.location }}
            </span>
          </div>
        </div>
        <div v-if="!events.length" class="events-empty">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>No events available.</span>
        </div>
      </div>

    </main>

    <!-- View Event Modal -->
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="ev-view-box" v-if="viewEvent">
          <div class="ev-view-hero">
            <div class="ev-view-hero-overlay"></div>
            <div class="ev-view-hero-content">
              <span :class="['ev-view-badge', viewEvent.status === 'active' ? 'ev-view-badge--active' : 'ev-view-badge--archived']">
                <svg v-if="viewEvent.status === 'active'" width="9" height="9" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                {{ viewEvent.status === 'active' ? 'Active' : 'Archived' }}
              </span>
              <h2 class="ev-view-title">{{ viewEvent.title }}</h2>
            </div>
            <button class="ev-view-close" @click="showViewModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ev-view-body">
            <div class="ev-view-info-row">
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--date">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Date</span>
                  <span class="ev-view-info-val">{{ viewEvent.date ? formatDisplayDate(viewEvent.date) : '—' }}</span>
                </div>
              </div>
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--time">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Time</span>
                  <span class="ev-view-info-val">{{ viewEvent.time ? formatDisplayTime(viewEvent.time) : '—' }}</span>
                </div>
              </div>
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--loc">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Location</span>
                  <span class="ev-view-info-val">{{ viewEvent.location || '—' }}</span>
                </div>
              </div>
            </div>
            <div v-if="viewEvent.description" class="ev-view-desc-wrap">
              <div class="ev-view-desc-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                Description
              </div>
              <p class="ev-view-desc">{{ viewEvent.description }}</p>
            </div>
            <div class="ev-view-actions">
              <button class="ev-view-close-btn" @click="showViewModal = false">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
import { getUser, logout } from '@/auth.js'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}

const navItems = [
  {
    name: 'Dashboard', to: '/teacher/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/teacher/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Events', to: '/teacher/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Consultation', to: '/teacher/consultation',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    name: 'Settings', to: '/teacher/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

// TODO: Replace with API call to fetch admin events
const events = ref([
  { id: 1, title: 'Faculty Meeting', description: 'Quarterly faculty alignment and planning meeting.', date: '2026-03-10', time: '09:00', location: 'Room 301', status: 'active' },
  { id: 2, title: 'CIT Foundation Day', description: 'Annual celebration of the CIT founding anniversary.', date: '2026-03-15', time: '08:00', location: 'Auditorium', status: 'active' },
  { id: 3, title: 'Enrollment Period', description: 'Regular enrollment for the upcoming semester.', date: '2026-04-01', time: '07:00', location: 'Registrar Office', status: 'active' }
])

const eventsTab = ref('active')
const activeEvents = computed(() => events.value.filter(e => e.status === 'active'))
const archivedEvents = computed(() => events.value.filter(e => e.status === 'archived'))

const showViewModal = ref(false)
const viewEvent = ref(null)

function openViewEvent(ev) {
  viewEvent.value = ev
  showViewModal.value = true
}

function formatDisplayDate(date) {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDisplayTime(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

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

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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

.nav-item:hover {
  background: #f0faf3;
  color: #1b4332;
}

.nav-item.active {
  background: #1b4332;
  color: #fff;
}

.nav-item.active .nav-icon {
  color: #fff;
}

.nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

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

.logout-btn:hover {
  background: #c1121f;
}

.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

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

/* ═══ EVENTS SECTION ═══ */
.events-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.events-tabs { display: flex; gap: 6px; }
.ev-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 10px;
  transition: background 0.18s, color 0.18s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ev-tab:hover  { background: #f0faf3; color: #1b4332; }
.ev-tab.active { background: #1b4332; color: #fff; }
.ev-tab-count {
  background: #e63946;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 20px;
  padding: 1px 7px;
  line-height: 1.5;
}

/* Events Grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 1100px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px)  { .events-grid { grid-template-columns: 1fr; } }

.event-card {
  background: #fff;
  border-radius: 16px;
  padding: 22px 24px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s;
}
.event-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.11); }
.event-card--archived { opacity: 0.75; }
.event-card--archived:hover { opacity: 1; }

.event-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.event-badge {
  font-size: 0.73rem;
  font-weight: 600;
  padding: 3px 11px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.event-badge--active   { background: #d8f3e8; color: #1b7a4a; }
.event-badge--archived { background: #f0f0f0; color: #888; }

.event-card-title { font-size: 1.05rem; font-weight: 700; color: #111; line-height: 1.3; }
.event-card-desc  { font-size: 0.84rem; color: #777; line-height: 1.5; }
.event-card-meta  { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.event-meta-item  { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #555; }

.events-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 60px 20px;
  color: #bbb;
  font-size: 0.88rem;
}

.event-card-img-wrap {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 2px;
  flex-shrink: 0;
}
.event-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.event-card:hover .event-card-img { transform: scale(1.03); }

.event-card--clickable { cursor: pointer; }
.event-card--clickable:hover {
  box-shadow: 0 6px 24px rgba(27,67,50,0.13);
  transform: translateY(-2px);
  transition: box-shadow 0.2s, transform 0.2s;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ═══ VIEW EVENT MODAL ═══ */
.ev-view-box {
  background: #fff;
  border-radius: 22px;
  width: 540px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.22);
  display: flex;
  flex-direction: column;
  animation: evModalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
@keyframes evModalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
.ev-view-hero {
  position: relative;
  height: 230px;
  background: linear-gradient(135deg, #1b4332 0%, #52b788 100%);
  background-size: cover;
  background-position: center;
  border-radius: 22px 22px 0 0;
  flex-shrink: 0;
  overflow: hidden;
}
.ev-view-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%);
}
.ev-view-hero-content {
  position: absolute;
  bottom: 22px;
  left: 26px;
  right: 58px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ev-view-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
  backdrop-filter: blur(4px);
}
.ev-view-badge--active   { background: rgba(64,145,108,0.88); color: #fff; }
.ev-view-badge--archived { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.35); }
.ev-view-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
  margin: 0;
  letter-spacing: -0.3px;
}
.ev-view-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(6px);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 2;
}
.ev-view-close:hover { background: rgba(230,57,70,0.75); }

.ev-view-body { padding: 26px 28px 28px; display: flex; flex-direction: column; gap: 20px; }

.ev-view-info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ev-view-info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  background: #f7f8fa;
  border: 1.5px solid #f0f0f0;
  border-radius: 14px;
  padding: 14px 16px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.ev-view-info-item:hover { border-color: #c8ddd4; box-shadow: 0 2px 10px rgba(27,67,50,0.07); }

.ev-view-info-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ev-view-info-icon--date { background: #e0f2fe; color: #0369a1; }
.ev-view-info-icon--time { background: #fef3c7; color: #b45309; }
.ev-view-info-icon--loc  { background: #fce7f3; color: #be185d; }
.ev-view-info-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ev-view-info-label { font-size: 0.68rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.6px; }
.ev-view-info-val   { font-size: 0.9rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ev-view-desc-wrap { background: #f7f8fa; border: 1.5px solid #f0f0f0; border-radius: 14px; padding: 16px 20px; }
.ev-view-desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 10px;
}
.ev-view-desc { font-size: 0.92rem; color: #444; line-height: 1.7; margin: 0; }

.ev-view-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
  border-top: 1.5px solid #f0f0f0;
  margin-top: 2px;
}
.ev-view-close-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.ev-view-close-btn:hover { background: #f5f5f5; border-color: #bbb; color: #333; }

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

.logout-cancel-btn:hover {
  background: #ffeaea;
}

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

.logout-confirm-btn:hover {
  background: #2d6a4f;
}

@media (max-width: 900px) {
  .main {
    padding: 20px 16px 32px;
  }

  .sidebar {
    width: 200px;
    min-width: 200px;
  }
}
</style>
