<template>
  <div class="page-bg">
    <div class="card">

      <!-- ══════════════════════════════
           STEP 1 — Verify Your Email
      ══════════════════════════════ -->
      <template v-if="step === 1">
        <div class="icon-wrap">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8l10 6 10-6" />
          </svg>
        </div>
        <h2 class="step-title">Step 1: Verify Your Email</h2>
        <p class="step-desc">Enter the email address linked to your account. We'll send a 6-digit verification code.</p>

        <div v-if="error" class="error-msg">{{ error }}</div>
        <div v-if="message" class="success-msg">{{ message }}</div>

        <form class="form" @submit.prevent="goToStep2">
          <div class="input-wrapper">
            <input
              v-model="email"
              type="email"
              placeholder="e.g juan.delacruz.au@phinmaed.com"
              class="input-field"
              autocomplete="email"
              required
            />
          </div>
          <button type="submit" class="submit-btn" :disabled="isSending">{{ isSending ? 'SENDING...' : 'CONTINUE' }}</button>
          <RouterLink to="/" class="cancel-link">Cancel</RouterLink>
        </form>
      </template>

      <!-- ══════════════════════════════
           STEP 2 — OTP
      ══════════════════════════════ -->
      <template v-else-if="step === 2">
        <div class="icon-wrap">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8l10 6 10-6" />
          </svg>
        </div>
        <h2 class="step-title">Step 2: OTP</h2>
        <p class="step-desc">Enter the 6-digit verification code sent to your email.</p>

        <div v-if="error" class="error-msg">{{ error }}</div>
        <div v-if="message" class="success-msg">{{ message }}</div>

        <form class="form" @submit.prevent="goToStep3">
          <div class="pin-row">
            <input
              v-for="(_, i) in 6"
              :key="i"
              :ref="el => { if (el) pinRefs[i] = el }"
              v-model="pinDigits[i]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="pin-box"
              @input="onPinInput(i)"
              @keydown="onPinKeydown(i, $event)"
              @paste.prevent="onPinPaste($event)"
              required
            />
          </div>
          <button type="submit" class="submit-btn">CONTINUE</button>
          <button type="button" class="plain-btn" @click="goToStep2" :disabled="isSending">RESEND CODE</button>
          <RouterLink to="/" class="cancel-link">Cancel</RouterLink>
        </form>
      </template>

      <!-- ══════════════════════════════
           STEP 3 — Reset Your Password
      ══════════════════════════════ -->
      <template v-else>
        <div class="icon-wrap">
          <!-- Lock icon -->
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            <circle cx="12" cy="16" r="1" fill="#4b5563" />
          </svg>
        </div>
        <h2 class="step-title">Step 3: Reset Your Password</h2>
        <p class="step-desc">Create a new password. Make sure it meets all the requirements below.</p>

        <!-- Password requirements -->
        <ul class="req-list">
          <li v-for="req in requirements" :key="req.label" :class="{ met: req.test() }">
            <span class="req-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            {{ req.label }}
          </li>
        </ul>

        <form class="form" @submit.prevent="handleReset">
          <!-- New Password -->
          <div class="input-wrapper">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              placeholder="New password"
              class="input-field"
              autocomplete="new-password"
              required
            />
            <button type="button" class="input-icon icon-btn" @click="showNew = !showNew">
              <EyeIcon :open="showNew" />
            </button>
          </div>

          <!-- Confirm Password -->
          <div class="input-wrapper">
            <input
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Confirm password"
              class="input-field"
              autocomplete="new-password"
              required
            />
            <button type="button" class="input-icon icon-btn" @click="showConfirm = !showConfirm">
              <EyeIcon :open="showConfirm" />
            </button>
          </div>

          <!-- Match indicator -->
          <div v-if="newPassword && confirmPassword" class="match-indicator" :class="{ matched: passwordsMatch }">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</span>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>
          <div v-if="message" class="success-msg">{{ message }}</div>
          <button type="submit" class="submit-btn" :disabled="isResetting || !canReset">{{ isResetting ? 'RESETTING...' : 'RESET PASSWORD' }}</button>
          <RouterLink to="/" class="cancel-link">Cancel</RouterLink>
        </form>
      </template>

    </div>
  </div>
</template>

