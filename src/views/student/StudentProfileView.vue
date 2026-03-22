<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Profile Page</div>
      <button class="edit-btn" @click="openEditModal">Edit</button>
    </div>

    <div class="profile-card">
      <button class="avatar-wrap" @click="openAvatarPicker" aria-label="Change profile picture">
        <img v-if="user.avatar" :src="user.avatar" alt="Profile picture" class="avatar-img" />
        <div v-else class="avatar-lg">{{ initials }}</div>
        <span class="avatar-plus">+</span>
      </button>
      <input
        ref="avatarInput"
        class="avatar-input"
        type="file"
        accept="image/*"
        @change="onAvatarChange"
      />
      <div class="profile-name">{{ fullName }}</div>
      <div class="profile-email">{{ user.email || '--' }}</div>
      <span class="active-badge">{{ accountStatusLabel }} Student</span>
    </div>

    <div class="info-card">
      <div class="info-title">Personal Information</div>
      <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">{{ fullName }}</span></div>
      <div class="info-row"><span class="info-label">Student ID</span><span class="info-val">{{ studentIdDisplay }}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-val">{{ user.email || '--' }}</span></div>
      <div class="info-row"><span class="info-label">Year Level</span><span class="info-val">{{ yearLevelDisplay }}</span></div>
      <div class="info-row"><span class="info-label">Section</span><span class="info-val">{{ sectionDisplay }}</span></div>
      <div class="info-row"><span class="info-label">Department</span><span class="info-val">{{ user.department || '--' }}</span></div>
      <div class="info-row"><span class="info-label">Role</span><span class="info-val">{{ roleLabel }}</span></div>
    </div>

    <div class="action-row">
      <button class="act-btn green" @click="$router.push('/student/settings')">Settings</button>
      <button class="act-btn red" @click="doLogout">Logout</button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-sheet">
        <div class="modal-header">Edit Profile</div>
        <div class="modal-body">
          <div class="modal-avatar-row">
            <div class="modal-avatar-wrap" @click="openAvatarPicker" role="button" tabindex="0" aria-label="Change profile picture">
              <img v-if="user.avatar" :src="user.avatar" alt="Profile picture" class="modal-avatar-img" />
              <div v-else class="modal-avatar-fallback">{{ initials }}</div>
              <span class="modal-avatar-plus">+</span>
            </div>
            <button class="change-photo-btn" @click="openAvatarPicker">Change Profile Picture</button>
          </div>
          <div class="field-group">
            <label class="field-label">Full Name</label>
            <input v-model="form.name" class="field-input" type="text" />
          </div>
          <div class="field-group">
            <label class="field-label">Email</label>
            <input v-model="form.email" class="field-input" type="email" />
          </div>
          <div class="field-group">
            <label class="field-label">Year Level</label>
            <select v-model="form.yearLevel" class="field-select">
              <option value="" disabled>Select Year Level</option>
              <option v-for="opt in yearLevelOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Section</label>
            <select v-model="form.section" class="field-select">
              <option value="" disabled>Select Section</option>
              <option v-for="opt in sectionOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div v-if="saveError" class="msg-err">{{ saveError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showModal = false">Cancel</button>
          <button class="modal-save" :disabled="isSaving" @click="saveProfile">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
        </div>
      </div>
    </div>

    <BottomNav active="profile" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUser, getToken, logout } from '@/auth.js'
import { useRouter } from 'vue-router'
import BottomNav from '@/components/student/BottomNav.vue'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function normalizeUser(rawUser) {
  const raw = rawUser || {}
  const resolvedName = String(raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim()).trim()
  return {
    ...raw,
    name: resolvedName || 'Student',
  }
}

const user = ref(normalizeUser(getUser()))
const fullName = computed(() => user.value.name || '--')
const initials = computed(() => fullName.value.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'S')
const studentIdDisplay = computed(() => user.value.studentId || user.value.employeeId || '--')
const yearLevelDisplay = computed(() => user.value.yearLevel || user.value.grade || '--')
const sectionDisplay = computed(() => user.value.section || '--')
const roleLabel = computed(() => {
  const role = String(user.value.role || 'student')
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const accountStatusLabel = computed(() => String(user.value.account_status || user.value.status || 'Active'))

const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const sectionOptions = ['South 1', 'South 2', 'South 3', 'South 4', 'South 5', 'South 6', 'South 7']

const showModal = ref(false)
const form = ref({
  name: fullName.value,
  email: user.value.email || '',
  yearLevel: user.value.yearLevel || user.value.grade || '',
  section: user.value.section || '',
})
const avatarInput = ref(null)
const isSaving = ref(false)
const saveError = ref('')

function splitFullName(fullName) {
  const normalized = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}

function persistUser() {
  try {
    localStorage.setItem('cit_user', JSON.stringify(user.value))
  } catch (_error) {
    // Ignore localStorage write failures to avoid breaking profile interactions.
  }
}

async function fetchLatestProfile() {
  const token = getToken()
  if (!token) return

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return

    const payload = await response.json()
    if (!payload?.user) return

    user.value = {
      ...normalizeUser(payload.user),
      grade: user.value.grade,
      section: user.value.section,
    }
    persistUser()
  } catch (_error) {
    // Non-blocking profile refresh.
  }
}

function openAvatarPicker() {
  avatarInput.value?.click()
}

function onAvatarChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    user.value = {
      ...user.value,
      avatar: String(reader.result || ''),
    }
    persistUser()
  }
  reader.readAsDataURL(file)
}

