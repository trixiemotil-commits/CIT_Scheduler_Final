<template>
  <div class="layout admin-dashboard">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || initialsAvatar(user)" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
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
        <PublishedTermScheduleLink />
      </nav>

      <RoleSwitchButton />

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
          <span class="page-eyebrow">Dashboard</span>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="page-sub">Manage schedules, rooms, and teacher assignments</p>
        </div>
        <div class="notif-wrap" v-click-outside="() => { showNotif = false; selectedNotification = null }">
          <button class="notif-btn" @click="toggleNotifications">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span v-if="unreadNotifs.length" class="notif-dot"></span>
          </button>

          <!-- Notification Dropdown -->
          <div v-if="showNotif" class="notif-panel">
            <div class="notif-panel-header">
              <div>
                <span class="notif-panel-kicker">Activity center</span>
                <span class="notif-panel-title">Notifications</span>
              </div>
              <span v-if="unreadNotifs.length" class="notif-count">{{ unreadNotifs.length }} unread</span>
            </div>
            <div class="notif-tabs">
              <button :class="['notif-tab', { active: notifTab === 'all' }]" @click="notifTab = 'all'">All</button>
              <button :class="['notif-tab', { active: notifTab === 'unread' }]" @click="notifTab = 'unread'">Unread</button>
              <button :class="['notif-tab', { active: notifTab === 'read' } ]" @click="notifTab = 'read'">Read</button>
              <button class="notif-see-all" type="button" @click="markAllNotificationsRead">Mark all read</button>
              <button class="notif-clear-all" type="button" :disabled="isClearingNotifications || !notifications.length" @click="openClearNotificationsDialog">Clear All</button>
            </div>

            <div class="notif-list-wrap">
              <div v-if="notificationsLoading" class="notif-empty">Loading notifications...</div>

              <template v-else>
                <!-- New section -->
                <template v-if="newNotifs.length">
                  <div class="notif-section-label">New</div>
                  <ul class="notif-list">
                    <li v-for="n in newNotifs" :key="n.id" class="notif-item" :class="{ selected: selectedNotification?.id === n.id }" @click="openNotification(n, $event)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.title }}</strong><small>{{ n.message }}</small><time>{{ n.timeLabel }}</time></span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>

                <!-- Today section -->
                <template v-if="todayNotifs.length">
                  <div class="notif-section-label">Today</div>
                  <ul class="notif-list">
                    <li v-for="n in todayNotifs" :key="n.id" class="notif-item" :class="{ selected: selectedNotification?.id === n.id }" @click="openNotification(n, $event)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.title }}</strong><small>{{ n.message }}</small><time>{{ n.timeLabel }}</time></span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>

                <template v-if="earlierNotifs.length">
                  <div class="notif-section-label">Earlier</div>
                  <ul class="notif-list">
                    <li v-for="n in earlierNotifs" :key="n.id" class="notif-item" :class="{ selected: selectedNotification?.id === n.id }" @click="openNotification(n, $event)">
                      <img :src="n.avatar" class="notif-avatar" alt="" />
                      <span class="notif-text"><strong>{{ n.title }}</strong><small>{{ n.message }}</small><time>{{ n.timeLabel }}</time></span>
                      <span v-if="!n.read" class="notif-unread-dot"></span>
                    </li>
                  </ul>
                </template>

                <div v-if="!newNotifs.length && !todayNotifs.length && !earlierNotifs.length" class="notif-empty">No notifications</div>
              </template>
            </div>
          </div>

          <section v-if="showNotif && selectedNotification" class="notification-preview" :style="notificationPreviewStyle" role="dialog" aria-label="Notification details">
            <button type="button" class="notification-preview-close" aria-label="Close notification details" @click="selectedNotification = null">×</button>
            <span class="notification-preview-kicker">Notification details</span>
            <div class="notification-preview-heading">
              <img :src="selectedNotification.avatar" class="notification-preview-avatar" alt="" />
              <div>
                <h2>{{ selectedNotification.title }}</h2>
                <time>{{ selectedNotification.timeLabel }}</time>
              </div>
            </div>
            <p class="notification-preview-message">{{ selectedNotification.message }}</p>
            <dl class="notification-preview-meta">
              <div>
                <dt>From</dt>
                <dd>{{ selectedNotification.actorName || 'System notification' }}</dd>
              </div>
              <div v-if="selectedNotification.related?.status">
                <dt>Status</dt>
                <dd>{{ selectedNotification.related.status }}</dd>
              </div>
            </dl>
          </section>

          <div v-if="showClearNotificationsDialog" class="notif-clear-overlay" role="presentation" @click.self="closeClearNotificationsDialog">
            <section class="notif-clear-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-clear-notifications-title" aria-describedby="admin-clear-notifications-description">
              <div class="notif-clear-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m4 4v6m6-6v6" /></svg>
              </div>
              <h2 id="admin-clear-notifications-title">Clear all notifications?</h2>
              <p id="admin-clear-notifications-description">This will permanently delete all of your notifications.</p>
              <p v-if="clearNotificationsError" class="notif-clear-error" role="alert">{{ clearNotificationsError }}</p>
              <div class="notif-clear-actions">
                <button type="button" class="notif-clear-cancel" :disabled="isClearingNotifications" @click="closeClearNotificationsDialog">Cancel</button>
                <button type="button" class="notif-clear-confirm" :disabled="isClearingNotifications" @click="confirmClearNotifications">
                  {{ isClearingNotifications ? 'Clearing...' : 'Clear all' }}
                </button>
              </div>
            </section>
          </div>
        </div>
      </header>

      <!-- ── Dashboard Content ── -->

      <!-- Stat Cards -->
      <section class="stat-cards">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-top">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-icon" v-html="stat.icon"></span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div v-if="stat.sub" class="stat-sub">{{ stat.sub }}</div>
        </div>
      </section>

      <section class="today-teachers-section">
        <div class="today-teachers-header">
          <div>
            <span class="today-section-eyebrow"><i></i> Live schedule</span>
            <h2>Teachers with classes today</h2>
            <p>{{ todayDateLabel }} <span>Updated {{ currentTimeLabel }}</span></p>
          </div>
          <div class="today-carousel-controls" v-if="todayTeachers.length > teachersPerSlide">
            <span><i :class="{ 'is-paused': carouselAutoStopped }"></i> {{ carouselAutoStopped ? 'Paused · drag to browse' : 'Auto-sliding · swipe to pause' }}</span>
            <template v-if="carouselAutoStopped">
              <button type="button" aria-label="Previous teachers" @pointerdown.stop @click.stop="previousTodayTeachers">‹</button>
              <button type="button" aria-label="Next teachers" @pointerdown.stop @click.stop="nextTodayTeachers">›</button>
            </template>
          </div>
        </div>

        <div
          v-if="todayScheduleLoading"
          class="today-teachers-loading"
        >Loading today’s teaching schedule…</div>
        <div
          v-else-if="todayTeachers.length"
          ref="todayScheduleWrap"
          class="today-schedule-table-wrap"
          :class="{
            'carousel-enabled': shouldAnimateTodaySchedule && !carouselAutoStopped,
            'manual-carousel-scroll': shouldAnimateTodaySchedule && carouselAutoStopped,
            'is-dragging': carouselIsDragging,
          }"
          @pointerdown="beginCarouselGesture"
          @pointermove="moveCarouselGesture"
          @pointerup="endCarouselGesture"
          @pointercancel="cancelCarouselGesture"
          @wheel="handleCarouselWheel"
        >
          <div
            class="today-schedule-track"
            :class="{ 'carousel-table': shouldAnimateTodaySchedule }"
            :style="{ '--teacher-columns': visibleTodayTeachers.length }"
          >
            <section v-for="(teacher, teacherIndex) in visibleTodayTeachers" :key="`${teacher.name}-${teacherIndex}`" class="teacher-schedule-column">
              <header class="teacher-col-header">
                <img :src="teacher.avatar" :alt="teacher.name" class="teacher-header-avatar" />
                <div class="teacher-header-info">
                  <span class="teacher-header-name">{{ teacher.name }}</span>
                  <span :class="['teacher-header-status', teacher.currentStatus.className]">{{ teacher.currentStatus.label }}</span>
                </div>
              </header>
              <div class="teacher-schedule-list">
                <div v-for="(entry, entryIndex) in teacher.featuredSchedule" :key="`${teacher.name}-${entryIndex}`" :class="['schedule-entry', getTodayEntryState(entry), getTodayEntryColor(entry)]">
                  <time class="schedule-time">{{ entry.timeIn }}<small>{{ entry.timeOut }}</small></time>
                  <div class="schedule-details">
                    <strong class="schedule-subject">{{ entry.subject }}</strong>
                    <span class="schedule-section">{{ [entry.section, entry.room].filter(Boolean).join(' · ') || 'Class details unavailable' }}</span>
                  </div>
                  <em class="schedule-label">{{ getTodayEntryLabel(entry) }}</em>
                </div>
                <button
                  v-if="teacher.hasMoreSchedules"
                  type="button"
                  class="view-more-schedules-btn"
                  @pointerdown.stop
                  @pointerup.stop
                  @click.stop="openTeacherCurrentTermSchedule(teacher)"
                >
                  View more
                  <span aria-hidden="true">→</span>
                </button>
                <div v-else class="no-more-classes">No more classes today</div>
              </div>
            </section>
          </div>
        </div>
        <div v-else class="today-teachers-empty">
          <span>No classes scheduled today</span>
          <p>Teachers with scheduled classes will appear here automatically.</p>
        </div>
      </section>

      <!-- Charts -->
      <section class="charts-row">
        <!-- Consultation Trends -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'line', 'chart-hidden': expandedChart === 'bar' }">
          <div class="chart-header">
            <div class="chart-heading-main">
              <div class="chart-heading-copy">
                <span class="chart-title">Consultation trends</span>
                <span class="chart-caption">{{ consultationTrendPeriodTitle }} activity · {{ consultationPeriodTotal }} consultations</span>
              </div>
            </div>
            <button class="expand-btn" @click="toggleExpand('line')">
              <svg v-if="expandedChart === 'line'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="consultation-filter-row">
            <span class="filter-row-label">View by</span>
            <div class="chart-period-control" role="group" aria-label="Filter consultation trends by period">
              <button
                v-for="period in consultationTrendPeriods"
                :key="period.value"
                type="button"
                :class="{ 'is-active': consultationTrendPeriod === period.value }"
                :aria-pressed="consultationTrendPeriod === period.value"
                @click="setConsultationTrendPeriod(period.value)"
              >{{ period.label }}</button>
            </div>
          </div>
          <div class="chart-wrap" :class="{ 'is-loading': isConsultationLoading }">
            <div v-if="isConsultationLoading" class="chart-loading-overlay" role="status">
              <span class="chart-loading-spinner" aria-hidden="true"></span>
              <strong>Loading consultation trends</strong>
              <span>Fetching the latest consultation activity…</span>
            </div>
            <div v-else-if="consultationLoadError" class="chart-empty-overlay" role="status">
              <span class="chart-empty-icon" aria-hidden="true">!</span>
              <strong>Consultation data couldn’t load</strong>
              <span>Check your connection and refresh the dashboard to try again.</span>
            </div>
            <div v-else-if="consultationPeriodTotal === 0" class="chart-empty-overlay" role="status">
              <span class="chart-empty-icon" aria-hidden="true">—</span>
              <strong>No consultations in this period</strong>
              <span>Choose another time range or check again after consultation requests are submitted.</span>
            </div>
            <canvas ref="lineChartRef"></canvas>
          </div>
        </div>

        <!-- Teacher Workload -->
        <div class="chart-card" :class="{ 'chart-expanded': expandedChart === 'bar', 'chart-hidden': expandedChart === 'line' }">
          <div class="chart-header">
            <div class="workload-chart-heading">
              <div class="chart-heading-copy">
                <span class="chart-title">Teacher workload</span>
                <span class="chart-caption">Weekly scheduled hours<span v-if="publishedTermLabel"> · {{ publishedTermLabel }}</span></span>
              </div>
            </div>
            <button class="expand-btn" @click="toggleExpand('bar')">
              <svg v-if="expandedChart === 'bar'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div class="workload-filter-row">
            <label class="workload-filter-field workload-term-field">
              <span>Academic term</span>
              <select v-if="academicTerms.length" v-model="selectedWorkloadTermId" class="workload-term-filter" aria-label="Filter workload by academic term" @change="loadWorkloadTerm(selectedWorkloadTermId)">
                <option v-for="term in academicTerms" :key="term._id || term.id" :value="String(term._id || term.id)">
                  {{ term.schoolYear }} · {{ term.semester }}
                </option>
              </select>
              <span v-else class="workload-term-empty">No terms available</span>
            </label>
            <label class="workload-filter-field">
              <span>Find teacher</span>
              <input v-model="workloadSearch" type="search" placeholder="Search name" aria-label="Search teachers by name" />
            </label>
            <label class="workload-filter-field">
              <span>Hours shown</span>
              <select v-model="workloadHoursFilter" aria-label="Choose workload hours to display">
                <option value="all">All hours</option>
                <option value="classes">Class hours</option>
                <option value="work">Work hours</option>
              </select>
            </label>
          </div>
          <div class="workload-legend" aria-label="Teacher hours legend">
            <span><i class="workload-dot workload-dot--work"></i>Work hours</span>
            <span><i class="workload-dot workload-dot--classes"></i>Teaching hours</span>
            <span class="workload-result-count">{{ workloadChartItems.length }} teachers shown</span>
          </div>
          <div class="chart-wrap workload-chart-wrap" :class="{ 'is-loading': isWorkloadLoading }" @wheel="scrollWorkloadHorizontally">
            <div v-if="isWorkloadLoading" class="chart-loading-overlay" role="status">
              <span class="chart-loading-spinner" aria-hidden="true"></span>
              <strong>Loading teacher workload</strong>
              <span>Calculating scheduled hours for this term…</span>
            </div>
            <div v-else-if="workloadLoadError" class="chart-empty-overlay" role="status">
              <span class="chart-empty-icon" aria-hidden="true">!</span>
              <strong>Teacher workload couldn’t load</strong>
              <span>Check your connection and try selecting the academic term again.</span>
            </div>
            <div v-else-if="!workloadHasAssignments || !workloadChartItems.length" class="chart-empty-overlay" role="status">
              <span class="chart-empty-icon" aria-hidden="true">—</span>
              <strong>{{ workloadEmptyTitle }}</strong>
              <span>{{ workloadEmptyDescription }}</span>
            </div>
            <canvas ref="barChartRef" :style="{ cursor: 'pointer', width: '100%', maxWidth: '100%', minWidth: '100%' }"></canvas>
          </div>
        </div>
      </section>

    </main>

    <!-- ═══ Teacher Workload Modal ═══ -->
    <Teleport to="body">
      <div v-if="showWorkloadModal" class="modal-overlay workload-modal-overlay" @click.self="showWorkloadModal = false">
        <div class="modal-box workload-modal" role="dialog" aria-modal="true" aria-labelledby="workload-modal-title">
          <!-- Close -->
          <button type="button" class="modal-close" aria-label="Close workload details" @click="showWorkloadModal = false">✕</button>

          <!-- Header -->
          <div class="modal-header">
            <h2 id="workload-modal-title" class="modal-title">Teacher workload details</h2>
            <p class="modal-sub">Review weekly classes, scheduled hours, and units.</p>
          </div>

          <template v-if="selectedTeacher">
            <!-- Teacher identity -->
            <div class="modal-teacher-row">
              <img :src="selectedTeacher.avatar" class="modal-teacher-avatar" alt="" />
              <div class="modal-teacher-info">
                <span class="modal-teacher-name">{{ selectedTeacher.name }}</span>
              </div>
              <div class="modal-teacher-metrics">
                <span class="modal-hours-badge"><strong>{{ selectedTeacher.workHoursTotal }}h</strong><small>work / week</small></span>
                <span class="modal-hours-badge"><strong>{{ selectedTeacher.totalHours }}h</strong><small>classes / week</small></span>
                <span class="modal-units-badge">{{ selectedTeacher.units || 0 }} units</span>
              </div>
            </div>

            <section class="modal-work-hours-section" aria-labelledby="modal-work-hours-title">
              <div class="modal-section-heading">
                <div>
                  <h3 id="modal-work-hours-title">Faculty work hours</h3>
                  <p>Saved work start and end times by day</p>
                </div>
                <span>{{ selectedTeacher.workHoursDays.length }} days set</span>
              </div>
              <div v-if="selectedTeacher.workHoursDays.length" class="modal-work-hours-grid">
                <div v-for="workDay in selectedTeacher.workHoursDays" :key="workDay.day" class="modal-work-hours-day">
                  <span>{{ workDay.day }}</span>
                  <strong>{{ workDay.startTime }} – {{ workDay.endTime }}</strong>
                </div>
              </div>
              <div v-else class="modal-work-hours-empty">No work hours configured for this teacher.</div>
            </section>

            <!-- Schedule cards grid -->
            <div class="modal-section-heading">
              <div>
                <h3>Weekly schedule</h3>
                <p>Class meetings, times, and assigned sections</p>
              </div>
              <span>{{ selectedTeacher.schedule.length }} classes</span>
            </div>
            <div v-if="selectedTeacher.schedule.length" class="modal-schedule-grid">
              <div v-for="(sc, i) in selectedTeacher.schedule" :key="i" class="modal-sched-card">
                <div class="modal-sched-top">
                  <span class="modal-day-badge">{{ sc.day }}</span>
                  <span class="modal-sched-time-meta">
                    <span class="modal-sched-time">{{ sc.time }}</span>
                    <span class="modal-sched-dur">{{ sc.duration }}</span>
                  </span>
                </div>
                <div class="modal-sched-subject">{{ sc.subject }}</div>
                <div class="modal-sched-section">{{ sc.section }}</div>
              </div>
            </div>
            <div v-else class="modal-empty-schedule">No classes assigned for this term.</div>

            <!-- Summary -->
            <div class="modal-summary">
              <div class="modal-summary-label">Schedule Summary</div>
              <div class="modal-summary-stats">
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Classes</span>
                  <span class="modal-summary-val">{{ selectedTeacher.schedule.length }}</span>
                  <svg class="modal-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 17h7"/></svg>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Work Hours per Week</span>
                  <span class="modal-summary-val">{{ selectedTeacher.workHoursTotal }}h</span>
                  <svg class="modal-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Days Teaching</span>
                  <span class="modal-summary-val">{{ selectedTeacher.daysTeaching }}</span>
                  <svg class="modal-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 17h2"/></svg>
                </div>
                <div class="modal-summary-item">
                  <span class="modal-summary-key">Total Units</span>
                  <span class="modal-summary-val">{{ selectedTeacher.units || 0 }}</span>
                  <svg class="modal-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21"/></svg>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showConsultationDayModal" class="modal-overlay" @click.self="showConsultationDayModal = false">
        <div class="modal-box consultation-day-modal">
          <button class="modal-close" @click="showConsultationDayModal = false">✕</button>
          <div class="modal-header">
            <h2 class="modal-title">{{ selectedConsultationPeriodLabel }} Consultations</h2>
            <p class="modal-sub">{{ selectedConsultationPeriodRequests.length }} consultation{{ selectedConsultationPeriodRequests.length === 1 ? '' : 's' }} requested</p>
          </div>
          <div v-if="selectedConsultationPeriodRequests.length" class="consultation-day-list">
            <div v-for="request in selectedConsultationPeriodRequests" :key="request.id" class="consultation-day-item">
              <div class="consultation-day-item-main">
                <strong>{{ request.subject || 'Untitled subject' }}</strong>
                <span>From {{ request.studentName || request.studentNumber || 'Unknown student' }}</span>
                <span>Requested to {{ request.requestedTeacher || 'Unknown teacher' }}</span>
              </div>
              <span v-if="request.status" class="consultation-status">{{ request.status }}</span>
            </div>
          </div>
          <div v-else class="modal-empty-schedule">No consultations were recorded for this period.</div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Confirm Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <!-- Icon -->
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
import { getToken, getUser, logout } from '@/auth.js'
import useNotifications from '@/composables/useNotifications.js'
import { initialsAvatar } from '@/utils/avatar.js'
import Chart from 'chart.js/auto'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._clickOutside) }
}

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function apiRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = {}
  try { body = await response.json() } catch (_error) { body = {} }

  if (!response.ok) {
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

const user = getUser() || {}

const todayScheduleEntries = ref([])
const teacherDirectory = ref([])
const todayScheduleLoading = ref(true)
const currentDateTime = ref(new Date())
const teachersPerSlide = computed(() => Math.min(5, Math.max(1, todayTeachers.value.length)))
const todayScheduleWrap = ref(null)
const carouselAutoStopped = ref(false)
const carouselIsDragging = ref(false)
const carouselGestureStartX = ref(0)
const carouselGestureCurrentX = ref(0)
const carouselGestureStartScrollLeft = ref(0)
const carouselWheelLocked = ref(false)
let dashboardRealtimeTimer = null

const todayName = computed(() => currentDateTime.value.toLocaleDateString('en-US', { weekday: 'long' }))
const todayDateLabel = computed(() => currentDateTime.value.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}))
const currentTimeLabel = computed(() => currentDateTime.value.toLocaleTimeString('en-US', {
  hour: 'numeric', minute: '2-digit',
}))

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function timeToMinutes(value) {
  if (!value) return Number.MAX_SAFE_INTEGER
  const match = String(value).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
  if (!match) return Number.MAX_SAFE_INTEGER
  let hour = Number(match[1])
  const minute = Number(match[2])
  if (match[3] === 'PM' && hour !== 12) hour += 12
  if (match[3] === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}

function teacherProfile(name) {
  const target = normalizeName(name)
  return teacherDirectory.value.find((teacher) => {
    const fullName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
    return normalizeName(fullName) === target
  }) || null
}

function teacherAvatar(name) {
  const profile = teacherProfile(name)
  return profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DDECE5&color=1B4332`
}

function getTodayEntryState(entry) {
  const now = currentDateTime.value.getHours() * 60 + currentDateTime.value.getMinutes()
  const start = timeToMinutes(entry.timeIn)
  const end = timeToMinutes(entry.timeOut)
  if (now >= start && now < end) return 'is-current'
  if (now >= end) return 'is-complete'
  return 'is-upcoming'
}

function getTodayEntryLabel(entry) {
  const state = getTodayEntryState(entry)
  if (state === 'is-current') return 'Now'
  if (state === 'is-complete') return 'Finished'
  return 'Upcoming'
}

function getTodayEntryColor(entry) {
  return /laboratory|lab/i.test(String(entry?.roomType || '')) ? 'is-laboratory' : 'is-lecture'
}

function getFeaturedTodaySchedule(schedule) {
  const now = currentDateTime.value.getHours() * 60 + currentDateTime.value.getMinutes()
  return schedule.find(entry => now >= timeToMinutes(entry.timeIn) && now < timeToMinutes(entry.timeOut))
    || schedule.find(entry => timeToMinutes(entry.timeIn) > now)
    || schedule.at(-1)
}

function openTeacherCurrentTermSchedule(teacher) {
  // This cache is maintained by the Current Term Schedule sidebar link. The
  // schedule page will also resolve the published term itself if it is absent.
  const termId = String(sessionStorage.getItem('cit-published-term-id') || '')
  router.push({
    path: '/admin/schedule/view',
    query: {
      ...(termId ? { academicTermId: termId } : {}),
        mode: 'teacher',
        teacher: teacher.name,
        source: 'current',
        highlightDay: todayName.value,
      },
  }).catch((error) => console.error('Unable to open the teacher schedule:', error))
}

const todayTeachers = computed(() => {
  const grouped = new Map()
  todayScheduleEntries.value
    .filter((entry) => normalizeName(entry.day) === normalizeName(todayName.value))
    .filter((entry) => normalizeName(entry.entryType) !== 'lunch' && !normalizeName(entry.subject).includes('lunch break'))
    .filter((entry) => entry.teacher)
    .filter((entry) => normalizeName(entry.teacher) !== 'cit faculty')
    .forEach((entry) => {
      const key = normalizeName(entry.teacher)
      if (!grouped.has(key)) {
        const profile = teacherProfile(entry.teacher)
        grouped.set(key, {
          name: profile?.name || entry.teacher,
          avatar: profile?.avatar || teacherAvatar(entry.teacher),
          schedule: [],
        })
      }
      grouped.get(key).schedule.push(entry)
    })

  const now = currentDateTime.value.getHours() * 60 + currentDateTime.value.getMinutes()
  return [...grouped.values()].map((teacher) => {
    teacher.schedule.sort((a, b) => timeToMinutes(a.timeIn) - timeToMinutes(b.timeIn))
    const featuredEntry = getFeaturedTodaySchedule(teacher.schedule)
    teacher.featuredSchedule = featuredEntry ? [featuredEntry] : []
    teacher.hasMoreSchedules = teacher.schedule.length > teacher.featuredSchedule.length
    const current = teacher.schedule.find((entry) => now >= timeToMinutes(entry.timeIn) && now < timeToMinutes(entry.timeOut))
    const next = teacher.schedule.find((entry) => timeToMinutes(entry.timeIn) > now)
    teacher.currentStatus = current
      ? { label: 'Teaching now', className: 'is-live' }
      : next
        ? { label: `Next ${next.timeIn}`, className: 'is-next' }
        : { label: 'Classes complete', className: 'is-done' }
    return teacher
  }).sort((a, b) => {
    // Prioritize "Teaching now" status first
    if (a.currentStatus.className === 'is-live' && b.currentStatus.className !== 'is-live') return -1
    if (a.currentStatus.className !== 'is-live' && b.currentStatus.className === 'is-live') return 1
    // Then sort by time
    return timeToMinutes(a.schedule[0]?.timeIn) - timeToMinutes(b.schedule[0]?.timeIn) || a.name.localeCompare(b.name)
  })
})

const shouldAnimateTodaySchedule = computed(() => todayTeachers.value.length > teachersPerSlide.value)
const infiniteTeachers = computed(() => {
  const teachers = todayTeachers.value
  return shouldAnimateTodaySchedule.value ? [...teachers, ...teachers, ...teachers] : teachers
})
const visibleTodayTeachers = computed(() => carouselAutoStopped.value ? todayTeachers.value : infiniteTeachers.value)

function previousTodayTeachers() {
  carouselAutoStopped.value = true
  const container = todayScheduleWrap.value
  if (container) container.scrollBy({ left: -container.clientWidth * 0.8, behavior: 'smooth' })
}

function nextTodayTeachers() {
  carouselAutoStopped.value = true
  const container = todayScheduleWrap.value
  if (container) container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' })
}

function beginCarouselGesture(event) {
  if (!shouldAnimateTodaySchedule.value) return
  carouselAutoStopped.value = true
  carouselIsDragging.value = true
  carouselGestureStartX.value = event.clientX || 0
  carouselGestureCurrentX.value = carouselGestureStartX.value
  carouselGestureStartScrollLeft.value = todayScheduleWrap.value?.scrollLeft || 0
  event.currentTarget?.setPointerCapture?.(event.pointerId)
}

function moveCarouselGesture(event) {
  if (!carouselIsDragging.value) return
  carouselGestureCurrentX.value = event.clientX || carouselGestureCurrentX.value
  const distance = carouselGestureCurrentX.value - carouselGestureStartX.value
  if (Math.abs(distance) > 3 && todayScheduleWrap.value) {
    todayScheduleWrap.value.scrollLeft = carouselGestureStartScrollLeft.value - distance
  }
}

function endCarouselGesture(event) {
  event.currentTarget?.releasePointerCapture?.(event.pointerId)
  carouselIsDragging.value = false
  carouselGestureStartX.value = 0
  carouselGestureCurrentX.value = 0
}

function cancelCarouselGesture(event) {
  event.currentTarget?.releasePointerCapture?.(event.pointerId)
  carouselIsDragging.value = false
  carouselGestureStartX.value = 0
  carouselGestureCurrentX.value = 0
}

function handleCarouselWheel(event) {
  if (!shouldAnimateTodaySchedule.value || carouselWheelLocked.value) return
  const container = event.currentTarget
  if (!container) return

  const horizontalDistance = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
    ? event.deltaX
    : 0
  if (Math.abs(horizontalDistance) < 20) return

  event.preventDefault()
  carouselAutoStopped.value = true
  container.scrollLeft += horizontalDistance
  carouselWheelLocked.value = true
  window.setTimeout(() => {
    carouselWheelLocked.value = false
  }, 450)
}

function getMaxScheduleLength(teachers) {
  return Math.max(...teachers.map(t => t.schedule.length), 0)
}

async function loadTodayTeacherSchedules({ quiet = false } = {}) {
  if (!quiet) todayScheduleLoading.value = true
  try {
    const [schedulePayload, usersPayload] = await Promise.all([
      apiRequest(`/schedules?dashboardRefresh=${Date.now()}`),
      apiRequest('/users?role=teacher'),
    ])
    todayScheduleEntries.value = Array.isArray(schedulePayload.entries) ? schedulePayload.entries : []
    teacherDirectory.value = Array.isArray(usersPayload.users) ? usersPayload.users : []
  } catch (error) {
    console.error('Failed to load today’s teacher schedules:', error)
  } finally {
    todayScheduleLoading.value = false
  }
}
/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'View Schedules', to: '/admin/schedule/view',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Add Schedule', to: '/admin/schedule/add',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    name: 'Academic Terms', to: '/admin/academic-terms',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`
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
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Activity Logs', to: '/admin/activity-logs',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Stats ── */
const stats = ref([
  {
    label: 'Available Teachers', value: 0, sub: 'On School status',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    label: 'Allocated Rooms', value: '0/0', sub: 'Rooms Scheduled / Total Published Term Rooms',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
  },
  {
    label: 'Classes Today', value: 0, sub: 'Scheduled for today',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    label: 'Active Consultations', value: 0, sub: 'Pending / Approved / Rescheduled',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#626a72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  }
])

async function loadDashboardSummary() {
  try {
    const dashboardDay = encodeURIComponent(todayName.value)
    const payload = await apiRequest(`/schedules/dashboard-summary?day=${dashboardDay}`)
    stats.value[0].value = payload.availableTeachers
    stats.value[1].value = `${Number(payload.allocatedRooms) || 0}/${Number(payload.totalRooms ?? payload.availableRooms) || 0}`
    stats.value[2].value = payload.classesToday
    stats.value[3].value = payload.consultations
  } catch (error) {
    console.error('Failed to load dashboard summary:', error)
  }
}

/* ── Notifications ── */
const showNotif = ref(false)
const notifTab = ref('all')
const notifications = ref([])
const notificationsLoading = ref(false)
const selectedNotification = ref(null)
const notificationPreviewStyle = ref({})
const showClearNotificationsDialog = ref(false)
const isClearingNotifications = ref(false)
const clearNotificationsError = ref('')
const visibleNotifs = computed(() =>
  notifTab.value === 'unread' ? notifications.value.filter(n => !n.read)
    : notifTab.value === 'read' ? notifications.value.filter(n => n.read)
      : notifications.value
)
const unreadNotifs = computed(() => notifications.value.filter(n => !n.read))
const newNotifs   = computed(() => visibleNotifs.value.filter(n => n.group === 'new'))
const todayNotifs = computed(() => visibleNotifs.value.filter(n => n.group === 'today'))
const earlierNotifs = computed(() => visibleNotifs.value.filter(n => n.group === 'earlier'))

function notificationGroup(createdAt) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 'today'
  const now = new Date()
  const isSameDay = created.toDateString() === now.toDateString()
  return Date.now() - created.getTime() < 24 * 60 * 60 * 1000 ? 'new' : (isSameDay ? 'today' : 'earlier')
}

function notificationTimeLabel(createdAt) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 'Just now'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}h ago`
  return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function notificationRoute(notification) {
  if (!notification) return null
  const type = String(notification.type || '').toLowerCase()
  const isScheduleNotification = type.startsWith('schedule_') || type.startsWith('lunch_break_')
  if (isScheduleNotification) {
    const related = notification.related || {}
    const teacherName = String(related.teacher || '').trim()
    const isGenericFaculty = /^(?:cit|it)\s+faculty$/i.test(teacherName)
    const hasStudentContext = Boolean(related.year && related.section)
    const requestedMode = String(related.mode || related.targetMode || notification.data?.mode || '').toLowerCase()
    const mode = isGenericFaculty && hasStudentContext
      ? 'student'
      : (['teacher', 'room', 'student'].includes(requestedMode)
        ? requestedMode
        : (hasStudentContext ? 'student' : (related.room && !related.teacher ? 'room' : (related.teacher ? 'teacher' : ''))))
    const query = { source: 'current' }
    if (mode) query.mode = mode
    if (mode === 'teacher' && related.teacher) query.teacher = related.teacher
    if (mode === 'room' && related.room) query.room = related.room
    if (mode === 'student') {
      if (related.year) query.year = related.year
      if (related.section) query.section = related.section
    }
    return { path: '/admin/schedule/view', query }
  }

  const route = notification.data?.route
  const isGenericConsultationRoute = route === '/admin/dashboard'
    && type.startsWith('consultation_')
  return isGenericConsultationRoute ? null : (route || null)
}

function normalizeNotification(notification) {
  notification = notification || {}
  return {
    id: notification.id || notification._id || null,
    type: notification.type || 'info',
    title: notification.title || notification.type || 'Notification',
    message: notification.message || 'You have a new notification.',
    actorName: notification.data?.actorName || '',
    avatar: notification.data?.avatar || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.data?.actorName || notification.title || 'Notification')}&background=DDE2E5&color=30353A`,
    read: Boolean(notification.read),
    related: notification.related || {},
    group: notificationGroup(notification.createdAt),
    timeLabel: notificationTimeLabel(notification.createdAt),
    route: notificationRoute(notification),
  }
}

