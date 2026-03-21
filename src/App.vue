<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoom } from './composables/useRoom'
import { PLAYER_COLORS } from './constants'
import CreateRoom from './components/lobby/CreateRoom.vue'
import JoinRoom from './components/lobby/JoinRoom.vue'
import GameBoard from './components/game/GameBoard.vue'
import RoomInfo from './components/ui/RoomInfo.vue'
import PlayerList from './components/ui/PlayerList.vue'
import ConnectionStatus from './components/ui/ConnectionStatus.vue'
import HintLegend from './components/ui/HintLegend.vue'

type LobbyView = 'menu' | 'create' | 'join'

const lobbyView = ref<LobbyView>('menu')
const joinRoomRef = ref<InstanceType<typeof JoinRoom> | null>(null)

const {
  state,
  inGame,
  isHost,
  myPlayerIndex,
  roomId,
  isReady,
  error,
  colorReady,
  createRoom,
  joinRoom,
  doMark,
  getHint,
  changeName,
  changeColor,
  clearAll,
  kickPlayer,
  leave,
} = useRoom()

const initialRoomId = ref('')

onMounted(() => {
  const params = new URL(window.location.href).searchParams
  const room = params.get('room')
  if (room) {
    initialRoomId.value = room
    lobbyView.value = 'join'
  }
})

// Colors already taken by other players
const takenColors = computed(() => {
  return state.players
    .filter((_, i) => i !== myPlayerIndex.value)
    .map(p => p.color)
    .filter(c => c !== '')
})

// Viewer's own color for legend
const myColor = computed(() => {
  const idx = myPlayerIndex.value
  if (idx < 0 || idx >= state.players.length) return '#888'
  return state.players[idx].color || '#888'
})

async function handleCreate(name: string) {
  try {
    await createRoom(name)
  } catch (e: any) {
    // error is set in useRoom
  }
}

async function handleJoin(targetRoomId: string, name: string) {
  try {
    await joinRoom(targetRoomId, name)
  } catch (e: any) {
    joinRoomRef.value?.setError(e.message || '加入房間失敗')
  }
}

function handleLeave() {
  leave()
  lobbyView.value = 'menu'
}

function handlePickColor(color: string) {
  changeColor(color)
}

function handleKick(playerIndex: number) {
  kickPlayer(playerIndex)
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>R&J 組隊任務小幫手</h1>
      <ConnectionStatus v-if="inGame" :is-ready="isReady" :error="error" />
      <span v-else class="author-tag">製作者：吐司去邊先生 · 公會：MAYOIUTA</span>
    </header>

    <!-- Lobby -->
    <main v-if="!inGame" class="lobby">
      <!-- Show error from RoomClosed -->
      <div v-if="error" class="card menu">
        <p class="error-msg">{{ error }}</p>
        <button @click="error = ''; lobbyView = 'menu'">返回首頁</button>
      </div>

      <template v-else-if="lobbyView === 'menu'">
        <div class="card menu">
          <h2>羅密歐與茱麗葉</h2>
          <p class="subtitle">組隊任務協作小幫手</p>
          <div class="menu-buttons">
            <button @click="lobbyView = 'create'">建立房間</button>
            <button @click="lobbyView = 'join'">加入房間</button>
          </div>
        </div>
      </template>

      <CreateRoom
        v-else-if="lobbyView === 'create'"
        @create="handleCreate"
        @back="lobbyView = 'menu'"
      />

      <JoinRoom
        v-else-if="lobbyView === 'join'"
        ref="joinRoomRef"
        :initial-room-id="initialRoomId"
        @join="handleJoin"
        @back="lobbyView = 'menu'"
      />
    </main>

    <!-- Game -->
    <main v-else class="game-layout">
      <!-- Color picker overlay -->
      <div v-if="!colorReady" class="color-overlay">
        <div class="card color-picker-card">
          <h2>選擇你的顏色</h2>
          <div class="color-buttons">
            <button
              v-for="color in PLAYER_COLORS"
              :key="color"
              class="color-btn"
              :style="{ background: color }"
              :disabled="takenColors.includes(color)"
              @click="handlePickColor(color)"
            />
          </div>
        </div>
      </div>

      <div class="game-sidebar">
        <RoomInfo :room-id="roomId" />
        <HintLegend :my-color="myColor" />
        <button v-if="isHost" class="clear-all-btn" @click="clearAll">清空所有標記</button>
        <button class="leave-btn" @click="handleLeave">離開房間</button>
      </div>
      <div class="game-main" :class="{ 'board-locked': !colorReady }">
        <PlayerList
          :players="state.players"
          :my-index="myPlayerIndex"
          :is-host="isHost"
          @name-change="changeName"
          @kick="handleKick"
        />
        <GameBoard
          :state="state"
          :my-player-index="myPlayerIndex"
          :get-hint="getHint"
          @mark="doMark"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
}

.app-header h1 {
  font-size: 16px;
  font-weight: 700;
}

.author-tag {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Lobby ── */
.lobby {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.menu {
  text-align: center;
  max-width: 360px;
  width: 100%;
}

.menu h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-buttons button {
  padding: 12px;
  font-size: 15px;
}

.error-msg {
  color: var(--accent);
  font-size: 14px;
  margin-bottom: 16px;
}

/* ── Game ── */
.game-layout {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  position: relative;
}

.game-sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.game-main {
  flex: 1;
  min-width: 0;
}

.board-locked {
  pointer-events: none;
  opacity: 0.5;
}

.clear-all-btn {
  margin-top: auto;
  background: transparent;
  border-color: var(--text-muted);
  color: var(--text-muted);
}

.clear-all-btn:hover {
  background: var(--text-muted);
  color: #fff;
  border-color: var(--text-muted);
}

.leave-btn {
  background: transparent;
  border-color: var(--accent);
  color: var(--accent);
}

.leave-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* ── Color Picker Overlay ── */
.color-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.color-picker-card {
  text-align: center;
  padding: 24px 32px;
}

.color-picker-card h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.color-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.color-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid transparent;
  padding: 0;
  min-width: unset;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.color-btn:hover:not(:disabled) {
  transform: scale(1.15);
  border-color: #fff;
  background: unset;
}

.color-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .game-layout {
    flex-direction: column;
    padding: 12px;
  }

  .game-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .game-sidebar > * {
    flex: 1;
    min-width: 140px;
  }

  .leave-btn {
    margin-top: 0;
  }
}
</style>
