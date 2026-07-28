<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <StudentRefresher :refresh="loadEvents" />
      <div class="mobile-app">
        <div class="app-header">
          <button class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="header-title">Events</div>
        </div>

        <section class="events-wrap">
          <header class="events-head">
            <h1 class="events-title">Events</h1>
            <p class="events-sub">View school events and announcements</p>
          </header>

          <div class="events-tabs-mobile">
            <button :class="['tab-btn', { active: eventsTab === 'active' }]" @click="eventsTab = 'active'">Active</button>
          </div>

          <div class="events-grid">
            <template v-if="eventsTab === 'active'">
              <p v-if="eventsLoading">Loading events…</p>
              <p v-else-if="eventsError">{{ eventsError }}</p>
              <p v-else-if="!activeEvents.length">No active events. Click + to create one.</p>
              <article
                v-for="ev in activeEvents"
                :key="ev.id"
                class="event-card"
                @click="openViewEvent(ev)"
              >
                <img v-if="ev.image" :src="ev.image" class="event-card-cover-image" alt="" />
                <div v-else class="event-card-default-cover" :style="eventCoverStyle(ev)">
                  <span>{{ eventInitials(ev.title) }}</span><small>CIT SCHEDULER EVENT</small>
                </div>
                <div class="event-card-head">
                  <span class="event-badge">Active</span>
                  <div v-if="false" class="event-card-actions">
                    <button class="ec-btn ec-btn--edit" @click.stop="openEditEvent(ev)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="ec-btn ec-btn--archive" @click.stop="archiveEvent(ev)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    </button>
                  </div>
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
                    {{ ev.time }}{{ ev.endTime ? ` – ${ev.endTime}` : '' }}
                  </span>
                  <span class="meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ ev.location }}
                  </span>
                </div>
              </article>
            </template>

            <template v-else>
              <p v-if="eventsLoading">Loading events…</p>
              <p v-else-if="!archivedEvents.length">No archived events.</p>
              <article
                v-for="ev in archivedEvents"
                :key="ev.id"
                class="event-card event-card--archived"
                @click="openViewEvent(ev)"
              >
                <img v-if="ev.image" :src="ev.image" class="event-card-cover-image" alt="" />
                <div v-else class="event-card-default-cover" :style="eventCoverStyle(ev)">
                  <span>{{ eventInitials(ev.title) }}</span><small>CIT SCHEDULER EVENT</small>
                </div>
                <div class="event-card-head">
                  <span class="event-badge event-badge--archived">Archived</span>
                  <div v-if="false" class="event-card-actions">
                    <button class="ec-btn ec-btn--restore" @click.stop="archiveEvent(ev)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg>
                    </button>
                    <button class="ec-btn ec-btn--delete" @click.stop="deleteEvent(ev)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
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
                    {{ ev.time }}{{ ev.endTime ? ` – ${ev.endTime}` : '' }}
                  </span>
                  <span class="meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ ev.location }}
                  </span>
                </div>
              </article>
            </template>
          </div>
        </section>
      </div>

      <!-- View Event Modal -->
      <Teleport to="body">
        <div v-if="showViewModal" class="modal-overlay-mobile" @click.self="showViewModal = false">
          <div class="modal-box-mobile" v-if="viewEvent">
            <div class="modal-header-mobile">
              <h2>{{ viewEvent.title }}</h2>
              <button class="modal-close-btn" @click="showViewModal = false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body-mobile">
              <img v-if="viewEvent.image" :src="viewEvent.image" class="modal-event-cover" alt="" />
              <div v-else class="modal-event-cover event-card-default-cover" :style="eventCoverStyle(viewEvent)">
                <span>{{ eventInitials(viewEvent.title) }}</span><small>CIT SCHEDULER EVENT</small>
              </div>
              <p class="modal-desc">{{ viewEvent.description }}</p>
              <div class="modal-info-grid">
                <div class="info-item">
                  <span class="info-label">Date</span>
                  <span class="info-val">{{ viewEvent.date ? formatDisplayDate(viewEvent.date) : '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Time</span>
                  <span class="info-val">{{ viewEvent.time ? `${formatDisplayTime(viewEvent.time)}${viewEvent.endTime ? ` – ${formatDisplayTime(viewEvent.endTime)}` : ''}` : '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location</span>
                  <span class="info-val">{{ viewEvent.location || '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Add / Edit Event Modal -->
      <Teleport to="body">
        <div v-if="false && showEventModal" class="modal-overlay-mobile" @click.self="showEventModal = false">
          <div class="event-modal-mobile">
            <div class="modal-header-mobile">
              <h2>{{ editingEvent ? 'Edit Event' : 'Add Event' }}</h2>
              <button class="modal-close-btn" @click="showEventModal = false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form @submit.prevent="saveEvent" class="event-form-mobile">
              <div class="form-group">
                <label>Event Title *</label>
                <input v-model="eventForm.title" type="text" placeholder="e.g. Football Game" required />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea v-model="eventForm.description" placeholder="Brief description…" rows="3"></textarea>
              </div>

              <div class="form-group">
                <label>Date</label>
                <input
                  v-model="eventForm.date"
                  type="date"
                  :min="editingEvent ? undefined : todayDate"
                />
              </div>

              <div class="form-group">
                <label>Time</label>
                <input v-model="eventForm.time" type="time" />
              </div>

              <div class="form-group">
                <label>Location</label>
                <input v-model="eventForm.location" type="text" placeholder="e.g. Sports Field" />
              </div>

              <div class="form-actions-mobile">
                <button type="button" class="btn-cancel" @click="showEventModal = false">Cancel</button>
                <button type="submit" class="btn-submit">
                  {{ editingEvent ? 'Save Changes' : 'Add Event' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { getToken } from '@/auth.js'
import StudentRefresher from '@/components/student/StudentRefresher.vue'
import { eventCoverStyle, eventInitials } from '@/utils/eventCover.js'
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// State
const events = ref([])
const eventsLoading = ref(false)
const eventsError = ref('')
const eventsTab = ref('active')

const showViewModal = ref(false)
const viewEvent = ref(null)

const showEventModal = ref(false)
const editingEvent = ref(null)
const eventForm = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  image: '',
  teacherIds: []
})

const todayDate = (() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})()

// Computed
const activeEvents = computed(() => events.value.filter(e => e.status === 'active'))
const archivedEvents = computed(() => events.value.filter(e => e.status === 'archived'))

// Formatting
function formatDisplayDate(date) {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDisplayTime(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

// API
async function eventRequest(path = '', options = {}) {
  const token = getToken()
  if (!token) throw new Error('Session expired. Please log in again.')

  const response = await fetch(`${API_BASE}/events${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Unable to save the event.')
  return payload
}

async function loadEvents() {
  try {
    eventsLoading.value = true
    eventsError.value = ''
    const payload = await eventRequest()
    events.value = Array.isArray(payload.events) ? payload.events : []
  } catch (error) {
    eventsError.value = error.message || 'Failed to load events'
    events.value = []
  } finally {
    eventsLoading.value = false
  }
}

// Modal handlers
function openViewEvent(ev) {
  viewEvent.value = ev
  showViewModal.value = true
}

function openAddEvent() {
  editingEvent.value = null
  eventForm.value = { title: '', description: '', date: '', time: '', location: '', image: '', teacherIds: [] }
  showEventModal.value = true
}

function openEditEvent(ev) {
  editingEvent.value = ev
  eventForm.value = {
    title: ev.title,
    description: ev.description,
    date: ev.date,
    time: ev.time,
    location: ev.location,
    image: ev.image || '',
    teacherIds: [...(ev.teacherIds || [])]
  }
  showEventModal.value = true
}

async function saveEvent() {
  if (!eventForm.value.title.trim()) return
  if (!editingEvent.value && eventForm.value.date && eventForm.value.date < todayDate) {
    window.alert('New events cannot use a past date.')
    return
  }
  try {
    const path = editingEvent.value ? `/${editingEvent.value.id}` : ''
    const method = editingEvent.value ? 'PATCH' : 'POST'
    await eventRequest(path, {
      method,
      body: JSON.stringify({
        ...eventForm.value,
        ...(editingEvent.value ? { status: editingEvent.value.status } : {}),
      }),
    })
    await loadEvents()
    showEventModal.value = false
  } catch (error) {
    window.alert(error.message)
  }
}

async function archiveEvent(ev) {
  try {
    await eventRequest(`/${ev.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...ev, status: ev.status === 'active' ? 'archived' : 'active' }),
    })
    await loadEvents()
  } catch (error) {
    window.alert(error.message)
  }
}

async function deleteEvent(ev) {
  try {
    await eventRequest(`/${ev.id}`, { method: 'DELETE' })
    await loadEvents()
  } catch (error) {
    window.alert(error.message)
  }
}

onMounted(loadEvents)
</script>

<style scoped>
.mobile-app {
  background: #fff;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}

.back-btn,
.add-event-mobile-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:active,
.add-event-mobile-btn:active {
  background: #e5e5e5;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  flex: 1;
  text-align: center;
}

.events-wrap {
  padding: 16px 16px 24px;
}

.events-head {
  margin-bottom: 16px;
}

.events-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.events-sub {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.events-tabs-mobile {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #333;
  color: #fff;
}

.events-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.event-card:active {
  background: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.event-card--archived {
  opacity: 0.7;
}

.event-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  background: #d8dcdf;
  color: #4f575f;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.event-badge--archived {
  background: #f0f0f0;
  color: #888;
}

.event-card-actions {
  display: flex;
  gap: 4px;
}

.ec-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 0.75rem;
}

.ec-btn--edit {
  color: #2563eb;
}

.ec-btn--archive {
  color: #666;
}

.ec-btn--restore {
  color: #666;
}

.ec-btn--delete {
  color: #e63946;
}

.event-card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
  line-height: 1.3;
}

.event-card-desc {
  font-size: 0.8rem;
  color: #666;
  margin: 0 0 8px;
  line-height: 1.4;
}

.event-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #555;
}

/* Modals */
.modal-overlay-mobile {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  width: min(430px, 100vw);
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-box-mobile,
.event-modal-mobile {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 430px;
  max-height: 88dvh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 -12px 35px rgba(0, 0, 0, 0.2);
}

.modal-header-mobile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header-mobile h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body-mobile {
  padding: 16px;
}

.modal-desc {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px;
}

.modal-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.info-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-edit-btn {
  width: 100%;
  padding: 12px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Event Form */
.event-form-mobile {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-group input,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1a1a1a;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.form-actions-mobile {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e5e5;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-cancel:active {
  background: #e5e5e5;
}

.btn-submit {
  background: #333;
  color: #fff;
}

.btn-submit:active {
  opacity: 0.9;
}
</style>
