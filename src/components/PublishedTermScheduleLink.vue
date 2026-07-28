<template>
  <RouterLink to="/admin/academic-terms" class="nav-item unified-academic-link">
    <span class="nav-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    </span>
    <span>Academic Terms</span>
  </RouterLink>
  <RouterLink
      v-if="publishedTermId"
      :to="{ path: '/admin/academic-terms', query: { term: publishedTermId, action: 'view' } }"
      class="nav-item current-term-schedule-link"
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
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const publishedTermId = ref('')

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
  } catch (_) {
    publishedTermId.value = ''
  }
})
</script>

<style scoped>
.current-term-schedule-link {
  background: #344657 !important;
  color: #fff !important;
}
</style>
