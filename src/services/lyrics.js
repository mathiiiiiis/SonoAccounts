import axios from 'axios'

const LRCLIB_API = 'https://lrclib.net/api'

/**
 * parse LRC format lyrics into timed lines
 * format: [mm:ss.xx] lyric text
 */
export function parseLRC(lrcContent) {
  if (!lrcContent) return []

  const lines = lrcContent.split('\n')
  const timedLines = []

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/

  for (const line of lines) {
    const match = line.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const centiseconds = parseInt(match[3])
      const text = match[4].trim()

      const time = minutes * 60 + seconds + centiseconds / 100

      timedLines.push({ time, text })
    }
  }

  return timedLines.sort((a, b) => a.time - b.time)
}

//search for lyrics by track name and artist
export async function searchLyrics(trackName, artistName, albumName = '', duration = null) {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName
    })

    if (albumName) params.append('album_name', albumName)
    if (duration) params.append('duration', Math.round(duration))

    const response = await axios.get(`${LRCLIB_API}/search?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Lyrics search failed:', error)
    return []
  }
}

//get lyrics by track ID
export async function getLyricsById(id) {
  try {
    const response = await axios.get(`${LRCLIB_API}/get/${id}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch lyrics:', error)
    return null
  }
}

//get synced lyrics
export async function getSyncedLyrics(trackName, artistName, albumName = '', duration = null) {
  const results = await searchLyrics(trackName, artistName, albumName, duration)

  if (results.length === 0) return null

  //use the first result
  const lyrics = results[0]

  if (lyrics.syncedLyrics) {
    return {
      synced: true,
      lines: parseLRC(lyrics.syncedLyrics),
      plain: lyrics.plainLyrics,
      raw: lyrics.syncedLyrics
    }
  } else if (lyrics.plainLyrics) {
    return {
      synced: false,
      plain: lyrics.plainLyrics,
      lines: lyrics.plainLyrics.split('\n').map(text => ({ text, time: null }))
    }
  }

  return null
}

//find the current lyric line based on playback time
export function getCurrentLyricLine(timedLines, currentTime) {
  if (!timedLines || timedLines.length === 0) return -1

  for (let i = timedLines.length - 1; i >= 0; i--) {
    if (currentTime >= timedLines[i].time) {
      return i
    }
  }

  return -1
}