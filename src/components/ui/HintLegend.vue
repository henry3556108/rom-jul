<script setup lang="ts">
defineProps<{
  myColor: string
}>()
</script>

<template>
  <div class="card hint-legend">
    <div class="label">圖例說明</div>
    <ul>
      <li>
        <span class="icon icon-confirmed" :style="{ background: myColor, borderColor: myColor }">✓</span>
        <span>我的門 (左鍵確認)</span>
      </li>
      <li>
        <span class="icon icon-excluded">✗</span>
        <span>不是我的 (右鍵排除)</span>
      </li>
      <li>
        <span class="icon icon-greyed">—</span>
        <span>已無關 (我已確認其他門)</span>
      </li>
      <li>
        <span class="icon icon-idle"><small>✗✗</small></span>
        <span>小叉叉 = 已排除的人數</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.hint-legend {
  padding: 12px;
}

.label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.icon {
  width: 28px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.icon-confirmed {
  color: #fff;
}

.icon-excluded {
  background: rgba(0, 0, 0, 0.15);
  color: var(--accent);
  border-color: var(--door-border);
}

.icon-greyed {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.3);
  opacity: 0.5;
}

.icon-idle {
  background: var(--door-bg);
  color: rgba(0, 0, 0, 0.3);
  border-color: var(--door-border);
  font-size: 10px;
}
</style>
