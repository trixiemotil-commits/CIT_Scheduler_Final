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
      <button class="logout-btn" @click="logoutAndLeave">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </aside>
    <main class="main">
      <header class="main-header">
        <div>
          <h1 class="page-title">
            <span class="page-title-kicker">Activity monitoring</span>
            <span class="page-title-main">Activity Logs</span>
          </h1>
          <p class="page-sub">Teacher and student actions recorded across the system</p>
        </div>
      </header>

      <section class="um-management-panel">
        <div class="um-topbar">
          <div class="um-view-tabs">
            <button v-for="option in roleOptions" :key="option.value" :class="['um-view-tab', roleFilter === option.value ? 'um-view-tab--on' : '']" @click="changeRoleFilter(option.value)">
              <svg v-if="option.value === ''" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              <svg v-else-if="option.value === 'teacher'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ option.label }}
            </button>
          </div>
          <div class="um-topbar-right">
            <div class="um-search-wrap">
              <span class="um-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input v-model.trim="searchQuery" class="um-search-input" type="search" placeholder="Search activity..." @keyup.enter="applyFilters" />
            </div>
            <button class="um-print-btn" type="button" @click="applyFilters" :disabled="loading">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>
          </div>
        </div>

        <div class="um-logs-container">
          <form class="um-search-panel" @submit.prevent="applyFilters">
            <label class="um-search-field">
              <span>Search activity</span>
              <input v-model.trim="searchQuery" type="search" placeholder="Name, email, action, IP or device" />
            </label>
            <label>
              <span>From date &amp; time</span>
              <SystemDateTimePicker v-model="fromDateTime" placeholder="Select start date & time" />
            </label>
            <label>
              <span>To date &amp; time</span>
              <SystemDateTimePicker v-model="toDateTime" placeholder="Select end date & time" />
            </label>
            <div class="um-search-actions">
              <button type="submit" class="um-apply-search" :disabled="loading">Search</button>
              <button type="button" class="um-clear-search" :disabled="loading || !hasAdvancedFilters" @click="clearAdvancedFilters">Clear</button>
            </div>
          </form>

          <p v-if="error" class="um-error-banner">{{ error }}</p>

          <div class="um-table-wrap">
          <table class="um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Role</th>
                <th>Date &amp; Time</th>
                <th>IP Address</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && !logs.length">
                <td colspan="6">
                  <div class="um-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Loading activity logs...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="!logs.length">
                <td colspan="6">
                  <div class="um-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>No activity recorded yet.</span>
                  </div>
                </td>
              </tr>
              <tr v-for="log in logs" :key="log.id" class="um-row">
                <td>
                  <div class="um-user-cell">
                    <div class="um-user-avatar um-user-avatar--log">{{ initials(log.actorName) }}</div>
                    <div class="um-user-info">
                      <span class="um-user-name">{{ log.actorName }}</span>
                      <span class="um-user-dept">{{ log.email || 'No email recorded' }}</span>
                    </div>
                  </div>
                </td>
                <td class="um-log-action">{{ log.action }}</td>
                <td>
                  <span :class="['um-role-badge', log.actorRole === 'teacher' ? 'um-role-badge--teacher' : 'um-role-badge--student']">{{ log.actorRole }}</span>
                </td>
                <td class="um-date">{{ formatTime(log.createdAt) }}</td>
                <td class="um-email">{{ log.ipAddress || 'Not recorded' }}</td>
                <td class="um-device">{{ log.device || 'Not recorded' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="logs.length" class="um-pagination">
          <span class="um-page-summary">{{ firstVisibleLog }} to {{ lastVisibleLog }} of {{ totalLogs }} activities</span>
          <div class="um-page-controls">
            <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1 || loading" aria-label="Previous page">&lt;</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages || loading" aria-label="Next page">&gt;</button>
          </div>
        </footer>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import SystemDateTimePicker from '@/components/SystemDateTimePicker.vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute(); const router = useRouter(); const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const logs = ref([]); const loading = ref(false); const error = ref(''); const roleFilter = ref('')
const searchQuery = ref(''); const fromDateTime = ref(''); const toDateTime = ref('')
const currentPage = ref(1); const pageSize = 10; const totalLogs = ref(0); const totalPages = ref(1)
const firstVisibleLog = computed(() => totalLogs.value ? ((currentPage.value - 1) * pageSize) + 1 : 0)
const lastVisibleLog = computed(() => Math.min(currentPage.value * pageSize, totalLogs.value))
const hasAdvancedFilters = computed(() => Boolean(searchQuery.value || fromDateTime.value || toDateTime.value))
const roleOptions = [{ value: '', label: 'All activity' }, { value: 'teacher', label: 'Teachers' }, { value: 'student', label: 'Students' }]
const icon = (path) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
  { name: 'View Schedules', to: '/admin/schedule/view', icon: icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>') },
  { name: 'Add Schedule', to: '/admin/schedule/add', icon: icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/>') },
  { name: 'Academic Terms', to: '/admin/academic-terms', icon: icon('<path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>') },
  { name: 'Teachers', to: '/admin/teachers', icon: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
  { name: 'Events', to: '/admin/events', icon: icon('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/>') },
  { name: 'Users', to: '/admin/users', icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>') },
  { name: 'Activity Logs', to: '/admin/activity-logs', icon: icon('<path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/>') },
  { name: 'Settings', to: '/admin/settings', icon: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0-1.51 1z"/>') },
]
async function loadLogs() {
  loading.value = true; error.value = ''
  try {
    const token = getToken(); if (!token) throw new Error('Session expired. Please log in again.')
    const params = new URLSearchParams({ limit: String(pageSize), page: String(currentPage.value) })
    if (roleFilter.value) params.set('role', roleFilter.value)
    if (searchQuery.value) params.set('search', searchQuery.value)
    if (fromDateTime.value) params.set('from', new Date(fromDateTime.value).toISOString())
    if (toDateTime.value) params.set('to', new Date(toDateTime.value).toISOString())
    const response = await fetch(`${API_BASE}/activity-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const payload = await response.json(); if (!response.ok) throw new Error(payload.message || 'Unable to load activity logs.')
    logs.value = Array.isArray(payload.logs) ? payload.logs : []
    totalLogs.value = Number(payload.pagination?.total) || 0
    totalPages.value = Math.max(Number(payload.pagination?.totalPages) || 1, 1)
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
      await loadLogs()
    }
  } catch (err) { error.value = err.message || 'Unable to load activity logs.' } finally { loading.value = false }
}
function changeRoleFilter(role) { roleFilter.value = role; currentPage.value = 1; loadLogs() }
function applyFilters() {
  if (fromDateTime.value && toDateTime.value && new Date(fromDateTime.value) > new Date(toDateTime.value)) {
    error.value = 'The From date and time must be earlier than the To date and time.'
    return
  }
  currentPage.value = 1
  loadLogs()
}
function clearAdvancedFilters() {
  searchQuery.value = ''
  fromDateTime.value = ''
  toDateTime.value = ''
  currentPage.value = 1
  loadLogs()
}
function changePage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value || loading.value) return
  currentPage.value = page
  loadLogs()
}
function initials(name) { return String(name || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() }
function formatTime(value) { return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }
function logoutAndLeave() { logout(); router.push('/') }
onMounted(loadLogs)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

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
  border: 3px solid #c4c9cd;
  cursor: pointer;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #4b5563;
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
  background: #f8fafc;
  color: #4b5563;
}

.nav-item.active {
  background: #4b5563;
  color: #fff;
}

.nav-item.active .nav-icon {
  color: #fff;
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
  margin-bottom: 16px;
}

.page-title {
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-weight: 700;
  color: #1a202c;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.page-title-kicker {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 10px;
}

.page-title-main {
  display: block;
}

.page-sub {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 6px;
  font-weight: 400;
}

.um-management-panel {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.um-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.um-view-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.um-view-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.um-view-tab:hover:not(.um-view-tab--on) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.um-view-tab--on {
  background: #3d4653;
  border-color: #3d4653;
  color: #fff;
}

.um-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.um-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.um-search-icon {
  position: absolute;
  left: 13px;
  color: #d1d5db;
  pointer-events: none;
  display: flex;
}

.um-search-input {
  font-family: inherit;
  font-size: 0.875rem;
  color: #1a1a1a;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px 10px 38px;
  outline: none;
  width: 280px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.um-search-input::placeholder {
  color: #bbb;
}

.um-search-input:focus {
  border-color: #4b5563;
  box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.08);
}

.um-print-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #4b5563;
  color: #fff;
  border: 1px solid #4b5563;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.um-print-btn:hover:not(:disabled) {
  background: #3d4653;
  border-color: #3d4653;
}

.um-print-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.um-stats-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.um-stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.um-stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.um-stat-icon--total { background: #f3f4f6; color: #4f575f; }
.um-stat-icon--admin { background: #e8eefe; color: #2563eb; }
.um-stat-icon--teacher { background: #fef3c7; color: #b45309; }
.um-stat-icon--active { background: #d8dcdf; color: #4f575f; }
.um-stat-icon--archived { background: #f3f4f6; color: #6b7280; }

.um-stat-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: #111;
  line-height: 1;
}

.um-stat-label {
  font-size: 0.78rem;
  color: #888;
  font-weight: 500;
  margin-top: 3px;
}

.um-logs-container {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  border: 1px solid #eaedf0;
}

.um-search-panel {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) minmax(190px, 1fr) minmax(190px, 1fr) auto;
  gap: 14px;
  align-items: end;
  padding: 20px;
  background: #fff;
  border: none;
  border-bottom: 1px solid #eaedf0;
  border-radius: 14px 14px 0 0;
  box-shadow: none;
}

.um-search-panel label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.um-search-panel label span {
  font-size: 0.72rem;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 0.3px;
}

.um-search-panel input {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 13px;
  background: #fff;
  color: #1a1a1a;
  font: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.um-search-panel input::placeholder {
  color: #bbb;
}

.um-search-panel input:focus {
  border-color: #4b5563;
  box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.08);
}

.um-search-actions {
  display: flex;
  gap: 8px;
}

.um-search-actions button {
  height: 40px;
  border-radius: 10px;
  padding: 0 16px;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.um-apply-search {
  border: 1px solid #4b5563;
  background: #4b5563;
  color: #fff;
}

.um-apply-search:hover:not(:disabled) {
  background: #3d4653;
  border-color: #3d4653;
}

.um-clear-search {
  border: 1.5px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
}

.um-clear-search:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #d1d5db;
}

.um-search-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.um-error-banner {
  background: #fef2f2;
  border: none;
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
  padding: 14px 20px;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0;
}

.um-table-wrap {
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  max-height: 65vh;
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
}

.um-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.um-table thead tr {
  background: #f9fafb;
  border-bottom: 1px solid #eaedf0;
}

.um-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f9fafb;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 20px;
}

.um-table td {
  padding: 14px 20px;
  vertical-align: middle;
}

.um-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
}

.um-row:last-child {
  border-bottom: none;
}

.um-row:hover {
  background: #fafbfc;
}

.um-user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.um-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dfe8e2, #c4d7cf);
  color: #1f4a38;
  font-weight: 700;
  font-size: 0.75rem;
  border: 1px solid #c4d7cf;
}

.um-user-info {
  display: flex;
  flex-direction: column;
}

.um-user-name {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.875rem;
}

.um-user-dept {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 3px;
}

.um-log-action {
  color: #374151;
  line-height: 1.5;
  max-width: 260px;
  font-size: 0.875rem;
}

.um-role-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.um-role-badge--teacher {
  background: #fef3c7;
  color: #b45309;
}

.um-role-badge--student {
  background: #f0e8fe;
  color: #7c3aed;
}

.um-email,
.um-device,
.um-date {
  color: #6b7280;
  font-size: 0.875rem;
}

.um-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #d1d5db;
  font-size: 0.875rem;
}

.um-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eaedf0;
  background: #f9fafb;
  border-radius: 0 0 14px 14px;
}

.um-page-summary {
  font-size: 0.8rem;
  color: #6b7280;
}

.um-page-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: #6b7280;
}

.um-page-controls button {
  width: 32px;
  height: 32px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  color: #4b5563;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  font-size: 0.85rem;
}

.um-page-controls button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.um-page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .um-stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .um-search-panel {
    grid-template-columns: 1fr 1fr;
  }

  .um-search-field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 800px) {
  .main {
    padding: 24px 18px;
  }

  .um-stats-row {
    grid-template-columns: 1fr;
  }

  .um-search-panel {
    grid-template-columns: 1fr;
  }

  .um-topbar-right {
    width: 100%;
  }

  .um-search-wrap,
  .um-search-input,
  .um-topbar-right > .um-print-btn {
    width: 100%;
  }

  .um-pagination {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
