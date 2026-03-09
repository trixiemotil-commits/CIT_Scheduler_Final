<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
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
            <div class="settings-row">
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
                  <input v-model="passwordForm.otp" type="text" class="settings-input" placeholder="_ _ _ _ _ _" maxlength="6" />
                  <button type="button" class="otp-btn" @click="sendOtp">Send OTP</button>
                </div>
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

            <div v-if="pwError"   class="settings-msg settings-msg--error">{{ pwError }}</div>
            <div v-if="pwSuccess" class="settings-msg settings-msg--success">{{ pwSuccess }}</div>

            <div class="settings-form-footer">
              <button type="submit" class="update-pw-btn">Update Password</button>
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
              <div v-show="openFaq === i" class="faq-answer">
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <!-- ═══ Disable 2FA Confirm ═══ -->
  <Teleport to="body">
    <div v-if="showDisable2FAConfirm" class="swal-overlay">
      <div class="swal-box">
        <div class="swal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 class="swal-title">Disable Two-Factor Authentication?</h2>
        <p class="swal-sub">Are you sure you want to continue? Your account will be less secure without 2FA.</p>
        <div class="swal-actions">
          <button class="swal-cancel" @click="showDisable2FAConfirm = false">Cancel</button>
          <button class="swal-continue" @click="confirmDisable2FA">Continue</button>
        </div>
      </div>
    </div>
  </Teleport>

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
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { logout } from '@/auth.js'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/admin/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
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
    name: 'Manage Users', to: '/admin/users',
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
const showCurrent  = ref(false)
const showNew      = ref(false)
const showConfirm  = ref(false)
const pwError      = ref('')
const pwSuccess    = ref('')
const otpSent      = ref(false)

function sendOtp() {
  if (!passwordForm.value.current) {
    pwError.value   = 'Please enter your current password first.'
    pwSuccess.value = ''
    return
  }
  otpSent.value   = true
  pwError.value   = ''
  pwSuccess.value = 'OTP sent to your registered email.'
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}

function handleUpdatePassword() {
  pwError.value   = ''
  pwSuccess.value = ''
  if (!passwordForm.value.current || !passwordForm.value.newPw || !passwordForm.value.confirmPw) {
    pwError.value = 'Please fill in all password fields.'
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
  // In a real app: call API here
  pwSuccess.value = 'Password updated successfully.'
  passwordForm.value = { current: '', otp: '', newPw: '', confirmPw: '' }
  otpSent.value = false
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}

/* ── Two-Factor Auth ── */
const twoFactor = ref(false)
const showDisable2FAConfirm = ref(false)
function toggleTwoFactor() {
  if (twoFactor.value) {
    showDisable2FAConfirm.value = true
  } else {
    twoFactor.value = true
  }
}
function confirmDisable2FA() {
  twoFactor.value = false
  showDisable2FAConfirm.value = false
}

/* ── FAQs ── */
const openFaq = ref(null)
const faqs = [
  {
    q: 'How do I update my profile information?',
    a: 'You can update your profile information by navigating to your account settings. Click on your avatar or name in the sidebar to access profile options, then update the fields you want to change and save.'
  },
  {
    q: 'How does Two-Factor Authentication Work?',
    a: 'Two-Factor Authentication (2FA) adds a second verification step when you log in. After entering your password, you will receive a one-time password (OTP) on your registered email or phone. You must enter this OTP to complete the login.'
  },
  {
    q: 'What should I do if I forgot my password?',
    a: 'On the login page, click the "Forgot Password?" link. Enter your registered email address and follow the instructions sent to your inbox to reset your password.'
  },
  {
    q: 'Who can access admin portal?',
    a: 'Only users with an Admin role can access the admin portal. Teacher and Student accounts are limited to their respective portals and do not have admin privileges.'
  },
  {
    q: 'How do I add or remove a user?',
    a: 'Go to Manage Users in the sidebar. Use the "Add User" button to register a new account, or use the Delete action on any row to remove an existing user. You can also edit roles and status from the same page.'
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
  background: #f5f6f8;
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
  border: 3px solid #c8ddd4;
}
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
  cursor: pointer;
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
  font-family: inherit;
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
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* ── Settings body ── */
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

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
.settings-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111;
  margin: 0;
  line-height: 1.3;
}
.settings-card-sub {
  font-size: 0.82rem;
  color: #888;
  margin: 3px 0 0;
}

/* ── Form ── */
.settings-form { display: flex; flex-direction: column; gap: 18px; }
.settings-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.settings-group { display: flex; flex-direction: column; gap: 7px; }
.settings-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #555;
  letter-spacing: 0.1px;
}
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
  transition: border-color 0.18s, box-shadow 0.18s;
}
.settings-input:focus {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45,106,79,0.09);
}

/* password eye toggle */
.pw-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
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

/* OTP row */
.otp-wrap {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.otp-wrap .settings-input {
  border-radius: 8px 0 0 8px;
  border-right: none;
}
.otp-btn {
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: #f0f0f0;
  color: #444;
  border: 1.5px solid #dde2e8;
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.otp-btn:hover { background: #1b4332; color: #fff; }

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
.settings-form-footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
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
  transition: background 0.18s;
  box-shadow: 0 4px 14px rgba(27,67,50,0.2);
}
.update-pw-btn:hover { background: #2d6a4f; }

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
  background: #1b4332;
  color: #fff;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s;
}
.swal-continue:hover { background: #2d6a4f; }

/* ── Toggle Switch ── */
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
  background: #e8f5ee;
  border-radius: 10px;
  font-size: 0.84rem;
  color: #1b7a4a;
  line-height: 1.55;
}

/* ── FAQ Section ── */
.settings-faq-section { display: flex; flex-direction: column; gap: 0; }
.faq-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.faq-header-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: #e8f5ee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.faq-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.faq-item {
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.faq-item--open {
  border-color: #b7d8c8;
  box-shadow: 0 2px 10px rgba(27,67,50,0.07);
}
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
.faq-chevron {
  flex-shrink: 0;
  color: #aaa;
  transition: transform 0.22s;
}
.faq-chevron--open {
  transform: rotate(180deg);
  color: #1b4332;
}
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

/* ── Responsive ── */
@media (max-width: 800px) {
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 24px 18px 32px; }
}
</style>
