<template>
  <div class="modal-overlay" @click.self="cancel">
    <div class="modal">
      <div class="modal-header">
        <h2>Crop Profile Picture</h2>
        <button class="modal-close" @click="cancel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="crop-container">
          <img ref="imageElement" :src="imageSrc" alt="Crop preview" />
        </div>
        <p class="form-hint">Drag to reposition, scroll to zoom</p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cancel">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" @click="cropAndSave">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps({
  image: {
    type: File,
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])

const imageElement = ref(null)
const imageSrc = ref('')
const cropper = ref(null)

onMounted(() => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result

    setTimeout(() => {
      if (imageElement.value) {
        cropper.value = new Cropper(imageElement.value, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 1,
          restore: false,
          modal: true,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          minContainerWidth: 300,
          minContainerHeight: 300
        })
      }
    }, 100)
  }
  reader.readAsDataURL(props.image)
})

onUnmounted(() => {
  if (cropper.value) {
    cropper.value.destroy()
  }
})

function cropAndSave() {
  if (!cropper.value) return

  const canvas = cropper.value.getCroppedCanvas({
    width: 512,
    height: 512,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  })

  canvas.toBlob((blob) => {
    const file = new File([blob], props.image.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
    emit('save', file)
  }, 'image/jpeg', 0.95)
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

.modal {
  background: var(--bg-container);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-light-10);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-surface);
  color: var(--text-light);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.crop-container {
  width: 100%;
  max-height: 400px;
  background: var(--bg-surface);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.crop-container img {
  max-width: 100%;
  display: block;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light-10);
}

:deep(.cropper-container) {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
}

:deep(.cropper-view-box) {
  outline: 2px solid var(--text-light);
  outline-offset: -1px;
  border-radius: 50%;
}

:deep(.cropper-face) {
  background-color: transparent;
}

:deep(.cropper-dashed) {
  border-color: var(--border-light-30);
}

:deep(.cropper-center) {
  display: none;
}

:deep(.cropper-line),
:deep(.cropper-point) {
  background-color: var(--text-light);
}

:deep(.cropper-point) {
  width: 8px;
  height: 8px;
  opacity: 0;
}

:deep(.cropper-bg) {
  background-image: none;
}

:deep(.cropper-modal) {
  background: rgba(0, 0, 0, 0.6);
}
</style>