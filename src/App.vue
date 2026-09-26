<template>
  <IonApp>
    <RouterView />
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
import { IonApp } from '@ionic/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const showSecurityWarning = ref(false)
let securityPoll = null

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
  securityPoll = window.setInterval(checkForNewLogin, 15000)
  document.addEventListener('visibilitychange', checkForNewLogin)
})

onUnmounted(() => {
  if (securityPoll) window.clearInterval(securityPoll)
  document.removeEventListener('visibilitychange', checkForNewLogin)
})
</script>

<style scoped>
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
