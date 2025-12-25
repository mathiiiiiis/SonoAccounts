<template>
  <div class="collection-card" @click="$emit('click')">
    <div class="collection-cover" :class="{ 'cd-effect': isPlaying }">
      <img
        :src="collection.cover_art_url || defaultAlbumCover"
        alt=""
        @error="handleImageError"
      />
      <div v-if="isPlaying" class="cd-center-hole"></div>
    </div>
    <button class="play-button" @click.stop="$emit('play')" :title="isPlaying ? 'Pause' : 'Play'">
      <svg v-if="!isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
      </svg>
    </button>

    <div class="collection-info">
      <h3 class="collection-title">{{ collection.title }}</h3>
      <p class="collection-meta">
        <span class="collection-type">{{ formatType(collection.collection_type) }}</span>
        <span v-if="collection.artist"> · {{ collection.artist }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import defaultAlbumCoverSvg from '@/assets/images/defaults/default_album_cover.svg'

defineProps({
  collection: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'play'])

const defaultAlbumCover = defaultAlbumCoverSvg

function formatType(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function handleImageError(e) {
  e.target.src = defaultAlbumCover
}
</script>

<style scoped>
.collection-card {
  cursor: pointer;
  position: relative;
}

.collection-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.collection-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  transition: all 0.4s ease;
}

.collection-cover.cd-effect {
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  animation: spin 6s linear infinite;
}

.collection-cover.cd-effect img {
  border-radius: 50%;
}

.cd-center-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18%;
  height: 18%;
  background: #0a0a0a;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.play-button {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px) scale(0.9);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.collection-card:hover .play-button {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.play-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.collection-info {
  min-width: 0;
}

.collection-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.collection-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}

.collection-type {
  text-transform: lowercase;
}
</style>