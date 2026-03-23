<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { CellState, HintType, type Player } from '../../types'

export interface PlayerMark {
  player: Player
  playerIndex: number
  state: CellState
  hintType: HintType | null
}

const props = defineProps<{
  marks: PlayerMark[]
  myPlayerIndex: number
  doorIndex: number
  viewerConfirmedDoor: number // -1 = viewer hasn't confirmed any door on this floor
}>()

const emit = defineEmits<{
  leftClick: [playerIndex: number]
  rightClick: [playerIndex: number]
}>()

// ── Viewer's own mark on this door ──
const myMark = computed(() =>
  props.marks.find(m => m.playerIndex === props.myPlayerIndex),
)

// ── Another player who confirmed this door ──
const otherConfirmed = computed(() =>
  props.marks.find(
    m => m.playerIndex !== props.myPlayerIndex && m.state === CellState.Confirmed,
  ),
)

// ── Other players who excluded this door (manual exclude + cross elimination) ──
const excludedPlayers = computed(() =>
  props.marks
    .filter(
      m =>
        m.playerIndex !== props.myPlayerIndex &&
        (m.state === CellState.Excluded || m.hintType === HintType.CrossElimination),
    )
    .map(m => ({ color: m.player.color })),
)

// ── Is viewer the unique candidate for this door? ──
const isUniqueCandidate = computed(() => {
  if (!myMark.value) return false
  return myMark.value.hintType === HintType.UniqueCandidate
})

// ── Resolved display state (priority order from spec) ──
type CellDisplay =
  | { type: 'greyed' }
  | { type: 'viewer-confirmed'; color: string }
  | { type: 'viewer-excluded' }
  | { type: 'other-confirmed'; color: string; name: string }
  | { type: 'idle'; excludedPlayers: { color: string }[]; isUnique: boolean; viewerColor: string }

const display = computed<CellDisplay>(() => {
  const my = myMark.value
  const myState = my?.state ?? CellState.Unknown

  // Priority 1: viewer confirmed a DIFFERENT door on this floor → grey out
  if (
    props.viewerConfirmedDoor !== -1 &&
    props.viewerConfirmedDoor !== props.doorIndex
  ) {
    return { type: 'greyed' }
  }

  // Priority 2: viewer confirmed THIS door
  if (myState === CellState.Confirmed) {
    return { type: 'viewer-confirmed', color: my!.player.color }
  }

  // Priority 3: viewer excluded this door
  if (myState === CellState.Excluded) {
    return { type: 'viewer-excluded' }
  }

  // Priority 4: another player confirmed this door
  const other = otherConfirmed.value
  if (other) {
    return { type: 'other-confirmed', color: other.player.color, name: other.player.name }
  }

  // Priority 5: idle — show excluded players
  return {
    type: 'idle',
    excludedPlayers: excludedPlayers.value,
    isUnique: isUniqueCandidate.value,
    viewerColor: my?.player.color ?? '#888',
  }
})

// ── Cell background style ──
const cellStyle = computed(() => {
  const d = display.value
  switch (d.type) {
    case 'viewer-confirmed':
      return { background: d.color }
    case 'other-confirmed':
      return { background: `color-mix(in srgb, ${d.color} 55%, var(--door-bg))` }
    case 'greyed':
      return { background: 'rgba(0,0,0,0.15)' }
    case 'viewer-excluded':
      return { background: 'rgba(0,0,0,0.15)' }
    case 'idle':
      if (d.isUnique) {
        return { background: `color-mix(in srgb, ${d.viewerColor} 35%, var(--door-bg))` }
      }
      return undefined
    default:
      return undefined
  }
})

// ── Long-press detection for mobile (iOS doesn't reliably fire contextmenu) ──
const LONG_PRESS_MS = 500
const MOVE_THRESHOLD = 10
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let touchStartX = 0
let touchStartY = 0
const didLongPress = ref(false)

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  didLongPress.value = false

  longPressTimer = setTimeout(() => {
    didLongPress.value = true
    emit('rightClick', props.myPlayerIndex)
  }, LONG_PRESS_MS)
}

function onTouchMove(e: TouchEvent) {
  if (!longPressTimer) return
  const touch = e.touches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
    clearLongPress()
  }
}

function onTouchEnd() {
  clearLongPress()
}

onUnmounted(clearLongPress)

function handleClick() {
  if (didLongPress.value) {
    didLongPress.value = false
    return
  }
  emit('leftClick', props.myPlayerIndex)
}

function handleContext(e: MouseEvent) {
  e.preventDefault()
  emit('rightClick', props.myPlayerIndex)
}
</script>

<template>
  <td
    class="door-cell"
    :class="{
      'cell-greyed': display.type === 'greyed',
      'cell-confirmed': display.type === 'viewer-confirmed',
      'cell-other-confirmed': display.type === 'other-confirmed',
    }"
    :style="cellStyle"
    @click="handleClick"
    @contextmenu="handleContext"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchEnd"
  >
    <!-- Viewer confirmed this door -->
    <div v-if="display.type === 'viewer-confirmed'" class="cell-content confirmed-icon">
      <span class="big-check">✓</span>
    </div>

    <!-- Viewer excluded this door -->
    <div v-else-if="display.type === 'viewer-excluded'" class="cell-content excluded-icon">
      <span class="big-x">✗</span>
    </div>

    <!-- Greyed out (viewer confirmed another door) -->
    <div v-else-if="display.type === 'greyed'" class="cell-content greyed-icon">
      <span class="dash">—</span>
    </div>

    <!-- Other player confirmed this door -->
    <div v-else-if="display.type === 'other-confirmed'" class="cell-content other-icon">
      <span class="big-check other-check">✓</span>
    </div>

    <!-- Idle: show small colored crosses for excluded players -->
    <div v-else class="cell-content idle-content">
      <div v-if="display.excludedPlayers.length > 0" class="small-crosses">
        <span
          v-for="(ep, idx) in display.excludedPlayers"
          :key="idx"
          class="small-x"
          :style="{ color: ep.color }"
        >✗</span>
      </div>
    </div>
  </td>
</template>

<style scoped>
.door-cell {
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  background: var(--door-bg);
  border: 1px solid var(--door-border);
  transition: background 0.15s;
  vertical-align: middle;
  text-align: center;
  height: 36px;
  width: 60px;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}

.door-cell:hover {
  filter: brightness(0.95);
}

.cell-greyed {
  opacity: 0.5;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 26px;
}

/* ── Viewer confirmed ── */
.confirmed-icon .big-check {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* ── Viewer excluded ── */
.excluded-icon .big-x {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
}

/* ── Greyed out ── */
.greyed-icon .dash {
  font-size: 16px;
  color: rgba(0,0,0,0.25);
}

/* ── Other player confirmed ── */
.other-icon .other-check {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  opacity: 0.85;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

/* ── Idle: small grey crosses ── */
.small-crosses {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.small-x {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
