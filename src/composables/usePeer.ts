import { ref, onUnmounted } from 'vue'
import Peer, { type DataConnection } from 'peerjs'

export type ConnectionHandler = (conn: DataConnection) => void
export type DataHandler = (data: unknown, conn: DataConnection) => void

export function usePeer() {
  const peer = ref<Peer | null>(null)
  const peerId = ref('')
  const isReady = ref(false)
  const error = ref('')

  let onConnectionCb: ConnectionHandler | null = null
  let onDataCb: DataHandler | null = null

  /** Create a new peer (host mode: specify an ID; joiner mode: random ID) */
  function createPeer(id?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const p = id ? new Peer(id) : new Peer()
      peer.value = p

      p.on('open', (openedId) => {
        peerId.value = openedId
        isReady.value = true
        error.value = ''
        resolve(openedId)
      })

      p.on('error', (err) => {
        error.value = err.message || String(err)
        if (!isReady.value) {
          reject(err)
        }
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

  /** Connect to a remote peer (joiner → host) */
  function connectTo(remotePeerId: string): Promise<DataConnection> {
    return new Promise((resolve, reject) => {
      if (!peer.value) {
        reject(new Error('Peer not initialized'))
        return
      }
      const conn = peer.value.connect(remotePeerId, { reliable: true })

      conn.on('open', () => {
        setupConnection(conn)
        resolve(conn as DataConnection)
      })

      conn.on('error', (err) => {
        error.value = err.message || String(err)
        reject(err)
      })
    })
  }

  function setupConnection(conn: DataConnection) {
    conn.on('data', (data) => {
      onDataCb?.(data, conn)
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
