// Cinemáticas de los mundos (se abren al elegir un mundo en el selector).
//   Mundo 1: tu personaje y Xiana, los mejores amigos, empiezan la aventura.
//   Mundo 2: el Mago Oscuro atrapa a Xiana en una jaula y se la lleva volando.
// Cada mundo tiene su propio guion. Se salta tocando la pantalla.
import { dibujarPersonaje } from '../engine/character'

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const easeOut = (v: number): number => 1 - (1 - v) ** 3

function fade(t: number, entrada: number, plenoFin: number, salida: number): number {
  if (t < entrada || t > salida) return 0
  if (t < entrada + 0.4) return clamp01((t - entrada) / 0.4)
  if (t > plenoFin) return clamp01(1 - (t - plenoFin) / (salida - plenoFin))
  return 1
}

export class Cinematica {
  t = 0
  terminado = false
  private readonly duracion: number

  constructor(
    private readonly mundo: number,
    private readonly personaje: number,
  ) {
    // el Mundo 2 (secuestro) dura más para leer bien los subtítulos
    this.duracion = mundo === 2 ? 14 : mundo === 3 ? 9 : mundo === 4 ? 12 : 7.5
  }

  update(dt: number): void {
    this.t += dt
    if (this.t >= this.duracion) this.terminado = true
  }

