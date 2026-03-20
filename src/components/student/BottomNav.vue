<template>
  <div class="bottom-nav-wrap">
    <nav class="bottom-nav">
      <router-link to="/student/dashboard" :class="['nav-item', { active: active === 'home' }]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Home</span>
      </router-link>
      <router-link to="/student/teachers" :class="['nav-item', { active: active === 'teachers' }]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Teachers</span>
      </router-link>
      <router-link to="/student/consultations" :class="['nav-item', { active: active === 'consultations' }]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Consultations</span>
      </router-link>
      <router-link to="/student/events" :class="['nav-item', { active: active === 'events' }]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>
        <span>Events</span>
      </router-link>
      <router-link to="/student/profile" :class="['nav-item', { active: active === 'profile' }]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
defineProps({ active: { type: String, default: 'home' } })
</script>

<style scoped>
.bottom-nav-wrap {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 50;
}

.bottom-nav {
  width: 100%;
  height: 64px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex; align-items: center;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  font-family: 'Poppins', sans-serif;
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px;
  text-decoration: none; color: #aaa;
  font-size: 0.64rem; font-weight: 500;
  transition: color 0.15s;
}
.nav-item.active { color: #1b4332; }
.nav-item.active svg { stroke: #1b4332; }
.nav-item span { line-height: 1; }
</style>
