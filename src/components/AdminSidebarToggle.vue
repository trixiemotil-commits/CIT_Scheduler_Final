<template>
  <button
    class="admin-sidebar-toggle"
    :class="{ 'is-collapsed': collapsed }"
    type="button"
    :aria-label="collapsed ? 'Show navigation menu' : 'Hide navigation menu'"
    :aria-expanded="!collapsed"
    :title="collapsed ? 'Show menu' : 'Hide menu'"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path :d="collapsed ? 'M8 5v14' : 'M16 5v14'" />
    </svg>
  </button>

  <div v-if="collapsed" class="admin-sidebar-quick-menu" role="menu" aria-label="Profile options">
    <button type="button" role="menuitem" @click="openSidebar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M8 5v14" />
      </svg>
      <span>Open sidebar</span>
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const isTeacherPage = window.location.pathname.startsWith('/teacher')
const STORAGE_KEY = isTeacherPage ? 'cit-teacher-sidebar-collapsed' : 'cit-admin-sidebar-collapsed'
const collapsed = ref(false)
let viewportQuery

function applyState() {
  document.documentElement.classList.toggle('teacher-sidebar-collapsed', isTeacherPage && collapsed.value)
  document.documentElement.classList.toggle('admin-sidebar-collapsed', !isTeacherPage && collapsed.value)
}

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
  applyState()
}

function openSidebar() {
  if (collapsed.value) toggle()
}

function handleViewportChange(event) {
  if (event.matches) {
    collapsed.value = true
    applyState()
  }
}

onMounted(() => {
  const savedState = localStorage.getItem(STORAGE_KEY)
  viewportQuery = window.matchMedia('(max-width: 900px)')
  collapsed.value = savedState === '1' || viewportQuery.matches
  applyState()
  viewportQuery.addEventListener('change', handleViewportChange)
})

onUnmounted(() => {
  viewportQuery?.removeEventListener('change', handleViewportChange)
})
</script>
