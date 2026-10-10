<template>
  <div class="layout">
    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SIDEBAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
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
                <input v-model="editForm.fullName" class="edit-input" type="text" placeholder="Enter your full name" />
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Email</label>
                <input v-model="editForm.email" class="edit-input" type="email" placeholder="Enter your email address" />
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Contact Number</label>
                <input v-model="editForm.contact" class="edit-input" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="tel" placeholder="Enter your contact number" @input="formatContactNumber" />
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
                <input v-model="editForm.employeeId" class="edit-input" type="text" inputmode="text" autocomplete="off" maxlength="12" placeholder="AU2025-00000" @input="formatEmployeeId" />
              </div>
            </div>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-cancel-btn" @click="closeEdit">Cancel</button>
            <button class="edit-save-btn" :disabled="isSaving || !hasEditChanges" @click="saveProfile">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
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
    <Teleport to="body">
      <Transition name="profile-toast">
        <div v-if="statusToast" class="profile-status-toast" role="status" aria-live="polite">
          <span class="profile-status-toast__icon" aria-hidden="true">✓</span>
          <span>{{ statusToast }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { getToken, getUser, logout, saveMergedUser } from '@/auth.js'
import { initialsAvatar } from '@/utils/avatar.js'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const statusToast = ref('')
let statusToastTimer = null
const currentRoute = computed(() => route.path)
const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const DEFAULT_AVATAR = initialsAvatar(user)

function showSuccessToast(title) {
  statusToast.value = title
  if (statusToastTimer) window.clearTimeout(statusToastTimer)
  statusToastTimer = window.setTimeout(() => {
    statusToast.value = ''
    statusToastTimer = null
  }, 5000)
}

onBeforeUnmount(() => {
  if (statusToastTimer) window.clearTimeout(statusToastTimer)
})

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
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* â”€â”€ Profile data â”€â”€ */
const normalizeRoleLabel = (role) => {
  const text = (role || '').toString().trim()
  if (!text) return 'Admin'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

const profile = ref({
  fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin',
  email: user.email || 'admin@gmail.com',
  gender: user.gender || 'Not specified',
  employeeId: user.employeeId || 'N/A',
  role: normalizeRoleLabel(user.role),
  status: user.status || 'Active',
  contact: user.phone || 'N/A',
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
    fullName: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || 'Admin',
    email: apiUser.email || 'admin@gmail.com',
    gender: apiUser.gender || 'Not specified',
    employeeId: apiUser.employeeId || 'N/A',
    role: normalizeRoleLabel(apiUser.role),
    status: apiUser.status || 'Active',
    contact: apiUser.phone || 'N/A',
    avatar: apiUser.avatar || DEFAULT_AVATAR,
  }
}

async function loadProfile() {
  try {
    const response = await apiRequest('/auth/me')
    setProfile(saveMergedUser(response.user))
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Unable to load profile', text: error.message })
  }
}

/* â”€â”€ Edit modal â”€â”€ */
const showEditModal = ref(false)
const editForm = ref({})
const initialEditSnapshot = ref(null)
const avatarInput = ref(null)
const editableFields = ['fullName', 'email', 'contact', 'gender', 'employeeId', 'avatar']
const hasEditChanges = computed(() => {
  if (!initialEditSnapshot.value) return false
  return editableFields.some((field) => editForm.value[field] !== initialEditSnapshot.value[field])
})

function openEdit() {
  editForm.value = {
    ...profile.value,
    contact: profile.value.contact === 'N/A' ? '' : profile.value.contact,
    employeeId: normalizeEmployeeId(profile.value.employeeId),
  }
  initialEditSnapshot.value = { ...editForm.value }
  showEditModal.value = true
}
function closeEdit() {
  showEditModal.value = false
  initialEditSnapshot.value = null
}

function formatEmployeeId() {
  const digits = String(editForm.value.employeeId || '').replace(/\D/g, '').slice(0, 9)
  if (!digits) {
    editForm.value.employeeId = ''
    return
  }
  editForm.value.employeeId = `AU${digits.slice(0, 4)}${digits.length > 4 ? `-${digits.slice(4, 9)}` : ''}`
}

function formatContactNumber() {
  editForm.value.contact = String(editForm.value.contact || '').replace(/\D/g, '')
}

function normalizeEmployeeId(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 9)
  if (!digits) return ''
  const normalized = digits.length === 8 ? `${digits.slice(0, 4)}0${digits.slice(4)}` : digits
  return `AU${normalized.slice(0, 4)}-${normalized.slice(4, 9)}`
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
  if (editForm.value.employeeId && !/^AU\d{4}-\d{4,5}$/.test(editForm.value.employeeId)) {
    Swal.fire({ icon: 'warning', title: 'Invalid employee ID', text: 'Use the format AU2025-0000 or AU2025-00000.' })
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
        phone: editForm.value.contact || '',
        gender: editForm.value.gender === 'Not specified' ? '' : editForm.value.gender,
        employeeId: editForm.value.employeeId,
        avatar: editForm.value.avatar,
      }),
    })
    setProfile(saveMergedUser(response.user))
    closeEdit()
    showSuccessToast('Profile Updated')
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
  --metal-950: #1f2329;
  --metal-900: #2d3138;
  --metal-800: #3a4048;
  --metal-700: #4a525d;
  --metal-600: #5e6772;
  --metal-500: #7b838b;
  --metal-300: #c7ccd2;
  --metal-200: #dfe3e8;
  --metal-100: #edf1f4;
  --metal-50: #f5f7f9;
  --surface: rgba(255, 255, 255, 0.72);
  --surface-strong: rgba(255, 255, 255, 0.9);
  --border: rgba(99, 107, 118, 0.18);
  --text-head: #171c22;
  --text-body: #39424d;
  --text-muted: #5d6974;
  --shadow: 0 18px 36px rgba(34, 40, 46, 0.12);
}

