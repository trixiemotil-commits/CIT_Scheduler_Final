<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=47'" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Teachers Portal</div>
        <div class="email">{{ user.email || 'teacher@gmail.com' }}</div>
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
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Manage your account settings and preferences</p>
        </div>
      </header>

      <div class="settings-body">

        <!-- ── Change Password ── -->
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="settings-card-title">Change Password</h2>
          </div>

          <form class="settings-form" @submit.prevent="handleUpdatePassword">
            <!-- Step 1: Current password + Send OTP -->
            <div class="settings-row settings-row--otp">
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
              <div class="settings-group settings-group--btn" style="padding-top: 22px;">
                <button
                  v-if="!otpSent"
                  type="button"
                  class="send-otp-btn"
                  @click="sendOtp"
                >Send OTP</button>
                <div v-else class="otp-sent-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  OTP sent
                  <button type="button" class="resend-text-btn" @click="resetOtp">Resend</button>
                </div>
              </div>
            </div>

            <!-- Step 2: OTP + new passwords (shown after OTP is sent) -->
            <template v-if="otpSent">
              <div class="settings-group">
                <label class="settings-label">Enter OTP <span class="otp-hint">Sent to {{ maskedEmail }}</span></label>
                <div class="otp-boxes-inline">
                  <input
                    v-for="(_, i) in pwOtpCode"
                    :key="i"
                    :ref="el => { if (el) pwOtpRefs[i] = el }"
                    v-model="pwOtpCode[i]"
                    class="otp-box-sm"
                    type="text"
                    maxlength="1"
                    inputmode="numeric"
                    @input="onPwOtpInput(i)"
                    @keydown.backspace="onPwOtpBackspace(i)"
                  />
                </div>
              </div>

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
              <button type="submit" class="update-pw-btn" :disabled="!otpSent">Update Password</button>
            </div>
          </form>
        </div>

        <!-- ── Two-Factor Authentication ── -->
        <div class="settings-card">
          <div class="settings-card-header settings-card-header--between">
            <div class="settings-card-header-left">
              <div class="settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h2 class="settings-card-title">Two-Factor Authentication</h2>
                <p class="settings-card-sub">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--on': twoFactor }"
              @click="toggleTwoFactor"
              type="button"
              :aria-pressed="twoFactor"
            >
              <span class="toggle-thumb"></span>
            </button>
          </div>
          <div v-if="twoFactor" class="tfa-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Two-factor authentication is currently <strong>enabled</strong>. An OTP will be required on each login.
          </div>
        </div>

        <!-- ── FAQs ── -->
        <div class="settings-faq-section">
          <div class="faq-header">
            <div class="faq-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
              <div v-show="openFaq === i" class="faq-answer">{{ faq.a }}</div>
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
import { getUser, logout } from '@/auth.js'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}

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

const maskedEmail = computed(() => {
  const email = user.email || 'teacher@gmail.com'
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 4)) + '@' + domain
})

function sendOtp() {
  if (!passwordForm.value.current) {
    pwError.value   = 'Please enter your current password first.'
    pwSuccess.value = ''
    return
  }
  pwError.value   = ''
  otpSent.value   = true
  pwOtpCode.value = ['', '', '', '', '', '']
  pwSuccess.value = 'OTP sent to ' + maskedEmail.value
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}

function resetOtp() {
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

function handleUpdatePassword() {
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
    pwError.value = 'New password must be at least 6 characters.'
    return
  }
  pwSuccess.value = 'Password updated successfully.'
  passwordForm.value = { current: '', newPw: '', confirmPw: '' }
  otpSent.value      = false
  pwOtpCode.value    = ['', '', '', '', '', '']
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}

/* ── Two-Factor Auth ── */
const twoFactor        = ref(false)
const showTFAModal     = ref(false)
const showDisableModal = ref(false)
const tfaCode          = ref(['', '', '', '', '', ''])
const otpRefs          = ref([])

function toggleTwoFactor() {
  if (twoFactor.value) {
    showDisableModal.value = true
  } else {
    tfaCode.value = ['', '', '', '', '', '']
    showTFAModal.value = true
  }
}

function onOtpInput(i) {
  const val = tfaCode.value[i]
  if (val && i < 5) {
    otpRefs.value[i + 1]?.focus()
  }
}

function onOtpBackspace(i) {
  if (!tfaCode.value[i] && i > 0) {
    otpRefs.value[i - 1]?.focus()
  }
}

function resendCode() {
  tfaCode.value = ['', '', '', '', '', '']
  otpRefs.value[0]?.focus()
}

function confirmEnableTFA() {
  const code = tfaCode.value.join('')
  if (code.length < 6) return
  twoFactor.value    = true
  showTFAModal.value = false
  tfaCode.value      = ['', '', '', '', '', '']
}

function cancelTFA() {
  showTFAModal.value = false
  tfaCode.value      = ['', '', '', '', '', '']
}

function confirmDisableTFA() {
  twoFactor.value        = false
  showDisableModal.value = false
}

