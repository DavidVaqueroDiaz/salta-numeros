import type { LevelData } from './types'
import { nivel1 } from './nivel01'
import { nivel2 } from './nivel02'
import { nivel3 } from './nivel03'
import { nivel4 } from './nivel04'
import { nivel5 } from './nivel05'
import { nivel6 } from './nivel06'
import { nivel7 } from './nivel07'
import { nivel8 } from './nivel08'
import { nivel9 } from './nivel09'
import { nivel10 } from './nivel10'
import { nivel11 } from './nivel11'

/** Colores oficiales estilo Numberblocks, del 1 al 10. */
export const COLORES: Record<number, string> = {
  1: '#e63946', // rojo
  2: '#f77f00', // naranja
  3: '#ffd60a', // amarillo
  4: '#52b788', // verde
  5: '#4cc9f0', // azul claro
  6: '#3f37c9', // añil (con puntos de dado)
  7: '#3a86ff', // azul (cuerpo arcoíris)
  8: '#ff5d8f', // rosa
  9: '#8d99ae', // gris
  10: '#adb5bd', // plateado (cuerpo blanco con borde rojo)
}

export const TOTAL_NIVELES = 10

export const NIVELES: Record<number, LevelData> = {
  1: nivel1,
  2: nivel2,
  3: nivel3,
  4: nivel4,
  5: nivel5,
  6: nivel6,
  7: nivel7,
  8: nivel8,
  9: nivel9,
  10: nivel10,
  11: nivel11, // nivel final: el Comecubos y Xiana
}

/** Número del nivel final (jefe). */
export const NIVEL_FINAL = 11
