<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar teacher-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
      </div>
      <TeacherSidebarStatus />
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
          <span class="page-eyebrow">Account &amp; security</span>
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

          <form class="settings-form" @submit.prevent="handleUpdatePassword">
            <div class="settings-step-label"><span>{{ otpSent ? 'Step 2 of 2' : 'Step 1 of 2' }}</span></div>
            <div class="settings-row settings-row--identity">
              <div class="settings-group">
                <label class="settings-label">Current Password</label>
                <div class="pw-input-wrap">
                  <input
                    v-model="passwordForm.current"
                    :type="showCurrent ? 'text' : 'password'"
                    class="settings-input"
                    placeholder="Enter current password"
                    :disabled="otpSent"
                  />
                  <button type="button" class="pw-eye" @click="showCurrent = !showCurrent">
                    <svg v-if="!showCurrent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <div class="settings-group">
                <label class="settings-label">6-Digit OTP</label>
                <div class="otp-entry-wrap">
                  <div class="otp-boxes" role="group" aria-label="Six-digit one-time password">
                    <input
                      v-for="(_, index) in pwOtpCode"
                      :key="index"
                      :ref="element => { if (element) pwOtpRefs[index] = element }"
                      v-model="pwOtpCode[index]"
                      class="otp-digit"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      :aria-label="`OTP digit ${index + 1}`"
                      @input="onPwOtpInput(index)"
                      @keydown.backspace="onPwOtpBackspace(index)"
                    />
                  </div>
                  <button type="button" class="send-otp-btn" @click="otpSent ? resetOtp() : sendOtp">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    <span>{{ otpSent ? 'Resend OTP' : 'Send OTP' }}</span>
                  </button>
                </div>
                <span v-if="otpSent" class="otp-expiry">Expires in {{ formattedOtpTime }}.</span>
              </div>
            </div>

            <template v-if="otpSent">
              <div class="settings-row">
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
            </template>

            <div v-if="pwError"   class="settings-msg settings-msg--error">{{ pwError }}</div>
            <div v-if="pwSuccess" class="settings-msg settings-msg--success">{{ pwSuccess }}</div>

            <div class="settings-form-footer">
              <button type="submit" class="update-pw-btn">{{ otpSent ? 'Update Password' : 'Continue' }}</button>
            </div>
          </form>
        </div>

        <div class="settings-card verification-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
            </div>
            <div>
              <h2 class="settings-card-title">Email verification</h2>
            </div>
            <div class="tfa-control">
              <span class="tfa-status">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
              <button type="button" class="toggle-switch" :class="{ 'toggle-switch--on': twoFactorEnabled }" :disabled="isSavingTwoFactor" :aria-pressed="twoFactorEnabled" :aria-label="twoFactorEnabled ? 'Disable email verification' : 'Enable email verification'" @click="toggleTwoFactor">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
          <p class="settings-card-sub verification-card-sub">Add a one-time verification step whenever you sign in.</p>
          <div class="verification-content">
            <div class="verification-intro">
              <span class="verification-badge">Secure sign-in</span>
              <p class="verification-description">A one-time code will be sent to your PHINMA Gmail address whenever you log in.</p>
            </div>
            <label class="settings-label verification-password-label" for="teacher-two-factor-password">Confirm with your current password</label>
            <div class="verification-password-wrap">
              <input id="teacher-two-factor-password" v-model="twoFactorPassword" :type="showTwoFactorPassword ? 'text' : 'password'" class="settings-input" placeholder="Enter current password" />
              <button type="button" class="pw-eye" :aria-label="showTwoFactorPassword ? 'Hide current password' : 'Show current password'" @click="showTwoFactorPassword = !showTwoFactorPassword">
                <svg v-if="!showTwoFactorPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="twoFactorError" class="settings-msg settings-msg--error">{{ twoFactorError }}</div>
            <div v-if="twoFactorSuccess" class="settings-msg settings-msg--success">{{ twoFactorSuccess }}</div>
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
                <template v-else>{{ faq.a }}</template>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <!-- ═══ Enable 2FA — Check your email ═══ -->
  <Teleport to="body">
    <div v-if="showTFAModal" class="modal-overlay" @click.self="showTFAModal = false">
      <div class="tfa-modal">
        <div class="tfa-modal-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h2 class="tfa-modal-title">Check your email</h2>
        <p class="tfa-modal-sub">Enter the code we sent to <strong>{{ maskedEmail }}</strong></p>
        <div class="otp-boxes">
          <input
            v-for="(_, i) in tfaCode"
            :key="i"
            :ref="el => { if (el) otpRefs[i] = el }"
            v-model="tfaCode[i]"
            class="otp-box"
            type="text"
            maxlength="1"
            inputmode="numeric"
            @input="onOtpInput(i)"
            @keydown.backspace="onOtpBackspace(i)"
          />
        </div>
        <button type="button" class="resend-btn" @click="resendCode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Get a new Code
        </button>
        <div class="tfa-modal-actions">
          <button class="tfa-cancel-btn" @click="cancelTFA">Cancel</button>
          <button class="tfa-continue-btn" @click="confirmEnableTFA">Continue</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Disable 2FA Confirm ═══ -->
  <Teleport to="body">
    <div v-if="showDisableModal" class="modal-overlay" @click.self="showDisableModal = false">
      <div class="disable-modal">
        <div class="disable-modal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 class="disable-modal-title">Disable?</h2>
        <p class="disable-modal-sub">Are you sure to disable Two-Factor Authentication on your account?</p>
        <div class="disable-modal-actions">
          <button class="tfa-cancel-btn" @click="showDisableModal = false">Cancel</button>
          <button class="tfa-continue-btn" @click="confirmDisableTFA">Continue</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Logout Confirm ═══ -->
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
import TeacherSidebarStatus from '@/components/teacher/TeacherSidebarStatus.vue'
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
    name: 'Dashboard', to: '/teacher/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/teacher/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Events', to: '/teacher/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
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

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

