<template>
  <div v-if="authStore.hasPendingDeletion && authStore.deletionStatus" class="deletion-banner">
    <div class="banner-content">
      <div class="banner-message">
        <span>Account deletion in <strong>{{ daysRemaining }}</strong></span>
      </div>
      <div class="banner-actions">
        <router-link to="/settings/deletion-status" class="btn-link">
          View Details
        </router-link>
        <button class="btn-cancel" @click="handleCancelDeletion" :disabled="cancelLoading">
          {{ cancelLoading ? 'Canceling...' : 'Cancel Deletion' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandling'

const authStore = useAuthStore()
const uiStore = useUIStore()
const cancelLoading = ref(false)

const daysRemaining = computed(() => {
  if (!authStore.deletionStatus?.days_remaining) return '0 days'

  const days = authStore.deletionStatus.days_remaining
  if (days < 1) {
    const hours = Math.floor(days * 24)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const wholeDays = Math.floor(days)
  return `${wholeDays} day${wholeDays !== 1 ? 's' : ''}`
})

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleCancelDeletion() {
  cancelLoading.value = true

  try {
    await api.cancelAccountDeletion()
    uiStore.showNotification('Account deletion canceled successfully!', 'success')

    await authStore.checkDeletionStatus()
  } catch (err) {
    console.error('Failed to cancel deletion:', err)
    const errorMsg = getErrorMessage(err, 'Failed to cancel account deletion')
    uiStore.showNotification(errorMsg, 'error')
  } finally {
    cancelLoading.value = false
  }
}
</script>

<style scoped>
.deletion-banner {
  background: rgba(245, 158, 11, 0.15);
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
  backdrop-filter: blur(8px);
  padding: 14px 24px;
}

.banner-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.banner-message {
  flex: 1;
  font-size: 14px;
  color: var(--text-secondary);
}

.banner-message strong {
  font-weight: 600;
  color: var(--text-light);
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-link {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-light);
  text-decoration: none;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.btn-link:hover {
  background: rgba(0, 0, 0, 0.15);
}

.btn-cancel {
  padding: 8px 18px;
  border-radius: var(--border-radius);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  background: white;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .banner-actions {
    width: 100%;
  }

  .btn-link,
  .btn-cancel {
    flex: 1;
    text-align: center;
  }
}
</style>