/* ── FAQs ── */
const openFaq = ref(null)
const faqs = [
  {
    q: 'How do I update my profile information?',
    a: 'You can update your profile information by clicking your profile image and navigating to the Personal Information section.'
  },
  {
    q: 'How does Two-Factor Authentication Work?',
    a: 'Two-Factor Authentication (2FA) adds a second verification step when you log in. After entering your password, you will receive a one-time code on your registered email. Enter that code to complete the login.'
  },
  {
    q: 'What should I do if I forgot my password?',
    a: 'On the login page, click the "Forgot Password?" link. Enter your registered email address and follow the instructions sent to your inbox to reset your password.'
  },
  {
    q: 'Who can access admin portal?',
    a: 'Only users with an Admin role can access the admin portal. Teacher accounts are limited to the teacher portal and do not have admin privileges.'
  },
  {
    q: 'How do I view my assigned schedule?',
    a: 'Navigate to the Schedule section in the sidebar. Your assigned classes and time slots will be displayed in the weekly calendar view.'
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
  border: 3px solid #c8ddd4;
  cursor: pointer;
  transition: opacity 0.18s;
}
.avatar-wrap:hover { opacity: 0.85; }
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
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
.nav-item:hover  { background: #f0faf3; color: #1b4332; }
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
.main-header  { margin-bottom: 32px; }
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin: 0 0 4px;
}
.page-sub { font-size: 0.95rem; color: #777; margin: 0; }

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
  background: #e8f5ee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.settings-card-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }
.settings-card-sub   { font-size: 0.82rem; color: #888; margin: 3px 0 0; }

/* ── Form ── */
.settings-form  { display: flex; flex-direction: column; gap: 18px; }
.settings-row            { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.settings-row--otp       { grid-template-columns: 1fr auto; align-items: end; }
.settings-group          { display: flex; flex-direction: column; gap: 7px; }
.settings-group--btn     { justify-content: flex-end; }
.settings-label { font-size: 0.82rem; font-weight: 600; color: #555; }

.settings-input {
  font-family: inherit;
  font-size: 0.9rem;
  color: #111;
  background: #fff;
  border: 1.5px solid #dde2e8;
  border-radius: 8px;
  padding: 10px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.settings-input:focus {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45,106,79,0.09);
}

/* eye toggle */
.pw-input-wrap { position: relative; display: flex; align-items: center; }
.pw-input-wrap .settings-input { padding-right: 42px; }
.pw-eye {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}
.pw-eye:hover { color: #1b4332; }

/* Send OTP button */
.send-otp-btn {
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  width: fit-content;
  background: linear-gradient(135deg, #1b4332, #2d6a4f);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: opacity 0.15s;
  box-shadow: 0 2px 6px rgba(27,67,50,0.2);
}
.send-otp-btn:hover { opacity: 0.85; }

/* OTP sent badge */
.otp-sent-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #d8f3e8;
  color: #1b7a4a;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 0.83rem;
  font-weight: 600;
}
.resend-text-btn {
  background: none;
  border: none;
  color: #1b4332;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
}
.resend-text-btn:hover { color: #2d6a4f; }

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
  color: #1b4332;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.otp-box-sm:focus {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45,106,79,0.15);
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
.settings-msg--success { background: #d8f3e8; color: #1b7a4a; }

/* Update button */
.settings-form-footer { display: flex; justify-content: center; padding-top: 4px; }
.update-pw-btn {
  background: #1b4332;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 48px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, opacity 0.18s;
  box-shadow: 0 4px 14px rgba(27,67,50,0.2);
}
.update-pw-btn:hover:not(:disabled) { background: #2d6a4f; }
.update-pw-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* ── Toggle ── */
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
.toggle-switch--on { background: #1b4332; }
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
  background: #e8f5ee;
  border-radius: 10px;
  font-size: 0.84rem;
  color: #1b7a4a;
  line-height: 1.55;
}

/* ── FAQ ── */
.settings-faq-section { display: flex; flex-direction: column; }
.faq-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.faq-header-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: #e8f5ee;
  display: flex; align-items: center; justify-content: center;
}
.faq-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }
.faq-list  { display: flex; flex-direction: column; gap: 10px; }
.faq-item {
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.faq-item--open { border-color: #b7d8c8; box-shadow: 0 2px 10px rgba(27,67,50,0.07); }
.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  padding: 16px 20px;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  color: #222;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.faq-question:hover { background: #f7faf8; }
.faq-chevron { flex-shrink: 0; color: #aaa; transition: transform 0.22s; }
.faq-chevron--open { transform: rotate(180deg); color: #1b4332; }
.faq-answer {
  padding: 0 20px 18px;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.7;
  border-top: 1px solid #f0f0f0;
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
  background: #e8f5ee;
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
  color: #1b4332;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f9fafb;
}
.otp-box:focus {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
  background: #fff;
}

.resend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #1b4332;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.resend-btn:hover { background: #e8f5ee; }

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
  background: #1b4332;
  color: #fff;
  font-weight: 600;
  font-size: 0.92rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.tfa-continue-btn:hover { background: #2d6a4f; }

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
  background: #1b4332;
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
.logout-confirm-btn:hover { background: #2d6a4f; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 800px) {
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 24px 18px 32px; }
}
</style>
