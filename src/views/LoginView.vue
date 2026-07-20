<template>
  <div class="page-bg">
    <canvas ref="tronCanvas" class="tron-canvas" aria-hidden="true"></canvas>
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

        <!-- reCAPTCHA widget -->
        <div v-if="siteKey" class="captcha-wrap">
          <div ref="signinCaptchaRef" class="captcha-box"></div>
        </div>

        <button type="submit" class="submit-btn">Login</button>
      </form>

      <div v-else-if="activeTab === 'role-select'" class="form role-selection">
        <p class="role-selection__intro">This account has more than one role. Choose how you would like to continue.</p>
        <button
          v-for="role in availableRoles"
          :key="role"
          type="button"
          class="role-selection__button"
          :disabled="isSelectingRole"
          @click="chooseRole(role)"
        >
          <span class="role-selection__name">Continue as {{ roleLabel(role) }}</span>
          <span class="role-selection__description">{{ role === 'admin' ? 'Manage users, schedules, and system settings.' : 'View your teaching schedule and consultations.' }}</span>
        </button>
        <div v-if="loginError" class="error-msg">{{ loginError }}</div>
        <button type="button" class="action-link plain-btn" @click="cancelRoleSelection">Use another account</button>
      </div>

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

        <div v-if="signUpSuccess" class="success-msg">{{ signUpSuccess }}</div>
        <div v-if="signUpError" class="error-msg">{{ signUpError }}</div>

        <!-- sign up captcha -->
        <div v-if="siteKey" class="captcha-wrap" v-show="activeTab === 'signup'">
          <div ref="signupCaptchaRef" class="captcha-box"></div>
        </div>

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
const loginError = ref('')
const availableRoles = ref([])
const isSelectingRole = ref(false)
const signUpError = ref('')
const signUpSuccess = ref('')
const router = useRouter()
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
const signinCaptchaRef = ref(null)
const signupCaptchaRef = ref(null)
const signinWidgetId = ref(null)
const signupWidgetId = ref(null)
const tronCanvas = ref(null)
let disposeTronBackground = null

