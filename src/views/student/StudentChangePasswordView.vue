<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="change-password-page">
        <header class="change-password-header">
          <button class="change-password-back" type="button" aria-label="Go back to profile" @click="goToProfile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1>Change Password</h1>
          <span class="header-spacer" aria-hidden="true"></span>
        </header>

        <main class="change-password-content">
          <section class="security-card password-card">
            <div class="card-heading">
              <span class="card-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <div><h2>Change password</h2><p>Verify your account, then choose a new password.</p></div>
            </div>

            <form class="password-form" @submit.prevent="changePassword">
              <label class="password-field">
                <span>Current password</span>
                <div class="password-input-wrap">
                  <input v-model="currentPassword" :type="showCurrent ? 'text' : 'password'" placeholder="Enter current password" autocomplete="current-password" />
                  <button type="button" class="password-eye" :aria-label="showCurrent ? 'Hide current password' : 'Show current password'" @click="showCurrent = !showCurrent"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
                </div>
              </label>

              <div class="otp-row">
                <label class="password-field"><span>6-digit OTP</span><div class="otp-boxes" role="group" aria-label="Six-digit one-time password"><input v-for="(_, index) in otpDigits" :key="index" :ref="element => { if (element) otpRefs[index] = element }" v-model="otpDigits[index]" class="otp-input" inputmode="numeric" maxlength="1" :aria-label="`OTP digit ${index + 1}`" @input="handleOtpInput(index, $event)" @keydown.backspace="handleOtpBackspace(index, $event)" @paste.prevent="handleOtpPaste" /></div></label>
                <button class="otp-button" type="button" :disabled="isSendingOtp || otpCooldown > 0" @click="requestOtp">{{ isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Send OTP' }}</button>
              </div>

              <label class="password-field">
                <span>New password</span>
                <div class="password-input-wrap"><input v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="Enter new password" autocomplete="new-password" /><button type="button" class="password-eye" :aria-label="showNew ? 'Hide new password' : 'Show new password'" @click="showNew = !showNew"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
              </label>

              <label class="password-field">
                <span>Confirm new password</span>
                <div class="password-input-wrap"><input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Re-enter new password" autocomplete="new-password" /><button type="button" class="password-eye" :aria-label="showConfirm ? 'Hide confirmation password' : 'Show confirmation password'" @click="showConfirm = !showConfirm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
              </label>

              <p v-if="passwordMessage" class="form-message" :class="{ error: passwordError }">{{ passwordMessage }}</p>
              <button class="update-button" type="submit" :disabled="isChanging">{{ isChanging ? 'Updating...' : 'Update password' }}</button>
            </form>
          </section>

          <section class="security-card verification-card">
            <div class="verification-heading">
              <div class="card-heading"><span class="card-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg></span><div><h2>Email verification</h2><p>Require a code whenever you log in.</p></div></div>
              <div class="verification-status"><button type="button" class="verification-toggle" :class="{ enabled: twoFactorEnabled }" :disabled="isSavingTwoFactor" :aria-pressed="twoFactorEnabled" aria-label="Toggle email verification" @click="toggleTwoFactor"><span></span></button><small>{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</small></div>
            </div>
            <p class="verification-copy">Send a verification code to your PHINMA Gmail address whenever you log in.</p>
            <input v-model="twoFactorPassword" class="security-input" type="password" placeholder="Current password to confirm change" />
            <p v-if="twoFactorMessage" class="form-message" :class="{ error: twoFactorError }">{{ twoFactorMessage }}</p>
          </section>
        </main>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken, getUser, saveMergedUser } from '@/auth.js'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const router = useRouter()
const user = getUser() || { name: 'Student', email: '' }
const currentPassword = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = []
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const passwordMessage = ref('')
const passwordError = ref(false)
const isSendingOtp = ref(false)
const isChanging = ref(false)
const otpCooldown = ref(0)
const twoFactorEnabled = ref(Boolean(user.twoFactorEnabled))
const twoFactorPassword = ref('')
const twoFactorMessage = ref('')
const twoFactorError = ref(false)
const isSavingTwoFactor = ref(false)
let cooldownTimer

const initials = computed(() => String(user.name || 'Student').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase())

function goToProfile() {
  document.body.classList.remove('student-settings-active')
  router.push('/student/profile')
}
const otp = computed(() => otpDigits.value.join(''))

function handleOtpInput(index, event) {
  const value = String(event.target.value || '').replace(/\D/g, '').slice(-1)
  otpDigits.value[index] = value
  if (value && index < otpDigits.value.length - 1) otpRefs[index + 1]?.focus()
}

function handleOtpBackspace(index, event) {
  if (!event.target.value && index > 0) otpRefs[index - 1]?.focus()
}

function handleOtpPaste(event) {
  const pasted = String(event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  pasted.split('').forEach((digit, index) => { otpDigits.value[index] = digit })
  if (pasted) otpRefs[Math.min(pasted.length, 6) - 1]?.focus()
}

async function requestOtp() {
  passwordMessage.value = ''
  passwordError.value = false
  if (!currentPassword.value) {
    passwordMessage.value = 'Enter your current password first.'
    passwordError.value = true
    return
  }
  isSendingOtp.value = true
  try {
    const response = await fetch(`${API_BASE}/auth/request-password-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ currentPassword: currentPassword.value }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to send OTP.')
    passwordMessage.value = body.message || 'OTP sent to your email.'
    otpCooldown.value = 60
    cooldownTimer = window.setInterval(() => { otpCooldown.value -= 1; if (otpCooldown.value <= 0) window.clearInterval(cooldownTimer) }, 1000)
  } catch (error) {
    passwordMessage.value = error.message
    passwordError.value = true
  } finally {
    isSendingOtp.value = false
  }
}

async function changePassword() {
  passwordMessage.value = ''
  passwordError.value = false
  if (!currentPassword.value || !otp.value || !newPassword.value || !confirmPassword.value) { passwordMessage.value = 'Complete all password fields and enter the OTP.'; passwordError.value = true; return }
  if (newPassword.value !== confirmPassword.value) { passwordMessage.value = 'New password and confirmation do not match.'; passwordError.value = true; return }
  isChanging.value = true
  try {
    const response = await fetch(`${API_BASE}/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value, otp: otp.value }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to change password.')
    passwordMessage.value = body.message || 'Password changed successfully.'
    currentPassword.value = ''; otpDigits.value = ['', '', '', '', '', '']; newPassword.value = ''; confirmPassword.value = ''
  } catch (error) {
    passwordMessage.value = error.message
    passwordError.value = true
  } finally {
    isChanging.value = false
  }
}

async function toggleTwoFactor() {
  twoFactorMessage.value = ''
  twoFactorError.value = false
  if (!twoFactorPassword.value) { twoFactorMessage.value = 'Enter your current password to confirm this change.'; twoFactorError.value = true; return }
  isSavingTwoFactor.value = true
  try {
    const enabled = !twoFactorEnabled.value
    const response = await fetch(`${API_BASE}/auth/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ twoFactorEnabled: enabled, currentPassword: twoFactorPassword.value }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to update email verification.')
    twoFactorEnabled.value = Boolean(body.user?.twoFactorEnabled)
    saveMergedUser(body.user)
    twoFactorPassword.value = ''
    twoFactorMessage.value = enabled ? 'Email verification enabled.' : 'Email verification disabled.'
  } catch (error) {
    twoFactorMessage.value = error.message
    twoFactorError.value = true
  } finally {
    isSavingTwoFactor.value = false
  }
}

onMounted(() => document.body.classList.add('student-settings-active'))
onBeforeUnmount(() => { document.body.classList.remove('student-settings-active'); if (cooldownTimer) window.clearInterval(cooldownTimer) })
</script>

<style scoped>
:global(body.student-settings-active .student-tab-bar) { display: none !important; }
:global(ion-content) { --background: linear-gradient(145deg, #eef0f1 0%, #dfe3e5 52%, #c7cdd1 100%); }
.change-password-page { width: 100%; max-width: 430px; min-height: 100dvh; margin: 0 auto; padding-bottom: calc(34px + env(safe-area-inset-bottom, 0px)); color: #252b31; background: radial-gradient(circle at 100% 0%, rgba(255,255,255,.78), transparent 34%), linear-gradient(145deg, #f1f3f4 0%, #dfe3e5 52%, #c7cdd1 100%); font-family: 'Poppins', sans-serif; }
.change-password-header { min-height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; }
.change-password-header h1 { color: #3e4851; font-size: 1.08rem; font-weight: 800; }
.change-password-back, .header-spacer { width: 44px; height: 44px; }
.change-password-back { display: grid; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.9); border-radius: 50%; color: #4d5860; background: linear-gradient(145deg,#fafbfb,#dfe3e5); box-shadow: inset 0 1px rgba(255,255,255,.95), 0 6px 14px rgba(48,57,64,.14); }
.change-password-content { display: flex; flex-direction: column; gap: 16px; padding: 0 16px; }
.security-card { padding: 19px 18px; border: 1px solid rgba(255,255,255,.98); border-radius: 22px; background: linear-gradient(145deg,rgba(255,255,255,.96),rgba(235,239,241,.9)); box-shadow: inset 0 1px rgba(255,255,255,.98), 0 12px 26px rgba(48,57,64,.13); }
.card-heading { display: flex; align-items: flex-start; gap: 11px; min-width: 0; }
.card-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border-radius: 10px; color: #69747d; background: linear-gradient(145deg,#f8f9f9,#d7dde0); box-shadow: inset 0 1px rgba(255,255,255,.9); }
.card-heading h2 { margin: 0; color: #252b31; font-size: 1.12rem; line-height: 1.2; font-weight: 800; }
.card-heading p, .verification-copy { margin: 4px 0 0; color: #7b868f; font-size: .73rem; line-height: 1.4; }
.password-form { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
.password-field { display: flex; flex-direction: column; gap: 6px; color: #5d6872; font-size: .76rem; font-weight: 800; }
.password-input-wrap { position: relative; }
.password-input-wrap input, .otp-input, .security-input { width: 100%; min-height: 52px; box-sizing: border-box; border: 1px solid #c5cdd2; border-radius: 14px; padding: 11px 44px 11px 14px; color: #303940; background: linear-gradient(180deg,rgba(250,251,251,.84),rgba(232,235,236,.84)); box-shadow: inset 2px 2px 5px rgba(61,67,73,.08), 0 1px rgba(255,255,255,.8); font: inherit; font-size: .84rem; font-weight: 400; }
.password-input-wrap input::placeholder, .otp-input::placeholder, .security-input::placeholder { color: #7a838a; font-weight: 400; opacity: 1; }
.password-input-wrap input:focus, .otp-input:focus, .security-input:focus { outline: none; border-color: #69747d; box-shadow: 0 0 0 3px rgba(83,91,100,.14), inset 2px 2px 5px rgba(61,67,73,.06); }
.password-eye { position: absolute; top: 50%; right: 7px; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; transform: translateY(-50%); border: 0; background: transparent; color: #77828f; }
.otp-row { display: flex; align-items: flex-end; gap: 8px; }
.otp-row .password-field { min-width: 0; flex: 1; }
.otp-boxes { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.otp-button { min-height: 52px; padding: 0 12px; border: 1px solid #4a5259; border-radius: 14px; color: #fff; background: linear-gradient(145deg,#69747d,#303940); font: inherit; font-size: .7rem; font-weight: 800; white-space: nowrap; box-shadow: inset 0 1px rgba(255,255,255,.2), 0 6px 12px rgba(39,44,49,.16); }
.otp-button:disabled, .update-button:disabled { opacity: .6; }
.otp-input { min-height: 52px !important; padding: 0 !important; text-align: center; font-size: 1rem !important; font-weight: 800; }
.update-button { min-height: 54px; border: 1px solid #303940; border-radius: 15px; color: #fff; background: linear-gradient(145deg,#69747d,#303940); font: inherit; font-size: .86rem; font-weight: 800; box-shadow: inset 0 1px rgba(255,255,255,.2), 0 8px 16px rgba(39,44,49,.18); }
.form-message { margin: 0; color: #4f6870; font-size: .72rem; line-height: 1.4; }
.form-message.error { color: #bd4650; }
.verification-card { padding-bottom: 18px; }
.verification-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.verification-status { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 0 0 auto; }
.verification-status small { color: #687078; font-size: .68rem; font-weight: 800; }
.verification-toggle { position: relative; width: 48px; height: 26px; padding: 0; border: 0; border-radius: 20px; background: #c7cdd3; }
.verification-toggle span { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: transform .2s; }
.verification-toggle.enabled { background: #4b5563; }
.verification-toggle.enabled span { transform: translateX(22px); }
.security-input { margin-top: 14px; padding-right: 14px; }
@media (max-width: 380px) { .change-password-content { padding-inline: 14px; } .security-card { padding-inline: 16px; } .otp-boxes { gap: 4px; } .otp-input { min-height: 48px !important; } .otp-button { padding-inline: 10px; font-size: .66rem; } }
</style>
