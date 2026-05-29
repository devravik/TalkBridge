import type { SignalingMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'

type MessageHandler = (msg: SignalingMessage) => void

export class SignalingSocket {
  private ws: WebSocket | null = null
  private handlers = new Map<string, MessageHandler[]>()
  private reconnectAttempts = 0
  private closed = false

  connect(roomId: string, participantId: string, language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}/ws/room/${roomId}?participantId=${participantId}&language=${encodeURIComponent(language)}`
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data)
          const typeHandlers = this.handlers.get(msg.type) || []
          const wildcardHandlers = this.handlers.get('*') || []
          ;[...typeHandlers, ...wildcardHandlers].forEach((h) => h(msg))
        } catch {
          // ignore malformed messages
        }
      }

      this.ws.onerror = (err) => {
        reject(err)
      }

      this.ws.onclose = () => {
        if (!this.closed) {
          this.emit('disconnected', {} as SignalingMessage)
        }
      }
    })
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)
    return () => this.off(type, handler)
  }

  off(type: string, handler: MessageHandler) {
    const list = this.handlers.get(type) || []
    this.handlers.set(type, list.filter((h) => h !== handler))
  }

  private emit(type: string, msg: SignalingMessage) {
    const handlers = this.handlers.get(type) || []
    handlers.forEach((h) => h(msg))
  }

  send(msg: SignalingMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  close() {
    this.closed = true
    this.ws?.close()
  }
}

export class AudioSocket {
  private ws: WebSocket | null = null

  connect(roomId: string, participantId: string, language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}/ws/audio/${roomId}?participantId=${participantId}&language=${encodeURIComponent(language)}`
      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'
      this.ws.onopen = () => resolve()
      this.ws.onerror = reject
    })
  }

  sendAudio(buffer: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(buffer)
    }
  }

  close() {
    this.ws?.close()
  }
}
