<template>
  <div class="page browse-page" data-walkthrough="browse">
    <div class="page-header">
      <h1 class="page-title">Browse</h1>
      <p class="page-subtitle">Discover public collections from the community</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading collections...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadPublicCollections">Retry</button>
    </div>

    <div v-else class="browse-content">
      <div v-if="publicCollections.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p class="empty-title">No public collections yet</p>
        <p class="empty-subtitle">Be the first to share your music with the community!</p>
      </div>

      <div v-else>
        <div class="browse-section">
          <h2 class="section-title">Public Collections</h2>
          <div class="grid grid-5">
            <CollectionCard
              v-for="collection in publicCollections"
              :key="collection.id"
              :collection="collection"
              :show-owner="true"
              :is-playing="playerStore.currentCollection?.id === collection.id && playerStore.isPlaying"
              @click="goToCollection(collection.id)"
              @play="playCollection(collection)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import CollectionCard from '@/components/common/CollectionCard.vue'

const router = useRouter()
const uiStore = useUIStore()
const playerStore = usePlayerStore()
const authStore = useAuthStore()
const dataStore = useDataStore()

const loading = ref(false)
const error = ref(null)

const publicCollections = computed(() => {
  const userId = authStore.user?.id
  return dataStore.collections.filter(c => c && c.is_public && c.owner_id !== userId)
})

async function loadPublicCollections() {
  if (dataStore.collections.length === 0) {
    loading.value = true
  }
  error.value = null

  try {
    await dataStore.fetchCollections()
  } catch (err) {
    console.error('Failed to load public collections:', err)
    error.value = 'Failed to load collections. Please try again.'
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

    const fullCollection = await dataStore.getCollection(collection.id)
    const tracks = fullCollection.tracks || []

    if (tracks.length > 0) {
      const audioFiles = tracks.map(t => t.audio_file)
      playerStore.playTrack(audioFiles[0], audioFiles, 0, fullCollection)
      uiStore.showNotification(`Playing ${collection.title}`, 'success')
    } else {
      uiStore.showNotification(`${collection.title} has no tracks`, 'info')
    }
  } catch (err) {
    console.error('Failed to play collection:', err)
    uiStore.showNotification('Failed to play collection', 'error')
  }
}

onMounted(() => {
  loadPublicCollections()
})
</script>

<style scoped>
.browse-page {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-light);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: var(--text-secondary);
}

.spinner {
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

.empty-state svg {
  opacity: 0.3;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}

.browse-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.browse-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 20px 0;
}
</style>