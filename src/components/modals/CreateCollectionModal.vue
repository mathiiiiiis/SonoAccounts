<template>
  <div class="modal-overlay" @click.self="uiStore.closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2>Create Collection</h2>
        <button class="modal-close" @click="uiStore.closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select v-model="formData.collection_type">
            <option value="playlist">Playlist</option>
            <option value="album">Album</option>
            <option value="compilation">Compilation</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Title *</label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Enter collection title"
          />
        </div>

        <div class="form-group" v-if="formData.collection_type === 'album'">
          <label class="form-label">Artist</label>
          <input
            v-model="formData.artist"
            type="text"
            placeholder="Artist name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            v-model="formData.description"
            placeholder="Add a description..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.is_public" />
            <span>Make public</span>
          </label>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.is_collaborative" />
            <span>Allow collaborators</span>
          </label>
        </div>

        <div v-if="error" class="form-error">{{ error }}</div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="uiStore.closeModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create' }}
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
import { useDataStore } from '@/stores/data'
import * as api from '@/services/api'

const router = useRouter()
const uiStore = useUIStore()
const dataStore = useDataStore()

const loading = ref(false)
const error = ref(null)

const formData = ref({
  title: '',
  collection_type: 'playlist',
  description: '',
  artist: '',
  is_public: false,
  is_collaborative: false
})

onMounted(() => {
  if (uiStore.modalData?.type) {
    formData.value.collection_type = uiStore.modalData.type.toLowerCase()
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const trimmedTitle = formData.value.title.trim()

    if (!trimmedTitle) {
      error.value = 'Title cannot be empty or contain only spaces'
      loading.value = false
      return
    }

    const cleanData = {
      title: trimmedTitle,
      collection_type: formData.value.collection_type,
      is_public: formData.value.is_public
    }

    if (formData.value.description) cleanData.description = formData.value.description.trim()
    if (formData.value.artist && formData.value.collection_type === 'album') {
      const trimmedArtist = formData.value.artist.trim()
      if (trimmedArtist) cleanData.artist = trimmedArtist
    }
    if (formData.value.is_collaborative) {
      cleanData.is_collaborative = true
    }

    console.log('Creating collection with data:', cleanData)
    const response = await api.createCollection(cleanData)

    dataStore.addCollectionToCache(response.data)

    window.dispatchEvent(new CustomEvent('walkthrough:collection-created', {
      detail: { collectionId: response.data.id }
    }))

    uiStore.closeModal()
    router.push(`/collection/${response.data.id}`)
  } catch (err) {
    console.error('Create collection error:', err)
    error.value = err.response?.data?.detail || err.message || 'Failed to create collection'
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
  max-width: 500px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>