<template>
  <header class="app-header" :class="{ 'header-visible': isHeaderVisible }">
    <div class="header-left">
      <router-link to="/" class="logo">
        <span class="logo-text">SonoWeb</span>
      </router-link>

      <div v-if="authStore.hasPendingDeletion && authStore.deletionStatus" class="deletion-warning">
        <button class="warning-toggle" @click="showDeletionDropdown = !showDeletionDropdown">
          Account deletion in {{ daysRemaining }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div v-if="showDeletionDropdown" class="deletion-dropdown">
          <div class="dropdown-content">
            <p>Your account will be deleted soon. You can cancel anytime.</p>
            <div class="dropdown-actions">
              <router-link to="/settings/deletion-status" class="btn-details" @click="showDeletionDropdown = false">
                View Details
              </router-link>
              <button class="btn-cancel-deletion" @click="handleCancelDeletion" :disabled="cancelLoading">
                {{ cancelLoading ? 'Canceling...' : 'Cancel Deletion' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="header-right">
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('create')" data-walkthrough="create-button">
        Create
      </button>

      <button v-if="authStore.user?.is_superuser" class="btn btn-secondary btn-sm" @click="$router.push('/admin')" title="Admin Panel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.5 12c0-.23-.01-.45-.03-.68l1.86-1.41c.4-.3.51-.86.26-1.3l-1.87-3.23c-.25-.44-.79-.62-1.25-.42l-2.15.91c-.37-.26-.76-.49-1.17-.68l-.29-2.31c-.06-.5-.49-.88-.99-.88h-3.73c-.51 0-.94.38-1 .88l-.29 2.31c-.41.19-.8.42-1.17.68l-2.15-.91c-.46-.2-1-.02-1.25.42L2.41 8.62c-.25.44-.14.99.26 1.3l1.86 1.41c-.02.22-.03.44-.03.67s.01.45.03.68l-1.86 1.41c-.4.3-.51.86-.26 1.3l1.87 3.23c.25.44.79.62 1.25.42l2.15-.91c.37.26.76.49 1.17.68l.29 2.31c.06.5.49.88.99.88h3.73c.5 0 .93-.38.99-.88l.29-2.31c.41-.19.8-.42 1.17-.68l2.15.91c.46.2 1 .02 1.25-.42l1.87-3.23c.25-.44.14-.99-.26-1.3l-1.86-1.41c.03-.23.04-.45.04-.68"/>
        </svg>
        Admin
      </button>


      <button class="btn-icon btn-ghost" @click="$router.push('/search')" title="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>

      <button class="btn-icon btn-ghost" @click="$router.push('/news')" title="News">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
        </svg>
      </button>

      <div class="user-menu" @click="goToProfile" data-walkthrough="profile">
        <img
          v-if="authStore.user?.profile_picture_url"
          :src="authStore.user.profile_picture_url"
          alt="Profile"
          class="user-avatar"
        />
        <div v-else class="user-avatar-placeholder">
          {{ authStore.user?.display_name?.[0] || authStore.user?.username?.[0] || 'U' }}
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandling'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const isHeaderVisible = ref(false)
const showDeletionDropdown = ref(false)
const cancelLoading = ref(false)
let mainElement = null

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

async function handleCancelDeletion() {
  cancelLoading.value = true

  try {
    await api.cancelAccountDeletion()
    uiStore.showNotification('Account deletion canceled!', 'success')
    await authStore.checkDeletionStatus()
    showDeletionDropdown.value = false
  } catch (err) {
    console.error('Failed to cancel deletion:', err)
    const errorMsg = getErrorMessage(err, 'Failed to cancel account deletion')
    uiStore.showNotification(errorMsg, 'error')
  } finally {
    cancelLoading.value = false
  }
}

function handleScroll() {
  const scrollTop = mainElement?.scrollTop || 0

  if (scrollTop > 50) {
    isHeaderVisible.value = true
  } else {
    isHeaderVisible.value = false
  }
}

function goToProfile() {
  router.push('/profile')
}

onMounted(() => {
  mainElement = document.querySelector('.app-main')
  
  if (mainElement) {
    mainElement.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  } else {
    console.error('.app-main not found!')
  }
})

onUnmounted(() => {
  if (mainElement) {
    mainElement.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.app-header {
  height: var(--header-height);
  background: transparent;
  border-bottom: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.app-header.header-visible {
  background: rgb(36, 36, 36);
  backdrop-filter: blur(12px);
  border-bottom-color: var(--border-light-10);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.deletion-warning {
  position: relative;
  margin-left: 16px;
}

.warning-toggle {
  padding: 6px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  font-size: 13px;
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.warning-toggle:hover {
  background: var(--bg-surface-hover);
}

.warning-toggle svg {
  transition: transform 0.2s;
}

.deletion-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 320px;
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
}

.dropdown-content {
  padding: 16px;
}

.dropdown-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.dropdown-actions {
  display: flex;
  gap: 8px;
}

.btn-details {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  transition: background 0.2s;
}

.btn-details:hover {
  background: var(--bg-surface-hover);
}

.btn-cancel-deletion {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
  background: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel-deletion:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-cancel-deletion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  text-decoration: none;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 600;
  color: var(--text-light);
}

.main-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--text-light);
  background: var(--bg-surface);
}

.nav-link.router-link-active {
  color: var(--text-light);
  background: var(--bg-surface-hover);
}

.user-menu {
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.user-menu:hover {
  transform: scale(1.05);
}

.user-avatar,
.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-light);
  font-size: 14px;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .main-nav {
    display: none;
  }

  .app-header {
    padding: 0 16px;
  }

  .header-right {
    gap: 8px;
  }

  .header-right .btn-primary {
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    position: relative;
    overflow: hidden;
    text-indent: -9999px;
  }

  .header-right .btn-primary::before {
    content: '+';
    font-size: 20px;
    font-weight: 400;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-indent: 0;
  }

  .header-right .btn-secondary {
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    position: relative;
    overflow: hidden;
    text-indent: -9999px;
  }

  .header-right .btn-secondary svg {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
  }
}

@media (min-width: 600px) and (max-width: 768px) {
  .header-right .btn-primary {
    width: auto;
    padding: 8px 16px;
    text-indent: 0;
    overflow: visible;
  }

  .header-right .btn-primary::before {
    display: none;
  }
}
</style>