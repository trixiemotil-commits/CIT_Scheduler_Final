<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
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
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
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

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="main">
      <header class="main-header">
        <div>
          <span class="settings-eyebrow">Account &amp; security</span>
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Manage account access, password security, and sign-in preferences.</p>
        </div>
      </header>

      <div class="settings-body">

        <!-- ── Change Password ── -->
        <div class="settings-card two-factor-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h2 class="settings-card-title">Change Password</h2>
              <p class="settings-card-sub">Use your current password and a one-time code to secure this change.</p>
            </div>
          </div>

          <form class="settings-form" @submit.prevent="passwordStep === 1 ? advancePasswordStep() : handleUpdatePassword()">
            <div v-if="passwordStep === 1" class="settings-step-label"><span>Step 1 of 2</span> Verify your identity</div>
            <div v-else class="settings-step-label"><span>Step 2 of 2</span> Choose a new password</div>

            <div v-if="passwordStep === 1" class="settings-row">
              <div class="settings-group">
                <label class="settings-label">Current Password</label>
                <div class="pw-input-wrap">
                  <input
                    v-model="passwordForm.current"
                    :type="showCurrent ? 'text' : 'password'"
                    class="settings-input"
                    placeholder="Enter current password"
                  />
                  <button type="button" class="pw-eye" @click="showCurrent = !showCurrent">
                    <svg v-if="!showCurrent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <div class="settings-group">
                <label class="settings-label">OTP</label>
                <div class="otp-wrap">
                  <input v-model="passwordForm.otp" type="text" inputmode="numeric" autocomplete="one-time-code" class="settings-input" placeholder="_ _ _ _ _ _" maxlength="6" @input="passwordForm.otp = passwordForm.otp.replace(/\D/g, '')" />
                  <button type="button" class="otp-btn" :disabled="isSendingOtp || otpSecondsRemaining > 0" @click="sendOtp">{{ isSendingOtp ? 'Sending...' : otpSecondsRemaining > 0 ? `Expires in ${formattedOtpTime}` : 'Send OTP' }}</button>
                </div>
                <span v-if="otpSent" class="otp-expiry">Code expires in {{ formattedOtpTime }}.</span>
              </div>
            </div>

            <div v-else class="settings-row">
              <div class="settings-group">
                <label class="settings-label">New Password</label>
                <div class="pw-input-wrap">
                  <input
                    v-model="passwordForm.newPw"
                    :type="showNew ? 'text' : 'password'"
                    class="settings-input"
                    placeholder="Enter new password"
                  />
                  <button type="button" class="pw-eye" @click="showNew = !showNew">
                    <svg v-if="!showNew" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <div class="settings-group">
                <label class="settings-label">Confirm New Password</label>
                <div class="pw-input-wrap">
                  <input
                    v-model="passwordForm.confirmPw"
                    :type="showConfirm ? 'text' : 'password'"
                    class="settings-input"
                    placeholder="Confirm new password"
                  />
                  <button type="button" class="pw-eye" @click="showConfirm = !showConfirm">
                    <svg v-if="!showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="pwError"   class="settings-msg settings-msg--error">{{ pwError }}</div>
            <div v-if="pwSuccess" class="settings-msg settings-msg--success">{{ pwSuccess }}</div>

            <div class="settings-form-footer">
              <button v-if="passwordStep === 2" type="button" class="password-back-btn" @click="passwordStep = 1">Back</button>
              <button v-if="passwordStep === 1" type="button" class="update-pw-btn" @click="advancePasswordStep">Continue</button>
              <button v-else type="submit" class="update-pw-btn" :disabled="isUpdatingPassword">{{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}</button>
            </div>
          </form>
        </div>

        <div class="settings-card verification-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h2 class="settings-card-title">Email verification on login</h2>
              <p class="settings-card-sub">Add a one-time verification step whenever you sign in.</p>
            </div>
            <div class="tfa-control">
              <span class="tfa-status">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
              <button type="button" class="toggle-switch" :class="{ 'toggle-switch--on': twoFactorEnabled }" :disabled="isSavingTwoFactor" :aria-pressed="twoFactorEnabled" :aria-label="twoFactorEnabled ? 'Disable email verification' : 'Enable email verification'" @click="toggleTwoFactor">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-group">
              <p class="tfa-note">Send a verification code to your PHINMA Gmail address whenever you log in.</p>
              <input v-model="twoFactorPassword" type="password" class="settings-input" placeholder="Current password to confirm change" />
              <div v-if="twoFactorError" class="settings-msg settings-msg--error">{{ twoFactorError }}</div>
              <div v-if="twoFactorSuccess" class="settings-msg settings-msg--success">{{ twoFactorSuccess }}</div>
            </div>
          </div>
        </div>



        <!-- ── FAQs ── -->
        <div class="settings-faq-section">
          <div class="faq-header">
            <div class="faq-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 class="faq-title">FAQs</h2>
          </div>

          <div class="faq-list">
            <div
              v-for="(faq, i) in faqs"
              :key="i"
              class="faq-item"
              :class="{ 'faq-item--open': openFaq === i }"
            >
              <button class="faq-question" @click="openFaq = openFaq === i ? null : i">
                <span>{{ faq.q }}</span>
                <svg
                  class="faq-chevron"
                  :class="{ 'faq-chevron--open': openFaq === i }"
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                ><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div v-show="openFaq === i" class="faq-answer">
                <template v-if="Array.isArray(faq.a)">
                  <ul class="faq-bullets">
                    <li v-for="(item, idx) in faq.a" :key="idx">{{ item }}</li>
                  </ul>
                </template>
                <template v-else>
                  {{ faq.a }}
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>



  <!-- ═══ Logout Confirm Modal ═══ -->
  <Teleport to="body">
    <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
      <div class="logout-modal-box">
        <div class="logout-modal-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 class="logout-modal-title">Log out?</h2>
        <p class="logout-modal-sub">You will be returned to the login page.</p>
        <div class="logout-modal-actions">
          <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
          <button class="logout-confirm-btn" @click="confirmLogout">Log out</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

const user = getUser() || {}
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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

/* ── Nav ── */
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

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

/* ── Change Password ── */
const passwordForm = ref({ current: '', otp: '', newPw: '', confirmPw: '' })
const passwordStep = ref(1)
const showCurrent  = ref(false)
const showNew      = ref(false)
const showConfirm  = ref(false)
const pwError      = ref('')
const pwSuccess    = ref('')
const otpSent      = ref(false)
const isSendingOtp = ref(false)
const isUpdatingPassword = ref(false)
const otpSecondsRemaining = ref(0)
let otpTimer = null
const formattedOtpTime = computed(() => `0:${String(otpSecondsRemaining.value).padStart(2, '0')}`)
const twoFactorEnabled = ref(Boolean(user.twoFactorEnabled))
const twoFactorPassword = ref('')
const twoFactorError = ref('')
const twoFactorSuccess = ref('')
const isSavingTwoFactor = ref(false)

async function toggleTwoFactor() {
  twoFactorError.value = ''
  twoFactorSuccess.value = ''
  const enabled = !twoFactorEnabled.value
  if (!twoFactorPassword.value) {
    twoFactorError.value = 'Enter your current password to confirm this change.'
    return
  }
  isSavingTwoFactor.value = true
  try {
    const response = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ twoFactorEnabled: enabled, currentPassword: twoFactorPassword.value }),
    })
    twoFactorEnabled.value = Boolean(response.user?.twoFactorEnabled)
    twoFactorPassword.value = ''
    twoFactorSuccess.value = enabled ? 'Email verification enabled.' : 'Email verification disabled.'
  } catch (error) {
    twoFactorError.value = error.message || 'Unable to update email verification.'
  } finally {
    isSavingTwoFactor.value = false
  }
}

