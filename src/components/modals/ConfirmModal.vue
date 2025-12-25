<template>
  <div class="modal-overlay" @click.self="cancel">
    <div class="confirm-modal">
      <div class="modal-header">
        <div class="modal-icon" :class="iconClass">
          <svg v-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4M12 17h.01"/>
          </svg>

          <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>

          <svg v-else width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <h2>{{ title }}</h2>
      </div>

      <div class="modal-body">
        <p>{{ message }}</p>
        <div v-if="details" class="details">{{ details }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="cancel">
          {{ cancelText || 'Cancel' }}
        </button>
        <button :class="['btn', confirmClass]" @click="confirm" :disabled="loading">
          {{ loading ? 'Processing...' : (confirmText || 'Confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // 'info', 'warning', 'danger'
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const iconClass = computed(() => {
  return {
    'icon-danger': props.type === 'danger',
    'icon-warning': props.type === 'warning',
    'icon-info': props.type === 'info'
  }
})

const confirmClass = computed(() => {
  if (props.type === 'danger') return 'btn-danger'
  if (props.type === 'warning') return 'btn-warning'
  return 'btn-primary'
})

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid var(--border-light-10);
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.modal-icon.icon-danger {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.modal-icon.icon-warning {
  background: rgba(245, 158, 11, 0.15);
  color: rgb(245, 158, 11);
}

.modal-icon.icon-info {
  background: rgba(59, 130, 246, 0.15);
  color: rgb(59, 130, 246);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.details {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-surface);
  border-radius: var(--border-radius-sm);
  font-size: 13px;
  color: var(--text-tertiary);
  font-family: monospace;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light-10);
}

.modal-footer .btn {
  flex: 1;
  padding: 12px;
  border-radius: var(--border-radius);
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.btn-warning {
  background: rgba(245, 158, 11, 0.15);
  color: rgb(245, 158, 11);
}

.btn-warning:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.25);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>