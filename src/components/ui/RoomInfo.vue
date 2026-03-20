<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  roomId: string
}>()

const copied = ref(false)

function getShareUrl() {
  return `${window.location.origin}${window.location.pathname}?room=${props.roomId}`
}

async function copyId() {
  const url = getShareUrl()
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // Fallback: select from a temp input
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
}
</script>

<template>
  <div class="card room-info">
    <div class="label">房間代碼</div>
    <div class="id-row">
      <code class="room-id">{{ roomId }}</code>
      <button class="copy-btn" @click="copyId">
        {{ copied ? '已複製' : '複製連結' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.room-info {
  padding: 12px;
}

.label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-id {
  font-size: 14px;
  font-family: monospace;
  color: var(--accent);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-btn {
  padding: 4px 10px;
  font-size: 12px;
  white-space: nowrap;
}
</style>
