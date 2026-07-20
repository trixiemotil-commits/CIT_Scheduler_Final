<template>
  <div class="layout">
    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SIDEBAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="profile.avatar" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
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

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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
              <div class="info-label">Gender</div>
              <div class="info-value">{{ profile.gender }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Employee ID</div>
              <div class="info-value">{{ profile.employeeId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Role</div>
              <div class="info-value">{{ profile.role }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- â•â•â• Edit Profile Modal â•â•â• -->
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
            <div class="avatar-editor">
              <img :src="editForm.avatar || DEFAULT_AVATAR" class="avatar-editor-preview" alt="Profile picture preview" />
              <div class="avatar-editor-details">
                <span class="edit-label">Profile Picture</span>
                <p>PNG, JPG, or WebP. Images are resized automatically.</p>
                <button type="button" class="avatar-upload-btn" @click="avatarInput?.click()">Choose Photo</button>
                <input ref="avatarInput" class="avatar-file-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handleAvatarChange" />
              </div>
            </div>
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
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Gender</label>
                <div class="select-wrap">
                  <select v-model="editForm.gender" class="edit-select">
                    <option value="Not specified">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Employee Id</label>
                <input v-model="editForm.employeeId" class="edit-input" type="text" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="00-0000-000000" @input="formatEmployeeId" />
              </div>
            </div>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-cancel-btn" @click="closeEdit">Cancel</button>
            <button class="edit-save-btn" :disabled="isSaving" @click="saveProfile">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- â•â•â• Logout Modal â•â•â• -->
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
const DEFAULT_AVATAR = 'https://i.pravatar.cc/100?img=15'

const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'View Schedules', to: '/admin/schedule/view',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Add Schedule', to: '/admin/schedule/add',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  },
  {
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* â”€â”€ Profile data â”€â”€ */
const profile = ref({
  fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  email: user.email || '',
  gender: user.gender || 'Not specified',
  employeeId: user.employeeId || '',
  role: user.role || 'admin',
  avatar: user.avatar || DEFAULT_AVATAR
})

const isSaving = ref(false)

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
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

function setProfile(apiUser) {
  profile.value = {
    fullName: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim(),
    email: apiUser.email || '',
    gender: apiUser.gender || 'Not specified',
    employeeId: apiUser.employeeId || '',
    role: apiUser.role || 'admin',
    avatar: apiUser.avatar || DEFAULT_AVATAR,
  }
}

async function loadProfile() {
  try {
    const response = await apiRequest('/auth/me')
    setProfile(response.user)
    localStorage.setItem('cit_user', JSON.stringify(response.user))
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Unable to load profile', text: error.message })
  }
}

/* â”€â”€ Edit modal â”€â”€ */
const showEditModal = ref(false)
const editForm = ref({})
const avatarInput = ref(null)

function openEdit() {
  editForm.value = { ...profile.value }
  showEditModal.value = true
}
function closeEdit() {
  showEditModal.value = false
}

function formatEmployeeId() {
  const digits = String(editForm.value.employeeId || '').replace(/\D/g, '').slice(0, 12)
  const parts = [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 12)].filter(Boolean)
  editForm.value.employeeId = parts.join('-')
}

async function handleAvatarChange(event) {
  const [file] = event.target.files || []
  if (!file) return

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    Swal.fire({ icon: 'warning', title: 'Unsupported image', text: 'Choose a PNG, JPG, or WebP image.' })
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'Image too large', text: 'Choose an image smaller than 5 MB.' })
    event.target.value = ''
    return
  }

  try {
    editForm.value.avatar = await resizeAvatar(file)
  } catch (_error) {
    Swal.fire({ icon: 'error', title: 'Unable to read image', text: 'Please choose a different image.' })
  } finally {
    event.target.value = ''
  }
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxDimension = 512
      const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Invalid image file.'))
    }
    image.src = objectUrl
  })
}

async function saveProfile() {
  const nameParts = editForm.value.fullName.trim().split(/\s+/)
  if (nameParts.length < 2) {
    Swal.fire({ icon: 'warning', title: 'Full name required', text: 'Enter both your first and last name.' })
    return
  }
  if (editForm.value.employeeId && !/^\d{2}-\d{4}-\d{6}$/.test(editForm.value.employeeId)) {
    Swal.fire({ icon: 'warning', title: 'Invalid employee ID', text: 'Use the format 00-0000-000000. Numbers and hyphens only.' })
    return
  }

  isSaving.value = true
  try {
    const response = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        email: editForm.value.email,
        gender: editForm.value.gender === 'Not specified' ? '' : editForm.value.gender,
        employeeId: editForm.value.employeeId,
        avatar: editForm.value.avatar,
      }),
    })
    setProfile(response.user)
    localStorage.setItem('cit_user', JSON.stringify(response.user))
    closeEdit()
    Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: 'Profile Updated', showConfirmButton: false,
      timer: 2500, timerProgressBar: true,
      background: '#4b5563', color: '#fff', iconColor: '#cbd5e1'
    })
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Unable to update profile', text: error.message })
  } finally {
    isSaving.value = false
  }
}

/* â”€â”€ Logout â”€â”€ */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

onMounted(loadProfile)
</script>

<style scoped>
/* â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
:root {
  --green-900: #4b5563;
  --green-700: #6b7280;
  --green-500: #9ca3af;
  --green-200: #c4c9cd;
  --green-50:  #f8fafc;
  --red:       #e63946;
  --red-dark:  #c1121f;
  --bg:        #f0f2f5;
  --surface:   #ffffff;
  --border:    #e4e4e7;
  --text-head: #0f172a;
  --text-body: #475569;
  --text-muted:#94a3b8;
}

/* â”€â”€â”€ Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  transition: opacity 0.18s;
}
.avatar-wrap:hover { opacity: 0.85; }
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
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
.nav-item:hover { background: #f8fafc; color: #4b5563; }
.nav-item.active { background: #4b5563; color: #fff; }
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

/* â”€â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Profile Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
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
.edit-save-btn:disabled { cursor: not-allowed; opacity: 0.65; }

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
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #c4c9cd;
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

/* â”€â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
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

.avatar-editor {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #f9fafb;
}
.avatar-editor-preview {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 2px solid #c4c9cd;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar-editor-details { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.avatar-editor-details p { margin: 0; font-size: 0.72rem; color: #64748b; }
.avatar-upload-btn {
  margin-top: 3px;
  padding: 6px 10px;
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid #c4c9cd;
  border-radius: 7px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.avatar-upload-btn:hover { background: #d8f0e2; }
.avatar-file-input { display: none; }

.edit-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.edit-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4b5563;
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
  border-color: #4b5563;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(48, 53, 58,0.10);
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
  border-color: #4b5563;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(48, 53, 58,0.10);
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
  background: linear-gradient(135deg, #4b5563, #6b7280);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(48, 53, 58,0.25);
}
.edit-save-btn:hover { opacity: 0.88; box-shadow: 0 4px 14px rgba(48, 53, 58,0.32); }

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
