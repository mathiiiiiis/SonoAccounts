<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">Sono Web</h1>
        <p class="auth-subtitle">Set your new password</p>
      </div>

      <div v-if="validatingToken" class="auth-info">
        <p>Validating reset link...</p>
      </div>

      <div v-else-if="tokenError" class="auth-error">
        <p style="margin-bottom: 12px;">
          <strong>Invalid or expired reset link</strong>
        </p>
        <p style="margin-bottom: 12px;">
          {{ tokenError }}
        </p>
        <router-link to="/forgot-password" class="auth-link">Request a new reset link</router-link>
      </div>

      <div v-else-if="success" class="auth-success">
        <p style="margin-bottom: 12px;">
          <strong>Password reset successful!</strong>
        </p>
        <p style="margin-bottom: 16px;">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <router-link to="/login">
          <button class="btn btn-primary btn-lg" style="width: 100%;">
            Go to Sign In
          </button>
        </router-link>
      </div>

      <form v-else @submit.prevent="handleResetPassword" class="auth-form">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter new password"
            required
            autocomplete="new-password"
            :disabled="loading"
            @input="validatePasswordStrength"
          />
          <div v-if="password" class="password-strength">
            <div class="password-strength-bar">
              <div 
                class="password-strength-fill" 
                :class="strengthClass"
                :style="{ width: strengthPercent + '%' }"
              ></div>
            </div>
            <div class="password-strength-text" :class="strengthClass">
              {{ strengthText }}
            </div>
          </div>
          <div v-if="passwordErrors.length > 0" class="form-error">
            <ul style="margin: 0; padding-left: 20px;">
              <li v-for="err in passwordErrors" :key="err">{{ err }}</li>
            </ul>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            required
            autocomplete="new-password"
            :disabled="loading"
          />
          <div v-if="confirmPassword && password !== confirmPassword" class="form-error">
            Passwords do not match
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="loading || !isPasswordValid || password !== confirmPassword"
          style="width: 100%;"
        >
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div class="auth-footer" v-if="!success">
        <p>
          Remember your password?
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/services/api'
import { validatePassword, calculatePasswordStrength } from '@/services/crypto'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const validatingToken = ref(true)
const tokenError = ref(null)
const error = ref(null)
const success = ref(false)
const passwordErrors = ref([])
const passwordStrength = ref(0)

const isPasswordValid = computed(() => {
  return passwordErrors.value.length === 0 && password.value.length > 0
})

const strengthPercent = computed(() => {
  return passwordStrength.value
})

const strengthClass = computed(() => {
  if (passwordStrength.value < 40) return 'weak'
  if (passwordStrength.value < 70) return 'medium'
  return 'strong'
})

const strengthText = computed(() => {
  if (passwordStrength.value < 40) return 'Weak password'
  if (passwordStrength.value < 70) return 'Medium password'
  return 'Strong password'
})

function validatePasswordStrength() {
  const validation = validatePassword(password.value)
  passwordErrors.value = validation.errors
  passwordStrength.value = calculatePasswordStrength(password.value)
}

async function verifyToken() {
  validatingToken.value = true
  tokenError.value = null

  try {
    await api.verifyResetToken(token.value)
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 400) {
      tokenError.value = 'This reset link is invalid or has already been used.'
    } else if (err.response?.status === 410) {
      tokenError.value = 'This reset link has expired. Reset links are valid for 1 hour.'
    } else {
      tokenError.value = 'Unable to verify reset link. Please try again.'
    }
  } finally {
    validatingToken.value = false
  }
}

async function handleResetPassword() {
  loading.value = true
  error.value = null

  try {
    await api.resetPassword(token.value, password.value)
    success.value = true
  } catch (err) {
    if (err.response?.status === 429) {
      error.value = 'Too many reset attempts. Please try again later.'
    } else if (err.response?.status === 404 || err.response?.status === 400) {
      error.value = 'Invalid or expired reset link. Please request a new one.'
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else {
      error.value = 'Failed to reset password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  token.value = route.query.token
  
  if (!token.value) {
    tokenError.value = 'No reset token provided in the URL.'
    validatingToken.value = false
    return
  }

  await verifyToken()
})
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

.auth-info {
  padding: 16px;
  border-radius: var(--border-radius-sm);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  color: var(--info-text);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
}

.password-strength {
  margin-top: 8px;
}

.password-strength-bar {
  height: 4px;
  background: var(--bg-surface);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.password-strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.password-strength-fill.weak {
  background: #dc3545;
}

.password-strength-fill.medium {
  background: #ffc107;
}

.password-strength-fill.strong {
  background: #28a745;
}

.password-strength-text {
  font-size: 12px;
  font-weight: 500;
}

.password-strength-text.weak {
  color: #dc3545;
}

.password-strength-text.medium {
  color: #ffc107;
}

.password-strength-text.strong {
  color: #28a745;
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