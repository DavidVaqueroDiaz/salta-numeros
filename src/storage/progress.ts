// Progreso guardado en localStorage: estrellas, mejor tiempo y completado por nivel.

export interface LevelProgress {
  stars: number
  bestMs: number
  completed: boolean
}

export type Progress = Record<number, LevelProgress>

const CLAVE = 'salta-numeros-v1'

export function cargarProgreso(): Progress {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Progress) : {}
  } catch {
    return {}
  }
}

export interface ResultadoGuardado {
  progreso: Progress
  esNuevoRecord: boolean
}

/** Guarda el resultado de un nivel conservando lo mejor de cada cosa. */
export function guardarResultado(
  nivel: number,
  tiempoMs: number,
  estrellas: number,
): ResultadoGuardado {
  const progreso = cargarProgreso()
  const previo = progreso[nivel]
  const esNuevoRecord = !previo || tiempoMs < previo.bestMs
  progreso[nivel] = {
    completed: true,
    stars: Math.max(estrellas, previo?.stars ?? 0),
    bestMs: esNuevoRecord ? tiempoMs : previo.bestMs,
  }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(progreso))
  } catch {
    // sin espacio o modo privado: el juego sigue funcionando sin guardar
  }
  return { progreso, esNuevoRecord }
}

/** El nivel n está desbloqueado si es el 1 o si el anterior está completado. */
export function nivelDesbloqueado(n: number, progreso: Progress): boolean {
  return n === 1 || progreso[n - 1]?.completed === true
}
