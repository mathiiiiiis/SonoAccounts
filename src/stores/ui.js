import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  //modals
  const activeModal = ref(null)
  const modalData = ref(null)

  //notifications/toasts
  const notifications = ref([])
  let notificationId = 0

  //loading overlay
  const isGlobalLoading = ref(false)
  const loadingMessage = ref('')

  //mobile menu
  const isMobileMenuOpen = ref(false)

  //modal management
  function openModal(modalName, data = null) {
    activeModal.value = modalName
    modalData.value = data
  }

  function closeModal() {
    activeModal.value = null
    modalData.value = null
  }

  //notification management
  function showNotification(message, type = 'info', duration = 5000) {
    const id = notificationId++
    const notification = {
      id,
      message,
      type,
      duration
    }

    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  //loading overlay
  function showLoading(message = 'Loading...') {
    isGlobalLoading.value = true
    loadingMessage.value = message
  }

  function hideLoading() {
    isGlobalLoading.value = false
    loadingMessage.value = ''
  }

  //mobile menu
  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  return {
    activeModal,
    modalData,
    notifications,
    isGlobalLoading,
    loadingMessage,
    isMobileMenuOpen,
    openModal,
    closeModal,
    showNotification,
    removeNotification,
    clearNotifications,
    showLoading,
    hideLoading,
    toggleMobileMenu,
    closeMobileMenu
  }
})