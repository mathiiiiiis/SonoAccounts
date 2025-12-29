<template>
  <div class="page profile-page">
    <div class="page-header">
      <h1 class="page-title">Profile & Settings</h1>
    </div>

    <div class="profile-content">
      <div class="profile-section">
        <h2 class="section-title">Profile Information</h2>

        <div class="profile-avatar-section">
          <div class="avatar-preview">
            <img
              v-if="authStore.user?.profile_picture_url"
              :src="authStore.user.profile_picture_url"
              alt="Profile"
              class="avatar-image"
            />
            <div v-else class="avatar-placeholder">
              {{ authStore.user?.display_name?.[0] || authStore.user?.username?.[0] || 'U' }}
            </div>
          </div>
          <div class="avatar-actions">
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              @change="handleFileSelect"
              style="display: none"
            />
            <button class="btn btn-secondary btn-sm" @click="$refs.fileInput.click()">
              Change Avatar
            </button>
            <p class="avatar-hint">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">User ID</label>
            <input type="text" :value="authStore.user?.id" disabled class="form-input-disabled" />
            <p class="form-hint">Your unique user ID for sharing with collaborators</p>
          </div>

          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" :value="authStore.user?.username" disabled class="form-input-disabled" />
            <p class="form-hint">Username cannot be changed</p>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" :value="authStore.user?.email" disabled class="form-input-disabled" />
            <p class="form-hint">Email cannot be changed</p>
          </div>

          <div class="form-group">
            <label class="form-label">Display Name (optional)</label>
            <input
              v-model="profileForm.display_name"
              type="text"
              placeholder="Your display name (optional)"
              maxlength="50"
            />
            <p class="form-hint">Leave blank to use your username</p>
          </div>

          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea
              v-model="profileForm.bio"
              placeholder="Tell us about yourself..."
              rows="4"
              maxlength="280"
            ></textarea>
            <p class="form-hint">{{ profileForm.bio?.length || 0 }}/280 characters</p>
          </div>

          <div v-if="profileError" class="form-error">{{ profileError }}</div>

          <button
            class="btn btn-primary"
            @click="saveProfile"
            :disabled="profileLoading"
          >
            {{ profileLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="profile-section">
        <h2 class="section-title">Account</h2>

        <div v-if="authStore.user?.deletion_requested_at" class="deletion-warning">
          <div class="warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
          </div>
          <div class="warning-content">
            <h3>Account deletion Scheduled</h3>
            <p>Your account is scheduled for deletion. You can cancel this request within 7 days.</p>
            <p class="deletion-date">Requested: {{ formatDate(authStore.user.deletion_requested_at) }}</p>
          </div>
          <button class="btn btn-primary" @click="handleCancelDeletion" :disabled="cancelLoading">
            {{ cancelLoading ? 'Canceling...' : 'Cancel Anonymization' }}
          </button>
        </div>

        <div class="account-actions">
          <div class="account-item">
            <div class="account-info">
              <h3>Upload Limit</h3>
              <p>{{ uploadStats?.used_uploads || 0 }} of {{ uploadStats?.max_uploads || 20 }} uploads used</p>
            </div>
            <div class="upload-mini-bar">
              <div class="upload-mini-fill" :style="{ width: uploadProgressPercent + '%' }"></div>
            </div>
          </div>

          <div class="account-item">
            <div class="account-info">
              <h3>Manage Songs</h3>
              <p>Edit or delete your uploaded songs</p>
            </div>
            <button class="btn btn-secondary" @click="openManageSongs">
              Manage
            </button>
          </div>

          <div class="account-item">
            <div class="account-info">
              <h3>Sign Out</h3>
              <p>Log out of your account on this device</p>
            </div>
            <button class="btn btn-secondary" @click="handleLogout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2 class="section-title">Data & Privacy</h2>

        <div class="gdpr-actions">
          <div class="gdpr-item">
            <div class="gdpr-info">
              <h3>Export Your Data</h3>
              <p>Download all your personal data in JSON format</p>
            </div>
            <button class="btn btn-secondary" @click="exportData" :disabled="exportLoading">
              {{ exportLoading ? 'Exporting...' : 'Export Data' }}
            </button>
          </div>

          <div class="gdpr-item">
            <div class="gdpr-info">
              <h3>View Consents</h3>
              <p>See your consent history for Terms and Privacy Policy</p>
            </div>
            <button class="btn btn-secondary" @click="showConsents = !showConsents">
              {{ showConsents ? 'Hide' : 'View' }} Consents
            </button>
          </div>

          <div v-if="showConsents && authStore.consents.length > 0" class="consents-list">
            <div v-for="consent in authStore.consents" :key="consent.id" class="consent-item">
              <div class="consent-type">{{ formatConsentType(consent.consent_type) }}</div>
              <div class="consent-details">
                <span>Version {{ consent.consent_version }}</span>
                <span>•</span>
                <span>{{ formatDate(consent.given_at) }}</span>
                <span :class="['consent-status', consent.is_active ? 'active' : 'inactive']">
                  {{ consent.is_active ? 'Active' : 'Withdrawn' }}
                </span>
              </div>
            </div>
          </div>

          <div class="gdpr-item danger-zone">
            <div class="gdpr-info">
              <h3>Delete Account</h3>
              <p>Request a deletion of your Account</p>
            </div>
            <button class="btn btn-danger" @click="confirmDelete = true">
              Request Deletion
            </button>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2 class="section-title">Help & Resources</h2>

        <div class="help-actions">
          <button class="help-item" @click="restartWalkthrough">
            <div class="help-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
            </div>
            <div class="help-info">
              <span class="help-title">Restart Walkthrough</span>
              <span class="help-desc">Take the tour again</span>
            </div>
          </button>

          <a href="https://discord.sono.wtf" target="_blank" rel="noopener noreferrer" class="help-item">
            <div class="help-icon discord">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div class="help-info">
              <span class="help-title">Discord Community</span>
              <span class="help-desc">Get help & chat</span>
            </div>
          </a>

          <a href="https://ko-fi.com/mathiiis" target="_blank" rel="noopener noreferrer" class="help-item">
            <div class="help-icon kofi">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
              </svg>
            </div>
            <div class="help-info">
              <span class="help-title">Support Us</span>
              <span class="help-desc">Buy us a coffee</span>
            </div>
          </a>
        </div>

        <div class="legal-links">
          <router-link to="/credits">Credits</router-link>
          <span class="separator">·</span>
          <a href="https://sono.wtf/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
          <span class="separator">·</span>
          <a href="https://sono.wtf/terms" target="_blank" rel="noopener noreferrer">Terms</a>
        </div>
      </div>
    </div>

    <ImageCropperModal
      v-if="showCropper"
      :image="selectedImage"
      @save="handleCroppedImage"
      @cancel="closeCropper"
    />

    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = false">
      <div class="modal delete-modal">
        <div class="modal-header">
          <h2>⚠️ Request Account Deletion</h2>
        </div>
        <div class="modal-body">

          <div class="deletion-info-section">
            <div class="deletion-info-box">
              <div class="info-content">
                <p class="info-note">
                  <strong>Need complete data removal?</strong> For hard deletion (permanent removal of all data),
                  please contact us at <a href="mailto:business@mathiiis.de">business@mathiiis.de</a>
                </p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reason for deletion request? (optional)</label>
            <textarea
              v-model="deleteReason"
              placeholder="Help us improve by telling us why you're leaving..."
              rows="3"
              maxlength="500"
            ></textarea>
            <p class="char-count">{{ deleteReason.length }}/500</p>
          </div>

          <div class="confirmation-section">
            <label class="form-label">Type <strong>DELETE</strong> to confirm</label>
            <input
              v-model="deleteConfirmation"
              type="text"
              placeholder="DELETE"
              class="confirmation-input"
              autocomplete="off"
            />
          </div>
          <div v-if="deleteError" class="form-error">{{ deleteError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button
            class="btn btn-danger"
            @click="deleteAccount"
            :disabled="deleteLoading || deleteConfirmation !== 'DELETE'"
          >
            {{ deleteLoading ? 'Processing...' : 'Request Deletion' }}
          </button>
        </div>
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
import ImageCropperModal from '@/components/modals/ImageCropperModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const profileForm = ref({
  display_name: '',
  bio: ''
})

const profileLoading = ref(false)
const profileError = ref(null)
const uploadStats = ref(null)
const exportLoading = ref(false)
const showConsents = ref(false)
const confirmDelete = ref(false)
const deleteReason = ref('')
const deleteConfirmation = ref('')
const deleteLoading = ref(false)
const deleteError = ref(null)
const cancelLoading = ref(false)
const fileInput = ref(null)
const showCropper = ref(false)
const selectedImage = ref(null)

const uploadProgressPercent = computed(() => {
  if (!uploadStats.value) return 0
  const used = uploadStats.value.used_uploads || 0
  const max = uploadStats.value.max_uploads || 20
  return (used / max) * 100
})

onMounted(async () => {
  if (authStore.user) {
    profileForm.value.display_name = authStore.user.display_name || ''
    profileForm.value.bio = authStore.user.bio || ''
  }

  try {
    const response = await api.getUploadStats()
    uploadStats.value = response.data
  } catch (err) {
    console.error('Failed to load upload stats:', err)
  }
})

async function saveProfile() {
  profileLoading.value = true
  profileError.value = null

  try {
    const updateData = {}
    const trimmedDisplayName = profileForm.value.display_name?.trim()
    if (trimmedDisplayName) {
      updateData.display_name = trimmedDisplayName
    } else {
      updateData.display_name = null
    }

    const trimmedBio = profileForm.value.bio?.trim()
    if (trimmedBio) {
      updateData.bio = trimmedBio
    } else {
      updateData.bio = null
    }

    await authStore.updateProfile(updateData)
  } catch (err) {
    console.error('Failed to update profile:', err)
    profileError.value = getErrorMessage(err, 'Failed to update profile')
  } finally {
    profileLoading.value = false
  }
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  event.target.value = ''

  if (file.size > 5 * 1024 * 1024) {
    uiStore.showNotification('File size must be less than 5MB', 'error')
    return
  }

  if (!file.type.startsWith('image/')) {
    uiStore.showNotification('Please select an image file', 'error')
    return
  }

  selectedImage.value = file
  showCropper.value = true
}

async function handleCroppedImage(croppedFile) {
  showCropper.value = false
  selectedImage.value = null

  try {
    await authStore.uploadProfilePicture(croppedFile)
  } catch (err) {
    console.error('Failed to upload profile picture:', err)
    const errorMsg = getErrorMessage(err, 'Failed to upload profile picture')
    uiStore.showNotification(errorMsg, 'error')
  }
}

function closeCropper() {
  showCropper.value = false
  selectedImage.value = null
}

async function exportData() {
  exportLoading.value = true

  try {
    const response = await api.exportUserData()
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sonoweb-data-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

  } catch (err) {
    console.error('Failed to export data:', err)
    uiStore.showNotification('Failed to export data', 'error')
  } finally {
    exportLoading.value = false
  }
}

function restartWalkthrough() {
  localStorage.removeItem('hasSeenWalkthrough')
  setTimeout(() => {
    router.push('/')
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }, 500)
}

async function deleteAccount() {
  if (deleteConfirmation.value !== 'DELETE') {
    deleteError.value = 'Please type DELETE to confirm'
    return
  }

  deleteLoading.value = true
  deleteError.value = null

  try {
    await api.requestAccountDeletion({
      deletion_type: 'soft',
      reason: deleteReason.value || undefined
    })

    closeDeleteModal()

    await authStore.checkDeletionStatus()

    router.push('/settings/deletion-status')
  } catch (err) {
    console.error('Failed to request account deletion:', err)
    deleteError.value = err.response?.data?.detail || 'Failed to request account deletion'
  } finally {
    deleteLoading.value = false
  }
}

function closeDeleteModal() {
  confirmDelete.value = false
  deleteReason.value = ''
  deleteConfirmation.value = ''
  deleteError.value = null
}

function formatConsentType(type) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('Logout failed:', err)
    uiStore.showNotification('Failed to logout', 'error')
  }
}

