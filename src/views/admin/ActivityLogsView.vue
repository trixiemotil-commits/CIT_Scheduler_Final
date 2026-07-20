<template>
  <div class="layout">
    <aside class="sidebar">
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
          <span v-html="item.icon"></span><span>{{ item.name }}</span>
        </RouterLink>
      </nav>
      <RoleSwitchButton />
      <button class="logout-btn" @click="logoutAndLeave">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </aside>
    <main class="main">
      <header><h1>Activity Logs</h1><p>Teacher and student actions recorded across the system</p></header>
      <div class="toolbar">
        <div class="filters">
          <button v-for="option in roleOptions" :key="option.value" :class="{ active: roleFilter === option.value }" @click="roleFilter = option.value; loadLogs()">{{ option.label }}</button>
        </div>
        <button class="refresh" @click="loadLogs" :disabled="loading">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <section class="log-card">
        <div v-if="loading && !logs.length" class="empty">Loading activity logs...</div>
        <div v-else-if="!logs.length" class="empty">No teacher or student activity recorded yet.</div>
        <article v-for="log in logs" :key="log.id" class="log-row">
          <div class="initials">{{ initials(log.actorName) }}</div>
          <div class="log-main"><strong>{{ log.actorName }}</strong><span :class="['role-tag', log.actorRole]">{{ log.actorRole }}</span><p>{{ log.action }}</p></div>
          <time>{{ formatTime(log.createdAt) }}</time>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute(); const router = useRouter(); const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const logs = ref([]); const loading = ref(false); const error = ref(''); const roleFilter = ref('')
const roleOptions = [{ value: '', label: 'All activity' }, { value: 'teacher', label: 'Teachers' }, { value: 'student', label: 'Students' }]
const icon = (path) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
  { name: 'View Schedules', to: '/admin/schedule/view', icon: icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>') },
  { name: 'Add Schedule', to: '/admin/schedule/add', icon: icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/>') },
  { name: 'Teachers', to: '/admin/teachers', icon: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>') },
  { name: 'Events', to: '/admin/events', icon: icon('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>') },
  { name: 'Manage Users', to: '/admin/users', icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
  { name: 'Activity Logs', to: '/admin/activity-logs', icon: icon('<path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/>') },
  { name: 'Settings', to: '/admin/settings', icon: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0-1.51 1z"/>') },
]
async function loadLogs() {
  loading.value = true; error.value = ''
  try {
    const token = getToken(); if (!token) throw new Error('Session expired. Please log in again.')
    const params = new URLSearchParams({ limit: '200' }); if (roleFilter.value) params.set('role', roleFilter.value)
    const response = await fetch(`${API_BASE}/activity-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const payload = await response.json(); if (!response.ok) throw new Error(payload.message || 'Unable to load activity logs.')
    logs.value = Array.isArray(payload.logs) ? payload.logs : []
  } catch (err) { error.value = err.message || 'Unable to load activity logs.' } finally { loading.value = false }
}
function initials(name) { return String(name || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() }
function formatTime(value) { return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }
function logoutAndLeave() { logout(); router.push('/') }
onMounted(loadLogs)
</script>

<style scoped>
.layout{display:flex;height:100vh;background:#f5f6f8;font-family:Poppins,Arial,sans-serif}.sidebar{width:280px;min-width:280px;background:#fff;border-right:1px solid #ececec;display:flex;flex-direction:column;align-items:center;padding:28px 18px 24px;box-sizing:border-box;position:sticky;top:0;height:100vh;overflow-y:auto}.sidebar-profile{display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:28px;text-align:center}.avatar-wrap{width:96px;height:96px;border-radius:50%;overflow:hidden;margin-bottom:10px;border:3px solid #c8ddd4;cursor:pointer}.avatar{width:100%;height:100%;object-fit:cover}.brand{font-size:1.05rem;font-weight:600;color:#1b4332}.role{font-size:.88rem;color:#444;font-weight:500}.email{font-size:.82rem;color:#888;word-break:break-all}.sidebar-nav{display:flex;flex-direction:column;gap:4px;width:100%;flex:1}.nav-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;font-size:.88rem;font-weight:400;color:#444;text-decoration:none;transition:background .18s,color .18s;cursor:pointer}.nav-item:hover{background:#f0faf3;color:#1b4332}.nav-item.active{background:#1b4332;color:#fff}.logout-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 12px;background:#e63946;color:#fff;border:0;border-radius:10px;font-size:.85rem;font-weight:500;font-family:inherit;cursor:pointer;margin-top:16px}.logout-btn:hover{background:#c1121f}.main{flex:1;padding:38px 44px;overflow:auto}.main h1{margin:0;color:#1b4332;font-size:2rem}.main header p{margin:5px 0 26px;color:#777}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.filters{display:flex;gap:7px}.filters button,.refresh{border:1px solid #dce3df;background:#fff;border-radius:8px;padding:8px 13px;color:#456;font:inherit;font-size:.82rem;cursor:pointer}.filters button.active{background:#1b4332;color:#fff;border-color:#1b4332}.refresh{color:#1b4332}.log-card{background:#fff;border:1px solid #e1e5e3;border-radius:14px;overflow:hidden}.log-row{display:flex;align-items:center;gap:13px;padding:15px 20px;border-bottom:1px solid #edf0ee}.log-row:last-child{border:0}.initials{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#dcefe4;color:#1b4332;font-size:.76rem;font-weight:700}.log-main{flex:1}.log-main strong{font-size:.9rem;color:#222}.log-main p{margin:3px 0 0;font-size:.82rem;color:#667}.role-tag{margin-left:8px;padding:2px 7px;border-radius:99px;font-size:.67rem;text-transform:capitalize}.role-tag.teacher{background:#e7f5ec;color:#1b7a4a}.role-tag.student{background:#e8f0ff;color:#2761a8}time{font-size:.75rem;color:#84908a;white-space:nowrap}.empty{padding:55px;text-align:center;color:#87908b}.error{padding:10px 12px;background:#fff0f0;color:#b42318;border-radius:8px}@media(max-width:800px){.sidebar{display:none}.main{padding:24px 18px}.log-row{align-items:flex-start}time{white-space:normal;text-align:right}.toolbar{align-items:flex-start;gap:10px;flex-direction:column}}
</style>
