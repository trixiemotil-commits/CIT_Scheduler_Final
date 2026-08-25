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
import { onMounted, ref } from 'vue'

const STORAGE_KEY = 'cit-admin-sidebar-collapsed'
const collapsed = ref(false)

function applyState() {
  document.documentElement.classList.toggle('admin-sidebar-collapsed', collapsed.value)
}

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
  applyState()
}

function openSidebar() {
  if (collapsed.value) toggle()
}

onMounted(() => {
  collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
  applyState()
})
</script>
