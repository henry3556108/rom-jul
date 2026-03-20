import { computed, type Reactive } from 'vue'
import { CellState, HintType, type GameState, type HintCell } from '../types'
import { DOOR_COUNT, FLOOR_COUNT } from '../constants'

export function useHints(state: Reactive<GameState>) {
  const hints = computed<HintCell[]>(() => {
    const result: HintCell[] = []
    const playerCount = state.players.length

    for (let f = 0; f < FLOOR_COUNT; f++) {
      const floor = state.floors[f]
      if (!floor) continue

      // ── Cross elimination ──
      // When player p confirmed door d:
      //   1. Vertical: other players' same door d → hint exclude
      //   2. Horizontal: same player's other doors → hint exclude
      for (let p = 0; p < playerCount; p++) {
        for (let d = 0; d < DOOR_COUNT; d++) {
          if (floor[p]?.[d]?.state === CellState.Confirmed) {
            // Vertical: same door, other players
            for (let op = 0; op < playerCount; op++) {
              if (op === p) continue
              if (floor[op]?.[d]?.state === CellState.Unknown) {
                result.push({
                  floorIndex: f,
                  playerIndex: op,
                  doorIndex: d,
                  hintType: HintType.CrossElimination,
                })
              }
            }
            // Horizontal: same player, other doors
            for (let od = 0; od < DOOR_COUNT; od++) {
              if (od === d) continue
              if (floor[p]?.[od]?.state === CellState.Unknown) {
                result.push({
                  floorIndex: f,
                  playerIndex: p,
                  doorIndex: od,
                  hintType: HintType.CrossElimination,
                })
              }
            }
          }
        }
      }

      // ── Unique candidate ──
      // 1. Row: player has only 1 unknown door left → hint that door
      // 2. Column: door has only 1 non-excluded/non-confirmed player left → hint that player
      for (let p = 0; p < playerCount; p++) {
        const hasConfirmed = Array.from({ length: DOOR_COUNT }, (_, d) => d)
          .some(d => floor[p]?.[d]?.state === CellState.Confirmed)
        if (hasConfirmed) continue

        const unknownDoors: number[] = []
        for (let d = 0; d < DOOR_COUNT; d++) {
          if ((floor[p]?.[d]?.state ?? CellState.Unknown) === CellState.Unknown) {
            unknownDoors.push(d)
          }
        }
        if (unknownDoors.length === 1) {
          result.push({
            floorIndex: f,
            playerIndex: p,
            doorIndex: unknownDoors[0],
            hintType: HintType.UniqueCandidate,
          })
        }
      }

      for (let d = 0; d < DOOR_COUNT; d++) {
        // Skip if door already confirmed by someone
        const alreadyConfirmed = Array.from({ length: playerCount }, (_, p) => p)
          .some(p => floor[p]?.[d]?.state === CellState.Confirmed)
        if (alreadyConfirmed) continue

        const candidatePlayers: number[] = []
        for (let p = 0; p < playerCount; p++) {
          // Skip players who confirmed a different door on this floor
          const confirmedOther = Array.from({ length: DOOR_COUNT }, (_, od) => od)
            .some(od => od !== d && floor[p]?.[od]?.state === CellState.Confirmed)
          if (confirmedOther) continue
          if ((floor[p]?.[d]?.state ?? CellState.Unknown) === CellState.Unknown) {
            candidatePlayers.push(p)
          }
        }
        if (candidatePlayers.length === 1) {
          result.push({
            floorIndex: f,
            playerIndex: candidatePlayers[0],
            doorIndex: d,
            hintType: HintType.UniqueCandidate,
          })
        }
      }
    }

    return result
  })

  function getHint(floorIndex: number, playerIndex: number, doorIndex: number): HintType | null {
    // Prefer unique candidate over cross elimination
    const match = hints.value.filter(
      h => h.floorIndex === floorIndex && h.playerIndex === playerIndex && h.doorIndex === doorIndex,
    )
    if (match.some(h => h.hintType === HintType.UniqueCandidate)) return HintType.UniqueCandidate
    if (match.some(h => h.hintType === HintType.CrossElimination)) return HintType.CrossElimination
    return null
  }

  return { hints, getHint }
}
