<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || initialsAvatar(user)" :alt="user.name || 'Admin'" class="avatar" />
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
            <div v-if="passwordStep === 1" class="settings-step-label"><span>Step 1 of 2</span></div>
            <div v-else class="settings-step-label"><span>Step 2 of 2</span></div>

            <div v-if="passwordStep === 1" class="settings-row settings-row--identity">
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
                <label class="settings-label">6-Digit OTP</label>
                <div class="otp-wrap">
                  <div class="otp-boxes" role="group" aria-label="Six-digit one-time password">
                    <input
                      v-for="(_, index) in otpDigits"
                      :key="index"
                      :ref="element => { if (element) otpInputRefs[index] = element }"
                      v-model="otpDigits[index]"
                      class="otp-digit"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      :aria-label="`OTP digit ${index + 1}`"
                      @input="updateOtpDigit(index, $event)"
                      @keydown.backspace="handleOtpBackspace(index, $event)"
                      @paste.prevent="handleOtpPaste"
                    />
                  </div>
                  <button type="button" class="otp-btn" :disabled="isSendingOtp || otpSecondsRemaining > 0" @click="sendOtp">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    <span>{{ isSendingOtp ? 'Sending...' : otpSecondsRemaining > 0 ? `Expires in ${formattedOtpTime}` : 'Send OTP' }}</span>
                  </button>
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
              <span class="verification-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                Secure sign-in
              </span>
              <p class="verification-description">A one-time code will be sent to your PHINMA Gmail address whenever you log in.</p>
            </div>
            <label class="settings-label verification-password-label" for="two-factor-password">Confirm with your current password</label>
            <div class="verification-password-wrap">
              <svg class="verification-password-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input id="two-factor-password" v-model="twoFactorPassword" :type="showTwoFactorPassword ? 'text' : 'password'" class="settings-input" placeholder="Enter current password" />
              <button type="button" class="pw-eye" :aria-label="showTwoFactorPassword ? 'Hide current password' : 'Show current password'" @click="showTwoFactorPassword = !showTwoFactorPassword">
                <svg v-if="!showTwoFactorPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p class="verification-help">Your password is used only to confirm this security setting.</p>
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

          <div v-for="category in faqCategories" :key="category" class="faq-category-group">
            <div class="faq-category-divider"><span>{{ category }}</span></div>
            <div class="faq-list">
              <div
                v-for="faq in faqs.filter((item) => item.category === category)"
                :key="faq.q"
                class="faq-item"
                :class="{ 'faq-item--open': openFaq === faq.q }"
              >
                <button class="faq-question" @click="openFaq = openFaq === faq.q ? null : faq.q">
                  <span>{{ faq.q }}</span>
                  <svg
                    class="faq-chevron"
                    :class="{ 'faq-chevron--open': openFaq === faq.q }"
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  ><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-show="openFaq === faq.q" class="faq-answer">
                  <ul class="faq-bullets">
                    <li v-for="(item, idx) in faq.a" :key="idx" v-html="highlightFaqText(item)"></li>
                  </ul>
                </div>
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
import { getToken, getUser, logout, saveMergedUser } from '@/auth.js'
import { initialsAvatar } from '@/utils/avatar.js'
import Swal from 'sweetalert2'
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
const otpSent      = ref(false)
const isSendingOtp = ref(false)
const isUpdatingPassword = ref(false)
const otpSecondsRemaining = ref(0)
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = []
let otpTimer = null
const formattedOtpTime = computed(() => `0:${String(otpSecondsRemaining.value).padStart(2, '0')}`)
const twoFactorEnabled = ref(Boolean(user.twoFactorEnabled))
const twoFactorPassword = ref('')
const showTwoFactorPassword = ref(false)
const isSavingTwoFactor = ref(false)

