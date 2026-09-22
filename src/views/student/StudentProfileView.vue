<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshProfile" />
      <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Profile Page</div>
      <button class="settings-icon-btn" type="button" aria-label="Open settings" @click="$router.push('/student/settings')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
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
      <button class="edit-btn" type="button" @click="openEditModal">Edit Profile</button>
    </div>

    <div class="info-card">
      <div class="info-title">Personal Information</div>
      <div class="info-rows">
        <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">{{ fullName }}</span></div>
        <div class="info-row"><span class="info-label">Student ID</span><span class="info-val">{{ studentIdDisplay }}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-val">{{ user.email || '--' }}</span></div>
        <div class="info-row"><span class="info-label">Year Level</span><span class="info-val">{{ yearLevelDisplay }}</span></div>
        <div class="info-row"><span class="info-label">Section</span><span class="info-val">{{ sectionDisplay }}</span></div>
        <div class="info-row"><span class="info-label">Department</span><span class="info-val">{{ user.department || '--' }}</span></div>
        <div class="info-row"><span class="info-label">Role</span><span class="info-val">{{ roleLabel }}</span></div>
      </div>
    </div>

    <div class="action-row">
      <button class="act-btn red" @click="doLogout">Logout</button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-sheet">
        <div class="modal-handle" aria-hidden="true"></div>
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
            <input v-model="form.email" class="field-input" type="email" readonly disabled />
          </div>
          <div class="field-group">
            <label class="field-label">Year Level</label>
            <select v-model="form.yearLevel" class="field-select" disabled>
              <option value="" disabled>Select Year Level</option>
              <option v-for="opt in yearLevelOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Section</label>
            <select v-model="form.section" class="field-select" disabled>
              <option value="" disabled>Select Section</option>
              <option v-for="opt in sectionOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <small class="admin-managed-note">Managed by the administrator for the current semester.</small>
          </div>
          <div v-if="saveError" class="msg-err">{{ saveError }}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showModal = false">Cancel</button>
          <button class="modal-save" :disabled="isSaving" @click="saveProfile">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
        </div>
      </div>
    </div>

      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import { notifyStudentDataChanged, useAutoRefresh } from '@/composables/useAutoRefresh.js'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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
      grade: payload.user.yearLevel || payload.user.grade || user.value.grade,
      section: payload.user.section || user.value.section,
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
    notifyStudentDataChanged('profile-updated')
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

const { refresh: refreshProfile } = useAutoRefresh(fetchLatestProfile)
</script>