async function handleCancelDeletion() {
  cancelLoading.value = true

  try {
    await api.cancelAccountDeletion()
    uiStore.showNotification('Account deletion request canceled successfully!', 'success')

    await authStore.checkDeletionStatus()
    await authStore.fetchCurrentUser()
  } catch (err) {
    console.error('Failed to cancel deletion:', err)
    const errorMsg = getErrorMessage(err, 'Failed to cancel account deletion')
    uiStore.showNotification(errorMsg, 'error')
  } finally {
    cancelLoading.value = false
  }
}

function openManageSongs() {
  uiStore.openModal('manage-songs')
}
</script>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-section {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  padding: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light-10);
}

.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.avatar-preview {
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 600;
  color: var(--text-light);
  text-transform: uppercase;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-input-disabled {
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.upload-stats {
  background: var(--bg-surface);
  padding: 24px;
  border-radius: var(--border-radius);
}

.upload-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.upload-stats-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.upload-stats-count {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
}

.upload-progress-bar {
  height: 12px;
  background: var(--bg-container);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.upload-progress-fill {
  height: 100%;
  background: var(--primary-light);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.upload-stats-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-stats-remaining {
  font-size: 13px;
  color: var(--text-secondary);
}

.account-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  gap: 24px;
}

.account-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 4px 0;
}

.account-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stat-card {
  background: var(--bg-surface);
  padding: 20px;
  border-radius: var(--border-radius);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gdpr-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gdpr-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  gap: 24px;
}

.gdpr-item.danger-zone {
  border: 1px solid var(--error-border);
  background: var(--error-bg);
}

.gdpr-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 4px 0;
}

.gdpr-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.consents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.consent-item {
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--text-light);
}

