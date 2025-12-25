<template>
  <div class="modal-overlay" @click.self="uiStore.closeModal">
    <div class="search-modal">
      <div class="search-header">
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
        </div>
        <button class="search-refresh" @click="refreshData" :disabled="refreshing" title="Refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
        <button class="search-close" @click="uiStore.closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <div class="search-results">
        <div v-if="loading" class="search-loading">
          <div class="spinner"></div>
          <p>Searching...</p>
        </div>

        <div v-else-if="query && filteredResults.length === 0" class="search-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p class="empty-title">No results found</p>
          <p class="empty-subtitle">Try searching with different keywords</p>
        </div>

        <div v-else-if="filteredResults.length > 0" class="results-list">
          <div
            v-for="result in filteredResults"
            :key="result.id"
            class="result-item"
            @click="handleResultClick(result)"
          >
            <div class="result-icon">
              <img v-if="result.type === 'track'" :src="defaultTrackIcon" alt="Track" class="icon-img" />
              <img v-else :src="defaultAlbumIcon" alt="Collection" class="icon-img" />
            </div>
            <div class="result-info">
              <div class="result-title">{{ result.title }}</div>
              <div class="result-subtitle">{{ result.subtitle }}</div>
            </div>
            <div class="result-type-badge">{{ result.type === 'track' ? 'Track' : 'Collection' }}</div>
          </div>
        </div>

        <div v-else class="search-hints">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p class="hints-title">Search your library</p>
          <p class="hints-subtitle">Find tracks, albums, and playlists</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import * as api from '@/services/api'
import defaultTrackIconSvg from '@/assets/images/defaults/default_track_cover_icon.svg'
import defaultAlbumIconSvg from '@/assets/images/defaults/default_album_cover_icon.svg'

const router = useRouter()
const uiStore = useUIStore()
const playerStore = usePlayerStore()

const searchInput = ref(null)
const query = ref('')
const results = ref([])
const loading = ref(false)
const refreshing = ref(false)
const activeFilter = ref('all')

//default icons
const defaultTrackIcon = defaultTrackIconSvg
const defaultAlbumIcon = defaultAlbumIconSvg

//cache for search data
const audioFiles = ref([])
const collections = ref([])
const dataLoaded = ref(false)

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

//get count for each filter
function getFilterCount(filterId) {
  if (filterId === 'all') return results.value.length
  return results.value.filter(result => result.type === filterId).length
}

async function loadData() {
  loading.value = true
  try {
    const [audioRes, collectionsRes] = await Promise.all([
      api.getMyAudioFiles(),
      api.getMyCollections()
    ])

    //handle audio files response
    let audioData = audioRes.data
    if (audioData && typeof audioData === 'object' && !Array.isArray(audioData)) {
      if (audioData.files) audioData = audioData.files
      else if (audioData.audio_files) audioData = audioData.audio_files
      else if (audioData.data) audioData = audioData.data
    }
    audioFiles.value = Array.isArray(audioData) ? audioData : []

    //handle collections response
    let collectionsData = collectionsRes.data
    if (collectionsData && typeof collectionsData === 'object' && !Array.isArray(collectionsData)) {
      if (collectionsData.collections) collectionsData = collectionsData.collections
    }
    collections.value = Array.isArray(collectionsData) ? collectionsData : []

    dataLoaded.value = true

    if (query.value.trim()) {
      handleSearch()
    }
  } catch (err) {
    console.error('Failed to load search data:', err)
    dataLoaded.value = true
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
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

    audioFiles.value.forEach(file => {
      const title = (file.title || file.original_filename || '').toLowerCase()
      const artist = (file.artist || '').toLowerCase()

      if (title.includes(searchQuery) || artist.includes(searchQuery)) {
        searchResults.push({
          id: `track-${file.id}`,
          type: 'track',
          title: file.title || file.original_filename || 'Unknown Track',
          subtitle: file.artist || 'Unknown Artist',
          data: file
        })
      }
    })

    collections.value.forEach(collection => {
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
          data: collection
        })
      }
    })

    results.value = searchResults
    loading.value = false
  }, 300)
}

function handleResultClick(result) {
  if (result.type === 'track') {
    playerStore.playTrack(result.data)
  } else if (result.type === 'collection') {
    router.push(`/collection/${result.data.id}`)
  }
  uiStore.closeModal()
}
</script>

<style scoped>
.search-modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 650px;
  max-height: 75vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-light-10);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface);
  padding: 12px 16px;
  border-radius: var(--border-radius);
  border: 1px solid transparent;
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
  font-size: 15px;
  background: transparent;
  border: none;
  color: var(--text-light);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.search-refresh,
.search-close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.search-refresh:hover:not(:disabled),
.search-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.search-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-filters {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light-10);
  background: var(--bg-surface);
}

.filter-button {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius-sm);
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
  background: var(--bg-container);
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

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.search-loading,
.search-empty,
.search-hints {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-secondary);
  gap: 16px;
  padding: 40px 20px;
}

.search-loading svg,
.search-empty svg,
.search-hints svg {
  opacity: 0.3;
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

.empty-title,
.hints-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.empty-subtitle,
.hints-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
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

.result-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.search-results::-webkit-scrollbar {
  width: 8px;
}

.search-results::-webkit-scrollbar-track {
  background: transparent;
}

.search-results::-webkit-scrollbar-thumb {
  background: var(--bg-surface);
  border-radius: 4px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: var(--bg-surface-hover);
}
</style>