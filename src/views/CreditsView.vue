<template>
  <div class="page credits-page">
    <div class="page-header">
      <h1 class="page-title">Credits</h1>
      <p class="page-subtitle">Packages and APIs used in SonoWeb</p>
    </div>

    <div class="credits-content">
      <div class="credits-section">
        <h2 class="section-title">APIs</h2>
        <div class="dependencies-list">
          <a href="https://sono.wtf" target="_blank" rel="noopener noreferrer" class="dependency-item">
            <span class="dependency-name">Sono API</span>
            <span class="dependency-version">Backend service</span>
          </a>
          <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer" class="dependency-item">
            <span class="dependency-name">LRCLIB</span>
            <span class="dependency-version">Lyrics provider</span>
          </a>
        </div>
      </div>

      <div class="credits-section">
        <h2 class="section-title">Dependencies</h2>
        <div class="dependencies-list">
          <a
            v-for="dep in dependencies"
            :key="dep.name"
            :href="dep.url"
            target="_blank"
            rel="noopener noreferrer"
            class="dependency-item"
          >
            <span class="dependency-name">{{ dep.name }}</span>
            <span class="dependency-version">{{ dep.version }}</span>
          </a>
        </div>
      </div>

      <div class="credits-section">
        <h2 class="section-title">Dev Dependencies</h2>
        <div class="dependencies-list">
          <a
            v-for="dep in devDependencies"
            :key="dep.name"
            :href="dep.url"
            target="_blank"
            rel="noopener noreferrer"
            class="dependency-item"
          >
            <span class="dependency-name">{{ dep.name }}</span>
            <span class="dependency-version">{{ dep.version }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import packageJson from '../../package.json'

const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
  name,
  version,
  url: getPackageUrl(name)
}))

const devDependencies = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
  name,
  version,
  url: getPackageUrl(name)
}))

function getPackageUrl(name) {
  const urls = {
    'vue': 'https://vuejs.org/',
    'vue-router': 'https://router.vuejs.org/',
    'pinia': 'https://pinia.vuejs.org/',
    'axios': 'https://axios-http.com/',
    'express': 'https://expressjs.com/',
    'http-proxy-middleware': 'https://github.com/chimurai/http-proxy-middleware',
    'vite': 'https://vitejs.dev/',
    '@vitejs/plugin-vue': 'https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue',
    'nodemon': 'https://nodemon.io/'
  }
  return urls[name] || `https://www.npmjs.com/package/${name}`
}
</script>

<style scoped>
.credits-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.credits-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.credits-section {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 16px 0;
}

.dependencies-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dependency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
}

.dependency-item:hover {
  background: var(--bg-surface-hover);
  transform: translateX(4px);
}

.dependency-name {
  color: var(--text-light);
  font-family: 'Courier New', monospace;
}

.dependency-version {
  color: var(--text-tertiary);
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

@media (max-width: 768px) {
  .credits-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .credits-section {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .dependency-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>