.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255,255,255,0.8), transparent 28%),
    linear-gradient(135deg, #eceef0 0%, #dfe4e8 32%, #cfd5db 100%);
  font-family: 'Poppins', sans-serif;
}

.layout button,
.layout input,
.layout select,
.layout textarea {
  font-family: inherit;
}

.sidebar {
  width: 280px;
  min-width: 280px;
  background: linear-gradient(180deg, rgba(255,255,255,0.56) 0%, rgba(244,246,248,0.86) 100%);
  border-right: 1px solid rgba(96, 112, 124, 0.18);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.35);
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
  border: 3px solid rgba(120, 129, 138, 0.8);
  box-shadow: 0 8px 18px rgba(62, 70, 77, 0.15);
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.avatar-wrap:hover { opacity: 0.9; transform: translateY(-1px); }
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand { font-size: 1.05rem; font-weight: 700; letter-spacing: 0.02em; color: #2f3943; }
.role { font-size: 0.8rem; color: #53606d; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.email { font-size: 0.81rem; color: #66737f; word-break: break-all; }

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
  font-size: 0.9rem;
  font-weight: 500;
  color: #485663;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
  cursor: pointer;
}
.nav-item:hover {
  background: rgba(255,255,255,0.42);
  color: #27313a;
  transform: translateX(1px);
}
.nav-item.active {
  background: linear-gradient(135deg, rgba(71,80,89,0.95), rgba(54,62,70,0.9));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
  color: #fff;
}
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(233,236,239,0.9));
  color: #2f3943;
  border: 1px solid rgba(96, 112, 124, 0.18);
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  margin-top: 16px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}
.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(62, 70, 77, 0.08);
}

.main {
  flex: 1;
  padding: 24px 28px 40px;
  overflow-y: auto;
  min-width: 0;
  height: 100vh;
  box-sizing: border-box;
}

.main-header { margin-bottom: 10px; }
.page-title {
  font-size: 2.15rem;
  font-weight: 800;
  color: #1d242d;
  letter-spacing: -0.04em;
  margin: 0 0 6px;
}
.page-sub {
  font-size: 0.88rem;
  color: #5f6d79;
  margin: 0;
}

