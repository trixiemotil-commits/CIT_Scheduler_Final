<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Notifications</div>
      <button class="mark-btn" @click="markAll">Mark all read</button>
    </div>

    <!-- Unread banner -->
    <div v-if="unreadCount > 0" class="unread-banner">
      🔔 {{ unreadCount }} unread notification{{ unreadCount !== 1 ? 's' : '' }}
    </div>

    <div class="notif-list">
      <div v-for="group in groupedNotifications" :key="group.label">
        <div class="group-label">{{ group.label }}</div>
        <div
          v-for="n in group.items" :key="n.id"
          :class="['notif-item', { unread: !n.read }]"
          @click="n.read = true"
        >
          <div class="notif-dot" :class="{ 'dot-unread': !n.read }"></div>
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
  { id: 1, title: '✅ Consultation Approved!',  desc: 'Your Math Consultation with Ms. Johnson has been approved. Jun 12 at 10:00 AM.',      time: '2 hrs ago',  group: 'TODAY',     read: false },
  { id: 2, title: '⏰ Reminder',                desc: 'Science Review with Mr. Davis is tomorrow at 2:00 PM. Please prepare.',               time: '4 hrs ago',  group: 'TODAY',     read: false },
  { id: 3, title: '❌ Session Rejected',        desc: 'English Literature was declined by Ms. Park. Please reschedule.',                     time: '6 hrs ago',  group: 'TODAY',     read: false },
  { id: 4, title: '🎉 Session Completed',       desc: 'History with Mr. Wilson completed. Rate your experience!',                           time: 'Jun 5',      group: 'YESTERDAY', read: true  },
  { id: 5, title: '🔑 Password Changed',        desc: 'Your account password was successfully updated.',                                     time: 'Jun 4',      group: 'YESTERDAY', read: true  },
  { id: 6, title: '🛡️ 2FA Enabled',            desc: 'Two-Factor Authentication was enabled on your account.',                              time: 'Jun 3',      group: 'EARLIER',   read: true  },
  { id: 7, title: '👋 Welcome!',                desc: 'Your EduConnect account is set up. Start booking sessions!',                          time: 'May 30',     group: 'EARLIER',   read: true  },
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const groupOrder  = ['TODAY', 'YESTERDAY', 'EARLIER']

const groupedNotifications = computed(() =>
  groupOrder
    .map(label => ({ label, items: notifications.value.filter(n => n.group === label) }))
    .filter(g => g.items.length > 0)
)

function markAll() { notifications.value.forEach(n => { n.read = true }) }
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100dvh;
  margin: 0 auto; background: #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; padding: 16px 18px; border-bottom: 1px solid #eee;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #444; padding: 4px; display: flex; align-items: center;
  border-radius: 6px; margin-left: -4px; transition: color 0.15s;
}
.back-btn:hover { color: #1b4332; }
.header-title { font-weight: 700; font-size: 1rem; color: #1b4332; }
.mark-btn {
  background: none; border: 1.5px solid #ddd; color: #555;
  border-radius: 8px; padding: 5px 12px;
  font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit;
}

/* Unread banner */
.unread-banner {
  background: #d8f3e8; color: #1b7a4a;
  font-size: 0.82rem; font-weight: 600;
  padding: 10px 16px;
}

/* Notifications */
.notif-list    { flex: 1; }
.group-label   { font-size: 0.72rem; font-weight: 700; color: #aaa; letter-spacing: 0.05em; padding: 14px 16px 6px; }
.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  background: #fff; padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0; cursor: pointer;
  transition: background 0.15s;
}
.notif-item.unread { background: #fafffe; }
.notif-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #e5e7eb; flex-shrink: 0; margin-top: 5px;
}
.notif-dot.dot-unread { background: #1b4332; }
.notif-body   { flex: 1; }
.notif-title  { font-size: 0.87rem; font-weight: 600; color: #111; margin-bottom: 3px; }
.notif-desc   { font-size: 0.78rem; color: #666; line-height: 1.45; }
.notif-time   { font-size: 0.72rem; color: #aaa; margin-top: 5px; }
</style>
