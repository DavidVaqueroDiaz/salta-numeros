import { consumeJump, input } from '../engine/input'
import { Level, TILE, type Rect } from './level'
import type { PlataformaPisable } from './entities'
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
  /** número de saltos encadenables (2 = doble salto, activo siempre) */
  maxSaltos = 2
  private saltosUsados = 0
  /** segundos (de juego) desde la última vez que pisó algo */
  private aireT = 99
  // --- poderes (se pierden al morir) ---
  /** segundos restantes de invisibilidad (gafas amarillas) */
  invisibleT = 0
  /** segundos restantes de vuelo (mini arcoíris) */
  volarT = 0
  /** usos del teletransporte (sombrero rojo) */
  teleUsos = 0
  /** evita rebotar entre tubos al instante */
  tuboCooldownT = 0
  /** ¿está nadando ahora mismo? (lo rellena update) */
  enAgua = false

  limpiarPoderes(): void {
    this.invisibleT = 0
    this.volarT = 0
    this.teleUsos = 0
  }
  private plataforma: PlataformaPisable | null = null
  private puntoRespawn = { x: 0, y: 0 }

  /** Coloca al jugador al inicio del nivel y fija ahí el respawn. */
  empezar(level: Level): void {
    this.puntoRespawn = { x: level.spawn.x, y: level.spawn.y }
    this.limpiarPoderes()
    this.respawn()
  }

  /** Mueve el respawn (al tocar un punto de control). */
  fijarRespawn(x: number, y: number): void {
    this.puntoRespawn = { x, y }
  }

  respawn(): void {
    this.x = this.puntoRespawn.x
    this.y = this.puntoRespawn.y
    this.vy = 0
    this.enSuelo = false
    this.saltosUsados = 0
    this.plataforma = null
    this.aireT = 99
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level): void {
    // --- Temporizadores de poderes ---
    this.invisibleT = Math.max(0, this.invisibleT - dt)
    this.volarT = Math.max(0, this.volarT - dt)
    this.tuboCooldownT = Math.max(0, this.tuboCooldownT - dt)
    this.enAgua = level.esAgua(
      Math.floor((this.x + this.w / 2) / TILE),
      Math.floor((this.y + this.h / 2) / TILE),
    )

    // --- Arrastre de la plataforma sobre la que está subido ---
    if (this.plataforma) {
      const p = this.plataforma
      const sigueEncima =
        p.activa() &&
        this.x + this.w > p.x &&
        this.x < p.x + p.w &&
        Math.abs(this.y + this.h - p.y) < 12
      if (sigueEncima) {
        this.x += p.dxUlt
        if (p.dyUlt !== 0) this.y = p.y - this.h - 0.01
      } else {
        this.plataforma = null
      }
    }
    this.aireT += dt
    if (this.enSuelo || this.plataforma) this.aireT = 0

    // --- Movimiento horizontal ---
    let dir = 0
    if (input.left) dir -= 1
    if (input.right) dir += 1
    if (dir !== 0) this.mirando = dir as 1 | -1

    this.x += dir * VELOCIDAD * dt
    this.resolverHorizontal(level, dir)

    const pies0 = this.y + this.h
    if (this.enAgua) {
      // --- Buceo: cada toque de salto es un braceo, sin límite ---
      if (consumeJump()) {
        this.vy = -230
        sonido.salto()
      }
      this.vy = Math.min(this.vy + 420 * dt, 200)
      if (this.vy < -260) this.vy = -260
      this.saltosUsados = 0
    } else {
      // --- Salto: buffer + coyote + doble salto ---
      const sobreAlgo = this.enSuelo || this.plataforma !== null
      const conCoyote = sobreAlgo || this.aireT < COYOTE_MS / 1000
      const dobleDisponible = this.maxSaltos > 1 && this.saltosUsados < this.maxSaltos
      if ((conCoyote || dobleDisponible) && consumeJump()) {
        this.vy = -VEL_SALTO
        this.enSuelo = false
        this.plataforma = null
        // En el aire, el salto extra siempre cuenta como el último disponible
        this.saltosUsados = conCoyote ? 1 : Math.max(this.saltosUsados + 1, this.maxSaltos)
        this.aireT = 99 // que el coyote no regale un tercer salto justo tras despegar
        sonido.salto()
      }
      // Salto variable: si suelta el botón mientras sube, corta el impulso
      if (!input.jumpHeld && this.vy < -200) this.vy = -200

      this.vy = Math.min(this.vy + GRAVEDAD * dt, CAIDA_MAX)
      // --- Vuelo (arcoíris): mantener el salto empuja hacia arriba ---
      if (this.volarT > 0 && input.jumpHeld) {
        this.vy = Math.max(this.vy - 3400 * dt, -280)
      }
    }
    this.y += this.vy * dt
    this.resolverVertical(level)

    // --- Aterrizar sobre plataformas (solo cayendo y desde arriba) ---
    if (this.vy >= 0 && !this.enSuelo) {
      for (const p of level.pisables) {
        if (!p.activa()) continue
        const pies1 = this.y + this.h
        const solapaX = this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2
        if (solapaX && pies0 <= p.y + 6 && pies1 >= p.y) {
          this.y = p.y - this.h - 0.01
          this.vy = 0
          this.enSuelo = true
          this.saltosUsados = 0
          this.plataforma = p
          this.aireT = 0
          p.alPisar?.()
          break
        }
      }
    }
  }

  private celdas(): { c0: number; c1: number; r0: number; r1: number } {
    return {
      c0: Math.floor(this.x / TILE),
      c1: Math.floor((this.x + this.w - 0.01) / TILE),
      r0: Math.floor(this.y / TILE),
      r1: Math.floor((this.y + this.h - 0.01) / TILE),
    }
  }

  private resolverHorizontal(level: Level, dir: number): void {
    if (dir === 0) return
    const { c0, c1, r0, r1 } = this.celdas()
    for (let r = r0; r <= r1; r++) {
      if (dir > 0 && level.esSolido(c1, r)) {
        this.x = c1 * TILE - this.w - 0.01
      } else if (dir < 0 && level.esSolido(c0, r)) {
        this.x = (c0 + 1) * TILE + 0.01
      }
    }
  }

  private resolverVertical(level: Level): void {
    const { c0, c1, r0, r1 } = this.celdas()
    this.enSuelo = false
    for (let c = c0; c <= c1; c++) {
      if (this.vy >= 0 && level.esSolido(c, r1)) {
        this.y = r1 * TILE - this.h - 0.01
        this.vy = 0
        this.enSuelo = true
        this.saltosUsados = 0
        this.plataforma = null
        this.aireT = 0
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
