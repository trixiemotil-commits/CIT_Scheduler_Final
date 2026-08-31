<template>
  <div class="layout">
    <Transition name="toast">
      <div v-if="toastMessage" class="um-toast" role="status" aria-live="polite">
        <span class="um-toast-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar admin-sidebar">
      <AdminSidebarToggle />
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img :src="user.avatar || 'https://i.pravatar.cc/100?img=15'" :alt="user.name || 'Admin'" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">{{ user.email || 'admin@gmail.com' }}</div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems.filter(item => item.to !== '/admin/settings')"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: currentRoute === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.name }}</span>
        </RouterLink>
        <RouterLink to="/admin/activity-logs" class="nav-item admin-secondary-nav" :class="{ active: currentRoute === '/admin/activity-logs' }">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/></svg></span>
          <span>Activity Logs</span>
        </RouterLink>
        <RouterLink to="/admin/settings" class="nav-item admin-secondary-nav" :class="{ active: currentRoute === '/admin/settings' }">
          <AdminSettingsIcon />
          <span>Settings</span>
        </RouterLink>
        <PublishedTermScheduleLink />
      </nav>
      <RoleSwitchButton />

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
          <h1 class="page-title">
            <span class="page-title-kicker">Users Management</span>
            <span class="page-title-main">Manage Users</span>
          </h1>
          <p class="page-sub">Add, edit, and manage system user accounts</p>
        </div>
      </header>

      <section class="um-management-panel">
      <!-- Top bar -->
      <div class="um-topbar">
        <div class="um-view-tabs">
          <button :class="['um-view-tab', activeView === 'active' ? 'um-view-tab--on' : '']" @click="activeView = 'active'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            All Users
          </button>
          <button :class="['um-view-tab', activeView === 'archived' ? 'um-view-tab--on' : '']" @click="activeView = 'archived'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Archived
            <span v-if="users.filter(u => u.status === 'Archived').length > 0" class="um-view-tab-badge">{{ users.filter(u => u.status === 'Archived').length }}</span>
          </button>
        </div>
        <div class="um-topbar-right">
          <button
            v-if="activeView === 'active' && pendingCount > 0"
            class="um-approve-all-btn"
            :disabled="isBulkApproving"
            @click="promptApproveAll"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/><path d="M22 10l-7 7"/></svg>
            {{ isBulkApproving ? 'Approving...' : `Approve All (${pendingCount})` }}
          </button>
          <button
            v-if="activeView === 'active' && selectedPendingUsers.length"
            class="um-approve-selected-btn"
            :disabled="isBulkApproving"
            @click="promptApproveSelected"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/><path d="M22 10l-7 7"/></svg>
            {{ isBulkApproving ? 'Approving...' : `Approve Selected (${selectedPendingUsers.length})` }}
          </button>
          <div class="um-search-wrap">
            <span class="um-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input v-model="searchQuery" class="um-search-input" type="text" :placeholder="activeView === 'archived' ? 'Search archived...' : 'Search users...'" />
          </div>
          <select v-model="roleFilter" class="um-filter-select">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin &amp; Teacher">Admin &amp; Teacher</option>
            <option value="Student">Student</option>
          </select>
          <button class="um-print-btn" title="Print Users" @click="printUsersTable">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
          <button v-if="activeView === 'active'" class="um-add-btn" @click="openAddUser">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="um-stats-row">
        <div class="um-stat-card um-stat-card--clickable" role="button" tabindex="0" aria-label="Show all users" @click="selectUserStat('all')" @keydown.enter="selectUserStat('all')" @keydown.space.prevent="selectUserStat('all')">
          <div class="um-stat-icon um-stat-icon--total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.length }}</div>
            <div class="um-stat-label">Total Users</div>
          </div>
        </div>
        <div :class="['um-stat-card', 'um-stat-card--clickable', { 'um-stat-card--selected': userStatFilter === 'admins' }]" role="button" tabindex="0" aria-label="Show administrators" @click="selectUserStat('admins')" @keydown.enter="selectUserStat('admins')" @keydown.space.prevent="selectUserStat('admins')">
          <div class="um-stat-icon um-stat-icon--admin">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => Array.isArray(u.roles) ? u.roles.includes('admin') : u.role === 'Admin').length }}</div>
            <div class="um-stat-label">Admins</div>
          </div>
        </div>
        <div :class="['um-stat-card', 'um-stat-card--clickable', { 'um-stat-card--selected': userStatFilter === 'teachers' }]" role="button" tabindex="0" aria-label="Show teachers" @click="selectUserStat('teachers')" @keydown.enter="selectUserStat('teachers')" @keydown.space.prevent="selectUserStat('teachers')">
          <div class="um-stat-icon um-stat-icon--teacher">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => Array.isArray(u.roles) ? u.roles.includes('teacher') : u.role === 'Teacher').length }}</div>
            <div class="um-stat-label">Teachers</div>
          </div>
        </div>
        <div :class="['um-stat-card', 'um-stat-card--clickable', { 'um-stat-card--selected': userStatFilter === 'admin-teacher' }]" role="button" tabindex="0" aria-label="Show admin and teacher accounts" @click="selectUserStat('admin-teacher')" @keydown.enter="selectUserStat('admin-teacher')" @keydown.space.prevent="selectUserStat('admin-teacher')">
          <div class="um-stat-icon um-stat-icon--admin-teacher">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => Array.isArray(u.roles) &amp;&amp; u.roles.includes('admin') &amp;&amp; u.roles.includes('teacher')).length }}</div>
            <div class="um-stat-label">Admin &amp; Teacher</div>
          </div>
        </div>
        <div class="um-stat-card um-stat-card--clickable" role="button" tabindex="0" aria-label="Show active users" @click="selectUserStat('active')" @keydown.enter="selectUserStat('active')" @keydown.space.prevent="selectUserStat('active')">
          <div class="um-stat-icon um-stat-icon--active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => u.status === 'Active').length }}</div>
            <div class="um-stat-label">Active</div>
          </div>
        </div>
        <div class="um-stat-card um-stat-card--clickable" role="button" tabindex="0" aria-label="Show archived users" @click="selectUserStat('archived')" @keydown.enter="selectUserStat('archived')" @keydown.space.prevent="selectUserStat('archived')">
          <div class="um-stat-icon um-stat-icon--archived">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => u.status === 'Archived').length }}</div>
            <div class="um-stat-label">Archived</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div v-if="loadError" class="um-error-banner">{{ loadError }}</div>
      <div v-else-if="autoRefreshNotice" class="um-info-banner">{{ autoRefreshNotice }}</div>
      <div class="um-table-wrap">
        <table class="um-table">
          <thead>
            <tr>
              <th class="um-select-col">
                <input
                  v-if="activeView === 'active' && selectablePendingUsers.length"
                  type="checkbox"
                  class="um-select-check"
                  :checked="allVisiblePendingSelected"
                  :aria-label="allVisiblePendingSelected ? 'Clear pending-user selection' : 'Select all pending users'"
                  @change="toggleAllVisiblePending"
                />
              </th>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoadingUsers">
              <td colspan="7">
                <div class="um-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Loading users...</span>
                </div>
              </td>
            </tr>
            <template v-else>
            <tr v-for="user in filteredUsers" :key="user.id" class="um-row">
              <td class="um-select-col">
                <input
                  v-if="activeView === 'active' && user.status === 'Pending'"
                  v-model="selectedPendingIds"
                  type="checkbox"
                  class="um-select-check"
                  :value="user.id"
                  :aria-label="`Select ${user.name}`"
                />
              </td>
              <td>
                <div class="um-user-cell">
                  <img :src="user.avatar" class="um-user-avatar" alt="" />
                  <div class="um-user-info">
                    <span class="um-user-name">{{ user.name }}</span>
                    <span class="um-user-dept">{{ user.department }}</span>
                  </div>
                </div>
              </td>
              <td class="um-email">{{ user.email }}</td>
              <td>
                <span :class="['um-role-badge', `um-role-badge--${user.role.toLowerCase()}`]">{{ user.role }}</span>
              </td>
              <td>
                <span :class="['um-status-badge', statusClass(user.status)]">
                  <span class="um-status-dot"></span>
                  {{ user.status }}
                </span>
              </td>
              <td class="um-date">{{ user.dateAdded }}</td>
              <td>
                <div class="um-actions">
                  <template v-if="activeView === 'active'">
                    <div class="um-actions-row">
                      <button class="um-btn um-btn--edit" @click="openEditUser(user)" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                      <button class="um-btn um-btn--archive" @click="openArchiveUser(user)" title="Archive">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                        Archive
                      </button>
                    </div>
                    <div v-if="user.status === 'Pending'" class="um-actions-row">
                      <button class="um-btn um-btn--approve" @click="approveUser(user)" title="Approve">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                      <button class="um-btn um-btn--deny" @click="denyUser(user)" title="Deny">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Deny
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <button class="um-btn um-btn--restore" @click="openRestoreUser(user)" title="Restore">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
                      Restore
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7">
                <div class="um-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>No users found</span>
                </div>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
      </section>
    </main>
  </div>

  <!-- ═══ Add / Edit User Modal ═══ -->
  <Teleport to="body">
    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
      <div class="um-modal-box um-modal-box--wide">
        <!-- Banner -->
        <div class="um-modal-banner">
          <div class="um-modal-banner-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <div class="um-modal-banner-text">
            <p class="um-modal-banner-title">{{ editingUser ? 'Edit User' : 'Register New User' }}</p>
            <p class="um-modal-banner-sub">{{ editingUser ? 'Update user account details' : 'Fill in the details to create a new account' }}</p>
          </div>
          <button class="um-modal-close" @click="showUserModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form class="um-form" @submit.prevent="saveUser">

          <!-- Avatar row -->
          <div class="reg-avatar-row">
            <div class="reg-avatar-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="reg-avatar-hint">
              <p class="reg-avatar-name">{{ userForm.firstName || userForm.lastName ? (userForm.firstName + ' ' + userForm.lastName).trim() : 'New User' }}</p>
              <p class="reg-avatar-role">{{ userForm.role || 'No role selected' }}</p>
            </div>
          </div>

          <!-- ── Section: Personal Info ── -->
          <div class="reg-section-title">
            <span class="reg-section-line"></span>
            <span class="reg-section-label">Personal Information</span>
            <span class="reg-section-line"></span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name <span class="form-required">*</span></label>
              <input v-model="userForm.firstName" class="form-input" type="text" placeholder="e.g. Juan" required />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name <span class="form-required">*</span></label>
              <input v-model="userForm.lastName" class="form-input" type="text" placeholder="e.g. Dela Cruz" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">PHINMA Email <span class="form-required">*</span></label>
              <input v-model="userForm.email" class="form-input" type="email" placeholder="juan.delacruz.au@phinmaed.com" required />
            </div>
            <div class="form-group">
              <label class="form-label">School ID Number <span class="form-required">*</span></label>
              <input v-model="userForm.schoolId" class="form-input" type="text" inputmode="numeric" maxlength="14" placeholder="01-1234-123456" required @input="formatSchoolId" />
            </div>
          </div>

          <!-- ── Section: Account Details ── -->
          <div class="reg-section-title">
            <span class="reg-section-line"></span>
            <span class="reg-section-label">Account Details</span>
            <span class="reg-section-line"></span>
          </div>

          <div class="form-row form-row--single">
            <div class="form-group">
              <label class="form-label">Role <span class="form-required">*</span></label>
              <select v-model="userForm.role" class="form-input" required>
                <option value="" disabled>Select role…</option>
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin & Teacher">Admin & Teacher</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          <div v-if="editingUser" class="form-row form-row--single">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="userForm.status" class="form-input">
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Denied">Denied</option>
              </select>
            </div>
          </div>

          <div v-if="userForm.role === 'Student'" class="form-row">
            <div class="form-group">
              <label class="form-label">Year Level</label>
              <select v-model="userForm.yearLevel" class="form-input">
                <option value="">Select year level</option>
                <option v-for="year in studentYearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Section</label>
              <input v-model.trim="userForm.section" class="form-input" type="text" placeholder="e.g. South 1" />
            </div>
          </div>

          <!-- ── Section: Credentials (Add only) ── -->
          <template v-if="!editingUser">
            <div class="reg-section-title">
              <span class="reg-section-line"></span>
              <span class="reg-section-label">Set Password</span>
              <span class="reg-section-line"></span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Password <span class="form-required">*</span></label>
                <input v-model="userForm.password" class="form-input" type="password" placeholder="Min. 8 characters" required />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password <span class="form-required">*</span></label>
                <input v-model="userForm.confirmPassword" class="form-input" type="password" placeholder="Re-enter password" required />
              </div>
            </div>
          </template>

          <div v-if="formError" class="um-pw-error">{{ formError }}</div>
          <div class="form-actions">
            <button type="submit" class="um-submit-btn" :disabled="isSavingUser">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ isSavingUser ? 'Saving...' : (editingUser ? 'Save Changes' : 'Register User') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Reset Password Modal ═══ -->
  <Teleport to="body">
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="um-modal-box">
        <div class="um-modal-banner um-modal-banner--warning">
          <div class="um-modal-banner-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="um-modal-banner-text">
            <p class="um-modal-banner-title">Reset Password</p>
            <p class="um-modal-banner-sub">Set a new password for {{ resetTarget?.name }}</p>
          </div>
          <button class="um-modal-close" @click="showResetModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form class="um-form" @submit.prevent="confirmResetPassword">
          <div class="form-group">
            <label class="form-label">New Password <span class="form-required">*</span></label>
            <input v-model="newPassword" class="form-input" type="password" placeholder="Enter new password" required />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password <span class="form-required">*</span></label>
            <input v-model="confirmPassword" class="form-input" type="password" placeholder="Confirm new password" required />
          </div>
          <div v-if="passwordError" class="um-pw-error">{{ passwordError }}</div>
          <div class="form-actions">
            <button type="button" class="um-cancel-btn" @click="showResetModal = false">Cancel</button>
            <button type="submit" class="um-submit-btn">Reset Password</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Restore User Modal ═══ -->
  <Teleport to="body">
    <div v-if="showRestoreModal" class="modal-overlay" @click.self="showRestoreModal = false">
      <div class="um-delete-box">
        <div class="um-delete-icon" style="background:#f3f4f6;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f575f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
        </div>
        <h2 class="um-delete-title">Restore User?</h2>
        <p class="um-delete-sub"><strong>{{ restoreTarget?.name }}</strong> will be moved back to active users and regain access.</p>
        <div class="um-delete-actions">
          <button class="um-cancel-btn" @click="showRestoreModal = false">Cancel</button>
          <button class="um-restore-confirm-btn" @click="confirmRestoreUser">Restore</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Archive Confirm Modal ═══ -->
  <Teleport to="body">
    <div v-if="showArchiveModal" class="modal-overlay" @click.self="showArchiveModal = false">
      <div class="um-delete-box">
        <div class="um-delete-icon" style="background:#fff7ed;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
        </div>
        <h2 class="um-delete-title">Archive User?</h2>
        <p class="um-delete-sub">This will archive <strong>{{ archiveTarget?.name }}</strong>. They will no longer have access but their data will be preserved.</p>
        <div class="um-delete-actions">
          <button class="um-cancel-btn" @click="showArchiveModal = false">Cancel</button>
          <button class="um-archive-confirm-btn" @click="confirmArchiveUser">Archive</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Reset Password Confirm ═══ -->
  <Teleport to="body">
    <div v-if="showResetConfirmModal" class="modal-overlay" @click.self="showResetConfirmModal = false">
      <div class="um-delete-box">
        <div class="um-delete-icon" style="background:#fef3c7;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 class="um-delete-title">Reset Password?</h2>
        <p class="um-delete-sub">An OTP will be sent to <strong>{{ resetConfirmTarget?.email }}</strong> to verify this action.</p>
        <div class="um-delete-actions">
          <button class="um-cancel-btn" @click="showResetConfirmModal = false">Cancel</button>
          <button class="um-reset-confirm-btn" @click="proceedResetPassword">Send OTP</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Reset Password OTP Modal ═══ -->
  <Teleport to="body">
    <div v-if="showResetOtpModal" class="modal-overlay" @click.self="showResetOtpModal = false">
      <div class="um-modal-box">
        <div class="um-modal-banner um-modal-banner--warning">
          <div class="um-modal-banner-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="um-modal-banner-text">
            <p class="um-modal-banner-title">OTP Verification</p>
            <p class="um-modal-banner-sub">Enter the code sent to {{ resetConfirmTarget?.email }}</p>
          </div>
          <button class="um-modal-close" @click="showResetOtpModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="um-form">
          <p class="um-otp-hint">Enter the 6-digit OTP to proceed. <strong>(Demo OTP: 123456)</strong></p>
          <div class="otp-input-row">
            <input
              v-model="resetOtpInput"
              class="form-input otp-input"
              type="text"
              maxlength="6"
              placeholder="_ _ _ _ _ _"
              inputmode="numeric"
              autocomplete="one-time-code"
            />
          </div>
          <div v-if="otpError" class="um-pw-error">{{ otpError }}</div>
          <div class="otp-resend-row">
            <span class="otp-resend-text">Didn't receive it?</span>
            <button type="button" class="otp-resend-btn" @click="resendOtp">Resend OTP</button>
          </div>
          <div class="form-actions">
            <button type="button" class="um-cancel-btn" @click="showResetOtpModal = false">Cancel</button>
            <button type="button" class="um-submit-btn" @click="verifyResetOtp">Verify &amp; Continue</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Sweet Alert — Register Confirm ═══ -->
  <Teleport to="body">
    <div v-if="showRegisterConfirm" class="modal-overlay">
      <div class="swal-box">
        <div class="swal-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
        </div>
        <p class="swal-text">Are you sure you want to continue?</p>
        <div class="swal-actions">
          <button class="swal-cancel" @click="showRegisterConfirm = false">Cancel</button>
          <button class="swal-continue" @click="confirmSaveUser">Continue</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Sweet Alert — Approve All Confirm ═══ -->
  <Teleport to="body">
    <div v-if="showApproveAllConfirm" class="modal-overlay">
      <div class="swal-box">
        <div class="swal-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
        </div>
        <p class="swal-text">{{ approvalMode === 'selected' ? `Approve ${selectedPendingUsers.length} selected user account(s)?` : `Approve all ${pendingCount} pending user account(s)?` }}</p>
        <div class="swal-actions">
          <button class="swal-cancel" @click="showApproveAllConfirm = false">Cancel</button>
          <button class="swal-continue" @click="confirmApproval">{{ approvalMode === 'selected' ? 'Approve Selected' : 'Approve All' }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ Logout Confirm Modal ═══ -->
  <Teleport to="body">
    <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
      <div class="logout-modal-box">
        <div class="logout-modal-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 class="logout-modal-title">Log out?</h2>
        <p class="logout-modal-sub">You will be returned to the login page.</p>
        <div class="logout-modal-actions">
          <button class="logout-cancel-btn" @click="showLogoutModal = false">Cancel</button>
          <button class="logout-confirm-btn" @click="confirmLogout">Log out</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { getToken, getUser, logout } from '@/auth.js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)


const user = getUser() || {}
/* ── Nav ── */
const navItems = [
  {
    name: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'View Schedules', to: '/admin/schedule/view',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    name: 'Add Schedule', to: '/admin/schedule/add',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
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
    name: 'Users', to: '/admin/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
  },
  {
    name: 'Settings', to: '/admin/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

/* ── Logout ── */
const showLogoutModal = ref(false)
function confirmLogout() {
  showLogoutModal.value = false
  logout()
  router.push('/')
}

/* ── View Tabs ── */
const activeView  = ref('active')

/* ── Search & Filter ── */
const searchQuery = ref('')
const roleFilter  = ref('')
const userStatFilter = ref('')

/* ── Users Data ── */
const users = ref([])
const isLoadingUsers = ref(false)
const loadError = ref('')
const toastMessage = ref('')
let toastTimer

function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2800)
}
const autoRefreshNotice = ref('')
const isBulkApproving = ref(false)
const selectedPendingIds = ref([])
const approvalMode = ref('all')
const PHINMA_EMAIL_REGEX = /^[a-z0-9._%+-]+\.au@phinmaed\.com$/i
const AUTO_REFRESH_MS = 10000
let autoRefreshTimer = null
let autoRefreshNoticeTimer = null

const pendingCount = computed(() => {
  return users.value.filter((u) => u.status === 'Pending').length
})

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchView   = activeView.value === 'archived' ? u.status === 'Archived' : u.status !== 'Archived'
    const query = searchQuery.value.trim().toLowerCase()
    const department = (u.department || '').toLowerCase()
    const matchSearch = query === '' ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      department.includes(query)
    const roles = Array.isArray(u.roles) ? u.roles : []
    const matchRole = roleFilter.value === '' ||
      (roleFilter.value === 'Admin & Teacher' && roles.includes('admin') && roles.includes('teacher')) ||
      u.role === roleFilter.value
    const matchStat = userStatFilter.value === '' ||
      userStatFilter.value === 'archived' ||
      (userStatFilter.value === 'admins' && roles.includes('admin')) ||
      (userStatFilter.value === 'teachers' && roles.includes('teacher')) ||
      (userStatFilter.value === 'admin-teacher' && roles.includes('admin') && roles.includes('teacher')) ||
      (userStatFilter.value === 'active' && u.status === 'Active')
    return matchView && matchSearch && matchRole && matchStat
  })
})

