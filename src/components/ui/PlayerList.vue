<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Player } from '../../types'
import { MAX_PLAYERS, PLAYER_COLORS } from '../../constants'

defineProps<{
  players: Player[]
  myIndex: number
}>()

const emit = defineEmits<{
  nameChange: [newName: string]
}>()

const editingIndex = ref(-1)
const editName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit(index: number, currentName: string) {
  editingIndex.value = index
  editName.value = currentName
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function commitEdit() {
  const trimmed = editName.value.trim()
  if (trimmed && editingIndex.value !== -1) {
    emit('nameChange', trimmed)
  }
  editingIndex.value = -1
}
</script>

<template>
  <div class="player-cell-wrapper">
    <div class="player-cell">
      <div
        v-for="i in MAX_PLAYERS"
        :key="i - 1"
        class="quadrant"
      >
        <template v-if="i - 1 < players.length">
          <span class="dot" :style="{ background: players[i - 1].color }"></span>
          <!-- Editable own name -->
          <template v-if="i - 1 === myIndex">
            <input
              v-if="editingIndex === i - 1"
              ref="inputRef"
              v-model="editName"
              class="name-input"
              maxlength="12"
              @blur="commitEdit"
              @keydown.enter="commitEdit"
            />
            <span
              v-else
              class="name editable"
              @click="startEdit(i - 1, players[i - 1].name)"
            >{{ players[i - 1].name }}</span>
            <span class="me-tag">我</span>
          </template>
          <span v-else class="name">{{ players[i - 1].name }}</span>
        </template>
        <template v-else>
          <span class="dot empty-dot" :style="{ borderColor: PLAYER_COLORS[i - 1] }"></span>
          <span class="name empty-name">等待加入</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-cell-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.player-cell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--door-bg);
  border: 1px solid var(--door-border);
  border-radius: 6px;
  overflow: hidden;
}

.quadrant {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: #2c2c3a;
  border: 1px solid var(--door-border);
  min-width: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-dot {
  background: transparent;
  border: 2px dashed #8a8d9e;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable {
  cursor: pointer;
  border-bottom: 1px dashed #8a8d9e;
}

.editable:hover {
  color: var(--accent);
}

.name-input {
  width: 72px;
  font-size: 12px;
  padding: 1px 4px;
  border: 1px solid var(--accent);
  border-radius: 3px;
  outline: none;
  background: #fff;
  color: #2c2c3a;
}

.empty-name {
  color: #7a7d8e;
  font-size: 12px;
}

.me-tag {
  font-size: 10px;
  background: var(--accent);
  color: #fff;
  padding: 0px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
</style>
