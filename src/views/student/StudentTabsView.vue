<template>
  <IonPage>
    <div class="student-app-shell" :class="{ 'student-notifications-active': route.path.startsWith('/student/notifications'), 'consultation-choices-open': showConsultationChoices }">
      <IonTabs>
        <IonRouterOutlet :animated="!['student-teachers', 'student-consultation-booking'].includes(route.name)" />

        <IonTabBar
          v-if="!isConsultationSessionsPage"
          slot="bottom"
          class="student-tab-bar bottom-nav-pill"
        >
          <div class="student-tab-surface" aria-hidden="true"></div>
          <div class="student-tab-safe-area" aria-hidden="true"></div>
          <div class="student-tab-indicator" :style="indicatorStyle" aria-hidden="true"></div>
          <IonTabButton
            v-for="(item, index) in navigation"
            :key="item.tab"
            :tab="item.tab"
            :href="item.href"
            @click.capture="handleNavigationClick($event, item)"
            :class="{ 'active-tab-item': activeIndex === index, 'consultation-tab': item.tab === 'consultations' }"
          >
            <span v-if="item.tab === 'profile' && studentUser.avatar" class="student-tab-profile-avatar" aria-hidden="true">
              <img :src="studentUser.avatar" class="student-tab-profile-image" alt="" />
              <span class="student-tab-profile-status"></span>
            </span>
            <svg
              v-else-if="item.tab === 'consultations'"
              class="student-tab-consultation-icon"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M17 11.8a9.6 9.6 0 1 1 15 10.8l2 6.3-6.2-3.3a9.6 9.6 0 0 1-10.8-2.1" />
              <path d="M22.5 17.5h7.2m-7.2 4h7.2m-7.2 4h5.1" />
              <path d="M7.2 22.8 4.6 30l8.2-3.2a11.5 11.5 0 1 0-5.6-4Z" fill="rgba(250,250,250,.98)" />
              <path class="student-tab-consultation-question" stroke-width="3" d="M13.2 12a3 3 0 1 1 5.7 1.4c-.9 1.1-2.4 1.5-2.4 3.2" />
              <circle cx="16.5" cy="20.8" r=".7" />
            </svg>
            <IonIcon v-else :icon="item.icon" aria-hidden="true" />
            <IonLabel>{{ item.label }}</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>

      <Teleport to="body">
        <Transition name="consultation-choice">
          <div
            v-if="showConsultationChoices"
            class="consultation-choice-overlay"
            :style="{
              '--consultation-choice-bottom': consultationChoiceBottomPadding,
              '--consultation-icon-circle-size': `${CONSULTATION_ICON_CIRCLE_RADIUS * 2}px`,
              '--consultation-modal-origin-offset': `${CONSULTATION_ICON_CIRCLE_RADIUS + CONSULTATION_MODAL_LIFT}px`,
              '--consultation-modal-connector-length': `${CONSULTATION_MODAL_LIFT - CONSULTATION_BUTTON_GAP}px`,
            }"
            role="presentation"
            @click.self="showConsultationChoices = false"
          >
            <button class="consultation-choice-anchor" :style="consultationChoiceAnchorStyle" type="button" aria-label="Close consultations menu" @click.stop="showConsultationChoices = false">
              <svg
                class="consultation-choice-anchor-icon"
                viewBox="0 0 36 36"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17 11.8a9.6 9.6 0 1 1 15 10.8l2 6.3-6.2-3.3a9.6 9.6 0 0 1-10.8-2.1" />
                <path d="M22.5 17.5h7.2m-7.2 4h7.2m-7.2 4h5.1" />
                <path d="M7.2 22.8 4.6 30l8.2-3.2a11.5 11.5 0 1 0-5.6-4Z" fill="rgba(250,250,250,.98)" />
                <path stroke-width="3" d="M13.2 12a3 3 0 1 1 5.7 1.4c-.9 1.1-2.4 1.5-2.4 3.2" />
                <circle cx="16.5" cy="20.8" r=".7" />
              </svg>
            </button>
            <section class="consultation-choice-modal" role="dialog" aria-modal="true" aria-labelledby="consultation-choice-title">
              <button class="consultation-choice-close" type="button" aria-label="Close" @click="showConsultationChoices = false">×</button>
              <div class="consultation-choice-kicker">Student Services</div>
              <h2 id="consultation-choice-title">Consultations</h2>
              <p>What would you like to do?</p>
              <button class="consultation-choice-action" type="button" @click="openConsultationSessions">
                <span class="consultation-choice-icon"><IonIcon :icon="calendarOutline" /></span>
                <span><strong>View Consultation Session</strong><small>Check your requests and scheduled sessions</small></span>
                <span class="consultation-choice-arrow" aria-hidden="true">›</span>
              </button>
              <button class="consultation-choice-action" type="button" @click="openTeacherBooking">
                <span class="consultation-choice-icon"><IonIcon :icon="peopleOutline" /></span>
                <span><strong>Book Consultation</strong><small>Find a teacher and request a time</small></span>
                <span class="consultation-choice-arrow" aria-hidden="true">›</span>
              </button>
            </section>
          </div>
        </Transition>
      </Teleport>

      <div v-if="showTermPrompt" class="term-prompt-overlay">
        <form class="term-prompt" @submit.prevent="saveTermAssignment">
          <div class="term-prompt-icon">
            <IonIcon :icon="calendarOutline" />
          </div>
          <h2>New Semester Published</h2>
          <p>{{ publishedTermLabel }} is now active. Select your year and section for this semester.</p>
          <label>
            <span>Year Level</span>
            <select v-model="termForm.yearLevel" required>
              <option value="" disabled>Select year level</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </label>
          <label>
            <span>Section</span>
            <select v-model="termForm.section" :disabled="!termForm.yearLevel" required>
              <option value="" disabled>Select section</option>
              <option v-for="section in availableSections" :key="section" :value="section">{{ section }}</option>
            </select>
          </label>
          <p v-if="termPromptError" class="term-prompt-error">{{ termPromptError }}</p>
          <button type="submit" :disabled="savingAssignment">{{ savingAssignment ? 'Saving…' : 'Continue' }}</button>
        </form>
      </div>
    </div>
  </IonPage>
