<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
      </div>

      <!-- Nav -->
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

      <!-- Logout -->
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
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Teacher Assignments</h1>
          <p class="page-sub">Manage teacher profiles and designated areas</p>
        </div>
      </header>

      <!-- Teachers Card Section -->
      <section class="teachers-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Teacher Assignments</h2>
            <p class="section-sub">Manage teacher information and designated areas</p>
          </div>
          <button class="add-teacher-btn" @click="showAddModal = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Teacher
          </button>
        </div>

        <!-- Status Tabs -->
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab"
            :class="['status-tab', { active: activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Teachers Grid/Carousel -->
        <div class="teachers-carousel-wrap">
          <button v-if="currentIndex > 0" class="carousel-arrow prev" @click="previousTeachers">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div class="teachers-grid">
            <div
              v-for="teacher in visibleTeachers"
              :key="teacher.id"
              :class="['teacher-card', `card-${teacher.status.toLowerCase().replace(/\s+/g, '-')}`]"  
            >
              <!-- Status Badge -->
              <div :class="['status-badge', `badge-${teacher.status.toLowerCase().replace(/\s+/g, '-')}`]">
                {{ teacher.status }}
              </div>

              <!-- Avatar -->
              <div class="teacher-avatar-wrap">
                <img :src="teacher.avatar" :alt="teacher.name" class="teacher-avatar" />
              </div>

              <!-- Name -->
              <h3 class="teacher-name">{{ teacher.name }}</h3>

              <!-- College -->
              <p class="teacher-college">{{ teacher.college }}</p>

              <!-- Email -->
              <div class="teacher-email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{{ teacher.email }}</span>
              </div>

              <!-- Status Dropdown -->
              <div class="teacher-status-wrap">
                <select v-model="teacher.status" class="status-dropdown" @change="updateTeacherStatus(teacher)">
                  <option value="In School">In School</option>
                  <option value="On Leave">On Leave</option>
                  <option value="On-Meeting">On-Meeting</option>
                </select>
              </div>

              <!-- Substitute Teacher -->
              <div v-if="teacher.status === 'On Leave'" class="substitute-teacher-wrap">
                <label class="substitute-label">Substitute Teacher:</label>
                <select class="substitute-dropdown" :value="teacher.substituteTeacher || ''" @change="(e) => updateSubstituteTeacher(teacher, e.target.value)">
                  <option value="">Select a substitute teacher</option>
                  <option v-for="sub in getAvailableSubstitutes(teacher)" :key="sub.id" :value="sub.name">
                    {{ sub.name }}
                  </option>
                </select>
              </div>
              <!-- Designated Areas -->
              <div v-if="teacher.designatedAreas.length" class="designated-areas">
                <div class="designated-label">Designated Areas:</div>
                <div class="areas-list">
                  <div v-for="(area, idx) in teacher.designatedAreas" :key="idx" class="area-tag">
                    {{ area }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button v-if="currentIndex < maxIndex" class="carousel-arrow next" @click="nextTeachers">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <!-- Carousel Indicators -->
        <div class="carousel-indicators">
          <button
            v-for="(_, idx) in carouselPages"
            :key="idx"
            :class="['indicator', { active: currentIndex === idx * itemsPerPage }]"
            @click="currentIndex = idx * itemsPerPage"
          />
        </div>
      </section>
    </main>

    <!-- ═══ Add Teacher Modal ═══ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-box">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Add New Teacher</h2>
            <p class="modal-sub">Enter teacher information and assign designated areas</p>
          </div>

          <!-- Avatar placeholder -->
          <div class="modal-avatar-section">
            <div class="modal-avatar-placeholder" @click="$refs.fileInput.click()">
              <img v-if="previewImage" :src="previewImage" alt="Preview" class="modal-avatar-preview" />
              <template v-else>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </template>
              <div class="modal-avatar-checkmark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#52b788">
                  <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="modal-file-input"
              @change="handleImageUpload"
            />
          </div>

          <!-- Form Fields -->
          <div class="modal-form">
            <input v-model="newTeacherName" type="text" placeholder="Enter Teacher Name" class="modal-input" />
            <input v-model="newTeacherEmail" type="email" placeholder="Enter Email" class="modal-input" />
            
            <!-- Multiple Designated Areas Custom Dropdown -->
            <div class="modal-areas-group">
              <label class="modal-areas-label">Designated Areas:</label>
              <div class="modal-custom-dropdown" v-click-outside="() => showAreasDropdown = false">
                <button class="modal-dropdown-btn" @click="showAreasDropdown = !showAreasDropdown">
                  <span v-if="newTeacherAreas.length === 0" class="modal-dropdown-placeholder">Select designated areas</span>
                  <span v-else class="modal-dropdown-selected">
                    {{ newTeacherAreas.length }} selected
                  </span>
                  <svg class="modal-dropdown-icon" :class="{ open: showAreasDropdown }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                <div v-if="showAreasDropdown" class="modal-dropdown-menu">
                  <label v-for="area in ['Data Structure', 'Database', 'OOP', 'Web Development', 'Mobile Dev', 'UI/UX', 'Algorithms', 'Software Engineering']" :key="area" class="modal-dropdown-option">
                    <input
                      type="checkbox"
                      :value="area"
                      :checked="newTeacherAreas.includes(area)"
                      @change="(e) => {
                        if (e.target.checked) {
                          newTeacherAreas.push(area)
                        } else {
                          newTeacherAreas.splice(newTeacherAreas.indexOf(area), 1)
                        }
                      }"
                      class="modal-dropdown-checkbox"
                    />
                    <span class="modal-dropdown-label">{{ area }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="modal-cancel-btn" @click="showAddModal = false">Cancel</button>
            <button class="modal-add-btn" @click="addNewTeacher">Add</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path)