  draw(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const t = this.t
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (this.mundo === 3) this.cieloTormenta(ctx, w, h, t)
    else if (this.mundo === 4) this.playa(ctx, w, h)
    else this.parque(ctx, w, h, t)
    if (this.mundo === 2) this.guionMundo2(ctx, w, h, t)
    else if (this.mundo === 3) this.guionMundo3(ctx, w, h, t)
    else if (this.mundo === 4) this.guionMundo4(ctx, w, h, t)
    else this.guionMundo1(ctx, w, h, t)

    // pista para saltar
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t * 4)
    ctx.fillStyle = '#1d3557'
    ctx.font = `bold ${Math.round(h * 0.03)}px 'Segoe UI', sans-serif`
    ctx.fillText('Toca para saltar', w / 2, h * 0.05)
    ctx.globalAlpha = 1
  }

  /** Fondo de parque: cielo, sol, nubes, césped y un árbol. */
  private parque(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const cielo = ctx.createLinearGradient(0, 0, 0, h)
    cielo.addColorStop(0, '#8ecae6')
    cielo.addColorStop(1, '#cdeafe')
    ctx.fillStyle = cielo
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffd60a'
    ctx.beginPath()
    ctx.arc(w * 0.12, h * 0.16, h * 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    for (const [cx, cy, r] of [
      [w * 0.55, h * 0.18, h * 0.05],
      [w * 0.78, h * 0.12, h * 0.06],
    ]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.arc(cx + r, cy + 3, r * 0.8, 0, Math.PI * 2)
      ctx.arc(cx - r, cy + 4, r * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    const sueloY = h * 0.82
    ctx.fillStyle = '#67c26b'
    ctx.fillRect(0, sueloY, w, h - sueloY)
    ctx.fillStyle = '#4ea353'
    ctx.fillRect(0, sueloY, w, h * 0.02)
    ctx.fillStyle = '#8a5a2b'
    ctx.fillRect(w * 0.08 - 8, sueloY - h * 0.18, 16, h * 0.18)
    ctx.fillStyle = '#3ca05a'
    ctx.beginPath()
    ctx.arc(w * 0.08, sueloY - h * 0.22, h * 0.1, 0, Math.PI * 2)
    ctx.fill()
    void t
  }

  /** Mundo 1: los dos amigos juegan felices y empieza la aventura. */
  private guionMundo1(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const sueloY = h * 0.82
    const bs = h * 0.06
    const bote = Math.abs(Math.sin(t * 4)) * h * 0.035
    dibujarPersonaje(ctx, this.personaje, w * 0.42, sueloY - bote, 1, bs)
    this.dibujarXiana(ctx, w * 0.56, sueloY - Math.abs(Math.sin(t * 4 + 1)) * h * 0.035, bs)
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + i * 0.4) % 1
      ctx.globalAlpha = 1 - ph
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${Math.round(h * 0.04)}px sans-serif`
      ctx.fillText('❤️', (w * 0.42 + w * 0.56) / 2 + (i - 1) * 16, sueloY - bs * 2 - ph * h * 0.18)
      ctx.globalAlpha = 1
    }
    this.subtitulo(ctx, w, h, 'Xiana y tú sois los mejores amigos…', fade(t, 0.4, 3.2, 3.8))
    this.subtitulo(ctx, w, h, '¡Vais a vivir una gran aventura juntos!', fade(t, 4.0, 6.4, 7.2), '#e63946')
  }

  /** Mundo 2: aparece el Mago, atrapa a Xiana y se la lleva volando. */
  private guionMundo2(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const sueloY = h * 0.82
    const bs = h * 0.06
    const bote = Math.abs(Math.sin(t * 4)) * h * 0.03
    const tMago = 5.0
    const tCaptura = 7.5
    const tVuelo = 10.0

    let xiX = w * 0.56
    let xiY = sueloY
    let xiEsc = 1
    if (t >= tVuelo) {
      const v = easeOut(clamp01((t - tVuelo) / (this.duracion - tVuelo)))
      xiX = w * 0.56 + v * w * 0.6
      xiY = sueloY - v * h * 0.95
      xiEsc = 1 - v * 0.5
    }

    // personaje (juega; tras la captura, parado y asustado)
    const persY = t < tCaptura ? sueloY - bote : sueloY
    dibujarPersonaje(ctx, this.personaje, w * 0.36, persY, 1, bs)
    if (t >= tCaptura) {
      ctx.fillStyle = '#e63946'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${Math.round(h * 0.07)}px sans-serif`
      ctx.fillText('!', w * 0.36, sueloY - bs * 4)
    } else {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.7 + i * 0.4) % 1
        ctx.globalAlpha = 1 - ph
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${Math.round(h * 0.04)}px sans-serif`
        ctx.fillText('❤️', (w * 0.36 + w * 0.56) / 2 + (i - 1) * 14, sueloY - bs * 2 - ph * h * 0.15)
        ctx.globalAlpha = 1
      }
    }

    this.dibujarXiana(ctx, xiX, xiY, bs * xiEsc)
    if (t >= tCaptura) this.dibujarJaula(ctx, xiX, xiY, bs * xiEsc)

    // mago: entra desde la derecha y luego se va volando con la jaula
    let magoX = w * 1.25
    let magoY = sueloY - h * 0.05
    if (t >= tMago) {
      const ent = easeOut(clamp01((t - tMago) / 1.2))
      magoX = w * 1.25 + (w * 0.72 - w * 1.25) * ent
      if (t >= tVuelo) {
        const v = easeOut(clamp01((t - tVuelo) / (this.duracion - tVuelo)))
        magoX = w * 0.72 + v * w * 0.6
        magoY = sueloY - h * 0.05 - v * h * 0.95
      }
      this.dibujarMago(ctx, magoX, magoY, t >= tVuelo ? 0.7 : 1, h)
    }

    // hechizo: rayo morado del mago a Xiana + destellos
    if (t >= tCaptura && t < tVuelo) {
      ctx.strokeStyle = `rgba(157,78,221,${0.5 + 0.5 * Math.sin(t * 25)})`
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(magoX, magoY - h * 0.18)
      ctx.lineTo(xiX, xiY - bs * 1.5)
      ctx.stroke()
      ctx.fillStyle = '#e0aaff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < 5; i++) {
        const f = (t * 3 + i * 0.2) % 1
        const sx = magoX + (xiX - magoX) * f
        const sy = magoY - h * 0.18 + (xiY - bs * 1.5 - (magoY - h * 0.18)) * f
        ctx.font = `${Math.round(h * 0.03)}px sans-serif`
        ctx.fillText('✦', sx, sy)
      }
    }

    this.subtitulo(ctx, w, h, 'Xiana y tú jugabais felices en el parque…', fade(t, 0.4, 4.2, 4.8))
    this.subtitulo(ctx, w, h, '¡Pero apareció el MAGO OSCURO!', fade(t, 5.2, 7.0, 7.4), '#5a189a')
    this.subtitulo(ctx, w, h, '¡Con un hechizo atrapó a Xiana!', fade(t, 7.7, 9.4, 9.9), '#5a189a')
    this.subtitulo(ctx, w, h, '¡Se la lleva volando! ¡Rescátala en el Mundo 2!', fade(t, 10.3, 13.0, 13.9), '#e63946')
  }

  /** Cielo de tormenta para el Mundo 3 (oscuro, nubes y algún relámpago). */
  private cieloTormenta(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#2b2d42')
    g.addColorStop(1, '#5c6378')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // relámpago ocasional
    if (Math.sin(t * 5) > 0.96) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = 'rgba(70,76,99,0.9)'
    for (const [cx, cy, r] of [
      [w * 0.3, h * 0.2, h * 0.06],
      [w * 0.7, h * 0.15, h * 0.07],
    ]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.arc(cx + r, cy + 3, r * 0.8, 0, Math.PI * 2)
      ctx.arc(cx - r, cy + 4, r * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    const sueloY = h * 0.85
    ctx.fillStyle = '#3a3f55'
    ctx.fillRect(0, sueloY, w, h - sueloY)
  }

  /** Mundo 3: el Remolino se lleva a Xiana a las nubes; hay que subir. */
  private guionMundo3(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const sueloY = h * 0.85
    const bs = h * 0.055
    dibujarPersonaje(ctx, this.personaje, w * 0.28, sueloY, 1, bs)
    // remolino con la jaula de Xiana arriba, subiendo
    const sube = easeOut(clamp01(t / this.duracion))
    const tx = w * 0.68
    const baseY = sueloY - sube * h * 0.1
    this.dibujarTornado(ctx, tx, baseY, h * 0.5, t * 8)
    const cageY = baseY - h * 0.5 - h * 0.02
    this.dibujarXiana(ctx, tx, cageY, bs * 0.8)
    this.dibujarJaula(ctx, tx, cageY, bs * 0.8)
    this.subtitulo(ctx, w, h, 'El REMOLINO se llevó a Xiana a las nubes…', fade(t, 0.4, 4.0, 4.6), '#fff')
    this.subtitulo(ctx, w, h, '¡Salta por las alturas y derrótalo!', fade(t, 5.0, 8.4, 9.0), '#ffd60a')
  }

  /** Embudo de tornado girando. */
  private dibujarTornado(ctx: CanvasRenderingContext2D, cx: number, baseY: number, alto: number, giro: number): void {
    const capas = 8
    for (let i = 0; i < capas; i++) {
      const f = i / (capas - 1)
      const ey = baseY - f * alto
      const ew = (0.1 + f * 0.5) * alto
      const desf = Math.sin(giro + i * 0.7) * ew * 0.16
      ctx.fillStyle = i % 2 === 0 ? 'rgba(120,150,180,0.92)' : 'rgba(190,210,230,0.92)'
      ctx.beginPath()
      ctx.ellipse(cx + desf, ey, ew / 2, Math.max(4, alto * 0.04 * f + 3), 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /** Playa para el Mundo 4: cielo, mar a la derecha y arena. */
  private playa(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cielo = ctx.createLinearGradient(0, 0, 0, h)
    cielo.addColorStop(0, '#8ecae6')
    cielo.addColorStop(1, '#cdeafe')
    ctx.fillStyle = cielo
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffd60a'
    ctx.beginPath()
    ctx.arc(w * 0.12, h * 0.16, h * 0.07, 0, Math.PI * 2)
    ctx.fill()
    // arena a la izquierda, mar a la derecha
    const sueloY = h * 0.82
    ctx.fillStyle = '#f4d58d'
    ctx.fillRect(0, sueloY, w * 0.55, h - sueloY)
    ctx.fillStyle = '#0096c7'
    ctx.fillRect(w * 0.5, sueloY - h * 0.02, w * 0.5, h)
    ctx.fillStyle = '#48cae4'
    ctx.fillRect(w * 0.5, sueloY - h * 0.02, w * 0.5, h * 0.03)
  }

  /** Mundo 4: el Kraken surge del mar y arrastra a Xiana al fondo. */
  private guionMundo4(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const sueloY = h * 0.82
    const bs = h * 0.055
    const tKraken = 4.0
    const tCaptura = 6.5
    const tHunde = 8.5

    // personaje en la arena (jugando; luego asustado)
    const bote = t < tCaptura ? Math.abs(Math.sin(t * 4)) * h * 0.03 : 0
    dibujarPersonaje(ctx, this.personaje, w * 0.3, sueloY - bote, 1, bs)
    if (t >= tCaptura) {
      ctx.fillStyle = '#e63946'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${Math.round(h * 0.07)}px sans-serif`
      ctx.fillText('!', w * 0.3, sueloY - bs * 4)
    }

    // Xiana en la orilla; al hundirse baja con la jaula al mar
    let xiX = w * 0.44
    let xiY = sueloY
    if (t >= tHunde) {
      const v = easeOut(clamp01((t - tHunde) / (this.duracion - tHunde)))
      xiX = w * 0.44 + v * w * 0.26
      xiY = sueloY + v * h * 0.3
    }
    this.dibujarXiana(ctx, xiX, xiY, bs)
    if (t >= tCaptura) this.dibujarJaula(ctx, xiX, xiY, bs)

    // el Kraken emerge del mar
    if (t >= tKraken) {
      const sube = easeOut(clamp01((t - tKraken) / 1.2))
      let ky = sueloY + h * 0.25 - sube * h * 0.28
      if (t >= tHunde) {
        const v = easeOut(clamp01((t - tHunde) / (this.duracion - tHunde)))
        ky = sueloY - h * 0.03 + v * h * 0.4
      }
      const kx = w * 0.7
      const R = h * 0.11
      // tentáculos
      ctx.strokeStyle = '#7b2d8b'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      for (let i = 0; i < 5; i++) {
        const tx = kx - R + (i * R) / 2
        const onda = Math.sin(t * 4 + i) * 12
        ctx.beginPath()
        ctx.moveTo(tx, ky + R * 0.4)
        ctx.quadraticCurveTo(tx + onda, ky + R * 1.3, tx + onda * 1.5, ky + R * 1.9)
        ctx.stroke()
      }
      // tentáculo hacia Xiana durante la captura
      if (t >= tCaptura - 0.6 && t < tHunde + 1) {
        ctx.beginPath()
        ctx.moveTo(kx - R, ky)
        ctx.quadraticCurveTo((kx + xiX) / 2, sueloY - h * 0.16, xiX, xiY - bs * 1.6)
        ctx.stroke()
      }
      // cabezón y ojos
      ctx.fillStyle = '#9d4edd'
      ctx.beginPath()
      ctx.ellipse(kx, ky, R * 1.25, R, 0, 0, Math.PI * 2)
      ctx.fill()
      for (const lado of [-1, 1]) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(kx + lado * R * 0.45, ky - R * 0.15, R * 0.28, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1d3557'
        ctx.beginPath()
        ctx.arc(kx + lado * R * 0.45 - 3, ky - R * 0.15, R * 0.13, 0, Math.PI * 2)
        ctx.fill()
      }
      // salpicaduras
      ctx.fillStyle = 'rgba(180,225,255,0.9)'
      for (let i = 0; i < 5; i++) {
        const f = (t * 2 + i * 0.3) % 1
        ctx.beginPath()
        ctx.arc(kx - R + i * R * 0.5, sueloY - f * h * 0.06, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    this.subtitulo(ctx, w, h, 'Un día tranquilo en la playa…', fade(t, 0.4, 3.2, 3.8))
    this.subtitulo(ctx, w, h, '¡Del mar surgió el KRAKEN!', fade(t, 4.2, 5.8, 6.3), '#7b2d8b')
    this.subtitulo(ctx, w, h, '¡Atrapó a Xiana con sus tentáculos!', fade(t, 6.6, 8.0, 8.4), '#7b2d8b')
    this.subtitulo(ctx, w, h, '¡Se la lleva al FONDO DEL MAR! ¡Bucea y sálvala!', fade(t, 8.8, 11.2, 11.9), '#e63946')
  }

  private subtitulo(ctx: CanvasRenderingContext2D, w: number, h: number, texto: string, a: number, color = '#1d3557'): void {
    if (a <= 0) return
    ctx.globalAlpha = a
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(0, h * 0.86, w, h * 0.1)
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${Math.round(h * 0.05)}px 'Segoe UI', sans-serif`
    ctx.fillText(texto, w / 2, h * 0.91)
    ctx.globalAlpha = 1
  }

  /** Xiana: rubia con coletas, vestido rosa. */
  private dibujarXiana(ctx: CanvasRenderingContext2D, cx: number, piesY: number, bs: number): void {
    const u = bs / 16
    ctx.fillStyle = '#ff8fab'
    ctx.beginPath()
    ctx.moveTo(cx, piesY - 22 * u)
    ctx.lineTo(cx + 11 * u, piesY)
    ctx.lineTo(cx - 11 * u, piesY)
    ctx.closePath()
    ctx.fill()
    const cabY = piesY - 30 * u
    ctx.fillStyle = '#ffe0bd'
    ctx.beginPath()
    ctx.arc(cx, cabY, 9 * u, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffd166'
    ctx.beginPath()
    ctx.arc(cx, cabY - 2 * u, 10 * u, Math.PI, 2 * Math.PI)
    ctx.fill()
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(cx + lado * 11 * u, cabY + 2 * u, 4 * u, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#1d3557'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(cx + lado * 3.2 * u, cabY, 1.8 * u, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#1d3557'
    ctx.lineWidth = 1.4 * u
    ctx.beginPath()
    ctx.arc(cx, cabY + 3 * u, 2.4 * u, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  }

  private dibujarJaula(ctx: CanvasRenderingContext2D, cx: number, piesY: number, bs: number): void {
    const u = bs / 16
    const x0 = cx - 14 * u
    const x1 = cx + 14 * u
    const y0 = piesY - 36 * u
    ctx.strokeStyle = '#6c757d'
    ctx.lineWidth = 2 * u
    ctx.strokeRect(x0, y0, x1 - x0, piesY - y0)
    for (let i = 1; i < 4; i++) {
      const bx = x0 + ((x1 - x0) * i) / 4
      ctx.beginPath()
      ctx.moveTo(bx, y0)
      ctx.lineTo(bx, piesY)
      ctx.stroke()
    }
    ctx.fillStyle = '#495057'
    ctx.beginPath()
    ctx.arc(cx, y0, 4 * u, Math.PI, 2 * Math.PI)
    ctx.fill()
  }

  private dibujarMago(ctx: CanvasRenderingContext2D, cx: number, piesY: number, esc: number, h: number): void {
    const alto = h * 0.26 * esc
    const ancho = alto * 0.6
    const hombros = piesY - alto * 0.66
    ctx.fillStyle = '#3a0ca3'
    ctx.beginPath()
    ctx.moveTo(cx, hombros)
    ctx.lineTo(cx + ancho * 0.6, piesY)
    ctx.lineTo(cx - ancho * 0.6, piesY)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd60a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(alto * 0.12)}px sans-serif`
    ctx.fillText('✦', cx - ancho * 0.18, piesY - alto * 0.2)
    ctx.fillText('✦', cx + ancho * 0.2, piesY - alto * 0.32)
    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#e0aaff'
      ctx.beginPath()
      ctx.arc(cx + lado * ancho * 0.18, hombros + alto * 0.06, ancho * 0.13, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3c096c'
      ctx.beginPath()
      ctx.arc(cx + lado * ancho * 0.18, hombros + alto * 0.06, ancho * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#240a6b'
    ctx.beginPath()
    ctx.ellipse(cx, hombros, ancho * 0.62, alto * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.moveTo(cx + ancho * 0.1, hombros - alto * 0.5)
    ctx.lineTo(cx + ancho * 0.3, hombros)
    ctx.lineTo(cx - ancho * 0.3, hombros)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd60a'
    ctx.font = `${Math.round(alto * 0.16)}px sans-serif`
    ctx.fillText('★', cx + ancho * 0.1, hombros - alto * 0.46)
  }
}
