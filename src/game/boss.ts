// El Comecubos (jefe del Mundo 1), el Mago Oscuro (jefe del Mundo 2) y Xiana
// (la hermana a la que hay que salvar en ambos finales).
import { TILE, type Rect } from './level'
import type { Level } from './level'
import { paramsDificultad } from './dificultad'
import { Enemigo } from './entities'

/** Jefe final, cualquiera de los cuatro (comparten interfaz para main/renderer). */
export type JefeFinal = Jefe | MagoOscuro | Tornado | Kraken

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
  readonly tipo = 'comecubos'
  readonly w = 60
  readonly h = 54
  x: number
  y: number
  dir: 1 | -1 = -1
  vidas: number
  vel = 55
  /** tras un pisotón queda un momento intocable (parpadea) */
  invulT = 0
  muerto = false
  squashT = 0
  vy = 0
  /** parpadeo breve al teletransportarse (para dibujarlo desvanecido) */
  teleFlash = 0
  readonly bolas: BolaFuego[] = []
  private lanzaT = 2.5
  private saltoT: number
  private teleT: number
  private readonly minX: number
  private readonly maxX: number

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y = (fila + 1) * TILE - this.h
    // patrulla alrededor de su punto de aparición, sin llegar a la jaula
    this.minX = this.x - 18 * TILE
    this.maxX = this.x + 18 * TILE
    const p = paramsDificultad()
    this.saltoT = p.jefeSaltoCada
    this.teleT = p.jefeTeleCada
    this.vidas = p.jefeVidas
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
    const p = paramsDificultad()
    this.teleFlash = Math.max(0, this.teleFlash - dt)

    // Movimiento vertical: solo si el jefe es ágil (en Fácil ni salta ni cae).
    if (p.jefeAgil) {
      this.vy += 1500 * dt
      this.y += this.vy * dt
      const fPies = Math.floor((this.y + this.h) / TILE)
      const aIzq = Math.floor((this.x + 6) / TILE)
      const aDer = Math.floor((this.x + this.w - 6) / TILE)
      if (this.vy >= 0 && (level.esSolido(aIzq, fPies) || level.esSolido(aDer, fPies))) {
        this.y = fPies * TILE - this.h
        this.vy = 0
      }

      // Salta cada cierto tiempo, pero solo si tiene los pies en el suelo.
      this.saltoT -= dt
      if (this.saltoT <= 0 && this.vy === 0) {
        this.vy = -560
        this.saltoT = p.jefeSaltoCada
      }

      // Se teletransporta a otro punto de su zona (con suelo y hueco).
      this.teleT -= dt
      if (this.teleT <= 0) {
        this.teleT = p.jefeTeleCada
        const destino = this.buscarHueco(level)
        if (destino) {
          this.x = destino.x
          this.y = destino.y
          this.vy = 0
          this.teleFlash = 0.35
        }
      }
    }

    // Patrulla horizontal (más rápida según el modo).
    const enAire = p.jefeAgil && this.vy !== 0
    const nx = this.x + this.dir * this.vel * p.velMul * dt
    const frente = Math.floor((this.dir > 0 ? nx + this.w : nx) / TILE)
    const filaCuerpo = Math.floor((this.y + this.h / 2) / TILE)
    const filaSuelo = Math.floor((this.y + this.h + 2) / TILE)
    const bloqueado =
      nx < this.minX ||
      nx + this.w > this.maxX ||
      level.esSolido(frente, filaCuerpo) ||
      (!enAire && !level.esSolido(frente, filaSuelo)) // en el aire no le frena el borde
    if (bloqueado) this.dir = this.dir === 1 ? -1 : 1
    else this.x = nx
  }

  /** Busca una columna de su zona con suelo firme y dos huecos encima. */
  private buscarHueco(level: Level): { x: number; y: number } | null {
    const cMin = Math.max(1, Math.floor(this.minX / TILE))
    const cMax = Math.min(level.cols - 2, Math.floor(this.maxX / TILE))
    for (let intento = 0; intento < 12; intento++) {
      const c = cMin + Math.floor(Math.random() * (cMax - cMin + 1))
      for (let r = 2; r < level.rows - 1; r++) {
        if (level.esSolido(c, r + 1) && !level.esSolido(c, r) && !level.esSolido(c, r - 1)) {
          return { x: c * TILE + (TILE - this.w) / 2, y: (r + 1) * TILE - this.h }
        }
      }
    }
    return null
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

/** Rayo mágico del Mago Oscuro: vuela en línea recta hacia donde estabas. */
export class RayoMagico {
  viva = true
  private t = 0
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
  ) {}

  rect(): Rect {
    return { x: this.x - 9, y: this.y - 9, w: 18, h: 18 }
  }

  update(dt: number, level: Level): void {
    this.t += dt
    this.x += this.vx * dt
    this.y += this.vy * dt
    const c = Math.floor(this.x / TILE)
    const r = Math.floor(this.y / TILE)
    if (level.esSolido(c, r) || this.t > 4 || this.x < 0 || this.x > level.widthPx) {
      this.viva = false
    }
  }
}

