export type TipoPuerta =
  | 'suma'
  | 'resta'
  | 'mixta'
  | 'descomposicion'
  | 'multiplicacion'
  | 'division'
  | 'logica'
  | 'reto' // mezcla aleatoria de multiplicación, división y lógica (nivel 10)
  | 'logica2' // series avanzadas: ×2, descendentes, saltos grandes
  | 'operacion' // dos pasos: (a + b) × c, a × b − c
  | 'reto2' // mezcla difícil: ×/÷ hasta el 9, logica2 y operacion
  | 'mitadDoble' // ¿el doble de 7? ¿la mitad de 16?
  | 'reto3' // lo más difícil: ×/÷ hasta el 12, mitadDoble, operacion, logica2

export interface DoorSpec {
  tipo: TipoPuerta
  /** número máximo que aparece en los enunciados */
  max: number
}

/** Ambientación visual del nivel (cielo, suelo y detalles). */
export type Tema =
  | 'pradera'
  | 'bosque'
  | 'cueva'
  | 'volcan'
  | 'nieve'
  | 'espacio'
  | 'castillo'

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
   *   I = suelo de hielo (resbala)      L = lava (mortal)
   *   b = plataforma que parpadea (aparece y desaparece)
   */
  mapa: string[]
  puertas: DoorSpec
  /** tiempo (ms) por debajo del cual se gana la estrella de rapidez */
  parMs: number
  /** texto breve que se muestra al empezar el nivel */
  aviso?: string
  /** ambientación visual; si falta, 'pradera' */
  tema?: Tema
  /** gravedad lunar (niveles de espacio): saltos altos y flotantes */
  gravedadBaja?: boolean
}
