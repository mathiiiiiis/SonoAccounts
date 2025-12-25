<template>
  <div class="app-player-wrapper" data-walkthrough="player">
    <div class="app-player">
      <div class="player-progress" @click.stop="handleProgressClick">
        <div
          class="player-progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>

      <div class="player-content">
        <div class="player-left" @click="playerStore.toggleFullscreenPlayer">
          <div class="player-cover">
            <img
              :src="coverArtUrl"
              alt="Cover"
              @error="handleImageError"
            />
          </div>

          <div class="player-info">
            <div class="player-title">
              {{ playerStore.currentTrack?.title || playerStore.currentTrack?.original_filename || 'Unknown Track' }}
            </div>
            <div class="player-artist">
              {{ artistName }}
            </div>
          </div>
        </div>

        <div class="player-center" @click.stop>
          <button
            class="control-btn"
            :disabled="!playerStore.canGoPrevious"
            @click="playerStore.previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button class="control-btn control-btn-main" @click="playerStore.togglePlay">
            <svg v-if="playerStore.isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <button
            class="control-btn"
            :disabled="!playerStore.canGoNext"
            @click="playerStore.next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
            </svg>
          </button>
        </div>

        <div class="player-right" @click.stop>
          <span class="player-time">
            {{ playerStore.formatTime(playerStore.currentTime) }}
          </span>
          <button
            class="control-btn control-btn-sm"
            @click="playerStore.toggleFullscreenPlayer"
            title="Fullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import defaultTrackCoverSvg from '@/assets/images/defaults/default_track_cover.svg'
import defaultAlbumCoverSvg from '@/assets/images/defaults/default_album_cover.svg'

const playerStore = usePlayerStore()
const defaultTrackCover = defaultTrackCoverSvg
const defaultAlbumCover = defaultAlbumCoverSvg

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
  return defaultAlbumCover
})

const artistName = computed(() => {
  if (playerStore.currentCollection) {
    return playerStore.currentCollection.artist || playerStore.currentCollection.owner?.username || 'Unknown Artist'
  }
  return playerStore.currentTrack?.artist || 'Unknown Artist'
})

function handleProgressClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percent = x / rect.width
  const newTime = percent * playerStore.duration
  playerStore.seek(newTime)
}

function handleImageError(e) {
  e.target.src = defaultTrackCover
}
</script>

<style scoped>
.app-player-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  z-index: 99;
  pointer-events: none;
}

.app-player {
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-container);
  border: 1px solid var(--border-light-10);
  border-radius: var(--border-radius);
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.player-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--bg-surface);
  cursor: pointer;
}

.player-progress-fill {
  height: 100%;
  background: var(--text-light);
  transition: width 0.1s linear;
}

.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 12px;
}

.player-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.player-cover {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-info {
  min-width: 0;
  flex: 1;
}

.player-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.player-artist {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-center {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.control-btn:hover:not(:disabled) {
  background: var(--bg-surface);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn-main {
  width: 44px;
  height: 44px;
  background: var(--text-light);
  color: var(--text-dark);
}

.control-btn-main:hover:not(:disabled) {
  background: var(--text-primary);
}

.control-btn-sm {
  width: 32px;
  height: 32px;
}

.player-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-time {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}

@media (max-width: 768px) {
  .app-player-wrapper {
    padding: 10px;
  }

  .app-player {
    max-width: 100%;
  }

  .player-content {
    padding: 8px 12px;
    gap: 10px;
  }

  .player-info {
    max-width: 120px;
  }

  .player-title {
    font-size: 12px;
  }

  .player-artist {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .app-player-wrapper {
    padding: 8px;
  }

  .app-player {
    border-radius: 10px;
  }

  .player-content {
    padding: 8px 10px;
    gap: 8px;
  }

  .player-cover {
    width: 40px;
    height: 40px;
  }

  .player-info {
    max-width: 100px;
  }

  .player-title {
    font-size: 12px;
  }

  .player-artist {
    font-size: 10px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }

  .control-btn svg {
    width: 16px;
    height: 16px;
  }

  .control-btn-main {
    width: 40px;
    height: 40px;
  }

  .control-btn-main svg {
    width: 20px;
    height: 20px;
  }

  .player-time {
    display: none;
  }

  .control-btn-sm {
    width: 28px;
    height: 28px;
  }

  .control-btn-sm svg {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 360px) {
  .app-player-wrapper {
    padding: 6px;
  }

  .player-content {
    padding: 6px 8px;
    gap: 6px;
  }

  .player-cover {
    width: 36px;
    height: 36px;
  }

  .player-info {
    max-width: 80px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-btn-main {
    width: 36px;
    height: 36px;
  }

  .control-btn-main svg {
    width: 18px;
    height: 18px;
  }

  .control-btn-sm {
    width: 24px;
    height: 24px;
  }
}
</style>