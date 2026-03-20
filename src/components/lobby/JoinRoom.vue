<script setup lang="ts">
import { ref, watch } from 'vue'
import PlayerSetup from './PlayerSetup.vue'

const props = defineProps<{
  initialRoomId?: string
}>()

const emit = defineEmits<{
  join: [roomId: string, name: string]
  back: []
}>()

const targetRoomId = ref(props.initialRoomId || '')

watch(() => props.initialRoomId, (val) => {
  if (val) targetRoomId.value = val
})
const loading = ref(false)
const errorMsg = ref('')

function handleSubmit(name: string) {
  const trimmedId = targetRoomId.value.trim()
  if (!trimmedId) {
    errorMsg.value = '請輸入房間代碼'
    return
  }
  loading.value = true
  errorMsg.value = ''
  emit('join', trimmedId, name)
}

defineExpose({ setError: (msg: string) => { errorMsg.value = msg; loading.value = false } })
</script>

<template>
  <div class="card join-room">
    <div class="header">
      <button class="back-btn" @click="emit('back')">← 返回</button>
      <h2>加入房間</h2>
    </div>

    <div class="field">
      <label>房間代碼</label>
      <input
        v-model="targetRoomId"
        type="text"
        placeholder="輸入房間代碼"
      />
    </div>

    <PlayerSetup
      submit-label="加入房間"
      :loading="loading"
      :error-msg="errorMsg"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.join-room {
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

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field label {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
