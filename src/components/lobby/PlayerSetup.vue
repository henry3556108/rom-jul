<script setup lang="ts">
import { ref } from 'vue'
import { PLAYER_COLORS } from '../../constants'

defineProps<{
  submitLabel: string
  loading?: boolean
  errorMsg?: string
}>()

const emit = defineEmits<{
  submit: [name: string, color: string]
}>()

const name = ref('')
const selectedColor = ref<string>(PLAYER_COLORS[0])

function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('submit', trimmed, selectedColor.value)
}
</script>

<template>
  <form class="player-setup" @submit.prevent="handleSubmit">
    <div class="field">
      <label>暱稱</label>
      <input
        v-model="name"
        type="text"
        placeholder="輸入你的暱稱"
        maxlength="12"
        required
      />
    </div>

    <div class="field">
      <label>顏色</label>
      <div class="color-picker">
        <button
          v-for="color in PLAYER_COLORS"
          :key="color"
          type="button"
          class="color-swatch"
          :class="{ selected: selectedColor === color }"
          :style="{ background: color }"
          @click="selectedColor = color"
        />
      </div>
    </div>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <button type="submit" class="submit-btn" :disabled="!name.trim() || loading">
      {{ loading ? '連線中...' : submitLabel }}
    </button>
  </form>
</template>

<style scoped>
.player-setup {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  color: var(--text-muted);
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid transparent;
  padding: 0;
  min-width: unset;
}

.color-swatch:hover {
  background: unset;
  opacity: 0.8;
}

.color-swatch.selected {
  border-color: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.submit-btn {
  margin-top: 4px;
  padding: 10px 20px;
  font-size: 15px;
}

.error {
  color: var(--accent);
  font-size: 13px;
}
</style>
