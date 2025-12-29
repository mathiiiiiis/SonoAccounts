<template>
  <div class="modal-overlay" @click.self="uiStore.closeModal">
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>Manage Songs</h2>
        <button class="modal-close" @click="uiStore.closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title or artist..."
            class="search-input"
          />
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading your songs...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn btn-secondary" @click="loadSongs">Retry</button>
        </div>

        <div v-else-if="filteredSongs.length > 0" class="songs-list">
          <div
            v-for="song in filteredSongs"
            :key="song.id"
            class="song-item"
          >
            <div class="song-artwork">
              <img v-if="song.cover_art_url" :src="song.cover_art_url" alt="" class="artwork-img" />
              <div v-else class="artwork-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>
            <div class="song-info">
              <div class="song-title">{{ getSongTitle(song) }}</div>
              <div class="song-meta">
                <span v-if="song.artist">{{ song.artist }}</span>
                <span v-else class="unknown">Unknown Artist</span>
                <span v-if="song.album" class="separator">·</span>
                <span v-if="song.album">{{ song.album }}</span>
              </div>
            </div>
            <div class="song-actions">
              <button
                class="action-btn edit-btn"
                @click="editSong(song)"
                title="Edit song"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="action-btn delete-btn"
                @click="confirmDeleteSong(song)"
                title="Delete song"
                :disabled="deleting === song.id"
              >
                <svg v-if="deleting !== song.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <div v-else class="btn-spinner"></div>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <p class="empty-title">{{ searchQuery ? 'No songs found' : 'No songs uploaded' }}</p>
          <p class="empty-subtitle">
            {{ searchQuery ? 'Try a different search term' : 'Upload some songs to manage them here' }}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <span class="song-count">{{ filteredSongs.length }} song{{ filteredSongs.length !== 1 ? 's' : '' }}</span>
        </div>
        <button class="btn btn-secondary" @click="uiStore.closeModal">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import * as api from '@/services/api'

const uiStore = useUIStore()
const dataStore = useDataStore()

const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const deleting = ref(null)

const filteredSongs = computed(() => {
  const songs = dataStore.audioFiles || []
  if (!searchQuery.value) return songs

  const query = searchQuery.value.toLowerCase()
  return songs.filter(song => {
    const title = (song.title || song.original_filename || '').toLowerCase()
    const artist = (song.artist || '').toLowerCase()
    const album = (song.album || '').toLowerCase()
    return title.includes(query) || artist.includes(query) || album.includes(query)
  })
})

function getSongTitle(song) {
  if (song.title) return song.title
  if (song.original_filename) {
    return song.original_filename.replace(/\.[^/.]+$/, '')
  }
  return 'Untitled Song'
}

async function loadSongs() {
  if (dataStore.audioFiles.length === 0) {
    loading.value = true
  }
  error.value = null

  try {
    await dataStore.fetchAudioFiles()
  } catch (err) {
    console.error('Failed to load songs:', err)
    error.value = 'Failed to load your songs. Please try again.'
  } finally {
    loading.value = false
  }
}

function editSong(song) {
  uiStore.openModal('edit-audio', {
    ...song,
    onSuccess: async () => {
      await dataStore.fetchAudioFiles(true)
      uiStore.openModal('manage-songs')
    }
  })
}

function confirmDeleteSong(song) {
  uiStore.openModal('confirm', {
    title: 'Delete Song',
    message: `Are you sure you want to delete "${getSongTitle(song)}"?`,
    details: 'This action cannot be undone. The song will be removed from all collections.',
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => deleteSong(song),
    onCancel: () => {
      uiStore.openModal('manage-songs')
    }
  })
}

async function deleteSong(song) {
  deleting.value = song.id

  try {
    await api.deleteAudioFile(song.id)
    uiStore.showNotification(`"${getSongTitle(song)}" has been deleted`, 'success')
    await dataStore.fetchAudioFiles(true)
    uiStore.openModal('manage-songs')
  } catch (err) {
    console.error('Failed to delete song:', err)
    const errorMessage = err.response?.data?.detail || 'Failed to delete song'
    uiStore.showNotification(errorMessage, 'error')
    uiStore.openModal('manage-songs')
  } finally {
    deleting.value = null
  }
}

onMounted(() => {
  loadSongs()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 90%;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-large {
  max-width: 600px;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light-10);
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.modal-close {
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

.modal-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  color: var(--text-light);
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--text-light);
  background: var(--bg-container);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  gap: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-state svg {
  opacity: 0.3;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.song-item:hover {
  background: var(--bg-surface-hover);
}

.song-artwork {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.artwork-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-container);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta .unknown {
  color: var(--text-tertiary);
  font-style: italic;
}

.song-meta .separator {
  color: var(--text-tertiary);
}

.song-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-container);
  color: var(--text-light);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-btn:hover:not(:disabled) {
  color: var(--primary-color, #3b82f6);
}

.delete-btn:hover:not(:disabled) {
  background: var(--error-bg);
  color: var(--error-text);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light-10);
  gap: 16px;
}

.footer-left {
  flex: 1;
  min-width: 0;
}

.song-count {
  font-size: 14px;
  color: var(--text-tertiary);
}

@media (max-width: 640px) {
  .modal-large {
    max-width: none;
    max-height: 90vh;
    margin: 16px;
    width: calc(100% - 32px);
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 16px 20px;
  }

  .modal-footer {
    padding: 16px 20px;
  }
}
</style>