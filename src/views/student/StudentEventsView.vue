<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Events</div>
      <div style="width: 32px"></div>
    </div>

    <section class="events-wrap">
      <header class="events-head">
        <h1 class="events-title">Events</h1>
        <p class="events-sub">View-only school events posted by admin</p>
      </header>

      <div class="events-grid">
        <article
          v-for="ev in events"
          :key="ev.id"
          class="event-card"
          @click="openViewEvent(ev)"
        >
          <div class="event-card-head">
            <span class="event-badge">Active</span>
          </div>
          <h2 class="event-card-title">{{ ev.title }}</h2>
          <p class="event-card-desc">{{ ev.description }}</p>
          <div class="event-card-meta">
            <span class="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ ev.date }}
            </span>
            <span class="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ ev.time }}
            </span>
            <span class="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ ev.location }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="ev-view-box" v-if="viewEvent">
          <div class="ev-view-handle"></div>
          <div class="ev-view-hero">
            <div class="ev-view-hero-overlay"></div>
            <div class="ev-view-hero-content">
              <span class="ev-view-badge">Active</span>
              <h2 class="ev-view-title">{{ viewEvent.title }}</h2>
            </div>
            <button class="ev-view-close" @click="showViewModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="ev-view-body">
            <div class="ev-view-info-row">
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--date">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Date</span>
                  <span class="ev-view-info-val">{{ formatDisplayDate(viewEvent.date) }}</span>
                </div>
              </div>

              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--time">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Time</span>
                  <span class="ev-view-info-val">{{ formatDisplayTime(viewEvent.time) }}</span>
                </div>
              </div>

              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--loc">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Location</span>
                  <span class="ev-view-info-val">{{ viewEvent.location }}</span>
                </div>
              </div>
            </div>

            <div class="ev-view-desc-wrap">
              <div class="ev-view-desc-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                Description
              </div>
              <p class="ev-view-desc">{{ viewEvent.description }}</p>
            </div>

            <div class="ev-view-actions">
              <button class="ev-view-close-btn" @click="showViewModal = false">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <BottomNav active="events" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BottomNav from '@/components/student/BottomNav.vue'

const events = ref([
  {
    id: 1,
    title: 'Faculty Meeting',
    description: 'Quarterly faculty alignment and planning meeting.',
    date: '2026-03-10',
    time: '09:00',
    location: 'Room 301',
  },
  {
    id: 2,
    title: 'CIT Foundation Day',
    description: 'Annual celebration of the CIT founding anniversary.',
    date: '2026-03-15',
    time: '08:00',
    location: 'Auditorium',
  },
  {
    id: 3,
    title: 'Enrollment Period',
    description: 'Regular enrollment for the upcoming semester.',
    date: '2026-04-01',
    time: '07:00',
    location: 'Registrar Office',
  },
])

const showViewModal = ref(false)
const viewEvent = ref(null)

function openViewEvent(ev) {
  viewEvent.value = ev
  showViewModal.value = true
}

function formatDisplayDate(date) {
  if (!date) return ''
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDisplayTime(time24) {
  if (!time24) return ''
  const [hour, minute] = time24.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f3f5f7;
  font-family: 'Poppins', sans-serif;
  color: #1f2933;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  border: none;
  background: none;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1b4332;
}

.events-wrap {
  padding: 12px 12px 16px;
}

.events-head {
  margin-bottom: 10px;
}

.events-title {
  margin: 0;
  font-size: 1.28rem;
  line-height: 1.1;
  font-weight: 700;
  color: #1b4332;
}

.events-sub {
  margin: 6px 0 0;
  color: #73808d;
  font-size: 0.76rem;
}

.events-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 9px;
}

.event-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 10px 9px;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

.event-card:active {
  transform: scale(0.995);
}

.event-card:hover {
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.08);
}

.event-card-head {
  margin-bottom: 6px;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #1b4332;
  background: #e4f2e8;
}

.event-card-title {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 700;
  color: #1f2933;
}

.event-card-desc {
  margin: 6px 0 0;
  color: #677481;
  font-size: 0.76rem;
  line-height: 1.4;
}

.event-card-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 9px;
  color: #4b5563;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  z-index: 120;
}

.ev-view-box {
  width: min(430px, 100vw);
  max-height: 92dvh;
  overflow-y: auto;
  border-radius: 22px 22px 0 0;
  background: #fff;
  box-shadow: 0 -10px 32px rgba(0, 0, 0, 0.24);
}

.ev-view-handle {
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: #d1d5db;
  margin: 10px auto 8px;
}

.ev-view-hero {
  position: relative;
  min-height: 108px;
  background: radial-gradient(circle at 75% 15%, #2f8b5f 0%, #1b4332 45%, #112a1f 100%);
}

.ev-view-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.35) 100%);
}

.ev-view-hero-content {
  position: relative;
  z-index: 1;
  padding: 16px 16px 14px;
  color: #fff;
}

.ev-view-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: rgba(56, 189, 137, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ev-view-title {
  margin: 8px 0 0;
  font-size: 1.3rem;
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: #fff;
}

.ev-view-close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.ev-view-body {
  padding: 12px 12px 14px;
}

.ev-view-info-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.ev-view-info-item {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ev-view-info-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ev-view-info-icon--date { color: #0ea5e9; background: #e0f2fe; }
.ev-view-info-icon--time { color: #d97706; background: #fef3c7; }
.ev-view-info-icon--loc  { color: #db2777; background: #fce7f3; }

.ev-view-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ev-view-info-label {
  font-size: 0.72rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.ev-view-info-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
}

.ev-view-desc-wrap {
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 9px 10px;
}

.ev-view-desc-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.ev-view-desc {
  margin: 8px 0 0;
  color: #374151;
  font-size: 0.85rem;
  line-height: 1.5;
}

.ev-view-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.ev-view-close-btn {
  border: 1px solid #d1d5db;
  background: #1b4332;
  color: #fff;
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .events-wrap { padding: 10px 10px 14px; }
}
</style>
