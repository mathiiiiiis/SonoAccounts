<template>
  <Teleport to="body">
    <div v-if="isActive" class="walkthrough-system">
      <div v-if="isWelcomeStep" class="welcome-modal-overlay">
        <div class="welcome-modal">
          <button class="welcome-close" @click="skip" title="Skip Tour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="welcome-content">
            <div class="welcome-icon">
              <img src="@/assets/app-logo.svg" alt="SonoWeb Logo" width="80" height="80" />
            </div>
            <h2>{{ currentStepData.title }}</h2>
            <p>{{ currentStepData.description }}</p>
          </div>

          <div class="welcome-footer">
            <div class="progress-dots">
              <span
                v-for="(step, index) in steps"
                :key="index"
                class="progress-dot"
                :class="{ active: index === currentStep, completed: index < currentStep }"
              ></span>
            </div>

            <div class="welcome-actions">
              <button class="btn-tooltip btn-ghost" @click="skip">
                Skip Tour
              </button>
              <button class="btn-tooltip btn-primary" @click="next">
                Let's Start
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!isWelcomeStep && !currentStepData?.interactive"
        class="walkthrough-backdrop"
      ></div>

      <div
        v-if="!isWelcomeStep && currentStepData?.target && !isModalOpen"
        class="walkthrough-spotlight"
        :style="spotlightStyle"
      ></div>

      <div v-if="isPlayerStep" class="placeholder-player" data-walkthrough="player">
        <div class="player-track-info">
          <div class="player-artwork">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div class="player-text">
            <div class="player-title">Sample Track</div>
            <div class="player-artist">Sample Artist</div>
          </div>
        </div>
        <div class="player-controls">
          <button class="player-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button class="player-btn player-btn-main">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button class="player-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>
        <div class="player-volume">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </div>
      </div>

      <div
        v-if="currentStepData && !isWelcomeStep"
        class="walkthrough-notification"
        :class="{
          'interactive': currentStepData?.interactive,
          'collapsed': isCollapsed,
          'bottom-positioned': isHeaderTargetStep
        }"
      >
        <div v-if="isCollapsed" class="collapsed-banner" @click="toggleCollapse">
          <div class="banner-content">
            <div class="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="banner-text-container">
              <span class="banner-text">Tour in progress • Step {{ currentStep + 1 }}/{{ steps.length }}</span>
              <span class="banner-hint">Click to expand</span>
            </div>
          </div>
          <div class="banner-actions">
            <button class="banner-expand" @click.stop="toggleCollapse" title="Expand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <button class="banner-close" @click.stop="skip" title="Skip Tour">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <template v-else>
          <div class="tooltip-header">
            <span class="step-indicator">Step {{ currentStep + 1 }} of {{ steps.length }}</span>
            <div class="tooltip-header-actions">
              <button class="tooltip-collapse" @click="toggleCollapse" title="Minimize">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 15l7-7 7 7"/>
                </svg>
              </button>
              <button class="tooltip-close" @click="skip" title="Skip Tour">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="tooltip-content">
            <div v-if="currentStepData.icon" class="tooltip-icon">
              <component :is="currentStepData.icon" />
            </div>
            <div v-if="currentStepData.interactive && waitingForAction" class="action-indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <span>Complete this action to continue</span>
            </div>
            <h3>{{ currentStepData.title }}</h3>
            <p>{{ currentStepData.description }}</p>
          </div>

          <div class="tooltip-footer">
            <div class="progress-dots">
              <span
                v-for="(step, index) in steps"
                :key="index"
                class="progress-dot"
                :class="{ active: index === currentStep, completed: index < currentStep }"
              ></span>
            </div>

            <div class="tooltip-actions">
              <button
                v-if="currentStep > 0"
                class="btn-tooltip btn-secondary"
                @click="previous"
              >
                Back
              </button>
              <button
                class="btn-tooltip btn-ghost"
                @click="skip"
              >
                Skip
              </button>
              <button
                v-if="currentStep < steps.length - 1"
                class="btn-tooltip btn-primary"
                @click="next"
                :disabled="!canAdvance"
              >
                {{ waitingForAction ? 'Waiting...' : 'Next' }}
              </button>
              <button
                v-else
                class="btn-tooltip btn-primary"
                @click="finish"
              >
                Finish Tour
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const uiStore = useUIStore()
const router = useRouter()

const isActive = ref(false)
const currentStep = ref(0)
const spotlightRect = ref(null)
const waitingForAction = ref(false)
const tutorialCollectionId = ref(null)
const isModalOpen = ref(false)
const isCollapsed = ref(false)