</template>

<script setup>
import { getToken, getUser, logout, saveMergedUser } from '@/auth.js'
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  calendarOutline,
  homeOutline,
  megaphoneOutline,
  peopleOutline,
  personOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const CONSULTATION_ICON_CIRCLE_RADIUS = 28
const CONSULTATION_BUTTON_GAP = 8
const CONSULTATION_MODAL_LIFT = 26
const route = useRoute()
const router = useRouter()
const studentUser = ref(getUser() || {})
const showConsultationChoices = ref(false)
const consultationChoiceBottomPadding = ref('116px')
const consultationChoiceAnchorStyle = ref({ top: '0px', left: '0px' })
const isConsultationSessionsPage = computed(() =>
  route.path === '/student/consultations'
  || (route.path === '/student/teachers' && route.query.mode === 'consultation-booking')
)
const showTermPrompt = ref(false)
const publishedTerm = ref(null)
const savingAssignment = ref(false)
const termPromptError = ref('')
const termForm = reactive({ yearLevel: '', section: '' })
const availableYears = computed(() =>
  Object.entries(publishedTerm.value?.sectionNames || {})
    .filter(([, sections]) => Array.isArray(sections) && sections.length)
    .map(([year]) => year)
)
const availableSections = computed(() =>
  Array.isArray(publishedTerm.value?.sectionNames?.[termForm.yearLevel])
    ? publishedTerm.value.sectionNames[termForm.yearLevel]
    : []
)
const publishedTermLabel = computed(() =>
  publishedTerm.value ? `${publishedTerm.value.schoolYear} · ${publishedTerm.value.semester}` : 'A new semester'
)

function getStudentTermStorageKeys() {
  const user = getUser() || {}
  const userKey = user.id || user._id || user.email || 'student'
  return {
    assignment: `cit_student_term_assignment_${userKey}`,
    notification: `cit_student_term_notification_${userKey}`,
  }
}

watch(() => termForm.yearLevel, () => { termForm.section = '' })

