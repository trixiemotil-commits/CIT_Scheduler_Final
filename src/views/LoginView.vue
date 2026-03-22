<template>
  <div class="page-bg">
    <!-- Hidden Admin Button -->
    <button class="hidden-admin-btn" @click="showAdminModal = true" title="Create Admin Account"></button>
    <div class="card" :class="{ 'card--wide': activeTab === 'signup' }">
      <!-- Title -->
      <h1 class="title">CIT Scheduler</h1>

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

        <div v-if="loginError" class="error-msg">{{ loginError }}</div>

        <button type="submit" class="submit-btn">Login</button>
      </form>

      <!-- ── Sign Up Form ── -->
      <form v-else class="form" @submit.prevent="handleSignUp">
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
          <input v-model="signUp.studentId" type="text" placeholder="Student ID" class="input-field" />
          <span class="input-icon"><IconId /></span>
        </div>

        <!-- Email -->
        <div class="input-wrapper">
          <input v-model="signUp.email" type="email" placeholder="Enter your email" class="input-field" autocomplete="email" />
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

        <div v-if="signUpSuccess" class="success-msg">{{ signUpSuccess }}</div>
        <div v-if="signUpError" class="error-msg">{{ signUpError }}</div>

        <button type="submit" class="submit-btn">Sign up</button>
      </form>
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
import { login, register } from '@/auth.js'
import { computed, defineComponent, h, reactive, ref } from 'vue'
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
const loginError = ref('')
const signUpError = ref('')
const signUpSuccess = ref('')
const router = useRouter()
const signIn = reactive({ email: '', password: '', remember: false, showPw: false })
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

async function handleLogin() {
  loginError.value = ''
  try {
    const role = await login(signIn.email, signIn.password)
    console.log('Login role:', role)
    // Fallback: if admin email, force admin dashboard
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else if (role === 'teacher') {
      router.push('/teacher/dashboard')
    } else if (role === 'student') {
      router.push('/student/dashboard')
    } else if (signIn.email === 'lorenzguangco04@gmail.com') {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
  } catch (error) {
    loginError.value = error.message || 'Invalid email or password.'
  }
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

  if (!STRONG_PASSWORD_REGEX.test(signUp.password)) {
    signUpError.value = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.'
    return
  }

  if (signUp.password !== signUp.confirmPassword) {
    signUpError.value = 'Passwords do not match.'
    return
  }

  try {
    await register({
      firstName,
      lastName,
      studentId,
      email,
      password: signUp.password,
      role: 'student'
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
  }
}
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 110%, #d8f3dc 0%, #74c69d 30%, #40916c 55%, #2d6a4f 72%, #1b4332 100%);
  padding: 24px;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 48px 52px 44px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.13);
  display: flex;
  flex-direction: column;
  gap: 22px;
  transition: max-width 0.25s;
}

.title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #1b4332;
  letter-spacing: -0.5px;
}

/* Tab */
.tab-toggle {
  display: flex;
  background: #fff;
  border: 1.5px solid #d0d0d0;
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
  color: #444;
  font-family: inherit;
}
.tab-btn.active { background: #1b4332; color: #fff; }
.tab-btn:not(.active):hover { background: #f0faf3; }

/* Form */
.form { display: flex; flex-direction: column; gap: 15px; }

/* Name row */
.name-row { display: flex; gap: 12px; }
.name-row .input-wrapper { flex: 1; }

/* Input */
.input-wrapper { position: relative; display: flex; align-items: center; }
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
}
.select-field {
  appearance: none;
  padding-right: 18px;
}
.input-field::placeholder { color: #aaa; }
.input-field:focus { border-color: #40916c; }

.input-icon {
  position: absolute;
  right: 15px;
  display: flex;
  align-items: center;
  color: #888;
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
  color: #888;
  pointer-events: all;
  transition: color 0.2s;
}
.icon-btn:hover { color: #1b4332; }

/* Rows */
.form-row { display: flex; align-items: center; justify-content: space-between; margin-top: -2px; }
.remember-label { display: flex; align-items: center; gap: 8px; font-size: 0.87rem; color: #444; cursor: pointer; user-select: none; }
.checkbox { width: 15px; height: 15px; accent-color: #1b4332; cursor: pointer; }
.row-end { display: flex; justify-content: flex-end; margin-top: -2px; }

/* Links */
.action-link {
  font-size: 0.87rem;
  color: #52b788;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.action-link:hover { color: #2d6a4f; text-decoration: underline; }
.plain-btn { background: none; border: none; font-family: inherit; cursor: pointer; padding: 0; }

/* Error */
.error-msg {
  font-size: 0.86rem;
  color: #e63946;
  text-align: center;
  margin-top: -4px;
}
.success-msg {
  font-size: 0.86rem;
  color: #1b7a4a;
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
  color: #166534;
}

.password-requirements li.pass::before {
  content: '✓';
  color: #16a34a;
}

/* Submit */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: background 0.2s, transform 0.1s;
  margin-top: 2px;
}
.submit-btn:hover { background: #2d6a4f; }
.submit-btn:active { transform: scale(0.98); }

@media (max-width: 520px) {
  .card { padding: 36px 22px 32px; }
  .title { font-size: 1.65rem; }
  .name-row { flex-direction: column; gap: 15px; }
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
  background: #fff;
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
