<template>
  <div class="page-bg">
    <!-- Hidden Admin Button -->
    <button class="hidden-admin-btn" @click="showAdminModal = true" title="Create Admin Account"></button>
    <div class="card" :class="{ 'card--wide': activeTab === 'signup' }">
      <!-- Brand -->
      <div class="login-brand">
        <div class="login-brand__seal-wrap">
          <img src="/branding/cit-college-seal.png" alt="PHINMA Araullo University College of Information Technology" class="login-brand__seal" />
        </div>
        <div class="login-brand__copy">
          <span>College of Information Technology</span>
          <h1 class="title">CIT Scheduler</h1>
        </div>
      </div>

      <!-- Tab Toggle -->
      <div class="tab-toggle">
        <button class="tab-btn" :class="{ active: activeTab === 'signin' }" @click="activeTab = 'signin'">Sign in</button>
        <button class="tab-btn" :class="{ active: activeTab === 'signup' }" @click="activeTab = 'signup'">Sign up</button>
      </div>

      <!-- ── Sign In Form ── -->
      <form v-if="activeTab === 'signin'" class="form" @submit.prevent="handleLogin">
        <div class="input-wrapper">
          <input v-model="signIn.email" type="email" placeholder="Enter your email" class="input-field" autocomplete="email" />
          <span class="input-icon"><IconEmail /></span>
        </div>

        <div class="input-wrapper">
          <input v-model="signIn.password" :type="signIn.showPw ? 'text' : 'password'" placeholder="Enter your password" class="input-field" autocomplete="current-password" />
          <button type="button" class="input-icon icon-btn" @click="signIn.showPw = !signIn.showPw"><IconEye :open="signIn.showPw" /></button>
        </div>

        <div class="form-row">
          <label class="remember-label">
            <input v-model="signIn.remember" type="checkbox" class="checkbox" />
            <span>Remember me</span>
          </label>
          <RouterLink to="/forgot-password" class="action-link">Forgot Password?</RouterLink>
        </div>

        <div v-if="isMobileApp" class="math-challenge">
          <div class="math-challenge__equation" role="group" aria-label="Math challenge">
            <span class="math-challenge__number">{{ loginMathChallenge.first }}</span>
            <span aria-hidden="true">+</span>
            <span class="math-challenge__number">{{ loginMathChallenge.second }}</span>
            <span aria-hidden="true">=</span>
            <input
              v-model="loginMathAnswer"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              class="math-challenge__answer"
              :class="{
                'math-challenge__answer--correct': mathAnswerState('login') === 'correct',
                'math-challenge__answer--incorrect': mathAnswerState('login') === 'incorrect'
              }"
              aria-label="Enter the answer"
              autocomplete="off"
              @input="sanitizeMathAnswer('login')"
            />
          </div>
          <p v-if="loginError" class="math-challenge__error" role="alert">{{ loginError }}</p>
        </div>

        <!-- reCAPTCHA widget -->
        <div v-if="siteKey" class="captcha-wrap">
          <div ref="signinCaptchaRef" class="captcha-box"></div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoggingIn">
          {{ isLoggingIn ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- ── Sign Up Form ── -->
      <form v-else class="form" @submit.prevent="handleSignUp">
        <div class="student-signup-note" role="note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>
          <span>Student registration only</span>
        </div>
        <!-- First / Last Name -->
        <div class="name-row">
          <div class="input-wrapper">
            <input v-model="signUp.firstName" type="text" placeholder="First Name" class="input-field" autocomplete="given-name" />
          </div>
          <div class="input-wrapper">
            <input v-model="signUp.lastName" type="text" placeholder="Last name" class="input-field" autocomplete="family-name" />
          </div>
        </div>

        <!-- Student ID -->
        <div class="input-wrapper">
          <input v-model="signUp.studentId" type="text" placeholder="00-0000-000000" class="input-field" autocomplete="off" @input="onStudentIdInput" />
          <span class="input-icon"><IconId /></span>
        </div>

        <!-- Email -->
        <div class="input-wrapper">
          <input v-model="signUp.email" type="email" placeholder="cit.scheduler.au@phinmaed.com" class="input-field" autocomplete="email" />
          <span class="input-icon"><IconEmail /></span>
        </div>

        <!-- New Password -->
        <div class="input-wrapper">
          <input v-model="signUp.password" :type="signUp.showPw ? 'text' : 'password'" placeholder="New password" class="input-field" autocomplete="new-password" />
          <button type="button" class="input-icon icon-btn" @click="signUp.showPw = !signUp.showPw"><IconEye :open="signUp.showPw" /></button>
        </div>

        <!-- Confirm Password -->
        <div class="input-wrapper">
          <input v-model="signUp.confirmPassword" :type="signUp.showConfirmPw ? 'text' : 'password'" placeholder="Confirm password" class="input-field" autocomplete="new-password" />
          <button type="button" class="input-icon icon-btn" @click="signUp.showConfirmPw = !signUp.showConfirmPw"><IconEye :open="signUp.showConfirmPw" /></button>
        </div>

        <ul class="password-requirements">
          <li :class="{ pass: signUpPasswordChecks.minLength }">Has at least 8 characters</li>
          <li :class="{ pass: signUpPasswordChecks.uppercase }">Includes at least one uppercase letter</li>
          <li :class="{ pass: signUpPasswordChecks.lowercase }">Includes at least one lowercase letter</li>
          <li :class="{ pass: signUpPasswordChecks.number }">Includes at least one number</li>
          <li :class="{ pass: signUpPasswordChecks.special }">Includes at least one special character</li>
        </ul>

        <div class="row-end">
          <button type="button" class="action-link plain-btn" @click="activeTab = 'signin'">Already have an account?</button>
        </div>

        <div v-if="isMobileApp" class="math-challenge">
          <div class="math-challenge__equation" role="group" aria-label="Math challenge">
            <span class="math-challenge__number">{{ signUpMathChallenge.first }}</span>
            <span aria-hidden="true">+</span>
            <span class="math-challenge__number">{{ signUpMathChallenge.second }}</span>
            <span aria-hidden="true">=</span>
            <input
              v-model="signUpMathAnswer"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              class="math-challenge__answer"
              :class="{
                'math-challenge__answer--correct': mathAnswerState('signup') === 'correct',
                'math-challenge__answer--incorrect': mathAnswerState('signup') === 'incorrect'
              }"
              aria-label="Enter the answer"
              autocomplete="off"
              @input="sanitizeMathAnswer('signup')"
            />
          </div>
        </div>

        <div v-if="signUpSuccess" class="success-msg">{{ signUpSuccess }}</div>
        <div v-if="signUpError" class="error-msg">{{ signUpError }}</div>

        <!-- sign up captcha -->
        <div v-if="siteKey" class="captcha-wrap" v-show="activeTab === 'signup'">
          <div ref="signupCaptchaRef" class="captcha-box"></div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isSigningUp">
          {{ isSigningUp ? 'Signing up...' : 'Sign up' }}
        </button>
      </form>
    </div>

    <!-- Login and reCAPTCHA alerts -->
    <div v-if="loginAlert" class="login-alert-overlay" role="presentation" @click.self="closeLoginAlert">
      <section class="login-alert" role="alertdialog" aria-modal="true" aria-labelledby="login-alert-title" aria-describedby="login-alert-message">
        <div class="login-alert__icon" :class="`login-alert__icon--${loginAlert.type}`" aria-hidden="true">
          <svg v-if="loginAlert.type === 'captcha'" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 8.5 6M12 7v6M12 17h.01"/><path d="m17 3 3.5.5L20 7"/></svg>
          <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>
        </div>
        <h2 id="login-alert-title">{{ loginAlert.title }}</h2>
        <p id="login-alert-message" :class="{ 'login-alert__message--error': loginAlert.type === 'credentials' }">{{ loginAlert.message }}</p>
        <div v-if="loginAlert.type === 'security'" class="security-login-actions">
          <button type="button" @click="closeLoginAlert">Continue</button>
          <button type="button" class="security-login-logout" @click="logoutCurrentLogin">Log out this device</button>
        </div>
        <button v-else type="button" @click="closeLoginAlert">{{ pendingLoginRoute ? 'Continue' : 'Try again' }}</button>
      </section>
    </div>

    <div v-if="twoFactorChallenge" class="role-modal-overlay" role="presentation">
      <section class="role-modal two-factor-modal" role="dialog" aria-modal="true" aria-labelledby="two-factor-title">
        <div class="two-factor-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
        </div>
        <h2 id="two-factor-title" class="role-modal__title">Check your email</h2>
        <p class="role-selection__intro">Enter the 6-digit code sent to {{ twoFactorChallenge.maskedEmail }}.</p>
        <div class="login-otp-boxes" role="group" aria-label="Six-digit login verification code">
          <input
            v-for="(_, index) in twoFactorDigits"
            :key="index"
            :ref="element => { if (element) twoFactorInputRefs[index] = element }"
            v-model="twoFactorDigits[index]"
            class="login-otp-digit"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="one-time-code"
            :aria-label="`Verification code digit ${index + 1}`"
            @input="updateTwoFactorDigit(index, $event)"
            @keydown.backspace="handleTwoFactorBackspace(index, $event)"
            @paste.prevent="handleTwoFactorPaste"
          />
        </div>
        <div v-if="loginError" class="error-msg role-modal__error">{{ loginError }}</div>
        <button type="button" class="submit-btn two-factor-modal__submit" :disabled="twoFactorCode.length !== 6" @click="confirmTwoFactor">Verify code</button>
        <button type="button" class="role-modal__cancel" @click="cancelTwoFactor">Use another account</button>
      </section>
    </div>

    <!-- Role choice for accounts that are both administrators and teachers -->
    <div
      v-if="showRoleSelection"
      class="role-modal-overlay"
      role="presentation"
      @click.self="cancelRoleSelection"
    >
      <section
        class="role-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
        aria-describedby="role-modal-description"
      >
        <img src="/branding/cit-college-seal.png" alt="" class="role-modal__seal" aria-hidden="true" />
        <h2 id="role-modal-title" class="role-modal__title">Choose your role</h2>
        <p id="role-modal-description" class="role-selection__intro">
          This account has more than one role. Select how you want to continue.
        </p>

        <div class="role-selection">
          <button
            v-for="role in availableRoles"
            :key="role"
            type="button"
            class="role-selection__button"
            :disabled="isSelectingRole"
            @click="chooseRole(role)"
          >
            <span class="role-selection__icon" :class="`role-selection__icon--${role}`" aria-hidden="true">
              <svg v-if="role === 'admin'" viewBox="0 0 24 24">
                <path d="M12 3 4.5 6v5.2c0 4.6 3.1 8.3 7.5 9.8 4.4-1.5 7.5-5.2 7.5-9.8V6L12 3Z" />
                <path d="m8.8 12 2 2 4.4-4.5" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <circle cx="9" cy="7" r="3.2" />
                <path d="M3.5 19c.4-3.7 2.2-5.5 5.5-5.5s5.1 1.8 5.5 5.5M15 5h5.5v9H15M17 9h1.5" />
              </svg>
            </span>
            <span class="role-selection__copy">
              <span class="role-selection__name">{{ roleLabel(role) }}</span>
            </span>
            <span class="role-selection__arrow" aria-hidden="true">&#8594;</span>
          </button>
        </div>

        <div v-if="loginError" class="error-msg role-modal__error">{{ loginError }}</div>
        <button type="button" class="role-modal__cancel" :disabled="isSelectingRole" @click="cancelRoleSelection">
          Use another account
        </button>
      </section>
    </div>

    <!-- Admin Modal -->
    <div v-if="showAdminModal" class="admin-modal-overlay" @click.self="showAdminModal = false">
      <div class="admin-modal">
        <h2>Create Admin Account</h2>
        <form @submit.prevent="handleAdminCreate">
          <div class="input-wrapper">
            <input v-model="adminForm.firstName" type="text" placeholder="First Name" class="input-field" />
          </div>
          <div class="input-wrapper">
            <input v-model="adminForm.lastName" type="text" placeholder="Last Name" class="input-field" />
          </div>
          <div class="input-wrapper">
            <input v-model="adminForm.studentId" type="text" placeholder="Admin ID" class="input-field" />
          </div>
          <div class="input-wrapper">
            <input v-model="adminForm.email" type="email" placeholder="Email" class="input-field" />
          </div>
          <div class="input-wrapper">
            <input v-model="adminForm.password" type="password" placeholder="Password" class="input-field" />
          </div>
          <div v-if="adminError" class="error-msg">{{ adminError }}</div>
          <button type="submit" class="submit-btn">Create Admin</button>
          <button type="button" class="plain-btn" @click="showAdminModal = false">Cancel</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { login, logout, register, selectRole, verifyLoginOtp } from '@/auth.js'
import { Capacitor } from '@capacitor/core'
import { computed, defineComponent, h, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

// Hidden admin modal state
const showAdminModal = ref(false)
const adminError = ref('')
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const adminForm = reactive({
  firstName: '',
  lastName: '',
  studentId: 'ADMIN-0001',
  email: '',
  password: ''
})

async function handleAdminCreate() {
  adminError.value = ''
  const firstName = adminForm.firstName.trim()
  const lastName = adminForm.lastName.trim()
  const studentId = adminForm.studentId.trim()
  const email = adminForm.email.trim().toLowerCase()

  if (!firstName || !lastName || !studentId || !email || !adminForm.password) {
    adminError.value = 'Please complete all fields.'
    return
  }
  if (!STRONG_PASSWORD_REGEX.test(adminForm.password)) {
    adminError.value = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.'
    return
  }
  try {
    // Call your backend endpoint for admin creation (you may need to implement this)
    await register({
      firstName,
      lastName,
      studentId,
      email,
      password: adminForm.password,
      role: 'admin' // Force role to admin
    })
    showAdminModal.value = false
    // Optionally, show a success message
  } catch (error) {
    adminError.value = error.message || 'Failed to create admin.'
  }
}

/* ── Inline SVG components ── */
const IconEmail = defineComponent({
  setup() {
    return () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }),
      h('path', { d: 'M2 8l10 6 10-6' })
    ])
  }
})

