export type TipoPuerta =
  | 'suma'
  | 'resta'
  | 'mixta'
  | 'descomposicion'
  | 'multiplicacion'
  | 'division'
  | 'logica'
  | 'reto' // mezcla aleatoria de multiplicación, división y lógica (nivel 10)

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
   *   o = moneda               E = enemigo que patrulla
   *   m = plataforma móvil horizontal   w = móvil vertical
   *   F = plataforma que se cae         C = punto de control
   *   B = jefe final (Comecubos)        X = Xiana (meta del nivel final)
   */
  mapa: string[]
  puertas: DoorSpec
  /** tiempo (ms) por debajo del cual se gana la estrella de rapidez */
  parMs: number
  /** texto breve que se muestra al empezar el nivel */
  aviso?: string
}
