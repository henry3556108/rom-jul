export enum CellState {
  Unknown = 'unknown',
  Confirmed = 'confirmed',
  Excluded = 'excluded',
}

export interface CellMark {
  state: CellState
}

/** 每層樓 = [playerIndex][doorIndex] */
export type FloorState = CellMark[][]

export interface Player {
  id: string       // PeerJS connection ID (host uses 'host')
  name: string
  color: string
}

export interface GameState {
  players: Player[]
  floors: FloorState[]  // length = FLOOR_COUNT
}

// ── P2P Messages ──

export type PeerMessage =
  | PlayerInfoMsg
  | FullSyncMsg
  | PlayerJoinedMsg
  | PlayerLeftMsg
  | SendMarkMsg
  | MarkUpdateMsg
  | NameChangeMsg
  | SendNameChangeMsg
  | ColorChangeMsg
  | SendColorChangeMsg
  | RoomClosedMsg

export interface PlayerInfoMsg {
  type: 'PlayerInfo'
  name: string
  color: string
}

export interface FullSyncMsg {
  type: 'FullSync'
  gameState: GameState
  yourIndex: number
}

export interface PlayerJoinedMsg {
  type: 'PlayerJoined'
  player: Player
  playerIndex: number
}

export interface PlayerLeftMsg {
  type: 'PlayerLeft'
  playerIndex: number
}

export interface SendMarkMsg {
  type: 'SendMark'
  floorIndex: number
  playerIndex: number
  doorIndex: number
  state: CellState
}

export interface MarkUpdateMsg {
  type: 'MarkUpdate'
  floorIndex: number
  playerIndex: number
  doorIndex: number
  state: CellState
}

export interface NameChangeMsg {
  type: 'NameChange'
  playerIndex: number
  newName: string
}

export interface SendNameChangeMsg {
  type: 'SendNameChange'
  playerIndex: number
  newName: string
}

export interface ColorChangeMsg {
  type: 'ColorChange'
  playerIndex: number
  newColor: string
}

export interface SendColorChangeMsg {
  type: 'SendColorChange'
  playerIndex: number
  newColor: string
}

export interface RoomClosedMsg {
  type: 'RoomClosed'
}

// ── Hints ──

export enum HintType {
  CrossElimination = 'cross-elimination',
  UniqueCandidate = 'unique-candidate',
}

export interface HintCell {
  floorIndex: number
  playerIndex: number
  doorIndex: number
  hintType: HintType
}