async function authenticatedRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'Unable to save your semester details.')
    error.status = response.status
    throw error
  }
  return payload
}

let termCheckInFlight = false

async function checkPublishedTerm() {
  if (termCheckInFlight || showTermPrompt.value) return
  termCheckInFlight = true

  try {
    const payload = await authenticatedRequest('/academic-terms/published')
    const term = payload.term
    if (!term) return
    publishedTerm.value = term
    const termId = String(term.id || term._id || '')
    if (!termId) return

    const { assignment, notification } = getStudentTermStorageKeys()
    if (localStorage.getItem(assignment) === termId) return
    if (localStorage.getItem(notification) === termId) return

    localStorage.setItem(notification, termId)
    showTermPrompt.value = true
  } catch (error) {
    if (error.status === 401) {
      logout()
      await router.replace('/')
    }
    // The app remains usable if the term service is temporarily unavailable.
  } finally {
    termCheckInFlight = false
  }
}

async function saveTermAssignment() {
  if (!termForm.yearLevel || !termForm.section) return
  savingAssignment.value = true
  termPromptError.value = ''
  try {
    const payload = await authenticatedRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ yearLevel: termForm.yearLevel, section: termForm.section }),
    })
    const user = saveMergedUser(payload.user || {})
    const termId = String(publishedTerm.value?.id || publishedTerm.value?._id || '')
    const { assignment } = getStudentTermStorageKeys()
    localStorage.setItem(assignment, termId)
    showTermPrompt.value = false
  } catch (error) {
    termPromptError.value = error.message
  } finally {
    savingAssignment.value = false
  }
}

let termCheckInterval = null

function checkPublishedTermWhenVisible() {
  if (document.visibilityState === 'visible') checkPublishedTerm()
}

onMounted(() => {
  checkPublishedTerm()
  termCheckInterval = window.setInterval(checkPublishedTermWhenVisible, 15000)
  document.addEventListener('visibilitychange', checkPublishedTermWhenVisible)
})

onBeforeUnmount(() => {
  if (termCheckInterval) window.clearInterval(termCheckInterval)
  document.removeEventListener('visibilitychange', checkPublishedTermWhenVisible)
})

const navigation = [
  { tab: 'home', label: 'Home', href: '/student/dashboard', icon: homeOutline },
  { tab: 'teachers', label: 'Teachers', href: '/student/teachers', icon: peopleOutline },
  { tab: 'consultations', label: 'Consultations', href: '/student/consultations', icon: calendarOutline },
  { tab: 'events', label: 'Events', href: '/student/events', icon: megaphoneOutline },
  { tab: 'profile', label: 'Profile', href: '/student/profile', icon: personOutline },
]

async function handleNavigationClick(event, item) {
  if (item.tab === 'teachers') {
    event.preventDefault()
    event.stopPropagation()
    showConsultationChoices.value = false
    if (route.path !== item.href || Object.keys(route.query).length) {
      await router.push(item.href)
    }
    return
  }

  if (item.tab !== 'consultations') return
  event.preventDefault()
  event.stopPropagation()
  if (showConsultationChoices.value) {
    showConsultationChoices.value = false
    return
  }
  const icon = event.currentTarget?.querySelector('.student-tab-consultation-icon')
  if (icon) {
    const iconBounds = icon.getBoundingClientRect()
    const circleTop = iconBounds.top + iconBounds.height / 2 - CONSULTATION_ICON_CIRCLE_RADIUS
    const circleLeft = iconBounds.left + iconBounds.width / 2 - CONSULTATION_ICON_CIRCLE_RADIUS
    consultationChoiceBottomPadding.value = `${Math.max(16, window.innerHeight - circleTop + CONSULTATION_MODAL_LIFT)}px`
    consultationChoiceAnchorStyle.value = { top: `${circleTop}px`, left: `${circleLeft}px` }
  }
  showConsultationChoices.value = true
}

async function openConsultationSessions() {
  showConsultationChoices.value = false
  await router.push('/student/consultations')
}

async function openTeacherBooking() {
  showConsultationChoices.value = false
  await router.push({ path: '/student/teachers', query: { mode: 'consultation-booking' } })
}

