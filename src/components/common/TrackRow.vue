<template>
  <div
    class="track-row"
    :class="{ 'is-dragging': isDragging, 'drag-over': isDragOver, 'can-reorder': canReorder }"
    :draggable="canReorder && !isTouchDevice"
    :data-index="index"
    @click="hasMoved ? null : $emit('play')"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div 
      v-if="canReorder" 
      class="drag-handle" 
      @mousedown.stop
      @touchstart.stop.passive="handleTouchStart"
      @touchmove.stop.prevent="handleTouchMove"
      @touchend.stop="handleTouchEnd"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
      </svg>
    </div>

    <div class="track-index">
      <span class="track-number">{{ index + 1 }}</span>
      <button class="track-play-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>

    <div class="track-info">
      <div class="track-title">{{ track.title || track.original_filename }}</div>
      <div class="track-artist">{{ artistName }}</div>
    </div>

    <!--
    <div class="track-duration">
      {{ formatDuration(track.duration) }}
    </div> -->

    <div class="track-actions">
      <button
        v-if="canEdit"
        class="track-action-btn track-edit-btn"
        @click.stop="$emit('edit')"
        title="Edit track"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button
        v-if="canDelete"
        class="track-action-btn track-delete-btn"
        @click.stop="$emit('delete')"
        title="Remove from collection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
      <button
        v-if="!canDelete && !canEdit"
        class="track-action-btn"
        @click.stop="$emit('add-to-collection')"
        title="Add to collection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  track: {
    type: Object,
    required: true
  },
  trackId: {
    type: Number,
    default: null
  },
  index: {
    type: Number,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canReorder: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['play', 'add-to-collection', 'delete', 'edit', 'reorder'])

const isDragging = ref(false)
const isDragOver = ref(false)
const isTouchDevice = ref(false)
const touchStartY = ref(0)
const hasMoved = ref(false)

let touchDragData = null
let scrollInterval = null

onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

onUnmounted(() => {
  if (scrollInterval) {
    clearInterval(scrollInterval)
  }
})

function handleDragStart(e) {
  if (!props.canReorder || isTouchDevice.value) return
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', JSON.stringify({
    index: props.index,
    trackId: props.trackId
  }))
}

function handleDragEnd() {
  isDragging.value = false
  isDragOver.value = false
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
}

function handleDragOver(e) {
  if (!props.canReorder || isTouchDevice.value) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
  
  const viewportHeight = window.innerHeight
  const scrollThreshold = 100
  
  if (e.clientY < scrollThreshold) {
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, -5)
      }, 16)
    }
  } else if (e.clientY > viewportHeight - scrollThreshold) {
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, 5)
      }, 16)
    }
  } else {
    if (scrollInterval) {
      clearInterval(scrollInterval)
      scrollInterval = null
    }
  }
}

function handleDragLeave() {
  isDragOver.value = false
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
}

function handleDrop(e) {
  if (!props.canReorder || isTouchDevice.value) return
  e.preventDefault()
  isDragOver.value = false
  
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }

  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    if (data.index !== props.index) {
      emit('reorder', { fromIndex: data.index, toIndex: props.index, trackId: data.trackId })
    }
  } catch (err) {
    console.error('Failed to parse drag data:', err)
  }
}

function handleTouchStart(e) {
  if (!props.canReorder) return
  
  const touch = e.touches[0]
  touchStartY.value = touch.clientY
  hasMoved.value = false
  isDragging.value = true
  
  touchDragData = {
    index: props.index,
    trackId: props.trackId,
    startY: touch.clientY
  }
}

function handleTouchMove(e) {
  if (!props.canReorder || !touchDragData) return
  
  hasMoved.value = true
  
  const touch = e.touches[0]
  
  const viewportHeight = window.innerHeight
  const scrollThreshold = 100
  
  if (touch.clientY < scrollThreshold) {
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, -5)
      }, 16)
    }
  } else if (touch.clientY > viewportHeight - scrollThreshold) {
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, 5)
      }, 16)
    }
  } else {
    if (scrollInterval) {
      clearInterval(scrollInterval)
      scrollInterval = null
    }
  }
  
  const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
  const trackRowUnder = elementUnder?.closest('.track-row')
  
  document.querySelectorAll('.track-row.drag-over').forEach(el => {
    el.classList.remove('drag-over')
  })

  if (trackRowUnder) {
    trackRowUnder.classList.add('drag-over')
  }
}

function handleTouchEnd(e) {
  if (!props.canReorder || !touchDragData) return
  
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
  
  isDragging.value = false
  
  if (hasMoved.value) {
    const touch = e.changedTouches[0]
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
    const trackRowUnder = elementUnder?.closest('.track-row')
    
    document.querySelectorAll('.track-row.drag-over').forEach(el => {
      el.classList.remove('drag-over')
    })
    
    if (trackRowUnder) {
      const toIndexStr = trackRowUnder.getAttribute('data-index')
      if (toIndexStr !== null) {
        const toIndex = parseInt(toIndexStr)
        if (toIndex !== touchDragData.index) {
          emit('reorder', { 
            fromIndex: touchDragData.index, 
            toIndex: toIndex, 
            trackId: touchDragData.trackId 
          })
        }
      }
    }
  }
  
  touchDragData = null
  hasMoved.value = false
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const artistName = computed(() => {
  return props.collection?.artist || 
         props.collection?.owner?.username || 
         props.track?.artist || 
         'Unknown Artist'
})
</script>

<style scoped>
.track-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast), border-color var(--transition-fast);
  border: 2px solid transparent;
}

.track-row.can-reorder {
  grid-template-columns: 24px 40px 1fr auto;
}

.track-row.is-dragging {
  opacity: 0.5;
}

.track-row.drag-over {
  border-color: var(--text-light);
  background: var(--bg-surface);
}

.track-row:hover {
  background: var(--bg-surface);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  cursor: grab;
  transition: color var(--transition-fast);
  padding: 8px;
  margin: -8px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.track-row:hover {
  opacity: 1;
}

.drag-handle:hover {
  color: var(--text-light);
}

.track-index {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-number {
  font-size: 14px;
  color: var(--text-tertiary);
}

.track-play-btn {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--text-light);
  color: var(--text-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.track-row:hover .track-number {
  opacity: 0;
}

.track-row:hover .track-play-btn {
  opacity: 1;
}

.track-info {
  min-width: 0;
}

.track-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.track-artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-duration {
  font-size: 13px;
  color: var(--text-tertiary);
}

.track-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.track-row:hover .track-actions {
  opacity: 1;
}

.track-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.track-action-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-light);
}

.track-edit-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--primary-color);
}

.track-delete-btn:hover {
  background: var(--error-bg);
  color: var(--error-text);
}

@media (max-width: 768px) {
  .drag-handle {
    padding: 12px;
    margin: -12px;
  }
  
  .drag-handle svg {
    width: 20px;
    height: 20px;
  }
}
</style>