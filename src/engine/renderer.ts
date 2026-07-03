import { Level, TILE } from '../game/level'
import { Player } from '../game/player'
import { dibujarPersonaje } from './character'
import { Particulas } from './particles'
import type { Tema } from '../levels/types'

/** Filas visibles en pantalla; los niveles más altos usan cámara vertical. */
const FILAS_VISTA = 11

/** Paleta y decorados de cada mundo. */
interface TemaVisual {
  cielo: [string, string]
  astro: 'sol' | 'luna' | null
  nubes?: boolean
  estrellas?: boolean
  copos?: boolean
  ascuas?: boolean
  estalactitas?: boolean
  planeta?: boolean
  siluetas?: 'bosque' | 'volcan' | 'castillo'
  tierra: string
  tierraSombra: string
  franja: string
}

const TEMAS: Record<Tema, TemaVisual> = {
  pradera: {
    cielo: ['#7dd3f8', '#d9f4ff'], astro: 'sol', nubes: true,
    tierra: '#b07d4f', tierraSombra: '#94633a', franja: '#67c26b',
  },
  bosque: {
    cielo: ['#6fb7a0', '#d8f3e3'], astro: 'sol', nubes: true, siluetas: 'bosque',
    tierra: '#8a5a33', tierraSombra: '#6d4527', franja: '#3f8f4a',
  },
  cueva: {
    cielo: ['#26242f', '#4d4660'], astro: null, estalactitas: true,
    tierra: '#5b5965', tierraSombra: '#454351', franja: '#7b7787',
  },
  volcan: {
    cielo: ['#3a1d1d', '#7a3b2e'], astro: null, ascuas: true, siluetas: 'volcan',
    tierra: '#4a3f3f', tierraSombra: '#363030', franja: '#e85d04',
  },
  nieve: {
    cielo: ['#bcd9ee', '#eef7fc'], astro: 'sol', nubes: true, copos: true,
    tierra: '#dce8f2', tierraSombra: '#b9cdde', franja: '#ffffff',
  },
  espacio: {
    cielo: ['#0b0d2a', '#27315e'], astro: null, estrellas: true, planeta: true,
    tierra: '#6b5b8a', tierraSombra: '#544871', franja: '#9d8bbf',
  },
  castillo: {
    cielo: ['#1d1135', '#4a2a6a'], astro: 'luna', estrellas: true, siluetas: 'castillo',
    tierra: '#7f7a85', tierraSombra: '#615c68', franja: '#9a93a3',
  },
}

