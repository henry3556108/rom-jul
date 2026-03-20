<script setup lang="ts">
import { type CellState, HintType, type GameState } from '../../types'
import { FLOOR_COUNT } from '../../constants'
import FloorGrid from './FloorGrid.vue'

defineProps<{
  state: GameState
  myPlayerIndex: number
  getHint: (floorIndex: number, playerIndex: number, doorIndex: number) => HintType | null
}>()

const emit = defineEmits<{
  mark: [floorIndex: number, playerIndex: number, doorIndex: number, newState: CellState]
}>()

const floorIndices = Array.from({ length: FLOOR_COUNT }, (_, i) => FLOOR_COUNT - 1 - i)
</script>

<template>
  <div class="game-board">
    <table class="board-table">
      <thead>
        <tr>
          <th class="corner"></th>
          <th v-for="d in 4" :key="d" class="door-header">門 {{ d }}</th>
        </tr>
      </thead>
      <tbody>
        <FloorGrid
          v-for="f in floorIndices"
          :key="f"
          :floor-index="f"
          :state="state"
          :my-player-index="myPlayerIndex"
          :get-hint="getHint"
          @mark="(fl, p, d, s) => emit('mark', fl, p, d, s)"
        />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.game-board {
  overflow-x: auto;
}

.board-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 2px 2px;
}

.corner {
  width: 32px;
}

.door-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 0;
  text-align: center;
}
</style>