function toggleNotifications() {
  showNotif.value = !showNotif.value
  if (!showNotif.value) selectedNotification.value = null
  if (showNotif.value) loadNotifications()
}

async function loadNotifications() {
  notificationsLoading.value = true
  try {
    const payload = await apiRequest('/notifications')
    notifications.value = (Array.isArray(payload.notifications) ? payload.notifications : [])
      .filter(Boolean)
      .map(normalizeNotification)
  } catch (error) {
    console.error('Failed to load notifications:', error)
    notifications.value = []
  } finally {
    notificationsLoading.value = false
  }
}

function handleNotification(notification) {
  if (!notification?.id) return
  const item = normalizeNotification(notification)
  notifications.value = [item, ...notifications.value.filter(existing => existing.id !== item.id)].slice(0, 200)
}

function markNotificationRead(notificationId) {
  if (!notificationId) return
  apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' }).catch(() => {})
  notifications.value = notifications.value.map(notification =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  )
}

async function markAllNotificationsRead() {
  try {
    await apiRequest('/notifications/mark-all-read', { method: 'PATCH' })
    notifications.value = notifications.value.map(notification => ({ ...notification, read: true }))
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
  }
}

function openClearNotificationsDialog() {
  if (!notifications.value.length || isClearingNotifications.value) return
  clearNotificationsError.value = ''
  showClearNotificationsDialog.value = true
}