function selectUserStat(stat) {
  userStatFilter.value = stat === 'all' ? '' : stat
  roleFilter.value = stat === 'admin-teacher' ? 'Admin & Teacher' : ''
  activeView.value = stat === 'archived' ? 'archived' : 'active'
}

const selectablePendingUsers = computed(() => filteredUsers.value.filter((user) => user.status === 'Pending'))
const selectedPendingUsers = computed(() => {
  const selectedIds = new Set(selectedPendingIds.value)
  return users.value.filter((user) => user.status === 'Pending' && selectedIds.has(user.id))
})
const allVisiblePendingSelected = computed(() => {
  const visible = selectablePendingUsers.value
  return visible.length > 0 && visible.every((user) => selectedPendingIds.value.includes(user.id))
})

function toggleAllVisiblePending() {
  const visibleIds = selectablePendingUsers.value.map((user) => user.id)
  if (allVisiblePendingSelected.value) {
    selectedPendingIds.value = selectedPendingIds.value.filter((id) => !visibleIds.includes(id))
  } else {
    selectedPendingIds.value = [...new Set([...selectedPendingIds.value, ...visibleIds])]
  }
}

function formatDisplayDate(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fallbackAvatar(name) {
  const safeName = encodeURIComponent((name || 'User').trim() || 'User')
  return `https://ui-avatars.com/api/?name=${safeName}&background=DDECE5&color=1B4332`
}

function normalizeRoleLabel(role) {
  const value = (role || '').toString().toLowerCase()
  if (value === 'admin') return 'Admin'
  if (value === 'teacher') return 'Teacher'
  if (value === 'student') return 'Student'
  return role || ''
}

function formatSchoolIdValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 12)
  return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 12)].filter(Boolean).join('-')
}