function showSettingsAlert(icon, title, text) {
  const symbol = icon === 'success'
    ? '<path d="m7.5 12.5 3 3 6-7"/>'
    : '<path d="m8 8 8 8M16 8l-8 8"/>'
  return Swal.fire({
    iconHtml: `<span class="settings-alert-symbol settings-alert-symbol--${icon}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${symbol}</svg></span>`,
    title,
    text,
    confirmButtonColor: '#4b5563',
    buttonsStyling: false,
    customClass: {
      popup: `settings-alert-popup settings-alert-popup--${icon}`,
      icon: 'settings-alert-icon',
      title: 'settings-alert-title',
      htmlContainer: 'settings-alert-text',
      confirmButton: 'settings-alert-confirm',
    },
  })
}

function showSettingsError(message) {
  return showSettingsAlert('error', 'Unable to continue', message)
}

function showSettingsSuccess(message) {
  return showSettingsAlert('success', 'Success', message)
}

function syncOtpValue() {
  passwordForm.value.otp = otpDigits.value.join('')
}

function resetOtpDigits() {
  otpDigits.value = ['', '', '', '', '', '']
  passwordForm.value.otp = ''
}

function updateOtpDigit(index, event) {
  const digit = String(event.target.value || '').replace(/\D/g, '').slice(-1)
  otpDigits.value[index] = digit
  syncOtpValue()
  if (digit && index < otpDigits.value.length - 1) otpInputRefs[index + 1]?.focus()
}

function handleOtpBackspace(index, event) {
  if (!otpDigits.value[index] && index > 0) {
    event.preventDefault()
    otpDigits.value[index - 1] = ''
    syncOtpValue()
    otpInputRefs[index - 1]?.focus()
  }
}

function handleOtpPaste(event) {
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpDigits.value.length)
  pasted.split('').forEach((digit, index) => { otpDigits.value[index] = digit })
  syncOtpValue()
  otpInputRefs[Math.min(pasted.length, otpDigits.value.length - 1)]?.focus()
}

async function toggleTwoFactor() {
  const enabled = !twoFactorEnabled.value
  if (!twoFactorPassword.value) {
    showSettingsError('Enter your current password to confirm this change.')
    return
  }
  isSavingTwoFactor.value = true
  try {
    const response = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ twoFactorEnabled: enabled, currentPassword: twoFactorPassword.value }),
    })
    const updatedUser = response.user ? saveMergedUser(response.user) : null
    twoFactorEnabled.value = Boolean(updatedUser?.twoFactorEnabled ?? response.user?.twoFactorEnabled)
    twoFactorPassword.value = ''
    showSettingsSuccess(enabled ? 'Email verification enabled.' : 'Email verification disabled.')
  } catch (error) {
    showSettingsError(error.message || 'Unable to update email verification.')
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
  otpSecondsRemaining.value = 5 * 60
  otpTimer = setInterval(() => {
    otpSecondsRemaining.value -= 1
    if (otpSecondsRemaining.value <= 0) {
      clearOtpTimer()
      otpSent.value = false
      resetOtpDigits()
      showSettingsError('OTP expired. Send a new code to continue.')
    }
  }, 1000)
}

async function sendOtp() {
  if (!passwordForm.value.current) {
    showSettingsError('Please enter your current password first.')
    return
  }

  isSendingOtp.value = true
  try {
    const response = await apiRequest('/auth/request-password-otp', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: passwordForm.value.current }),
    })
    resetOtpDigits()
    otpSent.value = true
    startOtpTimer()
    showSettingsSuccess(response.message)
  } catch (error) {
    showSettingsError(error.message || 'Unable to send the OTP.')
  } finally {
    isSendingOtp.value = false
  }
}

function advancePasswordStep() {
  if (!passwordForm.value.current || !passwordForm.value.otp) {
    showSettingsError('Enter your current password and the OTP to continue.')
    return
  }
  if (!/^\d{6}$/.test(passwordForm.value.otp)) {
    showSettingsError('Enter the 6-digit OTP sent to your email.')
    return
  }
  passwordStep.value = 2
}

