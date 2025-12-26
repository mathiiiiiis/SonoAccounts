<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">Sono Web</h1>
        <p class="auth-subtitle">Reset your password</p>
      </div>

      <div v-if="success" class="auth-success">
        <p style="margin-bottom: 12px;">
          <strong>Check your email!</strong>
        </p>
        <p style="margin-bottom: 0;">
          If an account exists with that email, we've sent password reset instructions. 
          The link will expire in 1 hour.
        </p>
      </div>

      <form v-else @submit.prevent="handleForgotPassword" class="auth-form">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            required
            autocomplete="email"
            :disabled="loading"
          />
          <div class="form-hint">
            We'll send a password reset link to this email address.
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="loading"
          style="width: 100%;"
        >
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Remember your password?
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as api from '@/services/api'

const email = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(false)

async function handleForgotPassword() {
  loading.value = true
  error.value = null

  try {
    await api.forgotPassword(email.value)
    success.value = true
  } catch (err) {
    if (err.response?.status === 429) {
      error.value = 'Too many requests. Please try again later.'
    } else {
      error.value = 'An error occurred. Please try again.'
    }
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

.auth-success {
  padding: 16px;
  border-radius: var(--border-radius-sm);
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success-text);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
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