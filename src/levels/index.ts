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
import { nivel26 } from './nivel26'
import { nivel27 } from './nivel27'
import { nivel28 } from './nivel28'
import { nivel29 } from './nivel29'
import { nivel30 } from './nivel30'
import { nivel31 } from './nivel31'
import { nivel32 } from './nivel32'
import { nivel33 } from './nivel33'
import { nivel34 } from './nivel34'
import { nivel35 } from './nivel35'
import { nivelFinal } from './nivelfinal'
import { nivel37 } from './nivel37'
import { nivel38 } from './nivel38'
import { nivel39 } from './nivel39'
import { nivel40 } from './nivel40'
import { nivel41 } from './nivel41'
import { nivel42 } from './nivel42'
import { nivel43 } from './nivel43'
import { nivel44 } from './nivel44'
import { nivel45 } from './nivel45'
import { nivel46 } from './nivel46'
import { nivel47 } from './nivel47'
import { nivel48 } from './nivel48'
import { nivel49 } from './nivel49'
import { nivel50 } from './nivel50'
import { nivel51 } from './nivel51'
import { nivel52 } from './nivel52'
import { nivel53 } from './nivel53'
import { nivel54 } from './nivel54'
import { nivel55 } from './nivel55'
import { nivel56 } from './nivel56'
import { nivel57 } from './nivel57'
import { nivel58 } from './nivel58'
import { nivel59 } from './nivel59'
import { nivel60 } from './nivel60'
import { nivel61 } from './nivel61'
import { nivel62 } from './nivel62'
import { nivel63 } from './nivel63'
import { nivel64 } from './nivel64'
import { nivel65 } from './nivel65'
import { nivel66 } from './nivel66'
import { nivel67 } from './nivel67'
import { nivel68 } from './nivel68'
import { nivel69 } from './nivel69'
import { nivel70 } from './nivel70'
import { nivel71 } from './nivel71'
import { nivelFinal2 } from './nivelfinal2'
import { nivel73 } from './nivel73'
import { nivel74 } from './nivel74'
import { nivel75 } from './nivel75'
import { nivel76 } from './nivel76'
import { nivel77 } from './nivel77'
import { nivel78 } from './nivel78'
import { nivel79 } from './nivel79'
import { nivel80 } from './nivel80'
import { nivel81 } from './nivel81'
import { nivel82 } from './nivel82'
import { nivel83 } from './nivel83'
import { nivel84 } from './nivel84'
import { nivel85 } from './nivel85'
import { nivel86 } from './nivel86'
import { nivel87 } from './nivel87'
import { nivel88 } from './nivel88'
import { nivel89 } from './nivel89'
import { nivel90 } from './nivel90'
import { nivel91 } from './nivel91'
import { nivel92 } from './nivel92'
import { nivel93 } from './nivel93'
import { nivel94 } from './nivel94'
import { nivel95 } from './nivel95'
import { nivel96 } from './nivel96'
import { nivel97 } from './nivel97'
import { nivel98 } from './nivel98'
import { nivel99 } from './nivel99'
import { nivel100 } from './nivel100'
import { nivel101 } from './nivel101'
import { nivel102 } from './nivel102'
import { nivel103 } from './nivel103'
import { nivel104 } from './nivel104'
import { nivel105 } from './nivel105'
import { nivel106 } from './nivel106'
import { nivel107 } from './nivel107'
import { nivelFinal3 } from './nivelfinal3'
import { nivel109 } from './nivel109'
import { nivel110 } from './nivel110'
import { nivel111 } from './nivel111'
import { nivel112 } from './nivel112'
import { nivel113 } from './nivel113'
import { nivel114 } from './nivel114'
import { nivel115 } from './nivel115'
import { nivel116 } from './nivel116'
import { nivel117 } from './nivel117'
import { nivel118 } from './nivel118'
import { nivel119 } from './nivel119'
import { nivel120 } from './nivel120'
import { nivel121 } from './nivel121'
import { nivel122 } from './nivel122'
import { nivel123 } from './nivel123'
import { nivel124 } from './nivel124'
import { nivel125 } from './nivel125'
import { nivel126 } from './nivel126'
import { nivel127 } from './nivel127'
import { nivel128 } from './nivel128'
import { nivel129 } from './nivel129'
import { nivel130 } from './nivel130'
import { nivel131 } from './nivel131'
import { nivel132 } from './nivel132'
import { nivel133 } from './nivel133'
import { nivel134 } from './nivel134'
import { nivel135 } from './nivel135'
import { nivel136 } from './nivel136'
import { nivel137 } from './nivel137'
import { nivel138 } from './nivel138'
import { nivel139 } from './nivel139'
import { nivel140 } from './nivel140'
import { nivel141 } from './nivel141'
import { nivel142 } from './nivel142'
import { nivel143 } from './nivel143'
import { nivelFinal4 } from './nivelfinal4'

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
  26: nivel26,
  27: nivel27,
  28: nivel28,
  29: nivel29,
  30: nivel30,
  31: nivel31,
  32: nivel32,
  33: nivel33,
  34: nivel34,
  35: nivel35,
  36: nivelFinal, // el Comecubos y Xiana (final del Mundo 1)
  // ----- MUNDO 2 (37-71) + Mago Oscuro (72) -----
  37: nivel37,
  38: nivel38,
  39: nivel39,
  40: nivel40,
  41: nivel41,
  42: nivel42,
  43: nivel43,
  44: nivel44,
  45: nivel45,
  46: nivel46,
  47: nivel47,
  48: nivel48,
  49: nivel49,
  50: nivel50,
  51: nivel51,
  52: nivel52,
  53: nivel53,
  54: nivel54,
  55: nivel55,
  56: nivel56,
  57: nivel57,
  58: nivel58,
  59: nivel59,
  60: nivel60,
  61: nivel61,
  62: nivel62,
  63: nivel63,
  64: nivel64,
  65: nivel65,
  66: nivel66,
  67: nivel67,
  68: nivel68,
  69: nivel69,
  70: nivel70,
  71: nivel71,
  72: nivelFinal2, // el Mago Oscuro y Xiana (final del Mundo 2)
  // ----- MUNDO 3 (73-107, aéreo) + Remolino (108) -----
  73: nivel73,
  74: nivel74,
  75: nivel75,
  76: nivel76,
  77: nivel77,
  78: nivel78,
  79: nivel79,
  80: nivel80,
  81: nivel81,
  82: nivel82,
  83: nivel83,
  84: nivel84,
  85: nivel85,
  86: nivel86,
  87: nivel87,
  88: nivel88,
  89: nivel89,
  90: nivel90,
  91: nivel91,
  92: nivel92,
  93: nivel93,
  94: nivel94,
  95: nivel95,
  96: nivel96,
  97: nivel97,
  98: nivel98,
  99: nivel99,
  100: nivel100,
  101: nivel101,
  102: nivel102,
  103: nivel103,
  104: nivel104,
  105: nivel105,
  106: nivel106,
  107: nivel107,
  108: nivelFinal3, // el Remolino y Xiana (final del Mundo 3)
  // ----- MUNDO 4 (109-143, vertical: torres y abismos) + Kraken (144) -----
  109: nivel109,
  110: nivel110,
  111: nivel111,
  112: nivel112,
  113: nivel113,
  114: nivel114,
  115: nivel115,
  116: nivel116,
  117: nivel117,
  118: nivel118,
  119: nivel119,
  120: nivel120,
  121: nivel121,
  122: nivel122,
  123: nivel123,
  124: nivel124,
  125: nivel125,
  126: nivel126,
  127: nivel127,
  128: nivel128,
  129: nivel129,
  130: nivel130,
  131: nivel131,
  132: nivel132,
  133: nivel133,
  134: nivel134,
  135: nivel135,
  136: nivel136,
  137: nivel137,
  138: nivel138,
  139: nivel139,
  140: nivel140,
  141: nivel141,
  142: nivel142,
  143: nivel143,
  144: nivelFinal4, // el Kraken y Xiana (final del Mundo 4)
}