const steps = [
  {
    title: 'Welcome to Sono Web!',
    description: 'Let\'s take a hands-on tour! We\'ll create a test collection together, explore its features, then clean it up. Everything you do here is real, so you\'ll learn by doing!',
    icon: null,
    target: null,
    interactive: false
  },
  {
    title: 'Create Your First Collection',
    description: 'Click the "Create" button to start. We\'ll make a test collection together.',
    target: '[data-walkthrough="create-button"]',
    action: null,
    interactive: true,
    requiredAction: 'open-create-modal'
  },
  {
    title: 'Fill Out the Details',
    description: 'Give your collection a name like "My Test Album", choose Album as the type, and decide if it should be public or private. Then click Create!',
    target: null,
    action: null,
    interactive: true,
    requiredAction: 'create-collection'
  },
  {
    title: 'Collection Details',
    description: 'This is your collection page! From here you can add tracks, edit details, manage collaborators, and more.',
    target: null,
    action: null,
    interactive: false
  },
  {
    title: 'Adding Music',
    description: 'Click this button to upload audio files from your device. Supported formats include MP3, FLAC, WAV, and more. You can also drag and drop files directly onto the page.',
    target: '[data-walkthrough="upload-tracks"]',
    action: null,
    interactive: false
  },
  {
    title: 'Music Player',
    description: 'When you play music, it appears here. Try playing any track from your collections! On mobile, swipe up for fullscreen mode with artwork and lyrics.',
    target: '[data-walkthrough="player"]',
    action: null,
    interactive: false
  },
  {
    title: 'Your Profile',
    description: 'Access settings, check storage, and manage your account here. You can restart this tour anytime from the profile page!',
    target: '[data-walkthrough="profile"]',
    action: null,
    interactive: false
  },
  {
    title: 'You\'re All Set!',
    description: 'You now know how to create, manage, and delete collections. Start building your real music library and enjoy!',
    target: null,
    icon: null,
    action: null,
    interactive: false
  }
]

const currentStepData = computed(() => steps[currentStep.value])

const isWelcomeStep = computed(() => currentStep.value === 0)
const isPlayerStep = computed(() => currentStepData.value?.target === '[data-walkthrough="player"]')
const isHeaderTargetStep = computed(() => {
  const target = currentStepData.value?.target
  return target === '[data-walkthrough="create-button"]' || target === '[data-walkthrough="profile"]'
})

const spotlightStyle = computed(() => {
  if (!spotlightRect.value) return {}

  return {
    left: `${spotlightRect.value.left - 8}px`,
    top: `${spotlightRect.value.top - 8}px`,
    width: `${spotlightRect.value.width + 16}px`,
    height: `${spotlightRect.value.height + 16}px`
  }
})

let currentHighlightedElement = null

function updateSpotlight() {
  if (currentHighlightedElement) {
    currentHighlightedElement.style.removeProperty('position')
    currentHighlightedElement.style.removeProperty('z-index')
    currentHighlightedElement.classList.remove('walkthrough-highlight')
    currentHighlightedElement = null
  }

  if (!currentStepData.value?.target) {
    spotlightRect.value = null
    return
  }

  const element = document.querySelector(currentStepData.value.target)
  if (element) {
    const rect = element.getBoundingClientRect()
    spotlightRect.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    }

    const computedStyle = window.getComputedStyle(element)
    if (computedStyle.position === 'static') {
      element.style.position = 'relative'
    }
    element.style.zIndex = '10001'
    element.classList.add('walkthrough-highlight')
    currentHighlightedElement = element
  } else {
    spotlightRect.value = null
  }
}

const canAdvance = computed(() => {
  const step = currentStepData.value
  if (!step) return false
  if (!step.interactive) return true
  return !waitingForAction.value
})

function next() {
  if (currentStep.value < steps.length - 1 && canAdvance.value) {
    currentStep.value++
    if (currentStepData.value?.interactive) {
      waitingForAction.value = true
    } else {
      waitingForAction.value = false
    }
  }
}

function previous() {
  if (currentStep.value > 0) {
    currentStep.value--
    waitingForAction.value = false
  }
}

function skip() {
  cleanup()
  isActive.value = false
  localStorage.setItem('hasSeenWalkthrough', 'true')
}

function finish() {
  cleanup()
  isActive.value = false
  localStorage.setItem('hasSeenWalkthrough', 'true')
}

