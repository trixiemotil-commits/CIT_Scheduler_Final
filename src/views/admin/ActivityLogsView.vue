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
      <header class="logs-header">
        <div>
          <span class="page-eyebrow">Activity monitoring</span>
          <h1>Activity Logs</h1>
          <p>Teacher and student actions recorded across the system</p>
        </div>
      </header>

      <section class="activity-section">
        <div class="activity-section-header">
          <div>
            <h2 class="activity-section-title">Activity overview</h2>
            <p class="activity-section-sub">{{ totalLogs }} recorded {{ totalLogs === 1 ? 'activity' : 'activities' }}</p>
          </div>
          <div class="activity-summary-counts">
            <span><b>{{ totalLogs }}</b> Total</span>
            <span><b>{{ logs.length }}</b> Shown</span>
            <span><b>{{ currentPage }}</b> Page</span>
          </div>
        </div>

        <div class="toolbar">
          <div class="filters">
            <button v-for="option in roleOptions" :key="option.value" :class="{ active: roleFilter === option.value }" @click="changeRoleFilter(option.value)">{{ option.label }}</button>
          </div>
        </div>

        <form class="search-panel" @submit.prevent="applyFilters">
          <label class="search-field">
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
          <div class="search-actions">
            <button type="submit" class="apply-search" :disabled="loading">Search</button>
            <button type="button" class="clear-search" :disabled="loading || !hasAdvancedFilters" @click="clearAdvancedFilters">Clear</button>
          </div>
        </form>

        <p v-if="error" class="error">{{ error }}</p>
        <section class="log-card">
          <div v-if="loading && !logs.length" class="empty">Loading activity logs...</div>
          <div v-else-if="!logs.length" class="empty">No teacher or student activity recorded yet.</div>
          <article v-for="log in logs" :key="log.id" class="log-row">
            <div class="initials">{{ initials(log.actorName) }}</div>
            <div class="log-main">
              <strong>{{ log.actorName }}</strong><span :class="['role-tag', log.actorRole]">{{ log.actorRole }}</span>
              <p>{{ log.action }}</p>
              <div class="request-meta">
                <span title="IP address">IP: {{ log.ipAddress || 'Not recorded' }}</span>
                <span title="Device and browser">Device: {{ log.device || 'Not recorded' }}</span>
              </div>
            </div>
            <time>{{ formatTime(log.createdAt) }}</time>
          </article>
          <footer v-if="logs.length" class="pagination">
            <span class="page-summary">{{ firstVisibleLog }} to {{ lastVisibleLog }} of {{ totalLogs }} activities</span>
            <div class="page-controls">
              <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1 || loading" aria-label="Previous page">&lt;</button>
              <span>Page {{ currentPage }} of {{ totalPages }}</span>
              <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages || loading" aria-label="Next page">&gt;</button>
            </div>
          </footer>
        </section>
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
.layout{display:flex;height:100vh;background:#f5f6f8;font-family:Poppins,Arial,sans-serif}.sidebar{width:280px;min-width:280px;background:#fff;border-right:1px solid #ececec;display:flex;flex-direction:column;align-items:center;padding:28px 18px 24px;box-sizing:border-box;position:sticky;top:0;height:100vh;overflow-y:auto}.sidebar-profile{display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:28px;text-align:center}.avatar-wrap{width:96px;height:96px;border-radius:50%;overflow:hidden;margin-bottom:10px;border:3px solid #c8ddd4;cursor:pointer}.avatar{width:100%;height:100%;object-fit:cover}.brand{font-size:1.05rem;font-weight:600;color:#1b4332}.role{font-size:.88rem;color:#444;font-weight:500}.email{font-size:.82rem;color:#888;word-break:break-all}.sidebar-nav{display:flex;flex-direction:column;gap:4px;width:100%;flex:1}.nav-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;font-size:.88rem;font-weight:400;color:#444;text-decoration:none;transition:background .18s,color .18s;cursor:pointer}.nav-item:hover{background:#f0faf3;color:#1b4332}.nav-item.active{background:#1b4332;color:#fff}.logout-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 12px;background:#e63946;color:#fff;border:0;border-radius:10px;font-size:.85rem;font-weight:500;font-family:inherit;cursor:pointer;margin-top:16px}.logout-btn:hover{background:#c1121f}.main{flex:1;padding:38px 44px;overflow:auto}.main h1{margin:0;color:#1b4332;font-size:2rem}.main header p{margin:5px 0 26px;color:#777}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.filters{display:flex;gap:7px}.filters button,.refresh{border:1px solid #dce3df;background:#fff;border-radius:8px;padding:8px 13px;color:#456;font:inherit;font-size:.82rem;cursor:pointer}.filters button.active{background:#1b4332;color:#fff;border-color:#1b4332}.refresh{color:#1b4332}.log-card{background:#fff;border:1px solid #e1e5e3;border-radius:14px;overflow:hidden}.log-row{display:flex;align-items:center;gap:13px;padding:15px 20px;border-bottom:1px solid #edf0ee}.initials{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#dcefe4;color:#1b4332;font-size:.76rem;font-weight:700}.log-main{flex:1}.log-main strong{font-size:.9rem;color:#222}.log-main p{margin:3px 0 0;font-size:.82rem;color:#667}.role-tag{margin-left:8px;padding:2px 7px;border-radius:99px;font-size:.67rem;text-transform:capitalize}.role-tag.teacher{background:#e7f5ec;color:#1b7a4a}.role-tag.student{background:#e8f0ff;color:#2761a8}time{font-size:.75rem;color:#84908a;white-space:nowrap}.empty{padding:55px;text-align:center;color:#87908b}.error{padding:10px 12px;background:#fff0f0;color:#b42318;border-radius:8px}.pagination{display:flex;justify-content:space-between;align-items:center;padding:13px 20px;background:#f8faf9;border-top:1px solid #e7ebe9}.page-summary,.page-controls span{font-size:.78rem;color:#66736c}.page-controls{display:flex;align-items:center;gap:10px}.page-controls button{width:34px;height:32px;border:1px solid #d5ded9;border-radius:8px;background:#fff;color:#1b4332;font-size:1.3rem;line-height:1;cursor:pointer}.page-controls button:hover:not(:disabled){background:#1b4332;color:#fff}.page-controls button:disabled{opacity:.4;cursor:not-allowed}@media(max-width:800px){.sidebar{display:none}.main{padding:24px 18px}.log-row{align-items:flex-start}time{white-space:normal;text-align:right}.toolbar{align-items:flex-start;gap:10px;flex-direction:column}.pagination{gap:10px;align-items:flex-start;flex-direction:column}}
.search-panel{display:grid;grid-template-columns:minmax(240px,1.5fr) minmax(190px,1fr) minmax(190px,1fr) auto;gap:12px;align-items:end;margin-bottom:16px;padding:15px;background:#fff;border:1px solid #e1e5e3;border-radius:12px}.search-panel label{display:flex;flex-direction:column;gap:6px}.search-panel label span{font-size:.73rem;font-weight:600;color:#526159}.search-panel input{width:100%;box-sizing:border-box;border:1px solid #d5ded9;border-radius:8px;padding:9px 11px;background:#fff;color:#26332c;font:inherit;font-size:.8rem;outline:none}.search-panel input:focus{border-color:#1b4332;box-shadow:0 0 0 3px rgba(27,67,50,.1)}.search-actions{display:flex;gap:7px}.search-actions button{height:39px;border-radius:8px;padding:0 14px;font:inherit;font-size:.78rem;font-weight:600;cursor:pointer}.apply-search{border:1px solid #1b4332;background:#1b4332;color:#fff}.clear-search{border:1px solid #d5ded9;background:#fff;color:#526159}.search-actions button:disabled{opacity:.45;cursor:not-allowed}.request-meta{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:6px;color:#7b8780;font-size:.7rem}.request-meta span{word-break:break-word}@media(max-width:1100px){.search-panel{grid-template-columns:1fr 1fr}.search-field{grid-column:1/-1}}@media(max-width:800px){.search-panel{grid-template-columns:1fr}.search-field{grid-column:auto}.search-actions{width:100%}.search-actions button{flex:1}.request-meta{flex-direction:column;gap:3px}}

.layout{background:linear-gradient(135deg,#eef1f2 0%,#d7dcdf 48%,#c5ccd0 100%);color:#222a33}.main{padding:42px 44px 48px}.logs-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:28px}.page-eyebrow{display:block;margin-bottom:8px;color:#65717b;font-size:.76rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.main h1{color:#202830;font-size:clamp(2.1rem,4vw,3.15rem);line-height:1;letter-spacing:-.055em;font-weight:850}.main header p{max-width:780px;margin:12px 0 0;color:#737d86;font-size:1.02rem;line-height:1.55}.logs-refresh-btn{min-height:46px;padding:0 20px;border:1px solid #3e4a55;border-radius:13px;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;font-weight:800;letter-spacing:-.01em;box-shadow:0 12px 24px rgba(48,57,66,.24),inset 0 1px 0 rgba(255,255,255,.18)}.logs-refresh-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 15px 28px rgba(48,57,66,.27),inset 0 1px 0 rgba(255,255,255,.2)}.logs-refresh-btn:disabled{opacity:.62;cursor:not-allowed}.activity-section{padding:26px 28px 28px;border:1px solid rgba(255,255,255,.9);border-radius:25px;background:linear-gradient(145deg,rgba(247,249,250,.82),rgba(221,227,231,.68));box-shadow:16px 18px 36px rgba(88,99,108,.16),-10px -10px 24px rgba(255,255,255,.58),inset 1px 1px 0 rgba(255,255,255,.72)}.activity-section-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:-4px -4px 22px;padding:0 0 22px;border-bottom:1px solid rgba(151,163,173,.18)}.activity-section-title{margin:0;color:#242c35;font-size:1.25rem;font-weight:850;letter-spacing:-.03em}.activity-section-sub{margin:6px 0 0;color:#7a858d;font-size:.86rem}.activity-summary-counts{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.activity-summary-counts span{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px;border:1px solid #dce4e9;border-radius:10px;background:rgba(255,255,255,.68);color:#74808a;font-size:.76rem;font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}.activity-summary-counts b{color:#303a44;font-size:.93rem}.toolbar{margin:0 0 18px;justify-content:flex-start}.filters{display:inline-flex;gap:6px;padding:6px;border:1px solid rgba(205,214,220,.9);border-radius:14px;background:rgba(255,255,255,.58);box-shadow:inset 1px 1px 3px rgba(116,128,139,.12),inset -1px -1px 4px rgba(255,255,255,.9)}.filters button{min-height:42px;padding:0 18px;border:1px solid transparent;border-radius:11px;background:transparent;color:#596572;font-size:.82rem;font-weight:800;box-shadow:none}.filters button:hover:not(.active){background:rgba(255,255,255,.72);border-color:#e2e8ec}.filters button.active{border-color:#3d4853;background:linear-gradient(145deg,#5c6873,#36414b);color:#fff;box-shadow:0 8px 18px rgba(58,68,78,.18),inset 0 1px 0 rgba(255,255,255,.16)}.search-panel{grid-template-columns:minmax(260px,1.4fr) minmax(190px,.85fr) minmax(190px,.85fr) auto;gap:14px;margin-bottom:20px;padding:18px;border:1px solid rgba(255,255,255,.88);border-radius:19px;background:rgba(255,255,255,.66);box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 12px 24px rgba(86,96,105,.08)}.search-panel label span{color:#5a6570;font-size:.72rem;font-weight:850;letter-spacing:.02em}.search-panel input{min-height:44px;border:1px solid #d7e0e6;border-radius:12px;background:#fbfcfd;color:#24303a;font-size:.82rem;box-shadow:inset 0 1px 2px rgba(68,80,91,.06)}.search-panel input:focus{border-color:#6b7884;box-shadow:0 0 0 3px rgba(100,113,126,.12);background:#fff}.search-actions{gap:10px}.search-actions button{height:44px;border-radius:12px;padding:0 18px;font-weight:850}.apply-search{border:1px solid #3e4a55;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 10px 18px rgba(48,57,66,.18),inset 0 1px 0 rgba(255,255,255,.18)}.clear-search{border:1px solid #dbe2e7;background:#fff;color:#68737d}.log-card{border:1px solid rgba(255,255,255,.86);border-radius:20px;background:rgba(255,255,255,.76);box-shadow:0 16px 30px rgba(82,93,102,.1),inset 0 1px 0 rgba(255,255,255,.78);overflow:hidden}.log-row{gap:16px;padding:18px 22px;border-bottom:1px solid #e9eef1;background:rgba(255,255,255,.38);transition:background .18s ease,transform .18s ease}.log-row:hover{background:rgba(248,250,251,.95)}.initials{width:44px;height:44px;background:linear-gradient(145deg,#eef2f4,#dfe6ea);color:#44515d;font-size:.78rem;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 5px 12px rgba(85,96,106,.08)}.log-main strong{color:#242c35;font-size:.94rem;font-weight:850}.log-main p{margin-top:4px;color:#596572;font-size:.86rem}.role-tag{display:inline-flex;align-items:center;margin-left:10px;padding:3px 9px;border-radius:999px;font-size:.68rem;font-weight:800;text-transform:capitalize}.role-tag.teacher{background:#eaf7f0;color:#2a8752}.role-tag.student{background:#eaf2ff;color:#356db5}time{color:#7c8790;font-size:.78rem}.request-meta{color:#8a949b;font-size:.72rem}.pagination{background:rgba(248,250,251,.78);border-top:1px solid #e7edf1}.page-summary,.page-controls span{color:#66727c;font-weight:700}.page-controls button{border-color:#d8e0e6;color:#4b5965;background:#fff}.page-controls button:hover:not(:disabled){background:#3d4853;color:#fff}.empty{color:#7b858d;font-weight:700}.error{border:1px solid #ffd5d5;background:#fff5f5;color:#b42318;font-weight:700}

@media(max-width:1100px){.logs-header,.activity-section-header{align-items:flex-start;flex-direction:column}.activity-summary-counts{width:100%}.search-panel{grid-template-columns:1fr 1fr}.search-field{grid-column:1/-1}.search-actions{grid-column:1/-1}}
@media(max-width:800px){.main{padding:24px 18px}.logs-refresh-btn{width:100%}.activity-section{padding:18px;border-radius:20px}.filters{width:100%;overflow:auto}.filters button{white-space:nowrap}.search-panel{grid-template-columns:1fr}.search-actions{grid-column:auto;width:100%}.search-actions button{flex:1}.log-row{align-items:flex-start}.log-row time{margin-left:auto;text-align:right}.pagination{gap:10px;align-items:flex-start;flex-direction:column}}

.main{padding:40px 44px 46px}.logs-header{margin-bottom:24px}.page-eyebrow{margin-bottom:10px;color:#6f7a83;font-size:.72rem;letter-spacing:.18em}.main h1{font-size:clamp(2.35rem,3.4vw,2.95rem);letter-spacing:-.06em}.main header p{font-size:1rem;color:#74808a}.logs-refresh-btn{min-width:126px;min-height:50px;border-radius:14px}.activity-section{padding:30px 34px 32px;border-radius:24px;background:linear-gradient(145deg,rgba(248,250,251,.9),rgba(223,229,233,.7));box-shadow:14px 16px 34px rgba(84,94,103,.14),-8px -8px 22px rgba(255,255,255,.58),inset 1px 1px 0 rgba(255,255,255,.76)}.activity-section-header{margin:0 0 24px;padding:0 0 22px}.activity-section-title{font-size:1.32rem}.activity-summary-counts span{min-width:82px;justify-content:center}.toolbar{margin-bottom:16px}.filters{padding:5px;border-radius:15px;background:rgba(255,255,255,.72)}.filters button{min-width:126px;min-height:43px}.search-panel{grid-template-columns:minmax(330px,1.25fr) minmax(210px,.72fr) minmax(210px,.72fr) auto;padding:18px 20px;border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.82),rgba(241,244,246,.72));align-items:end}.search-panel input{height:46px;border-radius:12px}.search-actions button{height:46px;min-width:92px}.log-card{margin-top:22px;border-radius:22px;background:rgba(255,255,255,.88)}.log-row{display:grid;grid-template-columns:50px minmax(0,1fr) max-content;align-items:center;min-height:92px;padding:18px 22px}.initials{width:46px;height:46px}.log-main strong{font-size:.96rem}.log-main p{font-size:.85rem}.request-meta{gap:8px 18px}.log-row time{align-self:center;padding-left:24px;color:#7f8992;font-weight:600}.pagination{padding:16px 22px}.page-controls button{font-size:1rem;font-weight:800}

@media(max-width:1200px){.search-panel{grid-template-columns:1fr 1fr}.search-field{grid-column:1/-1}.search-actions{grid-column:1/-1;justify-content:flex-end}}
@media(max-width:800px){.main h1{font-size:2.15rem}.activity-summary-counts span{min-width:auto}.filters button{min-width:max-content}.log-row{grid-template-columns:46px 1fr;gap:12px}.log-row time{grid-column:2;padding-left:0;text-align:left}.search-actions{justify-content:stretch}}
</style>
