<template>
  <div class="collaborators-inline">
    <div class="collaborators-row">
      <div class="collaborators-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Collaborators
      </div>

      <div class="collaborators-avatars">
        <div
          v-for="collaborator in collaborators.slice(0, 3)"
          :key="collaborator.user_id"
          class="collab-avatar"
          :title="collaborator.user?.username || collaborator.username || 'Unknown'"
        >
          <img
            v-if="collaborator.user?.profile_picture_url"
            :src="collaborator.user.profile_picture_url"
            :alt="collaborator.user?.username"
          />
          <div v-else class="collab-avatar-placeholder">
            {{ (collaborator.user?.username || collaborator.username || '?')[0].toUpperCase() }}
          </div>
        </div>
        <div v-if="collaborators.length > 3" class="collab-more">
          +{{ collaborators.length - 3 }}
        </div>
        <div v-if="collaborators.length === 0" class="no-collabs">
          None
        </div>
      </div>

      <button
        v-if="isOwner"
        class="btn-manage-collab"
        @click="showManageModal = true"
        title="Manage collaborators"
      >
        Manage
      </button>
      <button
        v-if="isOwner"
        class="btn-add-collab"
        @click="showAddModal = true"
        title="Add collaborator"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Collaborator</h2>
          <button class="modal-close" @click="closeModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">

        <div class="input-group">
          <label>User ID</label>
          <input
            v-model.number="userId"
            type="number"
            placeholder="Enter user ID"
            min="1"
          />
        </div>

        <div class="input-group">
          <label>Permission</label>
          <select v-model="permission">
            <option value="edit">Edit</option>
            <option value="view">View</option>
          </select>
        </div>

          <div v-if="addError" class="form-error">{{ addError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="handleAdd" :disabled="!userId || adding">
            {{ adding ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showManageModal" class="modal-overlay" @click.self="showManageModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Manage Collaborators</h2>
          <button class="modal-close" @click="showManageModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="collaborators.length === 0" class="empty-msg">
            No collaborators yet
          </div>

          <div v-else class="collab-list">
          <div
            v-for="collaborator in collaborators"
            :key="collaborator.user_id"
            class="collab-item"
          >
            <div class="collab-info">
              <div class="collab-name">{{ collaborator.user?.username || collaborator.username || 'Unknown' }}</div>
              <div class="collab-perm">{{ collaborator.permission_level }}</div>
            </div>
            <button
              v-if="isOwner"
              class="btn-remove"
              @click="handleRemove(collaborator.user_id)"
            >
              Remove
            </button>
          </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showManageModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as api from '@/services/api'
import { useUIStore } from '@/stores/ui'
import { getErrorMessage } from '@/utils/errorHandling'

const uiStore = useUIStore()

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true
  },
  collaborators: {
    type: Array,
    default: () => []
  },
  isOwner: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const showAddModal = ref(false)
const showManageModal = ref(false)
const userId = ref(null)
const permission = ref('edit')
const adding = ref(false)
const addError = ref(null)

async function handleAdd() {
  if (!userId.value) return

  adding.value = true
  addError.value = null

  try {
    await api.addCollaborator(props.collectionId, {
      user_id: userId.value,
      permission_level: permission.value
    })
    emit('refresh')
    closeModal()
  } catch (err) {
    console.error('Failed to add collaborator:', err)
    addError.value = getErrorMessage(err)
  } finally {
    adding.value = false
  }
}

function handleRemove(collabUserId) {
  const collaborator = props.collaborators.find(c => c.user_id === collabUserId)
  const username = collaborator?.user?.username || collaborator?.username || 'this user'

  uiStore.openModal('confirm', {
    title: 'Remove Collaborator',
    message: `Are you sure you want to remove ${username} from this collection?`,
    type: 'danger',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await api.removeCollaborator(props.collectionId, collabUserId)
        uiStore.showNotification('Collaborator removed successfully', 'success')
        emit('refresh')
      } catch (err) {
        console.error('Failed to remove collaborator:', err)
        uiStore.showNotification(getErrorMessage(err), 'error')
      }
    }
  })
}

function closeModal() {
  showAddModal.value = false
  userId.value = null
  permission.value = 'edit'
  addError.value = null
}
</script>

<style scoped>
.collaborators-inline {
  margin-top: 1rem;
}

.collaborators-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--border-light-10);
}

.collaborators-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.collaborators-avatars {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.collab-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--bg-container);
}

.collab-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collab-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.collab-more {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.no-collabs {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-manage-collab {
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-light-10);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-manage-collab:hover {
  background: var(--bg-surface-hover);
  color: var(--text-light);
}

.btn-add-collab {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-add-collab:hover {
  opacity: 0.9;
  transform: scale(1.05);
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
  padding: 24px;
  overflow-y: auto;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.875rem;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: var(--text-light);
}

.form-error {
  margin-top: 1rem;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius);
  color: #ef4444;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light-10);
}

.collab-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.collab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-surface);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.collab-info {
  flex: 1;
}

.collab-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.collab-perm {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.btn-remove {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: rgba(239, 68, 68, 0.1);
}

.empty-msg {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>