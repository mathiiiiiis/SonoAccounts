<template>
  <div id="app" :class="{ 'has-player': playerStore.hasTrack }">
    <RouterView v-if="isAuthRoute" />

    <template v-else>
      <AppHeader />

      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <AppPlayer v-if="playerStore.hasTrack" />
      <FullscreenPlayer v-if="playerStore.isFullscreenPlayer" />

      <ConsentModal v-if="authStore.needsConsent" />
      <Walkthrough v-if="authStore.isAuthenticated" />

      <CreateCollectionModal v-if="uiStore.activeModal === 'create'" />
      <EditCollectionModal v-if="uiStore.activeModal === 'edit-collection'" />
      <EditAudioFileModal v-if="uiStore.activeModal === 'edit-audio'" />
      <AddTracksModal v-if="uiStore.activeModal === 'add-tracks'" />
      <ConfirmModal
        v-if="uiStore.activeModal === 'confirm'"
        v-bind="uiStore.modalData"
        @confirm="handleConfirmModalConfirm"
        @cancel="handleConfirmModalCancel"
      />
    </template>

    <div v-if="uiStore.isGlobalLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ uiStore.loadingMessage }}</p>
    </div>

    <div class="notifications">
      <TransitionGroup name="notification">
        <div
          v-for="notification in uiStore.notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          @click="uiStore.removeNotification(notification.id)"
        >
          {{ notification.message }}
        </div>
      </TransitionGroup>
    </div>

    <audio ref="audioElement" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useUIStore } from '@/stores/ui'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPlayer from '@/components/layout/AppPlayer.vue'
import FullscreenPlayer from '@/components/layout/FullscreenPlayer.vue'
import ConsentModal from '@/components/modals/ConsentModal.vue'
import Walkthrough from '@/components/walkthrough/Walkthrough.vue'
import CreateCollectionModal from '@/components/modals/CreateCollectionModal.vue'
import EditCollectionModal from '@/components/modals/EditCollectionModal.vue'
import EditAudioFileModal from '@/components/modals/EditAudioFileModal.vue'
import AddTracksModal from '@/components/modals/AddTracksModal.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const route = useRoute()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const uiStore = useUIStore()

const audioElement = ref(null)

const isAuthRoute = computed(() => {
  return route.name === 'Login' || route.name === 'Register'
})

onMounted(() => {
  //"start" audio player
  if (audioElement.value) {
    playerStore.setAudioElement(audioElement.value)
  }
})

function handleConfirmModalConfirm() {
  const callback = uiStore.modalData?.onConfirm
  uiStore.closeModal()
  if (callback && typeof callback === 'function') {
    callback()
  }
}

function handleConfirmModalCancel() {
  const { onCancel } = uiStore.modalData || {}
  if (onCancel && typeof onCancel === 'function') {
    onCancel()
  }
  uiStore.closeModal()
}
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: var(--header-height);
}

#app.has-player .app-main {
  padding-bottom: 112px;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notifications {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  padding: 16px 20px;
  border-radius: var(--border-radius);
  background: var(--bg-container);
  box-shadow: var(--shadow-xl);
  cursor: pointer;
  border-left: 4px solid;
  font-size: 14px;
  line-height: 1.5;
}

.notification-success {
  border-left-color: var(--success-border);
  background: var(--success-bg);
  color: var(--success-text);
}

.notification-error {
  border-left-color: var(--error-border);
  background: var(--error-bg);
  color: var(--error-text);
}

.notification-warning {
  border-left-color: var(--warning-border);
  background: var(--warning-bg);
  color: var(--warning-text);
}

.notification-info {
  border-left-color: var(--info-border);
  background: var(--info-bg);
  color: var(--info-text);
}

.notification-enter-active,
.notification-leave-active {
  transition: all var(--transition-normal);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

@media (max-width: 768px) {
  .notifications {
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-width: none;
  }
}
</style>