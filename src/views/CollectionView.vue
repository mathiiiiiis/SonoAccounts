<template>
  <div class="page collection-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading collection...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="$router.push('/')">Back to Library</button>
    </div>

    <div v-else-if="collection" class="collection-content">
      <div class="collection-hero">
        <div class="hero-background">
          <img :src="collection.cover_art_url || defaultAlbumCover" alt="" />
        </div>

        <div class="hero-content">
          <div class="hero-cover">
            <img
              :src="collection.cover_art_url || defaultAlbumCover"
              alt=""
              @error="handleImageError"
            />
          </div>

          <div class="hero-info">
            <p class="collection-type">{{ formatType(collection.collection_type) }}</p>
            <h1 class="collection-title">{{ collection.title }}</h1>
            <p class="collection-artist">{{ collection.artist || collection.owner?.username || 'Unknown' }}</p>

            <div class="collection-meta">
              <span v-if="tracks.length">{{ tracks.length }} {{ tracks.length === 1 ? 'track' : 'tracks' }}</span>
              <span v-if="tracks.length && totalDuration"> · </span>
              <span v-if="totalDuration">{{ formatTotalDuration(totalDuration) }}</span>
              <span v-if="!collection.is_public"> · Private</span>
              <span v-if="collection.is_collaborative"> · Collaborative</span>
            </div>

            <p v-if="collection.description" class="collection-description">{{ collection.description }}</p>

            <div class="hero-actions">
              <button class="btn-play" @click="playAll" :disabled="tracks.length === 0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                </svg>
              </button>
              <button v-if="canEdit" class="btn-icon" @click="editCollection" title="Edit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button v-if="isOwner" class="btn-icon btn-icon-danger" @click="deleteCollection" title="Delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isOwner && collection.collection_type === 'playlist'" class="collaborators-section">
        <div class="collaborators-header">
          <h3>Collaborators</h3>
          <button class="btn-text" @click="openCollaboratorsModal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Manage
          </button>
        </div>
        <div v-if="collection.collaborators && collection.collaborators.length > 0" class="collaborators-list">
          <div v-for="collab in collection.collaborators" :key="collab.user_id" class="collaborator-item">
            <div class="collaborator-avatar">
              <img v-if="collab.user?.profile_picture_url" :src="collab.user.profile_picture_url" alt="" />
              <span v-else>{{ (collab.user?.username || '?')[0].toUpperCase() }}</span>
            </div>
            <div class="collaborator-info">
              <span class="collaborator-name">{{ collab.user?.username || 'Unknown' }}</span>
              <span class="collaborator-role">{{ collab.can_edit ? 'Editor' : 'Viewer' }}</span>
            </div>
          </div>
        </div>
        <p v-else class="no-collaborators">No collaborators yet</p>
      </div>

      <div class="tracks-section">
        <div v-if="tracks.length === 0" class="empty-tracks">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
          </svg>
          <h3>No tracks yet</h3>
          <p>Add tracks to start building your collection</p>
          <div v-if="canEdit" class="empty-actions">
            <button class="btn btn-primary" @click="triggerFileUpload" :disabled="uploading" data-walkthrough="upload-tracks">
              {{ uploading ? `Uploading ${uploadedFiles}/${totalFiles}...` : 'Upload Tracks' }}
            </button>
            <button class="btn btn-secondary" @click="openAddTracksModal" :disabled="uploading">
              Add from Library
            </button>
          </div>
        </div>

        <div v-else class="tracks-content">
          <div class="tracks-list">
            <TrackRow
              v-for="(track, index) in tracks"
              :key="track.id"
              :track="track.audio_file"
              :index="index"
              :can-delete="canEdit"
              :can-edit="canEdit"
              :collection="collection"
              @play="playTrack(index)"
              @edit="editTrack(track.audio_file)"
              @delete="deleteTrack(track)"
            />
          </div>

          <div v-if="canEdit" class="tracks-footer">
            <button class="add-track-btn" @click="triggerFileUpload" :disabled="uploading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              {{ uploading ? `Uploading...` : 'Upload' }}
            </button>
            <button class="add-track-btn" @click="openAddTracksModal" :disabled="uploading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add from Library
            </button>
          </div>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
      @change="handleFileSelect"
      style="display: none"
    />

    <div v-if="showCollaboratorsModal" class="modal-overlay" @click.self="showCollaboratorsModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Manage Collaborators</h2>
          <button class="modal-close" @click="showCollaboratorsModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="add-collaborator">
            <input
              v-model.number="newCollaboratorId"
              type="number"
              placeholder="Enter User ID"
              min="1"
            />
            <select v-model="newCollaboratorPermission">
              <option value="edit">Can Edit</option>
              <option value="view">Can View</option>
            </select>
            <button class="btn btn-primary" @click="addCollaborator" :disabled="!newCollaboratorId || addingCollaborator">
              {{ addingCollaborator ? 'Adding...' : 'Add' }}
            </button>
          </div>
          <div v-if="collaboratorError" class="form-error">{{ collaboratorError }}</div>
          <div v-if="collection.collaborators && collection.collaborators.length > 0" class="collab-list">
            <div v-for="collab in collection.collaborators" :key="collab.user_id" class="collab-item">
              <div class="collab-info">
                <span class="collab-name">{{ collab.user?.username || 'Unknown' }}</span>
                <span class="collab-perm">{{ collab.can_edit ? 'Editor' : 'Viewer' }}</span>
              </div>
              <button class="btn-remove" @click="removeCollaborator(collab.user_id)">Remove</button>
            </div>
          </div>
          <p v-else class="empty-collabs">No collaborators added yet</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCollaboratorsModal = false">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useUIStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import * as api from '@/services/api'
