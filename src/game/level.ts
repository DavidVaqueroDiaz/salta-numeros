import type { DoorSpec, LevelData } from '../levels/types'
import {
  Checkpoint,
  Enemigo,
  Moneda,
  PlataformaCaediza,
  PlataformaMovil,
  type PlataformaPisable,
} from './entities'
import { Jefe, Xiana } from './boss'

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
  jefe: Jefe | null = null
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
        } else if (ch === 'X') {
          this.xiana = new Xiana(c, r)
        }
      }
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
    if (this.tileAt(c, r) === SOLIDO) return true
    return this.doors.some(
      (d) => !d.abierta && d.col === c && r >= d.filaTop && r <= d.filaBottom,
    )
  }

  esPincho(c: number, r: number): boolean {
    return this.tileAt(c, r) === PINCHO
  }

  /** Todo lo pisable desde arriba (móviles + caedizas). */
  get pisables(): PlataformaPisable[] {
    return [...this.moviles, ...this.caedizas]
  }
}

export function seSolapan(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
