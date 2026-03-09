<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: currentRoute === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- Logout -->
      <button class="logout-btn" @click="showLogoutModal = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="main">
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Events</h1>
          <p class="page-sub">Manage and track school events</p>
        </div>
      </header>

      <!-- ── Events Section ── -->

      <!-- Top bar -->
      <div class="events-topbar">
        <div class="events-tabs">
          <button :class="['ev-tab', { active: eventsTab === 'active' }]" @click="eventsTab = 'active'">Active Events</button>
          <button :class="['ev-tab', { active: eventsTab === 'archived' }]" @click="eventsTab = 'archived'">
            Archived
            <span v-if="archivedEvents.length" class="ev-tab-count">{{ archivedEvents.length }}</span>
          </button>
        </div>
        <button class="add-event-btn" @click="openAddEvent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Event
        </button>
      </div>

      <!-- Events Grid -->
      <div class="events-grid">
        <template v-if="eventsTab === 'active'">
          <div v-for="ev in activeEvents" :key="ev.id" class="event-card event-card--clickable" @click="openViewEvent(ev)">
            <div v-if="ev.image" class="event-card-img-wrap">
              <img :src="ev.image" class="event-card-img" alt="" />
            </div>
            <div class="event-card-head">
              <span class="event-badge event-badge--active">Active</span>
              <div class="event-card-actions">
                <button class="ec-btn ec-btn--edit" @click.stop="openEditEvent(ev)" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button class="ec-btn ec-btn--archive" @click.stop="archiveEvent(ev)" title="Archive">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  Archive
                </button>
              </div>
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
          <div v-if="!activeEvents.length" class="events-empty">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>No active events. Click <strong>Add Event</strong> to create one.</span>
          </div>
        </template>

        <template v-else>
          <div v-for="ev in archivedEvents" :key="ev.id" class="event-card event-card--archived event-card--clickable" @click="openViewEvent(ev)">
            <div v-if="ev.image" class="event-card-img-wrap">
              <img :src="ev.image" class="event-card-img" alt="" />
            </div>
            <div class="event-card-head">
              <span class="event-badge event-badge--archived">Archived</span>
              <div class="event-card-actions">
                <button class="ec-btn ec-btn--restore" @click.stop="archiveEvent(ev)" title="Restore">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg>
                  Restore
                </button>
                <button class="ec-btn ec-btn--delete" @click.stop="deleteEvent(ev)" title="Delete permanently">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete
                </button>
              </div>
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
          <div v-if="!archivedEvents.length" class="events-empty">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            <span>No archived events.</span>
          </div>
        </template>
      </div>
    </main>

    <!-- ═══ View Event Modal ═══ -->
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="ev-view-box" v-if="viewEvent">

          <!-- Hero -->
          <div class="ev-view-hero" :style="viewEvent.image ? `background-image:url('${viewEvent.image}')` : ''">
            <div class="ev-view-hero-overlay"></div>
            <div class="ev-view-hero-content">
              <span :class="['ev-view-badge', viewEvent.status === 'active' ? 'ev-view-badge--active' : 'ev-view-badge--archived']">
                <svg v-if="viewEvent.status === 'active'" width="9" height="9" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                {{ viewEvent.status === 'active' ? 'Active' : 'Archived' }}
              </span>
              <h2 class="ev-view-title">{{ viewEvent.title }}</h2>
            </div>
            <button class="ev-view-close" @click="showViewModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="ev-view-body">

            <!-- Info row -->
            <div class="ev-view-info-row">
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--date">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Date</span>
                  <span class="ev-view-info-val">{{ viewEvent.date ? formatDisplayDate(viewEvent.date) : '—' }}</span>
                </div>
              </div>
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--time">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Time</span>
                  <span class="ev-view-info-val">{{ viewEvent.time ? formatDisplayTime(viewEvent.time) : '—' }}</span>
                </div>
              </div>
              <div class="ev-view-info-item">
                <div class="ev-view-info-icon ev-view-info-icon--loc">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div class="ev-view-info-text">
                  <span class="ev-view-info-label">Location</span>
                  <span class="ev-view-info-val">{{ viewEvent.location || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="viewEvent.description" class="ev-view-desc-wrap">
              <div class="ev-view-desc-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                Description
              </div>
              <p class="ev-view-desc">{{ viewEvent.description }}</p>
            </div>

            <!-- Footer actions -->
            <div class="ev-view-actions">
              <button class="ev-view-close-btn" @click="showViewModal = false">Close</button>
              <button class="ev-view-edit-btn" @click="showViewModal = false; openEditEvent(viewEvent)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Add / Edit Event Modal ═══ -->
    <Teleport to="body">
      <div v-if="showEventModal" class="modal-overlay" @click.self="showEventModal = false">
        <div class="event-modal-box">

          <!-- Banner header -->
          <div class="ev-modal-banner">
            <div class="ev-modal-banner-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="ev-modal-banner-text">
              <h2 class="ev-modal-banner-title">{{ editingEvent ? 'Edit Event' : 'Add Event' }}</h2>
              <p class="ev-modal-banner-sub">{{ editingEvent ? 'Update the event details below' : 'Fill in the details for the new event' }}</p>
            </div>
            <button class="ev-modal-close" @click="showEventModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Form body -->
          <form @submit.prevent="saveEvent" class="event-form">

            <!-- Title -->
            <div class="form-group">
              <label class="form-label">Event Title <span class="form-required">*</span></label>
              <div class="fi-wrap">
                <svg class="fi-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                <input v-model="eventForm.title" type="text" placeholder="e.g. Faculty Meeting" class="form-input fi-input" required />
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea v-model="eventForm.description" placeholder="Brief description of the event…" class="form-input form-textarea" rows="3"></textarea>
            </div>

            <!-- Date & Time -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date</label>
                <div class="fi-wrap">
                  <svg class="fi-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <input v-model="eventForm.date" type="date" class="form-input fi-input" />
                </div>
              </div>

              <!-- Custom Time Picker -->
              <div class="form-group">
                <label class="form-label">Time</label>
                <div class="time-picker-wrap" v-click-outside="() => showTimePicker = false">
                  <div class="time-display" :class="{ 'time-display--open': showTimePicker }" @click="showTimePicker = !showTimePicker">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span :class="eventForm.time ? 'td-val' : 'td-placeholder'">{{ eventForm.time ? formatDisplayTime(eventForm.time) : 'Select time' }}</span>
                    <svg class="td-chevron" :class="{ 'td-chevron--open': showTimePicker }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showTimePicker" class="time-picker-panel">
                    <div class="tp-cols">
                      <!-- Hours -->
                      <div class="tp-col">
                        <div class="tp-col-label">HH</div>
                        <div class="tp-col-scroll">
                          <div
                            v-for="h in pickerHours" :key="h"
                            :class="['tp-cell', { 'tp-cell--active': tempHour === h }]"
                            @click="tempHour = h"
                          >{{ h }}</div>
                        </div>
                      </div>
                      <div class="tp-sep">:</div>
                      <!-- Minutes -->
                      <div class="tp-col">
                        <div class="tp-col-label">MM</div>
                        <div class="tp-col-scroll">
                          <div
                            v-for="m in pickerMinutes" :key="m"
                            :class="['tp-cell', { 'tp-cell--active': tempMinute === m }]"
                            @click="tempMinute = m"
                          >{{ m }}</div>
                        </div>
                      </div>
                      <!-- AM/PM -->
                      <div class="tp-col tp-col--period">
                        <div class="tp-col-label">AM/PM</div>
                        <div class="tp-ampm">
                          <div :class="['tp-ampm-cell', { 'tp-ampm-cell--active': tempPeriod === 'AM' }]" @click="tempPeriod = 'AM'">AM</div>
                          <div :class="['tp-ampm-cell', { 'tp-ampm-cell--active': tempPeriod === 'PM' }]" @click="tempPeriod = 'PM'">PM</div>
                        </div>
                      </div>
                    </div>
                    <div class="tp-preview">{{ tempHour }}:{{ tempMinute }} {{ tempPeriod }}</div>
                    <button type="button" class="tp-confirm-btn" @click="confirmTime">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Confirm Time
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location -->
            <div class="form-group">
              <label class="form-label">Location</label>
              <div class="fi-wrap">
                <svg class="fi-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input v-model="eventForm.location" type="text" placeholder="e.g. Room 301, Auditorium" class="form-input fi-input" />
              </div>
            </div>

            <!-- Image upload -->
            <div class="form-group">
              <label class="form-label">Event Image</label>
              <div
                class="img-upload-area"
                :class="{ 'img-upload-area--has': imagePreview }"
                @click="$refs.imgInput.click()"
                @dragover.prevent
                @drop.prevent="handleImageDrop"
              >
                <template v-if="imagePreview">
                  <img :src="imagePreview" class="img-upload-preview" alt="Preview" />
                  <button type="button" class="img-remove-btn" @click.stop="removeImage">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </template>
                <template v-else>
                  <div class="img-upload-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <span class="img-upload-hint">Click to upload or drag &amp; drop</span>
                  <span class="img-upload-sub">PNG, JPG, WEBP · max 5 MB</span>
                </template>
              </div>
              <input ref="imgInput" type="file" accept="image/*" class="img-file-input" @change="handleImageUpload" />
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" class="ev-cancel-btn" @click="showEventModal = false">Cancel</button>
              <button type="submit" class="ev-submit-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ editingEvent ? 'Save Changes' : 'Add Event' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <div class="logout-modal-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 class="logout-modal-title">Log Out</h2>
          <p class="logout-modal-sub">Are you sure you want to log out?</p>
          <div class="logout-modal-actions">
            <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
            <button class="logout-confirm-btn" @click="confirmLogout">Log Out</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { logout } from '@/auth.js'

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._clickOutside) }
}

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/admin/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Manage Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