const IconId = defineComponent({
  setup() {
    return () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 2, y: 5, width: 20, height: 14, rx: 2 }),
      h('circle', { cx: 8, cy: 12, r: 2 }),
      h('path', { d: 'M13 10h4M13 14h4' })
    ])
  }
})

const IconEye = defineComponent({
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

const activeTab = ref('signin')
const isLoggingIn = ref(false)
const isSigningUp = ref(false)
const loginError = ref('')
const availableRoles = ref([])
const isSelectingRole = ref(false)
const showRoleSelection = ref(false)
const twoFactorChallenge = ref(null)
const twoFactorCode = ref('')
const twoFactorDigits = ref(['', '', '', '', '', ''])
const twoFactorInputRefs = []
const loginAlert = ref(null)
const pendingLoginRoute = ref('')
const pendingRoleSelection = ref(false)
const signUpError = ref('')
const signUpSuccess = ref('')
const router = useRouter()
const isMobileApp = Capacitor.isNativePlatform()
const siteKey = isMobileApp ? '' : (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '')
const signinCaptchaRef = ref(null)
const signupCaptchaRef = ref(null)
const signinWidgetId = ref(null)
const signupWidgetId = ref(null)
const loginMathAnswer = ref('')
const signUpMathAnswer = ref('')
const loginMathChallenge = ref({ first: 0, second: 0, question: '', answer: 0 })
const signUpMathChallenge = ref({ first: 0, second: 0, question: '', answer: 0 })
const REMEMBERED_LOGIN_EMAIL_KEY = 'cit_remembered_login_email'

function saveRememberedLogin(email, remember) {
  if (remember) {
    localStorage.setItem(REMEMBERED_LOGIN_EMAIL_KEY, String(email || '').trim().toLowerCase())
  } else {
    localStorage.removeItem(REMEMBERED_LOGIN_EMAIL_KEY)
  }
}

function resetTwoFactorDigits() {
  twoFactorDigits.value = ['', '', '', '', '', '']
  twoFactorCode.value = ''
}

function syncTwoFactorCode() {
  twoFactorCode.value = twoFactorDigits.value.join('')
}

function updateTwoFactorDigit(index, event) {
  const digit = String(event.target.value || '').replace(/\D/g, '').slice(-1)
  twoFactorDigits.value[index] = digit
  syncTwoFactorCode()
  if (digit && index < twoFactorDigits.value.length - 1) twoFactorInputRefs[index + 1]?.focus()
}

function handleTwoFactorBackspace(index, event) {
  if (!twoFactorDigits.value[index] && index > 0) {
    event.preventDefault()
    twoFactorDigits.value[index - 1] = ''
    syncTwoFactorCode()
    twoFactorInputRefs[index - 1]?.focus()
  }
}

function handleTwoFactorPaste(event) {
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  pasted.split('').forEach((digit, index) => { twoFactorDigits.value[index] = digit })
  syncTwoFactorCode()
  twoFactorInputRefs[Math.min(pasted.length, 5)]?.focus()
}

function renderRecaptcha(refEl, widgetRef) {
  if (!siteKey) return
  const el = refEl?.value
  if (!el) return
  try {
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      // Always (re)render into the provided container to ensure widget appears
      try {
        widgetRef.value = window.grecaptcha.render(el, { sitekey: siteKey })
      } catch (err) {
        // If render throws (rare), clear and retry shortly
        console.warn('grecaptcha.render failed, retrying', err)
        widgetRef.value = null
        setTimeout(() => renderRecaptcha(refEl, widgetRef), 300)
      }
    } else {
      // Retry shortly if grecaptcha not loaded yet
      setTimeout(() => renderRecaptcha(refEl, widgetRef), 300)
    }
  } catch (e) {
    console.error('renderRecaptcha error', e)
  }
}

function resetRecaptcha(widgetRef) {
  try {
    if (window.grecaptcha && widgetRef.value != null) {
      window.grecaptcha.reset(widgetRef.value)
    }
  } catch (e) {
    try { if (window.grecaptcha) window.grecaptcha.reset() } catch (_) {}
  }
}

function createMathChallenge() {
  const first = Math.floor(Math.random() * 90) + 10
  const second = Math.floor(Math.random() * 90) + 10
  return { first, second, question: `${first} + ${second} =`, answer: first + second }
}

function resetMathChallenges() {
  loginMathChallenge.value = createMathChallenge()
  signUpMathChallenge.value = createMathChallenge()
  loginMathAnswer.value = ''
  signUpMathAnswer.value = ''
}

function getMathAnswer(form) {
  const answer = (form === 'login' ? loginMathAnswer.value : signUpMathAnswer.value).trim()
  return answer ? Number(answer) : Number.NaN
}

function mathAnswerState(form) {
  const answer = getMathAnswer(form)
  if (Number.isNaN(answer)) return ''

  const challenge = form === 'login' ? loginMathChallenge.value : signUpMathChallenge.value
  return answer === challenge.answer ? 'correct' : 'incorrect'
}

function sanitizeMathAnswer(form) {
  if (form === 'login') {
    loginMathAnswer.value = loginMathAnswer.value.replace(/\D/g, '').slice(0, 3)
    loginError.value = ''
  } else {
    signUpMathAnswer.value = signUpMathAnswer.value.replace(/\D/g, '').slice(0, 3)
    signUpError.value = ''
  }
}
const rememberedLoginEmail = localStorage.getItem(REMEMBERED_LOGIN_EMAIL_KEY) || ''
const signIn = reactive({ email: rememberedLoginEmail, password: '', remember: Boolean(rememberedLoginEmail), showPw: false })
const signUp = reactive({ firstName: '', lastName: '', studentId: '', email: '', password: '', confirmPassword: '', showPw: false, showConfirmPw: false })

const signUpPasswordChecks = computed(() => {
  const password = String(signUp.password || '')
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z\d]/.test(password),
  }
})

