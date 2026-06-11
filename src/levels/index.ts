import type { LevelData } from './types'
import { nivel1 } from './nivel01'

/** Colores oficiales estilo Numberblocks, del 1 al 10. */
export const COLORES: Record<number, string> = {
  1: '#e63946', // rojo
  2: '#f77f00', // naranja
  3: '#ffd60a', // amarillo
  4: '#52b788', // verde
  5: '#4cc9f0', // azul claro
  6: '#9d4edd', // morado
  7: '#3a86ff', // azul
  8: '#ff5d8f', // rosa
  9: '#2a9d8f', // verde azulado
  10: '#adb5bd', // plateado
}

export const TOTAL_NIVELES = 10

/** Niveles disponibles. Se irán añadiendo del 2 al 10. */
export const NIVELES: Record<number, LevelData> = {
  1: nivel1,
}
