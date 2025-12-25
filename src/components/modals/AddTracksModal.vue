<template>
  <div class="modal-overlay" @click.self="uiStore.closeModal">
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>Add Tracks to Collection</h2>
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
          <p>Loading your tracks...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn btn-secondary" @click="loadAvailableTracks">Retry</button>
        </div>

        <div v-else-if="filteredTracks.length > 0" class="tracks-list">
          <label
            v-for="track in filteredTracks"
            :key="track.id"
            class="track-item"
            :class="{ selected: selectedTracks.includes(track.id) }"
          >
            <input
              type="checkbox"
              :value="track.id"
              v-model="selectedTracks"
              class="track-checkbox"
            />
            <div class="track-artwork">
              <img v-if="track.cover_art_url" :src="track.cover_art_url" alt="" class="artwork-img" />
              <div v-else class="artwork-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>
            <div class="track-info">
              <div class="track-title">{{ getTrackTitle(track) }}</div>
              <div class="track-meta">
                <span v-if="track.artist">{{ track.artist }}</span>
                <span v-else class="unknown">Unknown Artist</span>
                <span class="separator">·</span>
                <span>{{ formatDuration(track.duration) }}</span>
              </div>
            </div>
            <div class="track-check-icon">
              <svg v-if="selectedTracks.includes(track.id)" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </label>
        </div>

        <div v-else class="empty-state">
          <p class="empty-title">{{ searchQuery ? 'No tracks found' : 'No available tracks' }}</p>
          <p class="empty-subtitle">
            {{ searchQuery ? 'Try a different search term' : 'Upload some tracks first to add them here' }}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <div class="selected-count" :class="{ 'has-selection': selectedTracks.length > 0 }">
            <span v-if="selectedTracks.length > 0">
              {{ selectedTracks.length }} track{{ selectedTracks.length !== 1 ? 's' : '' }} selected
            </span>
            <span v-else>Select tracks to add</span>
          </div>
        </div>
        <div class="modal-footer-actions">
          <button class="btn btn-secondary" @click="uiStore.closeModal">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="handleAdd"
            :disabled="selectedTracks.length === 0 || adding"
          >
            {{ adding ? 'Adding...' : `Add ${selectedTracks.length > 0 ? selectedTracks.length + ' ' : ''}Track${selectedTracks.length !== 1 ? 's' : ''}` }}
          </button>
        </div>
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
const adding = ref(false)
const searchQuery = ref('')
const selectedTracks = ref([])

const collectionId = computed(() => uiStore.modalData?.collectionId)
const existingTrackIds = computed(() => uiStore.modalData?.existingTrackIds || [])

const availableTracks = computed(() => {
  return dataStore.audioFiles.filter(
    track => track && !existingTrackIds.value.includes(track.id)
  )
})

const filteredTracks = computed(() => {
  if (!searchQuery.value) return availableTracks.value

  const query = searchQuery.value.toLowerCase()
  return availableTracks.value.filter(track => {
    const title = (track.title || track.original_filename || '').toLowerCase()
    const artist = (track.artist || '').toLowerCase()
    return title.includes(query) || artist.includes(query)
  })
})

function getTrackTitle(track) {
  if (track.title) return track.title
  if (track.original_filename) {
    return track.original_filename.replace(/\.[^/.]+$/, '')
  }
  return 'Untitled Track'
}

async function loadAvailableTracks() {
  if (dataStore.audioFiles.length === 0) {
    loading.value = true
  }
  error.value = null

  try {
    await dataStore.fetchAudioFiles()
  } catch (err) {
    console.error('Failed to load tracks:', err)
    error.value = 'Failed to load your tracks. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  if (selectedTracks.value.length === 0) return

  adding.value = true
  error.value = null

  try {
    await api.bulkAddTracks(collectionId.value, selectedTracks.value)

    const count = selectedTracks.value.length
    const message = count === 1 ? 'Track added to collection!' : `${count} tracks added to collection!`

    if (uiStore.modalData?.onSuccess) {
      await uiStore.modalData.onSuccess()
    }

    uiStore.closeModal()
  } catch (err) {
    console.error('Failed to add tracks:', err)
    const errorMessage = err.response?.data?.detail || err.message || 'Failed to add tracks to collection'
    error.value = errorMessage
    uiStore.showNotification(errorMessage, 'error')
  } finally {
    adding.value = false
  }
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'

  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadAvailableTracks()
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 350px;
  overflow-y: auto;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.track-item:hover {
  background: var(--bg-surface-hover);
}

.track-item.selected {
  border-color: var(--text-light);
  background: rgba(255, 255, 255, 0.08);
}

.track-checkbox {
  display: none;
}

.track-artwork {
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

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.track-meta .unknown {
  color: var(--text-tertiary);
  font-style: italic;
}

.track-meta .separator {
  color: var(--text-tertiary);
}

.track-check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-light-20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.track-item.selected .track-check-icon {
  background: var(--text-light);
  border-color: var(--text-light);
  color: var(--text-dark);
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

.selected-count {
  font-size: 14px;
  color: var(--text-tertiary);
}

.selected-count.has-selection {
  color: var(--text-light);
  font-weight: 500;
}

.modal-footer-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
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
    flex-direction: column;
    align-items: stretch;
  }

  .modal-footer-actions {
    justify-content: stretch;
  }

  .modal-footer-actions .btn {
    flex: 1;
  }
}
</style>