const activeIndex = computed(() => {
  const current = route.path || '/student/dashboard'
  const match = navigation.findIndex((item) => {
    if (item.tab === 'profile') {
      return current.startsWith('/student/profile') || current.endsWith('/profile')
    }
    return current.startsWith(item.href)
  })
  return match >= 0 ? match : 0
})

const indicatorStyle = computed(() => {
  const count = navigation.length || 1
  const itemWidthPercent = 100 / count
  return {
    width: `calc(${itemWidthPercent}% - 6px)`,
    left: `calc(${activeIndex.value * itemWidthPercent}% + 3px)`,
  }
})
</script>

<style scoped>
.student-app-shell {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  background: #f3f5f7;
  box-shadow: 0 0 28px rgba(37, 41, 46, 0.14);
}

.consultation-choice-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  --consultation-choice-surface: rgba(250, 250, 250, 0.98);
  display: grid;
  align-items: end;
  justify-items: center;
  padding: 16px 16px var(--consultation-choice-bottom, calc(60px + env(safe-area-inset-bottom)));
  background: rgba(24, 29, 33, 0.5);
}

.consultation-choice-anchor {
  position: fixed;
  z-index: 10006;
  display: grid;
  width: var(--consultation-icon-circle-size, 56px);
  height: var(--consultation-icon-circle-size, 56px);
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--consultation-choice-surface);
  box-shadow: none;
  padding: 0;
  appearance: none;
  cursor: pointer;
  pointer-events: auto;
}

.consultation-choice-anchor:focus-visible {
  outline: 3px solid #69747d;
  outline-offset: 3px;
}

.consultation-choice-anchor-icon {
  width: 40px;
  height: 40px;
  padding: 6px;
  color: var(--metal-500);
}

.student-app-shell.consultation-choices-open .student-tab-bar {
  z-index: 10002 !important;
  pointer-events: auto !important;
}

.student-app-shell.consultation-choices-open .student-tab-bar ion-tab-button:not(.consultation-tab) {
  pointer-events: none !important;
}

.student-app-shell.consultation-choices-open .student-tab-bar ion-tab-button.consultation-tab {
  z-index: 10003 !important;
  pointer-events: auto !important;
}

.student-app-shell.consultation-choices-open .student-tab-bar ion-tab-button.consultation-tab::before {
  z-index: 10004 !important;
  border: 0;
  box-shadow: none;
}

.student-app-shell.consultation-choices-open .student-tab-bar ion-tab-button.consultation-tab .student-tab-consultation-icon {
  z-index: 10005 !important;
}

.consultation-choice-modal {
  position: relative;
  width: min(100%, 420px);
  transform-origin: 50% calc(100% + var(--consultation-modal-origin-offset, 54px));
  padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 34px;
  background: var(--consultation-choice-surface);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.24);
  color: #252b30;
}

.consultation-choice-modal::after {
  position: absolute;
  top: calc(100% - 1px);
  left: 50%;
  width: 42px;
  height: var(--consultation-modal-connector-length, 18px);
  background: inherit;
  content: '';
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform: translateX(-50%);
}

.consultation-choice-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #e8ebed;
  color: #4f585f;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
}

.consultation-choice-kicker {
  color: #68737a;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.consultation-choice-modal h2 {
  margin: 5px 0 4px;
  font-size: 1.2rem;
}

.consultation-choice-modal > p {
  margin: 0 0 18px;
  color: #707980;
  font-size: 0.82rem;
}

.consultation-choice-action {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 68px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #dce1e4;
  border-radius: 12px;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.consultation-choice-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #e9eef0;
  color: #3e5966;
  font-size: 1.2rem;
}

.consultation-choice-action strong,
.consultation-choice-action small {
  display: block;
}

.consultation-choice-action strong {
  font-size: 0.83rem;
}

.consultation-choice-action small {
  margin-top: 3px;
  color: #717a80;
  font-size: 0.69rem;
  line-height: 1.35;
}

.consultation-choice-arrow {
  color: #818a90;
  font-size: 1.4rem;
}

