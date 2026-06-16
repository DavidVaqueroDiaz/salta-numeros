import type { DoorSpec, LevelData } from '../levels/types'
import {
  Checkpoint,
  CuboVolando,
  Enemigo,
  ItemPoder,
  Moneda,
  Pez,
  PlataformaCaediza,
  PlataformaMovil,
  PlataformaParpadeante,
  Tubo,
  Vigilante,
  type PlataformaPisable,
} from './entities'
import { Jefe, MagoOscuro, Tornado, Xiana, type JefeFinal } from './boss'
import { paramsDificultad } from './dificultad'

export const TILE = 32

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Door {
  /** columna de tiles que ocupa la puerta */
  col: number
  filaTop: number
  filaBottom: number
  rect: Rect
  abierta: boolean
  spec: DoorSpec
}

const SOLIDO = 1
const PINCHO = 2
const AGUA = 3
const HIELO = 4 // sólido pero resbaladizo
const LAVA = 5 // suelo mortal

/** Nivel ya interpretado: rejilla de tiles + entidades (puertas, meta, spawn). */
export class Level {
  readonly cols: number
  readonly rows: number
  readonly widthPx: number
  readonly heightPx: number
  readonly tiles: Uint8Array
  readonly doors: Door[] = []
  readonly spawn = { x: TILE, y: TILE }
  /** w = 0 hasta que el mapa define una 'M' (el nivel final no tiene meta) */
  readonly goal: Rect = { x: 0, y: 0, w: 0, h: TILE * 2 }
  readonly data: LevelData
  readonly monedas: Moneda[] = []
  readonly enemigos: Enemigo[] = []
  readonly moviles: PlataformaMovil[] = []
  readonly caedizas: PlataformaCaediza[] = []
  readonly checkpoints: Checkpoint[] = []
  readonly vigilantes: Vigilante[] = []
  readonly peces: Pez[] = []
  readonly tubos: Tubo[] = []
  readonly items: ItemPoder[] = []
  readonly cubosVolando: CuboVolando[] = []
  readonly parpadeantes: PlataformaParpadeante[] = []
  jefe: JefeFinal | null = null
  xiana: Xiana | null = null

  constructor(data: LevelData) {
    this.data = data
    this.rows = data.mapa.length
    this.cols = Math.max(...data.mapa.map((f) => f.length))
    this.widthPx = this.cols * TILE
    this.heightPx = this.rows * TILE
    this.tiles = new Uint8Array(this.cols * this.rows)

    for (let r = 0; r < this.rows; r++) {
      const fila = data.mapa[r]
      for (let c = 0; c < fila.length; c++) {
        const ch = fila[c]
        if (ch === '#') this.tiles[r * this.cols + c] = SOLIDO
        else if (ch === '^') this.tiles[r * this.cols + c] = PINCHO
        else if (ch === 'P') {
          this.spawn.x = c * TILE + 4
          this.spawn.y = r * TILE
        } else if (ch === 'M') {
          this.goal.x = c * TILE
          this.goal.y = (r - 1) * TILE
          this.goal.w = TILE
          this.goal.h = TILE * 2
        } else if (ch === 'D') {
          this.addDoorTile(c, r, data.puertas)
        } else if (ch === 'o') {
          this.monedas.push(new Moneda(c * TILE + TILE / 2, r * TILE + TILE / 2))
        } else if (ch === 'E') {
          this.enemigos.push(new Enemigo(c, r))
        } else if (ch === 'm') {
          this.moviles.push(new PlataformaMovil(c, r, true))
        } else if (ch === 'w') {
          this.moviles.push(new PlataformaMovil(c, r, false))
        } else if (ch === 'F') {
          this.caedizas.push(new PlataformaCaediza(c, r, this.rows * TILE))
        } else if (ch === 'C') {
          this.checkpoints.push(new Checkpoint(c, r))
        } else if (ch === 'B') {
          this.jefe = new Jefe(c, r)
        } else if (ch === 'Z') {
          this.jefe = new MagoOscuro(c, r) // jefe del Mundo 2
        } else if (ch === 'Y') {
          this.jefe = new Tornado(c, r) // jefe del Mundo 3
        } else if (ch === 'X') {
          this.xiana = new Xiana(c, r)
        } else if (ch === 'V') {
          this.vigilantes.push(new Vigilante(c, r))
        } else if (ch === '~') {
          this.tiles[r * this.cols + c] = AGUA
        } else if (ch === 'f') {
          this.tiles[r * this.cols + c] = AGUA // el pez nada en agua
          this.peces.push(new Pez(c, r))
        } else if (ch === 'T') {
          this.tubos.push(new Tubo(c, r))
        } else if (ch === 'G') {
          this.items.push(new ItemPoder('gafas', c * TILE + 16, r * TILE + 16))
        } else if (ch === 'R') {
          this.items.push(new ItemPoder('arcoiris', c * TILE + 16, r * TILE + 16))
        } else if (ch === 'H') {
          this.items.push(new ItemPoder('sombrero', c * TILE + 16, r * TILE + 16))
        } else if (ch === 'I') {
          this.tiles[r * this.cols + c] = HIELO
        } else if (ch === 'L') {
          this.tiles[r * this.cols + c] = LAVA
        } else if (ch === 'b') {
          this.parpadeantes.push(new PlataformaParpadeante(c, r))
        }
      }
    }

    // Los tubos se emparejan por orden de aparición: 1º↔2º, 3º↔4º…
    for (let i = 0; i + 1 < this.tubos.length; i += 2) {
      this.tubos[i].par = this.tubos[i + 1]
      this.tubos[i + 1].par = this.tubos[i]
    }

    this.generarBichosExtra()
    this.generarItemsEspeciales()
  }