export class Renderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private scale = 1
  viewW = 0
  private viewH = 0
  private lastCamX = 0
  private lastCamY = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
    // Escala fija: siempre se ven FILAS_VISTA filas de alto
    this.scale = this.canvas.height / (FILAS_VISTA * TILE)
    this.viewW = this.canvas.width / this.scale
    this.viewH = this.canvas.height / this.scale
  }

  /** Cámara: sigue al jugador sin salirse del nivel. */
  camX(level: Level, player: Player): number {
    const objetivo = player.x + player.w / 2 - this.viewW / 2
    return Math.max(0, Math.min(objetivo, level.widthPx - this.viewW))
  }

  camY(level: Level, player: Player): number {
    const objetivo = player.y + player.h / 2 - this.viewH / 2
    return Math.max(0, Math.min(objetivo, level.heightPx - this.viewH))
  }

  /** Convierte un toque en pantalla a coordenadas del mundo (teletransporte). */
  pantallaAMundo(clientX: number, clientY: number): { x: number; y: number } {
    const dpr = this.canvas.width / window.innerWidth
    return {
      x: (clientX * dpr) / this.scale + this.lastCamX,
      y: (clientY * dpr) / this.scale + this.lastCamY,
    }
  }

  draw(level: Level, player: Player, numeroPersonaje?: number): void {
    const ctx = this.ctx
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)

    this.fondo(level)

    const cam = this.camX(level, player)
    const camY = this.camY(level, player)
    this.lastCamX = cam
    this.lastCamY = camY
    ctx.translate(-cam, -camY)

    this.tiles(level, cam, camY)
    this.plataformas(level)
    this.checkpointsDibujo(level)
    this.tubosDibujo(level)
    this.puertas(level)
    this.monedasDibujo(level)
    this.itemsDibujo(level)
    this.trampolinesDibujo(level)
    this.enemigosDibujo(level)
    this.vigilantesDibujo(level, player)
    this.pecesDibujo(level)
    this.medusasDibujo(level)
    this.cubosDibujo(level)
    this.jefeDibujo(level)
    this.xianaDibujo(level)
    this.meta(level)
    this.personajeConEfectos(level, player, numeroPersonaje ?? level.data.numero)
    this.particulas.draw(ctx)
  }

  /** Partículas de jugo visual (main las emite y actualiza). */
  readonly particulas = new Particulas()

  private personajeConEfectos(level: Level, player: Player, numero: number): void {
    const ctx = this.ctx
    const t = performance.now() / 1000
    // estela arcoíris al volar
    if (player.volarT > 0) {
      const colores = ['#e63946', '#ffd60a', '#3a86ff']
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.35 - i * 0.1
        ctx.fillStyle = colores[i]
        ctx.beginPath()
        ctx.arc(
          player.x + player.w / 2 - player.mirando * (10 + i * 9),
          player.y + player.h - 14 + Math.sin(t * 10 + i) * 4,
          5 - i,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    // estrella: aura dorada parpadeante alrededor del personaje
    if (player.estrellaT > 0) {
      const destello = 0.5 + 0.5 * Math.sin(t * 18)
      ctx.save()
      ctx.globalAlpha = 0.35 + destello * 0.35
      ctx.fillStyle = destello > 0.5 ? '#ffd60a' : '#fff3b0'
      ctx.beginPath()
      ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w + 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    // invisible: se ve translúcido (el jugador sí se ve a sí mismo)
    if (player.invisibleT > 0) ctx.globalAlpha = 0.35
    // squash & stretch: estirado en el aire, aplastado al aterrizar fuerte
    const cxP = player.x + player.w / 2
    const piesY = player.y + player.h
    let sx = 1
    let sy = 1
    if (player.squashT > 0) {
      const f = player.squashT / 0.16
      sx = 1 + 0.22 * f
      sy = 1 - 0.22 * f
    } else if (!player.enSuelo) {
      const v = Math.min(1, Math.abs(player.vy) / 650)
      sx = 1 - 0.08 * v
      sy = 1 + 0.12 * v
    }
    ctx.save()
    ctx.translate(cxP, piesY)
    ctx.scale(sx, sy)
    ctx.translate(-cxP, -piesY)
    // al ser lanzado por el Remolino, el personaje gira
    if (player.girandoT > 0) {
      ctx.translate(cxP, player.y + player.h / 2)
      ctx.rotate(player.girandoT * 20)
      ctx.translate(-cxP, -(player.y + player.h / 2))
    }
    dibujarPersonaje(ctx, numero, cxP, piesY, player.mirando)
    ctx.restore()
    ctx.globalAlpha = 1
    // sombrero rojo puesto mientras quede teletransporte
    if (player.teleUsos > 0) {
      const cx = player.x + player.w / 2
      const arriba = player.y + player.h - 46
      ctx.fillStyle = '#c1121f'
      ctx.beginPath()
      ctx.roundRect(cx - 12, arriba + 4, 24, 4, 2)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(cx - 7, arriba - 6, 14, 11, 3)
      ctx.fill()
      ctx.fillStyle = '#ffd60a'
      ctx.fillText('✦', cx + 12 + Math.sin(t * 6) * 3, arriba - 4)
    }
  }

  private tubosDibujo(level: Level): void {
    const ctx = this.ctx
    for (const tubo of level.tubos) {
      ctx.fillStyle = '#2d9c46'
      ctx.beginPath()
      ctx.roundRect(tubo.x + 3, tubo.y + 8, TILE - 6, TILE * 2 - 8, 3)
      ctx.fill()
      // boca más ancha
      ctx.fillStyle = '#37b653'
      ctx.beginPath()
      ctx.roundRect(tubo.x - 2, tubo.y, TILE + 4, 14, 4)
      ctx.fill()
      ctx.strokeStyle = '#1e7a33'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  private itemsDibujo(level: Level): void {
    const ctx = this.ctx
    const t = performance.now() / 1000
    for (const item of level.items) {
      if (item.recogido) continue
      const y = item.cy + Math.sin(t * 3 + item.cx) * 4
      if (item.tipo === 'gafas') {
        // gafas amarillas: cristales rectangulares, montura y patillas,
        // balanceándose para que no se confundan con monedas
        ctx.save()
        ctx.translate(item.cx, y)
        ctx.rotate(Math.sin(t * 2.2 + item.cx) * 0.22)
        ctx.lineCap = 'round'
        // patillas hacia atrás
        ctx.strokeStyle = '#b8860b'
        ctx.lineWidth = 2.5
        for (const lado of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(lado * 14, -2)
          ctx.lineTo(lado * 20, -7)
          ctx.stroke()
        }
        // cristales rectangulares amarillos translúcidos
        for (const lado of [-1, 1]) {
          ctx.fillStyle = 'rgba(255,214,10,0.45)'
          ctx.strokeStyle = '#e6b800'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.roundRect(lado * 8 - 7, -6, 14, 11, 4)
          ctx.fill()
          ctx.stroke()
        }
        // puente
        ctx.strokeStyle = '#e6b800'
        ctx.beginPath()
        ctx.moveTo(-1.5, -3)
        ctx.lineTo(1.5, -3)
        ctx.stroke()
        ctx.restore()
      } else if (item.tipo === 'arcoiris') {
        const colores = ['#e63946', '#ffd60a', '#3a86ff']
        colores.forEach((color, i) => {
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(item.cx, y + 6, 12 - i * 3.5, Math.PI, 2 * Math.PI)
          ctx.stroke()
        })
      } else if (item.tipo === 'sombrero') {
        // sombrero rojo con brillos
        ctx.fillStyle = '#c1121f'
        ctx.beginPath()
        ctx.roundRect(item.cx - 12, y + 4, 24, 5, 2)
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(item.cx - 7, y - 8, 14, 13, 3)
        ctx.fill()
        ctx.fillStyle = '#ffd60a'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('✦', item.cx + 13, y - 4 + Math.sin(t * 5) * 2)
        ctx.fillText('✦', item.cx - 13, y + 2 + Math.cos(t * 5) * 2)
      } else if (item.tipo === 'cubo') {
        // cubo de Rubik girando suavemente
        this.dibujarCubo(item.cx, y, 22, Math.sin(t * 1.5 + item.cx) * 0.4)
      } else {
        // estrella dorada que late
        this.dibujarEstrella(item.cx, y, 13 + Math.sin(t * 4 + item.cx) * 1.5, t)
      }
    }
  }

  /** Dibuja un cubo de Rubik (cuadro 3×3 de colores) en (cx, cy). */
  private dibujarCubo(cx: number, cy: number, lado: number, giro: number): void {
    const ctx = this.ctx
    const colores = ['#e63946', '#ffd60a', '#3a86ff', '#52b788', '#f77f00', '#ffffff']
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(giro)
    const m = lado / 2
    // marco negro
    ctx.fillStyle = '#1d1d1d'
    ctx.beginPath()
    ctx.roundRect(-m, -m, lado, lado, 4)
    ctx.fill()
    // 9 pegatinas
    const celda = lado / 3
    const hueco = celda * 0.78
    const off = (celda - hueco) / 2
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = colores[(r * 3 + c + Math.round(cx)) % colores.length]
        ctx.beginPath()
        ctx.roundRect(-m + c * celda + off, -m + r * celda + off, hueco, hueco, 1.5)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  /** Dibuja una estrella dorada de cinco puntas en (cx, cy). */
  private dibujarEstrella(cx: number, cy: number, radio: number, t: number): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(Math.sin(t * 2) * 0.15)
    ctx.fillStyle = '#ffd60a'
    ctx.strokeStyle = '#e6a700'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2
      const rad = i % 2 === 0 ? radio : radio * 0.45
      const px = Math.cos(ang) * rad
      const py = Math.sin(ang) * rad
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  private cubosDibujo(level: Level): void {
    for (const cubo of level.cubosVolando) {
      this.dibujarCubo(cubo.x + cubo.w / 2, cubo.y + cubo.h / 2, cubo.w, cubo.giro)
    }
  }

  /** Trampolín: base roja con muelle; se aplasta un instante tras el bote. */
  private trampolinesDibujo(level: Level): void {
    const ctx = this.ctx
    for (const tr of level.trampolines) {
      const apl = tr.compresionT > 0 ? 0.55 : 1
      const h = tr.h * apl
      const y = tr.y + tr.h - h
      // muelle (zigzag gris)
      ctx.strokeStyle = '#8d99ae'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= 3; i++) {
        const yy = y + (h / 3) * i
        ctx[i === 0 ? 'moveTo' : 'lineTo'](tr.x + (i % 2 === 0 ? 8 : tr.w - 8), yy)
      }
      ctx.stroke()
      // plataforma superior roja con franja blanca
      ctx.fillStyle = '#e63946'
      ctx.beginPath()
      ctx.roundRect(tr.x + 2, y - 5, tr.w - 4, 7, 3)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(tr.x + 6, y - 3, tr.w - 12, 2)
    }
  }

  /** Medusa rosa: campana translúcida con tentáculos ondulantes. */
  private medusasDibujo(level: Level): void {
    const ctx = this.ctx
    const t = performance.now() / 1000
    for (const med of level.medusas) {
      const cx = med.x + med.w / 2
      const y = med.y
      ctx.fillStyle = 'rgba(255,143,171,0.85)'
      ctx.beginPath()
      ctx.arc(cx, y + 10, 12, Math.PI, 2 * Math.PI)
      ctx.fill()
      ctx.fillRect(cx - 12, y + 9, 24, 4)
      // tentáculos
      ctx.strokeStyle = 'rgba(255,143,171,0.7)'
      ctx.lineWidth = 2.5
      for (let i = 0; i < 4; i++) {
        const tx = cx - 9 + i * 6
        ctx.beginPath()
        ctx.moveTo(tx, y + 13)
        ctx.quadraticCurveTo(tx + Math.sin(t * 4 + i) * 4, y + 20, tx + Math.sin(t * 4 + i + 1) * 5, y + 26)
        ctx.stroke()
      }
      // ojitos
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(cx - 4, y + 6, 1.8, 0, Math.PI * 2)
      ctx.arc(cx + 4, y + 6, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private vigilantesDibujo(level: Level, player: Player): void {
    const ctx = this.ctx
    for (const v of level.vigilantes) {
      if (v.muerto && v.squashT <= 0) continue
      // haz de visión (se apaga si el jugador es invisible)
      if (!v.muerto) {
        const vis = v.vision()
        ctx.fillStyle =
          player.invisibleT > 0
            ? 'rgba(141,153,174,0.12)'
            : v.enfadado
              ? 'rgba(230,57,70,0.22)'
              : 'rgba(255,214,10,0.18)'
        ctx.beginPath()
        const ojoX = v.dir < 0 ? v.x : v.x + v.w
        ctx.moveTo(ojoX, v.y + 8)
        ctx.lineTo(v.dir < 0 ? vis.x : vis.x + vis.w, vis.y)
        ctx.lineTo(v.dir < 0 ? vis.x : vis.x + vis.w, vis.y + vis.h)
        ctx.closePath()
        ctx.fill()
      }
      const aplaste = v.muerto ? Math.max(0.2, v.squashT / 0.4) : 1
      const h = v.h * aplaste
      const y = v.y + v.h - h
      ctx.fillStyle = v.enfadado ? '#d00000' : '#e85d04'
      ctx.beginPath()
      ctx.roundRect(v.x, y, v.w, h, 8)
      ctx.fill()
      ctx.strokeStyle = '#9d0208'
      ctx.lineWidth = 2
      ctx.stroke()
      if (!v.muerto) {
        // un ojo enorme que vigila
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(v.x + v.w / 2, y + 13, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1d3557'
        ctx.beginPath()
        ctx.arc(v.x + v.w / 2 + v.dir * 3.5, y + 13, 4.5, 0, Math.PI * 2)
        ctx.fill()
        // patitas
        ctx.fillStyle = '#9d0208'
        ctx.fillRect(v.x + 4, v.y + v.h - 3, 7, 3)
        ctx.fillRect(v.x + v.w - 11, v.y + v.h - 3, 7, 3)
      }
    }
  }

  private pecesDibujo(level: Level): void {
    const ctx = this.ctx
    for (const pez of level.peces) {
      const { x, y, w, h } = pez.rect()
      // cuerpo
      ctx.fillStyle = '#f3722c'
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      // cola
      ctx.beginPath()
      const colaX = pez.dir > 0 ? x : x + w
      ctx.moveTo(colaX, y + h / 2)
      ctx.lineTo(colaX - pez.dir * 8, y)
      ctx.lineTo(colaX - pez.dir * 8, y + h)
      ctx.closePath()
      ctx.fill()
      // pinchos en el lomo
      ctx.fillStyle = '#9d0208'
      ctx.beginPath()
      for (let i = 0; i < 3; i++) {
        const sx = x + 5 + i * 6
        ctx.moveTo(sx, y + 2)
        ctx.lineTo(sx + 3, y - 5)
        ctx.lineTo(sx + 6, y + 2)
      }
      ctx.fill()
      // ojo
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x + w / 2 + pez.dir * 7, y + h / 2 - 2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(x + w / 2 + pez.dir * 8, y + h / 2 - 2, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private tema(level: Level): TemaVisual {
    return TEMAS[level.data.tema ?? 'pradera']
  }

  private fondo(level: Level): void {
    const ctx = this.ctx
    const tema = this.tema(level)
    const t = performance.now() / 1000
    const w = this.viewW
    const h = this.viewH

    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, tema.cielo[0])
    g.addColorStop(1, tema.cielo[1])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    if (tema.astro === 'sol') {
      ctx.fillStyle = '#ffd60a'
      ctx.beginPath()
      ctx.arc(w - 70, 60, 34, 0, Math.PI * 2)
      ctx.fill()
    } else if (tema.astro === 'luna') {
      ctx.fillStyle = '#e9e4f0'
      ctx.beginPath()
      ctx.arc(w - 70, 60, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#cfc7dd'
      for (const [dx, dy, r] of [[-8, -5, 6], [9, 7, 4], [3, -11, 3]] as const) {
        ctx.beginPath()
        ctx.arc(w - 70 + dx, 60 + dy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (tema.estrellas) {
      for (let i = 0; i < 38; i++) {
        const x = (i * 487) % w
        const y = (i * 233) % (h * 0.65)
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.abs(Math.sin(t * 1.6 + i))})`
        ctx.fillRect(x, y, 2.5, 2.5)
      }
    }

    if (tema.planeta) {
      const px = w * 0.22
      const py = h * 0.22
      ctx.fillStyle = '#e07a5f'
      ctx.beginPath()
      ctx.arc(px, py, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(244,217,123,0.85)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.ellipse(px, py, 42, 11, -0.3, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (tema.siluetas === 'bosque') {
      ctx.fillStyle = 'rgba(34,86,56,0.5)'
      for (let i = 0; i < 9; i++) {
        const x = ((i * 173) % (w + 120)) - 60
        const alto = 70 + ((i * 53) % 60)
        ctx.beginPath()
        ctx.moveTo(x, h)
        ctx.lineTo(x + 40, h - alto)
        ctx.lineTo(x + 80, h)
        ctx.closePath()
        ctx.fill()
      }
    } else if (tema.siluetas === 'volcan') {
      ctx.fillStyle = 'rgba(30,16,14,0.75)'
      ctx.beginPath()
      ctx.moveTo(w * 0.5, h)
      ctx.lineTo(w * 0.72, h * 0.32)
      ctx.lineTo(w * 0.78, h * 0.32)
      ctx.lineTo(w * 0.98, h)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgba(255,120,30,${0.6 + 0.3 * Math.sin(t * 3)})`
      ctx.beginPath()
      ctx.ellipse(w * 0.75, h * 0.32, 16, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (tema.siluetas === 'castillo') {
      ctx.fillStyle = 'rgba(20,10,40,0.8)'
      for (const [bx, bw, bh] of [[0.08, 0.07, 0.45], [0.18, 0.12, 0.32], [0.3, 0.06, 0.5]] as const) {
        const x = w * bx
        const ancho = w * bw
        const y = h - h * bh
        ctx.fillRect(x, y, ancho, h * bh)
        // almenas
        const diente = ancho / 5
        for (let i = 0; i < 3; i++) ctx.fillRect(x + diente * (i * 2 + 0.25), y - 9, diente, 9)
      }
    }

    if (tema.estalactitas) {
      ctx.fillStyle = 'rgba(125,118,140,0.8)'
      for (let i = 0; i < 10; i++) {
        const x = ((i * 211) % (w + 80)) - 40
        const alto = 26 + ((i * 37) % 42)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + 14, 0)
        ctx.lineTo(x + 7, alto)
        ctx.closePath()
        ctx.fill()
      }
    }

    if (tema.nubes) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      for (let i = 0; i < 5; i++) {
        const x = ((i * 397 + level.data.numero * 131) % Math.max(level.widthPx, 1)) % w
        const y = 40 + ((i * 67) % 80)
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.arc(x + 22, y + 4, 14, 0, Math.PI * 2)
        ctx.arc(x - 20, y + 6, 13, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (tema.copos) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (let i = 0; i < 32; i++) {
        const x = (i * 311 + Math.sin(t + i) * 18) % w
        const y = (i * 97 + t * 34) % h
        ctx.beginPath()
        ctx.arc(x, y, i % 3 === 0 ? 2.6 : 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (tema.ascuas) {
      for (let i = 0; i < 22; i++) {
        const x = (i * 251 + Math.sin(t * 1.3 + i) * 24) % w
        const y = h - ((i * 137 + t * 46) % h)
        ctx.fillStyle = `rgba(255,${120 + (i % 3) * 40},20,${0.35 + 0.3 * Math.sin(t * 4 + i)})`
        ctx.beginPath()
        ctx.arc(x, y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  private tiles(level: Level, cam: number, camY: number): void {
    const ctx = this.ctx
    const tema = this.tema(level)
    const tAnim = performance.now() / 1000
    const c0 = Math.max(0, Math.floor(cam / TILE))
    const c1 = Math.min(level.cols - 1, Math.ceil((cam + this.viewW) / TILE))
    const r0 = Math.max(0, Math.floor(camY / TILE))
    const r1 = Math.min(level.rows - 1, Math.ceil((camY + this.viewH) / TILE))

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = level.tileAt(c, r)
        const x = c * TILE
        const y = r * TILE
        if (t === 1) {
          // Bloque de terreno del tema, con franja superior si está despejado
          ctx.fillStyle = tema.tierra
          ctx.beginPath()
          ctx.roundRect(x, y, TILE, TILE, 4)
          ctx.fill()
          ctx.fillStyle = tema.tierraSombra
          ctx.fillRect(x + 4, y + 10, 6, 5)
          ctx.fillRect(x + 18, y + 20, 7, 5)
          if (level.tileAt(c, r - 1) !== 1) {
            ctx.fillStyle = tema.franja
            ctx.beginPath()
            ctx.roundRect(x, y - 3, TILE, 11, 5)
            ctx.fill()
          }
        } else if (t === 2) {
          // Pinchos
          ctx.fillStyle = '#8d99ae'
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const sx = x + i * 8
            ctx.moveTo(sx, y + TILE)
            ctx.lineTo(sx + 4, y + 10)
            ctx.lineTo(sx + 8, y + TILE)
          }
          ctx.fill()
        } else if (t === 3) {
          // Agua
          ctx.fillStyle = 'rgba(64,160,255,0.55)'
          ctx.fillRect(x, y, TILE, TILE)
          if (!level.esAgua(c, r - 1)) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.fillRect(x, y, TILE, 3)
          }
        } else if (t === 4) {
          // Hielo: bloque azulado con brillo diagonal
          ctx.fillStyle = '#bfe2f8'
          ctx.beginPath()
          ctx.roundRect(x, y, TILE, TILE, 4)
          ctx.fill()
          ctx.fillStyle = '#e9f6ff'
          ctx.fillRect(x, y, TILE, 5)
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(x + 7, y + 24)
          ctx.lineTo(x + 20, y + 9)
          ctx.stroke()
        } else if (t === 5) {
          // Lava burbujeante
          ctx.fillStyle = '#d00000'
          ctx.fillRect(x, y, TILE, TILE)
          ctx.fillStyle = `rgba(255,186,8,${0.55 + 0.3 * Math.sin(tAnim * 4 + c)})`
          ctx.fillRect(x, y, TILE, 8)
          ctx.fillStyle = '#ff5400'
          const burbuja = (tAnim * 2 + c * 0.7) % 1
          ctx.beginPath()
          ctx.arc(x + 8 + (c % 3) * 8, y + 6 + burbuja * 18, 3.5 * (1 - burbuja), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  private plataformas(level: Level): void {
    const ctx = this.ctx
    for (const p of level.moviles) {
      ctx.fillStyle = '#67c26b'
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.w, p.h, 6)
      ctx.fill()
      ctx.strokeStyle = '#3f8f4a'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    for (const p of level.caedizas) {
      if (!p.activa()) continue
      const sacudida = p.estado === 'temblando' ? Math.sin(p.temblor * 45) * 2 : 0
      ctx.fillStyle = '#c99c63'
      ctx.beginPath()
      ctx.roundRect(p.x + sacudida, p.y, p.w, p.h, 4)
      ctx.fill()
      ctx.strokeStyle = '#8a5a33'
      ctx.lineWidth = 2
      ctx.stroke()
      // vetas de madera
      ctx.fillStyle = '#8a5a33'
      ctx.fillRect(p.x + sacudida + 7, p.y + 4, 6, 3)
      ctx.fillRect(p.x + sacudida + 19, p.y + 5, 6, 3)
    }
    // plataformas que parpadean (cristal violeta)
    const tParp = performance.now() / 1000
    for (const p of level.parpadeantes) {
      if (!p.activa()) {
        // fantasma tenue para saber dónde reaparecerá
        ctx.globalAlpha = 0.15
        ctx.strokeStyle = '#b298dc'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(p.x, p.y, p.w, p.h, 5)
        ctx.stroke()
        ctx.globalAlpha = 1
        continue
      }
      if (p.avisando()) ctx.globalAlpha = 0.45 + 0.45 * Math.sin(tParp * 26)
      ctx.fillStyle = '#b298dc'
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.w, p.h, 5)
      ctx.fill()
      ctx.strokeStyle = '#7d5ba6'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(p.x + 5, p.y + 2.5, 9, 2.5)
      ctx.globalAlpha = 1
    }
  }

  private checkpointsDibujo(level: Level): void {
    const ctx = this.ctx
    for (const c of level.checkpoints) {
      const baseY = c.y + TILE
      ctx.fillStyle = '#8d99ae'
      ctx.fillRect(c.x + 13, baseY - TILE * 1.6, 5, TILE * 1.6)
      ctx.fillStyle = c.activado ? '#52b788' : '#cdd5df'
      ctx.beginPath()
      ctx.arc(c.x + 16, baseY - TILE * 1.6, 9, 0, Math.PI * 2)
      ctx.fill()
      if (c.activado) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('OK', c.x + 16, baseY - TILE * 1.6 + 1)
      }
    }
  }

  private monedasDibujo(level: Level): void {
    const ctx = this.ctx
    const t = performance.now() / 1000
    for (const m of level.monedas) {
      if (m.recogida) continue
      // gira: la anchura oscila como si rotara sobre su eje
      const giro = Math.abs(Math.sin(t * 3 + m.cx * 0.05))
      ctx.fillStyle = '#ffd60a'
      ctx.beginPath()
      ctx.ellipse(m.cx, m.cy, 4 + 6 * giro, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#e0a800'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  private enemigosDibujo(level: Level): void {
    const ctx = this.ctx
    for (const e of level.enemigos) {
      if (e.muerto && e.squashT <= 0) continue
      const aplaste = e.muerto ? Math.max(0.2, e.squashT / 0.4) : 1
      const h = e.h * aplaste
      const y = e.y + e.h - h
      ctx.fillStyle = '#5e548e'
      ctx.beginPath()
      ctx.roundRect(e.x, y, e.w, h, 8)
      ctx.fill()
      if (!e.muerto) {
        // ojos mirando hacia donde camina
        for (const lado of [-1, 1]) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(e.x + e.w / 2 + lado * 6, y + 7, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#1d3557'
          ctx.beginPath()
          ctx.arc(e.x + e.w / 2 + lado * 6 + e.dir * 1.5, y + 7, 2, 0, Math.PI * 2)
          ctx.fill()
        }
        // patitas
        ctx.fillStyle = '#3c355c'
        ctx.fillRect(e.x + 4, e.y + e.h - 3, 6, 3)
        ctx.fillRect(e.x + e.w - 10, e.y + e.h - 3, 6, 3)
      }
    }
  }

  /** Dibuja el jefe final del nivel (el Comecubos o el Mago Oscuro). */
  private jefeDibujo(level: Level): void {
    const j = level.jefe
    if (!j) return
    const ctx = this.ctx
    const esMago = j.tipo === 'mago'
    const esKraken = j.tipo === 'kraken'
    // proyectiles: burbujas (kraken), orbes mágicos (mago) o fuego (comecubos)
    for (const b of j.bolas) {
      if (esKraken) {
        ctx.strokeStyle = 'rgba(180,225,255,0.95)'
        ctx.lineWidth = 2.5
        ctx.fillStyle = 'rgba(140,200,255,0.35)'
        ctx.beginPath()
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(b.x - 3, b.y - 3, 2.5, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      ctx.fillStyle = esMago ? '#9d4edd' : '#f3722c'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = esMago ? '#e0aaff' : '#ffd60a'
      ctx.beginPath()
      ctx.arc(b.x - b.vx * 0.01, b.y - b.vy * 0.01, 4.5, 0, Math.PI * 2)
      ctx.fill()
    }
    if (j.muerto && j.squashT <= 0) return
    const aplaste = j.muerto ? Math.max(0.15, j.squashT / 0.6) : 1
    const h = j.h * aplaste
    const y = j.y + j.h - h

    // parpadeo mientras es invulnerable o se acaba de teletransportar
    const teleFlash = 'teleFlash' in j ? j.teleFlash : 0
    if ((j.invulT > 0 || teleFlash > 0) && Math.sin(performance.now() / 40) > 0) {
      ctx.globalAlpha = 0.45
    }

    if (j.tipo === 'mago') this.magoCuerpo(j, y, h)
    else if (j.tipo === 'tornado') this.tornadoCuerpo(j, y, h)
    else if (j.tipo === 'kraken') this.krakenCuerpo(j, y, h)
    else this.comecubosCuerpo(j, y, h)

    if (!j.muerto) {
      // corazones de vida (común a los dos jefes)
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < j.vidas; i++) {
        ctx.fillText('❤️', j.x + j.w / 2 + (i - (j.vidas - 1) / 2) * 20, y - 16)
      }
    }
    ctx.globalAlpha = 1
  }

  /** Cuerpo del Comecubos: bloque morado con dientes y ojos enfadados. */
  private comecubosCuerpo(j: { x: number; w: number; dir: number; muerto: boolean }, y: number, h: number): void {
    const ctx = this.ctx
    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.roundRect(j.x, y, j.w, h, 10)
    ctx.fill()
    ctx.strokeStyle = '#3c096c'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 4; i++) {
      const dx = j.x + 8 + i * 12
      ctx.beginPath()
      ctx.moveTo(dx, y + h - 4)
      ctx.lineTo(dx + 5, y + h - 14)
      ctx.lineTo(dx + 10, y + h - 4)
      ctx.closePath()
      ctx.fill()
    }
    if (j.muerto) return
    for (const lado of [-1, 1]) {
      const ex = j.x + j.w / 2 + lado * 14
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, y + 18, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#c1121f'
      ctx.beginPath()
      ctx.arc(ex + j.dir * 2.5, y + 18, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1d1d1d'
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.moveTo(ex - lado * 9, y + 6)
      ctx.lineTo(ex + lado * 8, y + 11)
      ctx.stroke()
    }
  }

  /** Cuerpo del Remolino: embudo de aire que gira, con cara enfadada arriba. */
  private tornadoCuerpo(
    j: { x: number; w: number; muerto: boolean; giro: number },
    y: number,
    h: number,
  ): void {
    const ctx = this.ctx
    const cx = j.x + j.w / 2
    const capas = 8
    for (let i = 0; i < capas; i++) {
      const f = i / (capas - 1) // 0 abajo (estrecho) … 1 arriba (ancho)
      const ey = y + h - f * h
      const ew = (0.18 + f * 0.95) * j.w
      const desf = Math.sin(j.giro * 2 + i * 0.7) * ew * 0.14
      ctx.fillStyle = i % 2 === 0 ? 'rgba(120,150,180,0.92)' : 'rgba(180,205,228,0.92)'
      ctx.beginPath()
      ctx.ellipse(cx + desf, ey, ew / 2, Math.max(5, 7 * f), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    if (!j.muerto) {
      const fy = y + h * 0.26
      for (const lado of [-1, 1]) {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(cx + lado * 10, fy, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1d3557'
        ctx.beginPath()
        ctx.arc(cx + lado * 10, fy, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#1d3557'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(cx + lado * 4, fy - 8)
        ctx.lineTo(cx + lado * 15, fy - 4)
        ctx.stroke()
      }
    }
  }

  /** Cuerpo del Kraken: cabezón de pulpo morado con tentáculos ondulantes. */
  private krakenCuerpo(
    j: { x: number; w: number; dir: number; muerto: boolean; giro: number },
    y: number,
    h: number,
  ): void {
    const ctx = this.ctx
    const cx = j.x + j.w / 2
    const base = y + h
    // tentáculos (detrás del cuerpo, ondulando)
    ctx.strokeStyle = '#7b2d8b'
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    for (let i = 0; i < 5; i++) {
      const tx = j.x + 10 + (i * (j.w - 20)) / 4
      const onda = Math.sin(j.giro * 2 + i * 1.3) * 10
      ctx.beginPath()
      ctx.moveTo(tx, base - h * 0.3)
      ctx.quadraticCurveTo(tx + onda, base - 6, tx + onda * 1.6, base + 2)
      ctx.stroke()
    }
    // cabezón
    ctx.fillStyle = '#9d4edd'
    ctx.beginPath()
    ctx.ellipse(cx, y + h * 0.42, j.w / 2, h * 0.46, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#6a2c91'
    ctx.lineWidth = 3
    ctx.stroke()
    if (j.muerto) return
    // ojazos y boca enfadada
    for (const lado of [-1, 1]) {
      const ex = cx + lado * 17
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, y + h * 0.36, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(ex + j.dir * 3, y + h * 0.36, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#3c096c'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(ex - lado * 11, y + h * 0.2)
      ctx.lineTo(ex + lado * 9, y + h * 0.27)
      ctx.stroke()
    }
    ctx.strokeStyle = '#3c096c'
    ctx.beginPath()
    ctx.arc(cx, y + h * 0.62, 8, 1.15 * Math.PI, 1.85 * Math.PI)
    ctx.stroke()
  }

  /** Cuerpo del Mago Oscuro: túnica morada, gorro de pico con estrella y ojos. */
  private magoCuerpo(j: { x: number; w: number; muerto: boolean }, y: number, h: number): void {
    const ctx = this.ctx
    const cx = j.x + j.w / 2
    const hombros = y + h * 0.34
    // túnica (trapecio que se ensancha hacia abajo)
    ctx.fillStyle = '#3a0ca3'
    ctx.beginPath()
    ctx.moveTo(cx, hombros)
    ctx.lineTo(j.x + j.w * 0.95, y + h)
    ctx.lineTo(j.x + j.w * 0.05, y + h)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#240a6b'
    ctx.lineWidth = 2.5
    ctx.stroke()
    // estrellitas de la túnica
    ctx.fillStyle = '#ffd60a'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✦', cx - 7, y + h * 0.72)
    ctx.fillText('✦', cx + 8, y + h * 0.82)
    if (!j.muerto) {
      // ojos brillantes bajo el ala del gorro
      for (const lado of [-1, 1]) {
        const ex = cx + lado * 9
        ctx.fillStyle = '#e0aaff'
        ctx.beginPath()
        ctx.arc(ex, hombros + 4, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#3c096c'
        ctx.beginPath()
        ctx.arc(ex, hombros + 4, 2.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // ala del gorro
    ctx.fillStyle = '#240a6b'
    ctx.beginPath()
    ctx.ellipse(cx, hombros - 1, j.w * 0.5, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    // cono del gorro (un poco torcido)
    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.moveTo(cx + 5, y - 6)
    ctx.lineTo(j.x + j.w * 0.74, hombros - 1)
    ctx.lineTo(j.x + j.w * 0.26, hombros - 1)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#240a6b'
    ctx.lineWidth = 2
    ctx.stroke()
    // estrella de la punta
    ctx.fillStyle = '#ffd60a'
    ctx.font = '12px sans-serif'
    ctx.fillText('★', cx + 5, y - 1)
  }

  /** Xiana, estilo dibujo animado: ojazos, flequillo y coletas con gomas. */
  private xianaDibujo(level: Level): void {
    const x = level.xiana
    if (!x) return
    const ctx = this.ctx
    const t = performance.now() / 1000
    const cx = x.x + TILE / 2
    const piesY = x.y + TILE
    const salto = x.libre ? Math.abs(Math.sin(t * 6)) * 7 : 0
    const base = piesY - salto
    const balanceo = x.libre ? Math.sin(t * 6) * 0.06 : Math.sin(t * 1.2) * 0.02

    ctx.save()
    ctx.translate(cx, base)
    ctx.rotate(balanceo)
    ctx.lineCap = 'round'

    const PIEL = '#ffdfc4'
    const PELO = '#ffd60a'
    const PELO_SOMBRA = '#e6b800'
    const ROSA = '#ff5d8f'
    const ROSA_OSCURO = '#e8447a'

    // piernas con calcetines y zapatitos rojos
    ctx.strokeStyle = PIEL
    ctx.lineWidth = 3.4
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(lado * 4.5, -12)
      ctx.lineTo(lado * 4.5, -3)
      ctx.stroke()
    }
    ctx.fillStyle = '#c1121f'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(lado * 5, -1.6, 4.4, 2.4, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // coletas DETRÁS de la cabeza: dos mechones largos que caen
    for (const lado of [-1, 1]) {
      ctx.fillStyle = PELO
      ctx.beginPath()
      ctx.ellipse(lado * 12.5, -34 + Math.sin(t * 5 + lado) * (x.libre ? 1.6 : 0.4), 4.6, 9.5, lado * 0.25, 0, Math.PI * 2)
      ctx.fill()
      // goma rosa de la coleta
      ctx.strokeStyle = ROSA_OSCURO
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.arc(lado * 10.6, -40.5, 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // vestido rosa con vuelo y mangas
    ctx.fillStyle = ROSA
    ctx.beginPath()
    ctx.moveTo(-5.5, -28)
    ctx.quadraticCurveTo(-13, -12, -11.5, -10)
    ctx.lineTo(11.5, -10)
    ctx.quadraticCurveTo(13, -12, 5.5, -28)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = ROSA_OSCURO
    ctx.lineWidth = 1.6
    ctx.stroke()
    // bajo de la falda
    ctx.strokeStyle = ROSA_OSCURO
    ctx.beginPath()
    ctx.moveTo(-11.5, -10)
    ctx.quadraticCurveTo(0, -7.4, 11.5, -10)
    ctx.stroke()

    // brazos (arriba celebrando si está libre)
    ctx.strokeStyle = PIEL
    ctx.lineWidth = 3.2
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(lado * 5.5, -25)
      if (x.libre) ctx.lineTo(lado * 12, -35)
      else ctx.lineTo(lado * 9.5, -17)
      ctx.stroke()
    }

    // cabeza grande
    ctx.fillStyle = PIEL
    ctx.beginPath()
    ctx.arc(0, -38, 10.5, 0, Math.PI * 2)
    ctx.fill()

    // melena: casquete con flequillo de tres puntas
    ctx.fillStyle = PELO
    ctx.beginPath()
    ctx.arc(0, -39.5, 11.2, Math.PI * 0.95, Math.PI * 2.05)
    ctx.fill()
    ctx.beginPath()
    for (const [px0, px1] of [[-11, -4], [-4, 3.5], [3.5, 11]] as const) {
      ctx.moveTo(px0, -41)
      ctx.quadraticCurveTo((px0 + px1) / 2, -33.5, px1, -41)
    }
    ctx.fill()
    // brillitos del pelo
    ctx.strokeStyle = PELO_SOMBRA
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(0, -39.5, 9.2, Math.PI * 1.15, Math.PI * 1.5)
    ctx.stroke()

    // ojazos con iris azul y brillo
    for (const lado of [-1, 1]) {
      const ex = lado * 4.2
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(ex, -37.5, 3.1, 3.7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a86ff'
      ctx.beginPath()
      ctx.arc(ex, -37, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(ex, -37, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex + 0.9, -38.1, 0.8, 0, Math.PI * 2)
      ctx.fill()
      // pestañas
      ctx.strokeStyle = '#1d3557'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(ex + lado * 2.6, -40.6)
      ctx.lineTo(ex + lado * 3.8, -41.8)
      ctx.stroke()
    }

    // mofletes y sonrisa (boca abierta de alegría si está libre)
    ctx.fillStyle = 'rgba(255,140,160,0.55)'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(lado * 6.4, -33.6, 2, 1.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    if (x.libre) {
      ctx.fillStyle = '#9d2235'
      ctx.beginPath()
      ctx.arc(0, -33.2, 2.4, 0, Math.PI)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.strokeStyle = '#9d2235'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, -34.2, 2.6, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
    }

    ctx.restore()

    if (x.libre) {
      // corazones flotando al celebrar
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i < 3; i++) {
        const fase = (t * 0.8 + i / 3) % 1
        ctx.globalAlpha = 1 - fase
        ctx.fillText('❤️', cx - 14 + i * 14, piesY - 48 - fase * 26)
      }
      ctx.globalAlpha = 1
    } else {
      // jaula: marco y barrotes
      const jx = x.x - 8
      const jy = piesY - TILE * 1.9
      const jw = TILE + 16
      const jh = TILE * 1.9
      ctx.strokeStyle = '#495057'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(jx, jy, jw, jh, 6)
      ctx.stroke()
      ctx.lineWidth = 3
      for (let i = 1; i <= 4; i++) {
        const bx = jx + (jw / 5) * i
        ctx.beginPath()
        ctx.moveTo(bx, jy + 2)
        ctx.lineTo(bx, jy + jh - 2)
        ctx.stroke()
      }
    }
  }

  private puertas(level: Level): void {
    const ctx = this.ctx
    for (const d of level.doors) {
      const { x, y, w, h } = d.rect
      if (d.abierta) {
        // Marco abierto: dos postes a los lados
        ctx.fillStyle = '#6d4c2f'
        ctx.fillRect(x - 4, y, 6, h)
        ctx.fillRect(x + w - 2, y, 6, h)
        continue
      }
      // Puerta cerrada: madera con interrogación
      ctx.fillStyle = '#8a5a33'
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 8)
      ctx.fill()
      ctx.strokeStyle = '#6d4c2f'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = '#ffd60a'
      ctx.beginPath()
      ctx.arc(x + w / 2, y + h / 2, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6d4c2f'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', x + w / 2, y + h / 2 + 1)
    }
  }

  private meta(level: Level): void {
    if (level.goal.w === 0) return // el nivel final no tiene bandera
    const ctx = this.ctx
    const g = level.goal
    const baseY = g.y + g.h
    // Mástil
    ctx.fillStyle = '#6d4c2f'
    ctx.fillRect(g.x + 6, g.y - TILE, 5, g.h + TILE)
    // Bandera
    ctx.fillStyle = '#52b788'
    ctx.beginPath()
    ctx.moveTo(g.x + 11, g.y - TILE)
    ctx.lineTo(g.x + 11 + 30, g.y - TILE + 11)
    ctx.lineTo(g.x + 11, g.y - TILE + 22)
    ctx.closePath()
    ctx.fill()
    // Base
    ctx.fillStyle = '#8d99ae'
    ctx.beginPath()
    ctx.roundRect(g.x - 2, baseY - 6, 22, 6, 3)
    ctx.fill()
  }
}
