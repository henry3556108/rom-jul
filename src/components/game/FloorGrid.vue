<script setup lang="ts">
import { CellState, HintType, type GameState } from '../../types'
import { DOOR_COUNT } from '../../constants'
import DoorCell, { type PlayerMark } from './DoorCell.vue'

const props = defineProps<{
  floorIndex: number
  state: GameState
  myPlayerIndex: number
  getHint: (floorIndex: number, playerIndex: number, doorIndex: number) => HintType | null
}>()

const emit = defineEmits<{
  mark: [floorIndex: number, playerIndex: number, doorIndex: number, newState: CellState]
}>()

function getMarks(doorIndex: number): PlayerMark[] {
  return props.state.players.map((player, p) => ({
    player,
    playerIndex: p,
    state: props.state.floors[props.floorIndex]?.[p]?.[doorIndex]?.state ?? CellState.Unknown,
    hintType: props.getHint(props.floorIndex, p, doorIndex),
  }))
}

function handleLeftClick(doorIndex: number, playerIndex: number) {
  const current = props.state.floors[props.floorIndex]?.[playerIndex]?.[doorIndex]?.state ?? CellState.Unknown
  const newState = current === CellState.Confirmed ? CellState.Unknown : CellState.Confirmed
  emit('mark', props.floorIndex, playerIndex, doorIndex, newState)
}

function handleRightClick(doorIndex: number, playerIndex: number) {
  const current = props.state.floors[props.floorIndex]?.[playerIndex]?.[doorIndex]?.state ?? CellState.Unknown
  const newState = current === CellState.Excluded ? CellState.Unknown : CellState.Excluded
  emit('mark', props.floorIndex, playerIndex, doorIndex, newState)
}
</script>

<template>
  <tr class="floor-row">
    <td class="floor-label">L{{ floorIndex + 1 }}</td>
    <DoorCell
      v-for="d in DOOR_COUNT"
      :key="d"
      :marks="getMarks(d - 1)"
      :my-player-index="myPlayerIndex"
      @left-click="(pi) => handleLeftClick(d - 1, pi)"
      @right-click="(pi) => handleRightClick(d - 1, pi)"
    />
  </tr>
</template>

<style scoped>
.floor-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  padding: 2px 6px;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
