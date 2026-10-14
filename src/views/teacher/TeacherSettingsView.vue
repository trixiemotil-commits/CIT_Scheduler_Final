<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar teacher-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/teacher/profile')">
          <img :src="user.avatar || initialsAvatar(user)" alt="Teacher" class="avatar" />
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
      <header v-if="isSettingsLoading" class="main-header" aria-hidden="true">
        <div class="settings-page-heading-skeleton">
          <span class="settings-skeleton-shimmer settings-eyebrow-skeleton"></span>
          <span class="settings-skeleton-shimmer settings-title-skeleton"></span>
          <span class="settings-skeleton-shimmer settings-subtitle-skeleton"></span>
        </div>
      </header>
      <header v-else class="main-header">
        <div>
          <span class="page-eyebrow">Account &amp; security</span>
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Manage account access, password security, and sign-in preferences.</p>
        </div>
      </header>

      <div v-if="isSettingsLoading" class="settings-body settings-loading-skeleton" aria-busy="true" aria-label="Loading settings">
        <span class="settings-skeleton-sr-only" role="status">Loading settings</span>
        <div class="settings-skeleton-grid">
          <section class="settings-card settings-skeleton-card settings-skeleton-password">
            <div class="settings-skeleton-card-heading">
              <span class="settings-skeleton-shimmer settings-skeleton-icon"></span>
              <div class="settings-skeleton-heading-lines">
                <span class="settings-skeleton-shimmer settings-skeleton-heading"></span>
                <span class="settings-skeleton-shimmer settings-skeleton-description"></span>
              </div>
            </div>
            <div class="settings-skeleton-step-row">
              <span class="settings-skeleton-shimmer settings-skeleton-step"></span>
            </div>
            <div class="settings-skeleton-field">
              <span class="settings-skeleton-shimmer settings-skeleton-label"></span>
              <span class="settings-skeleton-shimmer settings-skeleton-input"></span>
            </div>
            <div class="settings-skeleton-field">
              <span class="settings-skeleton-shimmer settings-skeleton-label settings-skeleton-otp-label"></span>
              <div class="settings-skeleton-otp-row">
                <div class="settings-skeleton-otp-boxes">
                  <span v-for="box in 6" :key="box" class="settings-skeleton-shimmer settings-skeleton-otp-box"></span>
                </div>
                <span class="settings-skeleton-shimmer settings-skeleton-send"></span>
              </div>
            </div>
            <span class="settings-skeleton-shimmer settings-skeleton-button"></span>
          </section>

          <section class="settings-card settings-skeleton-card settings-skeleton-verification">
            <div class="settings-skeleton-card-heading">
              <span class="settings-skeleton-shimmer settings-skeleton-icon"></span>
              <div class="settings-skeleton-heading-lines">
                <span class="settings-skeleton-shimmer settings-skeleton-heading"></span>
                <span class="settings-skeleton-shimmer settings-skeleton-description"></span>
              </div>
              <span class="settings-skeleton-shimmer settings-skeleton-toggle"></span>
            </div>
            <span class="settings-skeleton-shimmer settings-skeleton-info"></span>
            <span class="settings-skeleton-shimmer settings-skeleton-label"></span>
            <span class="settings-skeleton-shimmer settings-skeleton-input"></span>
            <span class="settings-skeleton-shimmer settings-skeleton-help"></span>
          </section>
        </div>

        <section class="settings-card settings-skeleton-device-card">
          <div class="settings-skeleton-device-heading">
            <div>
              <span class="settings-skeleton-shimmer settings-skeleton-heading"></span>
              <span class="settings-skeleton-shimmer settings-skeleton-description"></span>
            </div>
            <span class="settings-skeleton-shimmer settings-skeleton-refresh"></span>
          </div>
          <div v-for="row in 3" :key="row" class="settings-skeleton-device-row">
            <span class="settings-skeleton-shimmer settings-skeleton-device-icon"></span>
            <div class="settings-skeleton-device-lines">
              <span class="settings-skeleton-shimmer settings-skeleton-device-name"></span>
              <span class="settings-skeleton-shimmer settings-skeleton-device-meta"></span>
              <span class="settings-skeleton-shimmer settings-skeleton-device-date"></span>
            </div>
            <span class="settings-skeleton-shimmer settings-skeleton-logout"></span>
          </div>
        </section>

        <section class="settings-card settings-skeleton-faq">
          <span class="settings-skeleton-shimmer settings-skeleton-heading"></span>
          <div v-for="row in 3" :key="row" class="settings-skeleton-faq-item">
            <span class="settings-skeleton-shimmer settings-skeleton-faq-row"></span>
            <span class="settings-skeleton-shimmer settings-skeleton-faq-chevron"></span>
          </div>
        </section>
      </div>

      <div v-show="!isSettingsLoading" class="settings-body">

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
            <div class="settings-step-label"><span>Step {{ passwordStep }} of 2</span></div>
            <div v-if="passwordStep === 1" class="settings-row settings-row--identity">
              <div class="settings-group">
                <label class="settings-label">Current Password</label>
                <div class="pw-input-wrap" :class="{ 'is-invalid': pwErrorField === 'current' }">
                  <input
                    ref="currentPasswordInput"
                    v-model="passwordForm.current"
                    :type="showCurrent ? 'text' : 'password'"
                    class="settings-input"
                    placeholder="Enter current password"
                    :aria-invalid="pwErrorField === 'current'"
                    :aria-describedby="pwErrorField === 'current' ? 'teacher-current-password-error' : undefined"
                    @input="clearPasswordError('current')"
                  />
                  <button type="button" class="pw-eye" @click="showCurrent = !showCurrent">
                    <svg v-if="!showCurrent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <p v-if="pwErrorField === 'current'" id="teacher-current-password-error" class="change-password-field-error" role="alert">{{ pwError }}</p>
              </div>
              <div class="settings-group">
                <label class="settings-label">6-Digit OTP</label>
                <div class="otp-entry-wrap">
                  <div class="otp-boxes" :class="{ 'is-invalid': pwErrorField === 'otp' }" role="group" aria-label="Six-digit one-time password">
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
                      :aria-invalid="pwErrorField === 'otp'"
                      :aria-describedby="pwErrorField === 'otp' ? 'teacher-password-otp-error' : undefined"
                      @input="onPwOtpInput(index)"
                      @keydown.backspace="onPwOtpBackspace(index)"
                    />
                  </div>
                  <button type="button" class="send-otp-btn" :disabled="isSendingPasswordOtp" @click="sendOtp">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    <span>{{ isSendingPasswordOtp ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP' }}</span>
                  </button>
                </div>
                <p v-if="pwErrorField === 'otp'" id="teacher-password-otp-error" class="change-password-field-error" role="alert">{{ pwError }}</p>
                <span v-if="otpSent" class="otp-expiry">Expires in {{ formattedOtpTime }}.</span>
              </div>
            </div>

            <template v-else-if="passwordStep === 2">
              <div class="settings-row settings-row--password">
                <div class="settings-group">
                  <label class="settings-label">New Password</label>
                  <div class="pw-input-wrap" :class="{ 'is-invalid': pwErrorField === 'newPw' }">
                    <input
                      ref="newPasswordInput"
                      v-model="passwordForm.newPw"
                      :type="showNew ? 'text' : 'password'"
                      class="settings-input"
                      placeholder="Enter new password"
                      :aria-invalid="pwErrorField === 'newPw'"
                      :aria-describedby="pwErrorField === 'newPw' ? 'teacher-new-password-error' : undefined"
                      @input="clearPasswordError('newPw')"
                    />
                    <button type="button" class="pw-eye" @click="showNew = !showNew">
                      <svg v-if="!showNew" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                  <p v-if="pwErrorField === 'newPw'" id="teacher-new-password-error" class="change-password-field-error" role="alert">{{ pwError }}</p>
                </div>
                <div class="settings-group">
                  <label class="settings-label">Confirm New Password</label>
                  <div class="pw-input-wrap" :class="{ 'is-invalid': pwErrorField === 'confirmPw' }">
                    <input
                      ref="confirmPasswordInput"
                      v-model="passwordForm.confirmPw"
                      :type="showConfirm ? 'text' : 'password'"
                      class="settings-input"
                      placeholder="Confirm new password"
                      :aria-invalid="pwErrorField === 'confirmPw'"
                      :aria-describedby="pwErrorField === 'confirmPw' ? 'teacher-confirm-password-error' : undefined"
                      @input="clearPasswordError('confirmPw')"
                    />
                    <button type="button" class="pw-eye" @click="showConfirm = !showConfirm">
                      <svg v-if="!showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                  <p v-if="pwErrorField === 'confirmPw'" id="teacher-confirm-password-error" class="change-password-field-error" role="alert">{{ pwError }}</p>
                </div>
              </div>
            </template>

            <div v-if="pwSuccess && passwordStep === 2" class="settings-msg settings-msg--success">{{ pwSuccess }}</div>

            <div class="settings-form-footer">
              <button v-if="passwordStep === 2" type="button" class="password-back-btn" @click="passwordStep = 1">Back</button>
              <button v-if="passwordStep === 1" type="button" class="update-pw-btn" @click="advancePasswordStep">Continue</button>
              <button v-else type="submit" class="update-pw-btn">Update Password</button>
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
              <p class="settings-card-sub verification-card-sub">Add a one-time verification step whenever you sign in.</p>
            </div>
            <div class="tfa-control">
              <span class="tfa-status">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
              <button type="button" class="toggle-switch" :class="{ 'toggle-switch--on': twoFactorEnabled }" :disabled="isSavingTwoFactor" :aria-pressed="twoFactorEnabled" :aria-label="twoFactorEnabled ? 'Disable email verification' : 'Enable email verification'" @click="toggleTwoFactor">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
          <div class="verification-content">
            <div class="verification-intro">
              <span class="verification-badge">Secure sign-in</span>
              <p class="verification-description">A one-time code will be sent to your PHINMA Gmail address whenever you log in.</p>
            </div>
            <label class="settings-label verification-password-label" for="teacher-two-factor-password">Confirm with your current password</label>
            <div class="verification-password-wrap" :class="{ 'is-invalid': twoFactorError }">
              <input id="teacher-two-factor-password" ref="twoFactorPasswordInput" v-model="twoFactorPassword" :type="showTwoFactorPassword ? 'text' : 'password'" class="settings-input" :aria-invalid="Boolean(twoFactorError)" :aria-describedby="twoFactorError ? 'teacher-two-factor-password-error' : twoFactorSuccess ? 'teacher-two-factor-password-success' : undefined" placeholder="Enter current password" @input="twoFactorError = ''; twoFactorSuccess = ''" />
              <button type="button" class="pw-eye" :aria-label="showTwoFactorPassword ? 'Hide current password' : 'Show current password'" @click="showTwoFactorPassword = !showTwoFactorPassword">
                <svg v-if="!showTwoFactorPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="twoFactorError" id="teacher-two-factor-password-error" class="verification-password-error" role="alert">{{ twoFactorError }}</p>
            <p v-if="twoFactorSuccess" id="teacher-two-factor-password-success" class="verification-password-success" role="status">{{ twoFactorSuccess }}</p>
            <p class="verification-help">Your password is used only to confirm this security setting.</p>
          </div>
        </div>



        <!-- ── FAQs ── -->
        <RecentDevices @initial-load-complete="finishSettingsLoading" />

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
    <div v-if="showLogoutModal" class="modal-overlay" @click.self="!isLoggingOut && (showLogoutModal = false)">
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
          <button class="logout-cancel-btn" :disabled="isLoggingOut" @click="showLogoutModal = false">Cancel</button>
          <button class="logout-confirm-btn" :disabled="isLoggingOut" :aria-busy="isLoggingOut" @click="confirmLogout">{{ isLoggingOut ? 'Logging out...' : 'Log out' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import RecentDevices from '@/components/RecentDevices.vue'
import TeacherSidebarStatus from '@/components/teacher/TeacherSidebarStatus.vue'
import { initialsAvatar } from '@/utils/avatar.js'
import { computed, onUnmounted, ref } from 'vue'
import Swal from 'sweetalert2'
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
const isLoggingOut = ref(false)
const isSettingsLoading = ref(true)

function finishSettingsLoading() {
  isSettingsLoading.value = false
}
async function confirmLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  await new Promise(resolve => setTimeout(resolve, 650))
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
const pwErrorField = ref('')
const pwSuccess    = ref('')
const currentPasswordInput = ref(null)
const newPasswordInput = ref(null)
const confirmPasswordInput = ref(null)
const passwordStep = ref(1)
const isSendingPasswordOtp = ref(false)
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
const twoFactorPasswordInput = ref(null)
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
    twoFactorPasswordInput.value?.focus()
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
    twoFactorPasswordInput.value?.focus()
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
  pwError.value = ''
  pwErrorField.value = ''
  if (!passwordForm.value.current) {
    pwError.value = 'Please enter your current password first.'
    pwErrorField.value = 'current'
    pwSuccess.value = ''
    currentPasswordInput.value?.focus()
    return
  }
  pwSuccess.value = ''
  isSendingPasswordOtp.value = true
  try {
    const response = await apiRequest('/auth/request-password-otp', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: passwordForm.value.current }),
    })
    otpSent.value = true
    pwOtpCode.value = ['', '', '', '', '', '']
    startOtpTimer()
    pwSuccess.value = response.message
    await Swal.fire({
      iconHtml: '<span class="teacher-settings-alert-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></span>',
      title: 'Success',
      text: `OTP sent to ${maskedEmail.value}.`,
      confirmButtonText: 'OK',
      confirmButtonColor: '#4b5563',
      buttonsStyling: false,
      customClass: {
        popup: 'teacher-settings-alert-popup',
        icon: 'teacher-settings-alert-icon',
        title: 'teacher-settings-alert-title',
        htmlContainer: 'teacher-settings-alert-text',
        confirmButton: 'teacher-settings-alert-confirm',
      },
    })
  } catch (error) {
    pwError.value = error.message || 'Unable to send the OTP.'
    pwErrorField.value = 'current'
    currentPasswordInput.value?.focus()
  } finally {
    isSendingPasswordOtp.value = false
  }
}

