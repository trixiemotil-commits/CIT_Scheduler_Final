<template>
  <IonPage>
    <div class="student-app-shell">
      <IonTabs>
        <IonRouterOutlet />

        <IonTabBar slot="bottom" class="student-tab-bar">
          <IonTabButton
            v-for="item in navigation"
            :key="item.tab"
            :tab="item.tab"
            :href="item.href"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <IonLabel>{{ item.label }}</IonLabel>
          </IonTabButton>
        </IonTabBar>
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
import { getToken, getUser, saveMergedUser } from '@/auth.js'
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
import { computed, onMounted, reactive, ref, watch } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const showTermPrompt = ref(false)
const promptAlreadyHandled = ref(false)
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
    prompt: `cit_student_term_prompt_${userKey}`,
  }
}

watch(() => termForm.yearLevel, () => { termForm.section = '' })

async function authenticatedRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Unable to save your semester details.')
  return payload
}

async function checkPublishedTerm() {
  try {
    const payload = await authenticatedRequest('/academic-terms/published')
    const term = payload.term
    if (!term) return
    publishedTerm.value = term
    const termId = String(term.id || term._id || '')
    if (!termId) return

    const { assignment, prompt } = getStudentTermStorageKeys()
    if (localStorage.getItem(assignment) === termId) return
    if (localStorage.getItem(prompt) === termId || promptAlreadyHandled.value) return
    if (showTermPrompt.value) return

    localStorage.setItem(prompt, termId)
    promptAlreadyHandled.value = true
    showTermPrompt.value = true
  } catch (_) {
    // The app remains usable if the term service is temporarily unavailable.
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
    const { assignment, prompt } = getStudentTermStorageKeys()
    localStorage.setItem(assignment, termId)
    localStorage.setItem(prompt, termId)
    promptAlreadyHandled.value = false
    showTermPrompt.value = false
  } catch (error) {
    termPromptError.value = error.message
  } finally {
    savingAssignment.value = false
  }
}

onMounted(checkPublishedTerm)

const navigation = [
  { tab: 'home', label: 'Home', href: '/student/dashboard', icon: homeOutline },
  { tab: 'teachers', label: 'Teachers', href: '/student/teachers', icon: peopleOutline },
  { tab: 'consultations', label: 'Consultations', href: '/student/consultations', icon: calendarOutline },
  { tab: 'events', label: 'Events', href: '/student/events', icon: megaphoneOutline },
  { tab: 'profile', label: 'Profile', href: '/student/profile', icon: personOutline },
]
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
}

.student-tab-bar {
  height: calc(66px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 1px solid #e5e7eb;
  --background: #ffffff;
  --border: 0;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

ion-tab-button {
  --background: #ffffff;
  --color: #9aa0a6;
  --color-selected: #30363d;
  max-width: none;
  font-family: 'Poppins', sans-serif;
}

ion-tab-button::part(native) {
  padding: 7px 2px 6px;
}

ion-icon {
  width: 21px;
  height: 21px;
}

ion-label {
  margin-top: 3px;
  font-size: 0.61rem;
  font-weight: 500;
  line-height: 1;
}

.term-prompt-overlay{position:absolute;inset:0;z-index:10000;background:rgba(31,35,39,.62);backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px}.term-prompt{width:100%;max-width:360px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.term-prompt-icon{width:50px;height:50px;border-radius:14px;background:#e8ebed;color:#30383f;display:grid;place-items:center;font-size:1.5rem}.term-prompt h2{margin:15px 0 6px;color:#252b30;font-size:1.25rem}.term-prompt>p{margin:0 0 18px;color:#687078;font-size:.82rem;line-height:1.5}.term-prompt label{display:block;margin-top:12px}.term-prompt label span{display:block;margin-bottom:5px;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#454c53}.term-prompt select{width:100%;height:44px;border:1px solid #cdd2d6;border-radius:10px;padding:0 12px;background:#f7f8f9;font:inherit;font-size:.84rem}.term-prompt button{width:100%;height:44px;margin-top:20px;border:0;border-radius:10px;background:#4b5563;color:#fff;font:700 .85rem Poppins;cursor:pointer}.term-prompt button:disabled{opacity:.55}.term-prompt .term-prompt-error{color:#c1121f;margin:10px 0 0}

@media (max-width: 430px) {
  .student-app-shell {
    box-shadow: none;
  }
}
</style>