const showAddModal = ref(false)
const showAreasDropdown = ref(false)
const newTeacherName = ref('')
const newTeacherEmail = ref('')
const newTeacherAreas = ref([])
const previewImage = ref('')
const fileInput = ref(null)

const activeTab = ref('All')
const currentIndex = ref(0)
const itemsPerPage = 3

const statusTabs = ['All', 'In School', 'On-Meeting', 'On-leave']

const teachers = ref([
  {
    id: 1,
    name: 'Prof. John',
    college: 'College of Information Technology',
    email: 'john.smith.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
    status: 'In School',
    designatedAreas: ['Data Structure'],
    substituteTeacher: null,
  },
  {
    id: 2,
    name: 'Prof. John',
    college: 'College of Information Technology',
    email: 'john.smith.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=33',
    status: 'On Leave',
    designatedAreas: ['Data Structure'],
    substituteTeacher: 'Prof. Jhon',
  },
  {
    id: 3,
    name: 'Prof. John',
    college: 'College of Information Technology',
    email: 'john.smith.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=45',
    status: 'On-Meeting',
    designatedAreas: ['Data Structure'],
    substituteTeacher: null,
  },
  {
    id: 4,
    name: 'Prof. Maria',
    college: 'College of Engineering',
    email: 'maria.santos.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=50',
    status: 'In School',
    designatedAreas: ['Database', 'OOP'],
    substituteTeacher: null,
  },
  {
    id: 5,
    name: 'Prof. James',
    college: 'College of Information Technology',
    email: 'james.brown.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=22',
    status: 'On-Meeting',
    designatedAreas: ['Web Development'],
    substituteTeacher: null,
  },
  {
    id: 6,
    name: 'Prof. Sarah',
    college: 'College of Information Technology',
    email: 'sarah.jones.au@phinmaed.com',
    avatar: 'https://i.pravatar.cc/150?img=35',
    status: 'In School',
    designatedAreas: ['Mobile Dev', 'UI/UX'],
    substituteTeacher: null,
  },
])

const filteredTeachers = computed(() => {
  if (activeTab.value === 'All') return teachers.value
  if (activeTab.value === 'On-leave') return teachers.value.filter(t => t.status === 'On Leave')
  return teachers.value.filter(t => t.status === activeTab.value)
})

const visibleTeachers = computed(() => {
  return filteredTeachers.value.slice(currentIndex.value, currentIndex.value + itemsPerPage)
})

const maxIndex = computed(() => {
  return Math.max(0, filteredTeachers.value.length - itemsPerPage)
})

const carouselPages = computed(() => {
  const pages = Math.ceil(filteredTeachers.value.length / itemsPerPage)
  return Array.from({ length: pages })
})

const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'Schedule', to: '/admin/schedule',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Teachers', to: '/admin/teachers',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: 'Events', to: '/admin/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
  },
  {
    name: 'Manage Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

const nextTeachers = () => {
  if (currentIndex.value < maxIndex.value) {
    currentIndex.value += itemsPerPage
  }
}

const previousTeachers = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= itemsPerPage
  }
}

const updateTeacherStatus = (teacher) => {
  // Handle status update
  if (teacher.status === 'On Leave' && !teacher.substituteTeacher) {
    // Automatically show the substitute dropdown when changing to On Leave
    console.log('Please select a substitute teacher for On Leave status')
  }
  console.log('Teacher status updated:', teacher)
}

const getAvailableSubstitutes = (currentTeacher) => {
  return teachers.value.filter(t => t.id !== currentTeacher.id && t.status === 'In School')
}

const updateSubstituteTeacher = (teacher, substituteName) => {
  teacher.substituteTeacher = substituteName || null
  console.log('Substitute teacher updated:', teacher)
}

const handleImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const addNewTeacher = () => {
  if (!newTeacherName.value || !newTeacherEmail.value || newTeacherAreas.value.length === 0) {
    alert('Please fill in all fields and select at least one designated area')
    return
  }

  const newTeacher = {
    id: teachers.value.length + 1,
    name: newTeacherName.value,
    college: 'College of Information Technology',
    email: newTeacherEmail.value,
    avatar: previewImage.value || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 100)}`,
    status: 'In School',
    designatedAreas: [...newTeacherAreas.value],
    substituteTeacher: null
  }

  teachers.value.push(newTeacher)
  newTeacherName.value = ''
  newTeacherEmail.value = ''
  newTeacherAreas.value = []
  previewImage.value = ''
  showAddModal.value = false
  console.log('New teacher added:', newTeacher)
}
</script>

<style scoped>
/* ── Layout ── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

/* ═══ SIDEBAR ═══ */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #ececec;
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
}
.avatar { width: 100%; height: 100%; object-fit: cover; }

.brand {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1b4332;
}
.role {
  font-size: 0.88rem;
  color: #444;
  font-weight: 500;
}
.email {
  font-size: 0.82rem;
  color: #888;
  word-break: break-all;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
  margin: 0;
  padding: 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 400;
  color: #444;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: inherit;
  margin: 0;
}
.nav-item:hover { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
.nav-icon { display: flex; align-items: center; flex-shrink: 0; }

/* Logout */
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
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ═══ MAIN ═══ */
.main {
  flex: 1;
  padding: 24px 32px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.main-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1b4332;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* ════════════════════════ TEACHERS SECTION ════════════════════════ */
.teachers-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px 28px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}

.section-sub {
  font-size: 0.88rem;
  color: #777;
  margin-top: 2px;
}

.add-teacher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background-color: #1b4332;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.add-teacher-btn:hover {
  background-color: #2d6a4f;
}

/* ════════════════════════ STATUS TABS ════════════════════════ */
.status-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.status-tab {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: transparent;
  color: #666;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.status-tab:hover {
  border-color: #1b4332;
  color: #1b4332;
}

.status-tab.active {
  background-color: #1b4332;
  color: white;
  border-color: #1b4332;
}

/* ════════════════════════ TEACHERS GRID/CAROUSEL ════════════════════════ */
.teachers-carousel-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.carousel-arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.carousel-arrow:hover {
  background-color: #1b4332;
  color: white;
  border-color: #1b4332;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  flex: 1;
  min-height: 300px;
}

/* ════════════════════════ TEACHER CARD ════════════════════════ */
.teacher-card {
  border-radius: 12px;
  padding: 28px 24px 24px;
  position: relative;
  overflow: hidden;
  border: 2px solid #e6e6e6;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 560px;
}

.teacher-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-in-school {
  border: 2px solid #4CAF50;
  background-color: #e8f5e9;
}

.card-on-leave {
  border: 2px solid #F44336;
  background-color: #ffebee;
}

.card-on-meeting {
  border: 2px solid #FFC107;
  background-color: #fffde7;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-in-school {
  background-color: #4CAF50;
  color: white;
}

.badge-on-leave {
  background-color: #F44336;
  color: white;
}

.badge-on-meeting {
  background-color: #FFC107;
  color: #333;
}

.teacher-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.teacher-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}

.teacher-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 6px;
}

.teacher-college {
  font-size: 0.88rem;
  color: #777;
  text-align: center;
  margin-bottom: 16px;
  line-height: 1.4;
}

.teacher-email {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 16px;
}

.teacher-email svg {
  color: #999;
  flex-shrink: 0;
}

.teacher-status-wrap {
  margin-bottom: 16px;
}

.status-dropdown {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #333;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.status-dropdown:hover {
  border-color: #1b4332;
}

.status-dropdown:focus {
  outline: none;
  border-color: #1b4332;
  box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.1);
}

.designated-areas {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.designated-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-tag {
  padding: 5px 10px;
  background-color: #e0f0e8;
  color: #1b4332;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.substitute-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #666;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.substitute-teacher-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.substitute-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.substitute-dropdown {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #333;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.substitute-dropdown:hover {
  border-color: #1b4332;
}

.substitute-dropdown:focus {
  outline: none;
  border-color: #1b4332;
  box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.1);
}

/* ════════════════════════ CAROUSEL INDICATORS ════════════════════════ */
.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e0e0e0;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator:hover {
  background-color: #1b4332;
}

.indicator.active {
  background-color: #1b4332;
}

/* ════════════════════════ MODAL ════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 28px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  position: relative;
}

.modal-header {
  margin-bottom: 24px;
  text-align: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1b4332;
  margin: 0 0 4px;
}

.modal-sub {
  font-size: 0.9rem;
  color: #777;
  margin: 0;
}

.modal-avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.modal-avatar-placeholder {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #1b4332;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.modal-avatar-placeholder:hover {
  background: #d4e8d9;
  border-color: #2d6a4f;
}

.modal-avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.modal-file-input {
  display: none;
}

.modal-avatar-checkmark {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #52b788;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.modal-input,
.modal-select {
  padding: 12px 14px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.modal-input::placeholder {
  color: #aaa;
}

.modal-input:focus,
.modal-select:focus {
  outline: none;
  border-color: #1b4332;
  box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.1);
}

.modal-areas-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-areas-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.modal-areas-select {
  padding: 12px 14px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background-color: #fff;
  cursor: pointer;
  min-height: 120px;
}

.modal-areas-select:focus {
  outline: none;
  border-color: #1b4332;
  box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.1);
}

.modal-areas-select option {
  padding: 8px;
  background: #fff;
  color: #333;
}

.modal-areas-select option:checked {
  background: #1b4332;
  color: white;
}

.modal-areas-hint {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
  padding: 0;
}

/* Custom Dropdown */
.modal-custom-dropdown {
  position: relative;
  width: 100%;
}

.modal-dropdown-btn {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #fff;
  font-size: 0.95rem;
  font-family: inherit;
  color: #333;
  cursor: pointer;
  transition: border-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.modal-dropdown-btn:hover {
  border-color: #1b4332;
}

.modal-dropdown-btn:focus {
  outline: none;
  border-color: #1b4332;
  box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.1);
}

.modal-dropdown-placeholder {
  color: #aaa;
}

.modal-dropdown-selected {
  font-weight: 500;
  color: #1b4332;
}

.modal-dropdown-icon {
  transition: transform 0.2s;
  color: #666;
  flex-shrink: 0;
}

.modal-dropdown-icon.open {
  transform: rotate(180deg);
}

.modal-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 280px;
  overflow-y: auto;
}

.modal-dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.modal-dropdown-option:hover {
  background: #f5f5f5;
}

.modal-dropdown-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #1b4332;
  flex-shrink: 0;
}

.modal-dropdown-label {
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-cancel-btn,
.modal-add-btn {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-cancel-btn {
  background: #f5f5f5;
  color: #d32f2f;
  border: 1px solid #e0e0e0;
}

.modal-cancel-btn:hover {
  background: #f0f0f0;
  border-color: #d32f2f;
}

.modal-add-btn {
  background: #1b4332;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-add-btn::before {
  content: '+ ';
}

.modal-add-btn:hover {
  background: #2d6a4f;
}

/* ════════════════════════ RESPONSIVE ════════════════════════ */
/* Large Desktop (1200px+) - 3 columns */
@media (min-width: 1200px) {
  .teachers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop (900px - 1200px) - 2-3 columns */
@media (max-width: 1199px) and (min-width: 901px) {
  .teachers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet (600px - 900px) - 2 columns */
@media (max-width: 900px) and (min-width: 601px) {
  .teachers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .main { padding: 28px 24px 32px; }
  .section-header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .add-teacher-btn { width: 100%; justify-content: center; }
  .status-tabs { flex-wrap: wrap; }
  .teacher-card { min-height: 520px; }
  .carousel-arrow { display: none; }
}

/* Mobile (<600px) - 1 column */
@media (max-width: 600px) {
  .layout { flex-direction: column; }
  .main { padding: 16px 20px 32px; height: auto; }
  .sidebar { width: 100%; min-width: 100%; height: auto; padding: 20px 16px; display: none; }
  .page-title { font-size: 1.5rem; }
  .page-sub { font-size: 0.85rem; }
  .section-header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .section-title { font-size: 0.95rem; }
  .section-sub { font-size: 0.75rem; }
  .teachers-section { padding: 16px 20px 16px; border-radius: 12px; }
  .status-tabs { flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .status-tab { padding: 6px 12px; font-size: 0.8rem; }
  .add-teacher-btn { width: 100%; padding: 8px 16px; font-size: 0.85rem; justify-content: center; }
  .teachers-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .teacher-card { padding: 20px 18px 18px; min-height: 450px; }
  .teacher-avatar { width: 90px; height: 90px; }
  .carousel-arrow { display: none; }
  .carousel-indicators { gap: 4px; }
  .carousel-dot { width: 6px; height: 6px; }
  .modal-box {
    width: 95vw;
    max-height: 90vh;
  }
  .modal-form-group { margin-bottom: 12px; }
  .modal-form-label { font-size: 0.85rem; }
  .modal-form-input { font-size: 0.9rem; padding: 8px; }
}

/* Small Mobile (<480px) - Extra small adjustments */
@media (max-width: 479px) {
  .main { padding: 12px 16px 24px; }
  .teachers-section { padding: 12px 16px 12px; }
  .page-title { font-size: 1.25rem; }
  .modal-box { width: 98vw; }
}
</style>
