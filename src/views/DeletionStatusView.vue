<template>
  <div class="page deletion-status-page">
    <div class="deletion-content">
      <div v-if="authStore.deletionStatus?.has_pending_deletion" class="status-container">
        <div class="page-header">
          <h1>Account Deletion</h1>
        </div>

        <div class="info-card">
          <div class="info-row">
            <span class="label">Time Remaining</span>
            <span class="value large">{{ daysRemaining }} {{ daysLabel }}</span>
          </div>
          <div class="info-row">
            <span class="label">Deletion Date</span>
            <span class="value">{{ formatFullDate(authStore.deletionStatus.scheduled_deletion_at) }}</span>
          </div>
          <div v-if="authStore.deletionStatus.reason" class="info-row">
            <span class="label">Reason</span>
            <span class="value">{{ authStore.deletionStatus.reason }}</span>
          </div>
        </div>

        <div class="info-section">
          <h2>What Happens</h2>
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">
              <strong>Now</strong> - Your account is active. You can cancel anytime.
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">
              <strong>After deletion</strong> - Your data is anonymized. Username becomes "deleted_user_X", email replaced. Files remain but unlinked.
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" @click="handleCancelDeletion" :disabled="cancelLoading">
            {{ cancelLoading ? 'Canceling...' : 'Cancel Deletion' }}
          </button>
          <router-link to="/profile" class="btn-secondary">
            Back to Settings
          </router-link>
        </div>
      </div>

      <div v-else class="no-deletion-container">
        <h2>No Pending Deletion</h2>
        <p>Your account is active.</p>
        <router-link to="/profile" class="btn-secondary">
          Back to Settings
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandling'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const cancelLoading = ref(false)

const daysRemaining = computed(() => {
  if (!authStore.deletionStatus?.days_remaining) return 0
  const days = authStore.deletionStatus.days_remaining
  if (days < 1) {
    return Math.floor(days * 24)
  }
  return Math.floor(days)
})

const daysLabel = computed(() => {
  const days = authStore.deletionStatus?.days_remaining || 0
  if (days < 1) {
    const hours = daysRemaining.value
    return hours === 1 ? 'Hour' : 'Hours'
  }
  return daysRemaining.value === 1 ? 'Day' : 'Days'
})

function formatFullDate(dateString) {
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

    router.push('/profile')
  } catch (err) {
    console.error('Failed to cancel deletion:', err)
    const errorMsg = getErrorMessage(err, 'Failed to cancel account deletion')
    uiStore.showNotification(errorMsg, 'error')
  } finally {
    cancelLoading.value = false
  }
}

onMounted(async () => {
  await authStore.checkDeletionStatus()
})
</script>

<style scoped>
.deletion-status-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 40px 20px;
}

.deletion-content {
  padding: 0;
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 24px 0;
}

.info-card {
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row .label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row .value {
  font-size: 14px;
  color: var(--text-light);
}

.info-row .value.large {
  font-size: 28px;
  font-weight: 600;
}

.info-section {
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.info-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 16px 0;
}

.step {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.step:last-child {
  margin-bottom: 0;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.step-text strong {
  color: var(--text-light);
}

.actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.btn-cancel {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
  background: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.btn-cancel:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  text-decoration: none;
  display: inline-block;
}

.btn-secondary:hover {
  background: var(--bg-surface);
}

.no-deletion-container {
  padding: 60px 20px;
  text-align: center;
}

.no-deletion-container h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 12px 0;
}

.no-deletion-container p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-secondary {
    width: 100%;
    text-align: center;
  }
}
</style>