function closeClearNotificationsDialog() {
  if (isClearingNotifications.value) return
  showClearNotificationsDialog.value = false
  clearNotificationsError.value = ''
}

async function confirmClearNotifications() {
  if (!notifications.value.length || isClearingNotifications.value) return
  isClearingNotifications.value = true
  clearNotificationsError.value = ''
  try {
    await apiRequest('/notifications', { method: 'DELETE' })
    notifications.value = []
    selectedNotification.value = null
    showClearNotificationsDialog.value = false
  } catch (error) {
    clearNotificationsError.value = error.message || 'Unable to clear notifications.'
  } finally {
    isClearingNotifications.value = false
  }
}

function openNotification(notification, event) {
  if (!notification) return
  markNotificationRead(notification.id)
  if (notification.route) {
    selectedNotification.value = null
    showNotif.value = false
    router.push(notification.route)
    return
  }
  const clickedRow = event?.currentTarget
  if (clickedRow?.getBoundingClientRect) {
    const rowBounds = clickedRow.getBoundingClientRect()
    const previewHeight = 290
    notificationPreviewStyle.value = {
      top: `${Math.min(Math.max(12, rowBounds.top), Math.max(12, window.innerHeight - previewHeight))}px`,
      left: `${Math.max(12, rowBounds.left - 330 - 14)}px`,
    }
  }
  showNotif.value = true
  selectedNotification.value = { ...notification, read: true }
}

/* ── Charts ── */
const lineChartRef = ref(null)
const barChartRef = ref(null)
const expandedChart = ref(null) // null | 'line' | 'bar'
const consultationTrendPeriod = ref('week')
const consultationTrendPeriods = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
]
const workloadSearch = ref('')
const workloadHoursFilter = ref('all')
let workloadFilterRedrawTimer = null
let lineChartInstance = null
let barChartInstance = null

/* ── Workload Modal ── */
const showWorkloadModal = ref(false)
const selectedTeacher = ref(null)
const consultationRequests = ref([])
const isConsultationLoading = ref(true)
const isWorkloadLoading = ref(true)
const consultationLoadError = ref(false)
const workloadLoadError = ref(false)
const showConsultationDayModal = ref(false)
const selectedConsultationPeriodLabel = ref('')
const selectedConsultationPeriodRequests = ref([])
const liveTeacherWorkloads = ref([])
const workloadUsers = ref([])
const workloadScheduleTables = ref([])
const academicTerms = ref([])
const selectedWorkloadTermId = ref('')
const publishedTermLabel = ref('')
const workloadChartWidth = computed(() => Math.max(760, (liveTeacherWorkloads.value.length || 5) * 180))
const workloadChartItems = computed(() => liveTeacherWorkloads.value
  .filter(teacher => {
    const query = workloadSearch.value.trim().toLocaleLowerCase()
    return !query || String(teacher.name || '').toLocaleLowerCase().includes(query)
  })
  .slice()
  .sort((first, second) => {
    const hoursFor = teacher => workloadHoursFilter.value === 'classes'
      ? Number(teacher.totalHours) || 0
      : Number(teacher.workHoursTotal) || 0
    return hoursFor(second) - hoursFor(first) || first.name.localeCompare(second.name)
  }))
const workloadHasAssignments = computed(() => liveTeacherWorkloads.value.some(teacher => {
  if (workloadHoursFilter.value === 'classes') return Number(teacher.totalHours) > 0
  if (workloadHoursFilter.value === 'work') return Number(teacher.workHoursTotal) > 0
  return Number(teacher.totalHours) > 0 || Number(teacher.workHoursTotal) > 0
}))
const workloadEmptyTitle = computed(() => {
  if (!liveTeacherWorkloads.value.length) return 'No workload data for this term'
  if (workloadHoursFilter.value === 'work') return 'No work hours configured for this term'
  if (workloadHoursFilter.value === 'classes') return 'No classes scheduled for this term'
  if (!workloadHasAssignments.value) return 'No classes scheduled for this term'
  return 'No teachers match these filters'
})
const workloadEmptyDescription = computed(() => {
  if (!liveTeacherWorkloads.value.length) return 'Check that active teacher accounts and schedule records are available, or choose another term.'
  if (workloadHoursFilter.value === 'work') return 'Saved faculty work-hour settings appear here after they are configured.'
  if (workloadHoursFilter.value === 'classes') return 'Weekly class hours appear here after classes are added to the selected academic term.'
  if (!workloadHasAssignments.value) return 'Weekly workload appears here after classes are added to the selected academic term.'
  return 'Try another teacher name to see matching results.'
})
const workloadByTermCache = new Map()
let workloadRequestId = 0

function scrollWorkloadHorizontally(event) {
  const container = event.currentTarget
  if (container.scrollWidth <= container.clientWidth) return
  event.preventDefault()
  container.scrollLeft += event.deltaY || event.deltaX
}

