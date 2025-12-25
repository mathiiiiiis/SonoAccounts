import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/services/api'

const CACHE_DURATION = 5 * 60 * 1000
const STALE_DURATION = 30 * 1000

export const useDataStore = defineStore('data', () => {
  //collections cache
  const collections = ref([])
  const collectionsLastFetch = ref(0)
  const collectionsLoading = ref(false)

  //audio files cache
  const audioFiles = ref([])
  const audioFilesLastFetch = ref(0)
  const audioFilesLoading = ref(false)

  //individual collection cache
  const collectionCache = ref({})

  //computed helpers
  const isCollectionsStale = computed(() => {
    return Date.now() - collectionsLastFetch.value > STALE_DURATION
  })

  const isCollectionsCacheValid = computed(() => {
    return Date.now() - collectionsLastFetch.value < CACHE_DURATION
  })

  const isAudioFilesStale = computed(() => {
    return Date.now() - audioFilesLastFetch.value > STALE_DURATION
  })

  const isAudioFilesCacheValid = computed(() => {
    return Date.now() - audioFilesLastFetch.value < CACHE_DURATION
  })

  //fetch all collections with caching
  async function fetchCollections(forceRefresh = false) {
    if (!forceRefresh && isCollectionsCacheValid.value && collections.value.length > 0) {
      if (isCollectionsStale.value) {
        refreshCollectionsBackground()
      }
      return collections.value
    }

    if (collectionsLoading.value) {
      return collections.value
    }

    collectionsLoading.value = true

    try {
      const response = await api.getAllCollections()

      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.collections || data.data || []
      }

      collections.value = Array.isArray(data) ? data : []
      collectionsLastFetch.value = Date.now()

      return collections.value
    } catch (err) {
      console.error('Failed to fetch collections:', err)
      throw err
    } finally {
      collectionsLoading.value = false
    }
  }

  //background refresh
  async function refreshCollectionsBackground() {
    if (collectionsLoading.value) return

    try {
      const response = await api.getAllCollections()

      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.collections || data.data || []
      }

      collections.value = Array.isArray(data) ? data : []
      collectionsLastFetch.value = Date.now()
    } catch (err) {
      console.error('Background collections refresh failed:', err)
    }
  }

  //fetch audio files with caching
  async function fetchAudioFiles(forceRefresh = false) {
    if (!forceRefresh && isAudioFilesCacheValid.value && audioFiles.value.length > 0) {
      if (isAudioFilesStale.value) {
        refreshAudioFilesBackground()
      }
      return audioFiles.value
    }

    if (audioFilesLoading.value) {
      return audioFiles.value
    }

    audioFilesLoading.value = true

    try {
      const response = await api.getMyAudioFiles()

      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.files || data.audio_files || data.items || data.data || []
      }

      audioFiles.value = Array.isArray(data) ? data : []
      audioFilesLastFetch.value = Date.now()

      return audioFiles.value
    } catch (err) {
      console.error('Failed to fetch audio files:', err)
      throw err
    } finally {
      audioFilesLoading.value = false
    }
  }

  //background refresh for audio files
  async function refreshAudioFilesBackground() {
    if (audioFilesLoading.value) return

    try {
      const response = await api.getMyAudioFiles()

      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.files || data.audio_files || data.items || data.data || []
      }

      audioFiles.value = Array.isArray(data) ? data : []
      audioFilesLastFetch.value = Date.now()
    } catch (err) {
      console.error('Background audio files refresh failed:', err)
    }
  }

  //get or fetch a single collection
  async function getCollection(id, forceRefresh = false) {
    const cached = collectionCache.value[id]
    const now = Date.now()

    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      if ((now - cached.timestamp) > STALE_DURATION) {
        refreshCollectionBackground(id)
      }
      return cached.data
    }

    try {
      const response = await api.getCollection(id)
      collectionCache.value[id] = {
        data: response.data,
        timestamp: now
      }
      return response.data
    } catch (err) {
      console.error('Failed to fetch collection:', err)
      throw err
    }
  }

  //background refresh for single collection
  async function refreshCollectionBackground(id) {
    try {
      const response = await api.getCollection(id)
      collectionCache.value[id] = {
        data: response.data,
        timestamp: Date.now()
      }
    } catch (err) {
      console.error('Background collection refresh failed:', err)
    }
  }

  //invalidate caches
  function invalidateCollections() {
    collectionsLastFetch.value = 0
    collectionCache.value = {}
  }

  function invalidateAudioFiles() {
    audioFilesLastFetch.value = 0
  }

  function invalidateCollection(id) {
    delete collectionCache.value[id]
  }

  function invalidateAll() {
    invalidateCollections()
    invalidateAudioFiles()
  }

  //update local cache when data changes
  function updateCollectionInCache(updatedCollection) {
    const index = collections.value.findIndex(c => c.id === updatedCollection.id)
    if (index !== -1) {
      collections.value[index] = { ...collections.value[index], ...updatedCollection }
    }

    if (collectionCache.value[updatedCollection.id]) {
      collectionCache.value[updatedCollection.id].data = {
        ...collectionCache.value[updatedCollection.id].data,
        ...updatedCollection
      }
    }
  }

  function removeCollectionFromCache(id) {
    collections.value = collections.value.filter(c => c.id !== id)
    delete collectionCache.value[id]
  }

  function addCollectionToCache(collection) {
    collections.value.unshift(collection)
  }

  //setup visibility change listener for auto refresh
  function setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (isCollectionsStale.value && collections.value.length > 0) {
          refreshCollectionsBackground()
        }
        if (isAudioFilesStale.value && audioFiles.value.length > 0) {
          refreshAudioFilesBackground()
        }
      }
    })
  }

  return {
    //state
    collections,
    collectionsLoading,
    audioFiles,
    audioFilesLoading,

    //computed
    isCollectionsStale,
    isCollectionsCacheValid,
    isAudioFilesStale,
    isAudioFilesCacheValid,

    //actions
    fetchCollections,
    fetchAudioFiles,
    getCollection,
    invalidateCollections,
    invalidateAudioFiles,
    invalidateCollection,
    invalidateAll,
    updateCollectionInCache,
    removeCollectionFromCache,
    addCollectionToCache,
    setupVisibilityListener
  }
})