.consultation-choice-enter-active,
.consultation-choice-leave-active {
  transition: opacity 0.18s ease;
}

.consultation-choice-enter-active .consultation-choice-modal,
.consultation-choice-leave-active .consultation-choice-modal {
  transition: transform 0.32s cubic-bezier(.18, .85, .32, 1), opacity 0.16s ease;
}

.consultation-choice-enter-from,
.consultation-choice-leave-to {
  opacity: 0;
}

.consultation-choice-enter-from .consultation-choice-modal,
.consultation-choice-leave-to .consultation-choice-modal {
  transform: scale(.12);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .consultation-choice-enter-active,
  .consultation-choice-leave-active,
  .consultation-choice-enter-active .consultation-choice-modal,
  .consultation-choice-leave-active .consultation-choice-modal {
    transition: none;
  }
}

@media (max-width: 767px) {
  .student-app-shell {
    height: 100dvh;
    min-height: 100dvh;
  }
}

.bottom-nav-pill {
  pointer-events: auto;
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
  border-radius: 28px 28px 8px 8px;
  background: rgba(230, 230, 235, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 20px 16px rgba(0, 0, 0, 0.06);
  overflow: visible !important;
  --background: transparent;
  --border: 0;
}

.student-tab-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(420px, calc(100vw - 18px));
  max-width: 420px;
  height: 64px;
  padding: 0 12px;
  margin: 0 auto;
  box-sizing: border-box;
  border-top: 0;
  border-radius: 28px 28px 8px 8px;
  box-shadow: 0 20px 16px rgba(0, 0, 0, 0.06);
  overflow: visible !important;
  z-index: 20;
}

