<template>
  <div class="mobile-app">
    <div class="app-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-title">Profile Page</div>
      <button class="edit-btn" @click="openEditModal">Edit</button>
    </div>

    <div class="profile-card">
      <button class="avatar-wrap" @click="openAvatarPicker" aria-label="Change profile picture">
        <img v-if="user.avatar" :src="user.avatar" alt="Profile picture" class="avatar-img" />
        <div v-else class="avatar-lg">{{ initials }}</div>
        <span class="avatar-plus">+</span>
      </button>
      <input
        ref="avatarInput"
        class="avatar-input"
        type="file"
        accept="image/*"
        @change="onAvatarChange"
      />
      <div class="profile-name">{{ user.name }}</div>
      <div class="profile-email">{{ user.email }}</div>
      <span class="active-badge">Active Student</span>
    </div>

    <div class="info-card">
      <div class="info-title">Personal Information</div>
      <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">{{ user.name }}</span></div>
      <div class="info-row"><span class="info-label">Student ID</span><span class="info-val">STU-2024-0891</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-val">{{ user.email }}</span></div>
      <div class="info-row"><span class="info-label">Grade Level</span><span class="info-val">1st Year</span></div>
      <div class="info-row"><span class="info-label">Section</span><span class="info-val">Section B</span></div>
    </div>

    <div class="action-row">
      <button class="act-btn green" @click="$router.push('/student/settings')">Settings</button>
      <button class="act-btn red" @click="doLogout">Logout</button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-sheet">
        <div class="modal-header">Edit Profile</div>
        <div class="modal-body">
          <div class="modal-avatar-row">
            <div class="modal-avatar-wrap" @click="openAvatarPicker" role="button" tabindex="0" aria-label="Change profile picture">
              <img v-if="user.avatar" :src="user.avatar" alt="Profile picture" class="modal-avatar-img" />
              <div v-else class="modal-avatar-fallback">{{ initials }}</div>
              <span class="modal-avatar-plus">+</span>
            </div>
            <button class="change-photo-btn" @click="openAvatarPicker">Change Profile Picture</button>
          </div>
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
const user = ref(getUser() || { name: 'Anna Cooper', email: 'anna.cooper@student.edu', avatar: null })
const initials = computed(() => user.value.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'A')

const showModal = ref(false)
const form = ref({ name: user.value.name, email: user.value.email, grade: '1st Year', section: 'Section B' })
const avatarInput = ref(null)

function persistUser() {
  try {
    localStorage.setItem('cit_user', JSON.stringify(user.value))
  } catch (_error) {
    // Ignore localStorage write failures to avoid breaking profile interactions.
  }
}

function openAvatarPicker() {
  avatarInput.value?.click()
}

function onAvatarChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    user.value = {
      ...user.value,
      avatar: String(reader.result || ''),
    }
    persistUser()
  }
  reader.readAsDataURL(file)
}

function openEditModal() {
  form.value = {
    ...form.value,
    name: user.value.name || '',
    email: user.value.email || '',
  }
  showModal.value = true
}

function saveProfile() {
  user.value = {
    ...user.value,
    name: form.value.name,
    email: form.value.email,
  }
  persistUser()
  showModal.value = false
}
function doLogout() {
  logout()
  router.push('/')
}
</script>

<style scoped>
.mobile-app {
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f3f5f7;
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;
  padding-top: env(safe-area-inset-top, 0px);
  font-family: 'Poppins', sans-serif;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #444;
  padding: 4px;
  display: flex;
  align-items: center;
}
.header-title { font-weight: 700; color: #252a2f; font-size: 1rem; }
.edit-btn {
  border: none;
  background: #1b4332;
  color: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
}

.profile-card,
.info-card {
  background: #fff;
  border: 1px solid #e3e8ed;
  border-radius: 12px;
  margin: 12px 16px 0;
}
.profile-card {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-wrap {
  position: relative;
  width: 58px;
  height: 58px;
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
}
.avatar-lg {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  font-weight: 700;
}
.avatar-img {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1b4332;
}
.avatar-plus {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
.avatar-input {
  display: none;
}
.profile-name { margin-top: 8px; font-size: 1.05rem; font-weight: 700; color: #171b20; }
.profile-email { margin-top: 2px; font-size: 0.79rem; color: #89939d; }
.active-badge {
  margin-top: 6px;
  background: #1b4332;
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 3px 10px;
  font-weight: 700;
}

.info-card { padding: 12px; }
.info-title { font-weight: 700; color: #2e343a; margin-bottom: 10px; }
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #eef1f4;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #8a93a0; font-size: 0.84rem; }
.info-val { color: #2b3035; font-size: 0.84rem; font-weight: 600; text-align: right; }

.action-row { display: flex; gap: 8px; padding: 12px 16px 0; }
.act-btn {
  flex: 1;
  border: none;
  border-radius: 9px;
  padding: 11px;
  color: #fff;
  font-weight: 700;
  font-family: inherit;
}
.act-btn.green { background: #1b4332; }
.act-btn.red { background: #be404a; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}
.modal-sheet {
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-radius: 18px 18px 0 0;
  border: 1px solid #d7dde4;
  padding-bottom: 18px;
}
.modal-header {
  font-size: 1.85rem;
  font-weight: 700;
  color: #171c21;
  padding: 16px 18px 8px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 18px;
}
.modal-avatar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0 2px;
}
.modal-avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
}
.modal-avatar-img,
.modal-avatar-fallback {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}
.modal-avatar-img {
  object-fit: cover;
  border: 2px solid #1b4332;
}
.modal-avatar-fallback {
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}
.modal-avatar-plus {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1b4332;
  color: #fff;
  border: 2px solid #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}
.change-photo-btn {
  border: 1px solid #cfd6de;
  background: #f8fafb;
  color: #1b4332;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 0.76rem; color: #636e79; font-weight: 600; }
.field-input {
  border: 1px solid #d2d8df;
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 0.95rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px 0;
}
.modal-cancel,
.modal-save {
  border: none;
  background: none;
  font-family: inherit;
  font-size: 1.05rem;
  cursor: pointer;
}
.modal-cancel { color: #be404a; font-weight: 600; }
.modal-save {
  color: #fff;
  background: #1b4332;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 1rem;
  font-weight: 600;
}
</style>