.consent-type {
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 4px;
}

.consent-details {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.consent-status {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.consent-status.active {
  background: var(--success-bg);
  color: var(--success-text);
}

.consent-status.inactive {
  background: var(--error-bg);
  color: var(--error-text);
}

.resource-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.resource-link:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-light-10);
  transform: translateX(4px);
}

.resource-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  background: var(--bg-container);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  flex-shrink: 0;
}

.discord-icon {
  color: #5865F2;
  background: rgba(88, 101, 242, 0.1);
}

.kofi-icon {
  color: #FF5E5B;
  background: rgba(255, 94, 91, 0.1);
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 2px;
}

.resource-description {
  font-size: 13px;
  color: var(--text-secondary);
}

.resource-arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.resource-link:hover .resource-arrow {
  transform: translate(4px, -4px);
}

.deletion-warning {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--border-radius);
  margin-bottom: 24px;
}

.warning-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.15);
  color: rgb(245, 158, 11);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 8px 0;
}

.warning-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.deletion-date {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.delete-modal .modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 24px;
  border-bottom: 1px solid var(--border-light-10);
}

.delete-modal .modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.delete-modal .modal-body {
  padding: 24px;
  overflow-y: auto;
}

.delete-modal .modal-body p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.delete-modal .modal-body p strong {
  color: rgb(255, 255, 255);
  font-weight: 600;
}

