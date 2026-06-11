// Sonidos generados con WebAudio: sin ficheros de audio, funciona offline.

let ctx: AudioContext | null = null

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function nota(
  freq: number,
  dur: number,
  cuando = 0,
  tipo: OscillatorType = 'square',
  vol = 0.08,
): void {
  try {
    const ac = audio()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = tipo
    osc.frequency.value = freq
    const t = ac.currentTime + cuando
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + dur)
  } catch {
    // sin audio disponible: el juego sigue
  }
}

export const sonido = {
  salto(): void {
    nota(320, 0.12)
    nota(480, 0.1, 0.05)
  },
  acierto(): void {
    nota(523, 0.12, 0, 'triangle', 0.12)
    nota(784, 0.18, 0.1, 'triangle', 0.12)
  },
  fallo(): void {
    nota(180, 0.25, 0, 'sawtooth', 0.06)
  },
  victoria(): void {
    ;[523, 659, 784, 1047].forEach((f, i) => nota(f, 0.18, i * 0.12, 'triangle', 0.12))
  },
  golpe(): void {
    nota(120, 0.2, 0, 'sawtooth', 0.08)
  },
  moneda(): void {
    nota(988, 0.08, 0, 'triangle', 0.1)
    nota(1319, 0.12, 0.06, 'triangle', 0.1)
  },
  pisoton(): void {
    nota(220, 0.08, 0, 'square', 0.1)
    nota(110, 0.12, 0.06, 'square', 0.08)
  },
  checkpoint(): void {
    nota(659, 0.1, 0, 'triangle', 0.1)
    nota(880, 0.16, 0.09, 'triangle', 0.1)
  },
}
