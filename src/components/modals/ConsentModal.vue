<template>
  <div class="consent-overlay">
    <div class="consent-modal">
      <div class="consent-header">
        <h2>Welcome to SonoWeb</h2>
        <p>Please review and accept our Terms of Service and Privacy Policy to continue</p>
      </div>

      <div class="consent-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'terms' }]"
          @click="activeTab = 'terms'"
        >
          Terms of Service
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'privacy' }]"
          @click="activeTab = 'privacy'"
        >
          Privacy Policy
        </button>
      </div>

      <div class="consent-content">
        <iframe
          v-if="activeTab === 'terms'"
          src="https://sono.wtf/terms"
          frameborder="0"
          class="consent-iframe"
        ></iframe>
        <iframe
          v-if="activeTab === 'privacy'"
          src="https://sono.wtf/privacy"
          frameborder="0"
          class="consent-iframe"
        ></iframe>
      </div>

      <div class="consent-footer">
        <label class="consent-checkbox">
          <input type="checkbox" v-model="termsAccepted" />
          <span>I have read and agree to the Terms of Service</span>
        </label>
        <label class="consent-checkbox">
          <input type="checkbox" v-model="privacyAccepted" />
          <span>I have read and agree to the Privacy Policy</span>
        </label>

        <div v-if="error" class="consent-error">{{ error }}</div>

        <button
          class="btn btn-primary btn-large"
          :disabled="!canAccept || loading"
          @click="handleAccept"
        >
          {{ loading ? 'Processing...' : 'Accept and Continue' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import * as api from '@/services/api'

const authStore = useAuthStore()
const uiStore = useUIStore()

const activeTab = ref('terms')
const termsAccepted = ref(false)
const privacyAccepted = ref(false)
const loading = ref(false)
const error = ref(null)

const canAccept = computed(() => termsAccepted.value && privacyAccepted.value)

async function handleAccept() {
  if (!canAccept.value) return

  loading.value = true
  error.value = null

  try {
    //record terms of service consent
    await api.recordConsent({
      consent_type: 'terms_of_service',
      consent_version: '1.0'
    })

    //record privacy policy consent
    await api.recordConsent({
      consent_type: 'privacy_policy',
      consent_version: '1.0'
    })

    //mark consent as given in auth store
    authStore.setConsentGiven(true)
  } catch (err) {
    console.error('Failed to record consent:', err)
    error.value = 'Failed to record consent. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.consent-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.consent-modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 900px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.consent-header {
  padding: 32px 32px 24px;
  text-align: center;
  border-bottom: 1px solid var(--border-light-10);
}

.consent-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 8px 0;
}

.consent-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.consent-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 32px 0;
  border-bottom: 1px solid var(--border-light-10);
}

.tab-button {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-button:hover {
  color: var(--text-light);
  background: var(--bg-surface);
}

.tab-button.active {
  color: var(--text-light);
  border-bottom-color: var(--text-light);
}

.consent-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.consent-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.consent-footer {
  padding: 24px 32px;
  border-top: 1px solid var(--border-light-10);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.consent-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.consent-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--text-light);
}

.consent-checkbox span {
  flex: 1;
}

.consent-error {
  padding: 12px;
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
  border-radius: var(--border-radius-sm);
  font-size: 14px;
}

.btn-large {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .consent-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .consent-header,
  .consent-footer {
    padding: 24px 20px;
  }

  .consent-tabs {
    padding: 12px 20px 0;
  }

  .tab-button {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>