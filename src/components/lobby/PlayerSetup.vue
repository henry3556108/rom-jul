<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  submitLabel: string
  loading?: boolean
  errorMsg?: string
}>()

const emit = defineEmits<{
  submit: [name: string]
}>()

const name = ref('')

function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
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