function start() {
  isActive.value = true
  currentStep.value = 0
  tutorialCollectionId.value = null
  waitingForAction.value = false
  nextTick(() => {
    updateSpotlight()
    setupEventListeners()
  })
}

function cleanup() {
  removeEventListeners()
  tutorialCollectionId.value = null
  waitingForAction.value = false

  if (currentHighlightedElement) {
    currentHighlightedElement.style.removeProperty('position')
    currentHighlightedElement.style.removeProperty('z-index')
    currentHighlightedElement.classList.remove('walkthrough-highlight')
    currentHighlightedElement = null
  }
}

function handleModalOpen(modalType) {
  if (!isActive.value) return

  if (modalType === 'create') {
    isModalOpen.value = true
    isCollapsed.value = true
  }

  const step = currentStepData.value
  if (step?.requiredAction === 'open-create-modal' && modalType === 'create') {
    waitingForAction.value = false
    setTimeout(() => next(), 300)
  }
}

function handleModalClose() {
  if (!isActive.value) return
  isModalOpen.value = false
  isCollapsed.value = false
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleCollectionCreated(collectionId) {
  if (!isActive.value) return
  const step = currentStepData.value
  if (step?.requiredAction === 'create-collection') {
    tutorialCollectionId.value = collectionId
    waitingForAction.value = false
    setTimeout(() => next(), 500)
  }
}

function handleRouteChange() {
  if (!isActive.value) return
  const step = currentStepData.value

  if (step?.requiredAction === 'open-collection' && router.currentRoute.value.name === 'Collection') {
    const collectionId = router.currentRoute.value.params.id
    if (collectionId === tutorialCollectionId.value) {
      waitingForAction.value = false
      setTimeout(() => next(), 500)
    }
  }
}

function setupEventListeners() {
  watch(() => uiStore.activeModal, (newModal, oldModal) => {
    if (newModal) {
      handleModalOpen(newModal)
    } else if (oldModal) {
      handleModalClose()
    }
  })

  watch(() => router.currentRoute.value.path, () => {
    handleRouteChange()
  })

  window.addEventListener('walkthrough:collection-created', onCollectionCreated)
}

function removeEventListeners() {
  window.removeEventListener('walkthrough:collection-created', onCollectionCreated)
}

function onCollectionCreated(event) {
  handleCollectionCreated(event.detail.collectionId)
}

watch(currentStep, async () => {
  await nextTick()
  updateSpotlight()
})

let resizeTimeout
function handleResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(updateSpotlight, 100)
}

function handleKeydown(event) {
  if (!isActive.value) return

  const targetTag = event.target.tagName.toLowerCase()
  if (targetTag === 'input' || targetTag === 'textarea' || event.target.isContentEditable) {
    return
  }

  switch(event.key) {
    case 'Escape':
      skip()
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      if (currentStep.value < steps.length - 1) {
        next()
      } else {
        finish()
      }
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      if (currentStep.value > 0) {
        previous()
      }
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (currentStep.value < steps.length - 1) {
        next()
      } else {
        finish()
      }
      break
  }
}

onMounted(() => {
  const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough')
  if (!hasSeenWalkthrough) {
    setTimeout(() => start(), 800)
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({ start })
</script>

<style scoped>
.walkthrough-system {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.walkthrough-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: all;
  animation: fadeIn 0.3s ease;
  z-index: 9999;
}

.walkthrough-spotlight {
  position: fixed;
  border-radius: 12px;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.5),
    0 0 0 9999px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 9999;
  background: transparent;
}

.walkthrough-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-container);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  max-width: 600px;
  width: calc(100vw - 40px);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  pointer-events: all;
  z-index: 10500;
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.walkthrough-notification.interactive {
  border: 2px solid var(--info-border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--info-border),
    0 0 24px rgba(59, 130, 246, 0.3);
}

.walkthrough-notification.collapsed {
  max-width: 400px;
  border-radius: 12px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.walkthrough-notification.bottom-positioned {
  top: auto;
  bottom: 20px;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%);
  }
}

.collapsed-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.collapsed-banner:hover {
  background: rgba(255, 255, 255, 0.02);
  transform: translateY(-1px);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  pointer-events: none;
}

.banner-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  color: rgba(59, 130, 246, 1);
}

.banner-text-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.banner-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.banner-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.7;
  line-height: 1.2;
  transition: opacity 0.2s;
}