/* ── Change Password ── */
const passwordForm = ref({ current: '', newPw: '', confirmPw: '' })
const showCurrent  = ref(false)
const showNew      = ref(false)
const showConfirm  = ref(false)
const pwError      = ref('')
const pwSuccess    = ref('')
const otpSent      = ref(false)
const pwOtpCode    = ref(['', '', '', '', '', ''])
const pwOtpRefs    = ref([])
const otpInputValue = computed({
  get: () => pwOtpCode.value.join(''),
  set: (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 6)
    pwOtpCode.value = Array.from({ length: 6 }, (_, index) => digits[index] || '')
  },
})
const otpSecondsRemaining = ref(0)
let otpTimer = null
const formattedOtpTime = computed(() => `0:${String(otpSecondsRemaining.value).padStart(2, '0')}`)
const twoFactorEnabled = ref(Boolean(user.twoFactorEnabled))
const twoFactorPassword = ref('')
const showTwoFactorPassword = ref(false)
const twoFactorError = ref('')
const twoFactorSuccess = ref('')
const isSavingTwoFactor = ref(false)
const showTFAModal = ref(false)
const showDisableModal = ref(false)
const tfaCode = ref(['', '', '', '', '', ''])
const otpRefs = ref([])

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

function confirmEnableTFA() {}
function cancelTFA() { showTFAModal.value = false }
function resendCode() {}
function confirmDisableTFA() { showDisableModal.value = false }
function onOtpInput() {}
function onOtpBackspace() {}

const maskedEmail = computed(() => {
  const email = user.email || 'teacher@gmail.com'
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 4)) + '@' + domain
})

async function sendOtp() {
  if (!passwordForm.value.current) {
    pwError.value   = 'Please enter your current password first.'
    pwSuccess.value = ''
    return
  }
  pwError.value = ''
  pwSuccess.value = ''
  try {
    const response = await apiRequest('/auth/request-password-otp', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: passwordForm.value.current }),
    })
    otpSent.value = true
    pwOtpCode.value = ['', '', '', '', '', '']
    startOtpTimer()
    pwSuccess.value = response.message
  } catch (error) {
    pwError.value = error.message || 'Unable to send the OTP.'
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
      resetOtp()
      pwError.value = 'OTP expired. Send a new code to continue.'
    }
  }, 1000)
}

function resetOtp() {
  clearOtpTimer()
  otpSent.value      = false
  pwOtpCode.value    = ['', '', '', '', '', '']
  passwordForm.value.current = ''
}