function openEditModal() {
  saveError.value = ''
  form.value = {
    ...form.value,
    name: fullName.value === '--' ? '' : fullName.value,
    email: user.value.email || '',
    yearLevel: user.value.yearLevel || user.value.grade || '',
    section: user.value.section || '',
  }
  showModal.value = true
}

async function saveProfile() {
  if (isSaving.value) return

  saveError.value = ''
  const { firstName, lastName } = splitFullName(form.value.name)
  if (!firstName || !lastName) {
    saveError.value = 'Please enter your full name.'
    return
  }

  if (!form.value.email) {
    saveError.value = 'Email is required.'
    return
  }

  isSaving.value = true
  try {
    const token = getToken()
    if (!token) {
      throw new Error('Session expired. Please log in again.')
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email: form.value.email,
        yearLevel: form.value.yearLevel,
        section: form.value.section,
        avatar: user.value.avatar || undefined,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.message || 'Failed to save profile changes.')
    }

    user.value = {
      ...normalizeUser(payload.user || user.value),
      yearLevel: payload.user?.yearLevel || form.value.yearLevel,
      grade: payload.user?.yearLevel || form.value.yearLevel,
      section: payload.user?.section || form.value.section,
    }
    persistUser()
    showModal.value = false
  } catch (error) {
    saveError.value = error.message || 'Failed to save profile changes.'
  } finally {
    isSaving.value = false
  }
}
function doLogout() {
  logout()
  router.push('/')
}

onMounted(() => {
  fetchLatestProfile()
})
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f3f5f7;
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
}
.header-title { font-weight: 700; color: #252a2f; font-size: 1rem; }
.edit-btn {
  border: none;
  background: #1b4332;
  color: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
}

.profile-card,
.info-card {
  background: #fff;
  border: 1px solid #e3e8ed;
  border-radius: 12px;
  margin: 12px 16px 0;
}
.profile-card {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-wrap {
  position: relative;
  width: 58px;
  height: 58px;
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
}
.avatar-lg {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  font-weight: 700;
}
.avatar-img {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1b4332;
}
.avatar-plus {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
.avatar-input {
  display: none;
}
.profile-name { margin-top: 8px; font-size: 1.05rem; font-weight: 700; color: #171b20; }
.profile-email { margin-top: 2px; font-size: 0.79rem; color: #89939d; }
.active-badge {
  margin-top: 6px;
  background: #1b4332;
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 3px 10px;
  font-weight: 700;
}

.info-card { padding: 12px; }
.info-title { font-weight: 700; color: #2e343a; margin-bottom: 10px; }
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #eef1f4;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #8a93a0; font-size: 0.84rem; }
.info-val { color: #2b3035; font-size: 0.84rem; font-weight: 600; text-align: right; }

.action-row { display: flex; gap: 8px; padding: 12px 16px 0; }
.act-btn {
  flex: 1;
  border: none;
  border-radius: 9px;
  padding: 11px;
  color: #fff;
  font-weight: 700;
  font-family: inherit;
}
.act-btn.green { background: #1b4332; }
.act-btn.red { background: #be404a; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}
.modal-sheet {
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-radius: 18px 18px 0 0;
  border: 1px solid #d7dde4;
  padding-bottom: 18px;
}
.modal-header {
  font-size: 1.85rem;
  font-weight: 700;
  color: #171c21;
  padding: 16px 18px 8px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 18px;
}
.modal-avatar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0 2px;
}
.modal-avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
}
.modal-avatar-img,
.modal-avatar-fallback {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}
.modal-avatar-img {
  object-fit: cover;
  border: 2px solid #1b4332;
}
.modal-avatar-fallback {
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}
.modal-avatar-plus {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  border: 2px solid #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}
.change-photo-btn {
  border: 1px solid #cfd6de;
  background: #f8fafb;
  color: #1b4332;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 0.76rem; color: #636e79; font-weight: 600; }
.field-input {
  border: 1px solid #d2d8df;
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 0.95rem;
}
.field-select {
  border: 1px solid #d2d8df;
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 0.95rem;
  background: #fff;
}
.modal-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.msg-err {
  color: #be404a;
  font-size: 0.8rem;
  font-weight: 600;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px 0;
}
.modal-cancel,
.modal-save {
  border: none;
  background: none;
  font-family: inherit;
  font-size: 1.05rem;
  cursor: pointer;
}
.modal-cancel { color: #be404a; font-weight: 600; }
.modal-save {
  color: #fff;
  background: #1b4332;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 1rem;
  font-weight: 600;
}
</style>