<style scoped>
:global(ion-content) {
  --background: linear-gradient(145deg, #eef0f1 0%, #dfe3e5 52%, #cfd4d7 100%);
}

.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  box-sizing: border-box;
  margin: 0 auto;
  background: linear-gradient(145deg, #eef0f1 0%, #dfe3e5 52%, #cfd4d7 100%) !important;
  display: flex;
  flex-direction: column;
  padding-bottom: 110px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, .88);
  padding: 16px 18px;
  border-bottom: 1px solid rgba(113, 123, 131, .18);
  backdrop-filter: blur(10px);
}
.back-btn {
  width: 34px;
  height: 34px;
  justify-content: center;
  background: linear-gradient(145deg, #fafbfb, #dfe3e5);
  border: 1px solid rgba(255,255,255,.9);
  cursor: pointer;
  color: #4d5860;
  padding: 0;
  display: flex;
  align-items: center;
  border-radius: 50%;
  box-shadow: inset 0 1px rgba(255,255,255,.95), 0 5px 12px rgba(48,57,64,.1);
}
.header-title { font-weight: 700; color: #4b5563; font-size: 1.15rem; }
.settings-icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 50%;
  background: linear-gradient(145deg, #fafbfb, #dfe3e5);
  color: #59656e;
  cursor: pointer;
  box-shadow: inset 0 1px rgba(255,255,255,.95), 0 5px 12px rgba(48,57,64,.1);
}
.settings-icon-btn:active { transform: translateY(1px); }
.edit-btn {
  width: 100%;
  margin-top: 14px;
  border: 1px solid #303940;
  background: linear-gradient(145deg, #69747d, #303940);
  color: #fff;
  border-radius: 11px;
  padding: 11px 16px;
  font-size: 0.84rem;
  font-weight: 700;
  box-shadow: inset 0 1px rgba(255,255,255,.18), 0 6px 13px rgba(39,44,49,.18);
}

.profile-card,
.info-card {
  background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(235,239,241,.9));
  border: 1px solid rgba(255,255,255,.98);
  border-radius: 18px;
  margin: 4px 16px 0;
  box-shadow: inset 0 1px rgba(255,255,255,.98), 0 10px 22px rgba(48,57,64,.1);
}
.profile-card {
  padding: 26px 18px 24px;
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
  background: linear-gradient(145deg, #69747d, #303940);
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
  border: 3px solid #59656e;
  box-shadow: 0 4px 10px rgba(39,44,49,.18);
}
.avatar-plus {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(145deg, #69747d, #303940);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #f8f9f9;
}
.avatar-input {
  display: none;
}
.profile-name { margin-top: 10px; font-size: 1.15rem; font-weight: 800; color: #283139; }
.profile-email { margin-top: 3px; font-size: 0.82rem; color: #7d8992; }
.active-badge {
  margin-top: 9px;
  background: linear-gradient(145deg, #69747d, #303940);
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 3px 10px;
  font-weight: 700;
}

.info-card { margin-top: 14px; padding: 16px 18px 10px; }
.info-title {
  display: block;
  color: #303940;
  font-size: 1.05rem;
  font-weight: 800;
  text-align: left;
}
.info-rows { margin-top: 6px; }
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid rgba(104,112,120,.16);
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #7f8b94; font-size: 0.84rem; flex: 0 0 34%; }
.info-val { color: #303940; font-size: 0.84rem; font-weight: 700; text-align: right; overflow-wrap: anywhere; }

.action-row { display: flex; gap: 10px; padding: 16px 16px 0; }
.action-row .act-btn:only-child { flex: 1; }
.act-btn {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 13px 11px;
  color: #fff;
  font-weight: 700;
  font-family: inherit;
}
.act-btn.green { background: linear-gradient(145deg, #69747d, #303940); border: 1px solid #303940; box-shadow: inset 0 1px rgba(255,255,255,.18), 0 7px 14px rgba(39,44,49,.18); }
.act-btn.red { background: linear-gradient(145deg, #d04d59, #b33743); border: 1px solid #a9323d; box-shadow: inset 0 1px rgba(255,255,255,.18), 0 7px 14px rgba(125,42,51,.16); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(31,35,39,.58);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
}
.modal-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  margin: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  max-height: 92dvh;
  overflow-y: auto;
  background: linear-gradient(145deg, #f8f9f9, #dfe3e5);
  border-radius: 24px 24px 0 0;
  border: 1px solid rgba(255,255,255,.9);
  padding-bottom: max(18px, env(safe-area-inset-bottom, 0px));
  z-index: 2001;
  box-shadow: 0 -14px 35px rgba(22,26,30,.26), inset 0 1px rgba(255,255,255,.95);
}
.modal-handle { width: 40px; height: 4px; margin: 12px auto 0; border-radius: 999px; background: #aeb6bc; }
.modal-header {
  font-size: 1.35rem;
  font-weight: 800;
  color: #303940;
  padding: 17px 22px 16px;
  border-bottom: 1px solid rgba(104,112,120,.18);
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
  border: 2px solid #4b5563;
}
.modal-avatar-fallback {
  background: #4b5563;
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
  background: #4b5563;
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
  color: #4b5563;
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
  align-items: stretch;
  gap: 10px;
  padding: 16px 18px 0;
}
.modal-cancel,
.modal-save {
  min-height: 46px;
  flex: 1;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: .88rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 13px;
}
.modal-cancel { color: #59656e; background: linear-gradient(145deg, #f7f9f9, #dfe3e5); border-color: #cbd2d6; box-shadow: inset 0 1px rgba(255,255,255,.9); }
.modal-save {
  color: #fff;
  background: linear-gradient(145deg, #69747d, #303940);
  border-color: #303940;
  box-shadow: inset 0 1px rgba(255,255,255,.18), 0 7px 15px rgba(39,44,49,.2);
}
.admin-managed-note{display:block;margin-top:6px;color:#7a8289;font-size:.7rem;line-height:1.4}.field-select:disabled{cursor:not-allowed;opacity:.72;background:#eef0f2}
</style>
