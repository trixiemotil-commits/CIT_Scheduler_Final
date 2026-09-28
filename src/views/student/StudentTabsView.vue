<template>
  <IonPage>
    <div class="student-app-shell" :class="{ 'student-notifications-active': route.path.startsWith('/student/notifications') }">
      <IonTabs>
        <IonRouterOutlet />

        <div class="bottom-nav-wrapper">
          <IonTabBar slot="bottom" class="student-tab-bar bottom-nav-pill">
            <div class="student-tab-indicator" :style="indicatorStyle" aria-hidden="true"></div>
            <IonTabButton
              v-for="(item, index) in navigation"
              :key="item.tab"
              :tab="item.tab"
              :href="item.href"
              :class="{ 'active-tab-item': activeIndex === index }"
            >
              <span v-if="item.tab === 'profile' && studentUser.avatar" class="student-tab-profile-avatar" aria-hidden="true">
                <img :src="studentUser.avatar" class="student-tab-profile-image" alt="" />
                <span class="student-tab-profile-status"></span>
              </span>
              <IonIcon v-else :icon="item.icon" aria-hidden="true" />
              <IonLabel>{{ item.label }}</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </div>
      </IonTabs>

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
const route = useRoute()
const router = useRouter()
const studentUser = ref(getUser() || {})
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
  max-width: 430px;
  height: 100%;
  min-height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  background: #f3f5f7;
  box-shadow: 0 0 28px rgba(37, 41, 46, 0.14);
  padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px));
}

.bottom-nav-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  pointer-events: none;
  z-index: 50;
}

.bottom-nav-pill {
  pointer-events: auto;
  position: relative;
  width: calc(100% - 32px);
  max-width: 420px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
  border-radius: 32px;
  background: rgba(230, 230, 235, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  --background: transparent;
  --border: 0;
}

.student-tab-bar {
  position: relative;
  width: calc(100% - 32px);
  max-width: 420px;
  height: 64px;
  padding: 0 12px;
  margin: 0 auto;
  box-sizing: border-box;
  border-top: 0;
  border-radius: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  --color-selected: #ffffff;
  max-width: none;
  height: 100%;
  font-family: 'Poppins', sans-serif;
  transition: transform 0.22s ease;
}

ion-tab-button::part(native) {
  background: transparent !important;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  border-radius: 18px;
}

ion-tab-button.tab-selected {
  flex: 1.25 1 0;
  transform: translateY(-1px);
}

ion-tab-button.tab-selected::part(native) {
  background: linear-gradient(180deg, #6a6e73 0%, #4b4f54 18%, #2a2d30 52%, #5d6166 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.26),
    inset 0 -3px 6px rgba(0,0,0,0.28),
    0 7px 12px rgba(15, 17, 20, 0.2),
    0 0 0 1px rgba(84, 88, 91, 0.28);
  border-radius: 28px;
  width: auto;
  min-width: 72px;
  max-width: 100%;
  padding: 0 12px;
  margin-top: 0;
  height: 48px;
  align-self: center;
}

ion-tab-button.tab-selected ion-icon,
ion-tab-button.tab-selected ion-label,
ion-tab-button.tab-selected .student-tab-profile-avatar,
ion-tab-button.tab-selected .student-tab-profile-image {
  transform: translateY(0);
  transition: transform 0.22s ease;
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

@media (min-width: 768px) {
  .student-app-shell {
    max-width: 480px;
    border-radius: 30px;
    box-shadow: 0 0 32px rgba(37, 41, 46, 0.18);
  }

  .student-tab-bar {
    width: calc(100% - 12px) !important;
    max-width: 462px !important;
    height: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    margin: 0 auto !important;
    padding: 0 10px 2px !important;
    border-radius: 42px !important;
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
    width: 28px !important;
    height: 28px !important;
    flex-basis: 28px !important;
  }

  .student-tab-bar ion-tab-button ion-label {
    font-size: 0.72rem !important;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    min-width: 108px;
    height: 62px;
    padding: 0 20px 0 18px;
    border-radius: 32px;
    transform: translateY(8px);
  }

  .student-tab-bar ion-tab-button.tab-selected {
    transform: translateY(5px);
  }

  .student-tab-bar ion-tab-button.tab-selected ion-icon,
  .student-tab-bar ion-tab-button.tab-selected ion-label,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    transform: translateY(4px);
  }

  .student-tab-profile-avatar,
  .student-tab-profile-image,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
  }
}

@media (max-width: 430px) {
  .student-app-shell {
    box-shadow: none;
  }
}

@media (max-width: 360px) {
  .student-tab-bar {
    width: calc(100% - 16px) !important;
    height: calc(58px + env(safe-area-inset-bottom, 0px)) !important;
    margin-bottom: 6px !important;
    padding-inline: 3px !important;
    border-radius: 30px !important;
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
    width: 23px !important;
    height: 23px !important;
    flex-basis: 23px;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    min-width: 80px;
    height: 48px;
    padding-inline: 12px;
  }

  .student-tab-bar ion-tab-button.tab-selected ion-label {
    font-size: .58rem !important;
    margin-left: 6px !important;
  }

  .student-tab-profile-avatar,
  .student-tab-profile-image,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-avatar,
  .student-tab-bar ion-tab-button.tab-selected .student-tab-profile-image {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }
}

@media (max-width: 430px) and (max-height: 680px) {
  .student-tab-bar {
    height: calc(54px + env(safe-area-inset-bottom, 0px)) !important;
  }

  .student-tab-bar ion-tab-button {
    min-height: 46px !important;
  }

  .student-tab-bar ion-tab-button.tab-selected::part(native) {
    height: 44px;
  }
}
</style>