function clearOtpTimer() {
  if (otpTimer) clearInterval(otpTimer)
  otpTimer = null
  otpSecondsRemaining.value = 0
}

function startOtpTimer() {
  clearOtpTimer()
  otpSecondsRemaining.value = 60
  otpTimer = setInterval(() => {
    otpSecondsRemaining.value -= 1
    if (otpSecondsRemaining.value <= 0) {
      clearOtpTimer()
      otpSent.value = false
      passwordForm.value.otp = ''
      pwError.value = 'OTP expired. Send a new code to continue.'
    }
  }, 1000)
}

async function sendOtp() {
  if (!passwordForm.value.current) {
    pwError.value   = 'Please enter your current password first.'
    pwSuccess.value = ''
    return
  }

  pwError.value = ''
  pwSuccess.value = ''
  isSendingOtp.value = true
  try {
    const response = await apiRequest('/auth/request-password-otp', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: passwordForm.value.current }),
    })
    passwordForm.value.otp = ''
    otpSent.value = true
    startOtpTimer()
    pwSuccess.value = response.message
  } catch (error) {
    pwError.value = error.message || 'Unable to send the OTP.'
  } finally {
    isSendingOtp.value = false
  }
}

function advancePasswordStep() {
  pwError.value = ''
  pwSuccess.value = ''
  if (!passwordForm.value.current || !passwordForm.value.otp) {
    pwError.value = 'Enter your current password and the OTP to continue.'
    return
  }
  if (!/^\d{6}$/.test(passwordForm.value.otp)) {
    pwError.value = 'Enter the 6-digit OTP sent to your email.'
    return
  }
  passwordStep.value = 2
}

