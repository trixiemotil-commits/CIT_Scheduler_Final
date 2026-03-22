<template>
  <div class="layout">
    <!-- ═══════════════════ SIDEBAR ═══════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-profile">
        <div class="avatar-wrap" style="cursor:pointer" @click="router.push('/admin/profile')">
          <img src="https://i.pravatar.cc/100?img=15" alt="Admin" class="avatar" />
        </div>
        <div class="brand">CIT Scheduler</div>
        <div class="role">Admin Portal</div>
        <div class="email">admin@gmail.com</div>
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
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="page-title">Manage Users</h1>
          <p class="page-sub">Add, edit, and manage system user accounts</p>
        </div>
      </header>

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
            @click="approveAllPending"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/><path d="M22 10l-7 7"/></svg>
            {{ isBulkApproving ? 'Approving...' : `Approve All (${pendingCount})` }}
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
            <option value="Student">Student</option>
          </select>
          <button v-if="activeView === 'active'" class="um-add-btn" @click="openAddUser">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="um-stats-row">
        <div class="um-stat-card">
          <div class="um-stat-icon um-stat-icon--total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.length }}</div>
            <div class="um-stat-label">Total Users</div>
          </div>
        </div>
        <div class="um-stat-card">
          <div class="um-stat-icon um-stat-icon--admin">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => u.role === 'Admin').length }}</div>
            <div class="um-stat-label">Admins</div>
          </div>
        </div>
        <div class="um-stat-card">
          <div class="um-stat-icon um-stat-icon--teacher">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => u.role === 'Teacher').length }}</div>
            <div class="um-stat-label">Teachers</div>
          </div>
        </div>
        <div class="um-stat-card">
          <div class="um-stat-icon um-stat-icon--active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="um-stat-info">
            <div class="um-stat-val">{{ users.filter(u => u.status === 'Active').length }}</div>
            <div class="um-stat-label">Active</div>
          </div>
        </div>
        <div class="um-stat-card um-stat-card--clickable" @click="activeView = 'archived'">
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
      <div class="um-table-wrap">
        <table class="um-table">
          <thead>
            <tr>
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
              <td colspan="6">
                <div class="um-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Loading users...</span>
                </div>
              </td>
            </tr>
            <template v-else>
            <tr v-for="user in filteredUsers" :key="user.id" class="um-row">
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
              <td colspan="6">
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
              <input v-model="userForm.schoolId" class="form-input" type="text" placeholder="01-1234-123456" required />
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
            <button type="button" class="um-cancel-btn" @click="showUserModal = false">Cancel</button>
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
        <div class="um-delete-icon" style="background:#e8f5ee;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1b7a4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
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
        <p class="swal-text">Are you sure you want to continue?</p>
        <div class="swal-actions">
          <button class="swal-cancel" @click="showRegisterConfirm = false">Cancel</button>
          <button class="swal-continue" @click="confirmSaveUser">Continue</button>
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
import { getToken, logout } from '@/auth.js'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const router = useRouter()
const route  = useRoute()
const currentRoute = computed(() => route.path)

/* ── Nav ── */
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

/* ── Users Data ── */
const users = ref([])
const isLoadingUsers = ref(false)
const loadError = ref('')
const isBulkApproving = ref(false)
const PHINMA_EMAIL_REGEX = /^[a-z0-9._%+-]+\.au@phinmaed\.com$/i

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
    const matchRole = roleFilter.value === '' || u.role === roleFilter.value
    return matchView && matchSearch && matchRole
  })
})

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
    department: user.department || '',
    status: user.status || 'Active',
    dateAdded: formatDisplayDate(user.dateAdded || user.createdAt),
    avatar: user.avatar || fallbackAvatar(name),
    schoolId: user.studentId || user.employeeId || '',
    phone: user.phone || '',
    studentId: user.studentId || '',
    employeeId: user.employeeId || '',
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