<script setup>
import { requestPasswordReset, resetPassword } from '@/auth.js'
import { computed, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

/* ── Eye icon ── */
const EyeIcon = defineComponent({
  props: ['open'],
  setup(props) {
    return () => {
      if (props.open) {
        return h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
          h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
          h('circle', { cx: 12, cy: 12, r: 3 })
        ])
      }
      return h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
        h('path', { d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' }),
        h('path', { d: 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' }),
        h('line', { x1: 1, y1: 1, x2: 23, y2: 23 })
      ])
    }
  }
})

const step = ref(1)
const email = ref('')
const error = ref('')
const message = ref('')
const isSending = ref(false)
const isResetting = ref(false)

/* ── PIN ── */
const pinDigits = reactive(['', '', '', '', '', ''])
const pinRefs = reactive([])
const otp = computed(() => pinDigits.join(''))

function onPinInput(i) {
  pinDigits[i] = pinDigits[i].replace(/\D/g, '').slice(0, 1)
  if (pinDigits[i] && i < 5) {
    nextTick(() => pinRefs[i + 1]?.focus())
  }
}
function onPinKeydown(i, e) {
  if (e.key === 'Backspace' && !pinDigits[i] && i > 0) {
    nextTick(() => pinRefs[i - 1]?.focus())
  }
}
function onPinPaste(e) {
  const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  text.split('').forEach((ch, i) => { pinDigits[i] = ch })
  nextTick(() => pinRefs[Math.min(text.length, 5)]?.focus())
}

const newPassword = ref('')
const confirmPassword = ref('')
const showNew = ref(false)
const showConfirm = ref(false)

const requirements = [
  { label: 'Has at least 8 characters', test: () => newPassword.value.length >= 8 },
  { label: 'Includes at least one uppercase letter', test: () => /[A-Z]/.test(newPassword.value) },
  { label: 'Includes at least one lowercase letter', test: () => /[a-z]/.test(newPassword.value) },
  { label: 'Includes at least one number', test: () => /[0-9]/.test(newPassword.value) },
  { label: 'Includes at least one special character', test: () => /[^A-Za-z0-9]/.test(newPassword.value) }
]

const passwordsMatch = computed(() => newPassword.value === confirmPassword.value && newPassword.value !== '')
const allRequirementsMet = computed(() => requirements.every(r => r.test()))
const canReset = computed(() => allRequirementsMet.value && passwordsMatch.value && otp.value.length === 6)
const router = useRouter()

async function goToStep2() {
  error.value = ''
  message.value = ''

  if (!email.value.trim()) {
    error.value = 'Please enter your registered email address.'
    return
  }

  isSending.value = true
  try {
    const response = await requestPasswordReset(email.value.trim())
    message.value = response.message
    step.value = 2
  } catch (err) {
    error.value = err.message || 'Unable to send OTP. Please try again.'
  } finally {
    isSending.value = false
  }
}

function goToStep3() {
  error.value = ''
  if (otp.value.length < 6) {
    error.value = 'Enter the full 6-digit code.'
    return
  }
  step.value = 3
}

async function handleReset() {
  error.value = ''
  message.value = ''

  if (!canReset.value) {
    error.value = 'Please complete the form and enter the 6-digit code.'
    return
  }

  isResetting.value = true
  try {
    const response = await resetPassword({
      email: email.value.trim(),
      otp: otp.value,
      newPassword: newPassword.value,
    })
    message.value = response.message || 'Password has been reset successfully.'
    setTimeout(() => router.push('/'), 800)
  } catch (err) {
    error.value = err.message || 'Unable to reset password. Please try again.'
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 110%, #e5e7eb 0%, #cbd5e1 30%, #9ca3af 55%, #6b7280 72%, #4b5563 100%);
  padding: 24px;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 44px 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.13);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

/* Icon */
.icon-wrap {
  width: 80px;
  height: 80px;
  border: 2.5px solid #4b5563;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

/* Titles */
.step-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111;
}
.step-desc {
  font-size: 0.88rem;
  color: #555;
  line-height: 1.55;
  max-width: 300px;
}

/* Form */
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

/* Input */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.input-field {
  width: 100%;
  padding: 13px 44px 13px 18px;
  border: 1.5px solid #d0d0d0;
  border-radius: 50px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  text-align: left;
}
.input-field::placeholder { color: #aaa; }
.input-field:focus { border-color: #9ca3af; }

.input-icon {
  position: absolute;
  right: 15px;
  display: flex;
  align-items: center;
  color: #888;
  pointer-events: none;
}

.error-msg {
  font-size: 0.86rem;
  color: #e63946;
  text-align: center;
  margin-top: -4px;
}
.success-msg {
  font-size: 0.86rem;
  color: #4f575f;
  text-align: center;
  margin-top: -4px;
}
.icon-btn {
  position: absolute;
  right: 13px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: #888;
  pointer-events: all;
  transition: color 0.2s;
}
.icon-btn:hover { color: #4b5563; }

/* Requirements */
.req-list {
  list-style: none;
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
}
.req-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #aaa;
  transition: color 0.2s;
}
.req-list li.met { color: #4b5563; }
.req-icon { display: flex; align-items: center; }
.req-list li:not(.met) .req-icon { color: #ccc; }
.req-list li.met .req-icon { color: #4b5563; }

/* Match indicator */
.match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #e63946;
  align-self: flex-start;
  margin-top: -4px;
}
.match-indicator.matched { color: #4b5563; }

/* Submit */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #4b5563;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.8px;
  transition: background 0.2s, transform 0.1s, opacity 0.2s;
}
.submit-btn:hover { background: #6b7280; }
.submit-btn:active { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Cancel */
.cancel-link {
  font-size: 0.92rem;
  font-weight: 600;
  color: #e63946;
  text-decoration: none;
  transition: opacity 0.2s;
  margin-top: -2px;
}
.cancel-link:hover { opacity: 0.75; }

/* PIN boxes */
.pin-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  width: 100%;
}
.pin-box {
  width: 48px;
  height: 56px;
  border: 1.5px solid #d0d0d0;
  border-radius: 12px;
  font-size: 1.4rem;
  font-weight: 700;
  font-family: inherit;
  color: #4b5563;
  text-align: center;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fff;
  caret-color: #4b5563;
}
.pin-box:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(83, 91, 100,0.15);
}

@media (max-width: 480px) {
  .card { padding: 36px 22px 32px; }
  .pin-box { width: 40px; height: 48px; font-size: 1.2rem; }
}
</style>