/* ── Events ── */
const showEventModal = ref(false)
const editingEvent   = ref(null)
const eventsTab      = ref('active')
const eventForm      = ref({ title: '', description: '', date: '', time: '', location: '', image: '' })
const imagePreview   = ref('')
const imgInput       = ref(null)

/* ── Time Picker ── */
const showTimePicker = ref(false)
const tempHour   = ref('12')
const tempMinute = ref('00')
const tempPeriod = ref('AM')

const pickerHours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const pickerMinutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function formatDisplayDate(date) {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDisplayTime(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function syncPickerToTime(time24) {
  if (!time24) { tempHour.value = '12'; tempMinute.value = '00'; tempPeriod.value = 'AM'; return }
  const [hh, mm] = time24.split(':').map(Number)
  tempPeriod.value = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 || 12
  tempHour.value   = String(h12).padStart(2, '0')
  const snapped = Math.round(mm / 5) * 5
  tempMinute.value = String(snapped >= 60 ? 55 : snapped).padStart(2, '0')
}

function confirmTime() {
  let h = parseInt(tempHour.value)
  if (tempPeriod.value === 'AM') { if (h === 12) h = 0 }
  else { if (h !== 12) h += 12 }
  eventForm.value.time = `${String(h).padStart(2, '0')}:${tempMinute.value}`
  showTimePicker.value = false
}

const events = ref([
  { id: 1, title: 'Faculty Meeting',    description: 'Quarterly faculty alignment and planning meeting.',    date: '2026-03-10', time: '09:00', location: 'Room 301',         status: 'active'   },
  { id: 2, title: 'CIT Foundation Day', description: 'Annual celebration of the CIT founding anniversary.', date: '2026-03-15', time: '08:00', location: 'Auditorium',       status: 'active'   },
  { id: 3, title: 'Enrollment Period',  description: 'Regular enrollment for the upcoming semester.',       date: '2026-04-01', time: '07:00', location: 'Registrar Office', status: 'active'   },
  { id: 4, title: 'IT Summit 2025',     description: 'Annual IT summit for tech updates and networking.',   date: '2025-11-20', time: '09:00', location: 'Main Hall',        status: 'archived' },
])

const activeEvents   = computed(() => events.value.filter(e => e.status === 'active'))
const archivedEvents = computed(() => events.value.filter(e => e.status === 'archived'))

function openAddEvent() {
  editingEvent.value = null
  eventForm.value = { title: '', description: '', date: '', time: '', location: '', image: '' }
  imagePreview.value = ''
  showTimePicker.value = false
  syncPickerToTime('')
  if (imgInput.value) imgInput.value.value = ''
  showEventModal.value = true
}

function openEditEvent(ev) {
  editingEvent.value = ev
  eventForm.value = { title: ev.title, description: ev.description, date: ev.date, time: ev.time, location: ev.location, image: ev.image || '' }
  imagePreview.value = ev.image || ''
  showTimePicker.value = false
  syncPickerToTime(ev.time || '')
  if (imgInput.value) imgInput.value.value = ''
  showEventModal.value = true
}

function handleImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { imagePreview.value = ev.target.result; eventForm.value.image = ev.target.result }
  reader.readAsDataURL(file)
}

function handleImageDrop(e) {
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (ev) => { imagePreview.value = ev.target.result; eventForm.value.image = ev.target.result }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = ''
  eventForm.value.image = ''
  if (imgInput.value) imgInput.value.value = ''
}

function saveEvent() {
  if (!eventForm.value.title.trim()) return
  if (editingEvent.value) {
    Object.assign(editingEvent.value, { ...eventForm.value })
  } else {
    events.value.push({ id: Date.now(), ...eventForm.value, status: 'active' })
  }
  showEventModal.value = false
}

function archiveEvent(ev) {
  ev.status = ev.status === 'active' ? 'archived' : 'active'
}

function deleteEvent(ev) {
  events.value = events.value.filter(e => e.id !== ev.id)
}

/* ── View Event Modal ── */
const showViewModal = ref(false)
const viewEvent     = ref(null)

function openViewEvent(ev) {
  viewEvent.value = ev
  showViewModal.value = true
}
</script>

<style scoped>
/* ── Layout ── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

/* ═══ SIDEBAR ═══ */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  text-align: center;
}
.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  border: 3px solid #c8ddd4;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
.role  { font-size: 0.88rem; color: #444; font-weight: 500; }
.email { font-size: 0.82rem; color: #888; word-break: break-all; }

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 400;
  color: #444;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
}
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

/* Logout */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ═══ MAIN ═══ */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Logout Modal */
.logout-modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 360px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
}
.logout-modal-icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 6px;
  width: 100%;
}
.logout-cancel-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #e63946;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  transition: background 0.15s;
}
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #1b4332;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.logout-confirm-btn:hover { background: #2d6a4f; }

