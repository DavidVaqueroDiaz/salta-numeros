export type TipoPuerta =
  | 'suma'
  | 'resta'
  | 'mixta'
  | 'descomposicion'
  | 'multiplicacion'
  | 'division'
  | 'logica'

export interface DoorSpec {
  tipo: TipoPuerta
  /** número máximo que aparece en los enunciados */
  max: number
}

export interface LevelData {
  numero: number
  /** color oficial del personaje en este nivel */
  color: string
  /**
   * Mapa ASCII, una string por fila. Leyenda:
   *   . o espacio = vacío      # = bloque sólido
   *   D = puerta matemática    M = meta
   *   P = aparición jugador    ^ = pinchos
   */
  mapa: string[]
  puertas: DoorSpec
  /** tiempo (ms) por debajo del cual se gana la estrella de rapidez */
  parMs: number
}
