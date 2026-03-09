<template>
  <div class="mobile-app">
    <!-- Header -->
    <div class="app-header">
      <div class="header-left">
        <div class="avatar-sm">{{ initials }}</div>
        <div>
          <div class="header-title">Student Dashboard</div>
          <div class="header-sub">{{ user.name }}</div>
        </div>
      </div>
      <span class="status-badge active">Active</span>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card green">
        <div class="stat-label">Approved</div>
        <div class="stat-num">{{ stats.approved }}</div>
        <div class="stat-desc">sessions approved</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Rejected</div>
        <div class="stat-num">{{ stats.rejected }}</div>
        <div class="stat-desc">sessions rejected</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Pending</div>
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-desc">awaiting response</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Completed</div>
        <div class="stat-num">{{ stats.completed }}</div>
        <div class="stat-desc">all time</div>
      </div>
    </div>

    <!-- Recent Consultations -->
    <div class="section-card">
      <div class="section-title">Recent Consultations</div>
      <div v-for="c in recentConsultations" :key="c.id" class="consult-row">
        <div class="consult-info">
          <div class="consult-name">{{ c.subject }}</div>
          <div class="consult-teacher">{{ c.teacher }} · {{ formatDate(c.date) }}</div>
        </div>
        <span :class="['badge', badgeClass(c.status)]">{{ c.status }}</span>
      </div>
    </div>

    <!-- CTA Buttons -->
    <div class="cta-row">
      <button class="cta-btn primary" @click="$router.push('/student/teachers')">Browse Teachers</button>
      <button class="cta-btn secondary" @click="$router.push('/student/consultations')">My Sessions</button>
    </div>

    <!-- Bottom Nav -->
    <BottomNav active="home" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getUser } from '@/auth.js'
import BottomNav from '@/components/student/BottomNav.vue'
import { useStudentData } from '@/composables/useStudentData.js'

const user     = getUser() || { name: 'Anna Cooper', email: 'student@gmail.com' }
const initials = computed(() => user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const { sessions, stats } = useStudentData()

const recentConsultations = computed(() => sessions.value.slice(0, 4))

function badgeClass(status) {
  return { Approved: 'badge-green', Pending: 'badge-orange', Rejected: 'badge-red', Completed: 'badge-gray', Done: 'badge-gray' }[status] || 'badge-gray'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return dateStr }
}
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 18px;
  border-bottom: 1px solid #eee;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.avatar-sm {
  width: 42px; height: 42px;
  background: #1b4332;
  color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700;
  flex-shrink: 0;
}
.header-title { font-weight: 700; font-size: 0.97rem; color: #1b4332; }
.header-sub   { font-size: 0.78rem; color: #777; }
.status-badge.active {
  background: #d8f3e8; color: #1b7a4a;
  font-size: 0.72rem; font-weight: 600;
  padding: 4px 10px; border-radius: 20px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.stat-card.green { border-color: #2d6a4f; }
.stat-card.red   { border-color: #e63946; }
.stat-card.blue  { border-color: #3a86ff; }
.stat-card.orange{ border-color: #f4a261; }
.stat-label { font-size: 0.75rem; color: #777; margin-bottom: 4px; }
.stat-num   { font-size: 1.7rem; font-weight: 800; color: #111; line-height: 1; }
.stat-desc  { font-size: 0.7rem; color: #aaa; margin-top: 4px; }

/* Section card */
.section-card {
  background: #fff;
  border-radius: 14px;
  margin: 0 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.section-title { font-weight: 700; font-size: 0.92rem; margin-bottom: 12px; color: #1b4332; }

/* Consult rows */
.consult-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.consult-row:last-child { border-bottom: none; }
.consult-name    { font-size: 0.85rem; font-weight: 600; color: #222; }
.consult-teacher { font-size: 0.75rem; color: #888; margin-top: 2px; }

/* Badges */
.badge {
  font-size: 0.7rem; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
  white-space: nowrap;
}
.badge-green  { background: #d8f3e8; color: #1b7a4a; }
.badge-orange { background: #fff3e0; color: #b35e00; }
.badge-red    { background: #ffeaea; color: #e63946; }
.badge-gray   { background: #f0f0f0; color: #666; }

/* CTA */
.cta-row {
  display: flex; gap: 10px;
  padding: 16px;
}
.cta-btn {
  flex: 1;
  padding: 13px;
  border: none; border-radius: 10px;
  font-family: inherit; font-weight: 700; font-size: 0.88rem;
  cursor: pointer; transition: opacity 0.15s;
}
.cta-btn:active { opacity: 0.85; }
.cta-btn.primary   { background: #1b4332; color: #fff; }
.cta-btn.secondary { background: #f0faf3; color: #1b4332; border: 1.5px solid #c8ddd4; }
</style>
