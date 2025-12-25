import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/services/api'
import { encryptPassword } from '@/services/crypto'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const publicKey = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const consentGiven = ref(false)
  const consents = ref([])
  const consentChecked = ref(false)
  const deletionStatus = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperuser = computed(() => user.value?.is_superuser || false)
  const needsConsent = computed(() => isAuthenticated.value && consentChecked.value && !consentGiven.value)
  const hasPendingDeletion = computed(() => deletionStatus.value?.has_pending_deletion || false)

  async function fetchPublicKey() {
    try {
      const response = await api.getPublicKey()
      publicKey.value = response.data.public_key
      return publicKey.value
    } catch (err) {
      console.error('Failed to fetch public key:', err)
      throw err
    }
  }

  //login
  async function login(username, password) {
    loading.value = true
    error.value = null

    try {
      if (!publicKey.value) {
        await fetchPublicKey()
      }

      const encryptedPassword = await encryptPassword(password, publicKey.value)

      const response = await api.login(username, encryptedPassword)
      const { access_token, refresh_token } = response.data

      //store tokens
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      await fetchCurrentUser()

      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  //register
  async function register(userData) {
    loading.value = true
    error.value = null

    try {
      if (!publicKey.value) {
        await fetchPublicKey()
      }

      const encryptedPassword = await encryptPassword(userData.password, publicKey.value)

      await api.register({
        ...userData,
        password: encryptedPassword
      })

      //autologin after registration
      await login(userData.username, userData.password)

      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await api.getCurrentUser()
      user.value = response.data

      //check if given consents
      await checkConsents()

      //check deletion status
      await checkDeletionStatus()

      return user.value
    } catch (err) {
      console.error('Failed to fetch user:', err)
      throw err
    }
  }

  //check deletion status
  async function checkDeletionStatus() {
    try {
      const response = await api.getDeletionStatus()
      deletionStatus.value = response.data
    } catch (err) {
      console.error('Failed to check deletion status:', err)
      deletionStatus.value = { has_pending_deletion: false }
    }
  }

  //check user consents
  async function checkConsents() {
    try {
      const response = await api.getUserConsents()
      consents.value = response.data || []

      //check if active
      const hasTerms = consents.value.some(c =>
        c.consent_type === 'terms_of_service' && c.is_active
      )
      const hasPrivacy = consents.value.some(c =>
        c.consent_type === 'privacy_policy' && c.is_active
      )

      consentGiven.value = hasTerms && hasPrivacy
    } catch (err) {
      console.error('Failed to check consents:', err)
      //if check fails => assume no consent
      consentGiven.value = false
    } finally {
      consentChecked.value = true
    }
  }

  //set consent status
  function setConsentGiven(status) {
    consentGiven.value = status
  }

  //update profile
  async function updateProfile(data) {
    loading.value = true
    error.value = null

    try {
      const response = await api.updateUserProfile(data)
      user.value = { ...user.value, ...response.data }
      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Profile update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  //upload profile picture
  async function uploadProfilePicture(file) {
    loading.value = true
    error.value = null

    try {
      const response = await api.uploadProfilePicture(file)
      //add cache buster to force browser to reload the image
      const baseUrl = response.data.profile_picture_url
      const cacheBuster = `?t=${Date.now()}`
      user.value.profile_picture_url = baseUrl.includes('?')
        ? `${baseUrl}&t=${Date.now()}`
        : `${baseUrl}${cacheBuster}`
      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Upload failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  //logout
  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.logout(refreshToken)
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      //clear local state
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  //auth state from stored token
  async function initializeAuth() {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        await fetchCurrentUser()
      } catch (err) {
        //token expired^invalid => clear it
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  }

  return {
    user,
    publicKey,
    loading,
    error,
    consentGiven,
    consents,
    consentChecked,
    deletionStatus,
    isAuthenticated,
    isSuperuser,
    needsConsent,
    hasPendingDeletion,
    fetchPublicKey,
    login,
    register,
    fetchCurrentUser,
    checkConsents,
    checkDeletionStatus,
    setConsentGiven,
    updateProfile,
    uploadProfilePicture,
    logout,
    initializeAuth
  }
})