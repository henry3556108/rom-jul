export const FLOOR_COUNT = 10
export const DOOR_COUNT = 4
export const MAX_PLAYERS = 4

export const PLAYER_COLORS = [
  '#cccc00', // 黃
  '#00cc00', // 綠
  '#00cccc', // 藍
  '#cc00cc', // 紫
] as const

export const FLOOR_LABELS = Array.from(
  { length: FLOOR_COUNT },
  (_, i) => `L${i + 1}`,
)

export const DOOR_LABELS = Array.from(
  { length: DOOR_COUNT },
  (_, i) => `門 ${i + 1}`,
)
