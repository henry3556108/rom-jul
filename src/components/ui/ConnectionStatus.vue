<script setup lang="ts">
defineProps<{
  isReady: boolean
  error: string
}>()
</script>

<template>
  <div class="connection-status">
    <span v-if="error" class="status error">{{ error }}</span>
    <span v-else-if="isReady" class="status connected">已連線</span>
    <span v-else class="status connecting">連線中...</span>
  </div>
</template>

<style scoped>
.status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.connected {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.connecting {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
}

.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
</style>
