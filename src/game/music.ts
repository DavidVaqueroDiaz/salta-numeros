// Música chiptune generada con WebAudio: sin ficheros, funciona offline.
// Un secuenciador sencillo programa corcheas por adelantado (lookahead) con
// una melodía cuadrada y un bajo triangular. Dos temas: normal (alegre, mayor)
// y jefe (menor, más rápido). Se controla desde Ajustes (🎵 Música ON/OFF).

let ctx: AudioContext | null = null
let activada = true
let tema: 'normal' | 'jefe' = 'normal'
let timer = 0
let paso = 0
let proxima = 0

// Frecuencias (Hz) de las notas usadas
const C3 = 131, F3 = 175, G3 = 196, A3 = 220, E3 = 165, D3 = 147
const C5 = 523, D5 = 587, E5 = 659, F5 = 698, G5 = 784, A5 = 880, C6 = 1047
const A4 = 440, B4 = 494, GS4 = 415

// Tema normal: 4 compases alegres en Do mayor (0 = silencio)
const LEAD_NORMAL = [
  C5, E5, G5, E5, A5, G5, E5, C5,
  D5, F5, A5, F5, G5, E5, D5, 0,
  C5, E5, G5, A5, C6, A5, G5, E5,
  F5, D5, E5, F5, G5, 0, C5, 0,
]
const BASS_NORMAL = [C3, C3, G3, G3, A3, A3, F3, F3, C3, C3, G3, G3, F3, F3, G3, G3]

// Tema de jefe: La menor, tenso y con más pulso
const LEAD_JEFE = [
  A4, C5, E5, C5, A4, C5, E5, GS4,
  B4, D5, F5, D5, B4, D5, E5, 0,
  A4, C5, E5, A5, E5, C5, B4, GS4,
  A4, 0, E5, 0, A4, 0, 0, 0,
]
const BASS_JEFE = [A3, A3, A3, E3, F3, F3, F3, D3, A3, A3, A3, E3, D3, D3, E3, E3]

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function nota(
  freq: number,
  cuando: number,
  dur: number,
  tipo: OscillatorType,
  vol: number,
): void {
  try {
    const ac = audio()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = tipo
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, cuando)
    gain.gain.exponentialRampToValueAtTime(0.001, cuando + dur)
    osc.connect(gain).connect(ac.destination)
    osc.start(cuando)
    osc.stop(cuando + dur)
  } catch {
    // sin audio: el juego sigue en silencio
  }
}

/** Programa las corcheas que tocan dentro de la ventana de lookahead. */
function programar(): void {
  let ac: AudioContext
  try {
    ac = audio()
  } catch {
    return
  }
  if (!activada) {
    proxima = ac.currentTime + 0.1 // no acumular notas mientras está apagada
    return
  }
  const corchea = tema === 'jefe' ? 0.21 : 0.26
  const lead = tema === 'jefe' ? LEAD_JEFE : LEAD_NORMAL
  const bass = tema === 'jefe' ? BASS_JEFE : BASS_NORMAL
  while (proxima < ac.currentTime + 0.6) {
    const f = lead[paso % lead.length]
    if (f) nota(f, proxima, corchea * 0.9, 'square', 0.022)
    if (paso % 2 === 0) {
      const b = bass[(paso / 2) % bass.length]
      if (b) nota(b, proxima, corchea * 1.7, 'triangle', 0.05)
    }
    proxima += corchea
    paso++
  }
}

/** Arranca el secuenciador (llamar tras el primer toque, por el autoplay). */
export function iniciarMusica(): void {
  if (timer) return
  try {
    proxima = audio().currentTime + 0.15
  } catch {
    return
  }
  timer = window.setInterval(programar, 200)
}

/** Enciende/apaga la música (ajuste 🎵, separado de los efectos). */
export function setMusicaActivada(v: boolean): void {
  activada = v
}

/** Cambia de tema (normal en fases y menú; jefe en las peleas finales). */
export function setTemaMusica(t: 'normal' | 'jefe'): void {
  if (tema !== t) {
    tema = t
    paso = 0 // cada tema empieza desde su primer compás
  }
}
