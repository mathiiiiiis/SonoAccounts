<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">Sono Web</h1>
        <p class="auth-subtitle">Create your account</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="Choose a username"
            required
            minlength="3"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="formData.password"
            type="password"
            placeholder="Choose a strong password"
            required
            minlength="8"
            autocomplete="new-password"
            @input="checkPasswordStrength"
          />
          <div v-if="formData.password" class="password-strength">
            <div class="password-strength-bar">
              <div
                class="password-strength-fill"
                :style="{ width: passwordStrength + '%' }"
                :class="passwordStrengthClass"
              ></div>
            </div>
            <span class="password-strength-text">{{ passwordStrengthText }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Display Name (optional)</label>
          <input
            v-model="formData.display_name"
            type="text"
            placeholder="How should we call you?"
            maxlength="50"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="loading || passwordStrength < 60"
          style="width: 100%;"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Already have an account?
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { calculatePasswordStrength } from '@/services/crypto'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const formData = ref({
  username: '',
  email: '',
  password: '',
  display_name: ''
})

const loading = ref(false)
const error = ref(null)
const passwordStrength = ref(0)

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value < 40) return 'weak'
  if (passwordStrength.value < 70) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value < 40) return 'Weak'
  if (passwordStrength.value < 70) return 'Medium'
  return 'Strong'
})

function checkPasswordStrength() {
  passwordStrength.value = calculatePasswordStrength(formData.value.password)
}

async function handleRegister() {
  loading.value = true
  error.value = null

  try {
    const registerData = {
      ...formData.value,
      display_name: formData.value.display_name.trim() || formData.value.username
    }
    await authStore.register(registerData)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Registration failed. Please try again.'
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

.password-strength {
  margin-top: 8px;
}

.password-strength-bar {
  height: 4px;
  background: var(--bg-surface);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.password-strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--transition-normal), background var(--transition-normal);
}

.password-strength-fill.weak {
  background: var(--error-border);
}

.password-strength-fill.medium {
  background: var(--warning-border);
}

.password-strength-fill.strong {
  background: var(--success-border);
}

.password-strength-text {
  font-size: 12px;
  color: var(--text-tertiary);
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