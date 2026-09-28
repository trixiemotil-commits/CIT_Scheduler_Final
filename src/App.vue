<template>
  <IonApp>
    <RouterView />
    <div v-if="showNativeSplash" class="native-splash" aria-label="CITScheduler" role="status">
      <div class="native-splash__content">
        <img src="/branding/cit-college-seal.png" alt="" class="native-splash__logo" />
        <div class="native-splash__wordmark" aria-hidden="true">
          <span class="native-splash__cit">CIT</span>
          <span class="native-splash__scheduler">Scheduler</span>
        </div>
      </div>
    </div>
    <div v-if="showSecurityWarning" class="security-warning-backdrop" role="presentation">
      <section class="security-warning" role="alertdialog" aria-modal="true" aria-labelledby="security-warning-title">
        <div class="security-warning-icon" aria-hidden="true">!</div>
        <h2 id="security-warning-title">Security notice</h2>
        <p>Your account was used to sign in on another device. If this was you, you can continue. If not, secure your account from the new device.</p>
        <div class="security-warning-actions">
          <button type="button" class="security-warning-keep" @click="dismissSecurityWarning">Dismiss</button>
        </div>
      </section>
    </div>
  </IonApp>
</template>

<script setup>
import { getToken } from '@/auth.js'
import { Capacitor } from '@capacitor/core'
import { IonApp } from '@ionic/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const showNativeSplash = ref(Capacitor.isNativePlatform())
const showSecurityWarning = ref(false)
let securityPoll = null
let splashTimer = null

async function checkForNewLogin() {
  const token = getToken()
  if (!token || showSecurityWarning.value) return

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return
    const payload = await response.json()
    const loginAt = String(payload.security?.lastLoginAt || '')
    const marker = `cit-security-login-warning:${loginAt}`
    if (!payload.security?.newLoginDetected || !loginAt || sessionStorage.getItem(marker)) return
    sessionStorage.setItem(marker, 'shown')
    showSecurityWarning.value = true
  } catch (_) {
    // Security polling is best-effort and must not interrupt the active session.
  }
}

function dismissSecurityWarning() {
  showSecurityWarning.value = false
}

onMounted(() => {
  if (showNativeSplash.value) {
    splashTimer = window.setTimeout(() => {
      showNativeSplash.value = false
    }, 4500)
  }
  securityPoll = window.setInterval(checkForNewLogin, 15000)
  document.addEventListener('visibilitychange', checkForNewLogin)
})

onUnmounted(() => {
  if (splashTimer) window.clearTimeout(splashTimer)
  if (securityPoll) window.clearInterval(securityPoll)
  document.removeEventListener('visibilitychange', checkForNewLogin)
})
</script>

<style scoped>
.native-splash {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #12171b;
  backface-visibility: hidden;
  animation: native-splash-exit 450ms ease-in 4050ms forwards;
}
.native-splash::before {
  position: absolute;
  inset: 32% -40% -25%;
  content: '';
  opacity: .34;
  background-image:
    linear-gradient(rgba(229, 236, 238, .16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(229, 236, 238, .16) 1px, transparent 1px);
  background-size: 52px 52px;
  transform: perspective(420px) rotateX(58deg) scale(1.5);
  transform-origin: center bottom;
  animation: native-splash-grid 4500ms linear infinite;
}
.native-splash::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(36, 43, 49, .76), rgba(13, 18, 22, .2) 45%, rgba(13, 18, 22, .82));
  pointer-events: none;
}
.native-splash__content {
  position: relative;
  width: min(92vw, 430px);
  height: 240px;
  color: var(--ion-color-primary-contrast);
  z-index: 1;
  transform: translateZ(0);
}
.native-splash__logo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(148px, 38vw, 196px);
  height: clamp(148px, 38vw, 196px);
  object-fit: contain;
  backface-visibility: hidden;
  transform: translateZ(0);
  animation: native-splash-logo 1700ms cubic-bezier(.22, .8, .32, 1) forwards;
}
.native-splash__wordmark {
  position: absolute;
  top: 50%;
  left: calc(50% + 72px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0;
  opacity: 0;
  transform: translate(22px, -50%);
  animation: native-splash-wordmark 900ms cubic-bezier(.22, .8, .32, 1) 850ms forwards;
}
.native-splash__cit {
  font-size: clamp(2rem, 9vw, 3rem);
  font-weight: 800;
  line-height: .9;
}
.native-splash__scheduler {
  font-size: clamp(1rem, 4.8vw, 1.45rem);
  font-weight: 600;
  line-height: 1;
}
@keyframes native-splash-logo {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.72); }
  58% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  100% { opacity: 1; transform: translate(calc(-50% - 72px), -50%) scale(1); }
}
@keyframes native-splash-wordmark {
  0% { opacity: 0; transform: translate(22px, -50%); }
  100% { opacity: 1; transform: translate(0, -50%); }
}
@keyframes native-splash-exit {
  to { opacity: 0; visibility: hidden; }
}
@keyframes native-splash-grid {
  from { background-position: 0 0, 0 0; }
  to { background-position: 0 52px, 52px 0; }
}
.security-warning-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(23, 29, 34, .56);
  backdrop-filter: blur(4px);
}
.security-warning {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid rgba(255,255,255,.8);
  border-radius: 18px;
  background: linear-gradient(145deg, #f7f9fa, #dfe5e8);
  color: #263139;
  text-align: center;
  box-shadow: 0 20px 50px rgba(20, 27, 32, .28);
  font-family: Poppins, sans-serif;
}
.security-warning-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff1d8;
  color: #a76408;
  font-size: 1.6rem;
  font-weight: 800;
}
.security-warning h2 { margin: 0; font-size: 1.15rem; }
.security-warning p { margin: 10px 0 20px; color: #66737b; font-size: .82rem; line-height: 1.5; }
.security-warning-actions { display: flex; gap: 10px; }
.security-warning-actions button { flex: 1; min-height: 40px; border-radius: 9px; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
.security-warning-keep { border: 1px solid #3f4b54; background: #46535c; color: #fff; }
.security-warning-logout { border: 1px solid #d78b91; background: #fff; color: #b64f59; }
</style>
