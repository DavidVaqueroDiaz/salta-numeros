// Modo de dificultad del juego (Fácil / Medio / Difícil).
//
// Es un "modificador global": se elige en el menú, se guarda en el dispositivo
// y el resto del juego lo lee para saber cuántos bichos extra poner, cómo de
// rápidos van los monstruos, si hay vidas, si el jefe salta/teletransporta y
// cómo de duras son las preguntas. El modo Fácil deja TODO como estaba.

export type Dificultad = 'facil' | 'medio' | 'dificil'

export interface ParamsDificultad {
  /** multiplicador de velocidad de enemigos y jefe (1 = como siempre) */
  velMul: number
  /** bichos extra que se añaden por cada 10 columnas de mapa (0 = ninguno) */
  bichosFactor: number
  /** vidas por nivel; null = infinitas (no se reinicia la fase) */
  vidas: number | null
  /** el jefe final salta y se teletransporta */
  jefeAgil: boolean
  /** segundos entre saltos del jefe (Infinity = no salta) */
  jefeSaltoCada: number
  /** segundos entre teletransportes del jefe (Infinity = no se teletransporta) */
  jefeTeleCada: number
  /** corazones (vidas) del jefe final */
  jefeVidas: number
  /** nivel de las preguntas matemáticas */
  mates: 'facil' | 'medio' | 'dificil'
}

const PARAMS: Record<Dificultad, ParamsDificultad> = {
  // Fácil: idéntico al juego original.
  facil: {
    velMul: 1,
    bichosFactor: 0,
    vidas: null,
    jefeAgil: false,
    jefeSaltoCada: Infinity,
    jefeTeleCada: Infinity,
    jefeVidas: 3,
    mates: 'facil',
  },
  // Medio: más bichos, mates un poco más altas, jefe ágil. Sin vidas.
  medio: {
    velMul: 1,
    bichosFactor: 1.2,
    vidas: null,
    jefeAgil: true,
    jefeSaltoCada: 3.2,
    jefeTeleCada: 6.5,
    jefeVidas: 3,
    mates: 'medio',
  },
  // Difícil: mismos bichos que Medio pero más rápidos, 3 vidas, jefe muy ágil
  // y problemas matemáticos de varios pasos.
  dificil: {
    velMul: 1.55,
    bichosFactor: 1.2,
    vidas: 3,
    jefeAgil: true,
    jefeSaltoCada: 2,
    jefeTeleCada: 3.8,
    jefeVidas: 5, // el jefe final aguanta más en Difícil
    mates: 'dificil',
  },
}

export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = {
  facil: '😀 Fácil',
  medio: '🙂 Medio',
  dificil: '😬 Difícil',
}

const CLAVE = 'salta-numeros-dificultad'

function cargar(): Dificultad {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'medio' || guardado === 'dificil' || guardado === 'facil') {
      return guardado
    }
  } catch {
    // sin almacenamiento: empezamos en Fácil
  }
  return 'facil'
}

let actual: Dificultad = cargar()

export function dificultadActual(): Dificultad {
  return actual
}

export function fijarDificultad(d: Dificultad): void {
  actual = d
  try {
    localStorage.setItem(CLAVE, d)
  } catch {
    // sin almacenamiento: dura solo la sesión
  }
}

/** Parámetros del modo actual (o de uno concreto si se le pasa). */
export function paramsDificultad(d: Dificultad = actual): ParamsDificultad {
  return PARAMS[d]
}
