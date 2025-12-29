<template>
  <div class="page search-page">
    <div class="page-header">
      <h1 class="page-title">Search</h1>
      <p class="page-subtitle">Find tracks and collections in your library</p>
    </div>

    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search for tracks, artists, albums..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="query" class="search-clear" @click="clearSearch" title="Clear">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div v-if="query && results.length > 0" class="search-filters">
        <button
          v-for="filter in filters"
          :key="filter.id"
          :class="['filter-button', { active: activeFilter === filter.id }]"
          @click="activeFilter = filter.id"
        >
          {{ filter.label }}
          <span class="filter-count">{{ getFilterCount(filter.id) }}</span>
        </button>
      </div>
    </div>

    <div class="search-results">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Searching...</p>
      </div>

      <div v-else-if="query && filteredResults.length === 0" class="empty-state">
        <p class="empty-title">No results found</p>
        <p class="empty-subtitle">Try searching with different keywords</p>
      </div>

      <div v-else-if="filteredResults.length > 0" class="results-grid">
        <div
          v-for="result in filteredResults"
          :key="result.id"
          class="result-item"
          @click="handleResultClick(result)"
        >
          <div class="result-artwork">
            <img v-if="result.artwork" :src="result.artwork" alt="" class="artwork-img" />
            <div v-else class="artwork-placeholder">
              <svg v-if="result.type === 'track'" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <button class="play-button" @click.stop="playResult(result)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <div class="result-info">
            <div class="result-title">{{ result.title }}</div>
            <div class="result-subtitle">{{ result.subtitle }}</div>
          </div>
          <div class="result-type-badge">{{ result.type === 'track' ? 'Track' : 'Collection' }}</div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-title">Search your library</p>
        <p class="empty-subtitle">Find tracks, albums, and playlists by name or artist</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useDataStore } from '@/stores/data'

const router = useRouter()
const uiStore = useUIStore()
const playerStore = usePlayerStore()
const dataStore = useDataStore()

const searchInput = ref(null)
const query = ref('')
const results = ref([])
const loading = ref(false)
const activeFilter = ref('all')

const filters = [
  { id: 'all', label: 'All' },
  { id: 'track', label: 'Tracks' },
  { id: 'collection', label: 'Collections' }
]

const filteredResults = computed(() => {
  if (activeFilter.value === 'all') {
    return results.value
  }
  return results.value.filter(result => result.type === activeFilter.value)
})

let searchTimeout = null

onMounted(async () => {
  searchInput.value?.focus()
  await loadData()
})

function getFilterCount(filterId) {
  if (filterId === 'all') return results.value.length
  return results.value.filter(result => result.type === filterId).length
}

async function loadData() {
  if (dataStore.audioFiles.length === 0 && dataStore.collections.length === 0) {
    loading.value = true
  }

  try {
    await Promise.all([
      dataStore.fetchAudioFiles(),
      dataStore.fetchCollections()
    ])

    if (query.value.trim()) {
      handleSearch()
    }
  } catch (err) {
    console.error('Failed to load search data:', err)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!query.value.trim()) {
    results.value = []
    return
  }

  loading.value = true

  searchTimeout = setTimeout(() => {
    const searchQuery = query.value.toLowerCase().trim()
    const searchResults = []

    dataStore.audioFiles.forEach(file => {
      const title = (file.title || file.original_filename || '').toLowerCase()
      const artist = (file.artist || '').toLowerCase()

      if (title.includes(searchQuery) || artist.includes(searchQuery)) {
        searchResults.push({
          id: `track-${file.id}`,
          type: 'track',
          title: file.title || file.original_filename || 'Unknown Track',
          subtitle: file.artist || 'Unknown Artist',
          artwork: file.cover_art_url,
          data: file
        })
      }
    })

    dataStore.collections.forEach(collection => {
      const title = (collection.title || '').toLowerCase()
      const artist = (collection.artist || '').toLowerCase()

      if (title.includes(searchQuery) || artist.includes(searchQuery)) {
        const typeLabel = collection.collection_type
          ? collection.collection_type.charAt(0).toUpperCase() + collection.collection_type.slice(1)
          : 'Collection'

        searchResults.push({
          id: `collection-${collection.id}`,
          type: 'collection',
          title: collection.title,
          subtitle: `${typeLabel}${collection.artist ? ` • ${collection.artist}` : ''}`,
          artwork: collection.cover_art_url,
          data: collection
        })
      }
    })

    results.value = searchResults
    loading.value = false
  }, 300)
}

function clearSearch() {
  query.value = ''
  results.value = []
  searchInput.value?.focus()
}

function handleResultClick(result) {
  if (result.type === 'collection') {
    router.push(`/collection/${result.data.id}`)
  } else {
    playResult(result)
  }
}

function playResult(result) {
  if (result.type === 'track') {
    playerStore.playTrack(result.data)
  } else if (result.type === 'collection') {
    playCollection(result.data)
  }
}

async function playCollection(collection) {
  try {
    const fullCollection = await dataStore.getCollection(collection.id)
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
</script>

<style scoped>
.search-page {
  max-width: 1200px;
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

.search-container {
  margin-bottom: 32px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-container);
  padding: 16px 20px;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-light-10);
  transition: all var(--transition-fast);
}

.search-input-wrapper:focus-within {
  border-color: var(--text-light);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 16px;
  background: transparent;
  border: none;
  color: var(--text-light);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.search-clear {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.search-clear:hover {
  background: var(--bg-surface-hover);
  color: var(--text-light);
}

.search-filters {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.filter-button {
  padding: 8px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-button:hover {
  background: var(--bg-surface);
  color: var(--text-light);
  border-color: var(--text-light);
}

.filter-button.active {
  background: var(--text-light);
  color: var(--text-dark);
  border-color: var(--text-light);
}

.filter-count {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.filter-button.active .filter-count {
  background: rgba(0, 0, 0, 0.2);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-secondary);
  gap: 16px;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light-10);
  border-top-color: var(--text-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-container);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--bg-surface);
  border-color: var(--border-light-10);
  transform: translateX(4px);
}

.result-artwork {
  width: 56px;
  height: 56px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.artwork-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.play-button {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.result-item:hover .play-button {
  opacity: 1;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.result-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-type-badge {
  padding: 4px 10px;
  background: var(--bg-surface);
  color: var(--text-tertiary);
  border-radius: var(--border-radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.result-item:hover .result-type-badge {
  background: var(--bg-container);
  color: var(--text-light);
}

@media (max-width: 768px) {
  .search-input-wrapper {
    padding: 12px 16px;
  }

  .search-input {
    font-size: 15px;
  }

  .result-item {
    padding: 10px 12px;
    gap: 12px;
  }

  .result-artwork {
    width: 48px;
    height: 48px;
  }

  .result-title {
    font-size: 14px;
  }

  .result-subtitle {
    font-size: 12px;
  }
}
</style>