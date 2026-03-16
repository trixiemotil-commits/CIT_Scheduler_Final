
<template>
  <div class="teacher-events-layout">
    <h1 class="page-title">Events</h1>
    <p class="page-sub">View school events posted by admin</p>
    <div class="events-grid">
      <div v-for="ev in events" :key="ev.id" class="event-card event-card--clickable" @click="openViewEvent(ev)">
        <div class="event-card-head">
          <span class="event-badge event-badge--active">Active</span>
        </div>
        <div class="event-card-title">{{ ev.title }}</div>
        <div class="event-card-desc">{{ ev.description }}</div>
        <div class="event-card-meta">
          <span class="event-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ ev.date }}
          </span>
          <span class="event-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ ev.time }}
          </span>
          <span class="event-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ ev.location }}
          </span>
        </div>
      </div>
      <div v-if="!events.length" class="events-empty">
        <span>No events available.</span>
      </div>
    </div>

    <!-- View Event Modal -->
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="ev-view-box" v-if="viewEvent">
          <div class="ev-view-hero">
            <div class="ev-view-hero-overlay"></div>
            <div class="ev-view-hero-content">
              <span class="ev-view-badge ev-view-badge--active">
                <svg width="9" height="9" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                Active
              </span>
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
                  <span class="ev-view-info-val">{{ viewEvent.date }}</span>
                </div>
              </div>
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--time">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Time</span>
                  <span class="ev-view-info-val">{{ viewEvent.time }}</span>
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
            <div v-if="viewEvent.description" class="ev-view-desc-wrap">
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
  </div>
</template>

<script setup>
import { ref } from 'vue';

// TODO: Replace with API call to fetch admin events
const events = ref([
  { id: 1, title: 'Faculty Meeting', description: 'Quarterly faculty alignment and planning meeting.', date: '2026-03-10', time: '09:00 AM', location: 'Room 301', status: 'active' },
  { id: 2, title: 'CIT Foundation Day', description: 'Annual celebration of the CIT founding anniversary.', date: '2026-03-15', time: '08:00 AM', location: 'Auditorium', status: 'active' },
  { id: 3, title: 'Enrollment Period', description: 'Regular enrollment for the upcoming semester.', date: '2026-04-01', time: '07:00 AM', location: 'Registrar Office', status: 'active' }
])

const showViewModal = ref(false)
const viewEvent = ref(null)

function openViewEvent(ev) {
  viewEvent.value = ev
  showViewModal.value = true
}
</script>

<style scoped>
.teacher-events-layout {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.page-sub {
  color: #888;
  margin-bottom: 2rem;
}
.events-grid {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.event-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px #0001;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  min-width: 320px;
  max-width: 350px;
  flex: 1 1 320px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.event-card--clickable:hover {
  box-shadow: 0 4px 16px #0002;
}
.event-badge {
  display: inline-block;
  background: #d1fae5;
  color: #059669;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.2rem 0.7rem;
  margin-bottom: 0.5rem;
}
.event-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.event-card-desc {
  color: #555;
  margin-bottom: 0.7rem;
}
.event-card-meta {
  display: flex;
  gap: 1.2rem;
  color: #666;
  font-size: 0.97rem;
  align-items: center;
}
.event-meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.events-empty {
  color: #888;
  font-size: 1.1rem;
  margin-top: 2rem;
}
/* Modal styles (copied from admin for consistency) */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #0007;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ev-view-box {
  background: #fff;
  border-radius: 18px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 8px 32px #0003;
  overflow: hidden;
}
.ev-view-hero {
  background: linear-gradient(120deg, #14532d 60%, #059669 100%);
  padding: 2.2rem 1.5rem 1.2rem 1.5rem;
  position: relative;
}
.ev-view-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0002 60%, #fff0 100%);
  pointer-events: none;
}
.ev-view-hero-content {
  position: relative;
  z-index: 2;
}
.ev-view-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #d1fae5;
  color: #059669;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.2rem 0.7rem;
  margin-bottom: 0.7rem;
}
.ev-view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
}
.ev-view-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  cursor: pointer;
  color: #fff;
  z-index: 3;
}
.ev-view-body {
  padding: 1.5rem 1.5rem 1.2rem 1.5rem;
}
.ev-view-info-row {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}
.ev-view-info-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.ev-view-info-icon {
  color: #059669;
}
.ev-view-info-label {
  font-size: 0.85rem;
  color: #888;
}
.ev-view-info-val {
  font-size: 1.05rem;
  font-weight: 600;
}
.ev-view-desc-wrap {
  margin-bottom: 1.2rem;
}
.ev-view-desc-label {
  font-size: 0.95rem;
  color: #888;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.ev-view-desc {
  color: #444;
  font-size: 1.08rem;
}
.ev-view-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.ev-view-close-btn {
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.ev-view-close-btn:hover {
  background: #14532d;
}
</style>
