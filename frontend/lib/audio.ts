import { AudioSocket } from './websocket'

const SAMPLE_RATE = 16000
const BUFFER_THRESHOLD = 4096

export class AudioCapture {
  private context: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private socket: AudioSocket
  private buffer: Int16Array[] = []
  private bufferSize = 0

  constructor(socket: AudioSocket) {
    this.socket = socket
  }

  async start(stream: MediaStream) {
    this.context = new AudioContext({ sampleRate: SAMPLE_RATE })
    await this.context.audioWorklet.addModule('/audio-processor.js')

    this.sourceNode = this.context.createMediaStreamSource(stream)
    this.workletNode = new AudioWorkletNode(this.context, 'audio-processor')

    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const chunk = new Int16Array(event.data)
      this.buffer.push(chunk)
      this.bufferSize += chunk.length

      if (this.bufferSize >= BUFFER_THRESHOLD) {
        const combined = new Int16Array(this.bufferSize)
        let offset = 0
        for (const c of this.buffer) {
          combined.set(c, offset)
          offset += c.length
        }
        this.socket.sendAudio(combined.buffer)
        this.buffer = []
        this.bufferSize = 0
      }
    }

    this.sourceNode.connect(this.workletNode)
    // Don't connect to destination — we don't want to hear ourselves
  }

  stop() {
    this.workletNode?.disconnect()
    this.sourceNode?.disconnect()
    this.context?.close()
    this.buffer = []
    this.bufferSize = 0
  }
}
