<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoom } from './composables/useRoom'
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
  myPlayerIndex,
  roomId,
  isReady,
  error,
  createRoom,
  joinRoom,
  doMark,
  getHint,
  changeName,
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

async function handleCreate(name: string, color: string) {
  try {
    await createRoom(name, color)
  } catch (e: any) {
    // error is set in useRoom
  }
}

async function handleJoin(targetRoomId: string, name: string, color: string) {
  try {
    await joinRoom(targetRoomId, name, color)
  } catch (e: any) {
    joinRoomRef.value?.setError(e.message || '加入房間失敗')
  }
}

function handleLeave() {
  leave()
  lobbyView.value = 'menu'
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>R&J 組隊任務小幫手</h1>
      <ConnectionStatus v-if="inGame" :is-ready="isReady" :error="error" />
    </header>

    <!-- Lobby -->
    <main v-if="!inGame" class="lobby">
      <template v-if="lobbyView === 'menu'">
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
      <div class="game-sidebar">
        <RoomInfo :room-id="roomId" />
        <HintLegend />
        <button class="leave-btn" @click="handleLeave">離開房間</button>
      </div>
      <div class="game-main">
        <PlayerList
          :players="state.players"
          :my-index="myPlayerIndex"
          @name-change="changeName"
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

/* ── Game ── */
.game-layout {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 8px 12px;
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

.leave-btn {
  margin-top: auto;
  background: transparent;
  border-color: var(--accent);
  color: var(--accent);
}

.leave-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
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
