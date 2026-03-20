import { ref, shallowRef } from 'vue'
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
} from '../types'
import { CellState } from '../types'
import { MAX_PLAYERS, DOOR_COUNT } from '../constants'
import type { CellMark } from '../types'

export function useRoom() {
  const { isReady, error, createPeer, connectTo, onConnection, onData, destroy } = usePeer()
  const { state, addPlayer, removePlayer, setMark, ensurePlayerRows, replaceState, snapshot } = useGameState()
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

  // ── Create room (host) ──
  async function createRoom(name: string, color: string) {
    isHost.value = true
    // Generate a short room ID
    const id = 'rjpq-' + Math.random().toString(36).substring(2, 8)
    await createPeer(id)
    roomId.value = id

    // Add self as first player
    myPlayerIndex.value = addPlayer({ id: 'host', name, color })
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
  async function joinRoom(targetRoomId: string, name: string, color: string) {
    isHost.value = false
    roomId.value = targetRoomId
    await createPeer()

    onData((data, _conn) => {
      const msg = data as PeerMessage
      handleJoinerMessage(msg)
    })

    const conn = await connectTo(targetRoomId)

    // Send player info
    const infoMsg: PlayerInfoMsg = {
      type: 'PlayerInfo',
      name,
      color,
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
    }
  }

  // ── Mark action (called from UI) ──
  function doMark(floorIndex: number, playerIndex: number, doorIndex: number, newState: CellState) {
    // Only allow marking own row
    if (playerIndex !== myPlayerIndex.value) return

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

  function leave() {
    destroy()
    inGame.value = false
    connections.value = []
  }

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

    // Actions
    createRoom,
    joinRoom,
    doMark,
    getHint,
    changeName,
    leave,
  }
}