const teacherWorkloads = [
  {
    name: 'Sir. Jhon', avatar: initialsAvatar('Sir. Jhon'),
    totalHours: 19, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '08:00-09:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section A' },
      { day: 'Monday',    time: '09:00-10:00', duration: '1h', subject: 'Data Structures',  section: '1st Year - Section B' },
      { day: 'Tuesday',   time: '08:00-09:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section A' },
      { day: 'Wednesday', time: '10:00-11:00', duration: '1h', subject: 'Algorithms',        section: '2nd Year - Section B' },
    ]
  },
  {
    name: 'Maam. Aira', avatar: initialsAvatar('Maam. Aira'),
    totalHours: 12, daysTeaching: 3,
    schedule: [
      { day: 'Monday',  time: '10:00-11:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section A' },
      { day: 'Tuesday', time: '13:00-14:00', duration: '1h', subject: 'Web Development', section: '2nd Year - Section B' },
      { day: 'Friday',  time: '08:00-09:00', duration: '1h', subject: 'UI/UX Design',    section: '3rd Year - Section A' },
    ]
  },
  {
    name: 'Sir. Gab', avatar: initialsAvatar('Sir. Gab'),
    totalHours: 24, daysTeaching: 5,
    schedule: [
      { day: 'Monday',    time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section A' },
      { day: 'Tuesday',   time: '07:00-08:00', duration: '1h', subject: 'Database Systems', section: '2nd Year - Section B' },
      { day: 'Wednesday', time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section A' },
      { day: 'Thursday',  time: '09:00-10:00', duration: '1h', subject: 'Operating Systems', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Sir.Bads', avatar: initialsAvatar('Sir.Bads'),
    totalHours: 19, daysTeaching: 4,
    schedule: [
      { day: 'Monday',   time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section A' },
      { day: 'Tuesday',  time: '11:00-12:00', duration: '1h', subject: 'Networks',      section: '3rd Year - Section B' },
      { day: 'Thursday', time: '13:00-14:00', duration: '1h', subject: 'Cybersecurity', section: '4th Year - Section A' },
    ]
  },
  {
    name: 'Maam. Daniella', avatar: initialsAvatar('Maam. Daniella'),
    totalHours: 9, daysTeaching: 2,
    schedule: [
      { day: 'Wednesday', time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section A' },
      { day: 'Friday',    time: '14:00-15:00', duration: '1h', subject: 'Capstone Project', section: '4th Year - Section B' },
    ]
  },
  {
    name: 'Sir. Jolo', avatar: initialsAvatar('Sir. Jolo'),
    totalHours: 8, daysTeaching: 2,
    schedule: [
      { day: 'Tuesday',  time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section A' },
      { day: 'Thursday', time: '10:00-11:00', duration: '1h', subject: 'Software Engineering', section: '3rd Year - Section B' },
    ]
  },
  {
    name: 'Maam.Aj', avatar: initialsAvatar('Maam.Aj'),
    totalHours: 11, daysTeaching: 3,
    schedule: [
      { day: 'Monday',   time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section A' },
      { day: 'Wednesday',time: '13:00-14:00', duration: '1h', subject: 'Technical Writing', section: '2nd Year - Section B' },
      { day: 'Friday',   time: '10:00-11:00', duration: '1h', subject: 'Research Methods',  section: '3rd Year - Section A' },
    ]
  },
]

function openWorkloadModal(index) {
  selectedTeacher.value = workloadChartItems.value[index]
  showWorkloadModal.value = true
}

function openConsultationPeriod(index) {
  const period = chartPeriods.value[index]
  if (!period) return
  selectedConsultationPeriodLabel.value = period.label
  selectedConsultationPeriodRequests.value = consultationRequests.value.filter(request => {
    const requestDate = parseRequestDate(request)
    return requestDate >= period.start && requestDate < period.end
      && !['CANCELLED', 'ARCHIVED'].includes(request.status)
  })
  showConsultationDayModal.value = true
}

function parseRequestDate(request) {
  const value = request?.requestDate || request?.createdAt || request?.consultationDate
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfWeek(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - daysFromMonday)
  return start
}

function formatWeekLabel(start, end) {
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endLabel = new Date(end.getTime() - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startLabel}–${endLabel}`
}

const consultationTrendPeriodTitle = computed(() => ({
  month: 'Monthly',
  week: 'Weekly',
  day: 'Daily',
}[consultationTrendPeriod.value]))

const chartPeriods = computed(() => {
  if (consultationTrendPeriod.value === 'day') {
    const today = new Date(currentDateTime.value)
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(today)
      start.setDate(start.getDate() - (6 - index))
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const label = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      return { start, end, label }
    })
  }

  if (consultationTrendPeriod.value === 'month') {
    const currentMonth = new Date(currentDateTime.value.getFullYear(), currentDateTime.value.getMonth(), 1)
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - index), 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      const label = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      return { start, end, label }
    })
  }

  const currentWeek = startOfWeek(currentDateTime.value)
  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - (5 - index) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end, label: formatWeekLabel(start, end) }
  })
})

const consultationPeriodCounts = computed(() => chartPeriods.value.map(period => consultationRequests.value.filter(request => {
  const requestDate = parseRequestDate(request)
  return requestDate >= period.start && requestDate < period.end
    && !['CANCELLED', 'ARCHIVED'].includes(request.status)
}).length))
const consultationPeriodTotal = computed(() => consultationPeriodCounts.value.reduce((sum, count) => sum + count, 0))

function setConsultationTrendPeriod(period) {
  if (consultationTrendPeriod.value === period) return
  consultationTrendPeriod.value = period
  createLineChart()
}

function minutesFromTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hour = Number(match[1])
  if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0
  return hour * 60 + Number(match[2])
}

const workloadWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function workHoursForTable(table, scheduleEntries, teacherName) {
  const savedByDay = table?.workHoursByDay
  const hasDaySettings = savedByDay && typeof savedByDay === 'object'
    && workloadWeekdays.some(day => savedByDay[day]?.startTime || savedByDay[day]?.endTime)
  const workHoursDays = workloadWeekdays.flatMap(day => {
    const settings = hasDaySettings
      ? savedByDay[day]
      : { startTime: table?.workStartTime, endTime: table?.workEndTime }
    const startTime = String(settings?.startTime || '').trim()
    const endTime = String(settings?.endTime || '').trim()
    if (!startTime || !endTime || minutesFromTime(endTime) <= minutesFromTime(startTime)) return []
    return [{ day, startTime, endTime }]
  })
  const lunchByDay = new Map()
  ;(scheduleEntries || [])
    .filter(entry => String(entry.teacher || '').trim().toLocaleLowerCase() === teacherName.trim().toLocaleLowerCase())
    .filter(entry => entry.entryType === 'lunch' || /lunch\s*break/i.test(String(entry.subject || '')))
    .forEach(entry => {
      if (!workloadWeekdays.includes(entry.day)) return
      const start = minutesFromTime(entry.timeIn)
      const end = minutesFromTime(entry.timeOut)
      if (end <= start) return
      const intervals = lunchByDay.get(entry.day) || []
      intervals.push({ start, end })
      lunchByDay.set(entry.day, intervals)
    })
  const totalMinutes = workHoursDays.reduce((sum, workDay) => {
    const start = minutesFromTime(workDay.startTime)
    const end = minutesFromTime(workDay.endTime)
    const lunchIntervals = (lunchByDay.get(workDay.day) || []).sort((left, right) => left.start - right.start)
    let lunchMinutes = 0
    let mergedLunch = null
    lunchIntervals.forEach(interval => {
      const clipped = { start: Math.max(start, interval.start), end: Math.min(end, interval.end) }
      if (clipped.end <= clipped.start) return
      if (mergedLunch && clipped.start <= mergedLunch.end) mergedLunch.end = Math.max(mergedLunch.end, clipped.end)
      else {
        if (mergedLunch) lunchMinutes += mergedLunch.end - mergedLunch.start
        mergedLunch = clipped
      }
    })
    if (mergedLunch) lunchMinutes += mergedLunch.end - mergedLunch.start
    return sum + Math.max(0, end - start - lunchMinutes)
  }, 0)
  return { days: workHoursDays, totalHours: Number((totalMinutes / 60).toFixed(1)) }
}

function calculateWorkloads(users, scheduleEntries, scheduleTables = []) {
  const scheduleTableByTeacher = new Map((scheduleTables || []).map(table => [
    String(table.teacher || table.label || '').trim().toLocaleLowerCase(),
    table,
  ]))
  const groups = new Map()
  scheduleEntries
    .filter(entry => entry.entryType !== 'lunch' && entry.teacher && String(entry.teacher).toLowerCase() !== 'cit faculty')
    .forEach((entry, index) => {
      const sections = entry.parallel
        ? ((entry.parallelSlots || []).map(slot => slot.section).filter(Boolean).sort().join(',') || entry.parallelGroupId)
        : entry.section
      const key = `${entry.teacher}|${entry.year}|${entry.subject}|${entry.parallel ? 'parallel' : 'single'}|${sections || index}`
      const group = groups.get(key) || { entries: [], parallel: Boolean(entry.parallel) }
      group.entries.push(entry)
      groups.set(key, group)
    })

  const workloads = new Map((users || [])
    .filter(user => String(user.account_status || 'Active') === 'Active')
    .map(user => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Teacher'
      return [name, {
        name,
        totalHours: 0,
        units: 0,
        daysTeaching: 0,
        schedule: [],
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DDECE5&color=1B4332`,
      }]
    }))
  groups.forEach(group => {
    const first = group.entries[0]
    const sectionCount = group.parallel ? Math.max(2, Number(first.parallelCount) || group.entries.length) : 1
    const hasLab = group.entries.some(entry => entry.roomType === 'Comlab/Laboratory')
    const meetingKeys = new Set(group.entries.map(entry => group.parallel
      ? `${entry.day}|${entry.timeIn}|${entry.timeOut}`
      : `${entry.day}|${entry.timeIn}|${entry.timeOut}|${entry.roomType || 'Lecture'}`))
    const hours = Array.from(meetingKeys).reduce((sum, key) => {
      const [, timeIn, timeOut] = key.split('|')
      return sum + Math.max(0, minutesFromTime(timeOut) - minutesFromTime(timeIn)) / 60
    }, 0)
    const units = group.parallel
      ? (sectionCount + 1) * (hasLab ? 2.5 : 1.5)
      : (hasLab ? 5 : 3)
    const current = workloads.get(first.teacher) || { name: first.teacher, totalHours: 0, units: 0, daysTeaching: 0, schedule: [] }
    current.totalHours += hours
    current.units += units
    current.schedule.push(...group.entries.map(entry => ({
      day: entry.day,
      time: `${entry.timeIn}-${entry.timeOut}`,
      duration: `${Math.max(0, minutesFromTime(entry.timeOut) - minutesFromTime(entry.timeIn)) / 60}h`,
      subject: entry.subject,
      section: [entry.year, entry.section].filter(Boolean).join(' - '),
    })))
    current.daysTeaching = new Set(current.schedule.map(entry => entry.day)).size
    workloads.set(first.teacher, current)
  })
  return Array.from(workloads.values()).map(workload => {
    const workHours = workHoursForTable(
      scheduleTableByTeacher.get(workload.name.trim().toLocaleLowerCase()),
      scheduleEntries,
      workload.name,
    )
    return {
      ...workload,
      totalHours: Number(workload.totalHours.toFixed(1)),
      units: Number(workload.units.toFixed(1)),
      workHoursDays: workHours.days,
      workHoursTotal: workHours.totalHours,
      avatar: workload.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(workload.name)}&background=DDECE5&color=1B4332`,
    }
  })
}

async function loadChartData() {
  isConsultationLoading.value = true
  consultationLoadError.value = false
  try {
    const [termPayload, requestsPayload, usersPayload, termsPayload, scheduleTablesPayload] = await Promise.all([
      apiRequest('/academic-terms/published'),
      apiRequest('/consultations/requests'),
      apiRequest('/users?role=teacher'),
      apiRequest('/academic-terms'),
      apiRequest('/schedules/tables'),
    ])
    const publishedTerm = termPayload.term
    const termIdOf = term => String(term?._id || term?.id || '')
    academicTerms.value = termsPayload.terms || []
    workloadScheduleTables.value = scheduleTablesPayload.tables || []
    const selectedTerm = academicTerms.value.find(term => termIdOf(term) === termIdOf(publishedTerm))
      || publishedTerm
      || academicTerms.value[0]
    workloadUsers.value = usersPayload.users || []
    const teachersByEmployeeId = new Map((usersPayload.users || []).map(user => [
      String(user.employeeId || '').trim(),
      `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    ]))
    consultationRequests.value = (requestsPayload.requests || []).map(request => ({
      ...request,
      requestedTeacher: request.requestedTeacher
        || teachersByEmployeeId.get(String(request.employeeId || '').trim())
        || '',
    }))
    await loadWorkloadTerm(termIdOf(selectedTerm))
  } catch (error) {
    console.error('Failed to load dashboard chart data:', error)
    consultationLoadError.value = true
    workloadLoadError.value = true
    isWorkloadLoading.value = false
    await nextTick()
    createBarChart()
  } finally {
    isConsultationLoading.value = false
    await nextTick()
    createLineChart()
  }
}

async function loadWorkloadTerm(termId) {
  const selectedId = String(termId || '')
  selectedWorkloadTermId.value = selectedId
  const term = academicTerms.value.find(item => String(item._id || item.id || '') === selectedId)
  publishedTermLabel.value = term
    ? `${term.schoolYear || ''} · ${term.semester || ''}`.trim()
    : ''
  const requestId = ++workloadRequestId
  isWorkloadLoading.value = true
  workloadLoadError.value = false

  if (workloadByTermCache.has(selectedId)) {
    liveTeacherWorkloads.value = workloadByTermCache.get(selectedId)
    isWorkloadLoading.value = false
    workloadLoadError.value = false
    await nextTick()
    createBarChart()
    return
  }

  try {
    const schedulesPayload = await apiRequest(selectedId
      ? `/schedules?academicTermId=${encodeURIComponent(selectedId)}`
      : '/schedules')
    if (requestId !== workloadRequestId) return
    const workloads = calculateWorkloads(workloadUsers.value, schedulesPayload.entries || [], workloadScheduleTables.value)
    workloadByTermCache.set(selectedId, workloads)
    liveTeacherWorkloads.value = workloads
    isWorkloadLoading.value = false
    workloadLoadError.value = false
    await nextTick()
    createBarChart()
  } catch (error) {
    if (requestId === workloadRequestId) {
      console.error('Failed to load semester workload:', error)
      workloadLoadError.value = true
      isWorkloadLoading.value = false
      await nextTick()
      createBarChart()
    }
  }
}