.collapsed-banner:hover .banner-hint {
  opacity: 1;
  color: rgba(59, 130, 246, 0.8);
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.banner-expand,
.banner-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.banner-expand:hover,
.banner-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -100px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%);
  }
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.step-indicator {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tooltip-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tooltip-collapse,
.tooltip-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tooltip-collapse:hover,
.tooltip-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.tooltip-content {
  padding: 16px 20px;
}

.tooltip-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 8px;
  text-align: center;
}

.tooltip-content p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.action-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: rgba(59, 130, 246, 1);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.action-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.tooltip-content .action-indicator {
  padding: 12px 16px;
  font-size: 13px;
  margin-bottom: 16px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.tooltip-action {
  margin-top: 16px;
  padding: 12px;
  background: var(--info-bg);
  border-radius: 8px;
  border: 1px solid var(--info-border);
}

.action-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--info-text);
  font-weight: 500;
}

.action-hint::before {
  content: '💡';
  font-size: 16px;
}

.tooltip-footer {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--bg-surface);
  transition: all 0.3s;
}

.progress-dot.active {
  width: 24px;
  border-radius: 3px;
  background: var(--text-light);
}

.progress-dot.completed {
  background: var(--success-border);
}

.tooltip-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-tooltip {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--text-light);
  color: var(--text-dark);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-light-10);
}

.btn-secondary:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-light-20);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
}

.placeholder-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: var(--bg-container);
  border-top: 1px solid var(--border-light-10);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10000;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.player-track-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.player-artwork {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.player-text {
  min-width: 0;
}

.player-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  flex: 1;
}

.player-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.player-btn-main {
  width: 48px;
  height: 48px;
  background: var(--text-light);
  color: var(--text-dark);
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .walkthrough-notification {
    top: 16px;
    max-width: none;
    width: calc(100vw - 32px);
  }

  .walkthrough-notification.collapsed {
    max-width: none;
    width: calc(100vw - 32px);
  }

  .banner-text {
    font-size: 12px;
  }

  .banner-hint {
    font-size: 10px;
  }

  .banner-icon {
    width: 28px;
    height: 28px;
  }

  .banner-icon svg {
    width: 14px;
    height: 14px;
  }

  .tooltip-header {
    padding: 16px 16px 0;
  }

  .tooltip-content {
    padding: 20px 16px;
  }

  .tooltip-content h3 {
    font-size: 20px;
  }

  .tooltip-content p {
    font-size: 14px;
  }

  .tooltip-footer {
    padding: 0 16px 16px;
  }

  .tooltip-actions {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .btn-tooltip {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    font-size: 13px;
  }

  .btn-ghost {
    flex: 0 0 auto;
    min-width: 60px;
  }

  .placeholder-player {
    padding: 0 16px;
    height: 88px;
  }

  .player-volume {
    display: none;
  }

  .player-controls {
    gap: 8px;
  }

  .player-btn {
    width: 36px;
    height: 36px;
  }

  .player-btn-main {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .walkthrough-notification {
    top: 8px;
    width: calc(100vw - 16px);
  }

  .notification-content h3 {
    font-size: 15px;
  }

  .notification-content p {
    font-size: 12px;
  }

  .tooltip-content h3 {
    font-size: 18px;
  }

  .tooltip-content p {
    font-size: 13px;
  }

  .btn-tooltip {
    padding: 8px 10px;
    font-size: 12px;
  }
}

.welcome-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
  pointer-events: all;
}

.welcome-modal {
  background: var(--bg-container);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  padding: 48px;
  position: relative;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: slideUpWelcome 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all;
}

@keyframes slideUpWelcome {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.welcome-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.welcome-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.welcome-content {
  text-align: center;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.welcome-icon {
  margin-bottom: 24px;
  color: var(--text-light);
  opacity: 0.9;
}

.welcome-icon img {
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.welcome-content h2 {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.welcome-content p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  max-width: 480px;
}

.welcome-footer {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .welcome-modal {
    padding: 40px 32px;
  }

  .welcome-content {
    min-height: 240px;
  }

  .welcome-content h2 {
    font-size: 28px;
  }

  .welcome-content p {
    font-size: 15px;
  }

  .welcome-icon img {
    width: 70px;
    height: 70px;
  }
}

@media (max-width: 480px) {
  .welcome-modal {
    padding: 32px 24px;
  }

  .welcome-content {
    min-height: 200px;
  }

  .welcome-content h2 {
    font-size: 24px;
  }

  .welcome-content p {
    font-size: 14px;
  }

  .welcome-icon img {
    width: 60px;
    height: 60px;
  }

  .welcome-actions {
    flex-direction: column-reverse;
  }

  .welcome-actions .btn-tooltip {
    width: 100%;
  }
}
</style>