async function handleUpdatePassword() {
  if (!passwordForm.value.current || !passwordForm.value.otp || !passwordForm.value.newPw || !passwordForm.value.confirmPw) {
    showSettingsError('Please fill in all password fields and the OTP.')
    return
  }
  if (!/^\d{6}$/.test(passwordForm.value.otp)) {
    showSettingsError('Enter the 6-digit OTP sent to your email.')
    return
  }
  if (passwordForm.value.newPw !== passwordForm.value.confirmPw) {
    showSettingsError('New passwords do not match.')
    return
  }
  if (passwordForm.value.newPw.length < 8) {
    showSettingsError('New password must be at least 8 characters.')
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
    showSettingsSuccess(response.message)
    passwordForm.value = { current: '', otp: '', newPw: '', confirmPw: '' }
    resetOtpDigits()
    passwordStep.value = 1
    otpSent.value = false
    clearOtpTimer()
  } catch (error) {
    showSettingsError(error.message || 'Unable to update password.')
  } finally {
    isUpdatingPassword.value = false
  }
}

onUnmounted(clearOtpTimer)



/* ── FAQs ── */
const openFaq = ref(null)
const faqCategories = ['Schedule Management', 'Faculty & Campus', 'Account & Security']
const faqHighlightTerms = [
  'Academic Terms',
  'Current Term Schedule',
  'Add Schedule',
  'schedule workspace',
  'schedule browser',
  'published-term schedule link',
  'teacher assignment',
  'consultation hours',
  'user management',
  'Activity Logs',
  'Teachers',
  'Users',
  'Events',
  'student group',
  'faculty member',
  'room',
  'section',
  'Admin',
  'Teacher',
  'Student',
  'OTP',
  'Settings',
  'Change Password',
  'Email verification',
  'Switch to Teacher',
  'Logout',
]
const faqs = [
  {
    category: 'Schedule Management',
    q: 'How do I create a schedule for a new academic term?',
    a: [
      'Open Academic Terms from the sidebar and create or select the term you want to manage.',
      'Set the term name, start date, end date, and semester status before adding schedule entries.',
      'Use the schedule workspace to add classes by student group, room, or faculty member.'
    ]
  },
  {
    category: 'Schedule Management',
    q: 'How do I add or update a weekly schedule?',
    a: [
      'Open Academic Terms and select the active term, then choose Add Schedule.',
      'Select the year and section, faculty member, subject, room, day, and time.',
      'Save the entry, then review the term schedule for conflicts or missing assignments.'
    ]
  },
  {
    category: 'Schedule Management',
    q: 'What should I do when a schedule has a conflict?',
    a: [
      'Open the schedule browser and view the entries by student group, room, or faculty member.',
      'Check whether the same room, faculty member, or student section has overlapping times.',
      'Edit or remove the conflicting entry, then save the corrected schedule.'
    ]
  },
  {
    category: 'Schedule Management',
    q: 'How do I publish the schedule for students and teachers?',
    a: [
      'Review the active academic term and confirm that its schedule entries are complete.',
      'Use the published-term schedule link to make the approved term available to the portals.',
      'Students and teachers will see the published schedule after their next data refresh.'
    ]
  },
  {
    category: 'Faculty & Campus',
    q: 'How do I manage teacher availability and consultation hours?',
    a: [
      'Open the teacher assignment or user management area and select the faculty member.',
      'Update their availability status and assign consultation hours when needed.',
      'Students can request consultations only when the teacher is available and has hours for that day.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How do I manage users and their roles?',
    a: [
      'Open Users from the sidebar to view, search, create, or update accounts.',
      'Assign only the roles required for each account: Admin, Teacher, or Student.',
      'Review account status when a user cannot access the expected portal.'
    ]
  },
  {
    category: 'Faculty & Campus',
    q: 'How do I create and update campus events?',
    a: [
      'Open Events from the sidebar and create an event with its title, date, time, venue, and description.',
      'Add a cover image when appropriate, then save the event for portal users.',
      'Edit or remove outdated events so students and teachers see accurate information.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How do I change my admin password?',
    a: [
      'Open Settings and go to Change Password.',
      'Enter your current password, the OTP sent to your email, and your new password.',
      'Click Update Password to save the change.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How does email verification work for admin login?',
    a: [
      'Open Settings and enable Email verification.',
      'Confirm the change with your current password.',
      'A verification code will be sent to your email each time you log in.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How do I switch roles or log out?',
    a: [
      'Use Switch to Teacher in the sidebar when your account has multiple roles.',
      'To end your session, click Logout and confirm the prompt.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'Who can access the admin portal?',
    a: [
      'Only accounts with the Admin role can access the admin portal.',
      'Teacher and Student accounts use their own portals and cannot access admin tools.'
    ]
  },
]

function highlightFaqText(text) {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  const terms = [...faqHighlightTerms].sort((a, b) => b.length - a.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return escaped.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark class="faq-inline-highlight">$1</mark>')
}
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
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 26px;
}
.settings-eyebrow {
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
.settings-body {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 18px;
  max-width: none;
  width: 100%;
}

/* ── Card ── */
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
.settings-form { display: flex; flex-direction: column; gap: 12px; max-width: none; }
.settings-step-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #66747d;
  font-size: .76rem;
  font-weight: 600;
}
.settings-step-label > span:not(.settings-step-description) {
  margin-left: auto;
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
.settings-step-description { order: 1; }
.settings-step-label > span:not(.settings-step-description) { order: 2; }
.settings-row  {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: start;
  gap: 22px 28px;
}
.settings-row--identity {
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.settings-row--identity .settings-group {
  width: 100%;
}
.settings-row--identity .pw-input-wrap,
.settings-row--identity .pw-input-wrap .settings-input {
  width: 100% !important;
  max-width: none !important;
}
.settings-step-label + .settings-row {
  margin-top: -16px;
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
  right: 8px;
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
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  gap: 10px;
}
.otp-boxes {
  flex: 0 1 287px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 42px));
  gap: 7px;
  width: min(100%, 287px);
}
.otp-digit {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 42px;
  border: 1px solid #aab7be;
  border-radius: 10px;
  background: rgba(255,255,255,.9);
  color: #35434b;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .08), 0 1px rgba(255,255,255,.8);
  transition: border-color .18s, box-shadow .18s, background .18s;
}
.otp-digit:focus {
  border-color: #687780;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(90, 105, 114, .13), inset 0 1px 2px rgba(42, 52, 58, .06);
}
.otp-digit:not(:placeholder-shown) {
  border-color: #7d8b93;
  background: #f7f9fa;
}
.otp-digit::placeholder { color: transparent; }
.otp-btn {
  flex: 1 1 auto;
  min-height: 42px;
  min-width: 112px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(145deg, #87949c 0%, #5c6a74 48%, #46535c 100%);
  color: #fff;
  border: 1px solid #3f4c55;
  border-radius: 10px;
  padding: 0 12px;
  cursor: pointer;
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 4px 10px rgba(48, 53, 58, .16);
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.otp-btn svg { flex: 0 0 auto; }
.otp-btn:hover { background: linear-gradient(145deg, #9aa6ad 0%, #687780 48%, #52616b 100%); color: #fff; transform: translateY(-1px); box-shadow: inset 0 1px rgba(255,255,255,.34), 0 6px 14px rgba(48, 53, 58, .22); }
.otp-btn:focus-visible,
.update-pw-btn:focus-visible,
.password-back-btn:focus-visible,
.faq-question:focus-visible {
  outline: 3px solid rgba(83, 91, 100, .3);
  outline-offset: 3px;
}
.otp-btn:disabled,
.update-pw-btn:disabled { cursor: not-allowed; opacity: 0.65; }
.otp-expiry {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: 1px;
  padding: 4px 8px;
  border: 1px solid #aeb8be;
  border-radius: 999px;
  background: linear-gradient(145deg, #f2f4f4, #dfe3e5);
  color: #68747d;
  font-size: 0.68rem;
  font-weight: 700;
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
.settings-form-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
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
.two-factor-card .settings-card-header .tfa-control { position: absolute; top: 30px; right: 20px; margin-left: 0; transform: none; }
.two-factor-card .tfa-control { display: flex; align-items: center; gap: 10px; }
.two-factor-card .settings-card-header .tfa-control { flex-direction: column; gap: 4px; }
.two-factor-card .settings-row { align-items: flex-start; gap: 22px 28px; }
.two-factor-card .settings-group:first-child { flex: 1; max-width: 680px; }
.two-factor-card .tfa-note { margin: 0 0 12px; padding: 0; background: transparent; color: var(--metal-muted); }
.two-factor-card .settings-input { max-width: 420px; background: rgba(255,255,255,.82); }
.verification-card .settings-row { grid-template-columns: minmax(0, 520px); }
.verification-card { position: relative; }
.verification-card .settings-card-header { margin-bottom: 18px; }
.verification-card .settings-card-header { padding-right: 118px; }
.verification-card .settings-card-header .tfa-control { position: absolute; top: 30px; right: 20px; }
.verification-card .tfa-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding-left: 0;
}
.verification-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, rgba(250,252,253,.98), rgba(224,230,233,.94));
}
.verification-card .settings-card-header {
  align-items: flex-start;
  min-height: 58px;
  padding-bottom: 20px;
}
.verification-card .settings-card-header > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}
.verification-card-sub {
  margin: -8px 0 18px;
  max-width: none;
  color: #738089;
  font-size: .75rem;
  line-height: 1.45;
}
.verification-card .settings-card-icon {
  color: #4b5563;
  border-color: #aab4ba;
  background: linear-gradient(145deg, #f9fafb, #dce2e5);
}
.verification-card .settings-card-title { max-width: 210px; }
.verification-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.verification-intro {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 13px 14px;
  border: 1px solid rgba(112, 137, 123, .25);
  border-radius: 12px;
  background: rgba(240, 248, 243, .7);
}
.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  color: #37614b;
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.verification-description {
  margin: 0;
  color: #5f7067;
  font-size: .74rem;
  line-height: 1.55;
}
.verification-password-label { margin-top: 3px; }
.verification-password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.verification-password-wrap .settings-input {
  padding-right: 48px;
  padding-left: 40px;
  background: rgba(255,255,255,.9);
}
.verification-password-wrap .pw-eye { right: 8px; }
.verification-password-icon {
  position: absolute;
  left: 14px;
  z-index: 1;
  color: #7a8982;
  pointer-events: none;
}
.verification-help {
  margin: 0;
  color: #89958f;
  font-size: .67rem;
  line-height: 1.4;
}
.settings-faq-section { grid-column: 1 / -1; }
.tfa-status { color: var(--metal-muted); font-size: 0.75rem; font-weight: 700; min-width: 0; text-align: center; order: 2; }
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
.toggle-switch--on {
  background: linear-gradient(145deg, #78a889, #4e8062);
  border-color: #47745a;
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 3px 9px rgba(57, 105, 75, .22);
}
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

/* ── Settings feedback popups ── */
:global(.settings-alert-popup) {
  width: min(390px, calc(100vw - 32px)) !important;
  gap: 0 !important;
  padding: 14px 18px 12px !important;
  border: 1px solid rgba(255,255,255,.76) !important;
  border-radius: 16px !important;
  background: linear-gradient(145deg, #f0f2f3 0%, #d9dddf 54%, #c4c9cc 100%) !important;
  box-shadow: 0 18px 42px rgba(35,43,49,.24), inset 0 1px rgba(255,255,255,.9) !important;
  text-align: left !important;
}
:global(.settings-alert-popup .settings-alert-icon) {
  width: 86px !important;
  height: 86px !important;
  margin: 0 auto 0 !important;
  border: 0 !important;
  color: #58636a !important;
}
:global(.settings-alert-popup--success .settings-alert-icon) { color: #43845d !important; }
:global(.settings-alert-popup--error .settings-alert-icon) { color: #b64f59 !important; }
:global(.settings-alert-symbol) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  animation: settings-alert-icon-pop .35s cubic-bezier(.2,.8,.2,1) both;
}
:global(.settings-alert-symbol svg) {
  display: block;
  width: 70px;
  height: 70px;
  stroke-width: 3.8;
}
:global(.settings-alert-symbol i) {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 28px;
  height: 3px;
  border-radius: 3px;
  background: currentColor;
}
:global(.settings-alert-symbol--error i:first-child) {
  transform: translate(-50%, -50%) rotate(45deg);
}
:global(.settings-alert-symbol--error i:last-child) {
  transform: translate(-50%, -50%) rotate(-45deg);
}
:global(.settings-alert-symbol--success) {
  color: #43845d;
}
:global(.settings-alert-symbol--error) {
  color: #b64f59;
}
:global(.settings-alert-symbol--success i:first-child) {
  top: 27px;
  left: 14px;
  width: 12px;
  transform-origin: left center;
  transform: rotate(45deg);
}
:global(.settings-alert-symbol--success i:last-child) {
  top: 35px;
  left: 22px;
  width: 21px;
  transform-origin: left center;
  transform: rotate(-45deg);
}
:global(.settings-alert-popup .settings-alert-title) {
  margin: 0 !important;
  color: #263139 !important;
  font-size: 1.1rem !important;
  font-weight: 800 !important;
  letter-spacing: -.02em !important;
}
:global(.settings-alert-popup .settings-alert-text) {
  margin: 0 !important;
  color: #66737b !important;
  font-size: .82rem !important;
  line-height: 1.4 !important;
}
:global(.settings-alert-popup .settings-alert-confirm) {
  min-width: 108px !important;
  margin: 4px 0 0 !important;
  padding: 6px 18px !important;
  border: 1px solid #3f4b54 !important;
  border-radius: 9px !important;
  background: linear-gradient(145deg, #687780, #3f4b54) !important;
  color: #fff !important;
  font-family: inherit !important;
  font-size: .78rem !important;
  font-weight: 700 !important;
  box-shadow: 0 5px 12px rgba(48, 53, 58, .2) !important;
}
:global(.settings-alert-popup .settings-alert-confirm:hover) {
  background: linear-gradient(145deg, #75838b, #4a5861) !important;
}
:global(.settings-alert-popup--success) {
  border-top: 1px solid rgba(255,255,255,.76) !important;
}
:global(.settings-alert-popup--error) {
  border-top: 1px solid rgba(255,255,255,.76) !important;
}

@keyframes settings-alert-icon-pop {
  0% { opacity: 0; transform: scale(.68); }
  70% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

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
.faq-category-group + .faq-category-group { margin-top: 24px; }
.faq-category-divider { display: flex; align-items: center; gap: 10px; margin: 0 2px 10px; color: #737e86; font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.faq-category-divider::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, rgba(104,112,120,.3), transparent); }

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item {
  position: relative;
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
}
.faq-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: #69747d;
  opacity: 0;
  transition: opacity .18s ease;
}
.faq-item--open {
  border-color: #bfc6cb;
  box-shadow: 0 4px 14px rgba(48, 53, 58,0.08);
}
.faq-item--open::before { opacity: 1; }
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
  transition: background 0.15s, color 0.15s;
}
.faq-question:hover { background: #f1f3f4; color: #202a31; }
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
:deep(.faq-inline-highlight) {
  display: inline;
  padding: 1px 5px;
  border: 1px solid rgba(105,116,125,.34);
  border-radius: 5px;
  background: linear-gradient(145deg, #f3f5f5, #d8dde0);
  color: #4f5b63;
  font-size: .92em;
  font-weight: 750;
  box-shadow: inset 0 1px rgba(255,255,255,.72);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
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
  .settings-body { grid-template-columns: 1fr; }
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 24px 18px 32px; }
}
@media (max-width: 520px) {
  .otp-wrap { flex-direction: column; }
  .otp-boxes { width: 100%; }
  .otp-btn { width: 100%; }
}
</style>
