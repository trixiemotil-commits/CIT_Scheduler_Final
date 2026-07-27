<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Notifications</div>
      <button class="mark-btn" @click="markAll">Mark all read</button>
    </div>

    <div class="unread-banner" v-if="unreadCount">
      {{ unreadCount }} unread notification{{ unreadCount > 1 ? 's' : '' }}
    </div>

    <div class="notif-list">
      <div v-for="group in groupedNotifications" :key="group.label">
        <div class="group-label">{{ group.label }}</div>
        <div v-for="n in group.items" :key="n.id" class="notif-item" :class="{ unread: !n.read }" @click="n.read = true">
          <div class="notif-dot" :class="{ on: !n.read }"></div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-desc">{{ n.desc }}</div>
            <div class="notif-time">{{ n.time }}</div>
          </div>
        </div>
      </div>
    </div>

      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken } from '@/auth.js'
import useNotifications from '@/composables/useNotifications'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) throw new Error('Session expired. Please log in again.')
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...options,
  })
  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(body.message || 'Request failed')
  return body
}

const notifications = ref([])

async function loadNotifications() {
  try {
    const payload = await apiRequest('/notifications')
    const notifs = Array.isArray(payload.notifications) ? payload.notifications : []
    notifications.value = notifs.map(n => ({
      id: n.id,
      title: n.title || n.type,
      desc: n.message || '',
      time: new Date(n.createdAt).toLocaleString(),
      group: (Date.now() - new Date(n.createdAt).getTime()) < (24*60*60*1000) ? 'TODAY' : 'EARLIER',
      read: Boolean(n.read),
    }))
  } catch (err) {
    notifications.value = []
  }
}

onMounted(() => loadNotifications())

// subscribe to SSE notifications to update the list in realtime
function _onNotif(n) {
  // prepend new notification
  const item = {
    id: n.id,
    title: n.title || n.type,
    desc: n.message || '',
    time: new Date(n.createdAt).toLocaleString(),
    group: (Date.now() - new Date(n.createdAt).getTime()) < (24*60*60*1000) ? 'TODAY' : 'EARLIER',
    read: Boolean(n.read),
  }
  notifications.value = [item, ...notifications.value]
}

onMounted(() => {
  useNotifications.addNotificationListener(_onNotif)
})

onUnmounted(() => {
  useNotifications.removeNotificationListener(_onNotif)
})

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)
const groupOrder = ['TODAY', 'YESTERDAY', 'EARLIER']
const groupedNotifications = computed(() =>
  groupOrder
    .map((label) => ({ label, items: notifications.value.filter((n) => n.group === label) }))
    .filter((g) => g.items.length)
)

async function markAll() {
  try {
    await apiRequest('/notifications/mark-all-read', { method: 'PATCH' })
    notifications.value.forEach((n) => { n.read = true })
  } catch (_err) {
    // fallback to per-notification marking
    await Promise.all(notifications.value.filter(n => !n.read).map(n => apiRequest(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})))
    notifications.value.forEach((n) => { n.read = true })
  }
}
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100%;
  margin: 0 auto;
  background: #f3f5f7;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
}
.header-title { font-weight: 700; font-size: 1rem; color: #22272d; }
.mark-btn {
  border: 1px solid #d8dde3;
  border-radius: 8px;
  background: #fff;
  color: #4a525b;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 5px 10px;
}
.unread-banner {
  background: #e4e7e9;
  color: #4f575f;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 16px;
}
.notif-list { flex: 1; }
.group-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #8f99a4;
  letter-spacing: 0.08em;
  padding: 9px 14px 4px;
}
.notif-item {
  display: flex;
  gap: 10px;
  padding: 11px 14px;
  background: #fff;
  border-bottom: 1px solid #edf1f4;
}
.notif-item.unread { background: #f7fcf9; }
.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d2d8de;
  margin-top: 6px;
  flex-shrink: 0;
}
.notif-dot.on { background: #626a72; }
.notif-title { font-size: 0.91rem; font-weight: 700; color: #252b31; }
.notif-desc { font-size: 0.79rem; color: #74808d; margin-top: 2px; line-height: 1.4; }
.notif-time { font-size: 0.72rem; color: #a4adb7; margin-top: 4px; }
</style>