import TrackRow from '@/components/common/TrackRow.vue'
import { getErrorMessage } from '@/utils/errorHandling'
import defaultAlbumCoverSvg from '@/assets/images/defaults/default_album_cover.svg'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const uiStore = useUIStore()
const dataStore = useDataStore()

const defaultAlbumCover = defaultAlbumCoverSvg

const loading = ref(false)
const error = ref(null)
const collection = ref(null)
const tracks = ref([])
const fileInput = ref(null)
const uploading = ref(false)
const totalFiles = ref(0)
const uploadedFiles = ref(0)

const showCollaboratorsModal = ref(false)
const newCollaboratorId = ref(null)
const newCollaboratorPermission = ref('edit')
const addingCollaborator = ref(false)
const collaboratorError = ref(null)

const isOwner = computed(() => {
  return collection.value?.owner_id === authStore.user?.id
})

const isCollaborator = computed(() => {
  if (!collection.value?.collaborators || !authStore.user?.id) return false
  return collection.value.collaborators.some(
    collab => collab.user_id === authStore.user.id && collab.can_edit
  )
})

const canEdit = computed(() => {
  return isOwner.value || isCollaborator.value
})

const totalDuration = computed(() => {
  return tracks.value.reduce((sum, t) => sum + (t.audio_file?.duration || 0), 0)
})

async function loadCollection(forceRefresh = false) {
  const collectionId = route.params.id
  if (!collection.value) {
    loading.value = true
  }
  error.value = null

  try {
    const data = await dataStore.getCollection(collectionId, forceRefresh)
    collection.value = data
    tracks.value = data.tracks || []
  } catch (err) {
    console.error('Failed to load collection:', err)
    error.value = 'Failed to load collection'
  } finally {
    loading.value = false
  }
}

function playAll() {
  if (tracks.value.length > 0) {
    const audioFiles = tracks.value.map(t => t.audio_file)
    playerStore.playTrack(audioFiles[0], audioFiles, 0, collection.value)
  }
}

function playTrack(index) {
  const audioFiles = tracks.value.map(t => t.audio_file)
  playerStore.playTrack(audioFiles[index], audioFiles, index, collection.value)
}

function editCollection() {
  uiStore.openModal('edit-collection', {
    ...collection.value,
    onSuccess: async () => {
      dataStore.invalidateCollection(collection.value.id)
      dataStore.invalidateCollections()
      await loadCollection(true)
    }
  })
}

function editTrack(audioFile) {
  uiStore.openModal('edit-audio', {
    ...audioFile,
    onSuccess: async () => {
      dataStore.invalidateCollection(collection.value.id)
      dataStore.invalidateAudioFiles()
      await loadCollection(true)
    }
  })
}

function openAddTracksModal() {
  const existingTrackIds = tracks.value.map(t => t.audio_file_id)
  uiStore.openModal('add-tracks', {
    collectionId: collection.value.id,
    existingTrackIds,
    onSuccess: async () => {
      dataStore.invalidateCollection(collection.value.id)
      await loadCollection(true)
    }
  })
}