function routeByRole(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}

function showLoginAlert(type, title, message) {
  loginAlert.value = { type, title, message }
}

function closeLoginAlert() {
  loginAlert.value = null
  if (pendingRoleSelection.value) {
    pendingRoleSelection.value = false
    availableRoles.value = ['admin', 'teacher']
    showRoleSelection.value = true
    return
  }
  if (pendingLoginRoute.value) {
    const destination = pendingLoginRoute.value
    pendingLoginRoute.value = ''
    router.push(destination)
  }
}

function logoutCurrentLogin() {
  logout()
  loginAlert.value = null
  pendingLoginRoute.value = ''
  pendingRoleSelection.value = false
  showRoleSelection.value = false
  availableRoles.value = []
  signIn.password = ''
}

function continueAfterLogin(user) {
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean)
  const normalizedRoles = roles.map(role => String(role).toLowerCase())
  if (normalizedRoles.includes('admin') && normalizedRoles.includes('teacher')) {
    availableRoles.value = ['admin', 'teacher']
    showRoleSelection.value = true
    return
  }
  const destination = routeByRole(user.role)
  pendingLoginRoute.value = destination
  router.push(destination)
}

async function handleLogin() {
  if (isLoggingIn.value) return
  isLoggingIn.value = true
  loginError.value = ''
  try {
    if (isMobileApp && getMathAnswer('login') !== loginMathChallenge.value.answer) {
      loginError.value = 'Please enter the correct answer.'
      return
    }

    // Ensure reCAPTCHA response is present before sending credentials
    let recaptchaToken = null
    try {
      if (window.grecaptcha && signinWidgetId.value != null) {
        recaptchaToken = window.grecaptcha.getResponse(signinWidgetId.value)
      } else if (window.grecaptcha) {
        recaptchaToken = window.grecaptcha.getResponse()
      }
    } catch (e) {
      // ignore
    }

    if (!isMobileApp && !recaptchaToken) {
      showLoginAlert('captcha', 'Verification required', 'Please complete the “I’m not a robot” check before signing in.')
      return
    }

    const payload = await login(
      signIn.email,
      signIn.password,
      isMobileApp ? null : recaptchaToken,
      isMobileApp ? { question: loginMathChallenge.value.question.replace(' =', ''), answer: getMathAnswer('login') } : null,
      signIn.remember
    )
    saveRememberedLogin(signIn.email, signIn.remember)
    if (payload?.requiresTwoFactor) {
      twoFactorChallenge.value = payload
      resetTwoFactorDigits()
      return
    }
    const user = payload?.user
    if (payload?.loginWarning) {
      showLoginAlert('security', 'Security notice', 'This account was recently used to sign in on another device. If this was not you, change your password immediately.')
      const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean)
      const normalizedRoles = roles.map(role => String(role).toLowerCase())
      if (normalizedRoles.includes('admin') && normalizedRoles.includes('teacher')) {
        pendingRoleSelection.value = true
      } else {
        pendingLoginRoute.value = routeByRole(user.role)
      }
      return
    }
    continueAfterLogin(user)
  } catch (error) {
    loginError.value = error.message || 'Invalid email or password.'
    if (isMobileApp) {
      resetMathChallenges()
      return
    }
    const isCaptchaError = /recaptcha|captcha|verification/i.test(loginError.value)
    showLoginAlert(
      isCaptchaError ? 'captcha' : 'credentials',
      isCaptchaError ? 'Verification unsuccessful' : 'Unable to sign in',
      isCaptchaError ? 'The reCAPTCHA check expired or could not be verified. Please complete it again.' : loginError.value
    )
    try { resetRecaptcha(signinWidgetId) } catch (_) {}
    if (isMobileApp) resetMathChallenges()
  } finally {
    isLoggingIn.value = false
  }
}

