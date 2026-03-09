<template>
  <div class="mobile-app">
    <!-- Header -->
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">My Profile</div>
      <button class="edit-btn" @click="showModal = true">Edit</button>
    </div>

    <!-- Profile Card -->
    <div class="profile-card">
      <div class="avatar-lg">{{ initials }}</div>
      <div class="profile-name">{{ user.name }}</div>
      <div class="profile-email">{{ user.email }}</div>
      <span class="active-badge">Active Student</span>
    </div>

    <!-- Info Section -->
    <div class="info-card">
      <div class="info-title">Personal Information</div>
      <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">{{ user.name }}</span></div>
      <div class="info-row"><span class="info-label">Student ID</span><span class="info-val">STU-2024-0891</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-val">{{ user.email }}</span></div>
      <div class="info-row"><span class="info-label">Grade Level</span><span class="info-val">1st Year</span></div>
      <div class="info-row"><span class="info-label">Section</span><span class="info-val">Section B</span></div>
    </div>

    <!-- Buttons -->
    <div class="action-row">
      <button class="act-btn green" @click="$router.push('/student/settings')">Settings</button>
      <button class="act-btn red"   @click="doLogout">Logout</button>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <span>Edit Profile</span>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label class="field-label">Full Name</label>
            <input v-model="form.name" class="field-input" type="text" />
          </div>
          <div class="field-group">
            <label class="field-label">Email</label>
            <input v-model="form.email" class="field-input" type="email" />
          </div>
          <div class="field-group">
            <label class="field-label">Grade Level</label>
            <input v-model="form.grade" class="field-input" type="text" />
          </div>
          <div class="field-group">
            <label class="field-label">Section</label>
            <input v-model="form.section" class="field-input" type="text" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showModal = false">Cancel</button>
          <button class="modal-save" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </div>

    <BottomNav active="profile" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getUser, logout } from '@/auth.js'
import { useRouter } from 'vue-router'
import BottomNav from '@/components/student/BottomNav.vue'

const router = useRouter()
const user   = getUser() || { name: 'Anna Cooper', email: 'anna.cooper@student.edu' }
const initials = computed(() => user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const showModal = ref(false)
const form = ref({ name: user.name, email: user.email, grade: '1st Year', section: 'Section B' })

function saveProfile() { showModal.value = false }
function doLogout() { logout(); router.push('/') }
</script>

<style scoped>
.mobile-app {
  max-width: 430px; min-height: 100dvh;
  margin: 0 auto; background: #f5f6f8;
  display: flex; flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; padding: 16px 18px;
  border-bottom: 1px solid #eee;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #444; padding: 4px; display: flex; align-items: center;
  border-radius: 6px; margin-left: -4px; transition: color 0.15s;
}
.back-btn:hover { color: #1b4332; }
.header-title { font-weight: 700; font-size: 1rem; color: #1b4332; }
.edit-btn {
  background: #1b4332; color: #fff;
  border: none; border-radius: 8px;
  padding: 6px 16px; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: opacity 0.15s;
}
.edit-btn:hover { opacity: 0.88; }

/* Profile card */
.profile-card {
  background: #fff; margin: 16px 18px 0;
  border-radius: 16px; padding: 28px 16px;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.avatar-lg {
  width: 84px; height: 84px;
  background: #1b4332; color: #fff;
  border-radius: 50%; font-size: 1.8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
  border: 4px solid #c8ddd4;
}
.profile-name  { font-size: 1.15rem; font-weight: 700; color: #111; }
.profile-email { font-size: 0.8rem; color: #777; margin: 4px 0 10px; }
.active-badge  { background: #d8f3e8; color: #1b7a4a; font-size: 0.72rem; font-weight: 600; padding: 4px 14px; border-radius: 20px; }

/* Info card */
.info-card {
  background: #fff; margin: 12px 18px 0;
  border-radius: 16px; padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.info-title { font-weight: 700; font-size: 0.9rem; color: #1b4332; margin-bottom: 12px; }
.info-row   { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 0.82rem; color: #888; }
.info-val   { font-size: 0.82rem; font-weight: 600; color: #111; text-align: right; }

/* Action buttons */
.action-row { display: flex; gap: 10px; padding: 16px 18px 0; }
.act-btn { flex: 1; padding: 13px; border: none; border-radius: 10px; font-family: inherit; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: opacity 0.15s; }
.act-btn:active { opacity: 0.82; }
.act-btn.green { background: #1b4332; color: #fff; }
.act-btn.red   { background: #e63946; color: #fff; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 100;
}
.modal-sheet {
  background: #fff; border-radius: 20px 20px 0 0;
  width: 100%; max-width: 430px;
  max-height: 85dvh; overflow-y: auto; padding-bottom: 28px;
}
.modal-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 12px auto 0; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 14px; font-weight: 700; font-size: 1rem; color: #111;
  border-bottom: 1px solid #f0f0f0;
}
.modal-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #999; line-height: 1; }
.modal-body  { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.field-group  { display: flex; flex-direction: column; gap: 5px; }
.field-label  { font-size: 0.8rem; color: #444; font-weight: 600; }
.field-input  {
  width: 100%; box-sizing: border-box;
  padding: 11px 14px; border: 1.5px solid #e5e7eb;
  border-radius: 10px; font-size: 0.87rem; font-family: inherit; outline: none;
}
.field-input:focus { border-color: #2d6a4f; }
.modal-footer { display: flex; gap: 10px; padding: 12px 20px 0; }
.modal-cancel { flex: 1; padding: 12px; background: #f0f0f0; color: #555; border: none; border-radius: 10px; font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer; }
.modal-save   { flex: 1; padding: 12px; border: none; border-radius: 10px; background: #1b4332; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.88rem; cursor: pointer; }
</style>
