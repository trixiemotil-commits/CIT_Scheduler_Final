<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="mobile-app">
    <div v-if="isLoading" class="notifications-skeleton" role="status" aria-label="Loading notifications">
      <span class="sr-only">Loading notifications…</span>
      <div class="app-header"><i class="skeleton-block skeleton-back"></i><i class="skeleton-block skeleton-heading"></i><i class="skeleton-block skeleton-action"></i></div>
      <i class="skeleton-block skeleton-unread"></i>
      <i class="skeleton-block skeleton-group"></i>
      <div v-for="item in 6" :key="item" class="skeleton-notification-row">
        <i class="skeleton-block skeleton-avatar"></i>
        <div class="skeleton-copy"><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i></div>
      </div>
    </div>
    <template v-else>
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Notifications</div>
      <div class="header-actions">
        <button class="mark-btn" type="button" @click="markAll">Mark all read</button>
        <button class="clear-btn" type="button" :aria-label="isClearing ? 'Clearing notifications' : 'Clear all notifications'" title="Clear all notifications" :disabled="isClearing || !notifications.length" @click="clearAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m4 4v6m6-6v6" /></svg>
        </button>
      </div>
    </div>

    <div class="unread-banner" v-if="unreadCount">
      {{ unreadCount }} unread notification{{ unreadCount > 1 ? 's' : '' }}
    </div>

    <div class="notif-list">
      <div v-for="group in groupedNotifications" :key="group.label">
        <div class="group-label">{{ group.label }}</div>
        <div v-for="n in group.items" :key="n.id" class="notif-item" :class="{ unread: !n.read }" @click="openNotification(n)">
          <div class="notif-dot" :class="{ on: !n.read }"></div>
          <img v-if="n.avatar" :src="n.avatar" class="notif-avatar" alt="" />
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-desc">{{ n.desc }}</div>
            <div class="notif-time">{{ n.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showClearConfirm" class="clear-dialog-overlay" role="presentation" @click.self="closeClearConfirm">
      <section class="clear-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-dialog-title" aria-describedby="clear-dialog-description">
        <div class="clear-dialog__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m4 4v6m6-6v6" /></svg>
        </div>
        <h2 id="clear-dialog-title">Clear all notifications?</h2>
        <p id="clear-dialog-description">This will permanently delete all of your notifications.</p>
        <p v-if="clearError" class="clear-dialog__error" role="alert">{{ clearError }}</p>
        <div class="clear-dialog__actions">
          <button type="button" class="clear-dialog__cancel" :disabled="isClearing" @click="closeClearConfirm">Cancel</button>
          <button type="button" class="clear-dialog__confirm" :disabled="isClearing" @click="confirmClearAll">
            {{ isClearing ? 'Clearing...' : 'Clear all' }}
          </button>
        </div>
      </section>
    </div>
    </template>

      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken } from '@/auth.js'
import useNotifications from '@/composables/useNotifications'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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
const isLoading = ref(true)
const router = useRouter()
const isClearing = ref(false)
const showClearConfirm = ref(false)
const clearError = ref('')

async function loadNotifications() {
  isLoading.value = true
  try {
    const payload = await apiRequest('/notifications')
    const notifs = Array.isArray(payload.notifications) ? payload.notifications : []
    notifications.value = notifs.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title || n.type,
      desc: n.message || '',
      avatar: n.data?.avatar || '',
      time: new Date(n.createdAt).toLocaleString(),
      group: (Date.now() - new Date(n.createdAt).getTime()) < (24*60*60*1000) ? 'TODAY' : 'EARLIER',
      read: Boolean(n.read),
      related: n.related || {},
      route: n.data?.route || '',
    }))
  } catch (err) {
    notifications.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadNotifications())