function onPwOtpInput(i) {
  if (pwOtpCode.value[i] && i < 5) pwOtpRefs.value[i + 1]?.focus()
}
function onPwOtpBackspace(i) {
  if (!pwOtpCode.value[i] && i > 0) pwOtpRefs.value[i - 1]?.focus()
}

async function handleUpdatePassword() {
  pwError.value   = ''
  pwSuccess.value = ''
  const enteredOtp = pwOtpCode.value.join('')
  if (enteredOtp.length < 6) {
    pwError.value = 'Please enter the 6-digit OTP sent to your email.'
    return
  }
  if (!passwordForm.value.newPw || !passwordForm.value.confirmPw) {
    pwError.value = 'Please fill in the new password fields.'
    return
  }
  if (passwordForm.value.newPw !== passwordForm.value.confirmPw) {
    pwError.value = 'New passwords do not match.'
    return
  }
  if (passwordForm.value.newPw.length < 6) {
    pwError.value = 'New password must be at least 8 characters.'
    return
  }

  try {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordForm.value.current,
        otp: enteredOtp,
        newPassword: passwordForm.value.newPw,
      }),
    })

    pwSuccess.value = 'Password updated successfully.'
    passwordForm.value = { current: '', newPw: '', confirmPw: '' }
    otpSent.value      = false
    clearOtpTimer()
    pwOtpCode.value    = ['', '', '', '', '', '']
    setTimeout(() => { pwSuccess.value = '' }, 4000)
  } catch (error) {
    pwError.value = error.message || 'Unable to update password.'
  }
}

onUnmounted(clearOtpTimer)



/* ── FAQs ── */
const openFaq = ref(null)
const faqs = [
  {
    q: 'Is this a settings issue or a system issue?',
    a: [
      'If the problem is in the Teacher Settings page itself, it is usually a personal account setting or role setting.',
      'If you are having login errors, API issues, or email not sending, this is usually a system configuration problem and should be checked in the backend environment settings.'
    ]
  },
  {
    q: 'How do I change my teacher password?',
    a: [
      'Open Settings and go to Change Password.',
      'Enter your current password, request the OTP code sent to your email, and then type your new password.',
      'Press Update Password to save.'
    ]
  },
  {
    q: 'How do I enable email verification?',
    a: [
      'Go to Settings and find Email verification.',
      'Enter your current password to confirm the change, then toggle it on.',
      'The system will send a verification code to your email whenever you log in.'
    ]
  },
  {
    q: 'Where do I find my schedule and consultation tools?',
    a: [
      'Use the sidebar options for Schedule and Consultation.',
      'These are teacher-specific pages and are separate from the account settings page.'
    ]
  },
  {
    q: 'How do I log out or switch back to another role?',
    a: [
      'Use the Logout option in the sidebar to end your session.',
      'If your account supports role switching, use the role switch option in the sidebar instead of changing backend settings.'
    ]
  },
]
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
.layout button, .layout input, .layout select { font-family: inherit; }

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
  cursor: pointer;
  transition: opacity 0.18s;
}
.avatar-wrap:hover { opacity: 0.85; }
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
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ── Main ── */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  height: 100vh;
  box-sizing: border-box;
}
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 26px;
}
.page-eyebrow {
  display: block;
  margin: 0 0 2px;
  color: #6d7880;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.page-title {
  margin: 0;
  font-size: clamp(1.9rem, 2.5vw, 2.5rem);
  font-weight: 700;
  color: #2b3137;
  letter-spacing: -0.05em;
  line-height: 1.15;
}
.page-sub {
  font-size: 0.92rem;
  color: #6a7279;
  margin: 6px 0 0;
}

/* ── Settings body ── */
.settings-body { display: flex; flex-direction: column; gap: 24px; }