function mapUserForUi(user) {
  const firstName = user.firstName || ''
  const lastName  = user.lastName || ''
  const name = (user.name || `${firstName} ${lastName}`).trim() || 'New User'
  return {
    id: user.id || user._id,
    name,
    firstName,
    lastName,
    email: user.email || '',
    role: normalizeRoleLabel(user.role || user.roleKey),
    roles: Array.isArray(user.roles) ? user.roles : [],
    department: user.department || '',
    status: user.status || 'Active',
    dateAdded: formatDisplayDate(user.dateAdded || user.createdAt),
    avatar: user.avatar || fallbackAvatar(name),
    schoolId: formatSchoolIdValue(user.schoolId || user.studentId || user.employeeId),
    phone: user.phone || '',
    studentId: user.studentId || '',
    employeeId: user.employeeId || '',
    yearLevel: user.yearLevel || '',
    section: user.section || '',
  }
}

function statusClass(status) {
  if (status === 'Active') return 'um-status--active'
  if (status === 'Pending') return 'um-status--pending'
  if (status === 'Denied') return 'um-status--denied'
  if (status === 'Archived') return 'um-status--archived'
  return 'um-status--inactive'
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) {
    logout()
    router.push('/')
    throw new Error('Session expired. Please log in again.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    ...options
  })

  let body = {}
  try {
    body = await response.json()
  } catch (_error) {
    body = {}
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logout()
      router.push('/')
    }
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

async function fetchUsers(options = {}) {
  const { silent = false } = options
  if (!silent) {
    isLoadingUsers.value = true
    loadError.value = ''
  }

  const previousPendingCount = pendingCount.value

  try {
    const payload = await apiRequest('/users')
    const list = Array.isArray(payload.users) ? payload.users : []
    users.value = list.map(mapUserForUi)

    if (silent) {
      const currentPendingCount = pendingCount.value
      if (currentPendingCount > previousPendingCount) {
        const diff = currentPendingCount - previousPendingCount
        autoRefreshNotice.value = `${diff} new pending student account${diff > 1 ? 's' : ''} detected.`
        if (autoRefreshNoticeTimer) {
          clearTimeout(autoRefreshNoticeTimer)
        }
        autoRefreshNoticeTimer = setTimeout(() => {
          autoRefreshNotice.value = ''
        }, 3500)
      }
    }
  } catch (error) {
    if (!silent) {
      loadError.value = error.message || 'Failed to load users.'
    }
  } finally {
    if (!silent) {
      isLoadingUsers.value = false
    }
  }
}

function startAutoRefreshUsers() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }

  autoRefreshTimer = setInterval(() => {
    if (document.hidden) {
      return
    }
    fetchUsers({ silent: true })
  }, AUTO_REFRESH_MS)
}

function stopAutoRefreshUsers() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }

  if (autoRefreshNoticeTimer) {
    clearTimeout(autoRefreshNoticeTimer)
    autoRefreshNoticeTimer = null
  }
}

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatSchoolId(event) {
  userForm.value.schoolId = formatSchoolIdValue(event.target.value)
}

function buildUserPayload(includePassword) {
  const schoolId = trimValue(userForm.value.schoolId)
  const role = userForm.value.role
  const roles = role === 'Admin & Teacher'
    ? ['admin', 'teacher']
    : [String(role || '').toLowerCase()]
  const payload = {
    firstName: trimValue(userForm.value.firstName),
    lastName: trimValue(userForm.value.lastName),
    email: trimValue(userForm.value.email),
    role: roles[0],
    roles,
    status: editingUser.value ? (userForm.value.status || 'Active') : 'Active',
    yearLevel: roles.includes('student') ? trimValue(userForm.value.yearLevel) : '',
    section: roles.includes('student') ? trimValue(userForm.value.section) : '',
  }

  if (schoolId) {
    if (roles.includes('student')) {
      payload.studentId = schoolId
    } else {
      payload.employeeId = schoolId
    }
  }

  if (includePassword) {
    payload.password = userForm.value.password
  }

  return payload
}

onMounted(async () => {
  await fetchUsers()
  startAutoRefreshUsers()
})

onUnmounted(() => {
  stopAutoRefreshUsers()
})

