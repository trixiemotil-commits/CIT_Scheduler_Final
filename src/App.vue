<template>
  <IonApp>
    <RouterView />
    <div v-if="showNativeSplash" class="native-splash" aria-label="CITScheduler" role="status">
      <div class="native-splash__lottie-art" aria-hidden="true">
        <span class="native-splash__orbit native-splash__orbit--one"></span>
        <span class="native-splash__orbit native-splash__orbit--two"></span>
        <span class="native-splash__orbit native-splash__orbit--three"></span>
      </div>
      <div class="native-splash__content">
        <div class="native-splash__branding">
          <img src="/branding/cit-college-seal.png" alt="" class="native-splash__logo" />
          <div class="native-splash__wordmark" aria-hidden="true">
            <span class="native-splash__cit">CIT</span>
            <span class="native-splash__scheduler">Scheduler</span>
          </div>
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
    }, 5000)
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
  background:
    radial-gradient(ellipse at 50% 120%, #f6f7f9 0%, #cfd3d8 20%, #9da4ad 42%, #5f6871 69%, #1a2128 100%);
  backface-visibility: hidden;
  animation: native-splash-exit 450ms ease-in 5000ms forwards;
}
.native-splash::before {
  position: absolute;
  inset: 30% -25% -18%;
  content: '';
  opacity: .38;
  background-image:
    linear-gradient(rgba(229, 236, 238, .17) 1px, transparent 1px),
    linear-gradient(90deg, rgba(229, 236, 238, .17) 1px, transparent 1px);
  background-size: 42px 42px;
  transform: perspective(480px) rotateX(62deg) scale(1.7);
  transform-origin: center bottom;
  animation: native-splash-grid 5000ms linear infinite;
}
.native-splash::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(17, 23, 28, .72), rgba(12, 17, 22, .18) 38%, rgba(11, 17, 21, .82));
  pointer-events: none;
}
.native-splash__lottie-art {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(74vw, 380px);
  aspect-ratio: 1;
  opacity: .72;
  transform: translate(-50%, -50%) rotate(-18deg);
  animation: native-splash-art 5000ms ease-in-out infinite;
}
.native-splash__orbit {
  position: absolute;
  inset: 8%;
  border: 2px solid rgba(220, 231, 235, .24);
  border-radius: 45% 55% 48% 52%;
  box-shadow: 0 0 18px rgba(206, 221, 226, .12);
}
.native-splash__orbit--one {
  transform: rotate(28deg) scaleY(.42);
  animation: native-splash-orbit-one 3400ms ease-in-out infinite;
}
.native-splash__orbit--two {
  inset: 16% 2%;
  border-color: rgba(184, 204, 212, .2);
  transform: rotate(-34deg) scaleY(.56);
  animation: native-splash-orbit-two 4100ms ease-in-out infinite reverse;
}
.native-splash__orbit--three {
  inset: 1% 20%;
  border-color: rgba(239, 245, 246, .16);
  transform: rotate(76deg) scaleY(.42);
  animation: native-splash-orbit-three 3000ms ease-in-out infinite;
}
.native-splash__content {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: min(92vw, 520px);
  color: var(--ion-color-primary-contrast);
  transform: translateZ(0);
}
.native-splash__branding {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 3vw, 26px);
  text-align: center;
}
.native-splash__logo {
  display: block;
  width: clamp(170px, 28vw, 250px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 14px 30px rgba(13, 20, 26, .34));
  animation: native-splash-logo 1600ms cubic-bezier(.22, .8, .32, 1) forwards;
}
.native-splash__wordmark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transform: translateY(16px);
  animation: native-splash-wordmark 850ms cubic-bezier(.22, .8, .32, 1) 820ms forwards;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: .22em;
  text-transform: uppercase;
  text-shadow: 0 0 14px rgba(115, 200, 255, .18);
}
.native-splash__cit {
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 800;
  line-height: .92;
  color: #eaf4ff;
}
.native-splash__scheduler {
  font-size: clamp(1.05rem, 2.8vw, 1.8rem);
  font-weight: 600;
  line-height: 1.1;
  color: #dfeef8;
  letter-spacing: .12em;
}
@keyframes native-splash-logo {
  0% { opacity: 0; transform: scale(.72) translateY(16px); }
  58% { opacity: 1; transform: scale(1.08) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes native-splash-wordmark {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes native-splash-exit {
  to { opacity: 0; visibility: hidden; }
}
@keyframes native-splash-grid {
  from { background-position: 0 0, 0 0; }
  to { background-position: 0 42px, 42px 0; }
}
@keyframes native-splash-art {
  0%, 100% { opacity: .38; transform: translate(-50%, -50%) rotate(-18deg) scale(.9); }
  50% { opacity: .74; transform: translate(-50%, -50%) rotate(18deg) scale(1.08); }
}
@keyframes native-splash-orbit-one {
  0%, 100% { transform: rotate(28deg) scaleY(.42) translateX(-7px); }
  50% { transform: rotate(42deg) scaleY(.5) translateX(10px); }
}
@keyframes native-splash-orbit-two {
  0%, 100% { transform: rotate(-34deg) scaleY(.56) translateY(8px); }
  50% { transform: rotate(-12deg) scaleY(.44) translateY(-10px); }
}
@keyframes native-splash-orbit-three {
  0%, 100% { transform: rotate(76deg) scaleY(.42); }
  50% { transform: rotate(100deg) scaleY(.58); }
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