/* ── Card ── */
.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.settings-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
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
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.settings-card-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }
.settings-card-sub   { font-size: 0.82rem; color: #888; margin: 3px 0 0; }

/* ── Form ── */
.settings-form  { display: flex; flex-direction: column; gap: 34px; }
.settings-row            { display: grid; grid-template-columns: repeat(2, minmax(0, 350px)); justify-content: center; gap: 40px 48px; }
.settings-row--otp       { grid-template-columns: repeat(2, minmax(0, 350px)); align-items: end; }
.settings-group          { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.settings-group--btn     { justify-content: flex-end; }
.settings-label { font-size: 0.82rem; font-weight: 600; color: #555; }

.settings-input {
  font-family: inherit;
  font-size: 0.9rem;
  color: #111;
  background: #fff;
  border: 1.5px solid #dde2e8;
  border-radius: 8px;
  min-height: 44px;
  padding: 10px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.settings-input:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(83, 91, 100,0.09);
}

/* eye toggle */
.pw-input-wrap { position: relative; display: flex; align-items: center; width: min(100%, 350px); }
.pw-input-wrap .settings-input { width: 100%; padding-right: 54px; }
.pw-eye {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 36px;
  height: 36px;
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
.pw-eye svg { width: 20px; height: 20px; }
.pw-eye:hover { color: #4b5563; background: #f1f3f5; }

/* Send OTP button */
.send-otp-btn {
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  width: 180px;
  min-height: 44px;
  background: linear-gradient(135deg, #4b5563, #6b7280);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: opacity 0.15s;
  box-shadow: 0 2px 6px rgba(48, 53, 58,0.2);
}
.send-otp-btn:hover { opacity: 0.85; }
.otp-entry-wrap {
  display: flex;
  align-items: stretch;
  width: min(100%, 350px);
  min-height: 44px;
}
.otp-entry-wrap .settings-input {
  min-width: 0;
  flex: 1;
  border-radius: 8px 0 0 8px;
  border-right: none;
}
.otp-entry-wrap .send-otp-btn {
  width: 110px;
  min-width: 110px;
  padding: 10px 8px;
  border-radius: 0 8px 8px 0;
  box-shadow: none;
}
.otp-expiry { color: #b45309; font-size: 0.75rem; font-weight: 500; }

/* OTP sent badge */
.otp-sent-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #d8dcdf;
  color: #4f575f;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 0.83rem;
  font-weight: 600;
}
.resend-text-btn {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
}
.resend-text-btn:hover { color: #6b7280; }

/* OTP hint label */
.otp-hint {
  font-weight: 400;
  font-size: 0.78rem;
  color: #6b7280;
  margin-left: 8px;
}

/* Inline OTP boxes */
.otp-boxes-inline {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.otp-box-sm {
  width: 44px;
  height: 44px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  border: 1.5px solid #dde2e8;
  border-radius: 8px;
  background: #f9fafb;
  color: #4b5563;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.otp-box-sm:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(83, 91, 100,0.15);
  background: #fff;
}

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
.settings-form-footer { display: flex; justify-content: center; padding-top: 4px; }
.update-pw-btn {
  min-width: 180px;
  min-height: 44px;
  background: linear-gradient(145deg, #56616c, #3b444d);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s, opacity 0.18s;
  box-shadow: 0 5px 12px rgba(48, 53, 58, 0.2);
}
.update-pw-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #65717d, #46515c);
  transform: translateY(-1px);
}
.update-pw-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* ── Toggle ── */
.two-factor-card {
  position: relative;
  padding: 22px 28px 24px;
}
.two-factor-card .settings-card-header { width: 100%; margin-bottom: 16px; padding-right: 118px; }
.two-factor-card .settings-card-header .tfa-control { position: absolute; top: 22px; right: 28px; margin-left: 0; transform: none; }
.two-factor-card .tfa-control { display: flex; align-items: center; gap: 10px; }
.two-factor-card .settings-row { align-items: flex-start; gap: 40px 48px; }
.two-factor-card .settings-group:first-child { flex: 1; max-width: 680px; }
.two-factor-card .otp-hint { margin: 0 0 12px; color: var(--metal-muted); }
.two-factor-card .settings-input { max-width: 420px; background: var(--metal-50); }
.tfa-status { color: var(--metal-muted); font-size: 0.75rem; font-weight: 700; min-width: 52px; text-align: right; }
.toggle-switch {
  position: relative;
  width: 50px;
  height: 27px;
  border-radius: 20px;
  background: #ccc;
  border: none;
  cursor: pointer;
  transition: background 0.25s;
  flex-shrink: 0;
  padding: 0;
  outline: none;
}
.toggle-switch--on { background: #4b5563; }
.toggle-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 21px; height: 21px;
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
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 0.84rem;
  color: #4f575f;
  line-height: 1.55;
}

/* ── FAQ ── */
.settings-faq-section { display: flex; flex-direction: column; }
.faq-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.faq-header-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
}
.faq-title { font-size: 1.35rem; font-weight: 700; color: #111; margin: 0; }
.faq-list  { display: flex; flex-direction: column; gap: 12px; }
.faq-item {
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
}
.faq-item--open { border-color: #bfc6cb; box-shadow: 0 4px 14px rgba(48, 53, 58,0.08); }
.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  border: none;
  padding: 18px 20px;
  font-family: inherit;
  font-size: 1.03rem;
  font-weight: 600;
  color: #222;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.faq-question:hover { background: #f4f5f5; }
.faq-chevron { flex-shrink: 0; color: #888; transition: transform 0.22s; }
.faq-chevron--open { transform: rotate(180deg); color: #4b5563; }
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
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── TFA "Check your email" modal ── */
.tfa-modal {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 420px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
.tfa-modal-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.tfa-modal-title { font-size: 1.35rem; font-weight: 700; color: #111; margin: 0; }
.tfa-modal-sub   { font-size: 0.88rem; color: #777; margin: 0 0 6px; line-height: 1.5; }

.otp-boxes {
  display: flex;
  gap: 10px;
  margin: 6px 0 2px;
}
.otp-box {
  width: 46px;
  height: 52px;
  border: 2px solid #dde2e8;
  border-radius: 10px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #4b5563;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f9fafb;
}
.otp-box:focus {
  border-color: #4b5563;
  box-shadow: 0 0 0 3px rgba(48, 53, 58,0.12);
  background: #fff;
}

.resend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #4b5563;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.resend-btn:hover { background: #f3f4f6; }

.tfa-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
}

/* ── Disable 2FA modal ── */
.disable-modal {
  background: #fff;
  border-radius: 20px;
  padding: 40px 44px 36px;
  width: 400px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
.disable-modal-icon {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: #fff0f0;
  border: 2px solid #ffd6d8;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
}
.disable-modal-title { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0; }
.disable-modal-sub   { font-size: 0.9rem; color: #888; margin: 0 0 8px; line-height: 1.6; }
.disable-modal-actions { display: flex; gap: 12px; width: 100%; margin-top: 6px; }

/* Shared modal buttons */
.tfa-cancel-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 9px;
  border: 1.5px solid #e63946;
  background: #fff;
  color: #e63946;
  font-weight: 600;
  font-size: 0.92rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.tfa-cancel-btn:hover { background: #fff0f0; }
.tfa-continue-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 9px;
  border: none;
  background: #4b5563;
  color: #fff;
  font-weight: 600;
  font-size: 0.92rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.tfa-continue-btn:hover { background: #6b7280; }

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
.logout-modal-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex; align-items: center; justify-content: center;
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

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Admin settings visual parity ── */
.settings-body {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: stretch;
  gap: 18px;
  width: 100%;
}
.settings-card {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(235,239,242,.9));
  border: 1px solid rgba(133, 145, 153, .42);
  border-radius: 18px;
  padding: 25px 30px 28px;
  box-shadow: inset 0 1px rgba(255,255,255,.92), 0 12px 30px rgba(47, 58, 66, .1);
}
.settings-card-header {
  align-items: center;
  gap: 13px;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(129, 140, 148, .25);
}
.settings-card-icon {
  border: 1px solid #aab4ba;
  border-radius: 11px;
  background: linear-gradient(145deg, #f9fafb, #dce2e5);
  box-shadow: inset 0 1px #fff, 0 3px 8px rgba(58, 70, 78, .12);
}
.settings-card-title {
  color: #263139;
  font-size: 1.05rem;
  line-height: 1.3;
}
.settings-card-sub { color: #738089; font-size: .75rem; line-height: 1.45; }
.settings-form { gap: 12px; max-width: none; }
.settings-step-label {
  display: flex;
  justify-content: flex-end;
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
.settings-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 28px; justify-content: start; }
.settings-row--identity,
.two-factor-card .settings-row--identity { grid-template-columns: minmax(0, 1fr); row-gap: 8px; }
.settings-row--identity .settings-group,
.settings-row--identity .pw-input-wrap { width: 100%; max-width: none; }
.settings-row--identity .pw-input-wrap .settings-input { max-width: none; }
.settings-step-label + .settings-row { margin-top: -10px; }
.settings-input { background: rgba(255,255,255,.82); border-color: #acb7be; }
.otp-entry-wrap { display: flex; align-items: stretch; gap: 10px; width: 100%; }
.otp-boxes { display: grid; grid-template-columns: repeat(6, minmax(0, 42px)); gap: 7px; width: min(100%, 287px); }
.otp-digit {
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  border: 1px solid #aab7be;
  border-radius: 10px;
  background: rgba(255,255,255,.9);
  color: #35434b;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .08), 0 1px rgba(255,255,255,.8);
}
.otp-digit:focus { border-color: #687780; box-shadow: 0 0 0 3px rgba(90, 105, 114, .13); }
.send-otp-btn {
  flex: 1 1 auto;
  width: auto;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #3f4c55;
  border-radius: 10px;
  background: linear-gradient(145deg, #87949c 0%, #5c6a74 48%, #46535c 100%);
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 4px 10px rgba(48, 53, 58, .16);
}
.send-otp-btn svg { flex: 0 0 auto; }
.otp-entry-wrap .send-otp-btn {
  min-height: 42px;
  border: 1px solid #3f4c55;
  border-radius: 10px;
  background: linear-gradient(145deg, #87949c 0%, #5c6a74 48%, #46535c 100%);
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 4px 10px rgba(48, 53, 58, .16);
  transition: background .15s, transform .15s, box-shadow .15s;
}
.otp-entry-wrap .send-otp-btn:hover {
  background: linear-gradient(145deg, #9aa6ad 0%, #687780 48%, #52616b 100%);
  transform: translateY(-1px);
  box-shadow: inset 0 1px rgba(255,255,255,.34), 0 6px 14px rgba(48, 53, 58, .22);
}
.settings-form-footer { justify-content: center; }
.two-factor-card { position: relative; }
.two-factor-card .settings-card-header { width: 100%; padding-right: 118px; }
.two-factor-card .settings-card-header .tfa-control { position: absolute; top: 30px; right: 30px; margin-left: 0; }
.two-factor-card .tfa-control { display: flex; align-items: center; gap: 10px; }
.toggle-switch { border: 1px solid #89959d; background: #aeb7bd; }
.toggle-switch--on { background: linear-gradient(145deg, #78a889, #4e8062); border-color: #47745a; box-shadow: inset 0 1px rgba(255,255,255,.28), 0 3px 9px rgba(57, 105, 75, .22); }
.verification-card { position: relative; display: flex; flex-direction: column; }
.verification-card .settings-card-header { align-items: flex-start; min-height: 52px; margin-bottom: 14px; padding-bottom: 12px; padding-right: 118px; }
.verification-card .settings-card-header .tfa-control {
  position: absolute;
  top: 22px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.verification-card .tfa-status { min-width: 0; text-align: center; order: 2; }
.verification-card .settings-card-icon { color: #4b5563; }
.verification-card-sub { margin: -8px 0 18px; max-width: none; }
.verification-content { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.verification-intro { padding: 13px 14px; border: 1px solid rgba(112, 137, 123, .25); border-radius: 12px; background: rgba(240, 248, 243, .7); }
.verification-badge { color: #37614b; font-size: .65rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.verification-description { margin: 9px 0 0; color: #5f7067; font-size: .74rem; line-height: 1.55; }
.verification-password-wrap { position: relative; display: flex; align-items: center; width: 100%; }
.verification-password-wrap .settings-input { padding-right: 48px; max-width: none; }
.verification-password-wrap .pw-eye { right: 8px; }
.verification-help { margin: 0; color: #89958f; font-size: .67rem; line-height: 1.4; }
.settings-faq-section { grid-column: 1 / -1; }

@media (max-width: 800px) {
  .settings-body { grid-template-columns: 1fr; }
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 24px 18px 32px; }
}
@media (max-width: 520px) {
  .otp-entry-wrap { flex-direction: column; }
  .otp-boxes,
  .send-otp-btn { width: 100%; }
}
</style>