async function confirmTwoFactor() {
  loginError.value = ''
  try {
    const payload = await verifyLoginOtp(twoFactorChallenge.value.challengeToken, twoFactorCode.value, signIn.remember)
    twoFactorChallenge.value = null
    if (payload?.loginWarning) {
      const roles = Array.isArray(payload.user?.roles) && payload.user.roles.length ? payload.user.roles : [payload.user?.role].filter(Boolean)
      const normalizedRoles = roles.map(role => String(role).toLowerCase())
      if (normalizedRoles.includes('admin') && normalizedRoles.includes('teacher')) {
        pendingRoleSelection.value = true
      } else {
        pendingLoginRoute.value = routeByRole(payload.user.role)
      }
      showLoginAlert('security', 'Security notice', 'This account was recently used to sign in on another device. If this was not you, change your password immediately.')
      return
    }
    const roles = Array.isArray(payload.user?.roles) && payload.user.roles.length ? payload.user.roles : [payload.user?.role].filter(Boolean)
    const normalizedRoles = roles.map(role => String(role).toLowerCase())
    if (normalizedRoles.includes('admin') && normalizedRoles.includes('teacher')) {
      availableRoles.value = ['admin', 'teacher']
      showRoleSelection.value = true
      return
    }
    continueAfterLogin(payload.user)
  } catch (error) {
    loginError.value = error.message || 'Unable to verify the code.'
  }
}