/* ── Add / Edit User ── */
const showUserModal   = ref(false)
const editingUser     = ref(null)
const formError       = ref('')
const showRegisterConfirm = ref(false)
const showApproveAllConfirm = ref(false)
const isSavingUser    = ref(false)
const studentYearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const emptyForm = () => ({ firstName: '', lastName: '', email: '', schoolId: '', role: '', status: 'Active', yearLevel: '', section: '', password: '', confirmPassword: '' })
const userForm  = ref(emptyForm())

function openAddUser() {
  editingUser.value     = null
  formError.value       = ''
  userForm.value        = emptyForm()
  showUserModal.value   = true
}

function openEditUser(user) {
  editingUser.value     = user
  formError.value       = ''
  const parts = (user.name || '').split(' ')
  userForm.value = {
    firstName: parts[0] || '',
    lastName:  parts.slice(1).join(' ') || '',
    email:      user.email,
    schoolId:   formatSchoolIdValue(user.schoolId || user.studentId || user.employeeId),
    role:       user.role,
    status:     user.status,
    yearLevel:  user.yearLevel || '',
    section:    user.section || '',
    password:   '',
    confirmPassword: '',
  }
  showUserModal.value = true
}

function saveUser() {
  formError.value = ''
  const trimmedSchoolId = (userForm.value.schoolId || '').trim()
  const normalizedEmail = (userForm.value.email || '').trim().toLowerCase()

  if (!trimmedSchoolId) {
    formError.value = 'School ID Number is required.'
    return
  }

  if (!PHINMA_EMAIL_REGEX.test(normalizedEmail)) {
    formError.value = 'PHINMA Email must end with .au@phinmaed.com.'
    return
  }

  if (!editingUser.value) {
    if (userForm.value.password !== userForm.value.confirmPassword) {
      formError.value = 'Passwords do not match.'
      return
    }
    if (!userForm.value.password || userForm.value.password.length < 8) {
      formError.value = 'Password must be at least 8 characters.'
      return
    }
  }
  // Show sweet alert confirm before committing
  showRegisterConfirm.value = true
}

async function updateUserStatus(user, status) {
  await apiRequest(`/users/${user.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
  await fetchUsers()
}

async function approveUser(user) {
  try {
    await updateUserStatus(user, 'Active')
  } catch (error) {
    loadError.value = error.message || 'Failed to approve user.'
  }
}

async function denyUser(user) {
  try {
    await updateUserStatus(user, 'Denied')
  } catch (error) {
    loadError.value = error.message || 'Failed to deny user.'
  }
}

async function approveAllPending() {
  if (pendingCount.value === 0 || isBulkApproving.value) {
    return
  }

  isBulkApproving.value = true
  loadError.value = ''
  try {
    await apiRequest('/users/approve-all-pending', {
      method: 'PATCH'
    })
    await fetchUsers()
  } catch (error) {
    loadError.value = error.message || 'Failed to approve pending users.'
  } finally {
    isBulkApproving.value = false
  }
}

async function approveSelectedPending() {
  const selectedUsers = selectedPendingUsers.value
  if (!selectedUsers.length || isBulkApproving.value) return

  isBulkApproving.value = true
  loadError.value = ''
  try {
    await Promise.all(selectedUsers.map((user) => apiRequest(`/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Active' })
    })))
    selectedPendingIds.value = []
    await fetchUsers()
  } catch (error) {
    loadError.value = error.message || 'Failed to approve selected users.'
  } finally {
    isBulkApproving.value = false
  }
}

function promptApproveAll() {
  if (pendingCount.value === 0 || isBulkApproving.value) {
    return
  }
  approvalMode.value = 'all'
  showApproveAllConfirm.value = true
}

function promptApproveSelected() {
  if (!selectedPendingUsers.value.length || isBulkApproving.value) return
  approvalMode.value = 'selected'
  showApproveAllConfirm.value = true
}

async function confirmApproval() {
  showApproveAllConfirm.value = false
  if (approvalMode.value === 'selected') {
    await approveSelectedPending()
  } else {
    await approveAllPending()
  }
}

