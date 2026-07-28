<template>
  <button v-if="targetRole" class="role-switch-btn" :disabled="isSwitching" @click="switchRole">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
    {{ isSwitching ? 'Switching…' : `Switch to ${roleLabel}` }}
  </button>
</template>

<script setup>
import { getUser, selectRole } from '@/auth.js'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSwitching = ref(false)
const user = getUser() || {}
const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role]
const targetRole = computed(() => {
  if (!roles.includes('admin') || !roles.includes('teacher')) return ''
  return user.role === 'admin' ? 'teacher' : 'admin'
})
const roleLabel = computed(() => targetRole.value === 'admin' ? 'Admin' : 'Teacher')

async function switchRole() {
  if (!targetRole.value) return
  isSwitching.value = true
  try {
    await selectRole(targetRole.value)
    await router.push(targetRole.value === 'admin' ? '/admin/dashboard' : '/teacher/dashboard')
  } catch (error) {
    console.error('Unable to switch account role:', error)
  } finally {
    isSwitching.value = false
  }
}
</script>

<style scoped>
.role-switch-btn {
  margin: 16px 0 10px; width: 100%; border: 1px solid #b7d8c6;
  background: #edf7f0; color: #1b6b41; border-radius: 10px; padding: 11px 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  font: inherit; font-size: 0.85rem; font-weight: 600; border: none;
}
.role-switch-btn:hover:not(:disabled) { background: #dcefe2; }
.role-switch-btn:disabled { opacity: 0.65; cursor: wait; }
</style>
