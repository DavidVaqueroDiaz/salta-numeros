// El Comecubos (jefe final) y Xiana (la hermana a la que hay que salvar).
import { TILE, type Rect } from './level'
import type { Level } from './level'

/** Bola de fuego del jefe: vuela en arco y se apaga al tocar algo. */
export class BolaFuego {
  viva = true
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
  ) {}

  rect(): Rect {
    return { x: this.x - 8, y: this.y - 8, w: 16, h: 16 }
  }

  update(dt: number, level: Level): void {
    this.vy += 620 * dt
    this.x += this.vx * dt
    this.y += this.vy * dt
    const c = Math.floor(this.x / TILE)
    const r = Math.floor(this.y / TILE)
    if (level.esSolido(c, r) || this.y > level.heightPx + 50) this.viva = false
  }
}

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
  readonly bolas: BolaFuego[] = []
  private lanzaT = 2.5
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

  /**
   * @param jugador rect del jugador (para apuntar las bolas de fuego)
   * @param invisible si el jugador es invisible, el jefe no lo ve: no dispara
   */
  update(dt: number, level: Level, jugador?: Rect, invisible = false): void {
    // las bolas siguen volando aunque el jefe haya caído
    for (const b of this.bolas) b.update(dt, level)
    this.bolas.splice(0, this.bolas.length, ...this.bolas.filter((b) => b.viva))

    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    this.invulT = Math.max(0, this.invulT - dt)

    // Bolas de fuego: lanza más rápido cuantos menos corazones le quedan
    if (jugador && !invisible) {
      const distancia = Math.abs(jugador.x + jugador.w / 2 - (this.x + this.w / 2))
      this.lanzaT -= dt
      if (this.lanzaT <= 0 && distancia < 22 * TILE) {
        const haciaIzq = jugador.x < this.x
        this.bolas.push(
          new BolaFuego(
            this.x + this.w / 2,
            this.y + 10,
            (haciaIzq ? -1 : 1) * (150 + Math.random() * 60),
            -250 - Math.random() * 80,
          ),
        )
        this.lanzaT = 2.6 - (3 - this.vidas) * 0.5
      }
    }
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
