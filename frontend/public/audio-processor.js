class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0]) {
      const samples = input[0]
      const int16 = new Int16Array(samples.length)
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      this.port.postMessage(int16.buffer, [int16.buffer])
    }
    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)