/**
 * El Mago Oscuro (jefe del Mundo 2): se teletransporta sin parar, invoca bichos
 * y lanza rayos mágicos hacia el jugador. Pisotón (o cubo de Rubik) → pierde un
 * corazón. Comparte interfaz con el Comecubos para main.ts y el renderer.
 */
export class MagoOscuro {
  readonly tipo = 'mago'
  readonly w = 78
  readonly h = 100
  x: number
  y: number
  dir: 1 | -1 = -1
  vidas: number
  vel = 0
  invulT = 0
  muerto = false
  squashT = 0
  /** parpadeo breve al teletransportarse */
  teleFlash = 0
  readonly bolas: RayoMagico[] = []
  private lanzaT = 1.8
  private teleT = 2.4
  private invocaT = 5
  private readonly minX: number
  private readonly maxX: number

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y = (fila + 1) * TILE - this.h
    this.minX = this.x - 18 * TILE
    this.maxX = this.x + 18 * TILE
    this.vidas = paramsDificultad().jefeVidas
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level, jugador?: Rect, invisible = false): void {
    for (const b of this.bolas) b.update(dt, level)
    this.bolas.splice(0, this.bolas.length, ...this.bolas.filter((b) => b.viva))

    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    this.invulT = Math.max(0, this.invulT - dt)
    this.teleFlash = Math.max(0, this.teleFlash - dt)
    if (!jugador || invisible) return // invisible: el mago no te ve ni ataca

    // mira al jugador
    this.dir = jugador.x + jugador.w / 2 < this.x + this.w / 2 ? -1 : 1

    // lanza rayos rectos hacia el jugador (más a menudo con menos corazones)
    this.lanzaT -= dt
    if (this.lanzaT <= 0) {
      this.lanzaT = 1.7 - Math.max(0, (3 - this.vidas)) * 0.2
      const cx = this.x + this.w / 2
      const cy = this.y + this.h / 2
      const dx = jugador.x + jugador.w / 2 - cx
      const dy = jugador.y + jugador.h / 2 - cy
      const dist = Math.hypot(dx, dy) || 1
      const v = 240
      this.bolas.push(new RayoMagico(cx, cy, (dx / dist) * v, (dy / dist) * v))
    }

    // se teletransporta por su zona
    this.teleT -= dt
    if (this.teleT <= 0) {
      this.teleT = 2.6
      const destino = this.buscarSitio(level)
      if (destino) {
        this.x = destino.x
        this.y = destino.y
        this.teleFlash = 0.4
      }
    }

    // invoca bichos (con tope para no saturar la arena)
    this.invocaT -= dt
    if (this.invocaT <= 0) {
      this.invocaT = 6
      if (level.enemigos.filter((e) => !e.muerto).length < 5) {
        const col = Math.max(2, Math.min(level.cols - 3, Math.floor(this.x / TILE)))
        level.enemigos.push(new Enemigo(col, level.rows - 2))
      }
    }
  }

  /** Un punto al azar de su zona con suelo firme (reaparece apoyado). */
  private buscarSitio(level: Level): { x: number; y: number } | null {
    const cMin = Math.max(2, Math.floor(this.minX / TILE))
    const cMax = Math.min(level.cols - 3, Math.floor(this.maxX / TILE))
    for (let intento = 0; intento < 12; intento++) {
      const c = cMin + Math.floor(Math.random() * (cMax - cMin + 1))
      for (let r = 2; r < level.rows - 1; r++) {
        if (level.esSolido(c, r + 1) && !level.esSolido(c, r) && !level.esSolido(c, r - 1)) {
          return { x: c * TILE + (TILE - this.w) / 2, y: (r + 1) * TILE - this.h }
        }
      }
    }
    return null
  }

  /** Pierde un corazón (pisotón acertado o cubo de Rubik). */
  golpear(): void {
    this.vidas--
    if (this.vidas <= 0) {
      this.muerto = true
      this.squashT = 0.6
    }
  }
}

/**
 * El Remolino (jefe del Mundo 3): un tornado que flota en una arena aérea y
 * persigue al jugador. Su ataque, al tocarte, te hace GIRAR y te lanza por los
 * aires (lo aplica main.ts con player.empujar) — el peligro es caer a la lava.
 * Para dañarlo hay que subir por las plataformas y caerle ENCIMA (pisotón) o
 * darle con un cubo de Rubik. No lanza proyectiles.
 */
