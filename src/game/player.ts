import { consumeJump, input } from '../engine/input'
import { Level, TILE, type Rect } from './level'
import { sonido } from './sound'

const VELOCIDAD = 150 // px/s en horizontal
const GRAVEDAD = 1500
const VEL_SALTO = 580 // alcanza ~3,5 tiles de altura
const CAIDA_MAX = 900
const COYOTE_MS = 100 // margen para saltar justo tras salir de una plataforma

export class Player {
  x = 0
  y = 0
  readonly w = 24
  readonly h = 30
  vy = 0
  mirando: 1 | -1 = 1
  enSuelo = false
  private ultimoSueloAt = 0

  respawn(level: Level): void {
    this.x = level.spawn.x
    this.y = level.spawn.y
    this.vy = 0
    this.enSuelo = false
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level): void {
    // --- Movimiento horizontal ---
    let dir = 0
    if (input.left) dir -= 1
    if (input.right) dir += 1
    if (dir !== 0) this.mirando = dir as 1 | -1

    this.x += dir * VELOCIDAD * dt
    this.resolverHorizontal(level, dir)

    // --- Salto (con buffer + coyote time, para que sea amable con un niño) ---
    const puedeSaltar =
      this.enSuelo || performance.now() - this.ultimoSueloAt < COYOTE_MS
    if (puedeSaltar && consumeJump()) {
      this.vy = -VEL_SALTO
      this.enSuelo = false
      sonido.salto()
    }
    // Salto variable: si suelta el botón mientras sube, corta el impulso
    if (!input.jumpHeld && this.vy < -200) this.vy = -200

    // --- Gravedad y movimiento vertical ---
    this.vy = Math.min(this.vy + GRAVEDAD * dt, CAIDA_MAX)
    this.y += this.vy * dt
    this.resolverVertical(level)
  }

  private celdas(eje: 'x' | 'y'): { c0: number; c1: number; r0: number; r1: number } {
    void eje
    return {
      c0: Math.floor(this.x / TILE),
      c1: Math.floor((this.x + this.w - 0.01) / TILE),
      r0: Math.floor(this.y / TILE),
      r1: Math.floor((this.y + this.h - 0.01) / TILE),
    }
  }

  private resolverHorizontal(level: Level, dir: number): void {
    if (dir === 0) return
    const { c0, c1, r0, r1 } = this.celdas('x')
    for (let r = r0; r <= r1; r++) {
      if (dir > 0 && level.esSolido(c1, r)) {
        this.x = c1 * TILE - this.w - 0.01
      } else if (dir < 0 && level.esSolido(c0, r)) {
        this.x = (c0 + 1) * TILE + 0.01
      }
    }
  }

  private resolverVertical(level: Level): void {
    const { c0, c1, r0, r1 } = this.celdas('y')
    this.enSuelo = false
    for (let c = c0; c <= c1; c++) {
      if (this.vy >= 0 && level.esSolido(c, r1)) {
        this.y = r1 * TILE - this.h - 0.01
        this.vy = 0
        this.enSuelo = true
        this.ultimoSueloAt = performance.now()
      } else if (this.vy < 0 && level.esSolido(c, r0)) {
        this.y = (r0 + 1) * TILE + 0.01
        this.vy = 0
      }
    }
  }

  /** ¿Está tocando un pincho o ha caído fuera del mapa? */
  haMuerto(level: Level): boolean {
    if (this.y > level.heightPx + 100) return true
    // rectángulo reducido: solo cuenta si de verdad toca el pincho
    const m = 6
    const c0 = Math.floor((this.x + m) / TILE)
    const c1 = Math.floor((this.x + this.w - m) / TILE)
    const r0 = Math.floor((this.y + m) / TILE)
    const r1 = Math.floor((this.y + this.h - m) / TILE)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) if (level.esPincho(c, r)) return true
    return false
  }
}
