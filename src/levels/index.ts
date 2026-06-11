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
import { nivel12 } from './nivel12'
import { nivel13 } from './nivel13'
import { nivel14 } from './nivel14'
import { nivel15 } from './nivel15'
import { nivel16 } from './nivel16'
import { nivel17 } from './nivel17'
import { nivel18 } from './nivel18'
import { nivel19 } from './nivel19'
import { nivel20 } from './nivel20'
import { nivel21 } from './nivel21'
import { nivel22 } from './nivel22'
import { nivel23 } from './nivel23'
import { nivel24 } from './nivel24'
import { nivel25 } from './nivel25'
import { nivelFinal } from './nivelfinal'

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

export const TOTAL_NIVELES = 25

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
  11: nivel11,
  12: nivel12,
  13: nivel13,
  14: nivel14,
  15: nivel15,
  16: nivel16,
  17: nivel17,
  18: nivel18,
  19: nivel19,
  20: nivel20,
  21: nivel21,
  22: nivel22,
  23: nivel23,
  24: nivel24,
  25: nivel25,
  26: nivelFinal, // el Comecubos y Xiana
}

/** Número del nivel final (jefe). */
export const NIVEL_FINAL = 26