function initialiseTronBackground() {
  const canvas = tronCanvas.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) return

  const gridSize = 52
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let width = 0
  let height = 0
  let animationFrame = null
  let lastFrame = 0
  let movement = 0
  let circuits = []

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum)
  const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum)

  const createCircuit = () => {
    let currentX = -160 - Math.random() * 140
    let currentY = randomBetween(38, Math.max(39, height - 38))
    const segments = []

    while (currentX < width + 240) {
      const nextX = currentX + randomBetween(70, 180)
      segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: currentY })
      currentX = nextX

      if (Math.random() < 0.48) {
        const direction = Math.random() > 0.5 ? 1 : -1
        const nextY = clamp(currentY + direction * randomBetween(38, 96), 34, Math.max(34, height - 34))
        segments.push({ x1: currentX, y1: currentY, x2: currentX, y2: nextY })
        currentY = nextY
      }
    }

    const totalLength = segments.reduce((total, segment) => (
      total + Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1)
    ), 0)

    return {
      segments,
      totalLength,
      pulseOffset: Math.random() * totalLength,
      pulseSpeed: randomBetween(0.22, 0.56),
      pulseLength: randomBetween(48, 92)
    }
  }

  const pointOnCircuit = (circuit, distance) => {
    let covered = 0
    const target = ((distance % circuit.totalLength) + circuit.totalLength) % circuit.totalLength

    for (const segment of circuit.segments) {
      const length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1)
      if (target <= covered + length) {
        const ratio = length ? (target - covered) / length : 0
        return {
          x: segment.x1 + (segment.x2 - segment.x1) * ratio,
          y: segment.y1 + (segment.y2 - segment.y1) * ratio
        }
      }
      covered += length
    }

    const finalSegment = circuit.segments[circuit.segments.length - 1]
    return { x: finalSegment.x2, y: finalSegment.y2 }
  }

  const strokeCircuitRange = (circuit, start, end) => {
    let covered = 0
    let hasPath = false

    context.beginPath()
    for (const segment of circuit.segments) {
      const length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1)
      const segmentStart = Math.max(start, covered)
      const segmentEnd = Math.min(end, covered + length)

      if (segmentStart < segmentEnd) {
        const startRatio = (segmentStart - covered) / length
        const endRatio = (segmentEnd - covered) / length
        const startPoint = {
          x: segment.x1 + (segment.x2 - segment.x1) * startRatio,
          y: segment.y1 + (segment.y2 - segment.y1) * startRatio
        }
        const endPoint = {
          x: segment.x1 + (segment.x2 - segment.x1) * endRatio,
          y: segment.y1 + (segment.y2 - segment.y1) * endRatio
        }

        if (!hasPath) {
          context.moveTo(startPoint.x, startPoint.y)
          hasPath = true
        } else {
          context.lineTo(startPoint.x, startPoint.y)
        }
        context.lineTo(endPoint.x, endPoint.y)
      }
      covered += length
    }

    if (hasPath) context.stroke()
  }

  const drawCircuit = (circuit) => {
    context.save()
    context.strokeStyle = 'rgba(213, 221, 225, 0.18)'
    context.lineWidth = 1.15
    context.lineJoin = 'round'
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(circuit.segments[0].x1, circuit.segments[0].y1)
    for (const segment of circuit.segments) {
      context.lineTo(segment.x2, segment.y2)
    }
    context.stroke()

    const pulseHead = (circuit.pulseOffset + movement * circuit.pulseSpeed) % circuit.totalLength
    const pulseStart = pulseHead - circuit.pulseLength
    context.strokeStyle = 'rgba(247, 250, 251, 0.94)'
    context.shadowColor = 'rgba(217, 226, 230, 0.82)'
    context.shadowBlur = 12
    context.lineWidth = 2.1

    if (pulseStart < 0) {
      strokeCircuitRange(circuit, circuit.totalLength + pulseStart, circuit.totalLength)
      strokeCircuitRange(circuit, 0, pulseHead)
    } else {
      strokeCircuitRange(circuit, pulseStart, pulseHead)
    }

    const pulsePoint = pointOnCircuit(circuit, pulseHead)
    context.fillStyle = 'rgba(255, 255, 255, 0.96)'
    context.beginPath()
    context.arc(pulsePoint.x, pulsePoint.y, 2.4, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  const drawFrame = (timestamp = 0) => {
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 16.667, 3) : 1
    lastFrame = timestamp
    if (!reducedMotion.matches) movement += delta

    const background = context.createLinearGradient(0, 0, 0, height)
    background.addColorStop(0, '#242b31')
    background.addColorStop(0.42, '#1a2025')
    background.addColorStop(1, '#0d1216')
    context.fillStyle = background
    context.fillRect(0, 0, width, height)

    const horizon = height * 0.34
    const gridOffset = (movement * 0.72) % gridSize
    context.save()
    context.strokeStyle = 'rgba(229, 236, 238, 0.12)'
    context.lineWidth = 1

    for (let x = -width; x < width * 2; x += gridSize) {
      context.beginPath()
      context.moveTo(width / 2 + (x - width / 2) * 0.1, horizon)
      context.lineTo(x, height)
      context.stroke()
    }

    for (let index = 0; index < 20; index += 1) {
      const depth = (index + gridOffset / gridSize) / 20
      const y = horizon + Math.min(depth * depth, 1) * (height - horizon)
      if (y <= height) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }
    }

    context.strokeStyle = 'rgba(244, 248, 249, 0.22)'
    context.beginPath()
    context.moveTo(0, horizon)
    context.lineTo(width, horizon)
    context.stroke()
    context.restore()

    circuits.forEach(drawCircuit)

    const vignette = context.createRadialGradient(
      width / 2,
      height * 0.46,
      Math.min(width, height) * 0.12,
      width / 2,
      height * 0.46,
      Math.max(width, height) * 0.76
    )
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.33)')
    context.fillStyle = vignette
    context.fillRect(0, 0, width, height)

    if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(drawFrame)
  }

  const resizeCanvas = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    const bounds = canvas.getBoundingClientRect()
    width = Math.max(1, Math.round(bounds.width))
    height = Math.max(1, Math.round(bounds.height))
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    circuits = Array.from({ length: Math.max(7, Math.min(10, Math.round(width / 190))) }, createCircuit)
    lastFrame = 0
    drawFrame(performance.now())
  }

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(resizeCanvas)

  resizeObserver?.observe(canvas)
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()

  disposeTronBackground = () => {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    resizeObserver?.disconnect()
    window.removeEventListener('resize', resizeCanvas)
  }
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

    if (!recaptchaToken) {
      loginError.value = 'Please complete the reCAPTCHA verification.'
      return
    }

    const payload = await login(signIn.email, signIn.password, recaptchaToken)
    const roles = Array.isArray(payload.user.roles) && payload.user.roles.length ? payload.user.roles : [payload.user.role]
    if (roles.length > 1) {
      availableRoles.value = roles
      activeTab.value = 'role-select'
      return
    }
    router.push(routeByRole(payload.user.role))
  } catch (error) {
    loginError.value = error.message || 'Invalid email or password.'
    try { resetRecaptcha(signinWidgetId) } catch (_) {}
  }
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
  activeTab.value = 'signin'
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

  try {
    // obtain recaptcha token from the signup widget
    let recaptchaToken = null
    try {
      if (window.grecaptcha && signupWidgetId.value != null) {
        recaptchaToken = window.grecaptcha.getResponse(signupWidgetId.value)
      } else if (window.grecaptcha) {
        recaptchaToken = window.grecaptcha.getResponse()
      }
    } catch (e) { /* ignore */ }

    if (!recaptchaToken) {
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
      recaptchaToken
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

function onStudentIdInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 12)
  const formatted = digits
    .replace(/^(\d{2})(\d)/, '$1-$2')
    .replace(/^(\d{2}-\d{4})(\d)/, '$1-$2')
  signUp.studentId = formatted
}