function cancelTwoFactor() {
  twoFactorChallenge.value = null
  resetTwoFactorDigits()
  signIn.password = ''
}

function roleLabel(role) {
  return role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'
}

async function chooseRole(role) {
  loginError.value = ''
  isSelectingRole.value = true
  try {
    await selectRole(role)
    router.push(routeByRole(role))
  } catch (error) {
    loginError.value = error.message || 'Unable to select this role.'
  } finally {
    isSelectingRole.value = false
  }
}

function cancelRoleSelection() {
  logout()
  availableRoles.value = []
  showRoleSelection.value = false
  activeTab.value = 'signin'
  signIn.password = ''
  resetRecaptcha(signinWidgetId)
}

async function handleSignUp() {
  signUpError.value = ''
  signUpSuccess.value = ''

  const firstName = signUp.firstName.trim()
  const lastName = signUp.lastName.trim()
  const studentId = signUp.studentId.trim()
  const email = signUp.email.trim().toLowerCase()

  if (!firstName || !lastName || !studentId || !email || !signUp.password) {
    signUpError.value = 'Please complete all required fields.'
    return
  }

  if (!/^[0-9]{2}-[0-9]{4}-[0-9]{6}$/.test(studentId)) {
    signUpError.value = 'Student ID must use the format 00-0000-000000 and only include numbers and dashes.'
    return
  }

  if (!email.endsWith('@phinmaed.com')) {
    signUpError.value = 'Sign up is only allowed with a @phinmaed.com email address.'
    return
  }

  if (!STRONG_PASSWORD_REGEX.test(signUp.password)) {
    signUpError.value = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.'
    return
  }

  if (signUp.password !== signUp.confirmPassword) {
    signUpError.value = 'Passwords do not match.'
    return
  }

  if (isMobileApp && getMathAnswer('signup') !== signUpMathChallenge.value.answer) {
    signUpError.value = 'Please enter the correct math answer.'
    return
  }

  if (isSigningUp.value) return
  isSigningUp.value = true
  try {
    // Obtain reCAPTCHA only for the web client.
    let recaptchaToken = null
    try {
      if (window.grecaptcha && signupWidgetId.value != null) {
        recaptchaToken = window.grecaptcha.getResponse(signupWidgetId.value)
      } else if (window.grecaptcha) {
        recaptchaToken = window.grecaptcha.getResponse()
      }
    } catch (e) { /* ignore */ }

    if (!isMobileApp && !recaptchaToken) {
      signUpError.value = 'Please complete the reCAPTCHA verification.'
      return
    }

    await register({
      firstName,
      lastName,
      studentId,
      email,
      password: signUp.password,
      role: 'student',
      ...(isMobileApp
        ? { client: 'mobile', mathChallenge: signUpMathChallenge.value.question.replace(' =', ''), mathAnswer: getMathAnswer('signup') }
        : { recaptchaToken })
    })
    signUpSuccess.value = 'Account created successfully. Your account is pending admin approval.'
    signUp.password = ''
    signUp.confirmPassword = ''
    signIn.email = email
    activeTab.value = 'signin'
  } catch (error) {
    // Show as much detail as possible for debugging
    if (error && error.message) {
      signUpError.value = error.message
    } else if (error && error.response && error.response.data && error.response.data.error) {
      signUpError.value = error.response.data.error
    } else {
      signUpError.value = 'Sign up failed. ' + JSON.stringify(error)
    }
  } finally {
    isSigningUp.value = false
  }
}

function onStudentIdInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 12)
  const formatted = digits
    .replace(/^(\d{2})(\d)/, '$1-$2')
    .replace(/^(\d{2}-\d{4})(\d)/, '$1-$2')
  signUp.studentId = formatted
}

onMounted(() => {
  if (isMobileApp) resetMathChallenges()
})

// Render captcha widgets when component mounts and when activeTab changes
onMounted(() => {
  // render whichever tab is visible on load
  nextTick(() => {
    if (siteKey) renderRecaptcha(signinCaptchaRef, signinWidgetId)
    if (siteKey && activeTab.value === 'signup') renderRecaptcha(signupCaptchaRef, signupWidgetId)
  })
})

watch(activeTab, (val) => {
  // when switching tabs, ensure the correct widget is rendered
  nextTick(() => {
    if (val === 'signin') {
      // force re-render of signin widget into its (new) container
      signinWidgetId.value = null
      renderRecaptcha(signinCaptchaRef, signinWidgetId)
      // reset signup widget if present
      try { resetRecaptcha(signupWidgetId) } catch (_) {}
    } else if (val === 'signup') {
      signupWidgetId.value = null
      renderRecaptcha(signupCaptchaRef, signupWidgetId)
      try { resetRecaptcha(signinWidgetId) } catch (_) {}
    }
  })
})
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #edf1f3;
  padding: clamp(16px, 4vw, 32px);
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
}

.card {
  background: linear-gradient(145deg, #f8fafc 0%, #e8ecef 100%);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 24px;
  padding: 32px 40px 28px;
  width: min(92vw, 500px);
  max-width: 460px;
  margin: auto;
  box-shadow: 0 14px 40px rgba(24, 30, 36, 0.22);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: max-width 0.25s, width 0.25s;
}

.card.card--wide {
  width: min(92vw, 560px);
  max-width: 540px;
}

.title {
  margin: 0;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #39424b;
  letter-spacing: -0.5px;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: -8px 0 3px;
}

.login-brand__seal-wrap {
  position: relative;
  display: grid;
  width: 82px;
  height: 82px;
  flex: 0 0 82px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .92);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, #fff 0%, #e6e9eb 48%, #aeb5ba 100%);
  box-shadow: 0 9px 22px rgba(31, 38, 44, .2), inset 0 1px rgba(255, 255, 255, .95);
}

.login-brand__seal-wrap::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(58, 66, 73, .16);
  border-radius: 50%;
  pointer-events: none;
}

.login-brand__seal {
  position: relative;
  z-index: 1;
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 4px 5px rgba(0, 0, 0, .22));
}

