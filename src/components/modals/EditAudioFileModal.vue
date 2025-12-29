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
          <label class="form-label">Title *</label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Enter track title"
            required
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
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandling'

const uiStore = useUIStore()

const loading = ref(false)
const error = ref(null)

const formData = ref({
  id: null,
  title: '',
  description: '',
  is_public: false
})

onMounted(() => {
  if (uiStore.modalData) {
    formData.value = {
      id: uiStore.modalData.id,
      title: uiStore.modalData.title || '',
      description: uiStore.modalData.description || '',
      is_public: uiStore.modalData.is_public || false
    }
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const updateData = {
      title: formData.value.title,
      is_public: formData.value.is_public
    }

    if (formData.value.description) {
      updateData.description = formData.value.description
    }

    await api.updateAudioFile(formData.value.id, updateData)

    if (uiStore.modalData?.onSuccess) {
      await uiStore.modalData.onSuccess()
      uiStore.showNotification('Track Info(s) updated succesfully!')
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