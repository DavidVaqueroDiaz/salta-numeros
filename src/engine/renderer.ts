import { Level, TILE } from '../game/level'
import { Player } from '../game/player'

/**
 * Forma del personaje según su número, estilo bloques apilados.
 * Cada par es [columna, fila] contando la fila 0 desde abajo.
 */
const FORMAS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[0, 0], [0, 1]],
  3: [[0, 0], [0, 1], [0, 2]],
  4: [[0, 0], [1, 0], [0, 1], [1, 1]],
  5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  6: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]],
  7: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]],
  8: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3]],
  9: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  10: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4], [1, 4]],
}

function oscurecer(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * factor)
  const g = Math.round(((n >> 8) & 255) * factor)
  const b = Math.round((n & 255) * factor)
  return `rgb(${r},${g},${b})`
}

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

  /** Cámara: sigue al jugador sin salirse del nivel. */
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
    this.personaje(player, level.data.numero, level.data.color)
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
        ctx.fillText('✓', c.x + 16, baseY - TILE * 1.6 + 1)
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

  /** Dibuja el personaje: torre de bloques con ojos, sonrisa y su número. */
  private personaje(p: Player, numero: number, color: string): void {
    const ctx = this.ctx
    const forma = FORMAS[numero] ?? FORMAS[1]
    const colsF = Math.max(...forma.map(([c]) => c)) + 1
    const rowsF = Math.max(...forma.map(([, r]) => r)) + 1

    // Tamaño de cada bloque para que el dibujo quepa sobre la hitbox
    const targetW = 34
    const targetH = 42
    const bs = Math.min(targetW / colsF, targetH / rowsF)
    const totalW = colsF * bs
    const totalH = rowsF * bs
    const baseX = p.x + p.w / 2 - totalW / 2
    const baseY = p.y + p.h // los pies

    const borde = oscurecer(color, 0.72)

    for (const [c, r] of forma) {
      const bx = baseX + c * bs
      const by = baseY - (r + 1) * bs
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(bx + 0.5, by + 0.5, bs - 1, bs - 1, 3)
      ctx.fill()
      ctx.strokeStyle = borde
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Ojos en el bloque superior, mirando hacia donde camina
    const topRow = rowsF - 1
    const topBlocks = forma.filter(([, r]) => r === topRow)
    const cxTop =
      baseX + (Math.min(...topBlocks.map(([c]) => c)) + Math.max(...topBlocks.map(([c]) => c)) + 1) * bs / 2
    const cyTop = baseY - rowsF * bs + bs * 0.45
    const sep = Math.max(5, bs * 0.22)
    const mirada = p.mirando * 1.4

    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cxTop + lado * sep, cyTop, Math.max(3.4, bs * 0.16), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(cxTop + lado * sep + mirada, cyTop, Math.max(1.7, bs * 0.08), 0, Math.PI * 2)
      ctx.fill()
    }

    // Sonrisa
    ctx.strokeStyle = '#1d3557'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(cxTop, cyTop + bs * 0.18, Math.max(3, bs * 0.14), 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()

    // Número en una placa blanca en el centro del cuerpo
    const cxBody = baseX + totalW / 2
    const cyBody = baseY - totalH * 0.3
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.beginPath()
    ctx.arc(cxBody, cyBody, Math.min(9, totalW * 0.26), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = oscurecer(color, 0.6)
    ctx.font = `bold ${Math.min(13, totalW * 0.38)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(numero), cxBody, cyBody + 1)
  }
}