// subscribe to SSE notifications to update the list in realtime
function _onNotif(n) {
  if (!n?.id || notifications.value.some(notification => notification.id === n.id)) return
  // prepend new notification
  const item = {
    id: n.id,
    type: n.type,
    title: n.title || n.type,
    desc: n.message || '',
    avatar: n.data?.avatar || '',
    time: new Date(n.createdAt).toLocaleString(),
    group: (Date.now() - new Date(n.createdAt).getTime()) < (24*60*60*1000) ? 'TODAY' : 'EARLIER',
    read: Boolean(n.read),
    related: n.related || {},
    route: n.data?.route || '',
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

async function openNotification(notification) {
  if (!notification.read) {
    notification.read = true
    apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' })
      .catch((error) => console.error('Failed to mark notification as read:', error))
  }

  if (String(notification.type || '').startsWith('consultation_')) {
    const status = String(notification.related?.status || '').toUpperCase()
    const tabByStatus = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      RESCHED: 'Reschedule',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      ARCHIVED: 'Archived',
    }
    router.push({
      path: '/student/consultations',
      query: tabByStatus[status] ? { tab: tabByStatus[status] } : {},
    })
    return
  }

  if (notification.route) {
    router.push(notification.route)
  }
}

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

async function clearAll() {
  if (!notifications.value.length || isClearing.value) return
  clearError.value = ''
  showClearConfirm.value = true
}

function closeClearConfirm() {
  if (isClearing.value) return
  showClearConfirm.value = false
  clearError.value = ''
}

async function confirmClearAll() {
  if (!notifications.value.length || isClearing.value) return
  clearError.value = ''
  isClearing.value = true
  try {
    await apiRequest('/notifications', { method: 'DELETE' })
    notifications.value = []
    showClearConfirm.value = false
  } catch (error) {
    clearError.value = error.message || 'Unable to clear notifications.'
  } finally {
    isClearing.value = false
  }
}
</script>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.notifications-skeleton { min-height: 100dvh; padding-bottom: 16px; background: #f3f5f7; }
.notifications-skeleton .app-header { min-height: 68px; }
.skeleton-block { position: relative; display: block; overflow: hidden; border-radius: 8px; background: rgba(115,125,133,.14); }
.skeleton-block::after { position: absolute; inset: 0; content: ''; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent); animation: notification-shimmer 1.35s ease-in-out infinite; }
.skeleton-back { width: 28px; height: 28px; border-radius: 50%; }
.skeleton-heading { width: 100px; height: 17px; }
.skeleton-action { width: 86px; height: 32px; }
.skeleton-unread { height: 37px; width: 100%; border-radius: 0; }
.skeleton-group { width: 54px; height: 10px; margin: 16px 16px 8px; }
.skeleton-notification-row { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-bottom: 1px solid rgba(104,112,120,.1); }
.skeleton-avatar { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 50%; }
.skeleton-copy { display: grid; flex: 1; gap: 8px; padding-top: 3px; }
.skeleton-copy .skeleton-block:nth-child(1) { width: 58%; height: 14px; }
.skeleton-copy .skeleton-block:nth-child(2) { width: 94%; height: 12px; }
.skeleton-copy .skeleton-block:nth-child(3) { width: 34%; height: 10px; }
@keyframes notification-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .skeleton-block::after { animation: none; transform: none; opacity: .25; } }

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
  gap: 8px;
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
  white-space: nowrap;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5c8c8;
  border-radius: 8px;
  background: #fff;
  color: #a33f3f;
  cursor: pointer;
}
.clear-btn svg {
  width: 16px;
  height: 16px;
}
.clear-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.clear-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(20, 28, 35, 0.48);
}
.clear-dialog {
  width: min(100%, 360px);
  padding: 24px;
  border: 1px solid #e4e8eb;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(19, 30, 39, 0.22);
}
.clear-dialog__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: #fff0f0;
  color: #a33f3f;
}
.clear-dialog__icon svg {
  width: 21px;
  height: 21px;
}
.clear-dialog h2 {
  margin: 16px 0 6px;
  color: #22272d;
  font-size: 1.08rem;
  font-weight: 700;
}
.clear-dialog p {
  margin: 0;
  color: #697581;
  font-size: 0.84rem;
  line-height: 1.5;
}
.clear-dialog .clear-dialog__error {
  margin-top: 10px;
  color: #a33f3f;
}
.clear-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}
.clear-dialog__actions button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}
.clear-dialog__cancel {
  border-color: #d8dde3 !important;
  background: #fff;
  color: #4a525b;
}
.clear-dialog__confirm {
  background: #a33f3f;
  color: #fff;
}
.clear-dialog__actions button:disabled {
  cursor: wait;
  opacity: 0.65;
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

.notif-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 50%;
  object-fit: cover;
  background: #dcebe4;
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