  /**
   * Celdas de suelo firme con dos huecos encima y los lados libres (sitios
   * cómodos para soltar un bicho o un ítem). Una por columna, la más alta.
   */
  private candidatosSuelo(): { c: number; r: number }[] {
    const candidatos: { c: number; r: number }[] = []
    for (let c = 3; c < this.cols - 3; c++) {
      for (let r = 2; r < this.rows - 1; r++) {
        const sueloAbajo = this.tileAt(c, r + 1)
        const firme = sueloAbajo === SOLIDO || sueloAbajo === HIELO
        if (
          firme &&
          this.tileAt(c, r) === 0 &&
          this.tileAt(c, r - 1) === 0 &&
          this.tileAt(c - 1, r) === 0 &&
          this.tileAt(c + 1, r) === 0
        ) {
          candidatos.push({ c, r })
          break
        }
      }
    }
    return candidatos
  }

  /** Columnas ocupadas que conviene esquivar al colocar cosas nuevas. */
  private columnasOcupadas(): number[] {
    return [
      Math.round(this.spawn.x / TILE),
      this.goal.w > 0 ? Math.round(this.goal.x / TILE) : -99,
      ...this.doors.map((d) => d.col),
      ...this.checkpoints.map((ch) => Math.round(ch.x / TILE)),
    ]
  }

  /**
   * En Medio/Difícil añade bichos extra sin tocar los mapas: reparte enemigos
   * por sitios de suelo firme, lejos de la salida, la meta, las puertas y de
   * otros enemigos.
   */
  private generarBichosExtra(): void {
    const factor = paramsDificultad().bichosFactor
    if (factor <= 0) return
    const objetivo = Math.round((this.cols / 10) * factor)
    if (objetivo <= 0) return

    const evitar = [
      ...this.columnasOcupadas(),
      ...this.enemigos.map((e) => Math.round(e.x / TILE)),
      ...this.vigilantes.map((v) => Math.round(v.x / TILE)),
    ]
    const lejos = (c: number): boolean => evitar.every((x) => Math.abs(x - c) >= 3)
    const buenos = this.candidatosSuelo().filter((k) => lejos(k.c))
    if (buenos.length === 0) return

    const paso = Math.max(1, Math.floor(buenos.length / objetivo))
    let puestos = 0
    for (let i = 0; i < buenos.length && puestos < objetivo; i += paso) {
      const { c, r } = buenos[i]
      this.enemigos.push(new Enemigo(c, r))
      puestos++
    }
  }