onMounted(() => {
  initialiseTronBackground()
})

onBeforeUnmount(() => {
  disposeTronBackground?.()
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 110%, #f6f7f9 0%, #cfd3d8 26%, #9da4ad 54%, #5f6871 75%, #2b3036 100%);
  padding: 24px;
}

.card {
  background: linear-gradient(145deg, #f8fafc 0%, #e8ecef 100%);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 24px;
  padding: 32px 40px 28px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 14px 40px rgba(24, 30, 36, 0.22);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: max-width 0.25s;
}

.card.card--wide {
  max-width: 540px;
}

.title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #39424b;
  letter-spacing: -0.5px;
}

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

.role-selection { gap: 14px; }
.role-selection__intro { margin: 0 0 4px; color: #667085; line-height: 1.5; text-align: center; }
.role-selection__button {
  width: 100%; text-align: left; border: 1px solid #d7e3dc; border-radius: 12px;
  background: #f8fbf9; padding: 15px 16px; cursor: pointer; font-family: inherit;
  display: flex; flex-direction: column; gap: 4px; transition: border-color .15s, background .15s;
}
.role-selection__button:hover:not(:disabled) { background: #edf6f0; border-color: #2d6a4f; }
.role-selection__button:disabled { opacity: .65; cursor: wait; }
.role-selection__name { color: #1b4332; font-weight: 700; font-size: 1rem; }
.role-selection__description { color: #667085; font-size: .84rem; }

@media (max-width: 520px) {
  .card { padding: 28px 20px 24px; }
  .title { font-size: 1.65rem; }
  .name-row { flex-direction: column; gap: 12px; }
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

/* Metallic Tron grid adapted from the supplied reference. */
.page-bg {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #12171b !important;
}

.tron-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.page-bg > .card {
  position: relative;
  z-index: 1;
}
</style>