.student-tab-indicator {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  z-index: 0;
  border-radius: 18px;
  background: transparent;
  pointer-events: none;
  transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

ion-tab-button {
  position: relative;
  z-index: 1;
  --background: transparent;
  --background-focused: transparent;
  --background-hover: transparent;
  --background-activated: transparent;
  --color: #9aa0a6;
  --color-selected: #111111;
  max-width: none;
  height: 100%;
  font-family: 'Poppins', sans-serif;
}

ion-tab-button::part(native) {
  background: transparent !important;
  display: flex;
  flex-direction: column !important;
  justify-content: flex-end !important;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 6px 2px 12px !important;
  border-radius: 32px;
}

ion-tab-button.tab-selected {
  flex: 1 1 0;
}

ion-tab-button.tab-selected::part(native) {
  background: transparent !important;
  box-shadow: none !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
  border-radius: 32px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 6px 2px 12px !important;
  margin-top: 0;
  height: 100%;
  align-self: center;
}

ion-tab-button.tab-selected ion-icon,
ion-tab-button.tab-selected ion-label,
ion-tab-button.tab-selected .student-tab-profile-avatar,
ion-tab-button.tab-selected .student-tab-profile-image {
  transform: translateY(0);
}

ion-icon {
  width: 21px;
  height: 21px;
  display: block;
}

ion-label {
  display: block;
  margin: 0;
  font-size: 0.61rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.term-prompt-overlay{position:absolute;inset:0;z-index:10000;background:rgba(31,35,39,.62);backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px}.term-prompt{width:100%;max-width:360px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.term-prompt-icon{width:50px;height:50px;border-radius:14px;background:#e8ebed;color:#30383f;display:grid;place-items:center;font-size:1.5rem}.term-prompt h2{margin:15px 0 6px;color:#252b30;font-size:1.25rem}.term-prompt>p{margin:0 0 18px;color:#687078;font-size:.82rem;line-height:1.5}.term-prompt label{display:block;margin-top:12px}.term-prompt label span{display:block;margin-bottom:5px;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#454c53}.term-prompt select{width:100%;height:44px;border:1px solid #cdd2d6;border-radius:10px;padding:0 12px;background:#f7f8f9;font:inherit;font-size:.84rem}.term-prompt button{width:100%;height:44px;margin-top:20px;border:0;border-radius:10px;background:#4b5563;color:#fff;font:700 .85rem Poppins;cursor:pointer}.term-prompt button:disabled{opacity:.55}.term-prompt .term-prompt-error{color:#c1121f;margin:10px 0 0}

@media (min-width: 391px) and (max-width: 767px) {
  .student-tab-bar {
    height: calc(72px + var(--student-safe-bottom)) !important;
  }

  .student-tab-bar ion-tab-button::part(native) {
    gap: 8px;
    padding: 8px 2px 12px;
  }

  .student-tab-bar ion-tab-button ion-icon,
  .student-tab-bar ion-tab-button.tab-selected ion-icon {
    width: 34px !important;
    height: 34px !important;
    flex-basis: 34px !important;
  }

  .student-tab-bar ion-tab-button:not(.consultation-tab) ion-label {
    font-size: .64rem !important;
  }

  .student-tab-bar .student-tab-profile-avatar,
  .student-tab-bar .student-tab-profile-image {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }
}

@media (min-width: 768px) {
  .student-app-shell {
    max-width: 480px;
    border-radius: 30px;
    box-shadow: 0 0 32px rgba(37, 41, 46, 0.18);
  }

  .student-tab-bar {
    max-width: 430px !important;
    height: calc(76px + var(--student-safe-bottom)) !important;
    margin: 0 auto !important;
    padding: 0 10px calc(var(--student-safe-bottom) + 2px) !important;
    border-radius: 32px 32px 8px 8px !important;
  }

  .student-tab-bar ion-tab-button {
    min-height: 72px !important;
  }

  .student-tab-bar ion-tab-button::part(native) {
    min-height: 72px;
    padding: 12px 8px 10px;
  }

  .student-tab-bar ion-tab-button ion-icon,
  .student-tab-bar ion-tab-button.tab-selected ion-icon {
    width: 32px !important;
    height: 32px !important;
    flex-basis: 32px !important;
  }

  .student-tab-bar ion-tab-button ion-label {
    font-size: 0.72rem !important;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    min-width: 0;
    height: 100%;
    padding: 10px 2px;
    border-radius: 32px;
    transform: none !important;
  }

  .student-tab-bar ion-tab-button.tab-selected {
    transform: none !important;
  }

  .student-tab-bar ion-tab-button.tab-selected ion-icon,
  .student-tab-bar ion-tab-button.tab-selected ion-label,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    transform: none !important;
  }

  .student-tab-profile-avatar,
  .student-tab-profile-image,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
}

@media (max-width: 430px) {
  .student-app-shell {
    box-shadow: none;
  }
}

@media (max-width: 360px) {
  .student-tab-bar {
    height: calc(76px + var(--student-safe-bottom)) !important;
    border-radius: 24px 24px 6px 6px !important;
  }

  .student-tab-bar ion-tab-button {
    min-width: 0 !important;
    min-height: 50px !important;
  }

  .student-tab-bar ion-tab-button::part(native) {
    padding: 9px 1px 7px;
  }

  .student-tab-bar ion-tab-button ion-icon,
  .student-tab-bar ion-tab-button.tab-selected ion-icon {
    width: 28px !important;
    height: 28px !important;
    flex-basis: 28px;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    min-width: 0;
    height: 100%;
    padding: 6px 1px 4px;
  }

  .student-tab-bar ion-tab-button.tab-selected ion-label {
    font-size: .58rem !important;
    margin-left: 0 !important;
    text-align: center !important;
  }

  .student-tab-profile-avatar,
  .student-tab-profile-image,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }
}

@media (max-width: 430px) and (max-height: 680px) {
  .student-tab-bar {
    height: calc(76px + var(--student-safe-bottom)) !important;
  }

  .student-tab-bar ion-tab-button {
    min-height: 46px !important;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    height: 100%;
  }
}

@media (max-width: 390px) {
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 32px !important;
    height: 32px !important;
    flex-basis: 32px !important;
  }
}

@media (min-width: 391px) and (max-width: 767px) {
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 38px !important;
    height: 38px !important;
    flex-basis: 38px !important;
  }
}

@media (min-width: 768px) {
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 40px !important;
    height: 40px !important;
    flex-basis: 40px !important;
  }
}
</style>
