// Entidades del mundo: monedas, enemigos, plataformas móviles/caedizas y
// puntos de control. Se crean desde caracteres del mapa ASCII (ver types.ts).
import { TILE, type Rect } from './level'
import type { Level } from './level'

/** Cosas sobre las que se puede aterrizar (solo desde arriba). */
export interface PlataformaPisable {
  x: number
  y: number
  w: number
  h: number
  /** cuánto se ha movido en el último frame (para arrastrar al jugador) */
  dxUlt: number
  dyUlt: number
  activa(): boolean
  alPisar?(): void
}

export class Moneda {
  recogida = false
  constructor(
    public readonly cx: number,
    public readonly cy: number,
  ) {}

  rect(): Rect {
    return { x: this.cx - 10, y: this.cy - 10, w: 20, h: 20 }
  }
}

export class Enemigo {
  readonly w = 26
  readonly h = 20
  x: number
  y: number
  dir: 1 | -1 = -1
  muerto = false
  squashT = 0
  private readonly vel = 45

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y = (fila + 1) * TILE - this.h
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level): void {
    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    const nx = this.x + this.dir * this.vel * dt
    const frente = Math.floor((this.dir > 0 ? nx + this.w : nx) / TILE)
    const filaCuerpo = Math.floor((this.y + this.h / 2) / TILE)
    const filaSuelo = Math.floor((this.y + this.h + 2) / TILE)
    // Da la vuelta si hay pared delante o si se acaba el suelo
    if (level.esSolido(frente, filaCuerpo) || !level.esSolido(frente, filaSuelo)) {
      this.dir = this.dir === 1 ? -1 : 1
    } else {
      this.x = nx
    }
  }
}

export class PlataformaMovil implements PlataformaPisable {
  readonly w = TILE * 3
  readonly h = 14
  x: number
  y: number
  dxUlt = 0
  dyUlt = 0
  private t = 0
  private readonly cx: number
  private readonly cy: number

  constructor(
    col: number,
    fila: number,
    private readonly horizontal: boolean,
  ) {
    this.cx = col * TILE + TILE / 2 - this.w / 2
    this.cy = fila * TILE + TILE - this.h
    this.x = this.cx
    this.y = this.cy
  }

  activa(): boolean {
    return true
  }

  update(dt: number): void {
    this.t += dt
    const onda = Math.sin(this.t * 1.6)
    const px = this.x
    const py = this.y
    if (this.horizontal) this.x = this.cx + onda * TILE * 2
    else this.y = this.cy + onda * TILE * 1.5
    this.dxUlt = this.x - px
    this.dyUlt = this.y - py
  }
}

export class PlataformaCaediza implements PlataformaPisable {
  readonly w = TILE
  readonly h = 12
  x: number
  y: number
  dxUlt = 0
  dyUlt = 0
  estado: 'quieta' | 'temblando' | 'cayendo' | 'ida' = 'quieta'
  temblor = 0
  private timer = 0
  private vy = 0
  private readonly x0: number
  private readonly y0: number

  constructor(col: number, fila: number, private readonly limiteY: number) {
    this.x0 = col * TILE
    this.y0 = fila * TILE + TILE - this.h
    this.x = this.x0
    this.y = this.y0
  }

  activa(): boolean {
    return this.estado !== 'ida'
  }

  alPisar(): void {
    if (this.estado === 'quieta') {
      this.estado = 'temblando'
      this.timer = 0.45
    }
  }

  update(dt: number): void {
    this.dxUlt = 0
    this.dyUlt = 0
    if (this.estado === 'temblando') {
      this.temblor += dt
      this.timer -= dt
      if (this.timer <= 0) this.estado = 'cayendo'
    } else if (this.estado === 'cayendo') {
      const py = this.y
      this.vy = Math.min(this.vy + 900 * dt, 320)
      this.y += this.vy * dt
      this.dyUlt = this.y - py
      if (this.y > this.limiteY + 60) this.estado = 'ida'
    }
  }

  /** Vuelve a su sitio (cuando el jugador muere, para poder reintentar). */
  reset(): void {
    this.x = this.x0
    this.y = this.y0
    this.vy = 0
    this.temblor = 0
    this.estado = 'quieta'
  }
}

export class Checkpoint {
  activado = false
  readonly x: number
  readonly y: number

  constructor(col: number, fila: number) {
    this.x = col * TILE
    this.y = fila * TILE
  }

  rect(): Rect {
    return { x: this.x, y: this.y - TILE, w: TILE, h: TILE * 2 }
  }
}