export class Tornado {
  readonly tipo = 'tornado'
  readonly w = 56
  readonly h = 96
  x: number
  y: number
  dir: 1 | -1 = -1
  vidas: number
  vel = 0
  invulT = 0
  muerto = false
  squashT = 0
  /** giro para dibujar el remolino */
  giro = 0
  /** cooldown del ataque de empuje (lo gestiona main.ts) */
  flingT = 0
  readonly bolas: never[] = [] // no dispara
  private readonly y0: number
  private readonly minX: number
  private readonly maxX: number

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y0 = (fila + 1) * TILE - this.h
    this.y = this.y0
    this.minX = this.x - 16 * TILE
    this.maxX = this.x + 16 * TILE
    this.vidas = paramsDificultad().jefeVidas
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, _level: Level, jugador?: Rect, invisible = false): void {
    this.giro += dt * 8
    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    this.invulT = Math.max(0, this.invulT - dt)
    this.flingT = Math.max(0, this.flingT - dt)
    // flota con un leve vaivén vertical
    this.y = this.y0 + Math.sin(this.giro) * 8
    if (!jugador || invisible) return // invisible: no te ve
    // se desplaza despacio hacia el jugador (te persigue por el aire)
    this.dir = jugador.x + jugador.w / 2 < this.x + this.w / 2 ? -1 : 1
    const mul = paramsDificultad().velMul
    const nx = this.x + this.dir * 60 * mul * dt
    if (nx > this.minX && nx + this.w < this.maxX) this.x = nx
  }

  /** Pierde un corazón (pisotón acertado o cubo de Rubik). */
  golpear(): void {
    this.vidas--
    if (this.vidas <= 0) {
      this.muerto = true
      this.squashT = 0.6
    }
  }
}

/** Burbuja del Kraken: SUBE desde el fondo buscando al jugador, meciéndose. */
export class Burbuja {
  viva = true
  private t = 0
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
  ) {}

  rect(): Rect {
    return { x: this.x - 9, y: this.y - 9, w: 18, h: 18 }
  }

  update(dt: number, level: Level): void {
    this.t += dt
    this.x += (this.vx + Math.sin(this.t * 6) * 30) * dt
    this.y += this.vy * dt
    const c = Math.floor(this.x / TILE)
    const r = Math.floor(this.y / TILE)
    if (level.esSolido(c, r) || this.y < -40 || this.t > 6) this.viva = false
  }
}

/**
 * El Kraken (jefe del Mundo 4): pulpo gigante que patrulla el fondo del mar y
 * lanza burbujas que SUBEN hacia el jugador. Pisotón buceando hacia abajo →
 * reto de mates; el cubo de Rubik también le quita un corazón.
 */
export class Kraken {
  readonly tipo = 'kraken'
  readonly w = 88
  readonly h = 68
  x: number
  y: number
  dir: 1 | -1 = -1
  vidas: number
  vel = 45
  invulT = 0
  muerto = false
  squashT = 0
  /** fase para animar los tentáculos */
  giro = 0
  readonly bolas: Burbuja[] = []
  private lanzaT = 2.2
  private readonly minX: number
  private readonly maxX: number

  constructor(col: number, fila: number) {
    this.x = col * TILE + (TILE - this.w) / 2
    this.y = (fila + 1) * TILE - this.h
    this.minX = this.x - 14 * TILE
    this.maxX = this.x + 14 * TILE
    this.vidas = paramsDificultad().jefeVidas
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level, jugador?: Rect, invisible = false): void {
    for (const b of this.bolas) b.update(dt, level)
    this.bolas.splice(0, this.bolas.length, ...this.bolas.filter((b) => b.viva))
    this.giro += dt * 3
    if (this.muerto) {
      this.squashT = Math.max(0, this.squashT - dt)
      return
    }
    this.invulT = Math.max(0, this.invulT - dt)

    // burbujas hacia el jugador (más seguidas con menos corazones)
    if (jugador && !invisible) {
      this.lanzaT -= dt
      const distancia = Math.abs(jugador.x + jugador.w / 2 - (this.x + this.w / 2))
      if (this.lanzaT <= 0 && distancia < 20 * TILE) {
        const haciaIzq = jugador.x + jugador.w / 2 < this.x + this.w / 2
        this.bolas.push(
          new Burbuja(
            this.x + this.w / 2,
            this.y + 8,
            (haciaIzq ? -1 : 1) * (40 + Math.random() * 50),
            -110 - Math.random() * 60,
          ),
        )
        this.lanzaT = 2.3 - Math.max(0, 3 - this.vidas) * 0.35
      }
    }

    // patrulla el lecho marino sin caerse por los bordes
    const mul = paramsDificultad().velMul
    const nx = this.x + this.dir * this.vel * mul * dt
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

  /** Pierde un corazón (pisotón buceando o cubo de Rubik). */
  golpear(): void {
    this.vidas--
    this.vel += 25
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
