<template>
  <div class="schedule-management-label" aria-hidden="true">
    <span>Schedule management</span>
  </div>
  <RouterLink
    to="/admin/academic-terms"
    class="nav-item unified-academic-link"
    :class="{ active: isAcademicTerms }"
  >
    <span class="nav-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    </span>
    <span>Academic Terms</span>
  </RouterLink>
  <RouterLink
      :to="currentTermTarget"
      class="nav-item current-term-schedule-link"
      :class="{ active: isCurrentTerm }"
    >
      <span class="nav-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
      </span>
      <span>Current Term Schedule</span>
  </RouterLink>
</template>

<script setup>
import { getToken } from '@/auth.js'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const TERM_CACHE_KEY = 'cit-published-term-id'
const route = useRoute()
const publishedTermId = ref(sessionStorage.getItem(TERM_CACHE_KEY) || '')
const currentTermTarget = computed(() => publishedTermId.value
  ? { path: '/admin/academic-terms', query: { term: publishedTermId.value, action: 'view', source: 'current' } }
  : { path: '/admin/academic-terms' }
)
const isScheduleDetail = computed(() => route.path === '/admin/schedule/view' || route.path === '/admin/schedule/add')
const isAcademicTerms = computed(() =>
  (route.path === '/admin/academic-terms' && route.query.source !== 'current')
  || (isScheduleDetail.value && route.query.source === 'academic')
)
const isCurrentTerm = computed(() =>
  (route.path === '/admin/academic-terms'
    && Boolean(publishedTermId.value)
    && String(route.query.term || '') === publishedTermId.value
    && route.query.source === 'current')
  || (isScheduleDetail.value && route.query.source === 'current')
)
onMounted(async () => {
  const token = getToken()
  if (!token) return
  try {
    const response = await fetch(`${API_BASE}/academic-terms/published`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return
    const payload = await response.json()
    publishedTermId.value = String(payload.term?._id || payload.term?.id || '')
    if (publishedTermId.value) sessionStorage.setItem(TERM_CACHE_KEY, publishedTermId.value)
    else sessionStorage.removeItem(TERM_CACHE_KEY)
  } catch (_) {
    // Keep the cached target during a temporary network failure.
  }
})
</script>
