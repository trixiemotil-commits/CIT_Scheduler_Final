<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="profile.avatar" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ profile.email }}</div>
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
      <header class="main-header">
        <div>
          <h1 class="page-title">Profile Page</h1>
          <p class="page-sub">View and manage your personal information</p>
        </div>
      </header>

      <!-- Profile Card -->
      <section class="profile-card">
        <div class="card-banner">
          <button class="edit-btn" @click="openEdit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Profile
          </button>
        </div>
        <div class="card-body">
          <div class="card-top">
            <div class="profile-avatar-wrap">
              <img :src="profile.avatar" class="profile-avatar" alt="" />
            </div>
            <div class="profile-info">
              <div class="hero-name">{{ profile.fullName }}</div>
              <div class="hero-sub">
                <span class="role-chip">{{ profile.role }}</span>
                <span class="hero-id">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  {{ profile.employeeId }}
                </span>
                <span class="hero-email">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {{ profile.email }}
                </span>
              </div>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">{{ profile.fullName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Role</div>
              <div class="info-value">{{ profile.role }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Employee ID</div>
              <div class="info-value">{{ profile.employeeId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">{{ profile.email }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact Number</div>
              <div class="info-value">{{ profile.contact }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">{{ profile.status }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ═══ Edit Profile Modal ═══ -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEdit">
        <div class="edit-modal">
          <div class="edit-modal-header">
            <div>
              <h2 class="edit-modal-title">Edit Profile</h2>
              <p class="edit-modal-sub">Update your personal information</p>
            </div>
            <button class="edit-modal-close" @click="closeEdit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="edit-modal-body">
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Full Name</label>
                <input v-model="editForm.fullName" class="edit-input" type="text" placeholder="Full name" />
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Email</label>
                <input v-model="editForm.email" class="edit-input" type="email" placeholder="Email address" />
              </div>
            </div>
            <div class="edit-row two-col">
              <div class="edit-field">
                <label class="edit-label">Contact No.</label>
                <input v-model="editForm.contact" class="edit-input" type="text" placeholder="09XXXXXXXXX" />
              </div>
              <div class="edit-field">
                <label class="edit-label">Status</label>
                <input v-model="editForm.status" class="edit-input" type="text" disabled />
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Employee Id</label>
                <input v-model="editForm.employeeId" class="edit-input" type="text" placeholder="000-000-000" />
              </div>
            </div>
            <div class="edit-row two-col">
              <div class="edit-field">
                <label class="edit-label">Profile Photo</label>
                <input class="edit-input" type="file" accept="image/*" @change="onAvatarSelected" />
                <small class="photo-help">JPG, PNG, or WEBP. Max 5 MB.</small>
              </div>
              <div class="edit-field">
                <label class="edit-label">Photo Preview</label>
                <div class="photo-preview-wrap">
                  <img :src="editForm.avatar || profile.avatar" alt="Preview" class="photo-preview" />
                </div>
              </div>
            </div>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-cancel-btn" @click="closeEdit">Cancel</button>
            <button class="edit-save-btn" @click="saveProfile">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Modal ═══ -->
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
import Swal from 'sweetalert2'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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
    name: 'Consultation', to: '/teacher/consultation',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    name: 'Settings', to: '/teacher/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Profile data ── */
const profile = ref({
  fullName:   user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Teacher',
  email:      user.email || 'teacher@gmail.com',
  contact:    user.phone || 'N/A',
  status:     user.status || 'Active',
  employeeId: user.employeeId || user.studentId || 'N/A',
  role:       ((user.role || 'teacher').toString().charAt(0).toUpperCase() + (user.role || 'teacher').toString().slice(1).toLowerCase()),
  avatar:     user.avatar || 'https://i.pravatar.cc/100?img=47'
})

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) {
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
    if (response.status === 413) {
      throw new Error('Uploaded image is too large. Please choose a smaller photo.')
    }

    throw new Error(body.message || 'Failed to load profile.')
  }

  return body
}

function normalizeRoleLabel(role) {
  const text = (role || '').toString().trim()
  if (!text) return 'Teacher'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

async function loadProfile() {
  try {
    const payload = await apiRequest('/auth/me')
    const dbUser = payload.user || {}

    profile.value = {
      fullName: dbUser.name || `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || 'Teacher',
      email: dbUser.email || 'teacher@gmail.com',
      contact: dbUser.phone || 'N/A',
      status: dbUser.status || 'Active',
      employeeId: dbUser.employeeId || dbUser.studentId || 'N/A',
      role: normalizeRoleLabel(dbUser.role),
      avatar: dbUser.avatar || user.avatar || 'https://i.pravatar.cc/100?img=47',
    }
  } catch (error) {
    await Swal.fire({
      icon: 'warning',
      title: 'Unable to load profile',
      text: error.message || 'Please try again.',
      confirmButtonColor: '#1b4332',
    })
  }
}

onMounted(loadProfile)

/* ── Edit modal ── */
const showEditModal = ref(false)
const editForm = ref({})

function openEdit() {
  editForm.value = { ...profile.value }
  showEditModal.value = true
}
function closeEdit() {
  showEditModal.value = false
}

function onAvatarSelected(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const isImage = /^image\//.test(file.type)
  if (!isImage) {
    Swal.fire({
      icon: 'warning',
      title: 'Invalid image file',
      text: 'Please select a valid image file.',
      confirmButtonColor: '#1b4332',
    })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'warning',
      title: 'Image too large',
      text: 'Please use an image smaller than 5 MB.',
      confirmButtonColor: '#1b4332',
    })
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    editForm.value.avatar = typeof reader.result === 'string' ? reader.result : editForm.value.avatar
  }
  reader.readAsDataURL(file)
}

async function saveProfile() {
  const fullName = (editForm.value.fullName || '').trim()
  const nameParts = fullName.split(/\s+/).filter(Boolean)
  const firstName = nameParts.shift() || ''
  const lastName = nameParts.join(' ') || ''

  if (!firstName || !editForm.value.email) {
    await Swal.fire({
      icon: 'warning',
      title: 'Missing required fields',
      text: 'Name and email are required.',
      confirmButtonColor: '#1b4332',
    })
    return
  }

  try {
    const payload = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        firstName,
        lastName,
        email: editForm.value.email,
        phone: editForm.value.contact === 'N/A' ? '' : (editForm.value.contact || ''),
        employeeId: editForm.value.employeeId === 'N/A' ? '' : (editForm.value.employeeId || ''),
        avatar: editForm.value.avatar || profile.value.avatar,
      }),
    })

    const updatedUser = payload.user || {}
    localStorage.setItem('cit_user', JSON.stringify(updatedUser))

    profile.value = {
      fullName: updatedUser.name || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || 'Teacher',
      email: updatedUser.email || 'teacher@gmail.com',
      contact: updatedUser.phone || 'N/A',
      status: updatedUser.status || 'Active',
      employeeId: updatedUser.employeeId || updatedUser.studentId || 'N/A',
      role: normalizeRoleLabel(updatedUser.role),
      avatar: updatedUser.avatar || user.avatar || 'https://i.pravatar.cc/100?img=47',
    }

    closeEdit()
    Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: 'Profile Updated', showConfirmButton: false,
      timer: 2500, timerProgressBar: true,
      background: '#1b4332', color: '#fff', iconColor: '#74c69d'
    })
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Unable to update profile',
      text: error.message || 'Please try again.',
      confirmButtonColor: '#1b4332',
    })
  }
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
/* ─── Design tokens ─────────────────────── */
:root {
  --green-900: #1b4332;
  --green-700: #2d6a4f;
  --green-500: #40916c;
  --green-200: #c8ddd4;
  --green-50:  #f0faf3;
  --red:       #e63946;
  --red-dark:  #c1121f;
  --bg:        #f0f2f5;
  --surface:   #ffffff;
  --border:    #e4e4e7;
  --text-head: #0f172a;
  --text-body: #475569;
  --text-muted:#94a3b8;
}

/* ─── Layout ────────────────────────────── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

.layout button,
.layout input,
.layout select,
.layout textarea {
  font-family: inherit;
}

/* ─── Sidebar ───────────────────────────── */
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
  cursor: pointer;
  transition: opacity 0.18s;
}
.avatar-wrap:hover { opacity: 0.85; }
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
.role  { font-size: 0.88rem; color: #444; font-weight: 500; }
.email { font-size: 0.82rem; color: #888; word-break: break-all; }

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

/* ─── Main content ──────────────────────── */
.main {
  flex: 1;
  padding: 40px 44px;
  overflow-y: auto;
  min-width: 0;
  height: 100vh;
  box-sizing: border-box;
}

.main-header { margin-bottom: 32px; }
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
}
.page-sub {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

/* ─── Profile Card ───────────────────────── */
.profile-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.card-banner {
  height: 148px;
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  flex-shrink: 0;
  align-self: center;
}
.edit-btn:hover { background: rgba(255,255,255,0.25); }

.card-body { padding: 16px 28px 30px; }

.card-top {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 28px;
}

.hero-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.role-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: #e8f5ee;
  color: #1b4332;
  border: 1px solid #c8ddd4;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hero-id {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: #374151;
  font-weight: 500;
}
.hero-email {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: #374151;
  font-weight: 500;
}

.profile-avatar-wrap {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.22);
  flex-shrink: 0;
  margin-top: -88px;
  position: relative;
  z-index: 2;
}
.profile-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }

.hero-name {
  font-size: 1.32rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 6px;
}

.profile-info {
  padding-bottom: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.info-item {
  padding: 16px 20px;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}
.info-item:nth-child(2n) { border-right: none; }
.info-item:nth-last-child(-n+2) { border-bottom: none; }
.info-label {
  font-size: 0.69rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 4px;
}
.info-value {
  font-size: 0.92rem;
  font-weight: 500;
  color: #111827;
}

/* ─── Modals ─────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Edit Modal */
.edit-modal {
  width: 500px;
  max-width: 96vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  overflow: hidden;
}

.edit-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 18px;
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
}
.edit-modal-title { font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 2px; }
.edit-modal-sub   { font-size: 0.76rem; color: rgba(255,255,255,0.65); margin: 0; }

.edit-modal-close {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.15s;
}
.edit-modal-close:hover { background: rgba(255,255,255,0.28); }

.edit-modal-body {
  padding: 22px 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-row { display: flex; gap: 14px; }
.edit-row.two-col .edit-field { flex: 1; }

.edit-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.edit-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #1b4332;
}
.edit-input {
  padding: 10px 13px;
  border: 1.5px solid #e4e4e7;
  border-radius: 9px;
  font-size: 0.875rem;
  color: #0f172a;
  background: #f9fafb;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  box-sizing: border-box;
  width: 100%;
}
.edit-input:focus {
  border-color: #1b4332;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(27,67,50,0.10);
}

.select-wrap { position: relative; }
.edit-select {
  width: 100%;
  appearance: none;
  padding: 10px 36px 10px 13px;
  border: 1.5px solid #e4e4e7;
  border-radius: 9px;
  font-size: 0.875rem;
  color: #0f172a;
  background: #f9fafb;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.edit-select:focus {
  border-color: #1b4332;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(27,67,50,0.10);
}
.photo-help {
  color: #64748b;
  font-size: 0.74rem;
  margin-top: 2px;
}
.photo-preview-wrap {
  width: 100%;
  height: 110px;
  border: 1.5px solid #e4e4e7;
  border-radius: 10px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.select-arrow {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #94a3b8;
}

.edit-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px 22px;
  border-top: 1px solid #f0f0f0;
  margin-top: 6px;
}
.edit-cancel-btn {
  padding: 9px 22px;
  background: none;
  border: 1.5px solid #e4e4e7;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.edit-cancel-btn:hover { background: #f5f5f5; border-color: #c0c0c0; }
.edit-save-btn {
  padding: 9px 24px;
  background: linear-gradient(135deg, #1b4332, #2d6a4f);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(27,67,50,0.25);
}
.edit-save-btn:hover { opacity: 0.88; box-shadow: 0 4px 14px rgba(27,67,50,0.32); }

/* Logout Modal */
.logout-modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 32px 36px 28px;
  width: 340px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  text-align: center;
}
.logout-modal-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: #fff1f1;
  border: 2px solid #ffd6d8;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.logout-modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.logout-modal-sub   { font-size: 0.82rem; color: #94a3b8; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex; gap: 10px; margin-top: 4px; width: 100%;
}
.logout-cancel-btn {
  flex: 1;
  background: none;
  border: 1.5px solid #e4e4e7;
  font-size: 0.875rem; font-weight: 500; color: #475569;
  cursor: pointer; padding: 10px; border-radius: 8px;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.logout-cancel-btn:hover { background: #f5f5f5; border-color: #c0c0c0; }
.logout-confirm-btn {
  flex: 1;
  background: #e63946; color: #fff; border: none;
  font-size: 0.875rem; font-weight: 600;
  padding: 10px; border-radius: 8px;
  font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.logout-confirm-btn:hover { background: #c1121f; }

@media (max-width: 900px) {
  .main { padding: 24px 20px; }
  .sidebar { width: 220px; min-width: 220px; }
  .card-hero { gap: 14px; }
  .info-grid { grid-template-columns: 1fr; }
  .info-item:nth-child(2n) { border-right: none; }
  .info-item:nth-last-child(-n+2) { border-bottom: 1px solid #e5e7eb; }
  .info-item:last-child { border-bottom: none; }
}
</style>