.login-brand__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.login-brand__copy > span {
  margin-bottom: 3px;
  color: #6d7680;
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.login-brand__copy .title { text-align: left; }

/* Tab */
.tab-toggle {
  display: flex;
  background: #eef1f4;
  border: 1.5px solid #d4d9e0;
  border-radius: 50px;
  padding: 4px;
  gap: 4px;
}
.tab-btn {
  flex: 1;
  padding: 9px 0;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.22s, color 0.22s;
  background: transparent;
  color: #4b5563;
  font-family: inherit;
}
.tab-btn.active {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #2f3742 100%);
  color: #fff;
}
.tab-btn:not(.active):hover { background: #f7f9fb; }

/* Form */
.form { display: flex; flex-direction: column; gap: 10px; }
.math-challenge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 14px;
  border: 1px solid #c8ced6;
  border-radius: 14px;
  background: linear-gradient(145deg, #f2f5f7, #e5e9ec);
  box-shadow: inset 0 1px rgba(255, 255, 255, .9);
}
.math-challenge__title {
  margin: 0;
  color: #46515a;
  font-size: .78rem;
  font-weight: 700;
}
.math-challenge__equation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 2vw, 8px);
  color: #4b5563;
  font-size: .9rem;
  font-weight: 600;
}
.math-challenge__number {
  display: grid;
  flex: 0 0 38px;
  place-items: center;
  height: 38px;
  border: 1px solid #c4ccd2;
  border-radius: 9px;
  background: #fff;
  color: #35414a;
  font-size: .95rem;
  font-weight: 700;
  box-shadow: inset 0 1px rgba(255, 255, 255, .9);
}
.math-challenge__answer {
  box-sizing: border-box;
  flex: 0 0 48px;
  width: 48px;
  height: 38px;
  padding: 0;
  border: 1px solid #b9c3ca;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #35414a;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  box-shadow: inset 0 1px 2px rgba(42, 52, 58, .07);
}
.math-challenge__answer:focus {
  border-color: #687780;
  box-shadow: 0 0 0 3px rgba(90, 105, 114, .14);
}
.math-challenge__answer--correct,
.math-challenge__answer--correct:focus {
  border-color: #2f9e68;
  background: #effaf3;
  box-shadow: 0 0 0 3px rgba(47, 158, 104, .16);
}
.math-challenge__answer--incorrect,
.math-challenge__answer--incorrect:focus {
  border-color: #c84b55;
  background: #fff1f2;
  box-shadow: 0 0 0 3px rgba(200, 75, 85, .16);
}
.math-challenge__error {
  margin: 0;
  color: #a33c45;
  font-size: .78rem;
  line-height: 1.35;
}

/* Name row */
.name-row { display: flex; gap: 12px; }
.name-row .input-wrapper { flex: 1; }

/* Input */
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-field {
  width: 100%;
  padding: 13px 44px 13px 18px;
  border: 1.5px solid #c8ced6;
  border-radius: 50px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #333;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f8fafc;
}
.select-field {
  appearance: none;
  padding-right: 18px;
}
.input-field::placeholder { color: #94a3b8; }
.input-field:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.15);
}

