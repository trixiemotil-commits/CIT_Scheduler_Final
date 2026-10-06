<template>
  <section class="device-panel" aria-labelledby="recent-devices-title">
    <header class="device-panel__header">
      <h2 id="recent-devices-title">Recent Devices</h2>
      <button class="device-refresh" type="button" aria-label="Refresh recent devices" title="Refresh" :disabled="loading" @click="loadDevices">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2"/></svg>
      </button>
    </header>
    <p v-if="error" class="device-message device-message--error" role="alert">{{ error }}</p>
    <p v-else-if="loading && !sessions.length" class="device-message">Loading devices...</p>
    <p v-else-if="!sessions.length" class="device-message">No active devices.</p>
    <ul v-else class="device-list">
      <li v-for="session in sessions" :key="session.id" class="device-row">
        <span class="device-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M8 21h8M12 17v4"/></svg>
        </span>
        <div class="device-info">
          <div class="device-name">{{ session.device }} <span v-if="session.current" class="device-current">This device</span></div>
          <div class="device-meta">{{ session.location }}<span v-if="session.ipAddress"> · {{ session.ipAddress }}</span></div>
          <time class="device-time" :datetime="session.lastActiveAt">Last sign-in {{ formatDate(session.lastActiveAt) }}</time>
        </div>
        <button class="device-logout" type="button" :disabled="busyId === session.id" @click="logoutDevice(session)">
          {{ busyId === session.id ? 'Signing out...' : 'Log out' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { getToken, logout } from '@/auth.js'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const router = useRouter()
const sessions = ref([])
const loading = ref(false)
const busyId = ref('')
const error = ref('')

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()
}

async function loadDevices() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API_BASE}/auth/sessions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to load devices.')
    sessions.value = body.sessions || []
  } catch (requestError) {
    error.value = requestError.message || 'Unable to load devices.'
  } finally {
    loading.value = false
  }
}

async function logoutDevice(session) {
  busyId.value = session.id
  error.value = ''
  try {
    const response = await fetch(`${API_BASE}/auth/sessions/${encodeURIComponent(session.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to sign out that device.')
    sessions.value = sessions.value.filter((item) => item.id !== session.id)
    if (session.current) {
      logout()
      await router.replace('/')
    }
  } catch (requestError) {
    error.value = requestError.message || 'Unable to sign out that device.'
  } finally {
    busyId.value = ''
  }
}

onMounted(loadDevices)
</script>

<style scoped>
.device-panel { box-sizing: border-box; width: 100%; padding: 20px; border: 1px solid #d9e0e2; border-radius: 6px; background: #fff; color: #25313a; }
.device-panel__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.device-panel__header h2 { margin: 0; font-size: 1rem; line-height: 1.3; }
.device-refresh { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 auto; padding: 0; border: 1px solid #cdd7d9; border-radius: 4px; background: #f5f8f7; color: #3f5960; cursor: pointer; }
.device-refresh svg { width: 17px; height: 17px; }
.device-refresh:disabled, .device-logout:disabled { opacity: .55; cursor: wait; }
.device-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.device-row { display: flex; align-items: center; gap: 14px; min-width: 0; padding: 14px 0; border-top: 1px solid #e8edef; }
.device-icon { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 auto; border: 1px solid #dce5e5; border-radius: 4px; background: #eff5f2; color: #176b55; }
.device-icon svg { width: 20px; height: 20px; }
.device-info { flex: 1; min-width: 0; }
.device-name { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; color: #25313a; font-size: .86rem; font-weight: 700; overflow-wrap: anywhere; }
.device-current { padding: 2px 6px; border-radius: 3px; background: #e9f3ee; color: #176b55; font-size: .66rem; font-weight: 700; }
.device-meta, .device-time { display: block; margin-top: 4px; color: #6b777d; font-size: .72rem; line-height: 1.45; overflow-wrap: anywhere; }
.device-logout { min-height: 36px; flex: 0 0 auto; padding: 7px 11px; border: 1px solid #c98888; border-radius: 4px; background: #fff; color: #983b3b; font: inherit; font-size: .74rem; font-weight: 700; cursor: pointer; }
.device-message { margin: 0; color: #6b777d; font-size: .8rem; }
.device-message--error { color: #a33434; }
@media (max-width: 560px) { .device-panel { padding: 16px; } .device-row { align-items: flex-start; gap: 10px; } .device-icon { width: 34px; height: 34px; } .device-logout { align-self: center; padding: 7px 8px; } }
</style>