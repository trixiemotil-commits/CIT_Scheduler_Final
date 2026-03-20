<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Settings</div>
      <div style="width:32px"></div>
    </div>

    <div class="user-card">
      <div class="user-avatar">{{ initials }}</div>
      <div class="user-info">
        <div class="user-name">{{ user.name }}</div>
        <div class="user-email">{{ user.email }}</div>
      </div>
      <button class="profile-link" @click="$router.push('/student/profile')">Profile</button>
    </div>

    <div class="section-card">
      <div class="section-title">Change Password</div>
      <form @submit.prevent="handleUpdatePassword" class="pw-form">
        <div class="field-group">
          <label class="field-label">Current Password</label>
          <div class="pw-wrap">
            <input v-model="pwForm.current" class="field-input" :type="showCurrent ? 'text' : 'password'" placeholder="Enter your current password" />
            <button type="button" class="eye-btn" @click="showCurrent = !showCurrent" aria-label="Toggle current password visibility">
              <svg v-if="showCurrent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.66-1.92 1.8-3.64 3.26-5"/><path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/><path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.64 2.86"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">New Password</label>
          <div class="pw-wrap">
            <input v-model="pwForm.newPw" class="field-input" :type="showNew ? 'text' : 'password'" placeholder="Enter your new password" />
            <button type="button" class="eye-btn" @click="showNew = !showNew" aria-label="Toggle new password visibility">
              <svg v-if="showNew" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.66-1.92 1.8-3.64 3.26-5"/><path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/><path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.64 2.86"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Confirm New Password</label>
          <div class="pw-wrap">
            <input v-model="pwForm.confirmPw" class="field-input" :type="showConfirm ? 'text' : 'password'" placeholder="Re-enter your new password " />
            <button type="button" class="eye-btn" @click="showConfirm = !showConfirm" aria-label="Toggle confirm password visibility">
              <svg v-if="showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.66-1.92 1.8-3.64 3.26-5"/><path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/><path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.64 2.86"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div v-if="pwError" class="msg msg-err">{{ pwError }}</div>
        <button type="submit" class="update-btn">Update Password</button>
      </form>
    </div>

    <div class="section-card">
      <div class="section-title">Two Factor Authentication</div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Enable 2FA</div>
          <div class="toggle-sub">Adds extra login security</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" v-model="twoFactor" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div :class="['twofa-msg', twoFactor ? 'msg-on' : 'msg-off']">
        <span v-if="twoFactor">2FA is ON. A verification code will be sent to your email at each login.</span>
        <span v-else>2FA is currently OFF. Turn it ON to receive a verification code via email each time you log in.</span>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="success-modal">
        <div class="success-icon-wrap">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="success-title">Success!</div>
        <p class="success-text">Your password has been successfully updated. Keep it secure and do not share it with anyone.</p>
        <button class="success-btn" @click="showSuccessModal = false">Continue</button>
      </div>
    </div>

    <BottomNav active="profile" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getUser } from '@/auth.js'
import BottomNav from '@/components/student/BottomNav.vue'

const user = getUser() || { name: 'Anna Cooper', email: 'anna.cooper@student.edu' }
const initials = computed(() => user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const pwForm = ref({ current: '', newPw: '', confirmPw: '' })
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const pwError = ref('')
const pwSuccess = ref('')
const showSuccessModal = ref(false)
const twoFactor = ref(false)

function handleUpdatePassword() {
  pwError.value = ''
  pwSuccess.value = ''
  if (!pwForm.value.current || !pwForm.value.newPw || !pwForm.value.confirmPw) {
    pwError.value = 'Please complete all password fields.'
    return
  }
  if (pwForm.value.newPw !== pwForm.value.confirmPw) {
    pwError.value = 'New password and confirmation do not match.'
    return
  }
  if (pwForm.value.newPw.length < 8) {
    pwError.value = 'Password must be at least 8 characters long.'
    return
  }
  pwForm.value = { current: '', newPw: '', confirmPw: '' }
  pwSuccess.value = ''
  showSuccessModal.value = true
}
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
  border-radius: 6px;
  margin-left: -4px;
}
.header-title { font-weight: 700; font-size: 1rem; color: #23272c; }

.user-card {
  background: #fff;
  margin: 14px 16px 0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e4e7eb;
}
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.user-info { flex: 1; }
.user-name { font-weight: 700; font-size: 0.9rem; color: #181c20; }
.user-email { font-size: 0.75rem; color: #85909b; }
.profile-link {
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.76rem;
  font-weight: 600;
}

.section-card {
  background: #fff;
  margin: 10px 16px 0;
  border-radius: 12px;
  border: 1px solid #e4e7eb;
  padding: 14px;
}
.section-title { font-weight: 700; color: #262b30; margin-bottom: 12px; font-size: 1rem; }
.pw-form { display: flex; flex-direction: column; gap: 10px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8rem; color: #606a75; font-weight: 600; }
.field-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8dde3;
  border-radius: 9px;
  padding: 10px 38px 10px 12px;
  background: #f8fafb;
  font-size: 0.86rem;
  font-family: inherit;
}
.pw-wrap {
  position: relative;
}
.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #77828f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.update-btn {
  border: none;
  background: #1b4332;
  color: #fff;
  border-radius: 9px;
  padding: 11px;
  font-weight: 700;
  margin-top: 2px;
}
.msg { font-size: 0.78rem; padding: 8px 10px; border-radius: 8px; }
.msg-err { color: #d0414f; background: #fff1f3; }
.msg-ok { color: #1b4332; background: #eaf7ee; }

.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 0.9rem; font-weight: 600; color: #23282d; }
.toggle-sub { font-size: 0.75rem; color: #8a949f; margin-top: 1px; }
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #9aa3ad;
  border-radius: 24px;
  transition: 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.toggle-switch input:checked + .toggle-slider { background: #1b4332; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

.twofa-msg {
  margin-top: 12px;
  font-size: 0.76rem;
  border-radius: 8px;
  padding: 10px;
  line-height: 1.45;
}
.msg-on { background: #e7f6eb; color: #1b4332; border: 1px solid #1b4332; }
.msg-off { background: #fff1f1; color: #e14d56; border: 1px solid #f3c3c7; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.success-modal {
  width: min(320px, 100%);
  background: #fff;
  border: 2px solid #1b4332;
  border-radius: 14px;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.2);
  padding: 18px 16px 16px;
  text-align: center;
}
.success-icon-wrap {
  width: 72px;
  height: 72px;
  margin: 0 auto 10px;
  border: 4px solid #1b4332;
  color: #1b4332;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-title {
  font-size: 2rem;
  font-weight: 800;
  color: #161b20;
  margin-bottom: 8px;
}
.success-text {
  margin: 0;
  color: #5e6975;
  font-size: 0.86rem;
  line-height: 1.4;
}
.success-btn {
  margin-top: 14px;
  border: none;
  background: #1b4332;
  color: #fff;
  border-radius: 999px;
  padding: 9px 22px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
