import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 //60 second timeout for uploads
})

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      //only retry on network errors or 500/503 errors
      const shouldRetry = (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        error.response?.status === 500 ||
        error.response?.status === 503
      )

      if (i === maxRetries - 1 || !shouldRetry) {
        throw error
      }

      const delay = baseDelay * Math.pow(2, i)
      console.log(`Request failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

//request to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

//response for token refresh and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    //handle "401 Unauthorized" => try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post('/users/token/refresh', {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token: newRefreshToken } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    //handle network errors and server errors with retry logic
    //only retry if not already retried, not a file upload (avoids duplicate uploads)
    const shouldRetry = (
      !originalRequest._retryCount &&
      originalRequest.method?.toLowerCase() !== 'post' && //dont auto-retry POST requests
      (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        error.response?.status === 503
      )
    )

    if (shouldRetry) {
      originalRequest._retryCount = 1
      try {
        return await retryWithBackoff(() => api(originalRequest), 2, 2000)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

    return Promise.reject(error)
  }
)

// ======== HEALTH CHECK ========
export const checkHealth = () => axios.get('/health')
export const checkApiHealth = () => axios.get('/api-health')

// ======== USER / AUTH ========
export const getPublicKey = () => api.get('/users/public-key')

export const login = (username, encryptedPassword) => {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', encryptedPassword)

  return api.post('/v1/users/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Password-Encrypted': 'true'
    }
  })
}

export const register = (userData) => {
  return api.post('/users/', userData, {
    headers: {
      'X-Password-Encrypted': 'true'
    }
  })
}

export const refreshToken = (refreshToken) => {
  return api.post('/users/token/refresh', { refresh_token: refreshToken })
}

export const logout = (refreshToken) => {
  return api.post('/users/logout', { refresh_token: refreshToken })
}

export const getCurrentUser = () => api.get('/users/me')

export const updateUserProfile = (data) => api.put('/users/me', data)

export const uploadProfilePicture = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/users/me/upload-profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ======== GDPR / CONSENT ========
export const recordConsent = (consentData) => {
  return api.post('/users/me/consent', consentData)
}

export const getUserConsents = () => api.get('/users/me/consents')

export const exportUserData = () => api.get('/users/me/export-data')

export const requestAccountDeletion = (deletionData) => {
  return api.post('/users/me/request-deletion', deletionData)
}

export const cancelAccountDeletion = () => {
  return api.post('/users/me/cancel-deletion')
}

export const deleteAccountImmediately = (password, deletionType = 'hard') => {
  return api.delete(`/users/me?password=${encodeURIComponent(password)}&deletion_type=${deletionType}`)
}

export const getDeletionStatus = () => api.get('/users/me/deletion-status')

// ======== AUDIO FILES ========
export const uploadAudioFile = (file, metadata = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  if (metadata.title) formData.append('title', metadata.title)
  if (metadata.description) formData.append('description', metadata.description)
  if (metadata.is_public !== undefined) formData.append('is_public', metadata.is_public)

  return api.post('/audio/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getUploadStats = () => api.get('/audio/stats')

export const getMyAudioFiles = () => api.get('/audio/my-files')

export const getPublicAudioFiles = () => api.get('/audio/public')

export const getAudioFile = (fileId) => api.get(`/audio/${fileId}`)

export const updateAudioFile = (fileId, data) => api.put(`/audio/${fileId}`, data)

export const uploadAudioCoverArt = (fileId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/audio/${fileId}/cover-art`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const deleteAudioFile = (fileId) => api.delete(`/audio/${fileId}`)

// ======== COLLECTIONS ========
export const createCollection = (collectionData) => {
  return api.post('/collections/', collectionData)
}

export const uploadCollectionCoverArt = (collectionId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/collections/${collectionId}/cover-art`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const updateCollection = (collectionId, collectionData) => {
  return api.put(`/collections/${collectionId}`, collectionData)
}

export const getAllCollections = () => api.get('/collections/')

export const getMyCollections = () => api.get('/collections/my-collections')

export const getCollection = (collectionId) => api.get(`/collections/${collectionId}`)

export const deleteCollection = (collectionId) => api.delete(`/collections/${collectionId}`)

export const addTrackToCollection = (collectionId, trackData) => {
  return api.post(`/collections/${collectionId}/tracks`, trackData)
}

export const removeTrackFromCollection = (collectionId, trackId) => {
  return api.delete(`/collections/${collectionId}/tracks/${trackId}`)
}

export const reorderTrack = (collectionId, trackId, newOrder) => {
  return api.put(`/collections/${collectionId}/tracks/${trackId}/reorder`, {
    track_order: newOrder
  })
}

export const bulkAddTracks = (collectionId, audioFileIds) => {
  return api.post(`/collections/${collectionId}/tracks/bulk-add`, {
    audio_file_ids: audioFileIds
  })
}

export const addCollaborator = (collectionId, userData) => {
  return api.post(`/collections/${collectionId}/collaborators`, userData)
}

export const updateCollaborator = (collectionId, userId, permissions) => {
  return api.put(`/collections/${collectionId}/collaborators/${userId}`, permissions)
}

export const removeCollaborator = (collectionId, userId) => {
  return api.delete(`/collections/${collectionId}/collaborators/${userId}`)
}

// ======== ADMIN ========
export const getSystemStats = () => api.get('/admin/stats')

export const getAllUsers = () => api.get('/admin/users')

export const getUser = (userId) => api.get(`/admin/users/${userId}`)

export const updateUserUploadLimit = (userId, limit) => {
  return api.put(`/admin/users/${userId}/upload-limit`, { max_audio_uploads: limit })
}

export const getUserUploadStats = (userId) => {
  return api.get(`/admin/users/${userId}/upload-stats`)
}

export const getCollectionStats = () => api.get('/admin/collections/stats')

export const getUserCollectionStats = (userId) => {
  return api.get(`/admin/users/${userId}/collections/stats`)
}

export const deleteUserCollections = (userId) => {
  return api.delete(`/admin/users/${userId}/collections/all`)
}

export const getRecentCollections = () => api.get('/admin/collections/recent')

export const getCollectionsSummary = () => api.get('/admin/collections/summary')

export const getAllAudioFiles = () => api.get('/admin/audio-files/all')

export const deleteUserAudioFiles = (userId) => {
  return api.delete(`/admin/users/${userId}/audio-files`)
}

export const resetUserUploads = (userId) => {
  return api.post(`/admin/users/${userId}/reset-uploads`)
}

export const disableUser = (userId) => {
  return api.post(`/admin/users/${userId}/disable`)
}

export const enableUser = (userId) => {
  return api.post(`/admin/users/${userId}/enable`)
}

export const deleteUser = (userId) => {
  return api.delete(`/admin/users/${userId}`)
}

export const processPendingDeletions = () => {
  return api.post('/admin/process-pending-deletions')
}

// ======== ADMIN - ANNOUNCEMENTS ========
export const createAnnouncement = (announcementData) => {
  return api.post('/admin/announcements', announcementData)
}

export const getAllAnnouncements = (skip = 0, limit = 100, publishedOnly = false) => {
  return api.get(`/admin/announcements?skip=${skip}&limit=${limit}&published_only=${publishedOnly}`)
}

export const getAnnouncementAdmin = (announcementId) => {
  return api.get(`/admin/announcements/${announcementId}`)
}

export const updateAnnouncement = (announcementId, announcementData) => {
  return api.put(`/admin/announcements/${announcementId}`, announcementData)
}

export const deleteAnnouncement = (announcementId) => {
  return api.delete(`/admin/announcements/${announcementId}`)
}

// ======== ANNOUNCEMENTS (PUBLIC) ========
export const getPublishedAnnouncements = (skip = 0, limit = 20) => {
  return api.get(`/announcements?skip=${skip}&limit=${limit}`)
}

export const getPublishedAnnouncement = (announcementId) => {
  return api.get(`/announcements/${announcementId}`)
}

export default api