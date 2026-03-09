<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap clickable" @click="router.push('/teacher/profile')">
          <img :src="profile.avatar" alt="Teacher" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role-label">Teachers Portal</div>
        <div class="email-label">{{ profile.email }}</div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: currentRoute === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>
      <button class="logout-btn" @click="showLogoutModal = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="main">
      <header class="main-header">
        <div>
          <h1 class="page-title">Profile Page</h1>
          <p class="page-sub">View and manage your personal information</p>
        </div>
      </header>

      <!-- Profile Card -->
      <section class="profile-card">
        <button class="edit-btn" @click="openEdit">Edit</button>

        <div class="profile-top">
          <div class="profile-avatar-wrap">
            <img :src="profile.avatar" class="profile-avatar" alt="" />
          </div>
          <div class="profile-fields">
            <div class="field-row full">
              <div class="field-block">
                <div class="field-label">Full Name</div>
                <div class="field-value">{{ profile.fullName }}</div>
              </div>
            </div>
            <div class="field-row full">
              <div class="field-block">
                <div class="field-label">Email</div>
                <div class="field-value">{{ profile.email }}</div>
              </div>
            </div>
            <div class="field-row two-col">
              <div class="field-block">
                <div class="field-label">Contact No.</div>
                <div class="field-value">{{ profile.contact }}</div>
              </div>
              <div class="field-block">
                <div class="field-label">Gender</div>
                <div class="field-value">{{ profile.gender }}</div>
              </div>
            </div>
            <div class="field-row two-col">
              <div class="field-block">
                <div class="field-label">Employee Id</div>
                <div class="field-value">{{ profile.employeeId }}</div>
              </div>
              <div class="field-block">
                <div class="field-label">Role</div>
                <div class="field-value role-chip">{{ profile.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ═══ Edit Profile Modal ═══ -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEdit">
        <div class="edit-modal">
          <div class="edit-modal-header">
            <div>
              <h2 class="edit-modal-title">Edit Profile</h2>
              <p class="edit-modal-sub">Update your personal information</p>
            </div>
            <button class="edit-modal-close" @click="closeEdit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="edit-modal-body">
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Full Name</label>
                <input v-model="editForm.fullName" class="edit-input" type="text" placeholder="Full name" />
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Email</label>
                <input v-model="editForm.email" class="edit-input" type="email" placeholder="Email address" />
              </div>
            </div>
            <div class="edit-row two-col">
              <div class="edit-field">
                <label class="edit-label">Contact No.</label>
                <input v-model="editForm.contact" class="edit-input" type="text" placeholder="09XXXXXXXXX" />
              </div>
              <div class="edit-field">
                <label class="edit-label">Gender</label>
                <div class="select-wrap">
                  <select v-model="editForm.gender" class="edit-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>
            <div class="edit-row">
              <div class="edit-field">
                <label class="edit-label">Employee Id</label>
                <input v-model="editForm.employeeId" class="edit-input" type="text" placeholder="000-000-000" />
              </div>
            </div>
          </div>
          <div class="edit-modal-actions">
            <button class="edit-cancel-btn" @click="closeEdit">Cancel</button>
            <button class="edit-save-btn" @click="saveProfile">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Logout Modal ═══ -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="logout-modal-box">
          <div class="logout-modal-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 class="logout-modal-title">Log Out</h2>
          <p class="logout-modal-sub">Are you sure you want to log out?</p>
          <div class="logout-modal-actions">
            <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
            <button class="logout-confirm-btn" @click="confirmLogout">Log Out</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { logout, getUser } from '@/auth.js'
import Swal from 'sweetalert2'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)
const user = getUser() || {}

const navItems = [
  {
    name: 'Dashboard', to: '/teacher/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/teacher/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Consultation', to: '/teacher/consultation',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    name: 'Settings', to: '/teacher/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Profile data ── */
const profile = ref({
  fullName:   'James Smith',
  email:      'teacher@gmail.com',
  contact:    '09292000000',
  gender:     'Male',
  employeeId: '022-222-222',
  role:       'Teacher',
  avatar:     user.avatar || 'https://i.pravatar.cc/100?img=47'
})

/* ── Edit modal ── */
const showEditModal = ref(false)
const editForm = ref({})

function openEdit() {
  editForm.value = { ...profile.value }
  showEditModal.value = true
}
function closeEdit() {
  showEditModal.value = false
}
function saveProfile() {
  profile.value = { ...editForm.value }
  closeEdit()
  Swal.fire({
    toast: true, position: 'top-end', icon: 'success',
    title: 'Profile Updated', showConfirmButton: false,
    timer: 2500, timerProgressBar: true,
    background: '#1b4332', color: '#fff', iconColor: '#74c69d'
  })
}

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

.layout button,
.layout input,
.layout select,
.layout textarea {
  font-family: inherit;
}

/* ════ SIDEBAR ════ */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  text-align: center;
}

.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  border: 3px solid #c8ddd4;
  transition: opacity 0.15s;
}
.avatar-wrap.clickable { cursor: pointer; }
.avatar-wrap.clickable:hover { opacity: 0.85; }
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand      { font-size: 1.05rem; font-weight: 700; color: #1b4332; }
.role-label { font-size: 0.85rem; font-weight: 500; color: #444; }
.email-label{ font-size: 0.8rem; color: #888; word-break: break-all; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #555;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover        { background: #f0faf3; color: #1b4332; }
.nav-item.active       { background: #1b4332; color: #fff; font-weight: 600; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ════ MAIN ════ */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  height: 100vh;
}

.main-header { margin-bottom: 32px; }
.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1b4332;
  letter-spacing: -0.4px;
}
.page-sub { font-size: 0.92rem; color: #888; margin-top: 4px; }

/* ── Profile Card ── */
.profile-card {
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 20px;
  padding: 40px 44px;
  position: relative;
  width: 100%;
}

.edit-btn {
  position: absolute;
  top: 36px;
  right: 40px;
  padding: 9px 28px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.edit-btn:hover { background: #2d6a4f; }

.profile-top {
  display: flex;
  align-items: flex-start;
  gap: 36px;
}

.profile-avatar-wrap {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #c8ddd4;
  flex-shrink: 0;
}
.profile-avatar { width: 100%; height: 100%; object-fit: cover; }

.profile-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-row { display: flex; gap: 40px; }
.field-row.two-col .field-block { flex: 1; }
.field-row.full .field-block { flex: 1; }

.field-block { display: flex; flex-direction: column; gap: 4px; }
.field-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #111;
}
.field-value {
  font-size: 0.95rem;
  color: #555;
}
.role-chip {
  display: inline-block;
  color: #555;
}

/* ════ MODALS ════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Edit Modal */
.edit-modal {
  width: 520px;
  max-width: 96vw;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.edit-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px 0;
}
.edit-modal-title { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0 0 4px; }
.edit-modal-sub   { font-size: 0.82rem; color: #888; margin: 0; }

.edit-modal-close {
  background: #f5f6f8;
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  flex-shrink: 0;
  transition: background 0.15s;
}
.edit-modal-close:hover { background: #e8e8e8; }

.edit-modal-body {
  padding: 24px 32px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-row { display: flex; gap: 16px; }
.edit-row.two-col .edit-field { flex: 1; }

.edit-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.edit-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888;
}
.edit-input {
  padding: 10px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #222;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
  width: 100%;
}
.edit-input:focus { border-color: #1b4332; }

.select-wrap { position: relative; }
.edit-select {
  width: 100%;
  appearance: none;
  padding: 10px 36px 10px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #222;
  background: #fff;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.edit-select:focus { border-color: #1b4332; }
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #888;
}

.edit-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 32px 28px;
}
.edit-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  padding: 9px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.edit-cancel-btn:hover { background: #f5f5f5; border-color: #c8c8c8; }
.edit-save-btn {
  padding: 9px 22px;
  background: #1b4332;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.edit-save-btn:hover { background: #2d6a4f; }

/* Logout Modal */
.logout-modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 360px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 20px 56px rgba(0,0,0,0.16);
  text-align: center;
}
.logout-modal-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.35rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.88rem; color: #888; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-top: 6px; width: 100%;
}
.logout-cancel-btn {
  background: none; border: none;
  font-size: 0.95rem; font-weight: 600; color: #e63946;
  cursor: pointer; padding: 10px 20px; border-radius: 10px;
  transition: background 0.15s;
}
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #1b4332; color: #fff; border: none;
  font-size: 0.95rem; font-weight: 600;
  padding: 10px 32px; border-radius: 10px;
  cursor: pointer; transition: background 0.15s;
}
.logout-confirm-btn:hover { background: #2d6a4f; }

@media (max-width: 900px) {
  .main { padding: 20px 16px 32px; }
  .sidebar { width: 200px; min-width: 200px; }
  .profile-top { flex-direction: column; align-items: center; }
}
</style>