async function handleUpdatePassword() {
  pwError.value   = ''
  pwSuccess.value = ''
  if (!passwordForm.value.current || !passwordForm.value.otp || !passwordForm.value.newPw || !passwordForm.value.confirmPw) {
    pwError.value = 'Please fill in all password fields and the OTP.'
    return
  }
  if (!/^\d{6}$/.test(passwordForm.value.otp)) {
    pwError.value = 'Enter the 6-digit OTP sent to your email.'
    return
  }
  if (passwordForm.value.newPw !== passwordForm.value.confirmPw) {
    pwError.value = 'New passwords do not match.'
    return
  }
  if (passwordForm.value.newPw.length < 8) {
    pwError.value = 'New password must be at least 8 characters.'
    return
  }

  isUpdatingPassword.value = true
  try {
    const response = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordForm.value.current,
        otp: passwordForm.value.otp,
        newPassword: passwordForm.value.newPw,
      }),
    })
    pwSuccess.value = response.message
    passwordForm.value = { current: '', otp: '', newPw: '', confirmPw: '' }
    passwordStep.value = 1
    otpSent.value = false
    clearOtpTimer()
  } catch (error) {
    pwError.value = error.message || 'Unable to update password.'
  } finally {
    isUpdatingPassword.value = false
  }
}

onUnmounted(clearOtpTimer)



/* ── FAQs ── */
const openFaq = ref(null)
const faqs = [
  {
    q: 'Is this a settings issue or a system issue?',
    a: [
      'If the problem is on the admin, teacher, or student settings page itself, it is usually an account or role setting.',
      'If the problem is login failure, API errors, database connection, or email delivery, it is a system configuration issue and should be checked in the backend environment settings.'
    ]
  },
  {
    q: 'How do I change my password in Settings?',
    a: [
      'Open Settings and go to Change Password.',
      'Enter your current password, the OTP sent to your email, and your new password.',
      'Click Update Password to save the change.'
    ]
  },
  {
    q: 'How does email verification on login work?',
    a: [
      'Go to Settings and toggle Email verification on login.',
      'Confirm with your current password, then a code will be sent to your email on each login.',
      'This is an account security setting and depends on the backend email configuration.'
    ]
  },
  {
    q: 'How do I switch roles or log out?',
    a: [
      'Use the role switch button in the sidebar if your account has access to multiple roles.',
      'To log out, click Logout in the sidebar and confirm the prompt.',
      'These are page-level actions, not backend configuration changes.'
    ]
  },
  {
    q: 'Who can access the admin portal?',
    a: [
      'Only users with the Admin role can access the admin portal.',
      'Teacher and Student accounts can use their own portals and settings pages, but they do not have admin privileges.'
    ]
  },
]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

