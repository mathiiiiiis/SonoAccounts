<template>
  <div class="modal-overlay" @click.self="uiStore.closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2>Edit Track</h2>
        <button class="modal-close" @click="uiStore.closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label">Cover Art</label>
          <div class="cover-art-upload">
            <div class="cover-preview">
              <img
                :src="coverPreview || formData.cover_art_url || defaultTrackCover"
                alt="Cover"
              />
            </div>
            <div class="cover-actions">
              <input
                type="file"
                ref="coverInput"
                accept="image/*"
                @change="handleCoverSelect"
                style="display: none"
              />
              <button type="button" class="btn btn-secondary btn-sm" @click="$refs.coverInput.click()">
                {{ formData.cover_art_url || coverFile ? 'Change' : 'Upload' }} Cover Art
              </button>
              <p class="form-hint">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Title *</label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Enter track title"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Artist</label>
          <input
            v-model="formData.artist"
            type="text"
            placeholder="Artist name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Album</label>
          <input
            v-model="formData.album"
            type="text"
            placeholder="Album name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Genre</label>
          <input
            v-model="formData.genre"
            type="text"
            placeholder="Genre"
          />
        </div>

        <div v-if="error" class="form-error">{{ error }}</div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="uiStore.closeModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandling'
import defaultTrackCoverSvg from '@/assets/images/defaults/default_track_cover.svg'

const router = useRouter()
const uiStore = useUIStore()
const defaultTrackCover = defaultTrackCoverSvg

const loading = ref(false)
const error = ref(null)
const coverInput = ref(null)
const coverFile = ref(null)
const coverPreview = ref(null)

const formData = ref({
  id: null,
  title: '',
  artist: '',
  album: '',
  genre: '',
  cover_art_url: ''
})

onMounted(() => {
  if (uiStore.modalData) {
    formData.value = {
      id: uiStore.modalData.id,
      title: uiStore.modalData.title || '',
      artist: uiStore.modalData.artist || '',
      album: uiStore.modalData.album || '',
      genre: uiStore.modalData.genre || '',
      cover_art_url: uiStore.modalData.cover_art_url || ''
    }
  }
})

function handleCoverSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Cover art must be less than 5MB'
    return
  }

  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  coverFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    coverPreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  error.value = null
}

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const updateData = {
      title: formData.value.title
    }

    if (formData.value.artist) updateData.artist = formData.value.artist
    if (formData.value.album) updateData.album = formData.value.album
    if (formData.value.genre) updateData.genre = formData.value.genre

    await api.updateAudioFile(formData.value.id, updateData)

    if (coverFile.value) {
      await api.uploadAudioCoverArt(formData.value.id, coverFile.value)
    }

    if (uiStore.modalData?.onSuccess) {
      await uiStore.modalData.onSuccess()
    }

    uiStore.closeModal()
  } catch (err) {
    console.error('Update track error:', err)
    error.value = getErrorMessage(err, 'Failed to update track')
  } finally {
    loading.value = false
  }
}
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
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
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
  padding: 24px;
  overflow-y: auto;
}

.cover-art-upload {
  display: flex;
  gap: 20px;
  align-items: center;
}

.cover-preview {
  width: 120px;
  height: 120px;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--bg-surface);
  flex-shrink: 0;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>