function openCollaboratorsModal() {
  showCollaboratorsModal.value = true
  newCollaboratorId.value = null
  newCollaboratorPermission.value = 'edit'
  collaboratorError.value = null
}

async function addCollaborator() {
  if (!newCollaboratorId.value) return

  addingCollaborator.value = true
  collaboratorError.value = null

  try {
    await api.addCollaborator(collection.value.id, {
      user_id: newCollaboratorId.value,
      permission_level: newCollaboratorPermission.value
    })
    newCollaboratorId.value = null
    await loadCollection(true)
  } catch (err) {
    console.error('Failed to add collaborator:', err)
    collaboratorError.value = getErrorMessage(err)
  } finally {
    addingCollaborator.value = false
  }
}

async function removeCollaborator(userId) {
  try {
    await api.removeCollaborator(collection.value.id, userId)
    uiStore.showNotification('Collaborator removed', 'success')
    await loadCollection(true)
  } catch (err) {
    console.error('Failed to remove collaborator:', err)
    uiStore.showNotification(getErrorMessage(err), 'error')
  }
}

function triggerFileUpload() {
  fileInput.value.click()
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  const maxSize = 50 * 1024 * 1024
  const invalidFiles = files.filter(f => f.size > maxSize)
  if (invalidFiles.length > 0) {
    uiStore.showNotification(`${invalidFiles.length} file(s) exceed 50MB limit`, 'warning')
  }

  const validFiles = files.filter(f => f.size <= maxSize)
  if (validFiles.length === 0) return

  uploading.value = true
  totalFiles.value = validFiles.length
  uploadedFiles.value = 0

  const failedFiles = []

  try {
    for (const file of validFiles) {
      try {
        await uploadFile(file)
        uploadedFiles.value++
      } catch (fileErr) {
        console.error(`Failed to upload ${file.name}:`, fileErr)
        failedFiles.push({ name: file.name, error: fileErr })
      }
    }

    if (failedFiles.length === 0) {
      uiStore.showNotification(`Uploaded ${validFiles.length} track(s)`, 'success')
    } else if (uploadedFiles.value > 0) {
      uiStore.showNotification(`Uploaded ${uploadedFiles.value}/${validFiles.length} tracks`, 'warning')
    } else {
      uiStore.showNotification(getErrorMessage(failedFiles[0]?.error, 'Upload failed'), 'error')
    }

    if (uploadedFiles.value > 0) {
      dataStore.invalidateCollection(collection.value.id)
      dataStore.invalidateAudioFiles()
      await loadCollection(true)
    }
  } finally {
    uploading.value = false
    totalFiles.value = 0
    uploadedFiles.value = 0
    event.target.value = ''
  }
}

async function uploadFile(file) {
  const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
  const metadata = { title, is_public: collection.value.is_public }

  const uploadResponse = await api.uploadAudioFile(file, metadata)
  await api.addTrackToCollection(collection.value.id, {
    audio_file_id: uploadResponse.data.id,
    track_order: tracks.value.length + uploadedFiles.value + 1
  })
}

function deleteTrack(track) {
  const trackTitle = track.audio_file.title || track.audio_file.original_filename

  uiStore.openModal('confirm', {
    title: 'Remove Track',
    message: `Remove "${trackTitle}" from this collection?`,
    type: 'danger',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await api.removeTrackFromCollection(collection.value.id, track.id)
        dataStore.invalidateCollection(collection.value.id)
        await loadCollection(true)
      } catch (err) {
        console.error('Failed to remove track:', err)
        uiStore.showNotification('Failed to remove track', 'error')
      }
    }
  })
}

function deleteCollection() {
  uiStore.openModal('confirm', {
    title: 'Delete Collection',
    message: `Delete "${collection.value.title}"? This cannot be undone.`,
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const collectionId = collection.value.id
        await api.deleteCollection(collectionId)

        if (playerStore.currentCollection?.id === collectionId) {
          playerStore.stopPlayback()
        }

        dataStore.removeCollectionFromCache(collectionId)
        router.push('/library')
      } catch (err) {
        console.error('Failed to delete collection:', err)
        uiStore.showNotification('Failed to delete collection', 'error')
      }
    }
  })
}

