<script setup lang="ts">
import { computed } from 'vue'
import { CellState, HintType, type Player } from '../../types'

export interface PlayerMark {
  player: Player
  playerIndex: number
  state: CellState
  hintType: HintType | null
}

const props = defineProps<{
  marks: PlayerMark[]
  myPlayerIndex: number
}>()

const emit = defineEmits<{
  leftClick: [playerIndex: number]
  rightClick: [playerIndex: number]
}>()

const confirmedColor = computed(() => {
  const confirmed = props.marks.find(m => m.state === CellState.Confirmed)
  return confirmed ? confirmed.player.color : null
})

function handleClick() {
  emit('leftClick', props.myPlayerIndex)
}

function handleContext(e: MouseEvent) {
  e.preventDefault()
  emit('rightClick', props.myPlayerIndex)
}
</script>

<template>
  <td
    class="door-cell"
    :style="confirmedColor ? { background: `color-mix(in srgb, ${confirmedColor} 40%, var(--door-bg))` } : undefined"
    @click="handleClick"
    @contextmenu="handleContext"
  >
    <div class="dots-grid">
      <div
        v-for="m in marks"
        :key="m.playerIndex"
        class="dot"
        :class="{
          'is-me': m.playerIndex === myPlayerIndex,
          'dot-unknown': m.state === CellState.Unknown && !m.hintType,
          'dot-confirmed': m.state === CellState.Confirmed,
          'dot-excluded': m.state === CellState.Excluded,
          'dot-hint-cross': m.state === CellState.Unknown && m.hintType === HintType.CrossElimination,
          'dot-hint-unique': m.state === CellState.Unknown && m.hintType === HintType.UniqueCandidate,
        }"
        :style="{ '--pc': m.player.color }"
        :title="`${m.player.name}: ${
          m.state === CellState.Confirmed ? '確認' :
          m.state === CellState.Excluded ? '排除' :
          m.hintType === HintType.UniqueCandidate ? '唯一候選' :
          m.hintType === HintType.CrossElimination ? '可排除' : '未標記'
        }`"
      >
        <span v-if="m.state === CellState.Confirmed" class="symbol">✓</span>
        <span v-else-if="m.state === CellState.Excluded" class="symbol">✗</span>
        <span v-else-if="m.hintType === HintType.UniqueCandidate" class="symbol">?</span>
      </div>
    </div>
  </td>
</template>

<style scoped>
.door-cell {
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  background: var(--door-bg);
  border: 1px solid var(--door-border);
  transition: background 0.12s;
  vertical-align: middle;
}

.door-cell:hover {
  background: color-mix(in srgb, var(--door-bg) 85%, white);
}

.dots-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  width: 44px;
  margin: 0 auto;
}

.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  position: relative;
}

.symbol {
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

/* ── Unknown: hollow ring ── */
.dot-unknown {
  border: 3px solid var(--pc);
  opacity: 0.5;
}

/* ── Confirmed: solid filled circle ── */
.dot-confirmed {
  background: var(--pc);
  box-shadow: 0 0 4px color-mix(in srgb, var(--pc) 40%, transparent);
}

.dot-confirmed .symbol {
  color: #fff;
  font-size: 10px;
}

/* ── Excluded: grey circle with ✗ ── */
.dot-excluded {
  background: rgba(0, 0, 0, 0.05);
  border: 2px dashed rgba(0, 0, 0, 0.18);
}

.dot-excluded .symbol {
  color: rgba(0, 0, 0, 0.35);
  font-size: 9px;
}

/* ── Cross elimination hint: dimmed, faded ring ── */
.dot-hint-cross {
  border: 2px dashed rgba(0, 0, 0, 0.12);
  opacity: 0.4;
}

/* ── Unique candidate hint: semi-filled + pulsing ring ── */
.dot-hint-unique {
  background: color-mix(in srgb, var(--pc) 25%, transparent);
  border: 2px solid var(--pc);
  animation: pulse-ring 1.8s ease-in-out infinite;
}

.dot-hint-unique .symbol {
  color: var(--pc);
  font-size: 9px;
  font-weight: 800;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--pc) 30%, transparent); }
  50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--pc) 10%, transparent); }
}

/* ── My dot: extra outer ring indicator ── */
.dot.is-me {
  outline: 2px solid var(--pc);
  outline-offset: 1px;
}

.dot.is-me.dot-excluded,
.dot.is-me.dot-hint-cross {
  outline-color: rgba(0, 0, 0, 0.15);
}
</style>