.delete-modal .modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light-10);
  background: var(--bg-surface);
}

.delete-modal .modal-footer .btn {
  flex: 1;
}

.deletion-info-section {
  margin-bottom: 24px;
}

.deletion-info-box {
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  padding: 20px;
  padding-top: 5px;
  padding-bottom: 5px;
  display: flex;
  border: 1px solid var(--border-light-10);
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-note {
  padding-top: 12px;
  font-size: 12px;
}

.info-note strong {
  color: var(--text-light);
  display: block;
  margin-bottom: 4px;
}

.info-note a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.info-note a:hover {
  text-decoration: underline;
}

.char-count {
  font-size: 11px;
  color: var(--text-tertiary);
  margin: 4px 0 0 0;
  text-align: right;
}

.confirmation-section {
  margin-bottom: 20px;
}

.confirmation-input {
  width: 100%;
  padding: 12px;
  background: var(--bg-surface);
  border: 2px solid var(--border-light-10);
  border-radius: var(--border-radius);
  color: var(--text-light);
  font-size: 14px;
  font-family: monospace;
  letter-spacing: 2px;
  text-align: center;
  transition: all 0.2s ease;
}

.confirmation-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-container);
}

.confirmation-input::placeholder {
  letter-spacing: 2px;
  opacity: 0.5;
}

.upload-mini-bar {
  width: 120px;
  height: 8px;
  background: var(--bg-container);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.upload-mini-fill {
  height: 100%;
  background: var(--primary-light);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.help-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.help-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  cursor: pointer;
  text-align: center;
}

button.help-item {
  font-family: inherit;
  font-size: inherit;
}

.help-item:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-light-10);
  transform: translateY(-2px);
}

.help-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius);
  background: var(--bg-container);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.help-icon.discord {
  color: #5865F2;
  background: rgba(88, 101, 242, 0.1);
}

.help-icon.kofi {
  color: #FF5E5B;
  background: rgba(255, 94, 91, 0.1);
}

.help-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.help-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.help-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.legal-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light-10);
}

.legal-links a {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.legal-links a:hover {
  color: var(--text-light);
}

.legal-links .separator {
  color: var(--text-tertiary);
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-section {
    padding: 24px 20px;
  }

  .profile-avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .avatar-actions {
    align-items: center;
  }

  .deletion-warning {
    flex-direction: column;
    text-align: center;
  }

  .deletion-warning .btn {
    width: 100%;
  }

  .gdpr-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .gdpr-item button {
    width: 100%;
  }

  .help-actions {
    grid-template-columns: 1fr;
  }

  .help-item {
    flex-direction: row;
    text-align: left;
    padding: 16px;
  }

  .help-info {
    align-items: flex-start;
  }

  .account-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .account-item button {
    width: 100%;
  }

  .upload-mini-bar {
    width: 100%;
  }
}
</style>