.input-icon {
  position: absolute;
  right: 15px;
  display: flex;
  align-items: center;
  color: #6b7280;
  pointer-events: none;
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
  color: #6b7280;
  pointer-events: all;
  transition: color 0.2s;
}
.icon-btn:hover { color: #374151; }

/* Rows */
.form-row { display: flex; align-items: center; justify-content: space-between; margin-top: -2px; }
.remember-label { display: flex; align-items: center; gap: 8px; font-size: 0.87rem; color: #4b5563; cursor: pointer; user-select: none; }
.checkbox { width: 15px; height: 15px; accent-color: #4b5563; cursor: pointer; }
.row-end { display: flex; justify-content: flex-end; margin-top: -2px; }

.captcha-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 2px 0;
}

.captcha-box {
  display: inline-flex;
  justify-content: center;
  width: 100%;
  max-width: 320px;
}

.captcha-box > div {
  width: 100% !important;
}

/* Links */
.action-link {
  font-size: 0.87rem;
  color: #5b6470;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.action-link:hover { color: #2f3742; text-decoration: underline; }
.plain-btn { background: none; border: none; font-family: inherit; cursor: pointer; padding: 0; }

/* Error */
.error-msg {
  font-size: 0.86rem;
  color: #b91c1c;
  text-align: center;
  margin-top: -4px;
}
.success-msg {
  font-size: 0.86rem;
  color: #4b5563;
  text-align: center;
  margin-top: -4px;
}

.password-requirements {
  list-style: none;
  padding: 0;
  margin: -2px 2px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.password-requirements li {
  font-size: 0.82rem;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-requirements li::before {
  content: '○';
  color: #9ca3af;
  line-height: 1;
}

.password-requirements li.pass {
  color: #374151;
}

.password-requirements li.pass::before {
  content: '✓';
  color: #4b5563;
}

/* Submit */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #2f3742 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  margin-top: 2px;
  box-shadow: 0 8px 16px rgba(47, 55, 66, 0.18);
}
.submit-btn:hover {
  background: linear-gradient(135deg, #7c8796 0%, #5b6470 50%, #374151 100%);
}
.submit-btn:active { transform: scale(0.98); }

.login-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(7, 12, 16, .66);
  backdrop-filter: blur(5px);
  animation: role-overlay-in 160ms ease-out;
}
.login-alert {
  width: min(100%, 350px);
  padding: 25px 24px 22px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 20px;
  background: linear-gradient(145deg, #fafbfc, #e6eaed);
  box-shadow: 0 24px 65px rgba(0,0,0,.38);
  animation: role-modal-in 190ms ease-out;
}
.login-alert__icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 0 auto 13px;
  place-items: center;
  color: #fff;
  border: 1px solid rgba(255,255,255,.45);
  border-radius: 14px;
  background: linear-gradient(145deg, #65727e, #36414b);
  box-shadow: 0 7px 17px rgba(42, 54, 64, .22), inset 0 1px rgba(255,255,255,.2);
}
.login-alert__icon--captcha { background: linear-gradient(145deg, #657887, #3b4e5b); box-shadow: 0 7px 17px rgba(48, 67, 79, .22), inset 0 1px rgba(255,255,255,.2); }
.login-alert__icon svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.login-alert h2 { margin: 0; color: #252d35; font-size: 1.3rem; font-weight: 750; letter-spacing: -.02em; }
.login-alert p { margin: 8px auto 19px; color: #687580; font-size: .82rem; line-height: 1.5; }
.login-alert .login-alert__message--error { color: #a52d2d; font-size: .9rem; font-weight: 700; }
.login-alert > button {
  width: 100%;
  min-height: 42px;
  color: #fff;
  border: 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #596570, #303944);
  box-shadow: 0 7px 15px rgba(43, 52, 61, .18);
  font-family: inherit;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
}
.login-alert > button:hover { background: linear-gradient(135deg, #687581, #394550); }
.login-alert > button:focus-visible { outline: 3px solid rgba(76, 91, 103, .3); outline-offset: 2px; }
.security-login-actions {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 9px;
}
.security-login-actions button {
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #3f4b54;
  border-radius: 11px;
  background: linear-gradient(135deg, #596570, #303944);
  color: #fff;
  font-family: inherit;
  font-size: .76rem;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 7px 15px rgba(43, 52, 61, .18);
  transition: background .16s ease, transform .1s ease, box-shadow .16s ease;
}
.security-login-actions button:hover { background: linear-gradient(135deg, #687581, #394550); }
.security-login-actions button:active { transform: scale(.98); }
.security-login-actions button:focus-visible { outline: 3px solid rgba(76, 91, 103, .3); outline-offset: 2px; }
.security-login-actions .security-login-logout {
  border-color: #b64f59;
  background: linear-gradient(135deg, #c96b73, #a33f4a);
}
.security-login-actions .security-login-logout:hover { background: linear-gradient(135deg, #d37a82, #b44b57); }

@media (max-width: 380px) {
  .security-login-actions { grid-template-columns: 1fr; }
}

.role-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(7, 12, 16, 0.7);
  backdrop-filter: blur(5px);
  animation: role-overlay-in 180ms ease-out;
}
.role-modal {
  width: min(100%, 400px);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  background: linear-gradient(145deg, #f8fafc 0%, #e5e9ec 100%);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.38);
  animation: role-modal-in 220ms ease-out;
}
.role-modal__seal {
  display: block;
  width: 58px;
  height: 58px;
  margin: -2px auto 10px;
  object-fit: contain;
  filter: drop-shadow(0 5px 7px rgba(28, 34, 39, .24));
}
.role-modal__title {
  margin: 0 0 5px;
  text-align: center;
  color: #252c34;
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}
.role-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 17px;
}
.role-selection__intro { margin: 0; color: #667085; line-height: 1.5; text-align: center; }
.role-selection__button {
  width: 100%; text-align: left; border: 1px solid #d5dbe0; border-radius: 16px;
  min-height: 64px; background: rgba(255, 255, 255, 0.82); padding: 11px 13px; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 14px; transition: border-color .15s, background .15s, transform .15s, box-shadow .15s;
}
.role-selection__button:hover:not(:disabled) { background: #fff; border-color: #7b8794; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(47, 55, 66, 0.1); }
.role-selection__button:focus-visible { outline: 3px solid rgba(75, 85, 99, 0.28); outline-offset: 2px; }
.role-selection__button:disabled { opacity: .65; cursor: wait; }
.role-selection__icon { flex: 0 0 40px; display: grid; place-items: center; height: 40px; border: 1px solid rgba(255,255,255,.52); border-radius: 11px; color: #fff; background: linear-gradient(145deg, #66717c, #343d47); box-shadow: 0 5px 12px rgba(39, 47, 54, .18), inset 0 1px rgba(255,255,255,.22); }
.role-selection__icon--admin { background: linear-gradient(145deg, #435867, #263844); }
.role-selection__icon--teacher { background: linear-gradient(145deg, #66717c, #3f4953); }
.role-selection__icon svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.role-selection__copy { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 4px; }
.role-selection__name { color: #252c34; font-weight: 700; font-size: .95rem; }
.role-selection__arrow { color: #7b8794; font-size: 1.25rem; transition: transform .15s; }
.role-selection__button:hover:not(:disabled) .role-selection__arrow { transform: translateX(3px); }
.role-modal__error { margin-top: 14px; }
.role-modal__cancel {
  display: block;
  margin: 16px auto 0;
  padding: 6px 10px;
  border: 0;
  color: #5b6470;
  background: transparent;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.role-modal__cancel:hover:not(:disabled) { color: #252c34; text-decoration: underline; }
.role-modal__cancel:disabled { opacity: .6; cursor: wait; }
.two-factor-modal {
  width: min(100%, 390px);
  padding: 28px 26px 22px;
  border-color: rgba(255,255,255,.78);
  background: linear-gradient(145deg, #fbfcfc 0%, #e3e8eb 100%);
  box-shadow: 0 26px 70px rgba(15, 22, 28, .34), inset 0 1px rgba(255,255,255,.95);
}
.two-factor-modal__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  border: 1px solid #aab7be;
  border-radius: 16px;
  color: #4b5962;
  background: linear-gradient(145deg, #f9fafb, #d8dfe3);
  box-shadow: inset 0 1px #fff, 0 7px 15px rgba(48,58,66,.16);
}
.two-factor-modal__icon svg { width: 29px; height: 29px; }
.two-factor-modal .role-modal__title { margin-bottom: 6px; }
.two-factor-modal .role-selection__intro { max-width: 290px; margin-inline: auto; font-size: .82rem; }
.login-otp-boxes {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
  margin: 18px 0 12px;
}
.login-otp-digit {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  border: 1px solid #aab7be;
  border-radius: 11px;
  background: rgba(255,255,255,.9);
  color: #35434b;
  font-family: inherit;
  font-size: 1.15rem;
  font-weight: 800;
  text-align: center;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(42,52,58,.08), 0 1px rgba(255,255,255,.8);
  transition: border-color .18s, box-shadow .18s, background .18s;
}
.login-otp-digit:focus {
  border-color: #687780;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(90,105,114,.14), inset 0 1px 2px rgba(42,52,58,.06);
}
.two-factor-modal__submit {
  width: 100%;
  min-height: 44px;
  margin-top: 2px;
  background: linear-gradient(145deg, #687780, #3f4c55);
  box-shadow: inset 0 1px rgba(255,255,255,.2), 0 6px 14px rgba(48,53,58,.2);
}
.two-factor-modal__submit:hover:not(:disabled) { background: linear-gradient(145deg, #78868e, #4a5861); }
.two-factor-modal__submit:disabled { opacity: .5; cursor: not-allowed; }
.student-signup-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #cbd5da;
  border-radius: 10px;
  background: linear-gradient(145deg, #f5f7f8, #e3e8ea);
  color: #5f6d76;
  font-size: .75rem;
  font-weight: 700;
  box-shadow: inset 0 1px rgba(255,255,255,.85);
}
.student-signup-note svg { flex: 0 0 auto; color: #687780; }
/* Compact student registration layout */
.card.card--wide {
  max-width: 500px;
  padding: 26px 32px 22px;
  gap: 12px;
}
.card.card--wide .login-brand { gap: 12px; margin-bottom: 0; }
.card.card--wide .login-brand__seal-wrap { width: 74px; height: 74px; flex-basis: 74px; }
.card.card--wide .login-brand__seal { width: 65px; height: 65px; }
.card.card--wide .title { font-size: 1.8rem; }
.card.card--wide .tab-btn { padding: 8px 0; }
.card.card--wide .form { gap: 8px; }
.card.card--wide .input-field { padding-top: 11px; padding-bottom: 11px; }
.card.card--wide .student-signup-note { padding: 8px 10px; font-size: .7rem; }
.card.card--wide .password-requirements { gap: 4px; margin-top: -1px; }
.card.card--wide .password-requirements li { font-size: .74rem; }
.card.card--wide .row-end { margin-top: -1px; }
.card.card--wide .captcha-wrap { margin: 0; }
.card.card--wide .submit-btn { padding: 12px; margin-top: 0; }
@keyframes role-overlay-in { from { opacity: 0; } }
@keyframes role-modal-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }

@media (max-width: 980px) {
  .page-bg { padding: clamp(12px, 2vw, 18px); }
  .card {
    width: min(76vw, 430px);
    max-width: 430px;
    padding: 22px 18px 18px;
  }
  .card.card--wide {
    width: min(82vw, 470px);
    max-width: 470px;
    padding: 20px 16px 16px;
  }
  .title { font-size: 1.7rem; }
  .login-brand__seal-wrap { width: 70px; height: 70px; flex-basis: 70px; }
  .login-brand__seal { width: 62px; height: 62px; }
  .login-brand__copy > span { font-size: .56rem; }
  .input-field {
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: .8rem;
  }
  .password-requirements li { font-size: .68rem; }
  .student-signup-note { font-size: .68rem; }
  .submit-btn { font-size: .88rem; }
}

@media (max-width: 520px) {
  .page-bg {
    align-items: center;
    justify-content: center;
    padding: 12px 10px;
  }
  .card {
    width: min(82vw, 360px);
    max-width: 360px;
    padding: 16px 12px 14px;
    margin: auto;
    gap: 10px;
  }
  .card.card--wide {
    width: min(86vw, 380px);
    max-width: 380px;
    padding: 14px 10px 12px;
  }
  .title { font-size: 1.32rem; }
  .login-brand { gap: 8px; margin: -2px 0 0; }
  .login-brand__seal-wrap { width: 50px; height: 50px; flex-basis: 50px; }
  .login-brand__seal { width: 42px; height: 42px; }
  .login-brand__copy > span { max-width: 170px; font-size: .46rem; }
  .tab-btn { font-size: .72rem; }
  .form { gap: 7px; }
  .name-row { flex-direction: column; gap: 7px; }
  .input-field {
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 0.74rem;
  }
  .password-requirements {
    gap: 3px;
    margin: -1px 0 0;
  }
  .password-requirements li { font-size: .58rem; }
  .student-signup-note {
    padding: 6px 8px;
    font-size: .58rem;
  }
  .submit-btn {
    padding: 9px 10px;
    font-size: .78rem;
  }
  .remember-label, .action-link { font-size: .64rem; }
  .role-modal-overlay { padding: 16px; }
  .role-modal { padding: 24px 18px; border-radius: 20px; }
  .role-modal__title { font-size: 1.2rem; }
  .role-selection__button { padding: 14px 12px; gap: 11px; }
  .role-selection__description { line-height: 1.35; }
}

@media (max-width: 360px) {
  .page-bg {
    padding: 8px 4px;
  }
  .card {
    width: min(86vw, 290px);
    padding: 10px 7px 8px;
    border-radius: 12px;
    gap: 6px;
  }
  .card.card--wide {
    width: min(90vw, 310px);
    padding: 10px 7px 8px;
  }
  .login-brand {
    gap: 5px;
    align-items: center;
    margin: 0;
  }
  .login-brand__seal-wrap { width: 34px; height: 34px; flex-basis: 34px; }
  .login-brand__seal { width: 28px; height: 28px; }
  .login-brand__copy { align-items: center; }
  .login-brand__copy .title { font-size: .82rem; }
  .login-brand__copy > span { max-width: 120px; font-size: .32rem; letter-spacing: .08em; }
  .tab-btn { font-size: .6rem; padding: 5px 0; }
  .form-row { align-items: flex-start; gap: 8px; }
  .remember-label, .action-link { font-size: .56rem; }
  .input-field {
    padding: 6px 26px 6px 8px;
    font-size: .58rem;
  }
  .password-requirements {
    gap: 2px;
    margin: 0 0 1px;
  }
  .password-requirements li { font-size: .46rem; }
  .student-signup-note {
    padding: 5px 6px;
    font-size: .46rem;
  }
  .submit-btn {
    padding: 7px 8px;
    font-size: .64rem;
  }
  .captcha-box { max-width: 180px; }
}

@media (max-width: 300px) {
  .page-bg { padding: 7px 3px; }
  .card,
  .card.card--wide {
    width: min(100%, 235px);
    padding-left: 7px;
    padding-right: 7px;
  }
  .login-brand__copy .title { font-size: .84rem; }
  .login-brand__copy > span { font-size: .34rem; }
  .input-field { font-size: .58rem; }
  .student-signup-note { font-size: .46rem; }
  .password-requirements li { font-size: .48rem; }
  .submit-btn { font-size: .66rem; }
  .remember-label, .action-link { font-size: .56rem; }
}

@media (prefers-reduced-motion: reduce) {
  .role-modal-overlay,
  .role-modal { animation: none; }
}
/* Hidden Admin Button Styles */
.hidden-admin-btn {
  position: absolute;
  top: 18px;
  right: 24px;
  width: 32px;
  height: 32px;
  opacity: 0;
  z-index: 10;
  cursor: pointer;
  border: none;
  background: none;
}
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.admin-modal {
  background: linear-gradient(145deg, #f8fafc 0%, #e8ecef 100%);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 16px;
  padding: 32px 28px 24px;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

</style>