function formatType(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatTotalDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function handleImageError(e) {
  e.target.src = defaultAlbumCover
}

onMounted(() => {
  loadCollection()
})
</script>

<style scoped>
.collection-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 120px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: var(--text-tertiary);
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

.collection-hero {
  position: relative;
  margin: -24px -24px 0;
  padding: 80px 32px 32px;
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--border-radius);
}

.hero-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(60px) saturate(1.2);
  transform: scale(1.3);
  opacity: 1;
}

.hero-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.9);
}

.hero-content {
  position: relative;
  display: flex;
  gap: 32px;
  align-items: flex-end;
}

.hero-cover {
  width: 200px;
  height: 200px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: var(--shadow-xl);
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.collection-type {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin: 0 0 8px 0;
}

.collection-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-light);
  margin: 0 0 8px 0;
  line-height: 1.1;
}

.collection-artist {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.collection-meta {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 12px 0;
}

.collection-description {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 16px 0;
  max-width: 500px;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-play {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--text-light);
  color: var(--text-dark);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-play:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-play:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-surface);
  color: var(--text-light);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-surface-hover);
}

.btn-icon-danger {
  color: #ef4444;
}

.collaborators-section {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-light-10);
}

.collaborators-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.collaborators-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.btn-text:hover {
  color: var(--text-light);
}

.collaborators-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
}

.collaborator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  overflow: hidden;
}

.collaborator-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collaborator-info {
  display: flex;
  flex-direction: column;
}

.collaborator-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-light);
}

.collaborator-role {
  font-size: 11px;
  color: var(--text-tertiary);
}

.no-collaborators {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.empty-tracks {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-tracks h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 8px 0 0 0;
}

.empty-tracks p {
  margin: 0;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.tracks-list {
  display: flex;
  flex-direction: column;
}

.tracks-footer {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light-10);
}

.add-track-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--border-radius-sm);
  background: transparent;
  border: 1px dashed var(--border-light-20);
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-track-btn:hover:not(:disabled) {
  background: var(--bg-surface);
  color: var(--text-light);
}

.add-track-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-light-10);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.add-collaborator {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.add-collaborator input,
.add-collaborator select {
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-size: 14px;
}

.add-collaborator input {
  min-width: 0;
}

.add-collaborator input::placeholder {
  color: var(--text-placeholder);
}

.add-collaborator input:focus,
.add-collaborator select:focus {
  border-color: var(--border-light-30);
  background: var(--bg-surface-hover);
  outline: none;
}

.collab-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collab-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
}

.collab-info {
  display: flex;
  flex-direction: column;
}

.collab-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
}

.collab-perm {
  font-size: 12px;
  color: var(--text-tertiary);
}

.btn-remove {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-remove:hover {
  background: rgba(239, 68, 68, 0.1);
}

.empty-collabs {
  font-size: 14px;
  color: var(--text-tertiary);
  text-align: center;
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light-10);
}

@media (max-width: 768px) {
  .collection-hero {
    margin: -16px -16px 0;
    padding: 40px 16px 24px;
  }

  .hero-content {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .hero-cover {
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }

  .hero-info {
    width: 100%;
    align-items: flex-start;
    text-align: left;
  }

  .collection-type {
    font-size: 11px;
  }

  .collection-title {
    font-size: 28px;
    line-height: 1.2;
  }

  .collection-artist {
    font-size: 15px;
  }

  .collection-meta {
    font-size: 12px;
  }

  .collection-description {
    font-size: 13px;
  }

  .hero-actions {
    margin-top: 16px;
  }

  .collaborators-section {
    padding: 20px;
  }

  .tracks-section {
    padding: 20px;
  }

  .add-collaborator {
    flex-wrap: wrap;
  }

  .add-collaborator input {
    flex: 1 1 100%;
  }

  .add-collaborator select {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .collection-hero {
    padding: 32px 16px 20px;
  }

  .hero-content {
    gap: 16px;
  }

  .hero-cover {
    width: 180px;
    height: 180px;
  }

  .collection-title {
    font-size: 24px;
  }

  .collection-artist {
    font-size: 14px;
  }

  .collection-meta {
    font-size: 11px;
  }

  .btn-play {
    width: 48px;
    height: 48px;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
  }

  .tracks-footer {
    flex-direction: column;
  }

  .add-track-btn {
    justify-content: center;
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }

  .empty-actions .btn {
    width: 100%;
  }
}
</style>