function advancePasswordStep() {
  pwError.value = ''
  pwErrorField.value = ''
  pwSuccess.value = ''
  if (!passwordForm.value.current) {
    pwError.value = 'Please enter your current password first.'
    pwErrorField.value = 'current'
    currentPasswordInput.value?.focus()
    return
  }
  if (!otpSent.value || !/^\d{6}$/.test(pwOtpCode.value.join(''))) {
    pwError.value = otpSent.value
      ? 'Please enter the 6-digit OTP sent to your email.'
      : 'Send an OTP to your email, then enter the 6-digit code.'
    pwErrorField.value = 'otp'
    pwOtpRefs.value[0]?.focus()
    return
  }
  passwordStep.value = 2
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
      resetOtp()
      passwordStep.value = 1
      pwError.value = 'OTP expired. Send a new code to continue.'
      pwErrorField.value = 'otp'
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
  if (pwErrorField.value === 'otp') clearPasswordError('otp')
  if (pwOtpCode.value[i] && i < 5) pwOtpRefs.value[i + 1]?.focus()
}
function onPwOtpBackspace(i) {
  if (!pwOtpCode.value[i] && i > 0) pwOtpRefs.value[i - 1]?.focus()
}

async function handleUpdatePassword() {
  pwError.value   = ''
  pwErrorField.value = ''
  pwSuccess.value = ''
  const enteredOtp = pwOtpCode.value.join('')
  if (enteredOtp.length < 6) {
    pwError.value = 'Please enter the 6-digit OTP sent to your email.'
    pwErrorField.value = 'otp'
    pwOtpRefs.value[0]?.focus()
    return
  }
  if (!passwordForm.value.newPw) {
    pwError.value = 'Please enter a new password.'
    pwErrorField.value = 'newPw'
    newPasswordInput.value?.focus()
    return
  }
  if (!passwordForm.value.confirmPw) {
    pwError.value = 'Please confirm your new password.'
    pwErrorField.value = 'confirmPw'
    confirmPasswordInput.value?.focus()
    return
  }
  if (passwordForm.value.newPw !== passwordForm.value.confirmPw) {
    pwError.value = 'New passwords do not match.'
    pwErrorField.value = 'confirmPw'
    confirmPasswordInput.value?.focus()
    return
  }
  if (passwordForm.value.newPw.length < 6) {
    pwError.value = 'New password must be at least 8 characters.'
    pwErrorField.value = 'newPw'
    newPasswordInput.value?.focus()
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
    passwordStep.value = 1
    clearOtpTimer()
    pwOtpCode.value    = ['', '', '', '', '', '']
    setTimeout(() => { pwSuccess.value = '' }, 4000)
  } catch (error) {
    pwError.value = error.message || 'Unable to update password.'
    const message = pwError.value.toLowerCase()
    if (message.includes('current password')) {
      passwordStep.value = 1
      pwErrorField.value = 'current'
      currentPasswordInput.value?.focus()
    } else if (message.includes('new password')) {
      passwordStep.value = 2
      pwErrorField.value = 'newPw'
      newPasswordInput.value?.focus()
    } else {
      passwordStep.value = 1
      pwErrorField.value = 'otp'
      pwOtpRefs.value[0]?.focus()
    }
  }
}

