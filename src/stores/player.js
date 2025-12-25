import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getSyncedLyrics, getCurrentLyricLine } from '@/services/lyrics'

export const usePlayerStore = defineStore('player', () => {
  const audio = ref(null)

  //current track
  const currentTrack = ref(null)
  const currentCollection = ref(null)
  const queue = ref([])
  const originalQueue = ref([])
  const queueIndex = ref(-1)

  //playback state
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const isLoading = ref(false)

  //repeat modes: off, all, one
  const repeatMode = ref('off')
  const isShuffled = ref(false)

  //lyrics
  const lyrics = ref(null)
  const currentLyricIndex = ref(-1)
  const lyricsLoading = ref(false)

  //fullscreen player
  const isFullscreenPlayer = ref(false)

  //original page title
  const originalPageTitle = ref('Sono Web')

  const hasTrack = computed(() => !!currentTrack.value)
  const hasQueue = computed(() => queue.value.length > 0)
  const canGoNext = computed(() => queueIndex.value < queue.value.length - 1)
  const canGoPrevious = computed(() => queueIndex.value > 0)

  //start audio element
  function setAudioElement(audioElement) {
    audio.value = audioElement

    //set event listeners
    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.duration
      isLoading.value = false
      updateMediaSessionPositionState()
    })

    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.currentTime

      //update current lyric line
      if (lyrics.value?.synced) {
        currentLyricIndex.value = getCurrentLyricLine(lyrics.value.lines, currentTime.value)
      }
    })

    audioElement.addEventListener('ended', handleTrackEnd)

    audioElement.addEventListener('play', () => {
      isPlaying.value = true
      updateMediaSessionPlaybackState('playing')
      updatePageTitle()
    })

    audioElement.addEventListener('pause', () => {
      isPlaying.value = false
      updateMediaSessionPlaybackState('paused')
    })

    audioElement.addEventListener('volumechange', () => {
      volume.value = audioElement.volume
      isMuted.value = audioElement.muted
    })

    //restore volume from localStorage
    const savedVolume = localStorage.getItem('player_volume')
    if (savedVolume) {
      audioElement.volume = parseFloat(savedVolume)
    }

    //setup MediaSession API handlers
    setupMediaSession()
  }

  //setup MediaSession API for MPRIS/system media controls
  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => {
      togglePlay()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlay()
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previous()
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      next()
    })

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime)
      }
    })

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10
      seek(Math.max(currentTime.value - skipTime, 0))
    })

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10
      seek(Math.min(currentTime.value + skipTime, duration.value))
    })
  }

  //update MediaSession metadata
  function updateMediaSessionMetadata(track, collection) {
    if (!('mediaSession' in navigator)) return

    const trackTitle = track?.title || track?.original_filename || 'Unknown Track'
    const artistName = collection?.artist || collection?.owner?.username || track?.artist || 'Unknown Artist'
    const albumName = collection?.title || track?.album || ''
    const coverUrl = collection?.cover_art_url || track?.cover_art_url || ''

    const artwork = coverUrl ? [
      { src: coverUrl, sizes: '96x96', type: 'image/png' },
      { src: coverUrl, sizes: '128x128', type: 'image/png' },
      { src: coverUrl, sizes: '192x192', type: 'image/png' },
      { src: coverUrl, sizes: '256x256', type: 'image/png' },
      { src: coverUrl, sizes: '384x384', type: 'image/png' },
      { src: coverUrl, sizes: '512x512', type: 'image/png' }
    ] : []

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: artistName,
      album: albumName,
      artwork
    })
  }

  //update MediaSession playback state
  function updateMediaSessionPlaybackState(state) {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = state
  }

  //update MediaSession position state
  function updateMediaSessionPositionState() {
    if (!('mediaSession' in navigator) || !audio.value) return

    try {
      navigator.mediaSession.setPositionState({
        duration: duration.value || 0,
        playbackRate: audio.value.playbackRate || 1,
        position: currentTime.value || 0
      })
    } catch (e) {
    }
  }

  //update page title with current track
  function updatePageTitle() {
    if (!currentTrack.value) {
      document.title = originalPageTitle.value
      return
    }

    const trackTitle = currentTrack.value.title || currentTrack.value.original_filename || 'Unknown Track'
    const artistName = currentCollection.value?.artist ||
                       currentCollection.value?.owner?.username ||
                       currentTrack.value.artist ||
                       'Unknown Artist'

    document.title = `${trackTitle} - ${artistName} | Sono Web`
  }

  //reset page title
  function resetPageTitle() {
    document.title = originalPageTitle.value
  }

  //play track
  async function playTrack(track, newQueue = null, startIndex = 0, collection = null) {
    currentTrack.value = track
    currentCollection.value = collection
    isLoading.value = true

    if (newQueue) {
      queue.value = newQueue
      originalQueue.value = [...newQueue]
      queueIndex.value = startIndex
    }

    //update MediaSession metadata and page title
    updateMediaSessionMetadata(track, collection)
    updatePageTitle()

    if (audio.value) {
      audio.value.src = track.file_url
      try {
        await audio.value.play()

        //fetch lyrics
        await fetchLyrics(track)
      } catch (err) {
        console.error('Playback error:', err)
        isLoading.value = false
      }
    }
  }

  //fetch lyrics for current track
  async function fetchLyrics(track) {
    lyricsLoading.value = true
    lyrics.value = null
    currentLyricIndex.value = -1

    try {
      const trackName = track.title || track.original_filename
      const artistName = track.artist || 'Unknown Artist'
      const albumName = track.album || ''
      const trackDuration = track.duration

      const result = await getSyncedLyrics(trackName, artistName, albumName, trackDuration)
      lyrics.value = result
    } catch (err) {
      console.error('Failed to fetch lyrics:', err)
    } finally {
      lyricsLoading.value = false
    }
  }

  //manual search for lyrics
  async function searchLyrics(trackName, artistName, albumName = '') {
    lyricsLoading.value = true

    try {
      const result = await getSyncedLyrics(trackName, artistName, albumName, duration.value)
      lyrics.value = result
      currentLyricIndex.value = -1
    } catch (err) {
      console.error('Failed to search lyrics:', err)
    } finally {
      lyricsLoading.value = false
    }
  }

  //play/pause
  function togglePlay() {
    if (!audio.value || !currentTrack.value) return

    if (isPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
  }

  //next
  function next() {
    if (repeatMode.value === 'one') {
      seek(0)
      audio.value?.play()
      return
    }

    if (!hasQueue.value) return

    if (canGoNext.value) {
      queueIndex.value++
      playTrack(queue.value[queueIndex.value], null, null, currentCollection.value)
    } else if (repeatMode.value === 'all') {
      queueIndex.value = 0
      playTrack(queue.value[0], null, null, currentCollection.value)
    }
  }

  //previous
  function previous() {
    //if more than 3 sec just restart it
    if (currentTime.value > 3) {
      seek(0)
      return
    }

    if (!hasQueue.value) return

    if (canGoPrevious.value) {
      queueIndex.value--
      playTrack(queue.value[queueIndex.value], null, null, currentCollection.value)
    } else if (repeatMode.value === 'all') {
      queueIndex.value = queue.value.length - 1
      playTrack(queue.value[queueIndex.value], null, null, currentCollection.value)
    }
  }

  //seek
  function seek(time) {
    if (audio.value) {
      audio.value.currentTime = time
      currentTime.value = time
    }
  }

  //set vol
  function setVolume(value) {
    if (audio.value) {
      audio.value.volume = value
      volume.value = value
      localStorage.setItem('player_volume', value.toString())
    }
  }

  //toggle mute
  function toggleMute() {
    if (audio.value) {
      audio.value.muted = !audio.value.muted
      isMuted.value = audio.value.muted
    }
  }

  //toggle repeat
  function toggleRepeat() {
    const modes = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIndex + 1) % modes.length]
  }

  //toggle shuffle
  function toggleShuffle() {
    isShuffled.value = !isShuffled.value

    if (isShuffled.value && hasQueue.value) {
      //shuffle queue (keep track at current position)
      const currentTrackData = queue.value[queueIndex.value]
      const otherTracks = queue.value.filter((_, i) => i !== queueIndex.value)

      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]]
      }

      queue.value = [currentTrackData, ...otherTracks]
      queueIndex.value = 0
    } else if (!isShuffled.value && hasQueue.value) {
      //unshuffle will restore original queue order
      const currentTrackData = queue.value[queueIndex.value]
      queue.value = [...originalQueue.value]

      //find index of current track in the original queue
      const originalIndex = originalQueue.value.findIndex(
        track => track.id === currentTrackData.id
      )

      if (originalIndex !== -1) {
        queueIndex.value = originalIndex
      }
    }
  }

  //handle song end
  function handleTrackEnd() {
    if (repeatMode.value === 'one') {
      seek(0)
      audio.value?.play()
    } else {
      next()
    }
  }

  //addto queue
  function addToQueue(track) {
    queue.value.push(track)
  }

  //remove song from queue
  function removeFromQueue(index) {
    if (index === queueIndex.value) return //cant remove current one

    queue.value.splice(index, 1)

    if (index < queueIndex.value) {
      queueIndex.value--
    }
  }

  //clear queue
  function clearQueue() {
    queue.value = []
    queueIndex.value = -1
    currentTrack.value = null
    currentCollection.value = null
    resetPageTitle()
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
    }
  }

  //toggle fullscreen
  function toggleFullscreenPlayer() {
    isFullscreenPlayer.value = !isFullscreenPlayer.value
  }

  //format time (seconds to mm:ss)
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    audio,
    currentTrack,
    currentCollection,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    repeatMode,
    isShuffled,
    lyrics,
    currentLyricIndex,
    lyricsLoading,
    isFullscreenPlayer,
    hasTrack,
    hasQueue,
    canGoNext,
    canGoPrevious,
    setAudioElement,
    playTrack,
    fetchLyrics,
    searchLyrics,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleFullscreenPlayer,
    formatTime
  }
})