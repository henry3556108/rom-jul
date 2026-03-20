export const FLOOR_COUNT = 10
export const DOOR_COUNT = 4
export const MAX_PLAYERS = 4

export const PLAYER_COLORS = [
  '#e74c3c', // 紅
  '#3498db', // 藍
  '#2ecc71', // 綠
  '#f39c12', // 橘
] as const

export const FLOOR_LABELS = Array.from(
  { length: FLOOR_COUNT },
  (_, i) => `L${i + 1}`,
)

export const DOOR_LABELS = Array.from(
  { length: DOOR_COUNT },
  (_, i) => `門 ${i + 1}`,
)