/** Número de fases normales por mundo (sin contar el jefe). */
export const TOTAL_NIVELES = 35

/**
 * Mundos del juego. Cada uno tiene 35 fases normales + un jefe final.
 * La flecha del menú lleva al siguiente mundo cuando se completa el jefe del
 * actual. El progreso es por modo de dificultad (ver storage/progress.ts).
 */
export interface Mundo {
  num: number
  primero: number
  ultimo: number
  final: number
}

export const MUNDOS: Mundo[] = [
  { num: 1, primero: 1, ultimo: 35, final: 36 },
  { num: 2, primero: 37, ultimo: 71, final: 72 },
  { num: 3, primero: 73, ultimo: 107, final: 108 },
  { num: 4, primero: 109, ultimo: 143, final: 144 },
]

/** Número del nivel final del Mundo 1 (compatibilidad). */
export const NIVEL_FINAL = 36

/** ¿Es n la fase de un jefe final (de cualquier mundo)? */
export function esNivelFinal(n: number): boolean {
  return MUNDOS.some((m) => m.final === n)
}

/** Mundo al que pertenece la fase n (o el Mundo 1 por defecto). */
export function mundoDe(n: number): Mundo {
  return MUNDOS.find((m) => (n >= m.primero && n <= m.ultimo) || n === m.final) ?? MUNDOS[0]
}
