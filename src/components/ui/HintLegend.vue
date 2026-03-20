<script setup lang="ts">
</script>

<template>
  <div class="card hint-legend">
    <div class="label">圖例說明</div>
    <ul>
      <li>
        <span class="dot dot-unknown"></span>
        <span>未標記</span>
      </li>
      <li>
        <span class="dot dot-confirmed">✓</span>
        <span>確認 (左鍵)</span>
      </li>
      <li>
        <span class="dot dot-excluded">✗</span>
        <span>排除 (右鍵)</span>
      </li>
      <li>
        <span class="dot dot-cross"></span>
        <span>交叉消去</span>
      </li>
      <li>
        <span class="dot dot-unique">?</span>
        <span>唯一候選</span>
      </li>
    </ul>
    <p class="note">圓點外框 = 你自己</p>
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
  gap: 8px;
}

li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
}

.dot-unknown {
  border: 2px solid var(--accent);
  opacity: 0.35;
}

.dot-confirmed {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 6px rgba(233, 69, 96, 0.5);
}

.dot-excluded {
  background: rgba(255, 255, 255, 0.08);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.25);
}

.dot-cross {
  border: 2px dashed rgba(255, 255, 255, 0.12);
  opacity: 0.4;
}

.dot-unique {
  background: rgba(233, 69, 96, 0.35);
  border: 2px solid var(--accent);
  color: var(--accent);
  animation: pulse 1.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0.3); }
  50% { box-shadow: 0 0 0 4px rgba(233, 69, 96, 0.1); }
}

.note {
  margin-top: 10px;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