/* â”€â”€â”€ Profile Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.profile-card {
  background: rgba(255,255,255,0.58);
  border: 1px solid rgba(118, 129, 140, 0.18);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  backdrop-filter: blur(4px);
  margin: 0;
}

.card-banner {
  height: 160px;
  background: linear-gradient(135deg, #505963 0%, #697684 30%, #8c939b 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  box-shadow: inset 0 -1px 0 rgba(255,255,255,0.18);
  border-radius: 18px 18px 0 0;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 15px;
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.26);
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease, transform 0.2s ease;
  flex-shrink: 0;
  align-self: center;
}
.edit-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}
.edit-save-btn:disabled { cursor: not-allowed; opacity: 0.65; }

.card-body { padding: 18px 28px 28px; }

.card-top {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 26px;
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
  padding: 5px 12px;
  background: rgba(120, 129, 138, 0.09);
  color: #47525d;
  border: 1px solid rgba(120, 129, 138, 0.2);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hero-id,
.hero-email {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #46535f;
  font-weight: 500;
}

.profile-avatar-wrap {
  width: 126px;
  height: 126px;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid rgba(255,255,255,0.95);
  box-shadow: 0 14px 26px rgba(35, 41, 49, 0.18);
  flex-shrink: 0;
  margin-top: -92px;
  position: relative;
  z-index: 2;
  background: linear-gradient(135deg, #e8edf1, #cdd5dc);
}
.profile-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }

.hero-name {
  font-size: 2.1rem;
  font-weight: 800;
  color: #171d22;
  line-height: 1.2;
  margin-bottom: 8px;
  letter-spacing: -0.04em;
}

.profile-info {
  padding-bottom: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid rgba(126, 136, 146, 0.18);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,0.26);
}
.info-item {
  padding: 16px 20px;
  border-right: 1px solid rgba(126, 136, 146, 0.15);
  border-bottom: 1px solid rgba(126, 136, 146, 0.15);
  background: rgba(255,255,255,0.08);
}
.info-item:nth-child(2n) { border-right: none; }
.info-item:nth-last-child(-n+2) { border-bottom: none; }
.info-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7a8691;
  margin-bottom: 6px;
}
.info-value {
  font-size: 0.96rem;
  font-weight: 600;
  color: #232d36;
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

.profile-status-toast {
  position: fixed;
  z-index: 2000;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  display: flex;
  width: min(380px, calc(100vw - 32px));
  align-items: center;
  gap: 11px;
  overflow: hidden;
  padding: 13px 16px;
  border: 1px solid #d8dee2;
  border-left: 3px solid #547b66;
  border-radius: 12px;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 12px 34px rgba(27, 37, 45, .18);
  color: #303a42;
  font: 600 .82rem/1.45 'Poppins', sans-serif;
}
.profile-status-toast::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #aeb5b9;
  content: '';
  transform-origin: left;
  animation: profile-toast-progress 5s linear forwards;
}
.profile-status-toast__icon {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border-radius: 50%;
  background: #edf0f2;
  color: #303a42;
  font-size: .82rem;
  font-weight: 800;
}
.profile-toast-enter-active,
.profile-toast-leave-active { transition: opacity .18s ease, transform .18s ease; }
.profile-toast-enter-from,
.profile-toast-leave-to { opacity: 0; transform: translateY(-8px); }
@keyframes profile-toast-progress { to { transform: scaleX(0); } }

@media (max-width: 900px) {
  .main { padding: 24px 20px; }
  .sidebar { width: 220px; min-width: 220px; }
  .card-hero { gap: 14px; }
  .info-grid { grid-template-columns: 1fr; }
  .info-item:nth-child(2n) { border-right: none; }
  .info-item:nth-last-child(-n+2) { border-bottom: 1px solid #e5e7eb; }
  .info-item:last-child { border-bottom: none; }
}
@media (max-width: 640px) {
  .profile-status-toast {
    top: max(12px, env(safe-area-inset-top));
    right: 12px;
    width: min(360px, calc(100vw - 24px));
    padding: 12px 14px;
    font-size: .78rem;
  }
}
</style>
