<script setup lang="ts">
import { ref } from 'vue'
import PlayerSetup from './PlayerSetup.vue'

const emit = defineEmits<{
  create: [name: string]
  back: []
}>()

const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit(name: string) {
  loading.value = true
  errorMsg.value = ''
  try {
    emit('create', name)
  } catch (e: any) {
    errorMsg.value = e.message || '建立房間失敗'
    loading.value = false
  }
}
</script>

<template>
  <div class="card create-room">
    <div class="header">
      <button class="back-btn" @click="emit('back')">← 返回</button>
      <h2>建立房間</h2>
    </div>
    <PlayerSetup
      submit-label="建立房間"
      :loading="loading"
      :error-msg="errorMsg"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.create-room {
  max-width: 360px;
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 18px;
  margin: 0;
}

.back-btn {
  padding: 4px 10px;
  font-size: 13px;
}
</style>
