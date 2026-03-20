import { reactive } from 'vue'
import { CellState, type CellMark, type FloorState, type GameState, type Player } from '../types'
import { FLOOR_COUNT, DOOR_COUNT } from '../constants'

function createEmptyFloor(): FloorState {
  return Array.from({ length: DOOR_COUNT }, () =>
    Array.from({ length: DOOR_COUNT }, (): CellMark => ({ state: CellState.Unknown })),
  )
}

function createEmptyFloors(): FloorState[] {
  return Array.from({ length: FLOOR_COUNT }, () => createEmptyFloor())
}

export function useGameState() {
  const state = reactive<GameState>({
    players: [],
    floors: createEmptyFloors(),
  })

  function addPlayer(player: Player): number {
    state.players.push(player)
    return state.players.length - 1
  }

  function removePlayer(playerIndex: number) {
    state.players.splice(playerIndex, 1)
    // Shift floor data: remove row for this player on every floor
    for (const floor of state.floors) {
      floor.splice(playerIndex, 1)
    }
  }

  function setMark(floorIndex: number, playerIndex: number, doorIndex: number, cellState: CellState) {
    state.floors[floorIndex][playerIndex][doorIndex] = { state: cellState }
  }

  function getMark(floorIndex: number, playerIndex: number, doorIndex: number): CellState {
    return state.floors[floorIndex]?.[playerIndex]?.[doorIndex]?.state ?? CellState.Unknown
  }

  /** Ensure floor data has rows for all current players */
  function ensurePlayerRows() {
    for (const floor of state.floors) {
      while (floor.length < state.players.length) {
        floor.push(Array.from({ length: DOOR_COUNT }, (): CellMark => ({ state: CellState.Unknown })))
      }
    }
  }

  /** Replace entire game state (used for FullSync) */
  function replaceState(newState: GameState) {
    state.players.splice(0, state.players.length, ...newState.players)
    state.floors.splice(0, state.floors.length, ...newState.floors)
  }

  /** Get a plain copy for serialization */
  function snapshot(): GameState {
    return JSON.parse(JSON.stringify(state))
  }

  return {
    state,
    addPlayer,
    removePlayer,
    setMark,
    getMark,
    ensurePlayerRows,
    replaceState,
    snapshot,
  }
}
