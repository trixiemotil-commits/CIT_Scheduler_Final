<template>
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

    <BottomNav active="notifications" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BottomNav from '@/components/student/BottomNav.vue'

const notifications = ref([
  { id: 1, title: 'Consultation Approved', desc: 'Your Math Consultation with Ms. Johnson has been approved. Jun 12 at 10:00 AM.', time: '2 hrs ago', group: 'TODAY', read: false },
  { id: 2, title: 'Reminder', desc: 'Science Review with Mr. Davis is tomorrow at 2:00 PM. Please prepare.', time: '4 hrs ago', group: 'TODAY', read: false },
  { id: 3, title: 'Session Rejected', desc: 'English Literature was declined by Ms. Park. Please reschedule.', time: '6 hrs ago', group: 'TODAY', read: false },
  { id: 4, title: 'Session Completed', desc: 'History with Mr. Wilson completed. Rate your experience!', time: 'Jun 5', group: 'YESTERDAY', read: true },
  { id: 5, title: 'Password Changed', desc: 'Your account password was successfully updated.', time: 'Jun 4', group: 'YESTERDAY', read: true },
  { id: 6, title: '2FA Enabled', desc: 'Two-Factor Authentication was enabled on your account.', time: 'Jun 1', group: 'EARLIER', read: true },
  { id: 7, title: 'Welcome', desc: 'Your EduConnect account is set up. Start booking sessions!', time: 'May 30', group: 'EARLIER', read: true },
])

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)
const groupOrder = ['TODAY', 'YESTERDAY', 'EARLIER']
const groupedNotifications = computed(() =>
  groupOrder
    .map((label) => ({ label, items: notifications.value.filter((n) => n.group === label) }))
    .filter((g) => g.items.length)
)

function markAll() {
  notifications.value.forEach((n) => {
    n.read = true
  })
}
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f3f5f7;
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;
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
  background: #e6f3ea;
  color: #1b7a42;
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
.notif-dot.on { background: #17a34a; }
.notif-title { font-size: 0.91rem; font-weight: 700; color: #252b31; }
.notif-desc { font-size: 0.79rem; color: #74808d; margin-top: 2px; line-height: 1.4; }
.notif-time { font-size: 0.72rem; color: #a4adb7; margin-top: 4px; }
</style>
