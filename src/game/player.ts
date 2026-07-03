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
  /** velocidad horizontal (con inercia solo sobre hielo) */
  private vx = 0
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
  /** segundos restantes de estrella invencible (atropella bichos) */
  estrellaT = 0
  /** segundos restantes girando por el ataque del Remolino (solo visual) */
  girandoT = 0
  /** segundos restantes de "aplastamiento" tras aterrizar fuerte (visual) */
  squashT = 0
  /** true SOLO el frame en que aterriza fuerte (main emite el polvo) */
  aterrizoFuerte = false
  /** impulso externo (trampolín, Remolino): mientras dure no se recorta el salto */
  impulsoT = 0
  /** tras reaparecer, un momento sin recibir daño (evita muertes en cadena) */
  invulnerableT = 0
  /** evita rebotar entre tubos al instante */
  tuboCooldownT = 0
  /** ¿está nadando ahora mismo? (lo rellena update) */
  enAgua = false
  /**
   * Ítems recogidos sin usar: se activan tocando su icono en pantalla.
   * `cubo` cuenta los lanzamientos de cubo de Rubik disponibles (3 por ítem).
   */
  readonly inventario = { gafas: 0, arcoiris: 0, sombrero: 0, cubo: 0, estrella: 0 }

  limpiarPoderes(): void {
    this.invisibleT = 0
    this.volarT = 0
    this.teleUsos = 0
    this.estrellaT = 0
    this.inventario.gafas = 0
    this.inventario.arcoiris = 0
    this.inventario.sombrero = 0
    this.inventario.cubo = 0
    this.inventario.estrella = 0
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

  /** Empuje externo (el Remolino te lanza por los aires). */
  empujar(vx: number, vy: number): void {
    this.vx = vx
    this.vy = vy
    this.enSuelo = false
    this.plataforma = null
    this.girandoT = 0.6
    this.impulsoT = 0.6
  }

  respawn(): void {
    this.x = this.puntoRespawn.x
    this.y = this.puntoRespawn.y
    this.vy = 0
    this.vx = 0
    this.girandoT = 0
    this.invulnerableT = 1.2 // margen para recolocarse sin morir en cadena
    this.enSuelo = false
    this.saltosUsados = 0
    this.plataforma = null
    this.aireT = 99
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  update(dt: number, level: Level): void {
    // para el squash & stretch: ¿venía por el aire y cayendo rápido?
    const estabaEnAire = !this.enSuelo && this.plataforma === null
    this.aterrizoFuerte = false
    this.squashT = Math.max(0, this.squashT - dt)
    // --- Temporizadores de poderes ---
    this.invisibleT = Math.max(0, this.invisibleT - dt)
    this.volarT = Math.max(0, this.volarT - dt)
    this.estrellaT = Math.max(0, this.estrellaT - dt)
    this.girandoT = Math.max(0, this.girandoT - dt)
    this.impulsoT = Math.max(0, this.impulsoT - dt)
    this.invulnerableT = Math.max(0, this.invulnerableT - dt)
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

    // --- Movimiento horizontal (con derrape sobre hielo) ---
    let dir = 0
    if (input.left) dir -= 1
    if (input.right) dir += 1
    if (dir !== 0) this.mirando = dir as 1 | -1

    const sobreHielo =
      this.enSuelo &&
      level.esHielo(
        Math.floor((this.x + this.w / 2) / TILE),
        Math.floor((this.y + this.h + 2) / TILE),
      )
    if (sobreHielo) {
      // patinaje: empujar responde razonable, pero al soltar sigues
      // deslizando un buen trecho (fricción mínima)
      const agarre = dir !== 0 ? 2.0 : 0.8
      this.vx += (dir * VELOCIDAD - this.vx) * Math.min(1, agarre * dt)
    } else if (!this.enSuelo && dir === 0) {
      // en el aire sin pulsar nada conserva un poco de impulso (clave al
      // salir despedido del hielo: no se corta en seco a mitad de salto)
      this.vx *= Math.max(0, 1 - 4 * dt)
    } else {
      this.vx = dir * VELOCIDAD
    }
    this.x += this.vx * dt
    this.resolverHorizontal(level, Math.sign(this.vx))

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
      // (pero NO el de un trampolín o un empujón: ese vuela entero)
      if (!input.jumpHeld && this.vy < -200 && this.impulsoT <= 0) this.vy = -200

      // gravedad lunar en los niveles de espacio: saltos altos y flotantes
      const gravedad = level.data.gravedadBaja ? GRAVEDAD * 0.45 : GRAVEDAD
      const caidaMax = level.data.gravedadBaja ? CAIDA_MAX * 0.6 : CAIDA_MAX
      this.vy = Math.min(this.vy + gravedad * dt, caidaMax)
      // --- Vuelo (arcoíris): mantener el salto empuja hacia arriba ---
      if (this.volarT > 0 && input.jumpHeld) {
        this.vy = Math.max(this.vy - 3400 * dt, -280)
      }
    }
    const vyAntesDeAterrizar = this.vy
    this.y += this.vy * dt
    this.resolverVertical(level)
    // aterrizaje fuerte → aplastamiento breve (y main suelta el polvo)
    if (estabaEnAire && this.enSuelo && vyAntesDeAterrizar > 420) {
      this.squashT = 0.16
      this.aterrizoFuerte = true
    }

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

  /** ¿Está tocando un pincho o lava, o ha caído fuera del mapa? */
  haMuerto(level: Level): boolean {
    if (this.y > level.heightPx + 100) return true
    // rectángulo reducido: solo cuenta si de verdad lo toca
    const m = 6
    const c0 = Math.floor((this.x + m) / TILE)
    const c1 = Math.floor((this.x + this.w - m) / TILE)
    const r0 = Math.floor((this.y + m) / TILE)
    const r1 = Math.floor((this.y + this.h - m) / TILE)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) if (level.esLetal(c, r)) return true
    // pisar lava también quema (los pies están justo encima de la celda)
    const rPies = Math.floor((this.y + this.h + 2) / TILE)
    for (let c = c0; c <= c1; c++)
      if (level.tileAt(c, rPies) === 5 /* LAVA */) return true
    return false
  }
}
