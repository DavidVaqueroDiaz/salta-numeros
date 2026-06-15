// Progreso guardado en localStorage: estrellas, mejor tiempo y completado por nivel.
//
// Cada modo de dificultad guarda su progreso por separado: Fácil usa la clave
// de siempre (no se toca lo que Joel ya tiene); Medio y Difícil estrenan su
// propia clave, así sus estrellas y desbloqueos no se mezclan con los de Fácil.

import type { Dificultad } from '../game/dificultad'

export interface LevelProgress {
  stars: number
  bestMs: number
  completed: boolean
  /** mejor cantidad de monedas conseguida */
  coins?: number
}

export type Progress = Record<number, LevelProgress>

export const CLAVES_PROGRESO: Record<Dificultad, string> = {
  facil: 'salta-numeros-v1',
  medio: 'salta-numeros-medio-v1',
  dificil: 'salta-numeros-dificil-v1',
}

export function cargarProgreso(modo: Dificultad = 'facil'): Progress {
  try {
    const raw = localStorage.getItem(CLAVES_PROGRESO[modo])
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
  monedas = 0,
  modo: Dificultad = 'facil',
): ResultadoGuardado {
  const progreso = cargarProgreso(modo)
  const previo = progreso[nivel]
  const esNuevoRecord = !previo || tiempoMs < previo.bestMs
  progreso[nivel] = {
    completed: true,
    stars: Math.max(estrellas, previo?.stars ?? 0),
    bestMs: esNuevoRecord ? tiempoMs : previo.bestMs,
    coins: Math.max(monedas, previo?.coins ?? 0),
  }
  try {
    localStorage.setItem(CLAVES_PROGRESO[modo], JSON.stringify(progreso))
  } catch {
    // sin espacio o modo privado: el juego sigue funcionando sin guardar
  }
  return { progreso, esNuevoRecord }
}

/** El nivel n está desbloqueado si es el 1 o si el anterior está completado. */
export function nivelDesbloqueado(n: number, progreso: Progress): boolean {
  return n === 1 || progreso[n - 1]?.completed === true
}