async function fetchUsers() {
  isLoadingUsers.value = true
  loadError.value = ''
  try {
    const payload = await apiRequest('/users')
    const list = Array.isArray(payload.users) ? payload.users : []
    users.value = list.map(mapUserForUi)
  } catch (error) {
    loadError.value = error.message || 'Failed to load users.'
  } finally {
    isLoadingUsers.value = false
  }
}

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildUserPayload(includePassword) {
  const schoolId = trimValue(userForm.value.schoolId)
  const payload = {
    firstName: trimValue(userForm.value.firstName),
    lastName: trimValue(userForm.value.lastName),
    email: trimValue(userForm.value.email),
    role: userForm.value.role,
    status: editingUser.value ? (userForm.value.status || 'Active') : 'Active',
  }

  if (schoolId) {
    if (userForm.value.role === 'Student') {
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

onMounted(fetchUsers)

/* ── Add / Edit User ── */
const showUserModal   = ref(false)
const editingUser     = ref(null)
const formError       = ref('')
const showRegisterConfirm = ref(false)
const isSavingUser    = ref(false)
const emptyForm = () => ({ firstName: '', lastName: '', email: '', schoolId: '', role: '', status: 'Active', password: '', confirmPassword: '' })
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
    schoolId:   user.schoolId || '',
    role:       user.role,
    status:     user.status,
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

async function confirmSaveUser() {
  formError.value = ''
  showRegisterConfirm.value = false
  isSavingUser.value = true

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
  border: 3px solid #c8ddd4;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }
.brand  { font-size: 1.05rem; font-weight: 600; color: #1b4332; }
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
.nav-item:hover  { background: #f0faf3; color: #1b4332; }
.nav-item.active { background: #1b4332; color: #fff; }
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
  color: #1b4332;
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
  background: #14532d;
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
.um-approve-all-btn:hover { background: #166534; }
.um-approve-all-btn[disabled] {
  opacity: 0.65;
  cursor: not-allowed;
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
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45,106,79,0.09);
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
.um-filter-select:focus { border-color: #2d6a4f; }
.um-add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #1b4332;
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
.um-add-btn:hover { background: #2d6a4f; }

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
.um-stat-icon--total   { background: #e8f5ee; color: #1b7a4a; }
.um-stat-icon--admin   { background: #e8eefe; color: #2563eb; }
.um-stat-icon--archived { background: #f3f4f6; color: #6b7280; }
.um-stat-card--clickable { cursor: pointer; transition: box-shadow 0.18s, transform 0.15s; }
.um-stat-card--clickable:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.12); transform: translateY(-2px); }
.um-stat-icon--teacher { background: #fef3c7; color: #b45309; }
.um-stat-icon--active  { background: #d8f3e8; color: #1b7a4a; }
.um-stat-val   { font-size: 1.6rem; font-weight: 800; color: #111; line-height: 1; }
.um-stat-label { font-size: 0.78rem; color: #888; font-weight: 500; margin-top: 3px; }

/* ── Table ── */
.um-table-wrap {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  overflow: hidden;
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
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 20px;
}
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
.um-status--active   { background: #d8f3e8; color: #1b7a4a; }
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
.um-btn--approve { background: #dcfce7; color: #166534; }
.um-btn--approve:hover { background: #bbf7d0; }
.um-btn--deny  { background: #fee2e2; color: #b91c1c; }
.um-btn--deny:hover { background: #fecaca; }
.um-btn--archive { background: #fff7ed; color: #b45309; }
.um-btn--archive:hover { background: #fde68a; }
.um-btn--restore { background: #e8f5ee; color: #1b7a4a; }
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
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
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
  border-color: #2d6a4f;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(45,106,79,0.09);
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
  background: #f7faf8;
  border: 1.5px dashed #c8ddd4;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 4px;
}
.reg-avatar-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e8f0ec;
  border: 2px solid #c8ddd4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.reg-avatar-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1b4332;
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
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 10px 26px;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.18s, box-shadow 0.18s;
  box-shadow: 0 4px 14px rgba(27,67,50,0.25);
}
.um-submit-btn:hover { opacity: 0.9; box-shadow: 0 6px 18px rgba(27,67,50,0.32); }

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
  color: #2d6a4f;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.um-reset-confirm-btn {
  background: #1b4332;
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
.um-reset-confirm-btn:hover { background: #2d6a4f; }
.um-restore-confirm-btn {
  background: #1b4332;
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
.um-restore-confirm-btn:hover { background: #2d6a4f; }

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
.um-view-tab:hover { border-color: #2d6a4f; color: #2d6a4f; }
.um-view-tab--on {
  background: #1b4332;
  border-color: #1b4332;
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
  background: #1b4332;
  color: #fff;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  padding: 11px 36px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
  box-shadow: 0 4px 14px rgba(27,67,50,0.22);
}
.swal-continue:hover { background: #2d6a4f; }

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
  background: #1b4332;
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
.logout-confirm-btn:hover { background: #2d6a4f; }

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
</style>