/* ═══ EVENTS SECTION ═══ */
.events-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.events-tabs { display: flex; gap: 6px; }
.ev-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 10px;
  transition: background 0.18s, color 0.18s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ev-tab:hover  { background: #f0faf3; color: #1b4332; }
.ev-tab.active { background: #1b4332; color: #fff; }
.ev-tab-count {
  background: #e63946;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 20px;
  padding: 1px 7px;
  line-height: 1.5;
}
.add-event-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #1b4332;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.add-event-btn:hover { background: #2d6a4f; }

/* Events Grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 1100px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px)  { .events-grid { grid-template-columns: 1fr; } }

.event-card {
  background: #fff;
  border-radius: 16px;
  padding: 22px 24px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s;
}
.event-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.11); }
.event-card--archived { opacity: 0.75; }
.event-card--archived:hover { opacity: 1; }

.event-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.event-badge {
  font-size: 0.73rem;
  font-weight: 600;
  padding: 3px 11px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.event-badge--active   { background: #d8f3e8; color: #1b7a4a; }
.event-badge--archived { background: #f0f0f0; color: #888; }

.event-card-actions { display: flex; gap: 6px; }
.ec-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 5px 11px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ec-btn--edit    { background: #eef4fe; color: #2563eb; }
.ec-btn--edit:hover { background: #dceafd; }
.ec-btn--archive { background: #f5f5f5; color: #555; }
.ec-btn--archive:hover { background: #e8e8e8; }
.ec-btn--restore { background: #d8f3e8; color: #1b7a4a; }
.ec-btn--restore:hover { background: #c0ebd5; }
.ec-btn--delete  { background: #ffeaea; color: #e63946; }
.ec-btn--delete:hover { background: #fdd; }

.event-card-title { font-size: 1.05rem; font-weight: 700; color: #111; line-height: 1.3; }
.event-card-desc  { font-size: 0.84rem; color: #777; line-height: 1.5; }
.event-card-meta  { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.event-meta-item  { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #555; }

.events-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 60px 20px;
  color: #bbb;
  font-size: 0.88rem;
}

.event-card-img-wrap {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 2px;
  flex-shrink: 0;
}
.event-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.event-card:hover .event-card-img { transform: scale(1.03); }

.event-card--clickable { cursor: pointer; }
.event-card--clickable:hover {
  box-shadow: 0 6px 24px rgba(27,67,50,0.13);
  transform: translateY(-2px);
  transition: box-shadow 0.2s, transform 0.2s;
}

/* ═══ VIEW EVENT MODAL ═══ */
.ev-view-box {
  background: #fff;
  border-radius: 22px;
  width: 540px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.22);
  display: flex;
  flex-direction: column;
  animation: evModalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
@keyframes evModalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
.ev-view-hero {
  position: relative;
  height: 230px;
  background: linear-gradient(135deg, #1b4332 0%, #52b788 100%);
  background-size: cover;
  background-position: center;
  border-radius: 22px 22px 0 0;
  flex-shrink: 0;
  overflow: hidden;
}
.ev-view-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%);
}
.ev-view-hero-content {
  position: absolute;
  bottom: 22px;
  left: 26px;
  right: 58px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ev-view-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
  backdrop-filter: blur(4px);
}
.ev-view-badge--active   { background: rgba(64,145,108,0.88); color: #fff; }
.ev-view-badge--archived { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.35); }
.ev-view-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
  margin: 0;
  letter-spacing: -0.3px;
}
.ev-view-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(6px);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 2;
}
.ev-view-close:hover { background: rgba(230,57,70,0.75); }