/* ── Layout ── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 82% 8%, #f8fafb 0, #e7ebee 34%, #d8dde1 100%);
  font-family: 'Poppins', sans-serif;
}

/* ── Sidebar ── */
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
}
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
.role   { font-size: 0.88rem; color: #444; font-weight: 500; }
.email  { font-size: 0.82rem; color: #888; word-break: break-all; }

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
.nav-item:hover  { background: #f8fafc; color: #4b5563; }
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

/* ── Main ── */
.main {
  flex: 1;
  padding: 38px 58px 48px;
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
  margin-bottom: 26px;
}
.settings-eyebrow {
  display: block;
  margin-bottom: 7px;
  color: #697780;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.page-title {
  font-size: 2.15rem;
  font-weight: 700;
  color: #27323a;
  letter-spacing: -.04em;
  line-height: 1.2;
}
.page-sub {
  font-size: .9rem;
  color: #6d7981;
  margin-top: 6px;
}

/* ── Settings body ── */
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1180px;
  width: 100%;
}

/* ── Card ── */
.settings-card {
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(235,239,242,.9));
  border: 1px solid rgba(133, 145, 153, .42);
  border-radius: 18px;
  padding: 25px 30px 28px;
  box-shadow: inset 0 1px rgba(255,255,255,.92), 0 12px 30px rgba(47, 58, 66, .1);
}
.settings-card-header {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(129, 140, 148, .25);
}
.settings-card-header--between {
  justify-content: space-between;
  margin-bottom: 0;
}
.settings-card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.settings-card-icon {
  width: 40px;
  height: 40px;
  border: 1px solid #aab4ba;
  border-radius: 11px;
  background: linear-gradient(145deg, #f9fafb, #dce2e5);
  box-shadow: inset 0 1px #fff, 0 3px 8px rgba(58, 70, 78, .12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.settings-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #263139;
  margin: 0;
  line-height: 1.3;
}
.settings-card-sub {
  font-size: .75rem;
  color: #738089;
  margin: 4px 0 0;
  line-height: 1.45;
}

/* ── Form ── */
.settings-form { display: flex; flex-direction: column; gap: 24px; max-width: 920px; }
.settings-step-label {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #66747d;
  font-size: .76rem;
  font-weight: 600;
}
.settings-step-label span {
  padding: 4px 8px;
  border: 1px solid #aab5bb;
  border-radius: 999px;
  background: #eef1f3;
  color: #4a5962;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.settings-row  {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: start;
  gap: 22px 28px;
}
.settings-group { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.settings-label {
  font-size: .75rem;
  font-weight: 700;
  color: #4d5a63;
  letter-spacing: 0.1px;
}
.settings-input {
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.9rem;
  color: #111;
  background: rgba(255,255,255,.82);
  border: 1px solid #acb7be;
  border-radius: 9px;
  min-height: 42px;
  padding: 9px 13px;
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .08), 0 1px rgba(255,255,255,.8);
  outline: none;
  width: 100%;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.settings-input:focus {
  border-color: #687780;
  box-shadow: 0 0 0 3px rgba(90, 105, 114,.13), inset 0 1px 2px rgba(42, 52, 58, .06);
}

/* password eye toggle */
.pw-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.pw-input-wrap .settings-input {
  width: 100%;
  max-width: none;
  padding-right: 48px;
}
.pw-eye {
  position: absolute;
  top: 50%;
  right: 6px;
  z-index: 2;
  width: 32px;
  height: 32px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #7b8794;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.pw-eye svg { width: 18px; height: 18px; }
.pw-eye:hover { color: #4b5563; background: #f1f3f5; }
.pw-eye:focus-visible { outline: 2px solid #7b8794; outline-offset: 1px; }

/* OTP row */
.otp-wrap {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 42px;
  gap: 0;
}
.otp-wrap .settings-input {
  min-width: 0;
  flex: 1;
  border-radius: 8px 0 0 8px;
  border-right: none;
}
.otp-btn {
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(145deg, #66737c, #46525b);
  color: #fff;
  border: 1px solid #46525b;
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 0 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.otp-btn:hover { background: linear-gradient(145deg, #77848d, #535f68); color: #fff; }
.otp-btn:disabled,
.update-pw-btn:disabled { cursor: not-allowed; opacity: 0.65; }
.otp-expiry { font-size: 0.75rem; color: #b45309; font-weight: 500; }

/* Messages */
.settings-msg {
  font-size: 0.83rem;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: 8px;
}
.settings-msg--error   { background: #ffeaea; color: #e63946; }
.settings-msg--success { background: #d8dcdf; color: #4f575f; }

/* Update button */
.settings-form-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 2px;
}
.update-pw-btn {
  min-width: 168px;
  min-height: 42px;
  background: linear-gradient(145deg, #67757e, #3f4b54);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 10px 20px;
  border: 1px solid #3c4850;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  box-shadow: inset 0 1px rgba(255,255,255,.2), 0 5px 12px rgba(48, 53, 58, .2);
}
.update-pw-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #65717d, #46515c);
  transform: translateY(-1px);
  box-shadow: 0 7px 16px rgba(48, 53, 58, 0.24);
}
.password-back-btn {
  min-height: 42px;
  padding: 9px 16px;
  border: 1px solid #aab5bb;
  border-radius: 9px;
  background: rgba(255,255,255,.64);
  color: #53616a;
  font-family: inherit;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease;
}
.password-back-btn:hover { background: #edf1f3; border-color: #7f8d95; }

/* ── Disable 2FA SweetAlert ── */
.swal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.swal-box {
  background: #fff;
  border-radius: 20px;
  padding: 48px 44px 38px;
  width: 480px;
  max-width: 94vw;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.swal-icon {
  width: 84px; height: 84px;
  background: #fff0f0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
}
.swal-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.swal-sub {
  font-size: 0.97rem;
  color: #888;
  margin: 0;
  line-height: 1.65;
}
.swal-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  width: 100%;
}
.swal-cancel {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: 1.5px solid #e63946;
  background: #fff;
  color: #e63946;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s;
}
.swal-cancel:hover { background: #fff0f0; }
.swal-continue {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  background: #4b5563;
  color: #fff;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s;
}
.swal-continue:hover { background: #6b7280; }

/* ── Toggle Switch ── */
.two-factor-card {
  position: relative;
  padding: 25px 30px 28px;
}
.two-factor-card .settings-card-header { width: 100%; margin-bottom: 20px; padding-right: 118px; }
.two-factor-card .settings-card-header .tfa-control { position: absolute; top: 30px; right: 30px; margin-left: 0; transform: none; }
.two-factor-card .tfa-control { display: flex; align-items: center; gap: 10px; }
.two-factor-card .settings-row { align-items: flex-start; gap: 22px 28px; }
.two-factor-card .settings-group:first-child { flex: 1; max-width: 680px; }
.two-factor-card .tfa-note { margin: 0 0 12px; padding: 0; background: transparent; color: var(--metal-muted); }
.two-factor-card .settings-input { max-width: 420px; background: rgba(255,255,255,.82); }
.verification-card .settings-row { grid-template-columns: minmax(0, 520px); }
.verification-card .settings-card-header { margin-bottom: 18px; }
.verification-card .tfa-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding-left: 20px;
}
.tfa-status { color: var(--metal-muted); font-size: 0.75rem; font-weight: 700; min-width: 52px; text-align: right; }
.toggle-switch {
  position: relative;
  width: 50px;
  height: 27px;
  border-radius: 20px;
  background: #aeb7bd;
  border: 1px solid #89959d;
  cursor: pointer;
  transition: background 0.25s;
  flex-shrink: 0;
  padding: 0;
  outline: none;
}
.toggle-switch--on { background: #56636c; }
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.25s;
}
.toggle-switch--on .toggle-thumb { transform: translateX(23px); }

.tfa-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 18px;
  padding: 12px 16px;
  background: rgba(221, 226, 229, .68);
  border: 1px solid rgba(144, 155, 162, .36);
  border-radius: 9px;
  font-size: .78rem;
  color: #53616a;
  line-height: 1.55;
}

/* ── FAQ Section ── */
.settings-faq-section { display: flex; flex-direction: column; gap: 0; padding: 4px 0 0; }
.faq-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.faq-header-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(145deg, #f9fafb, #dce2e5);
  border: 1px solid #aab4ba;
  display: flex;
  align-items: center;
  justify-content: center;
}
.faq-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #2b363e;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item {
  background: linear-gradient(135deg, rgba(255,255,255,.94), rgba(231,235,238,.88));
  border: 1px solid rgba(135, 146, 154, .38);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
}
.faq-item--open {
  border-color: #8e9aa2;
  box-shadow: 0 7px 18px rgba(48, 53, 58,.1);
}
.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: transparent;
  border: none;
  padding: 15px 18px;
  font-family: inherit;
  font-size: .9rem;
  font-weight: 600;
  color: #364149;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.faq-question:hover { background: rgba(224, 229, 232, .52); }
.faq-chevron {
  flex-shrink: 0;
  color: #888;
  transition: transform 0.22s;
}
.faq-chevron--open {
  transform: rotate(180deg);
  color: #4b5563;
}
.faq-answer {
  padding: 0 20px 18px;
  font-size: 0.98rem;
  color: #4a4f57;
  line-height: 1.7;
  border-top: 1px solid #f0f0f0;
}
.faq-bullets {
  margin: 12px 0 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.6;
}
.faq-bullets li {
  color: #4a4f57;
}

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── Logout Modal ── */
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
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.logout-modal-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
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
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #4b5563;
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
.logout-confirm-btn:hover { background: #6b7280; }

/* ── Responsive ── */
@media (max-width: 800px) {
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 24px 18px 32px; }
}
</style>
