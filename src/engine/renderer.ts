import { Level, TILE } from '../game/level'
import { Player } from '../game/player'
import { dibujarPersonaje } from './character'

export class Renderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private scale = 1
  private rows = 11
  viewW = 0
  private viewH = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  setRows(rows: number): void {
    this.rows = rows
    this.resize()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
    // Escala para que el alto del nivel llene la pantalla
    this.scale = this.canvas.height / (this.rows * TILE)
    this.viewW = this.canvas.width / this.scale
    this.viewH = this.canvas.height / this.scale
  }

  /** CÃ¡mara: sigue al jugador sin salirse del nivel. */
  camX(level: Level, player: Player): number {
    const objetivo = player.x + player.w / 2 - this.viewW / 2
    return Math.max(0, Math.min(objetivo, level.widthPx - this.viewW))
  }

  draw(level: Level, player: Player): void {
    const ctx = this.ctx
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)

    this.fondo(level)

    const cam = this.camX(level, player)
    ctx.translate(-cam, 0)

    this.tiles(level, cam)
    this.plataformas(level)
    this.checkpointsDibujo(level)
    this.puertas(level)
    this.monedasDibujo(level)
    this.enemigosDibujo(level)
    this.meta(level)
    dibujarPersonaje(
      this.ctx,
      level.data.numero,
      player.x + player.w / 2,
      player.y + player.h,
      player.mirando,
    )
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
        ctx.fillText('âœ“', c.x + 16, baseY - TILE * 1.6 + 1)
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

  private tiles(level: Level, cam: number): void {
    const ctx = this.ctx
    const c0 = Math.max(0, Math.floor(cam / TILE))
    const c1 = Math.min(level.cols - 1, Math.ceil((cam + this.viewW) / TILE))

    for (let r = 0; r < level.rows; r++) {
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
          // CÃ©sped si arriba estÃ¡ despejado
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
        }
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
      // Puerta cerrada: madera con interrogaciÃ³n
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
    const ctx = this.ctx
    const g = level.goal
    const baseY = g.y + g.h
    // MÃ¡stil
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
