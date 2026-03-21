import { ref, shallowRef, computed, onUnmounted } from 'vue'
import type { DataConnection } from 'peerjs'
import { usePeer } from './usePeer'
import { useGameState } from './useGameState'
import { useHints } from './useHints'
import type {
  PeerMessage,
  PlayerInfoMsg,
  SendMarkMsg,
  FullSyncMsg,
  PlayerJoinedMsg,
  PlayerLeftMsg,
  MarkUpdateMsg,
  NameChangeMsg,
  SendNameChangeMsg,
  ColorChangeMsg,
  SendColorChangeMsg,
  RoomClosedMsg,
} from '../types'
import { CellState } from '../types'
import { MAX_PLAYERS, DOOR_COUNT } from '../constants'
import type { CellMark } from '../types'

export function useRoom() {
  const { isReady, error, createPeer, connectTo, onConnection, onData, destroy } = usePeer()
  const { state, addPlayer, removePlayer, setMark, ensurePlayerRows, clearAllMarks, replaceState, snapshot } = useGameState()
  const { hints, getHint } = useHints(state)

  const isHost = ref(false)
  const inGame = ref(false)
  const myPlayerIndex = ref(-1)
  const roomId = ref('')

  // Host tracks connections
  const connections = shallowRef<DataConnection[]>([])

  // ── Host: broadcast to all joiners ──
  function broadcast(msg: PeerMessage, exclude?: DataConnection) {
    for (const conn of connections.value) {
      if (conn !== exclude && conn.open) {
        conn.send(msg)
      }
    }
  }

  function send(conn: DataConnection, msg: PeerMessage) {
    if (conn.open) conn.send(msg)
  }

  // ── colorReady: has the viewer picked a color? ──
  const colorReady = computed(() => {
    const idx = myPlayerIndex.value
    if (idx < 0 || idx >= state.players.length) return false
    return state.players[idx].color !== ''
  })

  // ── Create room (host) ──
  async function createRoom(name: string) {
    isHost.value = true
    // Generate a short room ID
    const id = 'rjpq-' + Math.random().toString(36).substring(2, 8)
    await createPeer(id)
    roomId.value = id

    // Add self as first player (color empty — chosen later)
    myPlayerIndex.value = addPlayer({ id: 'host', name, color: '' })
    ensurePlayerRows()
    inGame.value = true

    // Handle incoming connections
    onConnection((conn) => {
      connections.value = [...connections.value, conn]

      conn.on('close', () => {
        handleDisconnect(conn)
      })
    })

    // Handle incoming data
    onData((data, conn) => {
      const msg = data as PeerMessage
      handleHostMessage(msg, conn)
    })
  }

  function handleHostMessage(msg: PeerMessage, conn: DataConnection) {
    switch (msg.type) {
      case 'PlayerInfo': {
        if (state.players.length >= MAX_PLAYERS) return
        const pMsg = msg as PlayerInfoMsg
        const idx = addPlayer({ id: conn.peer, name: pMsg.name, color: pMsg.color })
        ensurePlayerRows()

        // Send FullSync to the new joiner
        const syncMsg: FullSyncMsg = {
          type: 'FullSync',
          gameState: snapshot(),
          yourIndex: idx,
        }
        send(conn, syncMsg)

        // Notify all others
        const joinedMsg: PlayerJoinedMsg = {
          type: 'PlayerJoined',
          player: { id: conn.peer, name: pMsg.name, color: pMsg.color },
          playerIndex: idx,
        }
        broadcast(joinedMsg, conn)
        break
      }
      case 'SendMark': {
        const sMsg = msg as SendMarkMsg
        // Validate: if confirming, check constraints
        if (sMsg.state === CellState.Confirmed) {
          const floor = state.floors[sMsg.floorIndex]
          if (floor) {
            // No other player already confirmed same door
            const alreadyConfirmed = floor.some(
              (row, pIdx) => pIdx !== sMsg.playerIndex && row[sMsg.doorIndex]?.state === CellState.Confirmed,
            )
            if (alreadyConfirmed) break // ignore

            // This player hasn't already confirmed another door on this floor
            const playerRow = floor[sMsg.playerIndex]
            if (playerRow?.some((cell, d) => d !== sMsg.doorIndex && cell?.state === CellState.Confirmed)) break
          }
        }
        setMark(sMsg.floorIndex, sMsg.playerIndex, sMsg.doorIndex, sMsg.state)
        // Broadcast to all
        const updateMsg: MarkUpdateMsg = {
          type: 'MarkUpdate',
          floorIndex: sMsg.floorIndex,
          playerIndex: sMsg.playerIndex,
          doorIndex: sMsg.doorIndex,
          state: sMsg.state,
        }
        broadcast(updateMsg)
        break
      }
      case 'SendNameChange': {
        const ncMsg = msg as SendNameChangeMsg
        state.players[ncMsg.playerIndex].name = ncMsg.newName
        const nameChangeMsg: NameChangeMsg = {
          type: 'NameChange',
          playerIndex: ncMsg.playerIndex,
          newName: ncMsg.newName,
        }
        broadcast(nameChangeMsg)
        break
      }
      case 'SendColorChange': {
        const ccMsg = msg as SendColorChangeMsg
        state.players[ccMsg.playerIndex].color = ccMsg.newColor
        const colorChangeMsg: ColorChangeMsg = {
          type: 'ColorChange',
          playerIndex: ccMsg.playerIndex,
          newColor: ccMsg.newColor,
        }
        broadcast(colorChangeMsg)
        break
      }
    }
  }

  function handleDisconnect(conn: DataConnection) {
    connections.value = connections.value.filter(c => c !== conn)

    // Find player by connection peer id
    const playerIdx = state.players.findIndex(p => p.id === conn.peer)
    if (playerIdx === -1) return

    removePlayer(playerIdx)

    // Adjust myPlayerIndex if needed
    if (playerIdx < myPlayerIndex.value) {
      myPlayerIndex.value--
    }

    // Notify others with updated indices — send FullSync for simplicity
    for (const c of connections.value) {
      const cPlayerIdx = state.players.findIndex(p => p.id === c.peer)
      const syncMsg: FullSyncMsg = {
        type: 'FullSync',
        gameState: snapshot(),
        yourIndex: cPlayerIdx,
      }
      send(c, syncMsg)
    }
  }

  // ── Join room (joiner) ──
  async function joinRoom(targetRoomId: string, name: string) {
    isHost.value = false
    roomId.value = targetRoomId
    await createPeer()

    onData((data, _conn) => {
      const msg = data as PeerMessage
      handleJoinerMessage(msg)
    })

    const conn = await connectTo(targetRoomId)

    // Send player info (color empty — chosen later)
    const infoMsg: PlayerInfoMsg = {
      type: 'PlayerInfo',
      name,
      color: '',
    }
    send(conn, infoMsg)

    // Store connection reference for sending marks
    connections.value = [conn]

    conn.on('close', () => {
      inGame.value = false
      error.value = '與房主的連線已斷開'
    })
  }

  function handleJoinerMessage(msg: PeerMessage) {
    switch (msg.type) {
      case 'FullSync': {
        const fMsg = msg as FullSyncMsg
        replaceState(fMsg.gameState)
        myPlayerIndex.value = fMsg.yourIndex
        inGame.value = true
        break
      }
      case 'PlayerJoined': {
        const pMsg = msg as PlayerJoinedMsg
        // Insert player at the correct index
        state.players.splice(pMsg.playerIndex, 0, pMsg.player)
        // Insert empty row on each floor
        for (const floor of state.floors) {
          floor.splice(
            pMsg.playerIndex,
            0,
            Array.from({ length: DOOR_COUNT }, (): CellMark => ({ state: CellState.Unknown })),
          )
        }
        // Adjust own index
        if (pMsg.playerIndex <= myPlayerIndex.value) {
          myPlayerIndex.value++
        }
        break
      }
      case 'PlayerLeft': {
        const lMsg = msg as PlayerLeftMsg
        removePlayer(lMsg.playerIndex)
        if (lMsg.playerIndex < myPlayerIndex.value) {
          myPlayerIndex.value--
        }
        break
      }
      case 'MarkUpdate': {
        const uMsg = msg as MarkUpdateMsg
        setMark(uMsg.floorIndex, uMsg.playerIndex, uMsg.doorIndex, uMsg.state)
        break
      }
      case 'NameChange': {
        const ncMsg = msg as NameChangeMsg
        state.players[ncMsg.playerIndex].name = ncMsg.newName
        break
      }
      case 'ColorChange': {
        const ccMsg = msg as ColorChangeMsg
        state.players[ccMsg.playerIndex].color = ccMsg.newColor
        break
      }
      case 'ClearAllMarks': {
        clearAllMarks()
        break
      }
      case 'RoomClosed': {
        inGame.value = false
        error.value = '房主已關閉房間'
        break
      }
    }
  }

  // ── Mark action (called from UI) ──
  function doMark(floorIndex: number, playerIndex: number, doorIndex: number, newState: CellState) {
    // Only allow marking own row
    if (playerIndex !== myPlayerIndex.value) return

    // Validate: if confirming, check constraints
    if (newState === CellState.Confirmed) {
      const floor = state.floors[floorIndex]
      if (floor) {
        // No other player already confirmed same door
        const alreadyConfirmed = floor.some(
          (row, pIdx) => pIdx !== playerIndex && row[doorIndex]?.state === CellState.Confirmed,
        )
        if (alreadyConfirmed) return

        // This player hasn't already confirmed another door on this floor
        const playerRow = floor[playerIndex]
        if (playerRow?.some((cell, d) => d !== doorIndex && cell?.state === CellState.Confirmed)) return
      }
    }

    setMark(floorIndex, playerIndex, doorIndex, newState)

    if (isHost.value) {
      // Host broadcasts directly
      const updateMsg: MarkUpdateMsg = {
        type: 'MarkUpdate',
        floorIndex,
        playerIndex,
        doorIndex,
        state: newState,
      }
      broadcast(updateMsg)
    } else {
      // Joiner sends to host
      const sendMsg: SendMarkMsg = {
        type: 'SendMark',
        floorIndex,
        playerIndex,
        doorIndex,
        state: newState,
      }
      const hostConn = connections.value[0]
      if (hostConn?.open) hostConn.send(sendMsg)
    }
  }

  function changeName(newName: string) {
    const idx = myPlayerIndex.value
    state.players[idx].name = newName

    if (isHost.value) {
      const msg: NameChangeMsg = {
        type: 'NameChange',
        playerIndex: idx,
        newName,
      }
      broadcast(msg)
    } else {
      const msg: SendNameChangeMsg = {
        type: 'SendNameChange',
        playerIndex: idx,
        newName,
      }
      const hostConn = connections.value[0]
      if (hostConn?.open) hostConn.send(msg)
    }
  }

  function changeColor(newColor: string) {
    const idx = myPlayerIndex.value
    state.players[idx].color = newColor

    if (isHost.value) {
      const msg: ColorChangeMsg = {
        type: 'ColorChange',
        playerIndex: idx,
        newColor,
      }
      broadcast(msg)
    } else {
      const msg: SendColorChangeMsg = {
        type: 'SendColorChange',
        playerIndex: idx,
        newColor,
      }
      const hostConn = connections.value[0]
      if (hostConn?.open) hostConn.send(msg)
    }
  }

  function clearAll() {
    if (!isHost.value) return
    clearAllMarks()
    broadcast({ type: 'ClearAllMarks' })
  }

  function kickPlayer(playerIndex: number) {
    if (!isHost.value) return
    const player = state.players[playerIndex]
    if (!player) return
    const conn = connections.value.find(c => c.peer === player.id)
    if (conn) conn.close()
  }

  function leave() {
    if (isHost.value) {
      // Notify all joiners before destroying
      const msg: RoomClosedMsg = { type: 'RoomClosed' }
      broadcast(msg)
    }
    destroy()
    inGame.value = false
    connections.value = []
  }

  // ── beforeunload: host notifies joiners on page close ──
  function handleBeforeUnload() {
    if (isHost.value && inGame.value) {
      const msg: RoomClosedMsg = { type: 'RoomClosed' }
      for (const conn of connections.value) {
        if (conn.open) {
          try { conn.send(msg) } catch {}
        }
      }
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  return {
    // State
    state,
    isHost,
    inGame,
    myPlayerIndex,
    roomId,
    isReady,
    error,
    hints,
    colorReady,

    // Actions
    createRoom,
    joinRoom,
    doMark,
    getHint,
    changeName,
    changeColor,
    clearAll,
    kickPlayer,
    leave,
  }
}
