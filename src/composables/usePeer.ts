import { ref, onUnmounted } from 'vue'
import Peer, { type DataConnection } from 'peerjs'

export type ConnectionHandler = (conn: DataConnection) => void
export type DataHandler = (data: unknown, conn: DataConnection) => void

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const apiKey = import.meta.env.VITE_METERED_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(
      `https://yeamao.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export function usePeer() {
  const peer = ref<Peer | null>(null)
  const peerId = ref('')
  const isReady = ref(false)
  const error = ref('')

  let onConnectionCb: ConnectionHandler | null = null
  let onDataCb: DataHandler | null = null
  let turnIceServers: RTCIceServer[] = []

  function buildPeer(id: string | undefined, iceServers: RTCIceServer[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const config = iceServers.length > 0 ? { config: { iceServers } } : {}
      const p = id ? new Peer(id, config) : new Peer(config)
      peer.value = p

      p.on('open', (openedId) => {
        peerId.value = openedId
        isReady.value = true
        error.value = ''
        resolve(openedId)
      })

      p.on('error', (err) => {
        error.value = err.message || String(err)
        if (!isReady.value) reject(err)
      })

      p.on('connection', (conn) => {
        setupConnection(conn)
        onConnectionCb?.(conn)
      })

      p.on('disconnected', () => {
        isReady.value = false
      })
    })
  }

  /** Create a new peer (host mode: specify an ID; joiner mode: random ID) */
  async function createPeer(id?: string): Promise<string> {
    turnIceServers = await fetchIceServers()
    if (turnIceServers.length > 0) {
      console.log('[TURN] ICE servers loaded:', turnIceServers.map((s) => s.urls))
    } else {
      console.warn('[TURN] No ICE servers fetched, using PeerJS default STUN only')
    }
    // Host always gets full ICE config (STUN + TURN) so it's always reachable
    // Joiner starts with STUN-only; TURN fallback is handled in connectTo
    const stunOnly = turnIceServers.filter((s) => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls]
      return urls.every((u) => u.startsWith('stun:'))
    })
    const initialServers = id ? turnIceServers : stunOnly
    return buildPeer(id, initialServers)
  }

  function attemptConnect(remotePeerId: string, timeoutMs: number): Promise<DataConnection> {
    return new Promise((resolve, reject) => {
      if (!peer.value) {
        reject(new Error('Peer not initialized'))
        return
      }
      const conn = peer.value.connect(remotePeerId, { reliable: true })

      const timer = setTimeout(() => {
        conn.close()
        reject(new Error('timeout'))
      }, timeoutMs)

      conn.on('open', () => {
        clearTimeout(timer)
        setupConnection(conn)
        logIceCandidateType(conn)
        resolve(conn as DataConnection)
      })

      conn.on('error', (err) => {
        clearTimeout(timer)
        error.value = err.message || String(err)
        reject(err)
      })
    })
  }

  /** Connect to a remote peer (joiner → host), with 3s direct-connection timeout then TURN fallback */
  async function connectTo(remotePeerId: string): Promise<DataConnection> {
    try {
      console.log('[TURN] Attempting direct connection...')
      return await attemptConnect(remotePeerId, 3000)
    } catch (e) {
      if (turnIceServers.length === 0) throw e

      console.log('[TURN] Direct connection failed, retrying with TURN relay...')
      peer.value?.destroy()
      peer.value = null
      isReady.value = false

      await buildPeer(undefined, turnIceServers)
      return attemptConnect(remotePeerId, 15000)
    }
  }

  function setupConnection(conn: DataConnection) {
    conn.on('data', (data) => {
      onDataCb?.(data, conn)
    })
  }

  function logIceCandidateType(conn: DataConnection) {
    const pc = (conn as any).peerConnection as RTCPeerConnection | undefined
    pc?.getStats().then((stats) => {
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          console.log('[TURN] Active ICE candidate pair:', {
            local: report.localCandidateId,
            remote: report.remoteCandidateId,
          })
        }
        if (report.type === 'local-candidate') {
          console.log('[TURN] Local candidate type:', report.candidateType, report.url ?? '')
        }
      })
    })
  }

  function onConnection(cb: ConnectionHandler) {
    onConnectionCb = cb
  }

  function onData(cb: DataHandler) {
    onDataCb = cb
  }

  function destroy() {
    peer.value?.destroy()
    peer.value = null
    isReady.value = false
    peerId.value = ''
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    peer,
    peerId,
    isReady,
    error,
    createPeer,
    connectTo,
    onConnection,
    onData,
    destroy,
  }
}