function clearPasswordError(field) {
  if (pwErrorField.value !== field) return
  pwError.value = ''
  pwErrorField.value = ''
}

onUnmounted(clearOtpTimer)



/* ── FAQs ── */
const openFaq = ref(null)
const faqCategories = ['Teaching & Consultation', 'Schedule & Events', 'Account & Security']
const faqHighlightTerms = [
  'Settings',
  'Change Password',
  'Email verification',
  'OTP',
  'Schedule',
  'Consultation',
  'Office Hours',
  'Events',
  'Teacher Portal',
  'Logout',
  'Switch to Admin',
]
const faqs = [
  {
    category: 'Account & Security',
    q: 'How do I change my teacher password?',
    a: [
      'Open Settings and choose Change Password.',
      'Enter your current password, request the OTP sent to your email, and enter your new password.',
      'Press Update Password to save the change.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How do I enable email verification?',
    a: [
      'Open Settings and find Email verification.',
      'Enter your current password to confirm the change, then enable the toggle.',
      'A verification code will be sent to your email whenever you log in.'
    ]
  },
  {
    category: 'Teaching & Consultation',
    q: 'How do I update my consultation availability?',
    a: [
      'Use the Office Hours panel in the sidebar to set your current availability.',
      'Choose Open for consultations when you are accepting student requests.',
      'Students can book only when you are available and have consultation hours for that day.'
    ]
  },
  {
    category: 'Teaching & Consultation',
    q: 'How do I review consultation requests?',
    a: [
      'Open Consultation from the sidebar to view incoming student requests.',
      'Review the requested subject, schedule, and description before responding.',
      'Keep your Office Hours updated so students can select accurate times.'
    ]
  },
  {
    category: 'Schedule & Events',
    q: 'Where do I find my teaching schedule?',
    a: [
      'Open Schedule from the sidebar to view your assigned classes.',
      'Use the schedule view to check rooms, subjects, days, and teaching times.',
      'Contact an administrator if an assigned class or time is incorrect.'
    ]
  },
  {
    category: 'Schedule & Events',
    q: 'How do I view school events?',
    a: [
      'Open Events from the sidebar to see campus announcements and activities.',
      'Check each event for its date, time, venue, and description.'
    ]
  },
  {
    category: 'Account & Security',
    q: 'How do I log out or switch roles?',
    a: [
      'Use Switch to Admin when your account has access to the admin portal.',
      'Use Logout in the sidebar to end your session and return to the login page.'
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
  container-type: inline-size;
  container-name: teacher-settings-content;
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

.settings-page-heading-skeleton { display: grid; justify-items: start; gap: 8px; }
.settings-skeleton-shimmer { position: relative; display: block; overflow: hidden; background: #e1e6e9; }
.settings-skeleton-shimmer::after { position: absolute; inset: 0; content: ''; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent); animation: settings-skeleton-shimmer 1.35s ease-in-out infinite; }
.settings-eyebrow-skeleton { width: 178px; height: 12px; border-radius: 6px; }
.settings-title-skeleton { width: 300px; max-width: 62vw; height: 46px; border-radius: 10px; }
.settings-subtitle-skeleton { width: min(570px, 78vw); height: 18px; border-radius: 8px; }
.settings-loading-skeleton { pointer-events: none; }
.settings-loading-skeleton.settings-body { gap: 18px; }
.settings-skeleton-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); align-items: stretch; gap: 18px; }
.settings-skeleton-card { display: flex; min-height: 0; flex-direction: column; gap: 12px; }
.settings-skeleton-password,
.settings-skeleton-verification { min-height: 350px; }
.settings-skeleton-card-heading { display: flex; align-items: center; gap: 12px; min-height: 48px; margin: 0 0 1px; padding-bottom: 12px; border-bottom: 1px solid rgba(129,140,148,.22); }
.settings-skeleton-icon { width: 42px; height: 42px; flex: 0 0 auto; border-radius: 11px; }
.settings-skeleton-heading-lines { display: grid; flex: 1; gap: 7px; }
.settings-skeleton-heading { width: min(210px, 70%); height: 16px; border-radius: 6px; }
.settings-skeleton-description { width: min(330px, 90%); height: 11px; border-radius: 5px; }
.settings-skeleton-step-row { display: flex; justify-content: flex-end; margin-top: -2px; }
.settings-skeleton-step { width: 94px; height: 28px; border-radius: 999px; }
.settings-skeleton-field { display: grid; gap: 7px; }
.settings-skeleton-label { width: 112px; height: 12px; border-radius: 5px; }
.settings-skeleton-otp-label { width: 84px; }
.settings-skeleton-input { width: 100%; height: 42px; border-radius: 9px; }
.settings-skeleton-otp-row { display: flex; align-items: stretch; gap: 10px; }
.settings-skeleton-otp-boxes { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px; width: min(100%, 287px); }
.settings-skeleton-otp-box { min-width: 0; height: 42px; border-radius: 10px; }
.settings-skeleton-send { flex: 1 1 auto; min-width: 105px; height: 42px; border-radius: 10px; }
.settings-skeleton-button { width: 180px; height: 40px; align-self: center; margin-top: 5px; border-radius: 10px; }
.settings-skeleton-toggle { width: 62px; height: 32px; flex: 0 0 auto; border-radius: 999px; }
.settings-skeleton-info { width: 100%; height: 88px; border: 1px solid rgba(112,137,123,.2); border-radius: 12px; background: #e6eeea; }
.settings-skeleton-help { width: 84%; height: 11px; margin-top: -3px; border-radius: 5px; }
.settings-skeleton-device-card { min-height: 0; }
.settings-skeleton-device-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 0; padding-bottom: 12px; border-bottom: 1px solid rgba(129,140,148,.22); }
.settings-skeleton-device-heading > div { display: grid; flex: 1; gap: 8px; }
.settings-skeleton-refresh { width: 38px; height: 38px; flex: 0 0 auto; border-radius: 10px; }
.settings-skeleton-device-row { display: flex; align-items: center; gap: 14px; min-height: 78px; border-bottom: 1px solid rgba(129,140,148,.16); }
.settings-skeleton-device-icon { width: 42px; height: 42px; flex: 0 0 auto; border-radius: 10px; }
.settings-skeleton-device-lines { display: grid; flex: 1; gap: 7px; }
.settings-skeleton-device-name { width: min(290px, 65%); height: 14px; border-radius: 5px; }
.settings-skeleton-device-meta { width: min(235px, 55%); height: 11px; border-radius: 5px; }
.settings-skeleton-device-date { width: min(190px, 45%); height: 10px; border-radius: 5px; }
.settings-skeleton-logout { width: 72px; height: 36px; flex: 0 0 auto; border-radius: 8px; }
.settings-skeleton-faq { min-height: 0; gap: 10px; }
.settings-skeleton-faq > .settings-skeleton-heading { margin-bottom: 2px; }
.settings-skeleton-faq-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 42px; padding: 0 12px; border: 1px solid rgba(133,145,153,.24); border-radius: 9px; background: rgba(255,255,255,.34); }
.settings-skeleton-faq-row { width: min(440px, 75%); height: 12px; border-radius: 5px; }
.settings-skeleton-faq-chevron { width: 9px; height: 9px; flex: 0 0 auto; border-right: 2px solid #d4dadd; border-bottom: 2px solid #d4dadd; transform: rotate(45deg) translateY(-2px); }
.settings-skeleton-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
@keyframes settings-skeleton-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .settings-skeleton-shimmer::after { animation: none; } }

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
.pw-input-wrap.is-invalid .settings-input,
.pw-input-wrap.is-invalid .settings-input:focus,
.pw-input-wrap.is-invalid:focus-within .settings-input {
  border: 1.5px solid #c62835 !important;
  border-color: #c62835 !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(198, 40, 53, .2), 0 3px 10px rgba(160, 35, 45, .12) !important;
}
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
.faq-category-group + .faq-category-group { margin-top: 24px; }
.faq-category-divider { display: flex; align-items: center; gap: 10px; margin: 0 2px 10px; color: #737e86; font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.faq-category-divider::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, rgba(104,112,120,.3), transparent); }
.faq-list  { display: flex; flex-direction: column; gap: 12px; }
.faq-item {
  position: relative;
  background: #fff;
  border: 1.5px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
}
.faq-item--open { border-color: #bfc6cb; box-shadow: 0 4px 14px rgba(48, 53, 58,0.08); }
.faq-item::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: #69747d; opacity: 0; transition: opacity .18s ease; }
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
  font-size: .9rem;
  font-weight: 600;
  color: #222;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.faq-question:hover { background: #f1f3f4; color: #202a31; }
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
  align-items: start;
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
  padding: 18px 22px 20px;
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
.settings-row--password {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  row-gap: 0;
  align-content: start;
}
.settings-row--password .settings-group { gap: 2px; margin: 0; }
.settings-row--password .settings-group + .settings-group { margin-top: -6px; }
.settings-row--password .settings-group,
.settings-row--password .pw-input-wrap,
.settings-row--password .settings-input { width: 100%; min-width: 0; max-width: none; }
.settings-row--password .pw-input-wrap {
  box-sizing: border-box;
  min-height: 42px;
  border: 1px solid #acb7be;
  border-radius: 9px;
  background: linear-gradient(145deg, #f4f5f6, #e5e8ea);
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .08), 0 1px rgba(255,255,255,.8);
  overflow: hidden;
}
.settings-row--password .pw-input-wrap:focus-within {
  border-color: #687780;
  box-shadow: 0 0 0 3px rgba(90, 105, 114,.13), inset 0 1px 2px rgba(42, 52, 58, .06);
}
.settings-row--password .pw-input-wrap .settings-input {
  flex: 1 1 auto;
  min-width: 0;
  width: 100% !important;
  max-width: none !important;
  height: 100%;
  box-sizing: border-box;
  border: 0;
  outline: 0;
  border-radius: 8px;
  padding-right: 48px;
  background: transparent;
  box-shadow: none;
  appearance: none;
}
.settings-row--password .pw-input-wrap .settings-input:focus { border: 0; box-shadow: none; }
.settings-row--password .pw-input-wrap.is-invalid {
  border: 1.5px solid #c62835;
  box-shadow: 0 0 0 3px rgba(198,40,53,.2), 0 3px 10px rgba(160,35,45,.12);
}
.settings-row--password .pw-eye { right: 6px; }
.settings-row--identity,
.two-factor-card .settings-row--identity { grid-template-columns: minmax(0, 1fr); row-gap: 8px; }
.settings-row--identity .settings-group,
.settings-row--identity .pw-input-wrap { width: 100%; max-width: none; }
.settings-row--identity .pw-input-wrap .settings-input { max-width: none; }
.settings-step-label + .settings-row { margin-top: -10px; }
.settings-input { background: rgba(255,255,255,.82); border-color: #acb7be; }
.two-factor-card .settings-card-header,
.verification-card .settings-card-header { margin-bottom: 10px; }
.two-factor-card .settings-card-title,
.verification-card .settings-card-title { font-size: .98rem; }
.two-factor-card .settings-card-sub,
.verification-card .settings-card-sub { font-size: .72rem; line-height: 1.35; }
.two-factor-card .settings-form { gap: 10px; }
.two-factor-card .settings-label,
.verification-card .settings-label { font-size: .72rem; }
.verification-content { gap: 7px; }
.verification-intro { padding: 10px 12px; }
.verification-description { margin-top: 6px; font-size: .7rem; line-height: 1.4; }
.verification-card .verification-password-label { margin-top: 0; }
.verification-help { font-size: .63rem; }
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
.otp-boxes.is-invalid .otp-digit,
.otp-boxes.is-invalid .otp-digit:focus {
  border: 1.5px solid #c62835;
  color: #a92d35;
  background: rgba(255, 245, 245, .95);
  box-shadow: 0 0 0 2px rgba(198, 40, 53, .14), inset 0 1px 2px rgba(42, 52, 58, .08);
}
.change-password-field-error { margin: 0; color: #c62835; font-size: .74rem; line-height: 1.4; }
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
.settings-form-footer { justify-content: center; gap: 10px; }
.password-back-btn {
  min-width: 96px;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px solid #aab7be;
  border-radius: 10px;
  background: rgba(255, 255, 255, .82);
  color: #53616a;
  font: inherit;
  font-size: .8rem;
  font-weight: 700;
  cursor: pointer;
}
.password-back-btn:hover { background: #f1f4f5; border-color: #87949c; }
.two-factor-card { position: relative; }
.two-factor-card .settings-card-header { width: 100%; margin-bottom: 9px; padding-bottom: 9px; padding-right: 118px; }
.two-factor-card .settings-card-header .tfa-control { position: absolute; top: 30px; right: 30px; margin-left: 0; }
.two-factor-card .tfa-control { display: flex; align-items: center; gap: 10px; }
.toggle-switch { border: 1px solid #89959d; background: #aeb7bd; }
.toggle-switch--on { background: linear-gradient(145deg, #78a889, #4e8062); border-color: #47745a; box-shadow: inset 0 1px rgba(255,255,255,.28), 0 3px 9px rgba(57, 105, 75, .22); }
.verification-card { position: relative; display: flex; flex-direction: column; }
.verification-card .settings-card-header { align-items: flex-start; min-height: 44px; margin-bottom: 8px; padding-bottom: 8px; padding-right: 118px; }
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
.verification-card-sub { margin: 4px 0 0; max-width: none; }
.verification-content { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.verification-intro { padding: 9px 11px; border: 1px solid rgba(112, 137, 123, .25); border-radius: 12px; background: rgba(240, 248, 243, .7); }
.verification-badge { color: #37614b; font-size: .65rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.verification-description { margin: 9px 0 0; color: #5f7067; font-size: .74rem; line-height: 1.55; }
.verification-password-wrap { position: relative; display: flex; align-items: center; width: 100%; border-radius: 10px; }
.verification-password-wrap .settings-input { padding-right: 48px; max-width: none; }
.verification-password-wrap.is-invalid .settings-input,
.verification-password-wrap.is-invalid .settings-input:focus,
.verification-password-wrap.is-invalid:focus-within .settings-input {
  border: 1.5px solid #c62835 !important;
  border-color: #c62835 !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(198, 40, 53, .2), 0 3px 10px rgba(160, 35, 45, .12) !important;
}
.verification-password-error,
.verification-password-success { margin: 0; font-size: .72rem; line-height: 1.4; }
.verification-password-error { color: #a92d35; }
.verification-password-success { color: #28704f; }
.verification-password-wrap .pw-eye { right: 8px; }
.verification-help { margin: 0; color: #89958f; font-size: .67rem; line-height: 1.4; }
.settings-body > :deep(.device-panel) {
  grid-column: 1 / -1;
  width: 100%;
}
.settings-faq-section { grid-column: 1 / -1; }

/* Compact the settings cards based on the space left beside the sidebar,
   which can be narrow even when the preview's outer viewport is desktop-sized. */
@container teacher-settings-content (max-width: 780px) {
  .main { padding: 22px 18px 30px; }
  .main-header { margin-bottom: 18px; }
  .page-title { font-size: clamp(1.65rem, 5cqw, 2.1rem); }
  .page-sub { font-size: .84rem; }
  .settings-body { gap: 14px; }
  .settings-card { padding: 16px 18px 18px; border-radius: 16px; }
  .settings-card-header { gap: 10px; }
  .settings-card-title { font-size: .94rem; }
  .settings-card-sub { font-size: .69rem; }
  .verification-card .settings-card-header { gap: 7px; padding-right: 72px; }
  .verification-card .settings-card-header > div:nth-child(2) { min-width: 0; }
  .verification-card .settings-card-title { font-size: .72rem; line-height: 1.15; white-space: nowrap; }
  .verification-card .settings-card-sub { max-width: 145px; font-size: .56rem; line-height: 1.2; }
  .verification-card .settings-card-header .tfa-control { top: 17px; right: 12px; gap: 2px; }
  .verification-card .toggle-switch { width: 30px; height: 17px; }
  .verification-card .toggle-thumb { top: 2px; left: 2px; width: 13px; height: 13px; }
  .verification-card .toggle-switch--on .toggle-thumb { transform: translateX(13px); }
  .verification-card .tfa-status { font-size: .52rem; }
  .verification-intro { padding: 8px 10px; }
  .verification-description { font-size: .64rem; }
  .verification-card .settings-label { font-size: .64rem; }
  .verification-password-wrap .settings-input { min-height: 38px; font-size: .78rem; }
  .verification-password-wrap .pw-eye svg { width: 14px; height: 14px; }
  .verification-help,
  .verification-password-error,
  .verification-password-success { font-size: .58rem; }
  .toggle-switch { width: 36px; height: 20px; }
  .toggle-thumb { top: 2px; left: 2px; width: 16px; height: 16px; }
  .toggle-switch--on .toggle-thumb { transform: translateX(16px); }
  .settings-input { min-height: 40px; font-size: .84rem; }
  .settings-label { font-size: .68rem; }
  .otp-boxes { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
  .otp-digit { height: 38px; }
  .send-otp-btn { min-height: 38px; font-size: .74rem; }
  .update-pw-btn,
  .password-back-btn { min-height: 36px; padding: 7px 12px; font-size: .72rem; }
}

/* Keep the verification heading usable when its card sits in a narrow grid column. */
@container teacher-settings-content (max-width: 980px) {
  .verification-card .settings-card-header {
    padding-right: 0;
    align-items: center;
  }
  .verification-card .settings-card-header > div:nth-child(2) {
    min-width: 0;
    flex: 1 1 auto;
  }
  .verification-card .settings-card-title {
    white-space: normal;
    font-size: .88rem;
    line-height: 1.2;
  }
  .verification-card .settings-card-sub {
    max-width: none;
    font-size: .68rem;
    line-height: 1.35;
  }
  .verification-card .settings-card-header .tfa-control {
    position: static;
    flex: 0 0 auto;
    margin-left: 4px;
    gap: 3px;
  }
  .verification-card .toggle-switch { width: 34px; height: 19px; }
  .verification-card .toggle-thumb { top: 2px; left: 2px; width: 15px; height: 15px; }
  .verification-card .toggle-switch--on .toggle-thumb { transform: translateX(15px); }
  .verification-card .tfa-status { font-size: .58rem; }
}

:global(.teacher-settings-alert-popup) {
  width: min(390px, calc(100vw - 32px)) !important;
  gap: 0 !important;
  padding: 14px 18px 12px !important;
  border: 1px solid rgba(255,255,255,.76) !important;
  border-radius: 16px !important;
  background: linear-gradient(145deg, #f0f2f3 0%, #d9dddf 54%, #c4c9cc 100%) !important;
  box-shadow: 0 18px 42px rgba(35,43,49,.24), inset 0 1px rgba(255,255,255,.9) !important;
  text-align: center !important;
}
:global(.teacher-settings-alert-popup .teacher-settings-alert-icon) {
  width: 86px !important;
  height: 86px !important;
  margin: 0 auto !important;
  border: 0 !important;
  color: #43845d !important;
}
:global(.teacher-settings-alert-symbol) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  color: #43845d;
  animation: teacher-settings-alert-pop .35s cubic-bezier(.2,.8,.2,1) both;
}
:global(.teacher-settings-alert-symbol svg) { width: 58px; height: 58px; }
:global(.teacher-settings-alert-popup .teacher-settings-alert-title) {
  margin: 0 !important;
  color: #263139 !important;
  font-size: 1.1rem !important;
  font-weight: 800 !important;
  letter-spacing: -.02em !important;
}
:global(.teacher-settings-alert-popup .teacher-settings-alert-text) {
  margin: 0 !important;
  color: #66737b !important;
  font-size: .82rem !important;
  line-height: 1.4 !important;
}
:global(.teacher-settings-alert-popup .teacher-settings-alert-confirm) {
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
:global(.teacher-settings-alert-popup .teacher-settings-alert-confirm:hover) {
  background: linear-gradient(145deg, #75838b, #4a5861) !important;
}
@keyframes teacher-settings-alert-pop {
  0% { opacity: 0; transform: scale(.68); }
  70% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@media (max-width: 800px) {
  .settings-body { grid-template-columns: 1fr; }
  .settings-skeleton-grid { grid-template-columns: 1fr; }
  .settings-skeleton-password,
  .settings-skeleton-verification { min-height: 300px; }
  .settings-row { grid-template-columns: 1fr; }
  .main { padding: 22px 18px 30px; }
  .main-header { margin-bottom: 18px; }
  .page-title { font-size: clamp(1.65rem, 5vw, 2.1rem); }
  .page-sub { max-width: 58ch; font-size: .84rem; }
  .settings-card { padding: 16px 18px 18px; border-radius: 16px; }
  .settings-body { gap: 14px; }
  .settings-card-header { gap: 10px; }
  .settings-card-title { font-size: .94rem; }
  .settings-card-sub { font-size: .69rem; }
  .settings-form { gap: 9px; }
  .settings-skeleton-card { padding: 16px 18px 18px; }
  .verification-card .settings-card-header { gap: 7px; padding-right: 74px; }
  .verification-card .settings-card-header > div:nth-child(2) { min-width: 0; }
  .verification-card .settings-card-title { font-size: .78rem; line-height: 1.15; white-space: nowrap; }
  .verification-card .settings-card-sub { max-width: 155px; font-size: .6rem; line-height: 1.25; }
  .verification-card .settings-card-header .tfa-control { top: 18px; right: 12px; gap: 2px; }
  .verification-card .toggle-switch { width: 32px; height: 18px; }
  .verification-card .toggle-thumb { top: 2px; left: 2px; width: 14px; height: 14px; }
  .verification-card .toggle-switch--on .toggle-thumb { transform: translateX(14px); }
  .verification-card .tfa-status { font-size: .56rem; }
  .verification-intro { padding: 8px 10px; }
  .verification-description { font-size: .68rem; }
  .settings-input { min-height: 40px; font-size: .86rem; }
  .otp-boxes { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
  .otp-digit { height: 40px; }
  .send-otp-btn { min-height: 40px; font-size: .78rem; }
  .update-pw-btn,
  .password-back-btn { min-height: 38px; padding: 8px 14px; font-size: .76rem; }
  .faq-title { font-size: 1.15rem; }
  .faq-list { gap: 9px; }
  .faq-question { padding: 12px 14px; font-size: .84rem; }
}
@media (max-width: 520px) {
  .main { padding: 18px 12px 24px; }
  .main-header { margin-bottom: 14px; }
  .page-eyebrow { font-size: .62rem; }
  .page-title { font-size: 1.55rem; }
  .page-sub { margin-top: 4px; font-size: .76rem; line-height: 1.45; }
  .settings-card { padding: 13px 14px 15px; border-radius: 14px; }
  .settings-body { gap: 11px; }
  .settings-card-header,
  .two-factor-card .settings-card-header,
  .verification-card .settings-card-header { gap: 8px; margin-bottom: 8px; padding-bottom: 8px; }
  .settings-card-icon { width: 34px; height: 34px; flex: 0 0 auto; border-radius: 9px; }
  .settings-card-icon svg { width: 17px; height: 17px; }
  .settings-card-title,
  .two-factor-card .settings-card-title,
  .verification-card .settings-card-title { font-size: .58rem; line-height: 1.1; white-space: nowrap; }
  .settings-card-sub,
  .two-factor-card .settings-card-sub { font-size: .5rem; line-height: 1.2; }
  .verification-card .settings-card-sub { max-width: 130px; font-size: .46rem; line-height: 1.15; }
  .verification-card .settings-card-header { min-height: 36px; gap: 5px; padding-right: 62px; }
  .verification-card .settings-card-header > div:nth-child(2) { min-width: 0; }
  .verification-card .settings-card-header .tfa-control { top: 12px; right: 10px; gap: 1px; }
  .verification-card .toggle-switch { width: 30px; height: 17px; }
  .verification-card .toggle-thumb { top: 2px; left: 2px; width: 13px; height: 13px; }
  .verification-card .toggle-switch--on .toggle-thumb { transform: translateX(13px); }
  .verification-card .tfa-status { font-size: .52rem; }
  .settings-step-label span { padding: 3px 7px; font-size: .58rem; }
  .settings-label,
  .two-factor-card .settings-label,
  .verification-card .settings-label { font-size: .65rem; }
  .settings-input { min-height: 37px; padding: 8px 36px 8px 10px; font-size: .78rem; }
  .pw-eye { width: 28px; }
  .otp-entry-wrap { gap: 7px; }
  .otp-boxes { gap: 5px; }
  .otp-digit { height: 36px; border-radius: 8px; font-size: .9rem; }
  .send-otp-btn { min-height: 36px; font-size: .72rem; }
  .settings-form-footer { margin-top: 2px; }
  .update-pw-btn,
  .password-back-btn { min-height: 35px; padding: 7px 12px; font-size: .7rem; }
  .verification-intro { padding: 7px 9px; }
  .verification-badge { font-size: .58rem; }
  .verification-description { margin-top: 5px; font-size: .64rem; }
  .verification-help { font-size: .6rem; }
  .settings-faq-section { gap: 2px; }
  .faq-header { gap: 8px; margin-bottom: 10px; }
  .faq-header-icon { width: 32px; height: 32px; border-radius: 9px; }
  .faq-header-icon svg { width: 18px; height: 18px; }
  .faq-title { font-size: 1rem; }
  .faq-category-group + .faq-category-group { margin-top: 16px; }
  .faq-list { gap: 7px; }
  .faq-question { gap: 8px; padding: 10px 11px; font-size: .74rem; }
  .faq-chevron { width: 15px; height: 15px; flex: 0 0 auto; }
  .faq-bullets { padding-left: 18px; font-size: .7rem; line-height: 1.45; }
  .faq-answer { padding: 0 11px 11px; }
  .faq-category-divider { margin-bottom: 7px; font-size: .58rem; }
  .verification-password-label { font-size: .62rem; line-height: 1.3; }
  .verification-password-wrap .pw-eye svg { width: 14px; height: 14px; }
  .verification-password-error,
  .verification-password-success { font-size: .64rem; }
  .change-password-field-error { font-size: .64rem; }
  .otp-expiry { font-size: .62rem; }
  .settings-msg { padding: 7px 9px; font-size: .68rem; }
  .settings-skeleton-title { width: min(245px, 62vw); height: 36px; }
  .settings-skeleton-subtitle { height: 15px; }
  .settings-skeleton-card { padding: 13px 14px 15px; }
  .settings-skeleton-password,
  .settings-skeleton-verification { min-height: 270px; }
  .settings-skeleton-card-heading { gap: 8px; }
  .settings-skeleton-icon { width: 34px; height: 34px; }
  .settings-skeleton-heading { height: 14px; }
  .settings-skeleton-description { height: 9px; }
  .settings-skeleton-input { height: 37px; }
  .settings-skeleton-otp-box { height: 36px; }
  .settings-skeleton-send { height: 36px; }
  .settings-skeleton-button { height: 35px; }
  .settings-skeleton-info { height: 76px; }
  .settings-skeleton-device-row { gap: 9px; }
  .settings-skeleton-device-icon { width: 34px; height: 34px; }
  .settings-skeleton-logout { width: 54px; }
  .settings-skeleton-otp-row { align-items: stretch; flex-direction: column; }
  .settings-skeleton-send { width: 100%; }
  :deep(.device-panel) { padding: 12px; border-radius: 14px; }
  :deep(.device-panel__header h2) { font-size: .82rem; }
  :deep(.device-panel__description) { font-size: .64rem; }
  :deep(.device-refresh) { width: 30px; height: 30px; }
  :deep(.device-refresh svg) { width: 14px; height: 14px; }
  :deep(.device-row) { align-items: flex-start; gap: 8px; padding: 10px 0; }
  :deep(.device-icon) { width: 30px; height: 30px; border-radius: 8px; }
  :deep(.device-icon svg) { width: 15px; height: 15px; }
  :deep(.device-name) { gap: 5px; font-size: .68rem; }
  :deep(.device-current) { padding: 2px 5px; font-size: .54rem; }
  :deep(.device-meta),
  :deep(.device-time) { font-size: .6rem; }
  :deep(.device-logout) { align-self: center; min-height: 28px; padding: 4px 7px; font-size: .6rem; }
  :deep(.device-message) { font-size: .68rem; }
  .otp-entry-wrap { flex-direction: column; }
  .otp-boxes,
  .send-otp-btn { width: 100%; }
}
</style>