  /**
   * Ítems de ayuda (en todos los modos, sin tocar los mapas):
   * - una ESTRELLA invencible en las fases pares (2, 4, 6, 8…),
   * - un CUBO de Rubik (arma) en las fases impares,
   * - y varios cubos en la arena del jefe para usarlos contra él.
   */
  private generarItemsEspeciales(): void {
    const n = this.data.numero
    if (n % 2 === 0) this.colocarItem('estrella', 1)
    else this.colocarItem('cubo', 1)
    if (this.jefe) this.colocarItem('cubo', 3)
  }

  /** Coloca `cantidad` ítems del tipo dado en suelo seguro, bien repartidos. */
  private colocarItem(tipo: 'cubo' | 'estrella', cantidad: number): void {
    const evitar = [
      ...this.columnasOcupadas(),
      ...this.items.map((i) => Math.round((i.cx - 16) / TILE)),
    ]
    const lejos = (c: number): boolean => evitar.every((x) => Math.abs(x - c) >= 2)
    const buenos = this.candidatosSuelo().filter((k) => lejos(k.c))
    if (buenos.length === 0) return

    const paso = Math.max(1, Math.floor(buenos.length / cantidad))
    let puestos = 0
    for (let i = 0; i < buenos.length && puestos < cantidad; i += paso) {
      const { c, r } = buenos[i]
      this.items.push(new ItemPoder(tipo, c * TILE + 16, r * TILE + 16))
      puestos++
    }
  }

  /** Agrupa las 'D' contiguas de una misma columna en una sola puerta. */
  private addDoorTile(c: number, r: number, spec: DoorSpec): void {
    const existente = this.doors.find(
      (d) => d.col === c && (r === d.filaTop - 1 || r === d.filaBottom + 1),
    )
    if (existente) {
      existente.filaTop = Math.min(existente.filaTop, r)
      existente.filaBottom = Math.max(existente.filaBottom, r)
      existente.rect.y = existente.filaTop * TILE
      existente.rect.h = (existente.filaBottom - existente.filaTop + 1) * TILE
    } else {
      this.doors.push({
        col: c,
        filaTop: r,
        filaBottom: r,
        rect: { x: c * TILE, y: r * TILE, w: TILE, h: TILE },
        abierta: false,
        spec,
      })
    }
  }

  tileAt(c: number, r: number): number {
    if (c < 0 || c >= this.cols) return SOLIDO // paredes invisibles a los lados
    if (r < 0 || r >= this.rows) return 0
    return this.tiles[r * this.cols + c]
  }

  /** ¿Es sólida la celda (c, r)? Las puertas cerradas también lo son. */
  esSolido(c: number, r: number): boolean {
    const t = this.tileAt(c, r)
    if (t === SOLIDO || t === HIELO) return true
    return this.doors.some(
      (d) => !d.abierta && d.col === c && r >= d.filaTop && r <= d.filaBottom,
    )
  }

  esPincho(c: number, r: number): boolean {
    return this.tileAt(c, r) === PINCHO
  }

  esAgua(c: number, r: number): boolean {
    return this.tileAt(c, r) === AGUA
  }

  esHielo(c: number, r: number): boolean {
    return this.tileAt(c, r) === HIELO
  }

  /** Pinchos o lava: tocarlo manda al respawn. */
  esLetal(c: number, r: number): boolean {
    const t = this.tileAt(c, r)
    return t === PINCHO || t === LAVA
  }

  /** Todo lo pisable desde arriba (móviles + caedizas + parpadeantes). */
  get pisables(): PlataformaPisable[] {
    return [...this.moviles, ...this.caedizas, ...this.parpadeantes]
  }
}

export function seSolapan(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