function printUsersTable() {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const rows = filteredUsers.value
    .map((user) => {
      const userInfo = `${esc(user.name)}${user.department ? `<br><span class="dept">${esc(user.department)}</span>` : ''}`
      return `
        <tr>
          <td>${userInfo}</td>
          <td>${esc(user.email)}</td>
          <td>${esc(user.role)}</td>
          <td>${esc(user.status)}</td>
          <td>${esc(user.dateAdded)}</td>
        </tr>`
    })
    .join('')

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const viewLabel = activeView.value === 'archived' ? 'Archived Users' : 'All Users'
  const roleLabel = roleFilter.value || 'All Roles'
  const searchLabel = (searchQuery.value || '').trim() || 'None'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Manage Users - ${esc(viewLabel)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:12px;color:#1a1a2e;}
    h2{font-size:18px;font-weight:700;margin-bottom:6px;color:#4b5563;}
    .meta{font-size:11px;color:#4b5563;margin-bottom:12px;line-height:1.5;}
    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    th{background:#4b5563;color:#fff;padding:8px 6px;text-align:left;font-size:11px;font-weight:600;border:1px solid #0f2d21;}
    td{border:1px solid #dfe5e2;padding:8px 6px;vertical-align:top;font-size:11px;word-wrap:break-word;}
    .dept{color:#6b7280;font-size:10px;}
    .empty{padding:12px;text-align:center;color:#6b7280;border:1px solid #dfe5e2;}
    @media print { body{padding:8px;} }
  </style>
</head>
<body>
  <h2>Manage Users</h2>
  <p class="meta">View: ${esc(viewLabel)} | Role Filter: ${esc(roleLabel)} | Search: ${esc(searchLabel)}<br>Printed on ${esc(today)}</p>
  ${rows ? `<table>
    <thead>
      <tr>
        <th>User</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Date Added</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>` : '<div class="empty">No users found for current filters.</div>'}
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<' + '/script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=1000,height=700')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
}

async function confirmSaveUser() {
  formError.value = ''
  showRegisterConfirm.value = false
  isSavingUser.value = true
  const wasEditing = Boolean(editingUser.value)

  try {
    const payload = buildUserPayload(!editingUser.value)
    if (editingUser.value) {
      await apiRequest(`/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
    } else {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }

    await fetchUsers()
    showUserModal.value = false
    showToast(wasEditing ? 'User updated successfully.' : 'User added successfully.')
  } catch (error) {
    formError.value = error.message || 'Failed to save user.'
  } finally {
    isSavingUser.value = false
  }
}

/* ── Reset Password ── */
const showResetModal  = ref(false)
const resetTarget     = ref(null)
const newPassword     = ref('')
const confirmPassword  = ref('')
const passwordError   = ref('')

function openResetPassword(user) {
  resetTarget.value    = user
  newPassword.value    = ''
  confirmPassword.value = ''
  passwordError.value  = ''
  showResetModal.value = true
}

function confirmResetPassword() {
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match.'
    return
  }
  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters.'
    return
  }
  // In a real app: call API here
  showResetModal.value = false
}

/* ── Reset Password Confirm + OTP ── */
const showResetConfirmModal = ref(false)
const resetConfirmTarget    = ref(null)
const showResetOtpModal     = ref(false)
const resetOtpInput         = ref('')
const otpError              = ref('')
let   _generatedOtp         = ''

function openResetConfirm(user) {
  resetConfirmTarget.value    = user
  showResetConfirmModal.value = true
}

function proceedResetPassword() {
  showResetConfirmModal.value = false
  // Hardcoded for frontend demo — replace with API call in production
  _generatedOtp          = '123456'
  resetOtpInput.value    = ''
  otpError.value         = ''
  showResetOtpModal.value = true
}

function verifyResetOtp() {
  if (!resetOtpInput.value || resetOtpInput.value.length < 6) {
    otpError.value = 'Please enter the 6-digit OTP.'
    return
  }
  if (resetOtpInput.value !== _generatedOtp) {
    otpError.value = 'Incorrect OTP. Please try again.'
    return
  }
  showResetOtpModal.value = false
  openResetPassword(resetConfirmTarget.value)
}

function resendOtp() {
  _generatedOtp = '123456'
  otpError.value = ''
  resetOtpInput.value = ''
}

/* ── Archive User ── */
const showArchiveModal = ref(false)
const archiveTarget    = ref(null)

function openArchiveUser(user) {
  archiveTarget.value    = user
  showArchiveModal.value = true
}

function confirmArchiveUser() {
  const u = users.value.find(u => u.id === archiveTarget.value.id)
  if (u) u.status = 'Archived'
  showArchiveModal.value = false
  showToast('User archived successfully.')
}

/* ── Restore User ── */
const showRestoreModal = ref(false)
const restoreTarget    = ref(null)

function openRestoreUser(user) {
  restoreTarget.value    = user
  showRestoreModal.value = true
}

function confirmRestoreUser() {
  const u = users.value.find(u => u.id === restoreTarget.value.id)
  if (u) u.status = 'Active'
  showRestoreModal.value = false
  activeView.value = 'active'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
  font-family: 'Poppins', sans-serif;
}

/* ── Sidebar ── */
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
  border: 3px solid #c4c9cd;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #4b5563; }
.role   { font-size: 0.88rem; color: #444; font-weight: 500; }
.email  { font-size: 0.82rem; color: #888; word-break: break-all; }

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
  font-weight: 400;
  color: #444;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
}
.nav-item:hover  { background: #f8fafc; color: #4b5563; }
.nav-item.active { background: #4b5563; color: #fff; }
.nav-item.active .nav-icon { color: #fff; }
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
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.logout-btn:hover { background: #c1121f; }

/* ── Main ── */
.main {
  flex: 1;
  padding: 40px 44px 32px;
  overflow-y: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #4b5563;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.95rem;
  color: #777;
  margin-top: 4px;
}

/* ── Topbar ── */
.um-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  gap: 12px;
  flex-wrap: wrap;
}
.um-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.um-approve-all-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #41484f;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, opacity 0.18s;
}
.um-approve-all-btn:hover { background: #4b5259; }
.um-approve-all-btn[disabled] {
  opacity: 0.65;
  cursor: not-allowed;
}
.um-approve-selected-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 13px; border: 1px solid #1b4332; border-radius: 8px;
  background: #fff; color: #1b4332; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer;
}
.um-approve-selected-btn:hover { background: #edf8f1; }
.um-approve-selected-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.um-print-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  color: #41484f;
  border: 1.5px solid #d1e7db;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s;
}
.um-print-btn:hover {
  background: #eff8f3;
  border-color: #b9dac8;
}
.um-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.um-search-icon {
  position: absolute;
  left: 13px;
  color: #aaa;
  pointer-events: none;
  display: flex;
}
.um-search-input {
  font-family: inherit;
  font-size: 0.875rem;
  color: #111;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px 14px 10px 38px;
  outline: none;
  width: 280px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.um-search-input:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(83, 91, 100,0.09);
}
.um-filter-select {
  font-family: inherit;
  font-size: 0.875rem;
  color: #555;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px 14px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.18s;
}
.um-filter-select:focus { border-color: #6b7280; }
.um-add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #4b5563;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.um-add-btn:hover { background: #6b7280; }

/* ── Stats Row ── */
.um-stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.um-stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.um-stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.um-stat-icon--total   { background: #f3f4f6; color: #4f575f; }
.um-stat-icon--admin   { background: #e8eefe; color: #2563eb; }
.um-stat-icon--archived { background: #f3f4f6; color: #6b7280; }
.um-stat-card--clickable { cursor: pointer; transition: box-shadow 0.18s, transform 0.15s; }
.um-stat-card--clickable:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.12); transform: translateY(-2px); }
.um-stat-icon--teacher { background: #fef3c7; color: #b45309; }
.um-stat-icon--active  { background: #d8dcdf; color: #4f575f; }
.um-stat-val   { font-size: 1.6rem; font-weight: 800; color: #111; line-height: 1; }
.um-stat-label { font-size: 0.78rem; color: #888; font-weight: 500; margin-top: 3px; }

/* ── Table ── */
.um-table-wrap {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  max-height: 62vh;
  overflow-x: auto;
  overflow-y: auto;
}
.um-error-banner {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 14px;
}
.um-info-banner {
  background: #f3f4f6;
  border: 1px solid #b7dfca;
  color: #4f575f;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 14px;
}
.um-submit-btn[disabled] {
  opacity: 0.65;
  cursor: not-allowed;
}
.um-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.um-table thead tr {
  background: #f7f8fa;
  border-bottom: 1.5px solid #efefef;
}
.um-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f7f8fa;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 20px;
}
.um-select-col { width: 42px; padding-left: 14px !important; padding-right: 4px !important; text-align: center; }
.um-select-check { width: 16px; height: 16px; accent-color: #1b4332; cursor: pointer; vertical-align: middle; }
.um-row {
  border-bottom: 1px solid #f4f4f4;
  transition: background 0.15s;
}
.um-row:last-child { border-bottom: none; }
.um-row:hover { background: #f9fbfa; }
.um-table td { padding: 14px 20px; vertical-align: middle; }

.um-user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.um-user-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.um-user-name  { display: block; font-weight: 600; color: #111; }
.um-user-dept  { display: block; font-size: 0.75rem; color: #999; margin-top: 2px; }
.um-email { color: #555; }
.um-date  { color: #999; font-size: 0.82rem; }

.um-role-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.um-role-badge--admin   { background: #e8eefe; color: #2563eb; }
.um-role-badge--teacher { background: #fef3c7; color: #b45309; }
.um-role-badge--student { background: #f0e8fe; color: #7c3aed; }

.um-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}
.um-status--active   { background: #d8dcdf; color: #4f575f; }
.um-status--pending  { background: #fff7e0; color: #b45309; }
.um-status--inactive { background: #ffeaea; color: #e63946; }
.um-status--denied   { background: #fee2e2; color: #b91c1c; }
.um-status--archived { background: #f3f4f6; color: #6b7280; }
.um-status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.um-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 188px;
}
.um-actions-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}
.um-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-family: inherit;
  font-size: 0.77rem;
  font-weight: 500;
  padding: 6px 10px;
  min-height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.um-actions-row .um-btn,
.um-actions > .um-btn {
  width: 100%;
}
.um-btn--edit   { background: #eef4fe; color: #2563eb; }
.um-btn--edit:hover { background: #dceafd; }
.um-btn--approve { background: #dcfce7; color: #4b5259; }
.um-btn--approve:hover { background: #bbf7d0; }
.um-btn--deny  { background: #fee2e2; color: #b91c1c; }
.um-btn--deny:hover { background: #fecaca; }
.um-btn--archive { background: #fff7ed; color: #b45309; }
.um-btn--archive:hover { background: #fde68a; }
.um-btn--restore { background: #f3f4f6; color: #4f575f; }
.um-btn--restore:hover { background: #d1fae5; }

.um-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: #bbb;
  font-size: 0.88rem;
}

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── User / Reset Modal ── */
.um-modal-box {
  background: #fff;
  border-radius: 20px;
  width: 560px;
  max-width: 95vw;
}
.um-modal-box--wide {
  width: 660px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  position: relative;
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
.um-modal-banner {
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
  padding: 26px 28px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 20px 20px 0 0;
  position: relative;
}
.um-modal-banner--warning {
  background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
}
.um-modal-banner-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.um-modal-banner-text { flex: 1; }
.um-modal-banner-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  line-height: 1.2;
}
.um-modal-banner-sub {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.72);
  margin: 0;
}
.um-modal-close {
  position: absolute;
  top: 16px; right: 18px;
  width: 30px; height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.um-modal-close:hover { background: rgba(255,255,255,0.28); }

.um-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 26px 28px 28px;
}
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-row--single {
  grid-template-columns: 1fr;
}
.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #666;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.form-required { color: #e63946; }
.form-input {
  font-family: inherit;
  font-size: 0.875rem;
  color: #111;
  background: #f7f8fa;
  border: 1.5px solid #ececec;
  border-radius: 10px;
  padding: 11px 14px;
  outline: none;
  width: 100%;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
}
.form-input::placeholder { color: #c0c4cc; }
.form-input:focus {
  border-color: #6b7280;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(83, 91, 100,0.09);
}
.um-pw-error {
  font-size: 0.82rem;
  color: #e63946;
  background: #ffeaea;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 500;
}

/* ── Registration form extras ── */
.reg-avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f4f5f5;
  border: 1.5px dashed #c4c9cd;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 4px;
}
.reg-avatar-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e8f0ec;
  border: 2px solid #c4c9cd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.reg-avatar-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 2px;
}
.reg-avatar-role {
  font-size: 0.78rem;
  color: #888;
  margin: 0;
}
.reg-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0 2px;
}
.reg-section-line {
  flex: 1;
  height: 1px;
  background: #ececec;
}
.reg-section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  white-space: nowrap;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  margin-top: 2px;
}
.um-cancel-btn {
  background: none;
  border: 1.5px solid #e0e0e0;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 10px;
  transition: background 0.15s, border-color 0.15s;
}
.um-cancel-btn:hover { background: #f5f5f5; border-color: #ccc; }
.um-submit-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 10px 26px;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.18s, box-shadow 0.18s;
  box-shadow: 0 4px 14px rgba(48, 53, 58,0.25);
}
.um-submit-btn:hover { opacity: 0.9; box-shadow: 0 6px 18px rgba(48, 53, 58,0.32); }

/* ── Delete Modal ── */
.um-delete-box {
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px 32px;
  width: 380px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
.um-delete-icon {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.um-delete-title { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0; }
.um-delete-sub   { font-size: 0.88rem; color: #777; margin: 0 0 8px; line-height: 1.6; }
.um-delete-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 6px;
  width: 100%;
}
.um-delete-confirm-btn {
  background: #e63946;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.um-delete-confirm-btn:hover { background: #c1121f; }
.um-archive-confirm-btn {
  background: #f59e0b;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.um-archive-confirm-btn:hover { background: #d97706; }

/* ── OTP Input ── */
.um-otp-hint {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 18px;
}
.otp-input-row {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.otp-input {
  text-align: center;
  letter-spacing: 0.5em;
  font-size: 1.5rem;
  font-weight: 700;
  width: 290px;
  padding: 12px 18px !important;
}
.otp-resend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-bottom: 6px;
}
.otp-resend-text { font-size: 0.83rem; color: #999; }
.otp-resend-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.um-reset-confirm-btn {
  background: #4b5563;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.um-reset-confirm-btn:hover { background: #6b7280; }
.um-restore-confirm-btn {
  background: #4b5563;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.um-restore-confirm-btn:hover { background: #6b7280; }

.swal-box {
  width: min(430px, calc(100vw - 40px));
  display: flex;
  align-items: center;
  padding: 28px 30px 24px;
  gap: 14px;
  border: 1px solid #d5dde1;
  border-radius: 18px;
  background: #f7f9fa;
  box-shadow: 0 18px 42px rgba(34,45,54,.22);
}
.swal-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  flex: 0 0 48px;
  border: 1px solid #e2d5b8;
  border-radius: 14px;
  background: #f8f3e7;
  color: #765f2e;
}
.swal-text {
  flex: 1;
  color: #202830;
  font-size: 1rem;
  line-height: 1.45;
  text-align: left;
}
.swal-actions { gap: 10px; flex: 0 0 auto; }
.swal-cancel,
.swal-continue {
  min-height: 40px;
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 700;
}
.swal-cancel {
  padding: 9px 18px;
  border: 1px solid #d6dfe3;
  background: #fff;
  color: #59656e;
}
.swal-cancel:hover { background: #eef2f4; }
.swal-continue {
  min-width: 108px;
  padding: 9px 18px;
  border: 1px solid #3e4d58;
  background: #44515d;
  box-shadow: none;
}
.swal-continue:hover { background: #35424d; }

.um-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 230px;
  max-width: calc(100vw - 48px);
  padding: 12px 15px;
  border: 1px solid #cbd8d0;
  border-radius: 12px;
  background: #f7fbf8;
  color: #3d5547;
  box-shadow: 0 10px 24px rgba(42,52,59,.16);
  font-size: .78rem;
  font-weight: 650;
}
.um-toast-icon {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  flex: 0 0 26px;
  border-radius: 8px;
  background: #dff1e5;
  color: #2f8250;
}
.toast-enter-active,
.toast-leave-active { transition: opacity .2s ease, transform .2s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 520px) {
  .swal-box { flex-wrap: wrap; }
  .swal-text { flex-basis: calc(100% - 62px); }
  .swal-actions { width: 100%; justify-content: flex-end; }
}

/* ── View Tabs ── */
.um-view-tabs {
  display: flex;
  gap: 6px;
  align-items: center;
}
.um-view-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1.5px solid #ececec;
  background: #fff;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.18s;
}
.um-view-tab:hover { border-color: #6b7280; color: #6b7280; }
.um-view-tab--on {
  background: #4b5563;
  border-color: #4b5563;
  color: #fff;
  font-weight: 600;
}
.um-view-tab-badge {
  background: #e63946;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 20px;
  padding: 1px 7px;
  min-width: 18px;
  text-align: center;
}

/* ── Sweet Alert ── */
.swal-box {
  background: #fff;
  border-radius: 18px;
  padding: 40px 44px 32px;
  width: 420px;
  max-width: 92vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
.swal-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}
.swal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
}
.swal-cancel {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  color: #e63946;
  cursor: pointer;
  padding: 10px 28px;
  border-radius: 10px;
  transition: background 0.15s;
}
.swal-cancel:hover { background: #ffeaea; }
.swal-continue {
  background: #4b5563;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  padding: 11px 36px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
  box-shadow: 0 4px 14px rgba(48, 53, 58,0.22);
}
.swal-continue:hover { background: #6b7280; }

/* ── Logout Modal ── */
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
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  text-align: center;
  animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
}
.logout-modal-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: #ffeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.logout-modal-title { font-size: 1.45rem; font-weight: 700; color: #111; margin: 0; }
.logout-modal-sub   { font-size: 0.9rem; color: #777; margin: 0 0 8px; }
.logout-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 6px;
  width: 100%;
}
.logout-cancel-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #e63946;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  transition: background 0.15s;
}
.logout-cancel-btn:hover { background: #ffeaea; }
.logout-confirm-btn {
  background: #4b5563;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.logout-confirm-btn:hover { background: #6b7280; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .um-stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .main { padding: 20px 16px 32px; }
}
@media (max-width: 700px) {
  .um-stats-row { grid-template-columns: 1fr 1fr; }
  .um-table th:nth-child(4),
  .um-table td:nth-child(4),
  .um-table th:nth-child(5),
  .um-table td:nth-child(5) { display: none; }
}
@media (max-width: 600px) {
  .sidebar { width: 240px; min-width: 240px; }
  .form-row { grid-template-columns: 1fr; }
}

/* ── Modern metallic users page alignment ─────────────────────────────── */
.layout{background:linear-gradient(135deg,#eef1f2 0%,#d7dcdf 48%,#c5ccd0 100%);color:#222a33}.main{padding:40px 44px 46px}.main-header{display:block;margin-bottom:24px}.main-header::before{content:'User management';display:block;margin-bottom:10px;color:#6f7a83;font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.page-title{color:#202830;font-size:clamp(2.35rem,3.4vw,2.95rem);line-height:1;letter-spacing:-.06em;font-weight:850}.page-sub{margin-top:12px;color:#74808a;font-size:1rem;line-height:1.55}
.um-management-panel{padding:28px 30px 30px;border:1px solid rgba(255,255,255,.9);border-radius:25px;background:linear-gradient(145deg,rgba(248,250,251,.9),rgba(223,229,233,.7));box-shadow:14px 16px 34px rgba(84,94,103,.14),-8px -8px 22px rgba(255,255,255,.58),inset 1px 1px 0 rgba(255,255,255,.76)}.um-topbar{margin:0 0 22px;padding-bottom:22px;border-bottom:1px solid rgba(151,163,173,.18);gap:16px}.um-view-tabs{display:inline-flex;gap:6px;padding:6px;border:1px solid rgba(205,214,220,.9);border-radius:16px;background:rgba(255,255,255,.72);box-shadow:inset 1px 1px 3px rgba(116,128,139,.12),inset -1px -1px 4px rgba(255,255,255,.9)}.um-view-tab{min-height:44px;padding:0 18px;border:1px solid transparent;border-radius:12px;background:transparent;color:#596572;font-size:.82rem;font-weight:850;box-shadow:none}.um-view-tab:hover:not(.um-view-tab--on){background:rgba(255,255,255,.72);border-color:#e2e8ec}.um-view-tab--on{border-color:#3d4853;background:linear-gradient(145deg,#5c6873,#36414b);color:#fff;box-shadow:0 8px 18px rgba(58,68,78,.18),inset 0 1px 0 rgba(255,255,255,.16)}.um-view-tab-badge{background:rgba(255,255,255,.24);color:inherit}.um-topbar-right{gap:10px;flex-wrap:wrap;justify-content:flex-end}.um-search-input,.um-filter-select{height:46px;border:1px solid #d7e0e6;border-radius:12px;background:#fbfcfd;color:#24303a;font-size:.84rem;box-shadow:inset 0 1px 2px rgba(68,80,91,.06)}.um-search-input{width:min(330px,32vw);padding-left:40px}.um-search-input:focus,.um-filter-select:focus{border-color:#6b7884;box-shadow:0 0 0 3px rgba(100,113,126,.12);background:#fff}.um-search-icon{left:14px;color:#8a949d}.um-filter-select{min-width:145px}.um-add-btn,.um-approve-all-btn{min-height:46px;border:1px solid #3e4a55;border-radius:13px;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;font-weight:850;box-shadow:0 12px 24px rgba(48,57,66,.2),inset 0 1px 0 rgba(255,255,255,.18)}.um-add-btn:hover,.um-approve-all-btn:hover{background:linear-gradient(145deg,#64707b,#3a4650);transform:translateY(-1px)}.um-print-btn,.um-approve-selected-btn{min-height:46px;border:1px solid #dbe3e8;border-radius:13px;background:#fff;color:#4f5b66;font-weight:850;box-shadow:0 8px 16px rgba(88,99,108,.08)}.um-print-btn:hover,.um-approve-selected-btn:hover{background:#f7f9fa;border-color:#cfd9df}
.um-stats-row{grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin:0 0 24px}.um-stat-card{min-height:94px;padding:18px 20px;border:1px solid rgba(255,255,255,.88);border-radius:18px;background:rgba(255,255,255,.76);box-shadow:0 14px 28px rgba(82,93,102,.09),inset 0 1px 0 rgba(255,255,255,.8)}.um-stat-card:hover{transform:translateY(-1px)}.um-stat-icon{width:48px;height:48px;border-radius:14px}.um-stat-icon--total,.um-stat-icon--active,.um-stat-icon--archived{background:linear-gradient(145deg,#eef2f4,#dfe6ea);color:#44515d}.um-stat-val{color:#202830;font-size:1.55rem;font-weight:900}.um-stat-label{color:#7d8790;font-size:.78rem;font-weight:750}.um-table-wrap{border:1px solid rgba(255,255,255,.86);border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 16px 30px rgba(82,93,102,.1),inset 0 1px 0 rgba(255,255,255,.78);max-height:58vh}.um-table thead tr,.um-table th{background:#f4f6f7}.um-table th{padding:17px 20px;color:#838c94;font-size:.7rem;font-weight:900;letter-spacing:.08em}.um-table td{padding:16px 20px}.um-row{border-bottom:1px solid #e9eef1;background:rgba(255,255,255,.35)}.um-row:hover{background:rgba(248,250,251,.96)}.um-user-avatar{width:44px;height:44px;border:2px solid #fff;box-shadow:0 6px 14px rgba(72,82,91,.12)}.um-user-name{color:#202830;font-size:.92rem;font-weight:850}.um-user-dept{color:#8a949d;font-weight:500}.um-email{color:#56616b;font-weight:600}.um-date{color:#8a949d;font-size:.82rem;font-weight:600}.um-role-badge,.um-status-badge{font-weight:900}.um-status--active{background:#e4e8eb;color:#4f5b66}.um-status--denied{background:#fee2e2;color:#b91c1c}.um-actions{width:196px}.um-btn{min-height:36px;border:1px solid transparent;border-radius:11px;font-size:.76rem;font-weight:850}.um-btn--edit{background:#edf4ff;color:#2f70e8}.um-btn--archive{background:#fff4e8;color:#c4621b}.um-btn--approve{background:#eaf7f0;color:#2a8752}.um-btn--deny{background:#fff0f0;color:#b91c1c}.um-btn--restore{background:#eef2f4;color:#44515d}.um-empty{color:#7b858d;font-weight:750}
@media(max-width:1280px){.um-stats-row{grid-template-columns:repeat(3,minmax(0,1fr))}.um-search-input{width:260px}}@media(max-width:900px){.main{padding:24px 18px}.um-management-panel{padding:20px;border-radius:22px}.um-topbar{align-items:flex-start}.um-topbar-right{justify-content:flex-start;width:100%}.um-search-wrap,.um-search-input,.um-filter-select,.um-print-btn,.um-add-btn{width:100%}.um-stats-row{grid-template-columns:1fr 1fr}.um-table-wrap{max-height:none}.um-actions{width:170px}}@media(max-width:640px){.um-stats-row{grid-template-columns:1fr}.page-title{font-size:2.15rem}.um-view-tabs{width:100%;overflow:auto}.um-view-tab{white-space:nowrap}.um-table th,.um-table td{padding:14px}}

/* ── User modal alignment polish ─────────────────────────────────────── */
.um-status--active{background:#e6f7ed;color:#23834d;border:1px solid #bfe8cf}.um-status--active .um-status-dot{background:#2fa866}.um-stat-icon--active{background:#e6f7ed;color:#23834d}
.modal-overlay{padding:22px;background:rgba(31,35,39,.58);backdrop-filter:blur(6px)}.um-modal-box--wide{display:flex;flex-direction:column;width:min(760px,calc(100vw - 44px));max-height:calc(100vh - 58px);overflow:hidden;border:1px solid rgba(255,255,255,.82);border-radius:22px;background:#fff;box-shadow:0 28px 80px rgba(18,24,30,.34)}.um-modal-banner{flex:0 0 auto;min-height:112px;padding:24px 32px;background:linear-gradient(145deg,#6a7480,#424d58);border-radius:22px 22px 0 0}.um-modal-banner-icon{width:58px;height:58px;border-radius:16px;background:rgba(255,255,255,.14)}.um-modal-banner-title{font-size:1.35rem;font-weight:850;letter-spacing:-.035em}.um-modal-banner-sub{font-size:.88rem}.um-modal-close{top:18px;right:20px;width:38px;height:38px;border:1px solid rgba(255,255,255,.16);border-radius:12px}
.um-modal-box--wide .um-form{flex:1;min-height:0;overflow-y:auto;padding:28px 34px 0;gap:20px}.reg-avatar-row{align-items:center;gap:18px;margin:0 0 4px;padding:18px 22px;border:1px dashed #bdc7cf;border-radius:18px;background:#f8fafb}.reg-avatar-wrap{width:70px;height:70px;background:#eef2f4;border-color:#cfd8de}.reg-avatar-name{font-size:1.02rem;font-weight:850;color:#303943}.reg-avatar-role{font-size:.82rem;color:#8a949d}.reg-section-title{margin:12px 0 0}.reg-section-label{color:#9aa2aa;font-size:.72rem;font-weight:900;letter-spacing:.08em}.form-row{gap:18px 20px}.form-group{gap:8px}.form-label{color:#5f6973;font-size:.74rem;font-weight:900;letter-spacing:.045em}.form-input{min-height:48px;border:1px solid #dce3e8;border-radius:12px;background:#fbfcfd;color:#26313b;font-size:.88rem;box-shadow:inset 0 1px 2px rgba(68,80,91,.04)}.form-input:focus{border-color:#6b7884;background:#fff;box-shadow:0 0 0 3px rgba(100,113,126,.12)}.form-actions{position:sticky;bottom:0;margin:4px -34px 0;padding:18px 34px 22px;border-top:1px solid #e6ecef;background:linear-gradient(180deg,rgba(255,255,255,.92),#fff);box-shadow:0 -12px 24px rgba(82,93,102,.06)}.um-cancel-btn,.um-submit-btn{min-height:46px;border-radius:13px;font-size:.88rem;font-weight:850}.um-cancel-btn{min-width:120px;background:#fff;color:#4f5b66;border:1px solid #dbe3e8}.um-submit-btn{min-width:190px;justify-content:center;background:linear-gradient(145deg,#5d6873,#343e48);box-shadow:0 12px 24px rgba(48,57,66,.18),inset 0 1px 0 rgba(255,255,255,.18)}
@media(max-width:760px){.um-modal-box--wide{width:calc(100vw - 28px);max-height:calc(100vh - 28px)}.um-modal-banner{padding:22px 24px}.um-modal-box--wide .um-form{padding:24px 24px 0}.form-actions{margin-left:-24px;margin-right:-24px;padding:16px 24px 20px}.form-row{grid-template-columns:1fr}.reg-avatar-row{align-items:flex-start}}

/* ── No-scroll register modal + table viewing fix ─────────────────────── */
.um-table-wrap{max-height:none;overflow-x:auto;overflow-y:visible}.um-table th{position:static}.um-table tbody tr:first-child td{border-top:0}.um-table td{height:auto}.um-status--active{background:#dcfce7;color:#188246;border-color:#a7e8bd}.um-status--active .um-status-dot{background:#22b35d}
.um-modal-box--wide{width:min(840px,calc(100vw - 44px));max-height:none;overflow:visible}.um-modal-box--wide .um-form{overflow:visible;padding:22px 30px 0;gap:13px}.um-modal-banner{min-height:96px;padding:20px 30px}.um-modal-banner-icon{width:50px;height:50px}.um-modal-banner-title{font-size:1.26rem}.um-modal-banner-sub{font-size:.84rem}.reg-avatar-row{padding:13px 16px;border-radius:15px;margin-bottom:0}.reg-avatar-wrap{width:54px;height:54px}.reg-avatar-wrap svg{width:28px;height:28px}.reg-avatar-name{font-size:.96rem}.reg-avatar-role{font-size:.76rem}.reg-section-title{margin:5px 0 -2px}.reg-section-label{font-size:.68rem}.form-row{gap:12px 18px}.form-group{gap:6px}.form-label{font-size:.7rem}.form-input{min-height:42px;padding:9px 13px;border-radius:11px}.form-actions{position:static;margin:0 -30px 0;padding:14px 30px 18px}.um-cancel-btn,.um-submit-btn{min-height:42px}.um-submit-btn{min-width:175px}.um-cancel-btn{min-width:112px}
@media(max-height:760px){.um-modal-box--wide{width:min(900px,calc(100vw - 36px))}.um-modal-box--wide .um-form{gap:10px;padding-top:18px}.um-modal-banner{min-height:86px;padding:16px 28px}.reg-avatar-row{padding:10px 14px}.reg-avatar-wrap{width:48px;height:48px}.reg-section-title{margin:2px 0 -4px}.form-input{min-height:38px;padding:7px 12px}.form-actions{padding-top:11px;padding-bottom:14px}.um-cancel-btn,.um-submit-btn{min-height:38px}}
@media(max-width:760px){.um-modal-box--wide{max-height:none;overflow:visible}.um-modal-box--wide .um-form{overflow:visible}.form-actions{position:static}.um-table-wrap{overflow-x:auto}}

/* ── Shared admin content styling ───────────────────────────────────── */
.main-header::before { display: none; }
.main { padding: 32px 38px 44px; }
.main-header { margin-bottom: 25px; }
.um-management-panel {
  padding: 17px 27px 24px !important;
  border: 1px solid var(--metal-line) !important;
  border-radius: 20px !important;
  background: var(--metal-surface-soft) !important;
  box-shadow: var(--metal-shadow) !important;
  backdrop-filter: none !important;
}
.um-topbar {
  margin-bottom: 16px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e1e6e9;
}
.um-view-tabs {
  gap: 7px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.um-view-tab {
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid #d8dee2;
  border-radius: 10px;
  background: #f7f8f9;
  color: #59656e;
  font-size: .72rem;
  font-weight: 600;
}
.um-view-tab:hover:not(.um-view-tab--on) { background: #eef2f4; }
.um-view-tab--on {
  border-color: #3f4d57;
  background: #3f4d57;
  box-shadow: 0 5px 12px rgba(45,56,64,.16);
}
.um-topbar-right { gap: 8px; }
.um-search-input,
.um-filter-select,
.um-print-btn {
  height: 42px;
  border: 1px solid #d8e0e5;
  border-radius: 10px;
  background: linear-gradient(145deg, #fff, #f0f3f4);
  color: #3f4d57;
  box-shadow: none;
}
.um-search-input:focus,
.um-filter-select:focus { border-color: #7c8994; box-shadow: 0 0 0 3px rgba(100,116,139,.1); }
.um-print-btn { padding: 0 14px; }
.um-add-btn,
.um-approve-all-btn,
.um-approve-selected-btn {
  min-height: 42px;
  border: 1px solid #3e4d58;
  border-radius: 11px;
  background: linear-gradient(145deg, #5c6771, #343e47);
  box-shadow: 0 7px 14px rgba(45,55,63,.18);
}
.um-add-btn:hover,
.um-approve-all-btn:hover,
.um-approve-selected-btn:hover { background: linear-gradient(145deg, #687580, #3d4852); }
.um-stats-row {
  gap: 12px;
  margin-bottom: 20px;
}
.um-stat-card {
  min-height: 86px;
  padding: 15px 16px;
  border: 1px solid #e0e6e9;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 7px 18px rgba(42,52,59,.07);
}
.um-stat-card:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(42,52,59,.1); }
.um-stat-card--selected { border-color: #7c8994; box-shadow: 0 0 0 2px rgba(100,116,139,.12), 0 8px 18px rgba(42,52,59,.08); }
.um-stat-icon { width: 42px; height: 42px; border-radius: 12px; }
.um-stat-val { font-size: 1.35rem; font-weight: 800; }
.um-stat-label { font-size: .7rem; font-weight: 650; }
.um-table-wrap {
  border: 1px solid #dce3e7;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(42,52,59,.08);
}
.um-table thead tr,
.um-table th { background: #f3f6f7; }
.um-table th { padding: 14px 17px; color: #78848c; font-size: .66rem; }
.um-table td { padding: 14px 17px; }
.um-row { background: #fff; }
.um-row:hover { background: #f7f9fa; }
.um-btn { min-height: 34px; border-radius: 9px; }

/* Compact table actions and clearer list proportions. */
.um-view-tabs { display: flex; align-items: center; gap: 7px; }
.um-view-tab { min-width: 112px; justify-content: center; }
.um-view-tab--on { color: #fff; }
.um-table { table-layout: fixed; }
.um-table th:nth-child(1),
.um-table td:nth-child(1) { width: 26px; }
.um-table th:nth-child(2),
.um-table td:nth-child(2) { width: 25%; }
.um-table th:nth-child(3),
.um-table td:nth-child(3) { width: 29%; }
.um-table th:nth-child(4),
.um-table td:nth-child(4) { width: 11%; }
.um-table th:nth-child(5),
.um-table td:nth-child(5) { width: 12%; }
.um-table th:nth-child(6),
.um-table td:nth-child(6) { width: 10%; }
.um-table th:nth-child(7),
.um-table td:nth-child(7) { width: 88px; }
.um-user-info { min-width: 0; }
.um-table th:nth-child(2),
.um-table td:nth-child(2) { padding-left: 10px; }
.um-user-cell { gap: 7px; }
.um-table th,
.um-table td { padding-top: 10px; padding-bottom: 10px; }
.um-table th:nth-child(2),
.um-table td:nth-child(2) { padding-right: 10px; }
.um-table th:nth-child(3),
.um-table td:nth-child(3) { padding-left: 10px; padding-right: 10px; }
.um-user-avatar { width: 36px; height: 36px; }
.um-user-name,
.um-user-dept,
.um-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; }
.um-actions { width: 64px; }
.um-actions-row { display: flex; justify-content: flex-end; gap: 4px; }
.um-actions .um-btn {
  width: 30px !important;
  height: 30px;
  min-height: 30px;
  padding: 0;
  font-size: 0;
  flex: 0 0 34px;
}
.um-actions .um-btn svg { width: 14px; height: 14px; flex: 0 0 auto; }
.um-actions .um-btn:hover { transform: translateY(-1px); }

@media (max-width: 900px) {
  .main { padding: 24px 18px 32px; }
  .um-management-panel { padding: 17px 20px 20px; }
}

/* ── Flat Users page finish ─────────────────────────────────────────── */
.page-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1;
}
.page-title-kicker {
  color: #68747d;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.page-title-main {
  color: #202830;
  font-size: clamp(2rem, 3vw, 2.55rem);
  font-weight: 700;
  letter-spacing: -.04em;
}
.um-management-panel {
  background: #f3f5f6 !important;
  border-color: #d5dde1 !important;
  box-shadow: 0 10px 26px rgba(42,52,59,.08) !important;
}
.um-view-tabs { background: transparent; box-shadow: none; }
.um-view-tab--on,
.um-add-btn,
.um-approve-all-btn,
.um-approve-selected-btn {
  background: #44515d;
  box-shadow: none;
}
.um-view-tab--on:hover,
.um-add-btn:hover,
.um-approve-all-btn:hover,
.um-approve-selected-btn:hover { background: #35424d; }
.um-search-input,
.um-filter-select,
.um-print-btn { background: #fff; box-shadow: none; }
.um-stats-row { gap: 12px; }
.um-stats-row { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
.um-stat-card {
  background: #fff;
  border-color: #dbe3e7;
  box-shadow: 0 5px 14px rgba(42,52,59,.06);
}
.um-stat-card:hover { box-shadow: 0 8px 18px rgba(42,52,59,.08); }
.um-table-wrap {
  border-color: #d5dde1;
  background: #fff;
  box-shadow: 0 7px 18px rgba(42,52,59,.07);
}
.um-table thead tr,
.um-table th { background: #edf1f2; }
.um-row { background: #fff; }
.um-user-avatar { box-shadow: none; }
.um-stat-icon--admin-teacher { background: #e6eef2; color: #4a6875; }
.um-stat-card .um-stat-label { line-height: 1.2; }
.um-stat-card { gap: 9px; padding: 13px 10px; }
.um-stat-icon { width: 36px; height: 36px; border-radius: 10px; }
.um-stat-val { font-size: 1.2rem; }
.um-stat-label { font-size: .6rem; white-space: nowrap; }

@media (max-width: 1280px) {
  .um-stats-row { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
  .um-stats-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .um-stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.um-modal-box--wide {
  border-color: #d5dde1;
  border-radius: 18px;
  background: #f7f9fa;
  box-shadow: 0 18px 42px rgba(34,45,54,.22);
}
.um-modal-banner {
  min-height: 88px;
  padding: 18px 28px;
  border-radius: 18px 18px 0 0;
  border-bottom: 1px solid #d7dfe3;
  background: linear-gradient(145deg, #f8fafb, #e4e8ea);
}
.um-modal-banner-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #dfe5e8;
}
.um-modal-banner-icon svg { stroke: #3f4d57; }
.um-modal-banner-title { color: #202830; font-size: 1.25rem; font-weight: 700; }
.um-modal-banner-sub { color: #68747d; font-size: .82rem; }
.um-modal-close {
  border-color: #cbd5da;
  border-radius: 9px;
  background: #fff;
  color: #3f4d57;
}
.um-modal-box--wide .um-form {
  padding: 20px 30px 0;
  gap: 13px;
  background: #f7f9fa;
}
.reg-avatar-row {
  padding: 12px 16px;
  border-color: #d3dde2;
  border-radius: 13px;
  background: #fff;
}
.reg-section-line { background: #d6dfe3; }
.form-input { background: #fff; box-shadow: none; }
.form-input:focus { box-shadow: 0 0 0 3px rgba(100,116,139,.1); }
.form-actions {
  margin: 0 -30px;
  padding: 14px 30px 18px;
  border-top-color: #dce3e7;
  background: #f7f9fa;
  box-shadow: none;
}
.um-cancel-btn,
.um-submit-btn { min-height: 40px; border-radius: 10px; }
.um-submit-btn { background: #44515d; box-shadow: none; }
.um-submit-btn:hover { background: #35424d; }

@media (max-width: 640px) {
  .page-title-main { font-size: 2.15rem; }
}

/* ── Confirmation popup final theme ─────────────────────────────────── */
.swal-box {
  width: min(420px, calc(100vw - 40px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 28px 22px;
  border: 1px solid #d5dde1;
  border-radius: 18px;
  background: #f7f9fa;
  box-shadow: 0 18px 42px rgba(34,45,54,.22);
}
.swal-icon {
  width: 60px;
  height: 60px;
  flex-basis: 60px;
  border: 1px solid #dfcfaa;
  border-radius: 16px;
  background: #f8f3e7;
  color: #765f2e;
}
.swal-icon svg { width: 28px; height: 28px; }
.swal-text {
  flex: none;
  max-width: 290px;
  margin: 0;
  color: #202830;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}
.swal-actions { gap: 8px; margin-top: 2px; }
.swal-cancel,
.swal-continue {
  min-height: 38px;
  border-radius: 10px;
  font-size: .8rem;
}
.swal-cancel {
  min-width: 82px;
  padding: 8px 16px;
  border: 1px solid #d6dfe3;
  background: #fff;
  color: #59656e;
}
.swal-continue {
  min-width: 108px;
  padding: 8px 16px;
  border: 1px solid #3e4d58;
  background: #44515d;
  box-shadow: 0 5px 10px rgba(45,55,63,.14);
}
.swal-cancel:hover { background: #eef2f4; }
.swal-continue:hover { background: #35424d; }
</style>
