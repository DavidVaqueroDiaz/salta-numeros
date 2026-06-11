// El Comecubos (jefe final) y Xiana (la hermana a la que hay que salvar).
import { TILE, type Rect } from './level'
import type { Level } from './level'

export class Jefe {
  readonly w = 60
  readonly h = 54
  x: number
  y: number
  dir: 1 | -1 = -1
  vidas = 3
  vel = 55
  /** tras un pisotón queda un momento intocable (parpadea) */
  invulT = 0
  muerto = false
  squashT = 0
  private readonly minX: number
  private readonly maxX: number

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y = (fila + 1) * TILE - this.h
    // patrulla alrededor de su punto de aparición, sin llegar a la jaula
    this.minX = this.x - 18 * TILE
    this.maxX = this.x + 18 * TILE
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level): void {
    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    this.invulT = Math.max(0, this.invulT - dt)
    const nx = this.x + this.dir * this.vel * dt
    const frente = Math.floor((this.dir > 0 ? nx + this.w : nx) / TILE)
    const filaCuerpo = Math.floor((this.y + this.h / 2) / TILE)
    const filaSuelo = Math.floor((this.y + this.h + 2) / TILE)
    const bloqueado =
      nx < this.minX ||
      nx + this.w > this.maxX ||
      level.esSolido(frente, filaCuerpo) ||
      !level.esSolido(frente, filaSuelo)
    if (bloqueado) this.dir = this.dir === 1 ? -1 : 1
    else this.x = nx
  }

  /** Un reto matemático acertado: pierde un corazón y se enfada (acelera). */
  golpear(): void {
    this.vidas--
    this.vel += 35
    if (this.vidas <= 0) {
      this.muerto = true
      this.squashT = 0.6
    }
  }
}

export class Xiana {
  libre = false
  readonly x: number
  readonly y: number

  constructor(col: number, fila: number) {
    this.x = col * TILE
    this.y = fila * TILE
  }

  rect(): Rect {
    return { x: this.x + 2, y: this.y - TILE, w: TILE - 4, h: TILE * 2 }
  }
}