// Compact (5) vs full (7) bar chart datasets
const BAR_LABELS_SHORT = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella']
const BAR_DATA_SHORT   = [19, 12, 24, 19, 9]
const BAR_LABELS_FULL  = ['Sir. Jhon', 'Maam. Aira', 'Sir. Gab', 'Sir.Bads', 'Maam. Daniella', 'Sir. Jolo', 'Maam.Aj']
const BAR_DATA_FULL    = [19, 12, 24, 19, 9, 8, 11]

function toggleExpand(which) {
  const isCollapsing = expandedChart.value === which
  expandedChart.value = isCollapsing ? null : which

  // Destroy both charts, let the DOM re-layout, then recreate so canvases
  // measure their new container size correctly.
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  if (barChartInstance)  { barChartInstance.destroy();  barChartInstance  = null }

  nextTick(() => {
    setTimeout(() => {
      createLineChart()
      createBarChart()
    }, 50)
  })
}

function createLineChart() {
  if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null }
  lineChartInstance = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels: chartPeriods.value.map(period => period.label),
      datasets: [{
        data: consultationPeriodCounts.value,
        borderColor: '#4b5259',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#7d858d',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.45,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Consultation : ${ctx.parsed.y}`
          },
          backgroundColor: '#30353a',
          titleColor: '#f4f5f5',
          bodyColor: '#d8dcdf',
          borderColor: '#7d858d',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      onClick: (_event, elements) => {
        if (elements.length) openConsultationPeriod(elements[0].index)
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#69727c', font: { size: 12 } } },
        y: {
          beginAtZero: true,
          ticks: { color: '#69727c', font: { size: 12 }, stepSize: 2, precision: 0 },
          grid: { color: 'rgba(83, 91, 100, 0.16)' }
        }
      }
    }
  })
}

function compactTeacherLabel(name) {
  if (!name) return 'Teacher'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length <= 1) return parts[0] || 'Teacher'
  const first = parts[0]
  const lastInitial = parts.slice(1).map(part => part[0]).join('')
  return `${first} ${lastInitial}.`
}

function createBarChart() {
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null }
  if (!barChartRef.value || !workloadHasAssignments.value || !workloadChartItems.value.length) return
  const expanded = expandedChart.value === 'bar'
  const workloadItems = workloadChartItems.value
  const showWorkHours = workloadHoursFilter.value !== 'classes'
  const showClassHours = workloadHoursFilter.value !== 'work'
  const workDatasetIndex = showWorkHours ? 0 : -1
  const classDatasetIndex = showClassHours ? (showWorkHours ? 1 : 0) : -1
  const labels = workloadItems.map(teacher => teacher.name)
  const yTickLabels = workloadItems.map(teacher => expanded ? teacher.name : compactTeacherLabel(teacher.name))
  const workloadMaximumHours = 44
  const formatHoursLabel = hours => `${Number.isInteger(hours) ? hours : Number(hours.toFixed(1))}h`
  const workloadValueLabels = {
    id: 'workloadValueLabels',
    afterDatasetsDraw(chart) {
      const context = chart.ctx
      const workElements = showWorkHours ? chart.getDatasetMeta(workDatasetIndex).data : []
      const classElements = showClassHours ? chart.getDatasetMeta(classDatasetIndex).data : []
      const drawOverlayBar = (element, color) => {
        if (!element) return
        const { x, y, base, height } = element.getProps(['x', 'y', 'base', 'height'], true)
        const left = Math.min(base, x)
        const width = Math.abs(x - base)
        if (!width || !height) return
        const top = y - height / 2
        const radius = Math.min(5, height / 2, width / 2)
        context.save()
        context.fillStyle = color
        context.beginPath()
        context.roundRect(left, top, width, height, radius)
        context.fill()
        context.restore()
      }
      const drawCenteredLabel = (element, hours, color, visibleStart, verticalOffset = 0) => {
        if (!element) return
        const label = formatHoursLabel(hours)
        const { x, y, base } = element.getProps(['x', 'y', 'base'], true)
        if (hours <= 0) {
          context.textAlign = 'left'
          context.fillStyle = '#3e4548'
          context.fillText(label, base + 7, y + verticalOffset)
          return
        }
        context.textAlign = 'center'
        context.fillStyle = color === '#4b535a' ? '#fff' : '#3e4548'
        context.fillText(label, (visibleStart + x) / 2, y + verticalOffset)
      }
      context.save()
      context.font = `${workloadHoursFilter.value === 'all' ? '600 9px' : '600 11px'} Segoe UI, sans-serif`
      context.textBaseline = 'middle'
      workloadItems.forEach((teacher, index) => {
        if (workloadHoursFilter.value === 'all') {
          const workHours = Number(teacher.workHoursTotal) || 0
          const teachingHours = Number(teacher.totalHours) || 0
          const workBar = workElements[index]
          const teachingBar = classElements[index]
          const hasWorkHours = workHours > 0
          const hasTeachingHours = teachingHours > 0
          if (workHours < teachingHours) {
            drawOverlayBar(workBar, '#c0c7cc')
            if (hasWorkHours) drawCenteredLabel(workBar, workHours, '#c0c7cc', workBar?.base ?? 0)
            drawCenteredLabel(teachingBar, teachingHours, '#4b535a', workBar?.x ?? teachingBar?.base ?? 0)
          } else if (teachingHours < workHours) {
            drawOverlayBar(teachingBar, '#4b535a')
            if (hasTeachingHours) drawCenteredLabel(teachingBar, teachingHours, '#4b535a', teachingBar?.base ?? 0)
            drawCenteredLabel(workBar, workHours, '#c0c7cc', teachingBar?.x ?? workBar?.base ?? 0)
          } else {
            if (!hasWorkHours && !hasTeachingHours) {
              drawCenteredLabel(workBar, 0, '#c0c7cc', workBar?.base ?? 0)
            } else {
              if (hasWorkHours) drawCenteredLabel(workBar, workHours, '#c0c7cc', workBar?.base ?? 0, -4)
              if (hasTeachingHours) drawCenteredLabel(teachingBar, teachingHours, '#4b535a', teachingBar?.base ?? 0, 4)
            }
          }
        } else if (workloadHoursFilter.value === 'work') {
          drawCenteredLabel(workElements[index], Number(teacher.workHoursTotal) || 0, '#c0c7cc', workElements[index]?.base ?? 0)
        } else {
          drawCenteredLabel(classElements[index], Number(teacher.totalHours) || 0, '#4b535a', classElements[index]?.base ?? 0)
        }
      })
      context.restore()
    },
  }

  const datasets = []
  if (showWorkHours) {
    datasets.push({
      label: 'Work hours',
      data: workloadItems.map(teacher => Math.min(Number(teacher.workHoursTotal) || 0, workloadMaximumHours)),
      backgroundColor: '#c0c7cc',
      borderRadius: 5,
      borderSkipped: false,
      borderWidth: 0,
      barThickness: workloadHoursFilter.value === 'all' ? 13 : 14,
      maxBarThickness: workloadHoursFilter.value === 'all' ? 13 : 14,
      grouped: false,
      order: 0,
    })
  }
  if (showClassHours) {
    datasets.push({
      label: 'Teaching hours',
      data: workloadItems.map(teacher => Math.min(Number(teacher.totalHours) || 0, workloadMaximumHours)),
      backgroundColor: '#4b535a',
      borderRadius: 5,
      borderSkipped: false,
      borderWidth: 0,
      barThickness: workloadHoursFilter.value === 'all' ? 13 : 14,
      maxBarThickness: workloadHoursFilter.value === 'all' ? 13 : 14,
      grouped: false,
      order: 1,
    })
  }

  barChartInstance = new Chart(barChartRef.value, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { bottom: 16, left: 10, right: 12, top: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `${ctx.dataset.label}: ${formatHoursLabel(Number(ctx.raw) || 0)}`,
            afterLabel: (ctx) => {
              const teacher = workloadItems[ctx.dataIndex]
              const details = [...new Set((teacher?.schedule || []).map(entry =>
                [entry.subject, entry.section].filter(Boolean).join(' · '),
              ).filter(Boolean))]
              return [
                `Work hours: ${formatHoursLabel(Number(teacher?.workHoursTotal) || 0)}`,
                `Class hours: ${formatHoursLabel(Number(teacher?.totalHours) || 0)}`,
                'Configured work hours:',
                ...(teacher?.workHoursDays?.length
                  ? teacher.workHoursDays.map(workDay => `${workDay.day}: ${workDay.startTime} – ${workDay.endTime}`)
                  : ['Not configured']),
                `Units: ${teacher?.units || 0}`,
                'Subjects / sections:',
                ...(details.length ? details : ['No subject assignments']),
              ]
            },
          },
          backgroundColor: '#30353a',
          titleColor: '#f4f5f5',
          bodyColor: '#d8dcdf',
          borderColor: '#7d858d',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      onClick: (_e, elements) => {
        if (elements.length) openWorkloadModal(elements[0].index)
      },
      scales: {
        x: {
          beginAtZero: true,
          max: workloadMaximumHours,
          grid: { color: 'rgba(83, 91, 100, 0.12)', lineWidth: 0.5 },
          ticks: {
            color: '#3e4548',
            font: { size: 11, family: 'Segoe UI, sans-serif', weight: '600' },
            stepSize: 10,
            padding: 6,
            callback: (value) => `${value}h`
          },
          border: { display: false },
          title: { display: false }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#3e4548',
            font: {
              size: expanded ? 11 : 10,
              family: 'Segoe UI, sans-serif',
              weight: '600'
            },
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: expanded ? 10 : 8,
            callback: (value, index) => yTickLabels[index] || ''
          },
          border: { display: false },
          title: { display: false }
        }
      },
      datasets: {
        bar: {
          borderRadius: 5,
          borderSkipped: false,
          borderWidth: 0,
        }
      }
    },
    plugins: [workloadValueLabels],
  })
}

watch([workloadSearch, workloadHoursFilter], async () => {
  if (workloadFilterRedrawTimer) window.clearTimeout(workloadFilterRedrawTimer)
  await nextTick()
  workloadFilterRedrawTimer = window.setTimeout(() => {
    workloadFilterRedrawTimer = null
    createBarChart()
  }, 90)
})

onMounted(() => {
  loadDashboardSummary()
  loadChartData()
  loadTodayTeacherSchedules()
  loadNotifications()
  useNotifications.addNotificationListener(handleNotification)
  createLineChart()
  createBarChart()
  dashboardRealtimeTimer = window.setInterval(() => {
    currentDateTime.value = new Date()
    loadTodayTeacherSchedules({ quiet: true })
  }, 10000)
  window.addEventListener('focus', refreshTodayTeacherSchedules)
  document.addEventListener('visibilitychange', refreshTodayTeacherSchedules)
})

onUnmounted(() => {
  if (workloadFilterRedrawTimer) window.clearTimeout(workloadFilterRedrawTimer)
  if (dashboardRealtimeTimer) window.clearInterval(dashboardRealtimeTimer)
  window.removeEventListener('focus', refreshTodayTeacherSchedules)
  document.removeEventListener('visibilitychange', refreshTodayTeacherSchedules)
  useNotifications.removeNotificationListener(handleNotification)
  if (lineChartInstance) lineChartInstance.destroy()
  if (barChartInstance) barChartInstance.destroy()
})

function refreshTodayTeacherSchedules() {
  if (document.visibilityState === 'hidden') return
  currentDateTime.value = new Date()
  loadTodayTeacherSchedules({ quiet: true })
}

function handleLogout() {
  logout()
  router.push('/')
}

