<template>
  <div class="page admin-page">
    <div class="page-header">
      <h1 class="page-title">Admin Dashboard</h1>
    </div>

    <div v-if="systemStats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">{{ systemStats.total_users || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Tracks</div>
          <div class="stat-value">{{ systemStats.total_audio_files || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 12h6"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Collections</div>
          <div class="stat-value">{{ systemStats.total_collections || 0 }}</div>
        </div>
      </div>
    </div>

    <div class="admin-actions-section">
      <div class="action-card">
        <div class="action-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </div>
        <div class="action-content">
          <h3>Process Pending Deletions</h3>
          <p>Manual trigger of proccessing account for deletion schedule. (Normally done automatically)</p>
        </div>
        <button
          @click="processPendingDeletions"
          class="btn btn-warning"
          :disabled="processingDeletions"
        >
          {{ processingDeletions ? 'Processing...' : 'Process Now' }}
        </button>
      </div>
      <div v-if="deletionProcessResult" class="process-result" :class="deletionProcessResult.type">
        <svg v-if="deletionProcessResult.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <svg v-else="" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="8"/>
        </svg>
        <span>{{ deletionProcessResult.message }}</span>
      </div>
    </div>

    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'users'" class="admin-section">
      <div class="section-header">
        <h2>User Management</h2>
        <button @click="loadUsers" class="refresh-button" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      <div class="search-filter-bar">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="userSearch"
            type="text"
            placeholder="Search users by username or email..."
            class="search-input"
          />
        </div>
        <div class="filter-options">
          <select v-model="userFilter" class="filter-select">
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="admin">Admins</option>
          </select>
          <select v-model="userSort" class="filter-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="username">Username A-Z</option>
            <option value="uploads">Most Uploads</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div v-else-if="filteredUsers.length > 0" class="users-table">
        <div class="table-header">
          <div class="col-id">ID</div>
          <div class="col-username">Username</div>
          <div class="col-email">Email</div>
          <div class="col-role">Role</div>
          <div class="col-status">Status</div>
          <div class="col-uploads">Uploads</div>
          <div class="col-actions">Actions</div>
        </div>
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="table-row"
        >
          <div class="col-id">{{ user.id }}</div>
          <div class="col-username" v-html="highlightText(user.username, userSearch)"></div>
          <div class="col-email" v-html="highlightText(user.email, userSearch)"></div>
          <div class="col-role">
            <span :class="['role-badge', { superuser: user.is_superuser }]">
              {{ user.is_superuser ? 'Admin' : 'User' }}
            </span>
          </div>
          <div class="col-status">
            <span :class="['status-badge', user.is_active ? 'active' : 'inactive']">
              {{ user.is_active ? 'Active' : 'Disabled' }}
            </span>
          </div>
          <div class="col-uploads">
            {{ user.total_audio_files || 0 }} / {{ user.max_audio_uploads || 100 }}
          </div>
          <div class="col-actions">
            <button @click="viewUserDetails(user)" class="icon-button" title="View Details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button @click="editUserLimit(user)" class="icon-button" title="Edit Upload Limit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              v-if="user.is_active"
              @click="confirmDisableUser(user)"
              class="icon-button warning"
              title="Disable User"
              :disabled="actionInProgress"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m4.93 4.93 14.14 14.14"/>
              </svg>
            </button>
            <button
              v-else
              @click="confirmEnableUser(user)"
              class="icon-button success"
              title="Reactivate User"
              :disabled="actionInProgress"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'collections'" class="admin-section">
      <div class="section-header">
        <h2>Collection Management</h2>
        <button @click="loadCollections" class="refresh-button" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      <div class="search-filter-bar">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="collectionSearch"
            type="text"
            placeholder="Search collections by title or owner..."
            class="search-input"
          />
        </div>
        <div class="filter-options">
          <select v-model="collectionFilter" class="filter-select">
            <option value="all">All Types</option>
            <option value="album">Albums</option>
            <option value="playlist">Playlists</option>
            <option value="compilation">Compilations</option>
          </select>
          <select v-model="collectionSort" class="filter-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="tracks">Most Tracks</option>
          </select>
        </div>
      </div>

      <div v-if="collectionsError" class="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <span>{{ collectionsError }}</span>
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div v-else-if="filteredCollections.length > 0" class="collections-list">
        <h3>Collections ({{ filteredCollections.length }})</h3>
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          class="collection-item"
        >
          <img
            :src="collection.cover_url || collection.cover_art_url || defaultAlbumCover"
            :alt="collection.title"
            class="collection-cover"
            @error="handleImageError"
          />
          <div class="collection-info">
            <div class="collection-title" v-html="highlightText(collection.title, collectionSearch)"></div>
            <div class="collection-meta">
              <span v-html="formatCollectionType(collection.collection_type)"></span> • <span v-html="highlightText(getOwnerName(collection), collectionSearch)"></span>
              <span v-if="collection.track_count || collection.tracks_count || collection.total_tracks">
                • {{ collection.track_count || collection.tracks_count || collection.total_tracks || 0 }} tracks
              </span>
            </div>
          </div>
          <div class="collection-actions">
            <button @click="viewCollection(collection)" class="icon-button" title="View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button @click="confirmDeleteCollection(collection)" class="icon-button danger" title="Delete Collection" :disabled="actionInProgress">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && !collectionsError && recentCollections.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 12h6"/>
        </svg>
        <p>No collections found</p>
      </div>
    </div>

    <div v-if="activeTab === 'audio'" class="admin-section">
      <div class="section-header">
        <h2>Audio Files</h2>
        <button @click="loadAudioFiles" class="refresh-button" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      <div class="search-filter-bar">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="audioSearch"
            type="text"
            placeholder="Search audio by title or owner..."
            class="search-input"
          />
        </div>
        <div class="filter-options">
          <select v-model="audioSort" class="filter-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="size">Largest First</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div v-else-if="filteredAudioFiles.length > 0" class="audio-files-list">
        <div class="audio-files-header">
          <span>{{ filteredAudioFiles.length }} file(s)</span>
        </div>
        <div
          v-for="file in paginatedAudioFiles"
          :key="file.id"
          class="audio-file-item"
        >
          <img
            :src="file.cover_url || file.cover_art_url || defaultTrackCover"
            :alt="file.title || file.original_filename"
            class="audio-cover"
            @error="handleImageError"
          />
          <div class="audio-info">
            <div class="audio-title" v-html="highlightText(file.title || file.original_filename || 'Untitled', audioSearch)"></div>
            <div class="audio-meta">
              {{ formatBytes(file.file_size || 0) }}
            </div>
          </div>
          <div class="audio-owner" v-html="highlightText(getOwnerName(file), audioSearch)">
          </div>
          <div class="audio-actions">
            <button @click="confirmDeleteAudioFile(file)" class="icon-button danger" title="Delete Audio File" :disabled="actionInProgress">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <div v-if="filteredAudioFiles.length > audioPageSize" class="pagination-controls">
          <button @click="audioPage = Math.max(1, audioPage - 1)" :disabled="audioPage === 1" class="btn btn-secondary btn-sm">
            Previous
          </button>
          <span class="page-info">Page {{ audioPage }} of {{ totalAudioPages }}</span>
          <button @click="audioPage = Math.min(totalAudioPages, audioPage + 1)" :disabled="audioPage >= totalAudioPages" class="btn btn-secondary btn-sm">
            Next
          </button>
        </div>
      </div>

      <div v-else-if="!loading && filteredAudioFiles.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <p>{{ audioSearch ? 'No audio files match your search' : 'No audio files found' }}</p>
      </div>
    </div>

    <div v-if="activeTab === 'announcements'" class="admin-section">
      <div class="section-header">
        <h2>Announcements</h2>
        <div class="header-actions">
          <button @click="loadAnnouncements" class="refresh-button" :disabled="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>
          <button @click="startCreateAnnouncement" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create Announcement
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div v-else-if="announcements.length > 0" class="announcements-list">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item"
        >
          <div class="announcement-header">
            <h3>{{ announcement.title }}</h3>
            <div class="announcement-badge" :class="announcement.is_published ? 'published' : 'draft'">
              {{ announcement.is_published ? 'Published' : 'Draft' }}
            </div>
          </div>
          <div class="announcement-content markdown-content" v-html="renderMarkdown(announcement.content)"></div>
          <div class="announcement-meta">
            Created: {{ formatDate(announcement.created_at) }}
            <span v-if="announcement.updated_at"> • Updated: {{ formatDate(announcement.updated_at) }}</span>
          </div>
          <div class="announcement-actions">
            <button @click="startEditAnnouncement(announcement)" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button @click="deleteAnnouncementById(announcement.id)" class="btn btn-danger btn-sm" :disabled="actionInProgress">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && announcements.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
        </svg>
        <p>No announcements yet</p>
        <button @click="startCreateAnnouncement" class="btn btn-primary" style="margin-top: 16px;">
          Create First Announcement
        </button>
      </div>
    </div>

    <div v-if="isCreatingAnnouncement" class="modal-overlay" @click.self="cancelAnnouncementForm">
      <div class="edit-modal announcement-modal">
        <div class="modal-header">
          <h2>{{ editingAnnouncement ? 'Edit Announcement' : 'Create Announcement' }}</h2>
          <button @click="cancelAnnouncementForm" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>Title *</label>
            <input
              v-model="announcementForm.title"
              type="text"
              class="form-input"
              placeholder="Enter announcement title"
            />
          </div>
          <div class="form-group">
            <label>Content * <span class="label-hint">(Markdown supported)</span></label>
            <div class="content-editor">
              <div class="editor-tabs">
                <button
                  type="button"
                  :class="['editor-tab', { active: !showPreview }]"
                  @click="showPreview = false"
                >
                  Write
                </button>
                <button
                  type="button"
                  :class="['editor-tab', { active: showPreview }]"
                  @click="showPreview = true"
                >
                  Preview
                </button>
              </div>
              <textarea
                v-show="!showPreview"
                v-model="announcementForm.content"
                class="form-textarea"
                rows="8"
                placeholder="Enter announcement content. You can use **bold**, *italic*, # headers, - lists, [links](url), etc."
              ></textarea>
              <div
                v-show="showPreview"
                class="markdown-preview"
                v-html="renderMarkdown(announcementForm.content) || '<p class=\'preview-placeholder\'>Nothing to preview</p>'"
              ></div>
            </div>
            <div class="markdown-help">
              <span>**bold**</span>
              <span>*italic*</span>
              <span># heading</span>
              <span>- list</span>
              <span>[link](url)</span>
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="announcementForm.is_published"
                type="checkbox"
                class="form-checkbox"
              />
              <span>Publish immediately</span>
            </label>
          </div>
          <div class="modal-actions">
            <button @click="saveAnnouncement" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create') }}
            </button>
            <button @click="cancelAnnouncementForm" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedUser" class="modal-overlay" @click.self="selectedUser = null">
      <div class="user-detail-modal">
        <div class="modal-header">
          <h2>User Details: {{ selectedUser.username }}</h2>
          <button @click="selectedUser = null" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="user-profile-section">
            <img
              :src="selectedUser.profile_picture_url || getDefaultProfilePicture()"
              :alt="selectedUser.username"
              class="user-profile-picture"
              @error="handleProfilePictureError"
            />
            <div class="user-profile-info">
              <div class="user-profile-name">{{ selectedUser.username }}</div>
              <div class="user-profile-email">{{ selectedUser.email }}</div>
              <span :class="['status-badge', selectedUser.is_active ? 'active' : 'inactive']">
                {{ selectedUser.is_active ? 'Active' : 'Disabled' }}
              </span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Account Information</h3>
            <div class="detail-row">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">{{ selectedUser.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">{{ selectedUser.is_superuser ? 'Admin' : 'User' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Upload Limit:</span>
              <span class="detail-value">{{ selectedUser.max_audio_uploads || 100 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Uploads:</span>
              <span class="detail-value">{{ userStats.total_audio_files || userStats.used_uploads || 0 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(selectedUser.created_at) }}</span>
            </div>
          </div>

          <div v-if="userStats" class="detail-section">
            <h3>Statistics</h3>
            <div class="detail-row">
              <span class="detail-label">Total Audio Files:</span>
              <span class="detail-value">{{ userStats.total_audio_files || userStats.used_uploads || 0 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Collections:</span>
              <span class="detail-value">{{ userCollectionStats?.total_collections || userStats.total_collections || 0 }}</span>
            </div>
            <div v-if="userCollectionStats" class="detail-row">
              <span class="detail-label">Albums:</span>
              <span class="detail-value">{{ userCollectionStats.albums || 0 }}</span>
            </div>
            <div v-if="userCollectionStats" class="detail-row">
              <span class="detail-label">Playlists:</span>
              <span class="detail-value">{{ userCollectionStats.playlists || 0 }}</span>
            </div>
            <div v-if="userCollectionStats" class="detail-row">
              <span class="detail-label">Compilations:</span>
              <span class="detail-value">{{ userCollectionStats.compilations || 0 }}</span>
            </div>
          </div>
          <div v-else class="loading-stats">
            <div class="spinner-small"></div>
            <span>Loading statistics...</span>
          </div>

          <div class="modal-actions">
            <button
              v-if="selectedUser.is_active"
              @click="confirmDisableUser(selectedUser)"
              class="warning-button"
              :disabled="actionInProgress"
            >
              Disable User
            </button>
            <button
              v-else
              @click="confirmEnableUser(selectedUser)"
              class="primary-button"
              :disabled="actionInProgress"
            >
              Enable User
            </button>
            <button @click="confirmResetUploads(selectedUser)" class="danger-button" :disabled="actionInProgress">
              Reset Uploads
            </button>
            <button @click="confirmDeleteCollections(selectedUser)" class="danger-button" :disabled="actionInProgress">
              Delete All Collections
            </button>
            <button @click="confirmDeleteAudioFiles(selectedUser)" class="danger-button" :disabled="actionInProgress">
              Delete All Audio Files
            </button>
            <button @click="confirmDeleteUser(selectedUser)" class="danger-button" :disabled="actionInProgress" style="margin-top: 12px; width: 100%;">
              Permanently Delete User
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editingUser" class="modal-overlay" @click.self="editingUser = null">
      <div class="edit-modal">
        <div class="modal-header">
          <h2>Edit Upload Limit: {{ editingUser.username }}</h2>
          <button @click="editingUser = null" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>Max Audio Uploads</label>
            <input
              v-model.number="newUploadLimit"
              type="number"
              min="0"
              class="form-input"
            />
          </div>
          <div class="modal-actions">
            <button @click="saveUploadLimit" class="primary-button" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
            <button @click="editingUser = null" class="secondary-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import defaultAlbumCoverSvg from '@/assets/images/defaults/default_album_cover.svg'
import defaultTrackCoverSvg from '@/assets/images/defaults/default_track_cover.svg'
import defaultProfilePictureSvg from '@/assets/images/defaults/default_profile_picture.svg'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true
})

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch (err) {
    console.error('Markdown parsing error:', err)
    return text.replace(/\n/g, '<br>')
  }
}

const router = useRouter()
const uiStore = useUIStore()

const activeTab = ref('users')
const loading = ref(false)
const saving = ref(false)
const actionInProgress = ref(false)
const systemStats = ref(null)
const users = ref([])
const selectedUser = ref(null)
const editingUser = ref(null)
const newUploadLimit = ref(0)
const processingDeletions = ref(false)
const deletionProcessResult = ref(null)
const userStats = ref(null)
const userCollectionStats = ref(null)
const collectionStats = ref(null)
const recentCollections = ref([])
const audioFiles = ref([])
const collectionsError = ref(null)
const announcements = ref([])
const editingAnnouncement = ref(null)
const isCreatingAnnouncement = ref(false)
const showPreview = ref(false)
const announcementForm = ref({
  title: '',
  content: '',
  is_published: true
})

//search, filter & sort state
const userSearch = ref('')
const userFilter = ref('all')
const userSort = ref('newest')

const collectionSearch = ref('')
const collectionFilter = ref('all')
const collectionSort = ref('newest')

const audioSearch = ref('')
const audioSort = ref('newest')
const audioPage = ref(1)
const audioPageSize = 50

const defaultAlbumCover = defaultAlbumCoverSvg
const defaultTrackCover = defaultTrackCoverSvg

const filteredUsers = computed(() => {
  let result = [...users.value]

  //apply search filter
  if (userSearch.value) {
    const search = userSearch.value.toLowerCase()
    result = result.filter(user =>
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    )
  }

  //apply status/role filter
  switch (userFilter.value) {
    case 'active':
      result = result.filter(user => user.is_active)
      break
    case 'inactive':
      result = result.filter(user => !user.is_active)
      break
    case 'admin':
      result = result.filter(user => user.is_superuser)
      break
  }

  //apply sorting
  switch (userSort.value) {
    case 'newest':
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      break
    case 'username':
      result.sort((a, b) => (a.username || '').localeCompare(b.username || ''))
      break
    case 'uploads':
      result.sort((a, b) => (b.total_audio_files || 0) - (a.total_audio_files || 0))
      break
  }

  return result
})

const filteredCollections = computed(() => {
  let result = [...recentCollections.value]

  //apply search filter
  if (collectionSearch.value) {
    const search = collectionSearch.value.toLowerCase()
    result = result.filter(collection =>
      collection.title?.toLowerCase().includes(search) ||
      getOwnerName(collection).toLowerCase().includes(search)
    )
  }

  //apply type filter
  if (collectionFilter.value !== 'all') {
    result = result.filter(collection => collection.collection_type === collectionFilter.value)
  }

  //apply sorting
  switch (collectionSort.value) {
    case 'newest':
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      break
    case 'title':
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case 'tracks':
      result.sort((a, b) =>
        (b.track_count || b.tracks_count || b.total_tracks || 0) -
        (a.track_count || a.tracks_count || a.total_tracks || 0)
      )
      break
  }

  return result
})

const filteredAudioFiles = computed(() => {
  let result = [...audioFiles.value]

  //apply search filter
  if (audioSearch.value) {
    const search = audioSearch.value.toLowerCase()
    result = result.filter(file =>
      file.title?.toLowerCase().includes(search) ||
      file.original_filename?.toLowerCase().includes(search) ||
      getOwnerName(file).toLowerCase().includes(search)
    )
  }

  //apply sorting
  switch (audioSort.value) {
    case 'newest':
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      break
    case 'title':
      result.sort((a, b) => (a.title || a.original_filename || '').localeCompare(b.title || b.original_filename || ''))
      break
    case 'size':
      result.sort((a, b) => (b.file_size || 0) - (a.file_size || 0))
      break
  }

  return result
})

const totalAudioPages = computed(() => Math.ceil(filteredAudioFiles.value.length / audioPageSize))

const paginatedAudioFiles = computed(() => {
  const start = (audioPage.value - 1) * audioPageSize
  return filteredAudioFiles.value.slice(start, start + audioPageSize)
})

const tabs = [
  { id: 'users', label: 'Users' },
  { id: 'collections', label: 'Collections' },
  { id: 'audio', label: 'Audio Files' },
  { id: 'announcements', label: 'Announcements' }
]

onMounted(async () => {
  await loadSystemStats()
  await loadUsers()
})

watch(activeTab, async (newTab) => {
  if (newTab === 'collections' && recentCollections.value.length === 0) {
    await loadCollections()
  } else if (newTab === 'audio' && audioFiles.value.length === 0) {
    await loadAudioFiles()
  } else if (newTab === 'announcements' && announcements.value.length === 0) {
    await loadAnnouncements()
  }
})

//reset audio page when search or sort changes
watch([audioSearch, audioSort], () => {
  audioPage.value = 1
})

async function loadSystemStats() {
  try {
    const response = await api.getSystemStats()
    systemStats.value = response.data
  } catch (err) {
    console.error('Failed to load system stats:', err)
    uiStore.showNotification('Failed to load system statistics', 'error')
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const response = await api.getAllUsers()
    users.value = response.data
    console.log('Loaded users with upload data:', users.value.map(u => ({
      username: u.username,
      total_audio_files: u.total_audio_files,
      max_audio_uploads: u.max_audio_uploads
    })))
  } catch (err) {
    console.error('Failed to load users:', err)
    uiStore.showNotification('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

async function processPendingDeletions() {
  processingDeletions.value = true
  deletionProcessResult.value = null

  try {
    const response = await api.processPendingDeletions()
    const processedCount = response.data.processed_count || 0

    deletionProcessResult.value = {
      type: 'success',
      message: `Processed ${processedCount} pending deletion${processedCount !== 1 ? 's' : ''}`
    }

    await loadUsers()
  } catch (err) {
    console.error('Failed to process pending deletions:', err)
    deletionProcessResult.value = {
      type: 'error',
      message: err.response?.data?.detail || 'Failed to process pending deletions'
    }
  } finally {
    processingDeletions.value = false

    setTimeout(() => {
      deletionProcessResult.value = null
    }, 5000)
  }
}

async function loadCollections() {
  loading.value = true
  collectionsError.value = null

  try {
    const statsRes = await api.getCollectionStats()
    collectionStats.value = statsRes.data
  } catch (err) {
    console.error('Failed to load collection stats:', err)
    collectionsError.value = 'Failed to load collection statistics'
  }

  try {
    const recentRes = await api.getRecentCollections()
    if (Array.isArray(recentRes.data)) {
      recentCollections.value = recentRes.data
    } else if (recentRes.data && Array.isArray(recentRes.data.collections)) {
      recentCollections.value = recentRes.data.collections
    } else if (recentRes.data && Array.isArray(recentRes.data.items)) {
      recentCollections.value = recentRes.data.items
    } else {
      recentCollections.value = []
    }

    if (recentCollections.value.length === 0 && collectionStats.value?.total_collections > 0) {
      try {
        const allRes = await api.getAllCollections()
        console.log('All collections API response:', allRes.data)
        if (Array.isArray(allRes.data)) {
          recentCollections.value = allRes.data
        } else if (allRes.data && Array.isArray(allRes.data.collections)) {
          recentCollections.value = allRes.data.collections
        }
      } catch (fallbackErr) {
        console.error('Fallback getAllCollections also failed:', fallbackErr)
      }
    }
  } catch (err) {
    console.error('Failed to load recent collections:', err)
    if (err.response?.status === 500) {
      collectionsError.value = 'Unable to load recent collections (backend serialization issue). Collection statistics are still available.'
      uiStore.showNotification('Recent collections unavailable due to backend issue', 'warning')
    } else {
      collectionsError.value = 'Failed to load recent collections'
      uiStore.showNotification('Failed to load recent collections', 'error')
    }
    recentCollections.value = []
  } finally {
    loading.value = false
  }
}

async function loadAudioFiles() {
  loading.value = true
  try {
    const response = await api.getAllAudioFiles()
    audioFiles.value = response.data
  } catch (err) {
    console.error('Failed to load audio files:', err)
    uiStore.showNotification('Failed to load audio files', 'error')
  } finally {
    loading.value = false
  }
}

async function loadAnnouncements() {
  loading.value = true
  try {
    const response = await api.getAllAnnouncements(0, 100, false)
    let announcementsData = response.data

    if (announcementsData && typeof announcementsData === 'object') {
      if (announcementsData.announcements) {
        announcementsData = announcementsData.announcements
      }
    }

    announcements.value = Array.isArray(announcementsData) ? announcementsData : []
  } catch (err) {
    console.error('Failed to load announcements:', err)
    uiStore.showNotification('Failed to load announcements', 'error')
    announcements.value = []
  } finally {
    loading.value = false
  }
}

function startCreateAnnouncement() {
  isCreatingAnnouncement.value = true
  editingAnnouncement.value = null
  announcementForm.value = {
    title: '',
    content: '',
    is_published: true
  }
}

function startEditAnnouncement(announcement) {
  editingAnnouncement.value = announcement
  isCreatingAnnouncement.value = true
  announcementForm.value = {
    title: announcement.title,
    content: announcement.content,
    is_published: announcement.is_published
  }
}

function cancelAnnouncementForm() {
  isCreatingAnnouncement.value = false
  editingAnnouncement.value = null
  announcementForm.value = {
    title: '',
    content: '',
    is_published: true
  }
}

async function saveAnnouncement() {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    uiStore.showNotification('Title and content are required', 'error')
    return
  }

  saving.value = true
  try {
    if (editingAnnouncement.value) {
      await api.updateAnnouncement(editingAnnouncement.value.id, announcementForm.value)
      uiStore.showNotification('Announcement updated successfully', 'success')
    } else {
      await api.createAnnouncement(announcementForm.value)
      uiStore.showNotification('Announcement created successfully', 'success')
    }

    cancelAnnouncementForm()
    await loadAnnouncements()
  } catch (err) {
    console.error('Failed to save announcement:', err)
    uiStore.showNotification('Failed to save announcement', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteAnnouncementById(announcementId) {
  if (!confirm('Are you sure you want to delete this announcement?')) {
    return
  }

  actionInProgress.value = true
  try {
    await api.deleteAnnouncement(announcementId)
    uiStore.showNotification('Announcement deleted successfully', 'success')
    await loadAnnouncements()
  } catch (err) {
    console.error('Failed to delete announcement:', err)
    uiStore.showNotification('Failed to delete announcement', 'error')
  } finally {
    actionInProgress.value = false
  }
}

async function viewUserDetails(user) {
  selectedUser.value = user
  userStats.value = null
  userCollectionStats.value = null

  try {
    const [uploadStatsRes, collectionStatsRes] = await Promise.all([
      api.getUserUploadStats(user.id),
      api.getUserCollectionStats(user.id)
    ])
    userStats.value = uploadStatsRes.data
    userCollectionStats.value = collectionStatsRes.data
  } catch (err) {
    console.error('Failed to load user stats:', err)
    try {
      const response = await api.getUserUploadStats(user.id)
      userStats.value = response.data
    } catch (innerErr) {
      console.error('Failed to load upload stats:', innerErr)
    }
  }
}

function editUserLimit(user) {
  editingUser.value = user
  newUploadLimit.value = user.max_audio_uploads || 100
}

async function saveUploadLimit() {
  if (!editingUser.value) return

  saving.value = true
  try {
    await api.updateUserUploadLimit(editingUser.value.id, newUploadLimit.value)
    uiStore.showNotification('Upload limit updated successfully', 'success')
    editingUser.value = null
    await loadUsers()
  } catch (err) {
    console.error('Failed to update upload limit:', err)
    uiStore.showNotification('Failed to update upload limit', 'error')
  } finally {
    saving.value = false
  }
}

function viewCollection(collection) {
  router.push(`/collection/${collection.id}`)
}

function confirmDeleteCollection(collection) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Delete Collection',
    message: `Are you sure you want to delete "${collection.title}"? This action cannot be undone.`,
    details: `Owner: ${getOwnerName(collection)}`,
    type: 'danger',
    confirmText: 'Delete Collection',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.deleteCollection(collection.id)
        uiStore.showNotification('Collection deleted successfully', 'success')
        await loadCollections()
        await loadSystemStats()
      } catch (err) {
        console.error('Failed to delete collection:', err)
        uiStore.showNotification(err.response?.data?.detail || 'Failed to delete collection', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmDeleteAudioFile(file) {
  if (actionInProgress.value) return

  const fileName = file.title || file.original_filename || 'Untitled'

  uiStore.openModal('confirm', {
    title: 'Delete Audio File',
    message: `Are you sure you want to delete "${fileName}"? This will also remove it from all collections.`,
    details: `Owner: ${getOwnerName(file)}`,
    type: 'danger',
    confirmText: 'Delete Audio File',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.deleteAudioFile(file.id)
        uiStore.showNotification('Audio file deleted successfully', 'success')
        await loadAudioFiles()
        await loadSystemStats()
      } catch (err) {
        console.error('Failed to delete audio file:', err)
        uiStore.showNotification(err.response?.data?.detail || 'Failed to delete audio file', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmResetUploads(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Reset User Uploads',
    message: `Are you sure you want to reset uploads for ${user.username}?`,
    type: 'warning',
    confirmText: 'Reset Uploads',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.resetUserUploads(user.id)
        uiStore.showNotification('User uploads reset successfully', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to reset uploads:', err)
        uiStore.showNotification('Failed to reset uploads', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmDeleteCollections(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Delete All Collections',
    message: `Are you sure you want to delete ALL collections for ${user.username}? This action cannot be undone.`,
    type: 'danger',
    confirmText: 'Delete All',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.deleteUserCollections(user.id)
        uiStore.showNotification('User collections deleted successfully', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to delete collections:', err)
        uiStore.showNotification('Failed to delete collections', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmDeleteAudioFiles(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Delete All Audio Files',
    message: `Are you sure you want to delete ALL audio files for ${user.username}? This action cannot be undone.`,
    type: 'danger',
    confirmText: 'Delete All',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.deleteUserAudioFiles(user.id)
        uiStore.showNotification('User audio files deleted successfully', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to delete audio files:', err)
        uiStore.showNotification('Failed to delete audio files', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmDisableUser(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Disable User Account',
    message: `Are you sure you want to disable ${user.username}? They will not be able to log in until re-enabled.`,
    type: 'warning',
    confirmText: 'Disable User',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.disableUser(user.id)
        uiStore.showNotification('User disabled successfully', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to disable user:', err)
        uiStore.showNotification('Failed to disable user', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmEnableUser(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Enable User Account',
    message: `Are you sure you want to re-enable ${user.username}? They will be able to log in again.`,
    type: 'info',
    confirmText: 'Enable User',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.enableUser(user.id)
        uiStore.showNotification('User enabled successfully', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to enable user:', err)
        uiStore.showNotification('Failed to enable user', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function confirmDeleteUser(user) {
  if (actionInProgress.value) return

  uiStore.openModal('confirm', {
    title: 'Permanently Delete User',
    message: `Are you sure you want to PERMANENTLY delete ${user.username}? This will delete their account, all data, collections, and audio files. This action CANNOT be undone!`,
    details: `User: ${user.username} (${user.email})`,
    type: 'danger',
    confirmText: 'Delete Forever',
    onConfirm: async () => {
      if (actionInProgress.value) return
      actionInProgress.value = true

      try {
        await api.deleteUser(user.id)
        uiStore.showNotification('User permanently deleted', 'success')
        selectedUser.value = null
        await loadUsers()
      } catch (err) {
        console.error('Failed to delete user:', err)
        uiStore.showNotification('Failed to delete user', 'error')
      } finally {
        actionInProgress.value = false
      }
    }
  })
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatCollectionType(type) {
  if (!type) return 'Collection'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getOwnerName(item) {
  return item.owner_username ||
         item.owner?.username ||
         item.owner_name ||
         item.uploader_username ||
         item.uploader?.username ||
         'Unknown'
}

function handleImageError(e) {
  e.target.src = defaultAlbumCover
}

function getDefaultProfilePicture() {
  return defaultProfilePictureSvg
}

function handleProfilePictureError(e) {
  e.target.src = getDefaultProfilePicture()
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (err) {
    return 'Invalid date'
  }
}

function highlightText(text, search) {
  if (!text) return ''
  if (!search || !search.trim()) return escapeHtml(text)

  const escapedText = escapeHtml(text)
  const escapedSearch = escapeHtml(search.trim())
  const regex = new RegExp(`(${escapeRegex(escapedSearch)})`, 'gi')
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<style scoped>
.admin-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-container);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-light);
}

.admin-actions-section {
  margin-bottom: 32px;
}

.action-card {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--border-radius);
  background: var(--bg-surface);
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 4px 0;
}

.action-content p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

.btn-warning {
  background: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  border: none;
  padding: 10px 24px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-warning:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.process-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  animation: slideInDown 0.3s ease;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.process-result.success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: rgb(16, 185, 129);
}

.process-result.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(239, 68, 68);
}

.admin-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-light-10);
  margin-bottom: 24px;
}

.tab-button {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.tab-button:hover {
  color: var(--text-light);
}

.tab-button.active {
  color: var(--text-light);
  border-bottom-color: var(--text-light);
}

.admin-section {
  background: var(--bg-container);
  border-radius: var(--border-radius);
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.search-filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-sm);
  color: var(--text-light);
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--text-light);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

:deep(.search-highlight) {
  background-color: rgba(255, 213, 79, 0.4);
  color: inherit;
  padding: 1px 2px;
  border-radius: 2px;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-sm);
  color: var(--text-light);
  font-size: 14px;
  cursor: pointer;
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--text-light);
}

.filter-select option {
  background: var(--bg-container);
  color: var(--text-light);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-surface);
  color: var(--text-light);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.refresh-button:hover:not(:disabled) {
  background: var(--bg-surface-hover);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.users-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border-light-10);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 1.5fr 100px 100px 120px 160px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-surface);
  align-items: center;
}

.table-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.table-row {
  font-size: 14px;
  color: var(--text-light);
}

.table-row:hover {
  background: var(--bg-surface-hover);
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  background: var(--bg-container);
  color: var(--text-secondary);
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.role-badge.superuser {
  background: rgba(59, 130, 246, 0.15);
  color: rgb(59, 130, 246);
}

.icon-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-button:hover:not(:disabled) {
  background: var(--bg-container);
  color: var(--text-light);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button.warning {
  color: rgb(245, 158, 11);
}

.icon-button.warning:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.15);
  color: rgb(245, 158, 11);
}

.icon-button.success {
  color: rgb(34, 197, 94);
}

.icon-button.success:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.15);
  color: rgb(34, 197, 94);
}

.icon-button.danger {
  color: rgb(239, 68, 68);
}

.icon-button.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.col-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius-sm);
  color: rgb(239, 68, 68);
  font-size: 14px;
}

.error-message svg {
  flex-shrink: 0;
}

.collections-list h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 16px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-surface);
  margin-bottom: 8px;
  transition: background var(--transition-fast);
}

.collection-item:hover {
  background: var(--bg-surface-hover);
}

.collection-cover {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.collection-actions {
  display: flex;
  gap: 4px;
}

.audio-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audio-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-surface);
}

.audio-file-item:hover {
  background: var(--bg-surface-hover);
}

.audio-cover {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.audio-info {
  flex: 1;
  min-width: 0;
}

.audio-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.audio-owner {
  font-size: 13px;
  color: var(--text-secondary);
}

.audio-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.audio-files-header {
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  margin-top: 12px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.more-items {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.user-detail-modal,
.edit-modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--border-light-10);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-button:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.modal-content {
  padding: 20px;
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-light-10);
  margin-bottom: 24px;
}

.user-profile-picture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--bg-surface);
  flex-shrink: 0;
}

.user-profile-info {
  flex: 1;
  min-width: 0;
}

.user-profile-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 4px;
}

.user-profile-email {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light-10);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: var(--text-light);
}

.loading-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
  margin-bottom: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button,
.danger-button {
  padding: 10px 20px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.primary-button {
  background: var(--text-light);
  color: var(--text-dark);
}

.primary-button:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-button {
  background: var(--bg-surface);
  color: var(--text-light);
}

.secondary-button:hover {
  background: var(--bg-surface-hover);
}

.danger-button {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.danger-button:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-button {
  padding: 10px 20px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: rgba(245, 158, 11, 0.15);
  color: rgb(245, 158, 11);
}

.warning-button:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.25);
}

.warning-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.15);
  color: rgb(34, 197, 94);
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-sm);
  color: var(--text-light);
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--text-light);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.2s;
}

.announcement-item:hover {
  border-color: var(--primary);
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.announcement-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.announcement-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.announcement-badge.published {
  background: #d4edda;
  color: #155724;
}

.announcement-badge.draft {
  background: #fff3cd;
  color: #856404;
}

.announcement-content {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.announcement-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.announcement-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.announcement-modal {
  max-width: 600px;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.label-hint {
  font-weight: 400;
  font-size: 12px;
  color: var(--text-tertiary);
}

.content-editor {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
}

.editor-tab {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editor-tab:hover {
  color: var(--text-light);
}

.editor-tab.active {
  color: var(--text-light);
  background: var(--bg-primary);
  border-bottom: 2px solid var(--primary);
}

.content-editor .form-textarea {
  border: none;
  border-radius: 0;
  min-height: 200px;
}

.content-editor .form-textarea:focus {
  box-shadow: none;
}

.markdown-preview {
  min-height: 200px;
  padding: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin: 12px 0 8px 0;
  color: var(--text-light);
}

.markdown-preview :deep(p) {
  margin: 8px 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-preview :deep(code) {
  background: var(--bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.markdown-preview :deep(pre) {
  background: var(--bg-surface);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-preview :deep(a) {
  color: var(--primary);
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--primary);
  margin: 12px 0;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-radius: 0 6px 6px 0;
}

.preview-placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}

.markdown-help {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: var(--bg-surface);
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: monospace;
}

.markdown-content {
  white-space: normal;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: 12px 0 8px 0;
  color: var(--text-light);
}

.markdown-content :deep(h1) { font-size: 18px; }
.markdown-content :deep(h2) { font-size: 16px; }
.markdown-content :deep(h3) { font-size: 15px; }
.markdown-content :deep(h4) { font-size: 14px; }

.markdown-content :deep(p) {
  margin: 8px 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(code) {
  background: var(--bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.markdown-content :deep(pre) {
  background: var(--bg-surface);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-content :deep(a) {
  color: var(--primary);
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary);
  margin: 12px 0;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-radius: 0 6px 6px 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--text-light);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  .action-card {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 16px;
  }

  .action-icon {
    margin: 0 auto;
  }

  .btn-warning {
    width: 100%;
  }

  .admin-tabs {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    flex-wrap: nowrap;
  }

  .admin-tabs::-webkit-scrollbar {
    display: none;
  }

  .tab-button {
    padding: 12px 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-header h2 {
    font-size: 18px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions .btn,
  .refresh-button {
    width: 100%;
    justify-content: center;
  }

  .users-table {
    gap: 12px;
    background: transparent;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--bg-surface);
    border-radius: var(--border-radius-sm);
  }

  .col-id,
  .col-username,
  .col-email,
  .col-role,
  .col-status,
  .col-uploads {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-id::before {
    content: 'ID:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-username::before {
    content: 'Username:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-email::before {
    content: 'Email:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-role::before {
    content: 'Role:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-status::before {
    content: 'Status:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-uploads::before {
    content: 'Uploads:';
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .col-actions {
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid var(--border-light-10);
  }

  .mini-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .user-detail-modal,
  .edit-modal,
  .announcement-modal {
    max-width: 100%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h2 {
    font-size: 18px;
  }

  .modal-content {
    padding: 16px;
  }

  .user-profile-section {
    flex-direction: column;
    text-align: center;
  }

  .user-profile-picture {
    width: 100px;
    height: 100px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    width: 100%;
  }

  .primary-button,
  .secondary-button,
  .danger-button,
  .warning-button {
    width: 100%;
  }

  .collection-item {
    flex-wrap: wrap;
  }

  .collection-info {
    flex: 1;
    min-width: 200px;
  }

  .collection-actions {
    width: 100%;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid var(--border-light-10);
  }

  .announcement-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .announcement-actions {
    flex-direction: column;
    width: 100%;
  }

  .announcement-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .admin-page {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 20px;
  }

  .action-card {
    padding: 16px;
  }

  .action-icon {
    width: 48px;
    height: 48px;
  }

  .tab-button {
    padding: 10px 16px;
    font-size: 13px;
  }

  .admin-section {
    padding: 16px;
  }

  .table-row {
    padding: 12px;
    gap: 10px;
  }

  .collection-cover {
    width: 56px;
    height: 56px;
  }

  .audio-cover {
    width: 40px;
    height: 40px;
  }

  .modal-header {
    padding: 12px;
  }

  .modal-header h2 {
    font-size: 16px;
  }

  .modal-content {
    padding: 12px;
  }

  .user-profile-picture {
    width: 80px;
    height: 80px;
  }

  .user-profile-name {
    font-size: 18px;
  }
}
</style>