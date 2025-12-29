<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">News</h1>
      <p class="page-subtitle">Latest updates and announcements</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading news...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadNews">Retry</button>
    </div>

    <div v-else-if="allNews.length === 0" class="news-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
      </svg>
      <p>No news available</p>
    </div>

    <div v-else class="news-container">
      <div v-for="item in allNews" :key="item.id" class="news-card" :class="`news-${item.type}`">
        <div class="news-header">
          <div class="news-type-badge" :class="`badge-${item.type}`">
            <svg v-if="item.type === 'announcement'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
            <svg v-else-if="item.type === 'release'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 7h10v3l5 2-5 2v3H7v-3l-5-2 5-2V7z"/>
            </svg>
            <svg v-else-if="item.type === 'commit'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 12h6m6 0h6"/>
            </svg>
            {{ item.typeLabel }}
          </div>
          <div class="news-date">{{ formatDate(item.date) }}</div>
        </div>

        <h3 class="news-title">{{ item.title }}</h3>

        <div class="news-content" v-html="item.content"></div>

        <div v-if="item.author || item.avatar" class="news-author">
          <img v-if="item.avatar" :src="item.avatar" :alt="item.author" class="author-avatar" />
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span v-if="item.author">{{ item.author }}</span>
        </div>

        <div v-if="item.link" class="news-footer">
          <a :href="item.link" target="_blank" rel="noopener noreferrer" class="news-link">
            View on GitHub
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as api from '@/services/api'
import axios from 'axios'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true
})

const loading = ref(false)
const error = ref(null)

const announcements = ref([])
const releases = ref([])
const commits = ref([])

const allNews = computed(() => {
  const items = [
    ...announcements.value.map(a => {
      const dateStr = a.published_date || a.created_date || a.updated_date


      let parsedDate
      if (typeof dateStr === 'string') {
        if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
          parsedDate = new Date(dateStr + 'Z')
        } else {
          parsedDate = new Date(dateStr)
        }
      } else {
        parsedDate = new Date(dateStr)
      }

      return {
        id: `announcement-${a.id}`,
        type: 'announcement',
        typeLabel: 'Announcement',
        title: a.title,
        content: formatMarkdown(a.content),
        date: parsedDate,
        author: a.created_by?.display_name || a.created_by?.username,
        avatar: a.created_by?.profile_picture_url,
        link: null
      }
    }),
    ...releases.value.map(r => ({
      id: `release-${r.id}`,
      type: 'release',
      typeLabel: 'App Release',
      title: r.name || r.tag_name,
      content: formatMarkdown(r.body || 'No description provided'),
      date: new Date(r.published_at || r.created_at),
      author: r.author?.login,
      avatar: r.author?.avatar_url,
      link: r.html_url
    })),
    ...commits.value.map(c => ({
      id: `commit-${c.sha}`,
      type: 'commit',
      typeLabel: 'Web Update',
      title: c.commit.message.split('\n')[0],
      content: formatCommitMessage(c.commit.message),
      date: new Date(c.commit.author.date),
      author: c.commit.author.name || c.author?.login,
      avatar: c.author?.avatar_url,
      link: c.html_url
    }))
  ]

  return items
    .filter(item => item.date && !isNaN(item.date.getTime()))
    .sort((a, b) => b.date - a.date)
})

function formatMarkdown(text) {
  if (!text) return ''

  try {
    return marked.parse(text)
  } catch (err) {
    console.error('Markdown parsing error:', err)
    return text.replace(/\n/g, '<br>')
  }
}

function formatCommitMessage(message) {
  const lines = message.split('\n')
  if (lines.length > 1) {
    return lines.slice(1).join('<br>').trim() || lines[0]
  }
  return ''
}

function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date provided to formatDate:', date)
    return 'Invalid Date'
  }

  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
    }
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  } else {
    return date.toLocaleDateString()
  }
}

async function loadAnnouncements() {
  try {
    const response = await api.getPublishedAnnouncements(0, 20)
    let announcementsData = response.data

    if (announcementsData && typeof announcementsData === 'object') {
      if (announcementsData.announcements) {
        announcementsData = announcementsData.announcements
      }
    }

    announcements.value = Array.isArray(announcementsData) ? announcementsData : []
  } catch (err) {
    console.error('Failed to load announcements:', err)
    announcements.value = []
  }
}

async function loadGitHubReleases() {
  try {
    const response = await axios.get('https://api.github.com/repos/mathiiiiiis/SonoAPK/releases')
    releases.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Failed to load GitHub releases:', err)
    releases.value = []
  }
}

async function loadGitHubCommits() {
  try {
    const response = await axios.get('https://api.github.com/repos/mathiiiiiis/SonoAccounts/commits')
    commits.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Failed to load GitHub commits:', err)
    commits.value = []
  }
}

async function loadNews() {
  loading.value = true
  error.value = null

  try {
    await Promise.all([
      loadAnnouncements(),
      loadGitHubReleases(),
      loadGitHubCommits()
    ])
  } catch (err) {
    console.error('Failed to load news:', err)
    error.value = 'Failed to load news. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-secondary);
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.news-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-secondary);
  gap: 16px;
}

.news-empty svg {
  opacity: 0.5;
}

.news-empty p {
  font-size: 16px;
  margin: 0;
}

.news-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.news-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light-10);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
  position: relative;
}

.news-card:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -13px;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--border-color), transparent);
}

.news-card:hover {
  border-color: var(--border-light-20);
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.news-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-announcement {
  background: var(--bg-container);
  color: var(--primary);
}

.badge-release {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-commit {
  background: #f3e5f5;
  color: #7b1fa2;
}

.news-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.news-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.news-content {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 14px;
}

.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3),
.news-content :deep(h4),
.news-content :deep(h5),
.news-content :deep(h6) {
  margin: 16px 0 8px 0;
  color: var(--text-primary);
  font-weight: 600;
}

.news-content :deep(h1) {
  font-size: 20px;
}

.news-content :deep(h2) {
  font-size: 18px;
}

.news-content :deep(h3) {
  font-size: 16px;
}

.news-content :deep(h4) {
  font-size: 14px;
}

.news-content :deep(p) {
  margin: 8px 0;
}

.news-content :deep(code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
}

.news-content :deep(pre) {
  background: var(--bg-surface);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.news-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.news-content :deep(a) {
  color: var(--primary);
  text-decoration: none;
}

.news-content :deep(a:hover) {
  text-decoration: underline;
}

.news-content :deep(ul),
.news-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.news-content :deep(li) {
  margin: 4px 0;
}

.news-content :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid var(--primary);
  background: var(--bg-surface);
  border-radius: 0 8px 8px 0;
}

.news-content :deep(blockquote p) {
  margin: 0;
}

.news-content :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.news-content :deep(em) {
  font-style: italic;
}

.news-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 16px 0;
}

.news-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.news-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.news-content :deep(th),
.news-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.news-content :deep(th) {
  background: var(--bg-surface);
  font-weight: 600;
}

.news-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.news-footer {
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.news-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.news-link:hover {
  opacity: 0.8;
}

.error-state .btn {
  margin-top: 8px;
}
</style>