const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
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
  border: 3px solid #c4c9cd;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #30353a;
}
.role {
  font-size: 0.88rem;
  color: #444;
  font-weight: 500;
}
.email {
  font-size: 0.82rem;
  color: #888;
  word-break: break-all;
}

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
.nav-item:hover { background: #f1f2f2; color: #30353a; }
.nav-item.active { background: #30353a; color: #fff; }
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
  padding: 24px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #68747d;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.page-title {
  margin: 0;
  color: #202830;
  font-size: clamp(2rem, 3vw, 2.55rem);
  font-weight: 700;
  letter-spacing: -0.04em;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* Notification */
.notif-wrap {
  position: relative;
  padding-top: 0;
}
.notif-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.notif-btn:hover { color: #30353a; }
.notif-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 13px;
  height: 13px;
  background: #e8a020;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

/* Notification Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: min(480px, calc(100vw - 32px));
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(250,251,251,.98), rgba(218,223,226,.96));
  box-shadow: 0 18px 42px rgba(35,43,49,.24), inset 0 1px rgba(255,255,255,.95);
  z-index: 999;
  overflow: hidden;
}
.notification-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: min(330px, calc(100vw - 32px));
  padding: 18px;
  border: 1px solid rgba(255,255,255,.76);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f3 0%, #d9dddf 54%, #c4c9cc 100%);
  box-shadow: 0 18px 42px rgba(35,43,49,.24), inset 0 1px rgba(255,255,255,.9);
  z-index: 1000;
}
.notification-preview-close {
  position: absolute;
  top: 10px;
  right: 11px;
  width: 24px;
  height: 24px;
  border: 1px solid #aab2b7;
  border-radius: 6px;
  background: #d7dbdd;
  color: #58636a;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.notification-preview-close:hover { background: #c8ced1; color: #303940; }
.notification-preview-kicker {
  display: block;
  margin-bottom: 12px;
  color: #6d7a82;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.notification-preview-heading { display: flex; align-items: center; gap: 10px; padding-right: 24px; }
.notification-preview-avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 2px solid rgba(255,255,255,.86);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 3px 8px rgba(46,55,62,.14);
}
.notification-preview-heading h2 { margin: 0; color: #252d33; font-size: .9rem; line-height: 1.25; }
.notification-preview-heading time { display: block; margin-top: 3px; color: #78848b; font-size: .68rem; }
.notification-preview-message { margin: 16px 0; color: #53616a; font-size: .78rem; line-height: 1.5; }
.notification-preview-meta { display: grid; gap: 8px; margin: 0; padding-top: 12px; border-top: 1px solid rgba(103,114,121,.2); }
.notification-preview-meta div { display: flex; justify-content: space-between; gap: 12px; }
.notification-preview-meta dt { color: #77838a; font-size: .68rem; font-weight: 700; }
.notification-preview-meta dd { margin: 0; color: #3f4b52; font-size: .68rem; font-weight: 700; text-align: right; }
.notif-panel-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid rgba(119,130,138,.2);
}
.notif-panel-header > div { display: flex; flex-direction: column; gap: 3px; }
.notif-panel-kicker { color: #71808a; font-size: .62rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.notif-panel-title {
  color: #263139;
  font-size: 1.05rem;
  font-weight: 800;
}
.notif-count {
  padding: 4px 8px;
  border: 1px solid #b4bec3;
  border-radius: 999px;
  color: #596871;
  background: rgba(255,255,255,.55);
  font-size: .64rem;
  font-weight: 700;
  white-space: nowrap;
}
.notif-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 8px;
}
.notif-tab {
  background: transparent;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 6px 11px;
  border-radius: 8px;
  transition: background 0.18s, color 0.18s;
}
.notif-tab.active {
  border-color: #3f4c55;
  background: linear-gradient(145deg, #687780, #3f4c55);
  color: #fff;
  box-shadow: 0 3px 8px rgba(48,53,58,.16);
}
.notif-see-all {
  margin-left: auto;
  padding: 6px 8px;
  border: 1px solid #a5adb2;
  border-radius: 6px;
  background: #d7dbdd;
  color: #4a555c;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .18s, border-color .18s, color .18s;
}
.notif-see-all:hover {
  background: #c8ced1;
  border-color: #858f96;
  color: #303940;
}
.notif-see-all:active {
  background: #bcc3c7;
}
.notif-clear-all {
  padding: 6px 8px;
  border: 1px solid #e5c8c8;
  border-radius: 6px;
  background: #fff;
  color: #a33f3f;
  font-family: inherit;
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.notif-clear-all:disabled { cursor: not-allowed; opacity: .5; }
.notif-clear-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(20, 28, 35, .48);
}
.notif-clear-dialog {
  width: min(100%, 360px);
  padding: 24px;
  border: 1px solid #e4e8eb;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(19, 30, 39, .22);
}
.notif-clear-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: #fff0f0;
  color: #a33f3f;
}
.notif-clear-icon svg { width: 21px; height: 21px; }
.notif-clear-dialog h2 { margin: 16px 0 6px; color: #22272d; font-size: 1.08rem; font-weight: 700; }
.notif-clear-dialog p { margin: 0; color: #697581; font-size: .84rem; line-height: 1.5; }
.notif-clear-dialog .notif-clear-error { margin-top: 10px; color: #a33f3f; }
.notif-clear-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }
.notif-clear-actions button { min-height: 40px; padding: 0 14px; border: 1px solid transparent; border-radius: 8px; font-family: inherit; font-size: .82rem; font-weight: 600; }
.notif-clear-cancel { border-color: #d8dde3 !important; background: #fff; color: #4a525b; }
.notif-clear-confirm { background: #a33f3f; color: #fff; }
.notif-clear-actions button:disabled { cursor: wait; opacity: .65; }
.notif-section-label {
  color: #596871;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
  padding: 12px 18px 6px;
}
.notif-list-wrap {
  max-height: 390px;
  overflow-y: auto;
  padding-bottom: 8px;
}
.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-empty {
  text-align: center;
  font-size: 0.85rem;
  color: #aaa;
  padding: 24px 20px;
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 18px;
  border-top: 1px solid rgba(126,136,143,.12);
  transition: background 0.15s;
  cursor: pointer;
}
.notif-item:hover { background: rgba(255,255,255,.48); }
.notif-item.selected { background: linear-gradient(90deg, rgba(255,255,255,.72), rgba(198,205,209,.48)); box-shadow: inset 3px 0 #66747d; }
.notif-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.85);
  object-fit: cover;
  box-shadow: 0 3px 8px rgba(46,55,62,.14);
  flex-shrink: 0;
}
.notif-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  color: #53616a;
  line-height: 1.35;
}
.notif-text strong { overflow: hidden; color: #263139; font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
.notif-text small { overflow: hidden; font-size: .7rem; text-overflow: ellipsis; white-space: nowrap; }
.notif-text time { color: #8a969d; font-size: .62rem; font-weight: 600; }
.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e8a020;
  box-shadow: 0 0 0 3px rgba(232,160,32,.14);
  flex-shrink: 0;
}

/* Stat Cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  border-radius: 16px;
  padding: 26px 28px 22px;
  box-shadow: 0 4px 18px rgba(48, 53, 58,0.10);
  background: #fff;
  color: #30353a;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 0.88rem;
  color: #888;
  font-weight: 400;
}
.stat-icon { display: flex; align-items: center; }
.stat-value {
  font-size: 2.8rem;
  font-weight: 600;
  color: #30353a;
  line-height: 1.1;
}
.stat-sub {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 4px;
}

/* Today's teacher schedule carousel */
.today-teachers-section { position: relative; margin-bottom: 28px; padding: 26px 28px 18px; overflow: visible; border: 1px solid #bcc4c9; border-radius: 20px; background: linear-gradient(145deg, #f7f8f9 0%, #dfe3e6 52%, #f2f4f5 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 12px 32px rgba(36,47,55,.13); }
.today-teachers-header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.today-section-eyebrow { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; color: #52655d; font-size: .68rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.today-section-eyebrow i { width: 8px; height: 8px; border: 2px solid #c9e1d2; border-radius: 50%; background: #4b8b65; box-shadow: 0 0 0 3px #e8f3ec; }
.today-teachers-header h2 { margin: 0; color: #202a31; font-size: 1.35rem; letter-spacing: -.025em; line-height: 1.35; }
.today-teachers-header p { margin: 5px 0 0; color: #63717a; font-size: .8rem; }
.today-teachers-header p span { margin-left: 7px; padding-left: 9px; border-left: 1px solid #ccd4d8; color: #89939a; }
.today-carousel-controls {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid #c5cdd1;
  border-radius: 9px;
  background: rgba(255,255,255,.58);
  color: #66727a;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .02em;
  white-space: nowrap;
}
.today-carousel-controls i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #59656d;
  box-shadow: 0 0 0 3px rgba(89,101,109,.12);
}
.today-carousel-controls i.is-paused { background: #b88638; box-shadow: 0 0 0 3px rgba(184,134,56,.14); }
.today-carousel-controls button {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid #d0d6d9;
  border-radius: 7px;
  background: rgba(255,255,255,.8);
  color: #45534d;
  cursor: pointer;
  font: 700 1.15rem/1 'Segoe UI', sans-serif;
}
.today-carousel-controls button:hover { background: #fff; border-color: #9aaba2; }
.today-carousel-controls button:focus-visible { outline: 2px solid #658977; outline-offset: 2px; }
/* Table format styles */
.today-schedule-table-wrap { 
  overflow: hidden;
  overflow-y: hidden;
  border-radius: 16px;
  background: rgba(255,255,255,0.7);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  position: relative;
  animation: tableSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  user-select: none;
  touch-action: pan-y;
}
.today-schedule-table-wrap.manual-carousel-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
}
.today-schedule-table-wrap.manual-carousel-scroll::-webkit-scrollbar { display: none; }
.today-schedule-table-wrap.manual-carousel-scroll.is-dragging { cursor: grabbing; }
.today-schedule-table-wrap.manual-carousel-scroll .today-schedule-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 240px;
  grid-template-columns: none;
  width: max-content;
  min-width: 0;
  transform: none;
}
.today-schedule-table-wrap.manual-carousel-scroll .teacher-schedule-column {
  width: 240px;
  min-width: 240px;
  scroll-snap-align: start;
}
@keyframes tableSlideIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.today-schedule-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  background: #fff;
  animation: none;
}
.carousel-enabled .today-schedule-track {
  min-width: 0;
  animation: infiniteCarousel 34s linear infinite;
}
@keyframes infiniteCarousel {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}
.today-schedule-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 240px;
  width: max-content;
  min-width: 100%;
  align-items: start;
  background: transparent;
}
.today-schedule-track:not(.carousel-table) {
  width: 100%;
  min-width: 0;
  grid-template-columns: repeat(var(--teacher-columns), minmax(0, 1fr));
  grid-auto-flow: initial;
  grid-auto-columns: auto;
}
.teacher-schedule-column {
  min-width: 240px;
  width: 240px;
  border-right: 1px solid #e8ecf0;
  background: transparent;
}
.teacher-schedule-column:last-child { border-right: none; }
.today-schedule-track:not(.carousel-table) .teacher-schedule-column {
  min-width: 0;
  width: auto;
}
.today-schedule-track:not(.carousel-table) .teacher-col-header {
  min-width: 0;
  width: 100%;
  max-width: none;
  padding-inline: clamp(8px, 1.5vw, 18px);
}
.today-schedule-track:not(.carousel-table) .teacher-header-avatar {
  width: clamp(48px, 5vw, 64px);
  height: clamp(48px, 5vw, 64px);
}
.today-schedule-track:not(.carousel-table) .teacher-schedule-list {
  padding-inline: clamp(6px, 1vw, 12px);
}
.today-schedule-track:not(.carousel-table) .schedule-entry {
  padding-inline: clamp(8px, 1vw, 12px);
}
.teacher-col-header { 
  padding: 22px 18px 20px;
  text-align: center;
  border-bottom: 3px solid #e1e6e9;
  border-right: none;
  background: linear-gradient(180deg, #fbfcfd 0%, #f3f5f7 100%);
  position: relative;
  min-width: 240px;
  width: 240px;
  max-width: 240px;
  transition: all 0.3s ease;
  vertical-align: top;
}
.teacher-col-header:last-child {
  border-right: none;
}
.teacher-header-avatar { 
  width: 64px; 
  height: 64px; 
  border: 3px solid #fff; 
  border-radius: 16px; 
  object-fit: cover; 
  box-shadow: 0 6px 16px rgba(36,48,56,0.14); 
  margin: 0 auto 12px;
  display: block;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.teacher-col-header:hover .teacher-header-avatar {
  transform: scale(1.08) rotate(2deg);
}
.teacher-header-info { 
  text-align: center; 
}
.teacher-header-name { 
  display: block; 
  font-weight: 700; 
  color: #202830; 
  font-size: 0.95rem; 
  margin-bottom: 6px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  line-height: 1.3;
}
.teacher-header-status { 
  display: inline-block; 
  flex: 0 0 auto; 
  padding: 6px 10px; 
  border-radius: 8px; 
  font-size: 0.62rem; 
  font-weight: 800; 
  letter-spacing: 0.05em; 
  white-space: nowrap;
  text-transform: uppercase;
  animation: statusPulse 1.5s ease-in-out infinite;
}
.teacher-header-status.is-live { 
  color: #146a3a; 
  border: 1.5px solid #4caf50; 
  background: #e8f5e9;
  box-shadow: 0 2px 6px rgba(76,175,80,0.15);
}
@keyframes statusPulse {
  0%, 100% { box-shadow: 0 2px 6px rgba(76,175,80,0.15); }
  50% { box-shadow: 0 2px 12px rgba(76,175,80,0.3); }
}
.teacher-header-status.is-next { 
  color: #5d4e1f; 
  border: 1.5px solid #ffa726; 
  background: #fff3e0;
  box-shadow: 0 2px 6px rgba(255,167,38,0.12);
}
.teacher-header-status.is-done { 
  color: #546e7a; 
  border: 1.5px solid #90a4ae; 
  background: #eceff1;
  box-shadow: 0 2px 6px rgba(144,164,174,0.12);
}
.teacher-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 12px 18px;
  border-top: 1px solid #e1e6e9;
}
.no-more-classes,
.view-more-schedules-btn {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 2px 6px 0;
  padding: 8px 6px;
  border: 1px dashed #d8dfe3;
  border-radius: 8px;
  color: #a0a9b0;
  font-size: 0.62rem;
  font-weight: 600;
  text-align: center;
}
.view-more-schedules-btn {
  width: 100%;
  align-self: stretch;
  margin: 2px 6px 0;
  padding: 6px 9px;
  cursor: pointer;
  color: #496c5a;
  border-style: solid;
  border-color: #a9c5b4;
  background: #f7fbf8;
  font-family: inherit;
  font-size: .64rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .02em;
  white-space: nowrap;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.view-more-schedules-btn:hover,
.view-more-schedules-btn:focus-visible {
  border-color: #5d9273;
  background: #e5f2e9;
  box-shadow: 0 3px 9px rgba(45, 100, 70, .14);
  outline: none;
  transform: translateY(-1px);
}
.view-more-schedules-btn span { font-size: .74rem; line-height: 1; }
.schedule-row {
  border-bottom: 1px solid #e8ecf0;
  transition: background 0.15s ease;
}
.schedule-row:hover {
  background: #f8f9fa;
}
.schedule-cell {
  padding: 14px 12px;
  border-right: 1px solid #e8ecf0;
  text-align: center;
  vertical-align: top;
  min-height: 130px;
  display: table-cell;
  min-width: 240px;
  width: 240px;
  max-width: 240px;
}
.schedule-cell:last-child { 
  border-right: none; 
}
.schedule-entry { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  min-height: 110px; 
  padding: 13px 12px 12px;
  border: 1.5px solid #e1e6e9;
  border-radius: 12px; 
  background: #f9fafb;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(25, 35, 45, 0.04);
}
.today-schedule-track.single-teacher-layout .schedule-entry {
  align-items: center;
  text-align: center;
}
.today-schedule-track.single-teacher-layout .schedule-entry .schedule-details {
  flex: 0 1 auto;
  width: 100%;
}
.today-schedule-track.single-teacher-layout .schedule-entry .schedule-time,
.today-schedule-track.single-teacher-layout .schedule-entry .schedule-label {
  align-self: center;
}
.schedule-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: all 0.3s ease;
}
.schedule-entry.is-current { 
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-color: #4caf50;
  border-width: 2px;
  box-shadow: 0 6px 18px rgba(76,175,80,0.25), 0 0 0 3px rgba(76,175,80,0.1), inset 0 1px 0 rgba(255,255,255,0.5);
  transform: translateY(-2px);
}
.schedule-entry.is-current::before {
  background: #4caf50;
  animation: liveIndicator 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes liveIndicator {
  0%, 100% { height: 3px; background: #4caf50; }
  50% { height: 4px; background: #66bb6a; }
}
.schedule-entry.is-upcoming { 
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-color: #ffa726;
  box-shadow: 0 3px 10px rgba(255,167,38,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
}
.schedule-entry.is-upcoming::before {
  background: #ffa726;
}
.schedule-entry.is-complete { 
  opacity: 0.6; 
  background: #eceff1;
  border-color: #90a4ae;
  box-shadow: 0 2px 8px rgba(144,164,174,0.08);
}
.schedule-entry.is-complete::before {
  background: #90a4ae;
}
.schedule-entry.is-lecture {
  opacity: 1;
  color: #5a3e00;
  background: #e9c46a;
  border-color: #d3aa4f;
  box-shadow: 0 3px 10px rgba(211, 170, 79, .18), inset 0 1px 0 rgba(255,255,255,.42);
}
.schedule-entry.is-laboratory {
  opacity: 1;
  color: #fff;
  background: #1f6b45;
  border-color: #185638;
  box-shadow: 0 3px 10px rgba(31, 107, 69, .2), inset 0 1px 0 rgba(255,255,255,.18);
}
.schedule-entry.is-lecture::before,
.schedule-entry.is-laboratory::before {
  background: rgba(255,255,255,.55);
}
.schedule-entry.is-lecture .schedule-section,
.schedule-entry.is-lecture .schedule-label { color: #5a3e00; }
.schedule-entry.is-laboratory .schedule-section,
.schedule-entry.is-laboratory .schedule-label { color: rgba(255,255,255,.88); }
.schedule-entry:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.12);
}
.schedule-time { 
  display: block; 
  font-weight: 700; 
  font-size: 0.78rem; 
  color: #1a2332; 
  text-align: center;
  letter-spacing: 0.01em;
}
.schedule-time small { 
  display: block; 
  margin-top: 3px; 
  font-size: 0.66rem; 
  font-weight: 600; 
  color: #64727d;
}
.schedule-details { 
  display: flex; 
  flex-direction: column; 
  gap: 3px;
  flex: 1;
  justify-content: center;
}
.today-schedule-track.single-teacher-layout .schedule-details {
  align-items: center;
  text-align: center;
}
.today-schedule-track.single-teacher-layout .schedule-subject,
.today-schedule-track.single-teacher-layout .schedule-section {
  width: 100%;
  text-align: center;
}
.schedule-subject { 
  display: block; 
  color: #1f2937; 
  font-size: 0.79rem; 
  font-weight: 700; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  line-height: 1.2;
}
.schedule-section { 
  display: block; 
  color: #64727d; 
  font-size: 0.68rem; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  font-weight: 500;
}
.schedule-label { 
  display: inline-block; 
  padding: 4px 8px; 
  border-radius: 6px; 
  background: #f0f3f5; 
  color: #546e7a; 
  font-size: 0.56rem; 
  font-style: normal; 
  font-weight: 800; 
  text-transform: uppercase; 
  text-align: center;
  letter-spacing: 0.04em;
  margin: 0 auto;
  min-width: max-content;
  animation: labelFadeIn 0.6s ease forwards;
  opacity: 0;
}
@keyframes labelFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.schedule-entry.is-upcoming .schedule-label { 
  color: #5d4e1f; 
  background: #ffd699;
}
.schedule-entry.is-current .schedule-label { 
  color: #146a3a; 
  background: #81c784;
  animation: labelPulse 1.5s ease-in-out infinite;
  opacity: 1;
}
.schedule-entry.is-lecture .schedule-time,
.schedule-entry.is-lecture .schedule-time small,
.schedule-entry.is-lecture .schedule-subject,
.schedule-entry.is-lecture .schedule-section {
  color: #4f3600;
}
.schedule-entry.is-laboratory .schedule-time,
.schedule-entry.is-laboratory .schedule-time small,
.schedule-entry.is-laboratory .schedule-subject,
.schedule-entry.is-laboratory .schedule-section {
  color: #fff;
}
.schedule-entry.is-lecture .schedule-label {
  color: #4f3600;
  background: rgba(255,255,255,.48);
}
.schedule-entry.is-laboratory .schedule-label {
  color: #174c34;
  background: rgba(255,255,255,.82);
}
@keyframes labelPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.today-teachers-loading, .today-teachers-empty { 
  display: flex; 
  min-height: 150px; 
  align-items: center; 
  justify-content: center; 
  flex-direction: column; 
  color: #747d84; 
  font-size: 0.76rem; 
  text-align: center;
}
.today-teachers-empty span { 
  color: #2c3e50; 
  font-size: 0.92rem; 
  font-weight: 700;
  margin-bottom: 6px;
}
.today-teachers-empty p { 
  margin: 0; 
  color: #818c93; 
  font-size: 0.72rem;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  flex: 0 0 auto;
  min-height: 0;
  margin-top: 18px;
  margin-bottom: 28px;
  padding-bottom: 0;
}
.chart-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(240,240,239,0.82) 100%);
  border: 1px solid rgba(120, 127, 133, 0.12);
  border-radius: 18px;
  padding: 18px 18px 14px;
  box-shadow: 0 10px 18px rgba(30, 36, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.7);
  display: flex;
  flex-direction: column;
  min-height: 600px;
  min-width: 0;
  overflow: hidden;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
  margin-bottom: 0;
}
.chart-card.chart-expanded {
  grid-column: 1 / -1;
  min-height: 700px;
}
.chart-card.chart-hidden {
  display: none;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
  padding: 2px 2px 0;
}
.chart-heading-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.chart-caption { color: #7a858d; font-size: .68rem; font-weight: 600; letter-spacing: .015em; }
.consultation-filter-row { display: flex; align-items: center; gap: 9px; margin: 0 2px 12px; }
.filter-row-label { color: #77818a; font-size: .63rem; font-weight: 700; letter-spacing: .045em; text-transform: uppercase; }
.workload-chart-heading {
  display: flex;
  align-items: flex-start;
  gap: 8px 12px;
  min-width: 0;
  flex: 1;
}
.workload-term-filter {
  width: 100%;
  min-height: 38px;
  padding: 7px 30px 7px 10px;
  border: 1px solid rgba(120, 127, 133, 0.24);
  border-radius: 9px;
  background: #fff;
  color: #465159;
  font: 600 0.74rem 'Segoe UI', sans-serif;
}
.workload-filter-row { display: grid; grid-template-columns: minmax(150px, 1.2fr) minmax(120px, .9fr) minmax(140px, 1fr); gap: 9px; margin: 0 2px 10px; }
.workload-filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; color: #77818a; font-size: .62rem; font-weight: 700; letter-spacing: .045em; text-transform: uppercase; }
.workload-filter-field input,
.workload-filter-field select { box-sizing: border-box; width: 100%; min-width: 0; min-height: 38px; padding: 7px 10px; border: 1px solid rgba(120,127,133,.22); border-radius: 9px; background: #fff; color: #465159; font: 600 .72rem 'Segoe UI',sans-serif; letter-spacing: normal; text-transform: none; transition: border-color .18s,box-shadow .18s; }
.workload-filter-field input::placeholder { color: #a0a8ad; font-weight: 500; }
.workload-term-filter:focus,
.workload-filter-field input:focus,
.workload-filter-field select:focus { border-color: #658977; box-shadow: 0 0 0 3px rgba(58,112,83,.12); outline: none; }
.workload-term-empty { display: flex; min-height: 38px; align-items: center; padding: 7px 10px; border: 1px solid rgba(120,127,133,.16); border-radius: 9px; background: rgba(255,255,255,.55); color: #858e94; font-size: .72rem; letter-spacing: normal; text-transform: none; }
.workload-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 10px;
  color: #68727a;
  font-size: 0.64rem;
  font-weight: 600;
  margin: 0 2px 10px;
}
.workload-legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.workload-result-count { margin-left: auto; color: #8a9399; font-weight: 600; }
.workload-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}
.workload-dot--work { background: #c0c7cc; }
.workload-dot--classes { background: #4b535a; }
.chart-heading-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-width: 0;
}
.chart-title {
  font-size: clamp(1.08rem, 1.3vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #2a2f34;
  text-shadow: 0 1px 0 rgba(255,255,255,0.45);
  max-width: 100%;
  white-space: normal;
}
.chart-period-control {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 2px;
  padding: 3px;
  border: 1px solid rgba(120, 127, 133, 0.16);
  border-radius: 10px;
  background: rgba(232, 235, 235, 0.72);
}
.chart-period-control button {
  min-width: 52px;
  min-height: 32px;
  padding: 6px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #66717a;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}
.chart-period-control button.is-active {
  background: #fff;
  color: #245b40;
  box-shadow: 0 1px 3px rgba(48, 53, 58, 0.14);
}
.chart-period-control button:focus-visible,
.expand-btn:focus-visible { outline: 2px solid #658977; outline-offset: 2px; }
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  display: flex;
  transition: color 0.2s;
}
.expand-btn:hover { color: #30353a; }
.chart-wrap {
  flex: 1;
  min-height: 440px;
  height: 460px;
  position: relative;
}
.chart-wrap.is-loading canvas { visibility: hidden; }
.chart-loading-overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  border-radius: 12px;
  background: #f7f9f9;
  color: #58656c;
  text-align: center;
  pointer-events: none;
}
.chart-empty-overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  padding: 24px;
  border-radius: 12px;
  background: rgba(247, 249, 249, .94);
  color: #58656c;
  text-align: center;
}
.chart-empty-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid #d6dfda;
  border-radius: 50%;
  background: #edf3ef;
  color: #54745f;
  font-size: 1.05rem;
  font-weight: 700;
}
.chart-loading-overlay strong { color: #35413f; font-size: .84rem; font-weight: 700; }
.chart-loading-overlay > span:last-child { color: #849097; font-size: .7rem; font-weight: 500; }
.chart-empty-overlay strong { max-width: 360px; color: #35413f; font-size: .84rem; font-weight: 700; }
.chart-empty-overlay > span:last-child { max-width: 390px; color: #849097; font-size: .7rem; font-weight: 500; line-height: 1.5; }
.chart-loading-spinner {
  width: 27px;
  height: 27px;
  border: 3px solid rgba(67, 112, 89, .18);
  border-top-color: #437159;
  border-radius: 50%;
  animation: chartLoadingSpin .75s linear infinite;
}
@keyframes chartLoadingSpin { to { transform: rotate(360deg); } }
.workload-chart-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 480px;
  min-height: 440px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 12px 10px 8px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
  display: flex;
  align-items: stretch;
  justify-content: center;
  border: 1px solid rgba(90,98,104,0.08);
}
.workload-empty-state { display: grid; width: 100%; min-height: 220px; place-items: center; color: #7a858d; font-size: .82rem; font-weight: 600; }
.workload-chart-wrap::-webkit-scrollbar { display: none; }
.workload-chart-wrap canvas {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  min-height: 430px;
  flex: 1;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 36px 28px;
  width: min(1400px, 92vw);
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
}
.modal-close {
  position: absolute;
  top: 18px;
  right: 22px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #555;
  line-height: 1;
}
.modal-close:hover { color: #111; }
.modal-header { margin-bottom: 18px; }
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}
.modal-sub {
  font-size: 0.88rem;
  color: #888;
}
.modal-teacher-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-teacher-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #c4c9cd;
  flex-shrink: 0;
}
.modal-teacher-info { flex: 1; }
.modal-teacher-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
}
.modal-hours-badge {
  background: #8b9298;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 6px 18px;
  border-radius: 20px;
  white-space: nowrap;
}
.modal-schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  max-width: 100%;
  min-width: 0;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-sched-card {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 14px 16px;
}
.modal-empty-schedule {
  margin-bottom: 20px;
  padding: 28px 18px;
  border: 1px dashed #cbd2d6;
  border-radius: 12px;
  color: #69727c;
  text-align: center;
}
.consultation-day-modal {
  width: min(620px, calc(100vw - 32px));
  max-width: 620px;
  padding: 30px 30px 26px;
  border: 1px solid rgba(255,255,255,.72);
  background: linear-gradient(145deg, #f0f2f3 0%, #d9dddf 52%, #c4c9cc 100%);
  box-shadow: 0 24px 58px rgba(25,31,36,.28), inset 0 1px rgba(255,255,255,.9);
}
.consultation-day-modal .modal-close {
  top: 16px;
  right: 18px;
  width: 28px;
  height: 28px;
  border: 1px solid #aab2b7;
  border-radius: 8px;
  background: #d7dbdd;
  color: #58636a;
  font-size: 1rem;
  box-shadow: inset 0 1px rgba(255,255,255,.78);
}
.consultation-day-modal .modal-close:hover {
  background: #c8ced1;
  color: #303940;
}
.consultation-day-modal .modal-title { color: #252d33; font-size: 1.35rem; }
.consultation-day-modal .modal-sub { color: #68747b; }
.consultation-day-list { display: flex; flex-direction: column; gap: 9px; max-height: 55vh; overflow-y: auto; }
.consultation-day-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 15px; border: 1px solid #b6bec2; border-radius: 10px; background: linear-gradient(145deg, #f7f8f8, #dfe3e5); box-shadow: inset 0 1px rgba(255,255,255,.8), 0 4px 10px rgba(45,53,59,.08); }
.consultation-day-item-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.consultation-day-item-main strong { color: #252d33; font-size: .88rem; }
.consultation-day-item-main span { color: #68747b; font-size: .76rem; }
.consultation-status { flex-shrink: 0; padding: 5px 9px; border: 1px solid #a8b2b8; border-radius: 999px; background: #d7dde0; color: #4c5b63; font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; }
.modal-sched-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.modal-day-badge {
  background: #e0f0ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.modal-sched-time {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-dur {
  font-size: 0.8rem;
  color: #555;
}
.modal-sched-subject {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}
.modal-sched-section {
  font-size: 0.82rem;
  color: #888;
}
.modal-summary {
  background: #8b9298;
  border-radius: 14px;
  padding: 18px 22px;
  color: #fff;
}
.modal-summary-label {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 14px;
}
.modal-summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}
.modal-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.modal-summary-key {
  font-size: 0.78rem;
  opacity: 0.85;
}
.modal-summary-val {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}
.workload-modal {
  --workload-modal-pad-inline: clamp(22px, 3vw, 38px);
  box-sizing: border-box;
  width: min(1320px, calc(100vw - 48px));
  max-width: 1320px;
  max-height: min(90dvh, 960px);
  padding: clamp(22px, 3vw, 38px) clamp(22px, 3vw, 38px) 0;
  border: 1px solid #d6dde1;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 22px 56px rgba(28,36,42,.24);
  scrollbar-color: #aab6b0 transparent;
  scrollbar-width: thin;
}
.workload-modal .modal-close {
  top: 18px;
  right: 18px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #d5ddda;
  border-radius: 11px;
  background: #fff;
  color: #53615a;
  font-size: 1.05rem;
  transition: background .18s ease, color .18s ease, transform .18s ease;
}
.workload-modal .modal-close:hover { background: #fff; color: #30383d; transform: translateY(-1px); }
.workload-modal .modal-header { margin-bottom: 22px; padding-right: 48px; }
.workload-modal .modal-title { margin: 0 0 5px; color: #252c31; font-size: clamp(1.35rem, 2.2vw, 1.8rem); letter-spacing: -.035em; }
.workload-modal .modal-sub { margin: 0; color: #687279; font-size: .9rem; line-height: 1.5; }
.workload-modal .modal-teacher-row {
  box-sizing: border-box;
  width: auto;
  min-width: 0;
  margin-bottom: 25px;
  margin-left: calc(0px - var(--workload-modal-pad-inline));
  margin-right: calc(0px - var(--workload-modal-pad-inline));
  padding: 15px 17px;
  border: 1px solid #d6dde1;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
}
.workload-modal .modal-teacher-avatar { width: 58px; height: 58px; border-color: #cdd3d7; }
.workload-modal .modal-teacher-name { color: #273139; font-size: clamp(1.05rem, 1.8vw, 1.3rem); overflow-wrap: anywhere; }
.modal-teacher-metrics { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.workload-modal .modal-hours-badge,
.modal-units-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 9px 13px;
  border: 1px solid #d8dde0;
  border-radius: 11px;
  background: #f5f6f7;
  color: #4a5359;
  font-size: .76rem;
  font-weight: 700;
  white-space: nowrap;
}
.workload-modal .modal-hours-badge strong { color: #111; font-size: 1rem; }
.workload-modal .modal-hours-badge small { color: #111; font-size: .68rem; font-weight: 600; }
.modal-units-badge { border-color: #d9dee1; background: #f5f6f7; color: #111; text-transform: capitalize; }
.modal-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.modal-section-heading h3 { margin: 0; color: #2d3439; font-size: 1rem; font-weight: 750; }
.modal-section-heading p { margin: 3px 0 0; color: #788188; font-size: .76rem; }
.modal-section-heading > span { flex: 0 0 auto; padding: 6px 10px; border-radius: 999px; background: #eceff1; color: #58636a; font-size: .7rem; font-weight: 700; }
.modal-work-hours-section { margin: 0 0 24px; }
.modal-work-hours-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.modal-work-hours-day { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; padding: 10px 12px; border: 1px solid #dce1e4; border-radius: 9px; background: #fff; }
.modal-work-hours-day span { color: #667178; font-size: .72rem; font-weight: 650; }
.modal-work-hours-day strong { color: #303a40; font-size: .72rem; font-weight: 700; text-align: right; white-space: nowrap; }
.modal-work-hours-empty { padding: 14px; border: 1px dashed #cbd2d6; border-radius: 10px; color: #69747b; background: #f8f9fa; font-size: .78rem; }
.workload-modal .modal-schedule-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 12px; margin-bottom: 22px; }
.workload-modal .modal-sched-card {
  min-width: 0;
  padding: 15px 16px;
  border: 1px solid #dce1e4;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(36,43,48,.04);
  transition: border-color .18s ease, box-shadow .18s ease;
}
.workload-modal .modal-sched-card:hover { border-color: #c5cdd1; box-shadow: 0 3px 9px rgba(36,43,48,.07); }
.workload-modal .modal-sched-top { justify-content: space-between; gap: 10px; margin-bottom: 13px; }
.workload-modal .modal-day-badge { padding: 5px 10px; background: #eceff1; color: #4d5960; font-size: .7rem; font-weight: 750; }
.modal-sched-time-meta { display: flex; min-width: 0; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
.workload-modal .modal-sched-time { color: #4d565c; font-size: .74rem; font-weight: 650; }
.workload-modal .modal-sched-dur { color: #788188; font-size: .68rem; font-weight: 600; }
.workload-modal .modal-sched-subject { margin: 0 0 7px; color: #293035; font-size: .93rem; line-height: 1.45; overflow-wrap: anywhere; }
.workload-modal .modal-sched-section { color: #737d83; font-size: .76rem; line-height: 1.45; overflow-wrap: anywhere; }
.workload-modal .modal-empty-schedule { margin: 0 0 22px; border-color: #d0d6d9; background: #f8f9fa; color: #626d73; line-height: 1.5; }
.workload-modal .modal-summary { box-sizing: border-box; width: auto; margin-left: calc(0px - var(--workload-modal-pad-inline)); margin-right: calc(0px - var(--workload-modal-pad-inline)); padding: 18px 20px; border: 1px solid #d6dde1; border-radius: 0; background: #fff; box-shadow: none; }
.workload-modal .modal-summary-label { margin-bottom: 15px; color: #35414a; font-size: .9rem; }
.workload-modal .modal-summary-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.workload-modal .modal-summary-item { position: relative; min-width: 0; align-items: flex-start; gap: 7px; padding: 0 44px 0 14px; border-left: 1px solid rgba(91,103,112,.2); }
.workload-modal .modal-summary-item:first-child { padding-left: 0; border-left: 0; }
.workload-modal .modal-summary-key { color: #66727a; font-size: .72rem; line-height: 1.35; }
.workload-modal .modal-summary-val { color: #273139; font-size: 1.7rem; }
.workload-modal .modal-summary-icon { position: absolute; top: 50%; right: 8px; width: 25px; height: 25px; color: #77848c; transform: translateY(-50%); }
@media (max-width: 760px) {
  .workload-modal-overlay { box-sizing: border-box; padding: 14px; }
  .workload-modal { --workload-modal-pad-inline: 20px; width: 100%; max-width: 100%; max-height: 92dvh; padding: 24px 20px 0; }
  .workload-modal .modal-schedule-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); }
  .modal-work-hours-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .workload-modal .modal-summary-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 18px; }
  .workload-modal .modal-summary-item:nth-child(3) { padding-left: 0; border-left: 0; }
}
@media (max-width: 480px) {
  .workload-modal-overlay { align-items: flex-end; padding: 0; }
  .workload-modal {
    --workload-modal-pad-inline: 16px;
    width: 100vw;
    max-width: 100vw;
    max-height: 94dvh;
    padding: 22px 16px 0;
    border-radius: 20px 20px 0 0;
  }
  .workload-modal .modal-close { top: 13px; right: 13px; width: 34px; height: 34px; }
  .workload-modal .modal-header { margin-bottom: 17px; }
  .workload-modal .modal-title { max-width: calc(100% - 26px); font-size: 1.28rem; }
  .workload-modal .modal-sub { font-size: .8rem; }
  .workload-modal .modal-teacher-row { flex-wrap: wrap; gap: 10px; margin-bottom: 20px; padding: 12px; }
  .workload-modal .modal-teacher-avatar { width: 48px; height: 48px; }
  .workload-modal .modal-teacher-info { flex: 1 1 calc(100% - 68px); }
  .modal-teacher-metrics { width: 100%; flex-wrap: wrap; padding-left: 58px; }
  .workload-modal .modal-hours-badge,
  .modal-units-badge { padding: 7px 10px; font-size: .7rem; }
  .modal-section-heading { align-items: flex-start; }
  .modal-section-heading p { max-width: 230px; line-height: 1.4; }
  .workload-modal .modal-schedule-grid { grid-template-columns: 1fr; gap: 9px; }
  .modal-work-hours-grid { grid-template-columns: 1fr; }
  .workload-modal .modal-sched-card { padding: 13px; }
  .workload-modal .modal-summary { padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); }
  .workload-modal .modal-summary-item { padding-inline: 10px; }
  .workload-modal .modal-summary-key { font-size: .67rem; }
  .workload-modal .modal-summary-val { font-size: 1.45rem; }
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
.logout-modal-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.logout-modal-sub {
  font-size: 0.9rem;
  color: #777;
  margin: 0 0 8px;
}
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
  background: #30353a;
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
.logout-confirm-btn:hover { background: #4b5259; }

/* Responsive */
@media (max-width: 1200px) {
  .main { padding: 16px 20px 24px; }
  .stat-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
  .stat-card { padding: 14px 12px 12px; border-radius: 12px; }
  .stat-top { margin-bottom: 4px; }
  .stat-label { font-size: .72rem; }
  .stat-value { font-size: 2rem; }
  .stat-sub { font-size: .66rem; }
  .stat-icon svg { width: 20px; height: 20px; }
  .today-teachers-section { margin-bottom: 16px; padding: 16px 18px 12px; }
  .today-teachers-header { gap: 12px; margin-bottom: 10px; }
  .today-teachers-header h2 { font-size: 1.05rem; }
  .today-teachers-header p { font-size: .72rem; }
  .today-teachers-empty { min-height: 90px; }
  .charts-row { gap: 14px; margin-top: 12px; margin-bottom: 22px; padding-bottom: 0; }
  .chart-card { min-height: 540px; padding: 14px 14px 12px; }
  .chart-wrap { height: 430px; min-height: 410px; }
  .workload-chart-wrap { height: 450px; min-height: 410px; }
  .workload-filter-row { grid-template-columns: minmax(130px, 1.15fr) minmax(105px, .85fr) minmax(125px, 1fr); gap: 7px; }
  .workload-legend { gap: 5px 8px; font-size: .6rem; }
}

/* Compact dashboard labels for laptop and smaller desktop viewports. */
@media (min-width: 769px) and (max-width: 1200px) {
  .today-teachers-header h2 { font-size: .96rem; }
  .chart-title { font-size: 1rem; }
  .chart-caption { font-size: .6rem; }
  .stat-label { font-size: .64rem; }
  .stat-sub { font-size: .58rem; line-height: 1.35; }
}

@media (max-width: 1100px) {
  .main { padding-inline: 28px; }
}

@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .today-teachers-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
  .chart-card { min-height: 570px; }
  .chart-wrap { height: 440px; min-height: 420px; }
  .workload-chart-wrap { height: 460px; min-height: 430px; }
  .workload-filter-row { grid-template-columns: 1fr 1fr; }
  .workload-term-field { grid-column: 1 / -1; }
}
@media (max-width: 600px) {
  .main { padding: 20px 16px 32px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .today-teachers-section { padding: 18px 16px 18px; }
  .today-teachers-header { align-items: flex-start; flex-direction: column; }
  .today-teachers-grid { grid-template-columns: 1fr; }
  .today-carousel-stage { padding-inline: 23px; }
  .today-stage-arrow { width: 36px; height: 36px; font-size: 1.7rem; }
  .today-stage-arrow.previous { left: 0; }
  .today-stage-arrow.next { right: 0; }
  .sidebar { width: 200px; min-width: 200px; }
  .workload-filter-row { grid-template-columns: 1fr; }
  .workload-term-field { grid-column: auto; }
  .workload-result-count { margin-left: 0; width: 100%; }
  .consultation-filter-row { align-items: flex-start; flex-direction: column; gap: 5px; }
  .chart-card { min-height: 540px; }
  .chart-wrap { height: 420px; min-height: 400px; }
  .workload-chart-wrap { height: 440px; min-height: 420px; padding-inline: 4px; }
}

@media (max-width: 768px) {
  .stat-cards { gap: 12px; }
  .stat-card { padding: 20px 18px 18px; }
  .today-teachers-section { padding: 20px 16px 16px; }
  .today-teachers-header { align-items: flex-start; flex-direction: column; gap: 12px; }
  .today-carousel-controls { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .today-schedule-table-wrap { overflow-x: auto; }
  .today-schedule-track:not(.carousel-table) {
    width: max-content;
    min-width: 100%;
    grid-template-columns: repeat(var(--teacher-columns), minmax(220px, 1fr));
  }
}

@media (max-width: 480px) {
  .stat-cards { grid-template-columns: 1fr; }
  .today-teachers-header h2 { font-size: 1.12rem; }
  .today-teachers-header p { line-height: 1.5; }
  .today-teachers-header p span { display: block; margin: 2px 0 0; padding: 0; border: 0; }
}

</style>
