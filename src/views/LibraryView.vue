<template>
  <div class="page library-page" data-walkthrough="library">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadLibrary">Retry</button>
    </div>

    <div v-else class="library-content">
      <div v-if="collections.length === 0" class="empty-state">
        <p class="empty-text">No collections yet</p>
      </div>

      <div v-else>
        <div class="collections-grid">
          <CollectionCard
            v-for="collection in collections"
            :key="collection.id"
            :collection="collection"
            :is-playing="playerStore.currentCollection?.id === collection.id && playerStore.isPlaying"
            @click="goToCollection(collection.id)"
            @play="playCollection(collection)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import * as api from '@/services/api'
import CollectionCard from '@/components/common/CollectionCard.vue'

const router = useRouter()
const uiStore = useUIStore()
const playerStore = usePlayerStore()
const authStore = useAuthStore()
const dataStore = useDataStore()

const loading = ref(false)
const error = ref(null)

const collections = computed(() => {
  const userId = authStore.user?.id
  return dataStore.collections.filter(c => {
    if (!c) return false
    if (c.owner_id === userId) return true
    if (c.collaborators && Array.isArray(c.collaborators)) {
      return c.collaborators.some(collab => collab.user_id === userId)
    }
    return false
  })
})

const totalTracks = computed(() => {
  return collections.value.reduce((sum, c) => sum + (c.tracks_count || c.track_count || 0), 0)
})

async function loadLibrary(forceRefresh = false) {
  if (dataStore.collections.length === 0) {
    loading.value = true
  }
  error.value = null

  try {
    await dataStore.fetchCollections(forceRefresh)
  } catch (err) {
    console.error('Failed to load library:', err)
    error.value = 'Failed to load library. Please try again.'
  } finally {
    loading.value = false
  }
}

function goToCollection(id) {
  router.push(`/collection/${id}`)
}

async function playCollection(collection) {
  try {
    if (playerStore.currentCollection?.id === collection.id) {
      playerStore.togglePlay()
      return
    }
    const response = await api.getCollection(collection.id)
    const fullCollection = response.data
    const tracks = fullCollection.tracks || []

    if (tracks.length > 0) {
      const audioFiles = tracks.map(t => t.audio_file)
      playerStore.playTrack(audioFiles[0], audioFiles, 0, fullCollection)
    } else {
      uiStore.showNotification(`${collection.title} has no tracks`, 'info')
    }
  } catch (err) {
    console.error('Failed to play collection:', err)
    uiStore.showNotification('Failed to play collection', 'error')
  }
}

function handleCollectionCreated() {
  loadLibrary(true)
}

onMounted(() => {
  loadLibrary()

  window.addEventListener('walkthrough:collection-created', handleCollectionCreated)
})

onUnmounted(() => {
  window.removeEventListener('walkthrough:collection-created', handleCollectionCreated)
})
</script>

<style scoped>
.library-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 160px;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 48px;
  padding-bottom: 0;
}

.page-title {
  font-size: 28px;
  font-weight: 400;
  color: var(--text-light);
  margin: 0;
  letter-spacing: -0.02em;
  text-transform: lowercase;
  font-family: 'Inter', sans-serif;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  gap: 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  opacity: 0.4;
}

.error-state p {
  font-size: 14px;
  text-transform: lowercase;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  gap: 24px;
  text-align: center;
  padding: 48px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  text-transform: lowercase;
  letter-spacing: -0.01em;
}

.empty-state .btn {
  text-transform: lowercase;
  font-weight: 400;
  padding: 10px 20px;
  font-size: 13px;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 32px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .library-page {
    padding: 24px 16px;
    padding-bottom: 140px;
  }

  .library-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .empty-state {
    padding: 32px 16px;
    min-height: 300px;
  }

  .loading-state,
  .error-state {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .library-page {
    padding: 16px 12px;
    padding-bottom: 120px;
  }

  .page-title {
    font-size: 20px;
  }

  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .empty-state {
    min-height: 250px;
    gap: 16px;
  }

  .empty-text {
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .library-page {
    padding: 12px 8px;
    padding-bottom: 110px;
  }

  .collections-grid {
    gap: 8px;
  }
}
</style>