.ev-view-body { padding: 26px 28px 28px; display: flex; flex-direction: column; gap: 20px; }

.ev-view-info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ev-view-info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  background: #f7f8fa;
  border: 1.5px solid #f0f0f0;
  border-radius: 14px;
  padding: 14px 16px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.ev-view-info-item:hover { border-color: #c8ddd4; box-shadow: 0 2px 10px rgba(27,67,50,0.07); }

.ev-view-info-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ev-view-info-icon--date { background: #e0f2fe; color: #0369a1; }
.ev-view-info-icon--time { background: #fef3c7; color: #b45309; }
.ev-view-info-icon--loc  { background: #fce7f3; color: #be185d; }
.ev-view-info-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ev-view-info-label { font-size: 0.68rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.6px; }
.ev-view-info-val   { font-size: 0.9rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ev-view-desc-wrap { background: #f7f8fa; border: 1.5px solid #f0f0f0; border-radius: 14px; padding: 16px 20px; }
.ev-view-desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 10px;
}
.ev-view-desc { font-size: 0.92rem; color: #444; line-height: 1.7; margin: 0; }

.ev-view-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
  border-top: 1.5px solid #f0f0f0;
  margin-top: 2px;
}
.ev-view-close-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.ev-view-close-btn:hover { background: #f5f5f5; border-color: #bbb; color: #333; }
.ev-view-edit-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27,67,50,0.25);
  transition: opacity 0.18s, box-shadow 0.18s, transform 0.15s;
}
.ev-view-edit-btn:hover { opacity: 0.92; box-shadow: 0 6px 20px rgba(27,67,50,0.32); transform: translateY(-1px); }

/* ═══ ADD / EDIT EVENT MODAL ═══ */
.event-modal-box {
  background: #fff;
  border-radius: 20px;
  width: 560px;
  max-width: 95vw;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  position: relative;
}
.ev-modal-banner {
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
  padding: 26px 28px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 20px 20px 0 0;
  position: relative;
}
.ev-modal-banner-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ev-modal-banner-text { flex: 1; }
.ev-modal-banner-title { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 4px; line-height: 1.2; }
.ev-modal-banner-sub   { font-size: 0.82rem; color: rgba(255,255,255,0.72); margin: 0; }
.ev-modal-close {
  position: absolute;
  top: 16px;
  right: 18px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.ev-modal-close:hover { background: rgba(255,255,255,0.28); }

.event-form { display: flex; flex-direction: column; gap: 18px; padding: 26px 28px 28px; }
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-label { font-size: 0.78rem; font-weight: 700; color: #666; letter-spacing: 0.4px; text-transform: uppercase; }
.form-required { color: #e63946; }
.form-input {
  font-family: inherit;
  font-size: 0.88rem;
  color: #111;
  background: #f7f8fa;
  border: 1.5px solid #ececec;
  border-radius: 10px;
  padding: 11px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
}
.form-input::placeholder { color: #c0c4cc; }
.form-input:focus { border-color: #2d6a4f; background: #fff; box-shadow: 0 0 0 3px rgba(45,106,79,0.09); }
.form-textarea { resize: vertical; min-height: 84px; line-height: 1.6; }

.fi-wrap  { position: relative; display: flex; align-items: center; }
.fi-icon  { position: absolute; left: 13px; color: #2d6a4f; pointer-events: none; flex-shrink: 0; }
.fi-input { padding-left: 38px !important; }

/* Time picker */
.time-picker-wrap { position: relative; }
.time-display {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f7f8fa;
  border: 1.5px solid #ececec;
  border-radius: 10px;
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  user-select: none;
  color: #2d6a4f;
}
.time-display:hover,
.time-display--open { border-color: #2d6a4f; background: #fff; box-shadow: 0 0 0 3px rgba(45,106,79,0.09); }
.td-val         { flex: 1; font-size: 0.88rem; font-weight: 600; color: #111; }
.td-placeholder { flex: 1; font-size: 0.88rem; color: #c0c4cc; }
.td-chevron { color: #aaa; transition: transform 0.2s; flex-shrink: 0; }
.td-chevron--open { transform: rotate(180deg); color: #2d6a4f; }
.time-picker-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  border: 1px solid #ececec;
  z-index: 200;
  overflow: hidden;
  padding: 16px 14px 14px;
}
.tp-cols { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 12px; }
.tp-col  { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.tp-col--period { flex: 0 0 58px; }
.tp-col-label { font-size: 0.68rem; font-weight: 700; color: #aaa; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
.tp-col-scroll { width: 100%; max-height: 152px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; scrollbar-width: thin; scrollbar-color: #c8ddd4 transparent; }
.tp-col-scroll::-webkit-scrollbar { width: 4px; }
.tp-col-scroll::-webkit-scrollbar-thumb { background: #c8ddd4; border-radius: 4px; }
.tp-cell { padding: 7px 6px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; color: #444; text-align: center; cursor: pointer; transition: background 0.12s, color 0.12s; }
.tp-cell:hover { background: #f0faf3; color: #1b4332; }
.tp-cell--active { background: #1b4332; color: #fff; font-weight: 700; }
.tp-sep { font-size: 1.15rem; font-weight: 700; color: #ccc; padding-top: 34px; flex-shrink: 0; }
.tp-ampm { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.tp-ampm-cell { padding: 8px 6px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; text-align: center; cursor: pointer; background: #f5f5f5; color: #666; transition: background 0.12s, color 0.12s; }
.tp-ampm-cell:hover { background: #f0faf3; color: #1b4332; }
.tp-ampm-cell--active { background: #1b4332; color: #fff; }
.tp-preview { text-align: center; font-size: 1.4rem; font-weight: 700; color: #1b4332; letter-spacing: 2px; margin-bottom: 12px; background: #f0faf3; border-radius: 10px; padding: 10px 0; }
.tp-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px 0;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.tp-confirm-btn:hover { background: #2d6a4f; }

/* Image upload */
.img-file-input { display: none; }
.img-upload-icon-wrap { width: 50px; height: 50px; background: #e8f5ee; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
.img-upload-area {
  border: 2px dashed #d9dde5;
  border-radius: 12px;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  background: #f7f8fa;
  position: relative;
  overflow: hidden;
  min-height: 112px;
  transition: border-color 0.18s, background 0.18s;
}
.img-upload-area:hover { border-color: #2d6a4f; background: #f0faf3; }
.img-upload-area--has  { padding: 0; border-style: solid; border-color: #c8ddd4; min-height: 168px; }
.img-upload-hint { font-size: 0.85rem; font-weight: 600; color: #444; }
.img-upload-sub  { font-size: 0.75rem; color: #aaa; }
.img-upload-preview { width: 100%; height: 168px; object-fit: cover; display: block; border-radius: 10px; }
.img-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 2;
}
.img-remove-btn:hover { background: rgba(230,57,70,0.88); }

/* Form action buttons */
.form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #f0f0f0; margin-top: 2px; }
.ev-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.ev-cancel-btn:hover { background: #f5f5f5; border-color: #ccc; }
.ev-submit-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 10px 26px;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.18s, box-shadow 0.18s;
  box-shadow: 0 4px 14px rgba(27,67,50,0.25);
}
.ev-submit-btn:hover { opacity: 0.9; box-shadow: 0 6px 18px rgba(27,67,50,0.32); }
</style>
