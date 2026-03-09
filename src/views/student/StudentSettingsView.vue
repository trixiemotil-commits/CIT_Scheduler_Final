<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Settings</div>
      <div style="width:32px"></div>
    </div>

    <!-- User card -->
    <div class="user-card">
      <div class="user-avatar">{{ initials }}</div>
      <div class="user-info">
        <div class="user-name">{{ user.name }}</div>
        <div class="user-email">{{ user.email }}</div>
      </div>
      <button class="profile-link" @click="$router.push('/student/profile')">Profile</button>
    </div>

    <!-- Change Password -->
    <div class="section-card">
      <div class="section-title">Change Password</div>
      <form @submit.prevent="handleUpdatePassword">
        <!-- Current password + Send OTP -->
        <div class="field-row-otp">
          <div class="field-group" style="flex:1">
            <label class="field-label">Current Password</label>
            <div class="pw-wrap">
              <input v-model="pwForm.current" :type="showCurrent?'text':'password'" class="field-input" placeholder="••••••••" :disabled="otpSent" />
              <button type="button" class="eye-btn" @click="showCurrent=!showCurrent">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="otp-action">
            <button v-if="!otpSent" type="button" class="send-otp-btn" @click="sendOtp">Send OTP</button>
            <div v-else class="otp-sent-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Sent
              <button type="button" class="resend-link" @click="resetOtp">Resend</button>
            </div>
          </div>
        </div>

        <!-- OTP boxes -->
        <template v-if="otpSent">
          <label class="field-label">Enter OTP <span class="otp-hint">Sent to {{ maskedEmail }}</span></label>
          <div class="otp-boxes">
            <input
              v-for="(_, i) in pwOtpCode" :key="i"
              :ref="el => { if(el) otpRefs[i]=el }"
              v-model="pwOtpCode[i]"
              class="otp-box" type="text" maxlength="1" inputmode="numeric"
              @input="onOtpInput(i)"
              @keydown.backspace="onOtpBackspace(i)"
            />
          </div>

          <div class="field-group">
            <label class="field-label">New Password</label>
            <div class="pw-wrap">
              <input v-model="pwForm.newPw" :type="showNew?'text':'password'" class="field-input" placeholder="••••••••" />
              <button type="button" class="eye-btn" @click="showNew=!showNew">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Confirm New Password</label>
            <div class="pw-wrap">
              <input v-model="pwForm.confirmPw" :type="showConfirm?'text':'password'" class="field-input" placeholder="••••••••" />
              <button type="button" class="eye-btn" @click="showConfirm=!showConfirm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
        </template>

        <div v-if="pwError"   class="msg msg-err">{{ pwError }}</div>
        <div v-if="pwSuccess" class="msg msg-ok">{{ pwSuccess }}</div>

        <button type="submit" class="update-btn" :disabled="!otpSent">Update Password</button>
      </form>
    </div>

    <!-- 2FA -->
    <div class="section-card">
      <div class="section-title">Two Factor Authentication</div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Enable 2FA</div>
          <div class="toggle-sub">Adds extra login security</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" v-model="twoFactor" @change="on2FAChange" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div v-if="twoFactor" class="tfa-on-msg">✅ 2FA is <strong>ON</strong>. A verification code will be sent to your email at each login.</div>

      <div class="toggle-row" style="margin-top:16px">
        <div>
          <div class="toggle-label">Email Notifications</div>
          <div class="toggle-sub">Session updates by email</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" v-model="emailNotif" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-row" style="margin-top:12px">
        <div>
          <div class="toggle-label">Push Notifications</div>
          <div class="toggle-sub">In-app alerts</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" v-model="pushNotif" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <BottomNav active="profile" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getUser } from '@/auth.js'
import BottomNav from '@/components/student/BottomNav.vue'

const user     = getUser() || { name: 'Anna Cooper', email: 'anna.cooper@student.edu' }
const initials = computed(() => user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const maskedEmail = computed(() => {
  const email = user.email || 'student@gmail.com'
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 4)) + '@' + domain
})

/* Password */
const pwForm      = ref({ current: '', newPw: '', confirmPw: '' })
const showCurrent = ref(false)
const showNew     = ref(false)
const showConfirm = ref(false)
const pwError     = ref('')
const pwSuccess   = ref('')
const otpSent     = ref(false)
const pwOtpCode   = ref(['','','','','',''])
const otpRefs     = ref([])

function sendOtp() {
  if (!pwForm.value.current) { pwError.value = 'Please enter your current password first.'; return }
  pwError.value = ''; otpSent.value = true; pwOtpCode.value = ['','','','','','']
  pwSuccess.value = 'OTP sent to ' + maskedEmail.value
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}
function resetOtp() { otpSent.value = false; pwOtpCode.value = ['','','','','','']; pwForm.value.current = '' }
function onOtpInput(i)    { if (pwOtpCode.value[i] && i < 5) otpRefs.value[i+1]?.focus() }
function onOtpBackspace(i){ if (!pwOtpCode.value[i] && i > 0) otpRefs.value[i-1]?.focus() }

