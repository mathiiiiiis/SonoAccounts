<template>
  <div class="fullscreen-player">
    <div class="player-bg">
      <img :src="coverArtUrl" alt="" />
    </div>
    <div class="player-overlay"></div>

    <div class="player-header">
      <button class="header-btn" @click="playerStore.toggleFullscreenPlayer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.12 9.29L12 13.17l3.88-3.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-4.59 4.59c-.39.39-1.02.39-1.41 0L6.7 10.7c-.39-.39-.39-1.02 0-1.41.39-.38 1.03-.39 1.42 0z"/>
        </svg>
      </button>
      <div class="header-spacer"></div>
    </div>

    <div class="player-body" :class="{ 'show-lyrics': showLyrics, 'show-queue': showQueue }">
      <div class="player-center">
        <div class="album-container">
          <div class="album-art">
            <img :src="coverArtUrl" alt="Cover" @error="handleImageError" />
          </div>
        </div>

        <div class="track-section">
          <div class="track-info">
            <h1 class="track-title">{{ trackTitle }}</h1>
            <p class="track-artist">{{ artistName }}</p>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar" @click="handleProgressClick" @mousedown="startDrag">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }">
                <div class="progress-handle"></div>
              </div>
            </div>
          </div>
          <div class="progress-time">
            <span>{{ playerStore.formatTime(playerStore.currentTime) }}</span>
            <span>{{ playerStore.formatTime(playerStore.duration) }}</span>
          </div>
        </div>

        <div class="controls-section">
          <button
            class="control-btn control-btn-sm"
            @click="playerStore.toggleShuffle"
            :class="{ active: playerStore.isShuffled }"
            title="Shuffle"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L6.12 4.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.46 4.46 1.42-1.4zM14.5 4l2.04 2.04L4 18.59c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L18.96 7.46 21 9.5V4h-5.5c-.55 0-1 .45-1 1s.45 1 1 1h2.04l.46.46zM14.83 13.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          <button
            class="control-btn"
            :disabled="!playerStore.canGoPrevious"
            @click="playerStore.previous"
            title="Previous"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z"/>
            </svg>
          </button>

          <button class="control-btn control-btn-main" @click="playerStore.togglePlay" title="Play/Pause">
            <svg v-if="playerStore.isPlaying" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
            </svg>
            <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
            </svg>
          </button>

          <button
            class="control-btn"
            :disabled="!playerStore.canGoNext"
            @click="playerStore.next"
            title="Next"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z"/>
            </svg>
          </button>

          <button
            class="control-btn control-btn-sm"
            @click="playerStore.toggleRepeat"
            :class="{ active: playerStore.repeatMode !== 'off' }"
            title="Repeat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v1.79c0 .45.54.67.85.35l2.79-2.79c.2-.2.2-.51 0-.71l-2.79-2.79c-.31-.31-.85-.09-.85.36V5H6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1V7zm10 10H7v-1.79c0-.45-.54-.67-.85-.35l-2.79 2.79c-.2.2-.2.51 0 .71l2.79 2.79c.31.31.85.09.85-.36V19h11c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1v3z"/>
            </svg>
            <span v-if="playerStore.repeatMode === 'one'" class="repeat-indicator">1</span>
          </button>
        </div>

        <div class="action-bar">
          <button
            class="action-btn"
            :class="{ active: showLyrics }"
            @click="toggleLyrics"
            title="Lyrics"
          >
            <svg width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M280-400h80q17 0 28.5-11.5T400-440q0-17-11.5-28.5T360-480h-80q-17 0-28.5 11.5T240-440q0 17 11.5 28.5T280-400Zm480-80q-50 0-85-35t-35-85q0-50 35-85t85-35q11 0 21 2t19 5v-167q0-17 11.5-28.5T840-920h80q17 0 28.5 11.5T960-880q0 17-11.5 28.5T920-840h-40v240q0 50-35 85t-85 35Zm-480-40h200q17 0 28.5-11.5T520-560q0-17-11.5-28.5T480-600H280q-17 0-28.5 11.5T240-560q0 17 11.5 28.5T280-520Zm0-120h200q17 0 28.5-11.5T520-680q0-17-11.5-28.5T480-720H280q-17 0-28.5 11.5T240-680q0 17 11.5 28.5T280-640Zm320 400H240l-92 92q-6 6-13 9t-15 3q-16 0-28-11.5T80-177v-623q0-33 23.5-56.5T160-880h440q33 0 56.5 23.5T680-800v17q-24 11-44 27t-36 36v-80H160v527l47-47h393v-160q16 20 36 36t44 27v97q0 33-23.5 56.5T600-240Zm-440-80v-480 480Z"/>
            </svg>
          </button>
          <button
            class="action-btn"
            :class="{ active: showQueue }"
            @click="toggleQueue"
            title="Queue"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 6H4c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1zm0 4H4c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1zM4 16h6c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM19 6c-1.1 0-2 .9-2 2v6.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h2c.55 0 1-.45 1-1s-.45-1-1-1h-2z"/>
            </svg>
          </button>
        </div>
      </div>

      <Transition name="slide-panel">
        <div v-if="showLyrics" class="lyrics-panel">
          <div class="panel-header">
            <h3>Lyrics</h3>
            <div class="panel-actions">
              <button class="search-lyrics-btn" @click="showLyricsSearch = true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                Search
              </button>
              <button class="panel-close-btn" @click="showLyrics = false">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="lyrics-scroll" ref="lyricsScrollRef">
            <div v-if="playerStore.lyricsLoading" class="lyrics-loading">
              <div class="spinner"></div>
              <p>Loading lyrics...</p>
            </div>
            <div v-else-if="!playerStore.lyrics" class="lyrics-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                <path d="M8 16h8c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm0-4h8c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v4c0 .55.45 1 1 1h4v11z"/>
              </svg>
              <p>No lyrics found</p>
              <button class="btn-search" @click="showLyricsSearch = true">Search Lyrics</button>
            </div>
            <div v-else class="lyrics-lines">
              <div
                v-for="(line, index) in playerStore.lyrics.lines"
                :key="index"
                class="lyric-line"
                :class="{
                  active: index === playerStore.currentLyricIndex,
                  past: index < playerStore.currentLyricIndex
                }"
                :ref="el => { if (index === playerStore.currentLyricIndex) activeLyricRef = el }"
                @click="seekToLyric(line.time)"
              >
                {{ line.text }}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="slide-panel">
        <div v-if="showQueue" class="queue-panel">
          <div class="panel-header">
            <h3>Queue</h3>
            <div class="panel-actions">
              <span class="queue-count">{{ playerStore.queue.length }} tracks</span>
              <button class="panel-close-btn" @click="showQueue = false">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="queue-scroll">
            <div v-if="playerStore.queue.length === 0" class="queue-empty">
              <p>Queue is empty</p>
            </div>
            <div
              v-for="(track, index) in playerStore.queue"
              :key="index"
              class="queue-item"
              :class="{ active: index === playerStore.queueIndex }"
              @click="playFromQueue(index)"
            >
              <div class="queue-index">
                <span v-if="index === playerStore.queueIndex" class="now-playing">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1zm5.5 4c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1zM6.5 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1z"/>
                  </svg>
                </span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="queue-cover">
                <img
                  :src="playerStore.currentCollection?.cover_art_url || track.cover_art_url || defaultTrackIcon"
                  alt=""
                  @error="handleQueueImageError"
                />
              </div>
              <div class="queue-info">
                <div class="queue-title">{{ track.title || track.original_filename }}</div>
                <div class="queue-artist">{{ getQueueItemArtist(track) }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <Transition name="fade">
      <div v-if="showLyricsSearch" class="modal-overlay" @click.self="showLyricsSearch = false">
        <div class="lyrics-search-modal">
          <div class="modal-header">
            <h3>Search Lyrics</h3>
            <button class="close-modal" @click="showLyricsSearch = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="search-field">
              <label>Track Name</label>
              <input
                v-model="lyricsSearchForm.track"
                type="text"
                placeholder="Enter track name"
                @keyup.enter="searchLyrics"
              />
            </div>
            <div class="search-field">
              <label>Artist</label>
              <input
                v-model="lyricsSearchForm.artist"
                type="text"
                placeholder="Enter artist name"
                @keyup.enter="searchLyrics"
              />
            </div>
            <div class="search-field">
              <label>Album (optional)</label>
              <input
                v-model="lyricsSearchForm.album"
                type="text"
                placeholder="Enter album name"
                @keyup.enter="searchLyrics"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showLyricsSearch = false">Cancel</button>
            <button class="btn-primary" @click="searchLyrics" :disabled="searchingLyrics">
              {{ searchingLyrics ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import defaultTrackCoverSvg from '@/assets/images/defaults/default_track_cover.svg'
import defaultTrackIconSvg from '@/assets/images/defaults/default_track_cover_icon.svg'

const playerStore = usePlayerStore()
const defaultTrackCover = defaultTrackCoverSvg
const defaultTrackIcon = defaultTrackIconSvg

const showLyrics = ref(false)
const showQueue = ref(false)
const showLyricsSearch = ref(false)

//lyrics search
const lyricsSearchForm = ref({
  track: '',
  artist: '',
  album: ''
})
const searchingLyrics = ref(false)

//refs for scrolling
const lyricsScrollRef = ref(null)
const activeLyricRef = ref(null)

const progressPercent = computed(() => {
  if (!playerStore.duration) return 0
  return (playerStore.currentTime / playerStore.duration) * 100
})

const coverArtUrl = computed(() => {
  if (playerStore.currentCollection?.cover_art_url) {
    return playerStore.currentCollection.cover_art_url
  }
  if (playerStore.currentTrack?.cover_art_url) {
    return playerStore.currentTrack.cover_art_url
  }
  return defaultTrackCover
})

const trackTitle = computed(() => {
  return playerStore.currentTrack?.title || playerStore.currentTrack?.original_filename || 'Unknown Track'
})

const artistName = computed(() => {
  if (playerStore.currentCollection) {
    return playerStore.currentCollection.artist || playerStore.currentCollection.owner?.username || 'Unknown Artist'
  }
  return playerStore.currentTrack?.artist || 'Unknown Artist'
})

//watch for active lyric changes and scroll
watch(() => playerStore.currentLyricIndex, async () => {
  await nextTick()
  if (activeLyricRef.value && lyricsScrollRef.value) {
    activeLyricRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
})

//prefill search form when opening
watch(showLyricsSearch, (val) => {
  if (val) {
    lyricsSearchForm.value = {
      track: playerStore.currentTrack?.title || playerStore.currentTrack?.original_filename || '',
      artist: artistName.value !== 'Unknown Artist' ? artistName.value : '',
      album: playerStore.currentCollection?.title || ''
    }
  }
})

function getQueueItemArtist(track) {
  if (playerStore.currentCollection) {
    return playerStore.currentCollection.artist || playerStore.currentCollection.owner?.username || 'Unknown Artist'
  }
  return track?.artist || 'Unknown Artist'
}

function handleProgressClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percent = x / rect.width
  const newTime = percent * playerStore.duration
  playerStore.seek(newTime)
}

function startDrag() {
  // Could add drag functionality here
}

function playFromQueue(index) {
  if (index !== playerStore.queueIndex) {
    const audioFiles = playerStore.queue
    playerStore.playTrack(audioFiles[index], audioFiles, index, playerStore.currentCollection)
  }
}

function toggleLyrics() {
  showLyrics.value = !showLyrics.value
  if (showLyrics.value) showQueue.value = false
}

function toggleQueue() {
  showQueue.value = !showQueue.value
  if (showQueue.value) showLyrics.value = false
}

function seekToLyric(time) {
  if (time !== undefined) {
    playerStore.seek(time)
  }
}

async function searchLyrics() {
  if (!lyricsSearchForm.value.track || !lyricsSearchForm.value.artist) return

  searchingLyrics.value = true
  try {
    await playerStore.searchLyrics(
      lyricsSearchForm.value.track,
      lyricsSearchForm.value.artist,
      lyricsSearchForm.value.album
    )
    showLyricsSearch.value = false
    showLyrics.value = true
  } catch (err) {
    console.error('Lyrics search failed:', err)
  } finally {
    searchingLyrics.value = false
  }
}

function handleImageError(e) {
  e.target.src = defaultTrackCover
}

function handleQueueImageError(e) {
  e.target.src = defaultTrackIcon
}
</script>

<style scoped>
.fullscreen-player {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #121212;
  display: flex;
  flex-direction: column;
}

.player-bg,
.player-overlay {
  display: none;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 24px;
}

.header-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
}

.header-btn:hover {
  background: rgba(255,255,255,0.1);
}

.header-spacer {
  flex: 1;
}

.player-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.player-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 32px;
  gap: 24px;
}

.player-body.show-lyrics .player-center,
.player-body.show-queue .player-center {
  flex: 0 0 50%;
}

.album-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 400px;
  width: 100%;
}

