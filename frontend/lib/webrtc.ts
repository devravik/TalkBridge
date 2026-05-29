function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    })
  }
  return servers
}

const ICE_SERVERS = buildIceServers()

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null
  localStream: MediaStream | null = null
  remoteStream: MediaStream | null = null

  constructor(
    private onRemoteStream: (stream: MediaStream) => void,
    private onIceCandidate: (candidate: RTCIceCandidate) => void,
    private onConnectionStateChange: (state: RTCPeerConnectionState) => void,
  ) {}

  async init(videoEnabled = true, audioEnabled = true): Promise<MediaStream> {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: videoEnabled ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      audio: audioEnabled ? { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 } : false,
    })

    this.localStream.getTracks().forEach((track) => {
      this.pc!.addTrack(track, this.localStream!)
    })

    this.remoteStream = new MediaStream()

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track)
      })
      this.onRemoteStream(this.remoteStream!)
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate)
      }
    }

    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.onConnectionStateChange(this.pc.connectionState)
      }
    }

    return this.localStream
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc!.createOffer()
    await this.pc!.setLocalDescription(offer)
    return offer
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc!.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await this.pc!.createAnswer()
    await this.pc!.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc!.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc?.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled
    })
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled
    })
  }

  close() {
    this.localStream?.getTracks().forEach((t) => t.stop())
    this.pc?.close()
    this.pc = null
    this.localStream = null
  }
}