function handleUpdatePassword() {
  pwError.value = ''; pwSuccess.value = ''
  if (pwOtpCode.value.join('').length < 6) { pwError.value = 'Please enter the 6-digit OTP.'; return }
  if (!pwForm.value.newPw || !pwForm.value.confirmPw) { pwError.value = 'Please fill in the new password fields.'; return }
  if (pwForm.value.newPw !== pwForm.value.confirmPw)  { pwError.value = 'Passwords do not match.'; return }
  if (pwForm.value.newPw.length < 6)                  { pwError.value = 'Password must be at least 6 characters.'; return }
  pwSuccess.value = 'Password updated successfully.'
  pwForm.value = { current: '', newPw: '', confirmPw: '' }
  otpSent.value = false; pwOtpCode.value = ['','','','','','']
  setTimeout(() => { pwSuccess.value = '' }, 4000)
}

/* 2FA */
const twoFactor  = ref(false)
const emailNotif = ref(true)
const pushNotif  = ref(true)
function on2FAChange() {}
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100dvh;
  margin: 0 auto; background: #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; padding: 16px 18px; border-bottom: 1px solid #eee;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #444; padding: 4px; display: flex; align-items: center;
  border-radius: 6px; margin-left: -4px; transition: color 0.15s;
}
.back-btn:hover { color: #1b4332; }
.header-title { font-weight: 700; font-size: 1rem; color: #1b4332; }

/* User card */
.user-card {
  background: #fff; margin: 14px 16px 0;
  border-radius: 14px; padding: 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.user-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #1b4332; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.95rem; flex-shrink: 0;
}
.user-info { flex: 1; }
.user-name  { font-weight: 700; font-size: 0.9rem; color: #111; }
.user-email { font-size: 0.75rem; color: #777; }
.profile-link {
  background: #1b4332; color: #fff; border: none;
  border-radius: 8px; padding: 7px 14px;
  font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
}

/* Section card */
.section-card {
  background: #fff; margin: 12px 16px 0;
  border-radius: 14px; padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.section-title { font-weight: 700; font-size: 0.92rem; color: #1b4332; margin-bottom: 14px; }

/* Password form */
.field-row-otp { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 12px; }
.field-group   { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.field-label   { font-size: 0.78rem; font-weight: 600; color: #444; }
.pw-wrap { position: relative; }
.field-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 36px 10px 12px;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 0.85rem; font-family: inherit; outline: none; background: #f9fafb;
}
.field-input:focus { border-color: #2d6a4f; background: #fff; }
.field-input:disabled { opacity: 0.6; }
.eye-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #888; padding: 0;
}

.otp-action { flex-shrink: 0; padding-bottom: 1px; }
.send-otp-btn {
  background: #1b4332; color: #fff; border: none;
  border-radius: 8px; padding: 10px 14px;
  font-size: 0.8rem; font-weight: 600; white-space: nowrap;
  cursor: pointer; font-family: inherit;
}
.otp-sent-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: #d8f3e8; color: #1b7a4a;
  border-radius: 8px; padding: 8px 10px;
  font-size: 0.78rem; font-weight: 600; white-space: nowrap;
}
.resend-link {
  background: none; border: none; color: #1b4332;
  font-size: 0.75rem; font-weight: 600; text-decoration: underline;
  cursor: pointer; padding: 0; margin-left: 2px;
}

.otp-boxes { display: flex; gap: 8px; margin-bottom: 12px; }
.otp-box {
  width: 40px; height: 40px; text-align: center;
  font-size: 1rem; font-weight: 700;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  background: #f9fafb; color: #1b4332; outline: none;
}
.otp-box:focus { border-color: #2d6a4f; background: #fff; box-shadow: 0 0 0 2px rgba(45,106,79,0.15); }
.otp-hint { font-weight: 400; font-size: 0.72rem; color: #888; margin-left: 6px; }

.msg { font-size: 0.8rem; font-weight: 500; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; }
.msg-err { background: #ffeaea; color: #e63946; }
.msg-ok  { background: #d8f3e8; color: #1b7a4a; }

.update-btn {
  width: 100%; padding: 13px; border: none; border-radius: 10px;
  background: #1b4332; color: #fff;
  font-family: inherit; font-weight: 700; font-size: 0.88rem;
  cursor: pointer; transition: opacity 0.15s;
}
.update-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* 2FA toggles */
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 0.88rem; font-weight: 600; color: #111; }
.toggle-sub   { font-size: 0.75rem; color: #888; margin-top: 2px; }
.tfa-on-msg {
  background: #d8f3e8; color: #1b7a4a;
  font-size: 0.78rem; padding: 8px 12px;
  border-radius: 8px; margin-top: 10px;
}
.toggle-switch { position: relative; display: inline-block; width: 46px; height: 26px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: #ccc; border-radius: 26px; transition: 0.2s;
}
.toggle-slider::before {
  content: ''; position: absolute;
  height: 20px; width: 20px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: 0.2s;
}
.toggle-switch input:checked + .toggle-slider { background: #1b4332; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
</style>
