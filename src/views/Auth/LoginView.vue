<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">Sono Web</h1>
        <p class="auth-subtitle">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">Username or Email</label>
          <input
            v-model="credentials.username"
            type="text"
            placeholder="Enter your username or email"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="credentials.password"
            type="password"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="loading"
          style="width: 100%;"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <router-link to="/register" class="auth-link">Create one</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()

const credentials = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)

async function handleLogin() {
  loading.value = true
  error.value = null

  try {
    await authStore.login(credentials.value.username, credentials.value.password)
    //redirect to route
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err.response?.data?.detail || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  padding: 48px;
  box-shadow: var(--shadow-xl);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-error {
  padding: 12px 16px;
  border-radius: var(--border-radius-sm);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
  font-size: 14px;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-link {
  color: var(--text-light);
  font-weight: 500;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.auth-link:hover {
  opacity: 0.8;
}

@media (max-width: 480px) {
  .auth-container {
    padding: 32px 24px;
  }
}
</style>