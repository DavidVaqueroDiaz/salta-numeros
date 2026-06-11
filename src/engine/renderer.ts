import { Level, TILE } from '../game/level'
import { Player } from '../game/player'
import { dibujarPersonaje } from './character'

/** Filas visibles en pantalla; los niveles más altos usan cámara vertical. */
const FILAS_VISTA = 11

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

  draw(level: Level, player: Player): void {
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
    this.enemigosDibujo(level)
    this.vigilantesDibujo(level, player)
    this.pecesDibujo(level)
    this.jefeDibujo(level)
    this.xianaDibujo(level)
    this.meta(level)
    this.personajeConEfectos(level, player)
  }

  private personajeConEfectos(level: Level, player: Player): void {
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
    // invisible: se ve translúcido (el jugador sí se ve a sí mismo)
    if (player.invisibleT > 0) ctx.globalAlpha = 0.35
    dibujarPersonaje(
      ctx,
      level.data.numero,
      player.x + player.w / 2,
      player.y + player.h,
      player.mirando,
    )
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
      } else {
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
      }
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

  private fondo(level: Level): void {
    const ctx = this.ctx
    const g = ctx.createLinearGradient(0, 0, 0, this.viewH)
    g.addColorStop(0, '#7dd3f8')
    g.addColorStop(1, '#d9f4ff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.viewW, this.viewH)

    // Sol
    ctx.fillStyle = '#ffd60a'
    ctx.beginPath()
    ctx.arc(this.viewW - 70, 60, 34, 0, Math.PI * 2)
    ctx.fill()

    // Nubes en posiciones fijas (deterministas por nivel)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 5; i++) {
      const x = ((i * 397 + level.data.numero * 131) % Math.max(level.widthPx, 1)) % this.viewW
      const y = 40 + ((i * 67) % 80)
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, Math.PI * 2)
      ctx.arc(x + 22, y + 4, 14, 0, Math.PI * 2)
      ctx.arc(x - 20, y + 6, 13, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private tiles(level: Level, cam: number, camY: number): void {
    const ctx = this.ctx
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
          // Bloque de tierra con borde redondeado
          ctx.fillStyle = '#b07d4f'
          ctx.beginPath()
          ctx.roundRect(x, y, TILE, TILE, 4)
          ctx.fill()
          ctx.fillStyle = '#94633a'
          ctx.fillRect(x + 4, y + 10, 6, 5)
          ctx.fillRect(x + 18, y + 20, 7, 5)
          // Césped si arriba está despejado
          if (level.tileAt(c, r - 1) !== 1) {
            ctx.fillStyle = '#67c26b'
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
            // superficie con olitas
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.fillRect(x, y, TILE, 3)
          }
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

  /** El Comecubos: bloque gigante enfadado con corazones de vida encima. */
  private jefeDibujo(level: Level): void {
    const j = level.jefe
    if (!j) return
    const ctx = this.ctx
    // bolas de fuego
    for (const b of j.bolas) {
      ctx.fillStyle = '#f3722c'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffd60a'
      ctx.beginPath()
      ctx.arc(b.x - b.vx * 0.01, b.y - b.vy * 0.01, 4.5, 0, Math.PI * 2)
      ctx.fill()
    }
    if (j.muerto && j.squashT <= 0) return
    const aplaste = j.muerto ? Math.max(0.15, j.squashT / 0.6) : 1
    const h = j.h * aplaste
    const y = j.y + j.h - h

    // parpadeo mientras es invulnerable
    if (j.invulT > 0 && Math.sin(performance.now() / 40) > 0) ctx.globalAlpha = 0.45

    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.roundRect(j.x, y, j.w, h, 10)
    ctx.fill()
    ctx.strokeStyle = '#3c096c'
    ctx.lineWidth = 3
    ctx.stroke()
    // dientes en la base (¡come cubos!)
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

    if (!j.muerto) {
      // ojos enfadados con cejas
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
      // corazones de vida
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < j.vidas; i++) {
        ctx.fillText('❤️', j.x + j.w / 2 + (i - (j.vidas - 1) / 2) * 20, y - 16)
      }
    }
    ctx.globalAlpha = 1
  }

  /** Xiana: niña rubia con coletas. Enjaulada hasta vencer al jefe. */
  private xianaDibujo(level: Level): void {
    const x = level.xiana
    if (!x) return
    const ctx = this.ctx
    const t = performance.now() / 1000
    const cx = x.x + TILE / 2
    const piesY = x.y + TILE
    const salto = x.libre ? Math.abs(Math.sin(t * 6)) * 6 : 0
    const base = piesY - salto

    // piernas
    ctx.strokeStyle = '#e8b88a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(cx + lado * 4, base - 10)
      ctx.lineTo(cx + lado * 4, base)
      ctx.stroke()
    }
    // vestido rosa
    ctx.fillStyle = '#ff5d8f'
    ctx.beginPath()
    ctx.moveTo(cx, base - 30)
    ctx.lineTo(cx + 11, base - 9)
    ctx.lineTo(cx - 11, base - 9)
    ctx.closePath()
    ctx.fill()
    // brazos
    ctx.strokeStyle = '#e8b88a'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(cx + lado * 5, base - 24)
      // libre: brazos arriba celebrando; enjaulada: brazos abajo
      ctx.lineTo(cx + lado * 10, base - (x.libre ? 32 : 18))
      ctx.stroke()
    }
    // cabeza
    ctx.fillStyle = '#ffe0bd'
    ctx.beginPath()
    ctx.arc(cx, base - 36, 8, 0, Math.PI * 2)
    ctx.fill()
    // pelo rubio con coletas
    ctx.fillStyle = '#ffd60a'
    ctx.beginPath()
    ctx.arc(cx, base - 38, 8.5, Math.PI, 2 * Math.PI)
    ctx.fill()
    ctx.fillRect(cx - 8.5, base - 38, 17, 3)
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(cx + lado * 10, base - 34, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    // carita
    ctx.fillStyle = '#1d3557'
    for (const lado of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(cx + lado * 3, base - 36, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#1d3557'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(cx, base - 33, 2.6, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()

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
