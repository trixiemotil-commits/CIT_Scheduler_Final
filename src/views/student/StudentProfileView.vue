<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="refreshProfile" />
      <div class="mobile-app" :class="{ 'profile-modal-open': showModal || showLogoutModal }">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Profile Page</div>
      <span class="header-spacer" aria-hidden="true"></span>
    </div>

    <div class="profile-card">
      <div class="profile-identity">
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
        <div class="profile-copy">
          <div class="profile-name">{{ fullName }}</div>
          <div class="profile-email">{{ user.email || '--' }}</div>
          <span class="active-badge">{{ accountStatusLabel }} Student</span>
        </div>
      </div>
    </div>

    <section class="profile-section">
      <h2 class="profile-section-title">Personal</h2>
      <div class="profile-menu">
        <button class="profile-menu-row" type="button" @click="openEditModal">
          <span class="profile-menu-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <span class="profile-menu-copy"><strong>Profile details</strong><small>{{ studentIdDisplay }} · {{ roleLabel }}</small></span>
          <svg class="profile-menu-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="profile-detail-grid">
          <div><span>Year level</span><strong>{{ yearLevelDisplay }}</strong></div>
          <div><span>Section</span><strong>{{ sectionDisplay }}</strong></div>
          <div><span>Department</span><strong>{{ user.department || '--' }}</strong></div>
          <div><span>Email</span><strong>{{ user.email || '--' }}</strong></div>
        </div>
      </div>
    </section>

    <section class="profile-section">
      <h2 class="profile-section-title">Account</h2>
      <div class="profile-menu">
        <button class="profile-menu-row" type="button" @click="$router.push('/student/change-password')">
          <span class="profile-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
          <span class="profile-menu-copy"><strong>Change password</strong><small>Keep your account secure</small></span>
          <svg class="profile-menu-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-menu-row" type="button" @click="$router.push('/student/faqs')">
          <span class="profile-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1.1-1.9 1.4-1.9 3"/><path d="M12 17h.01"/></svg></span>
          <span class="profile-menu-copy"><strong>Frequently asked questions</strong><small>Find help about your account</small></span>
          <svg class="profile-menu-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-menu-row profile-menu-row--danger" type="button" @click="showLogoutModal = true">
          <span class="profile-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
          <span class="profile-menu-copy"><strong>Logout</strong><small>End your current session</small></span>
          <svg class="profile-menu-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay logout-overlay" @click.self="showLogoutModal = false">
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
    </Teleport>

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
const showLogoutModal = ref(false)
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
function confirmLogout() {
  logout()
  showLogoutModal.value = false
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

:global(body:has(.modal-sheet) .student-tab-bar) {
  z-index: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
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
.header-spacer { width: 34px; height: 34px; flex: 0 0 34px; }
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
.profile-section {
  background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(235,239,241,.9));
  border: 1px solid rgba(255,255,255,.98);
  border-radius: 18px;
  margin: 4px 16px 0;
  box-shadow: inset 0 1px rgba(255,255,255,.98), 0 10px 22px rgba(48,57,64,.1);
}
.profile-card {
  padding: 24px 18px;
  display: flex;
  align-items: stretch;
}
.profile-identity {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
}
.profile-copy {
  min-width: 0;
  flex: 1;
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
  font-size: 1.45rem;
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
.profile-name { font-size: 1.08rem; font-weight: 800; color: #283139; line-height: 1.25; overflow-wrap: anywhere; }
.profile-email { margin-top: 4px; font-size: 0.78rem; color: #7d8992; line-height: 1.35; overflow-wrap: anywhere; }
.active-badge {
  display: inline-flex;
  margin-top: 9px;
  background: linear-gradient(145deg, #69747d, #303940);
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 3px 10px;
  font-weight: 700;
}

@media (max-width: 380px) {
  .profile-card { padding-inline: 14px; }
  .profile-identity { gap: 11px; }
  .avatar-wrap, .avatar-lg, .avatar-img { width: 54px; height: 54px; }
  .profile-name { font-size: 1rem; }
  .profile-email { font-size: .72rem; }
}

.profile-section { margin-top: 18px; padding: 16px 14px 14px; }
.profile-section-title { margin: 0 4px 9px; color: #68737c; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
.profile-menu { overflow: hidden; border-radius: 14px; background: rgba(255,255,255,.52); box-shadow: inset 0 1px rgba(255,255,255,.84); }
.profile-menu-row { width: 100%; min-height: 66px; display: flex; align-items: center; gap: 11px; padding: 12px 10px; border: 0; border-bottom: 1px solid rgba(104,112,120,.14); background: transparent; color: #303940; text-align: left; cursor: pointer; font-family: inherit; }
.profile-menu-row:last-child { border-bottom: 0; }
.profile-menu-row:active { background: rgba(207,213,217,.38); }
.profile-menu-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border-radius: 10px; color: #69747d; background: linear-gradient(145deg, #f8f9f9, #d7dde0); box-shadow: inset 0 1px rgba(255,255,255,.9); }
.profile-menu-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.profile-menu-copy strong { color: #303940; font-size: .86rem; font-weight: 800; line-height: 1.25; }
.profile-menu-copy small { color: #87919a; font-size: .7rem; line-height: 1.3; overflow-wrap: anywhere; }
.profile-menu-chevron { flex: 0 0 auto; color: #89939b; }
.profile-menu-row--danger .profile-menu-icon { color: #b5444f; background: linear-gradient(145deg, #fff8f8, #ead9da); }
.profile-menu-row--danger .profile-menu-copy strong { color: #b5444f; }
.profile-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; padding: 10px; background: rgba(104,112,120,.12); }
.profile-detail-grid > div { min-width: 0; padding: 9px; background: rgba(255,255,255,.6); }
.profile-detail-grid span, .profile-detail-grid strong { display: block; overflow-wrap: anywhere; }
.profile-detail-grid span { color: #8a949c; font-size: .66rem; text-transform: uppercase; letter-spacing: .05em; }
.profile-detail-grid strong { margin-top: 3px; color: #3c464e; font-size: .75rem; line-height: 1.25; }

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
  background: rgba(31, 35, 39, 0.48);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10000 !important;
}

.logout-modal-box {
  width: min(88vw, 350px);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 26px 20px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.14);
  text-align: center;
}

.logout-modal-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(230, 57, 70, 0.08);
}

.logout-modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1f2933;
}

.logout-modal-sub {
  margin: 0;
  color: #59656e;
  font-size: 0.9rem;
}

.logout-modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 12px;
}

.logout-cancel-btn,
.logout-confirm-btn {
  flex: 1;
  border: none;
  border-radius: 12px;
  font: inherit;
  font-weight: 800;
  padding: 12px 10px;
  cursor: pointer;
}

.logout-cancel-btn {
  background: #ffffff;
  color: #303940;
  box-shadow: inset 0 0 0 1px rgba(48, 57, 64, 0.08);
}

.logout-confirm-btn {
  background: linear-gradient(145deg, #69747d, #303940);
  color: #fff;
  box-shadow: 0 8px 14px rgba(39, 44, 49, 0.18);
}

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
.modal-overlay.logout-overlay { align-items: center; }
.modal-sheet {
  position: fixed !important;
  left: 50%;
  right: 0;
  bottom: 0 !important;
  margin: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: auto;
  max-height: 92dvh;
  overflow-y: auto;
  background:
    radial-gradient(circle at 100% 0%, rgba(255,255,255,.72), transparent 18rem),
    linear-gradient(145deg, #f6f7f7 0%, #e8ebec 48%, #d6dbde 100%);
  border-radius: 26px 26px 0 0;
  border: 1px solid rgba(255,255,255,.94);
  padding-bottom: max(18px, env(safe-area-inset-bottom, 0px));
  z-index: 10001 !important;
  box-shadow: 0 -18px 42px rgba(22,26,30,.3), inset 0 1px rgba(255,255,255,.96);
}
.modal-handle { width: 42px; height: 5px; margin: 12px auto 0; border-radius: 999px; background: #aeb6bc; box-shadow: inset 0 1px rgba(255,255,255,.72); }
.modal-header {
  font-size: 1.22rem;
  font-weight: 800;
  color: #252b31;
  padding: 18px 22px 16px;
  border-bottom: 1px solid rgba(104,112,120,.16);
  text-shadow: 0 1px rgba(255,255,255,.58);
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 14px 18px 0;
}
.modal-avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 2px;
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
  border: 3px solid #59656e;
  box-shadow: 0 5px 12px rgba(39,44,49,.18), inset 0 1px rgba(255,255,255,.75);
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
  min-height: 46px;
  border: 1px solid #c5cdd2;
  background: linear-gradient(145deg, #fafbfb, #e3e7e9);
  color: #59656e;
  border-radius: 12px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  box-shadow: inset 0 1px rgba(255,255,255,.9), 0 4px 9px rgba(48,57,64,.1);
  cursor: pointer;
}
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.76rem; color: #5f6b75; font-weight: 800; }
.field-input {
  min-height: 52px;
  border: 1px solid #c5cdd2;
  border-radius: 14px;
  padding: 10px 14px;
  font-family: inherit;
  font-size: .88rem;
  color: #303940;
  background: linear-gradient(180deg, rgba(250,251,251,.84), rgba(232,235,236,.84));
  box-shadow: inset 2px 2px 5px rgba(61,67,73,.08), 0 1px rgba(255,255,255,.8);
}
.field-select {
  min-height: 52px;
  border: 1px solid #c5cdd2;
  border-radius: 14px;
  padding: 10px 14px;
  font-family: inherit;
  font-size: .88rem;
  color: #59656e;
  background: linear-gradient(180deg, rgba(250,251,251,.84), rgba(232,235,236,.84));
  box-shadow: inset 2px 2px 5px rgba(61,67,73,.08), 0 1px rgba(255,255,255,.8);
}
.field-input:focus,
.field-select:focus { outline: none; border-color: #69747d; box-shadow: 0 0 0 3px rgba(83,91,100,.14), inset 2px 2px 5px rgba(61,67,73,.06); }
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
.modal-cancel { color: #59656e; background: linear-gradient(145deg, #fafbfb, #dfe3e5); border-color: #c5cdd2; box-shadow: inset 0 1px rgba(255,255,255,.9), 0 4px 9px rgba(48,57,64,.08); }
.modal-save {
  color: #fff;
  background: linear-gradient(145deg, #69747d, #303940);
  border-color: #303940;
  box-shadow: inset 0 1px rgba(255,255,255,.18), 0 7px 15px rgba(39,44,49,.2);
}
.admin-managed-note{display:block;margin-top:2px;color:#7a8289;font-size:.68rem;line-height:1.4}.field-select:disabled{cursor:not-allowed;opacity:.72;background:linear-gradient(180deg,#eef0f1,#e1e5e7)}
</style>
