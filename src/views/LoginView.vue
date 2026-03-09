<template>
  <div class="page-bg">
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

        <!-- Registered ID -->
        <div class="input-wrapper">
          <input v-model="signUp.registeredId" type="text" placeholder="Registered id" class="input-field" />
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

        <div class="row-end">
          <button type="button" class="action-link plain-btn" @click="activeTab = 'signin'">Already have an account?</button>
        </div>

        <button type="submit" class="submit-btn">Sign up</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, defineComponent, h } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { login } from '@/auth.js'

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
const router = useRouter()
const signIn = reactive({ email: '', password: '', remember: false, showPw: false })
const signUp = reactive({ firstName: '', lastName: '', registeredId: '', email: '', password: '', confirmPassword: '', showPw: false, showConfirmPw: false })

function handleLogin() {
  loginError.value = ''
  const role = login(signIn.email, signIn.password)
  if (role === 'admin') {
    router.push('/admin/dashboard')
  } else if (role === 'teacher') {
    router.push('/teacher/dashboard')
  } else {
    loginError.value = 'Invalid email or password.'
  }
}
function handleSignUp() { console.log('Sign Up:', signUp) }
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
</style>