.album-art {
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-section {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.track-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 15px;
  color: rgba(255,255,255,0.6);
  margin: 0;
}

.progress-section {
  width: 100%;
  max-width: 400px;
}

.progress-bar {
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 2px;
}

.progress-handle {
  display: none;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  font-variant-numeric: tabular-nums;
  margin-top: 8px;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: none;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn-sm {
  width: 40px;
  height: 40px;
  color: rgba(255,255,255,0.6);
}

.control-btn-sm.active {
  color: #fff;
}

.control-btn-main {
  width: 64px;
  height: 64px;
  background: #fff;
  color: #000;
}

.repeat-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
}

.action-bar {
  display: flex;
  gap: 24px;
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: none;
  color: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.action-btn:hover {
  background: rgba(255,255,255,0.15);
}

.action-btn.active {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.lyrics-panel,
.queue-panel {
  flex: 0 0 50%;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255,255,255,0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.queue-count {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
}

.search-lyrics-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.search-lyrics-btn:hover {
  background: rgba(255,255,255,0.15);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  border-radius: 50%;
}

.panel-close-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.lyrics-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.lyrics-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: rgba(255,255,255,0.4);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: rgba(255,255,255,0.6);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lyrics-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: rgba(255,255,255,0.4);
  text-align: center;
}

.lyrics-empty svg {
  opacity: 0.4;
}

.btn-search {
  padding: 10px 24px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-search:hover {
  background: rgba(255,255,255,0.2);
}

.lyrics-lines {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40px 0;
}

.lyric-line {
  font-size: 18px;
  font-weight: 400;
  color: rgba(255,255,255,0.35);
  line-height: 1.5;
  cursor: pointer;
}

.lyric-line:hover {
  color: rgba(255,255,255,0.5);
}

.lyric-line.past {
  color: rgba(255,255,255,0.4);
}

.lyric-line.active {
  color: #fff;
  font-weight: 700;
}

.queue-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.queue-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255,255,255,0.4);
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.queue-item:hover {
  background: rgba(255,255,255,0.05);
}

.queue-item.active {
  background: rgba(255,255,255,0.1);
}

.queue-index {
  width: 24px;
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  text-align: center;
}

.queue-item.active .queue-index {
  color: #fff;
}

.now-playing {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.queue-cover {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
}

.queue-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item.active .queue-title {
  color: #fff;
}

.queue-artist {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lyrics-search-modal {
  width: 100%;
  max-width: 400px;
  background: #2a2a2a;
  border-radius: 12px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.close-modal {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  border-radius: 50%;
}

.close-modal:hover {
  background: rgba(255,255,255,0.1);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
}

.search-field input {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.search-field input:focus {
  border-color: rgba(255,255,255,0.3);
}

.search-field input::placeholder {
  color: rgba(255,255,255,0.3);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.btn-primary {
  background: #fff;
  color: #000;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.15s;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile */
@media (max-width: 900px) {
  .player-body.show-lyrics .player-center,
  .player-body.show-queue .player-center {
    display: none;
  }

  .lyrics-panel,
  .queue-panel {
    flex: 1;
    border-left: none;
  }
}

@media (max-width: 600px) {
  .player-header {
    padding: 12px 16px;
  }

  .player-center {
    padding: 0 16px 24px;
    gap: 20px;
  }

  .album-art {
    max-width: 280px;
  }

  .track-title {
    font-size: 20px;
  }

  .track-artist {
    font-size: 14px;
  }

  .controls-section {
    gap: 16px;
  }

  .control-btn-main {
    width: 56px;
    height: 56px;
  }

  .lyric-line {
    font-size: 16px;
  }
}

@media (max-width: 400px) {
  .album-art {
    max-width: 220px;
  }

  .track-title {
    font-size: 18px;
  }

  .controls-section {
    gap: 12px;
  }

  .control-btn {
    width: 40px;
    height: 40px;
  }

  .control-btn-main {
    width: 52px;
    height: 52px;
  }
}
</style>