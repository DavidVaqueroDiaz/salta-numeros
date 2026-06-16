// Genera las fases del MUNDO 3 (niveles 73-107): fases AÉREAS. Casi no hay
// suelo: abajo todo es lava o agua llena de peces que atacan, y se avanza
// saltando de plataforma en plataforma. Uso: node tools/gen-levels3.mjs
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')

const COLORES = {
  1: '#e63946', 2: '#f77f00', 3: '#ffd60a', 4: '#52b788', 5: '#4cc9f0',
  6: '#3f37c9', 7: '#3a86ff', 8: '#ff5d8f', 9: '#9aa5b1', 10: '#adb5bd',
}

function rejilla(filas, ancho) {
  const g = Array.from({ length: filas }, () => Array(ancho).fill('.'))
  return {
    g,
    pon(r, c, texto) { for (let i = 0; i < texto.length; i++) g[r][c + i] = texto[i] },
    rellena(r, c0, c1, ch) { for (let c = c0; c <= c1; c++) g[r][c] = ch },
    col(c, r0, r1, ch) { for (let r = r0; r <= r1; r++) g[r][c] = ch },
    filas: () => g.map((f) => f.join('')),
  }
}

/**
 * Fase AÉREA (11 filas × W): el fondo (filas 9-10) es lava ('L') o agua ('~')
 * con peces; solo hay repisas sólidas al inicio y al final. En medio, un camino
 * de plataformas a distintas alturas (saltos exigentes) sobre el vacío mortal.
 * `doorsIdx` = índices del camino que llevan puerta de mates encima.
 */
function aereo({
  tipo = 'lava',
  W = 120,
  paso = 7,
  filas = [7, 5, 6, 4, 7, 5, 6, 4],
  peces = 8,
  doorsIdx = [3],
  extras = [],
}) {
  const z = rejilla(11, W)
  const haz = tipo === 'agua' ? '~' : 'L'
  z.rellena(9, 0, W - 1, haz)
  z.rellena(10, 0, W - 1, haz)
  // repisas sólidas de salida y meta (la de salida, larga, para llegar a la 1ª)
  z.rellena(9, 0, 9, '#')
  z.rellena(10, 0, 9, '#')
  z.rellena(9, W - 7, W - 1, '#')
  z.rellena(10, W - 7, W - 1, '#')
  z.pon(8, 3, 'P')
  z.pon(8, W - 4, 'M')
  // arcoíris en la repisa de salida: red de seguridad para volar si un salto
  // se hace demasiado largo (las fases aéreas siempre se pueden superar)
  z.pon(8, 7, 'R')
  // peces en el agua (muchos: atacan al caer)
  if (tipo === 'agua') {
    const step = Math.max(5, Math.floor((W - 24) / peces))
    for (let k = 0; k < peces; k++) z.pon(9, 12 + k * step, 'f')
  }
  // camino de plataformas
  const cols = []
  for (let col = 12; col <= W - 12; col += paso) cols.push(col)
  // 1) plataformas estáticas + monedas (las puertas van al final)
  cols.forEach((col, i) => {
    if (doorsIdx.includes(i)) return
    const r = filas[i % filas.length]
    z.pon(r, col, '###')
    if (i % 2 === 0) z.pon(r - 1, col + 1, 'o')
    if (i % 3 === 1 && r - 3 >= 0) z.pon(r - 3, col + 1, 'o') // moneda alta escondida
  })
  // 2) extras: móviles/caedizas/parpadeantes/ítems
  for (const [r, c, t] of extras) z.pon(r, c, t)
  // 3) puertas de mates AL FINAL (plataforma ancha + puerta intacta, no saltable)
  doorsIdx.forEach((i) => {
    const col = cols[i]
    if (col === undefined) return
    const rd = Math.max(4, filas[i % filas.length])
    z.pon(rd, col - 2, '#####')
    z.col(col, 0, rd - 5, '.')
    for (let dr = rd - 4; dr <= rd - 1; dr++) z.pon(dr, col, 'D')
  })
  return z.filas()
}

/**
 * Fase ESPECIAL "monta en la barra": te subes a una barra verde ancha que va
 * de un lado a otro sobre la lava y, SIN bajarte, saltas para coger monedas y
 * los ítems (sombrero y arcoíris) que harás falta al final para cruzar el muro
 * mágico y volar sobre el último foso de lava.
 */
function barraLevel() {
  const W = 80
  const z = rejilla(11, W)
  z.rellena(9, 0, W - 1, 'L')
  z.rellena(10, 0, W - 1, 'L')
  // repisa de salida LARGA: la barra arranca pegada a ella (te subes al instante)
  z.rellena(9, 0, 13, '#')
  z.rellena(10, 0, 13, '#')
  z.pon(8, 3, 'P')
  z.pon(8, 16, 'n') // barra ancha y lenta, pegada a la repisa
  // monedas e ítems por encima del recorrido de la barra (saltar sin caer)
  z.pon(5, 12, 'G')
  z.pon(6, 10, 'o')
  z.pon(5, 16, 'o')
  z.pon(4, 20, 'R')
  z.pon(5, 24, 'o')
  z.pon(5, 26, 'H')
  // plataforma para bajarse de la barra (a la derecha)
  z.pon(7, 32, '###')
  // MURO mágico: solo se cruza con el SOMBRERO cogido en la barra
  z.col(38, 0, 10, '#')
  z.pon(7, 44, '###')
  // foso de lava ancho: hay que VOLAR con el ARCOÍRIS cogido en la barra
  // (cols 47-61 son lava, sin plataformas)
  z.pon(7, 62, '###')
  // repisa final con la meta
  z.rellena(9, 64, W - 1, '#')
  z.rellena(10, 64, W - 1, '#')
  z.pon(8, 72, 'M')
  return z.filas()
}

// Patrones de alturas ALCANZABLES: empiezan bajos (cerca de la repisa) y suben
// poco a poco (saltos de ≤2 hacia arriba), para poder ir de una a otra.
// Distintos por fase para que no se parezcan.
const PATRONES = [
  [8, 7, 6, 7, 5, 6, 7, 8],
  [7, 8, 6, 7, 8, 6, 5, 7],
  [8, 6, 7, 5, 6, 7, 8, 6],
  [7, 6, 8, 7, 5, 6, 7, 5],
  [8, 7, 5, 6, 7, 8, 6, 7],
  [7, 8, 7, 6, 5, 6, 8, 7],
]

const NIVELES = {
  // ===== LAVA AÉREA (73-78) =====
  73: { tipo: 'lava', m: 'reto3', max: 12, par: 150000,
    aviso: '☁️ ¡MUNDO 3! No hay suelo: ¡salta de plataforma en plataforma!',
    com: 'Primeras alturas sobre la lava.', a: { tipo: 'lava', paso: 6, extras: [[8, 16, 'G'], [4, 40, 'ooo']] } },
  74: { tipo: 'lava', m: 'reto3', max: 12, par: 152000, com: 'Plataformas móviles sobre la lava.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 75, 'm']] } },
  75: { tipo: 'lava', m: 'operacion', max: 9, par: 152000, com: 'Tablones que se caen sobre el fuego.',
    a: { tipo: 'lava', paso: 6, extras: [[8, 16, 'G'], [6, 40, 'F'], [6, 43, 'F'], [5, 70, 'F']] } },
  76: { tipo: 'lava', m: 'reto3', max: 12, par: 154000, com: 'Saltos largos con monedas escondidas arriba.',
    a: { tipo: 'lava', paso: 7, filas: [7, 4, 6, 3, 7, 4, 6, 3], extras: [[8, 16, 'G'], [8, 20, 'R']] } },
  77: { tipo: 'lava', m: 'reto3', max: 12, par: 156000, com: 'Plataformas que parpadean sobre la lava.',
    a: { tipo: 'lava', paso: 6, extras: [[8, 16, 'G'], [6, 47, 'b'], [6, 54, 'b'], [5, 82, 'b']] } },
  78: { tipo: 'lava', m: 'reto3', max: 12, par: 158000, com: 'Lava total: móviles, caedizas y parpadeantes.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 61, 'b'], [5, 82, 'F']] } },

  // ===== AGUA CON PECES (79-84) =====
  79: { tipo: 'agua', m: 'reto3', max: 12, par: 154000,
    aviso: '🌊 ¡Agua llena de peces! Si caes, te atacan. ¡Salta bien!',
    com: 'Primer mar de peces: no toques el agua.', a: { tipo: 'agua', peces: 10, paso: 6, extras: [[8, 16, 'G']] } },
  80: { tipo: 'agua', m: 'division', max: 9, par: 156000, com: 'Más peces y plataformas móviles.',
    a: { tipo: 'agua', peces: 12, paso: 7, extras: [[8, 16, 'G'], [7, 40, 'm'], [6, 75, 'm']] } },
  81: { tipo: 'agua', m: 'reto3', max: 12, par: 156000, com: 'Banco de peces enorme.',
    a: { tipo: 'agua', peces: 14, paso: 6, extras: [[8, 16, 'G'], [8, 20, 'R']] } },
  82: { tipo: 'agua', m: 'mitadDoble', max: 12, par: 158000, com: 'Peces y tablones que se caen.',
    a: { tipo: 'agua', peces: 12, paso: 7, extras: [[8, 16, 'G'], [6, 40, 'F'], [6, 43, 'F']] } },
  83: { tipo: 'agua', m: 'reto3', max: 12, par: 160000, com: 'Saltos altos sobre un mar de peces.',
    a: { tipo: 'agua', peces: 13, paso: 7, filas: [7, 4, 6, 3, 7, 4, 6, 3], extras: [[8, 16, 'G']] } },
  84: { tipo: 'agua', m: 'reto3', max: 12, par: 162000, com: 'Agua difícil: peces, móviles y parpadeantes.',
    a: { tipo: 'agua', peces: 14, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 61, 'b']] } },

  // ===== LAVA + MECÁNICAS (85-90) =====
  85: { tipo: 'lava', m: 'reto3', max: 12, par: 160000, com: 'Móviles encadenadas sobre la lava.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 26, 'm'], [6, 47, 'm'], [7, 68, 'm']] } },
  86: { tipo: 'lava', m: 'operacion', max: 9, par: 160000, com: 'Caedizas: hay que ir rápido.',
    a: { tipo: 'lava', paso: 6, extras: [[8, 16, 'G'], [6, 33, 'F'], [5, 47, 'F'], [6, 61, 'F'], [5, 75, 'F']] } },
  87: { tipo: 'lava', m: 'reto3', max: 12, par: 162000, com: 'Parpadeantes: salta cuando están.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [6, 33, 'b'], [5, 54, 'b'], [6, 75, 'b']] } },
  88: { tipo: 'lava', m: 'reto3', max: 12, par: 164000, com: 'Vuelo de arcoíris para los huecos imposibles.',
    a: { tipo: 'lava', paso: 7, filas: [7, 3, 6, 4, 7, 3, 6, 4], extras: [[8, 16, 'G'], [8, 20, 'R']] } },
  89: { tipo: 'lava', m: 'reto3', max: 12, par: 166000, com: 'Todo a la vez sobre la lava.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 54, 'F'], [5, 75, 'b']] } },
  90: { tipo: 'lava', m: 'reto3', max: 12, par: 168000, com: 'Lava extrema: saltos al límite.',
    a: { tipo: 'lava', paso: 7, filas: [7, 4, 6, 3, 7, 4, 6, 3], extras: [[8, 16, 'G'], [7, 40, 'm'], [6, 75, 'b']] } },

  // ===== AGUA DIFÍCIL (91-96) =====
  91: { tipo: 'agua', m: 'reto3', max: 12, par: 166000, com: 'Peces por todas partes y móviles.',
    a: { tipo: 'agua', peces: 14, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 68, 'm']] } },
  92: { tipo: 'agua', m: 'mitadDoble', max: 12, par: 166000, com: 'Peces y caedizas: sin parar.',
    a: { tipo: 'agua', peces: 13, paso: 6, extras: [[8, 16, 'G'], [6, 40, 'F'], [5, 61, 'F']] } },
  93: { tipo: 'agua', m: 'reto3', max: 12, par: 168000, com: 'Parpadeantes sobre el agua con peces.',
    a: { tipo: 'agua', peces: 14, paso: 7, extras: [[8, 16, 'G'], [6, 33, 'b'], [5, 61, 'b']] } },
  94: { tipo: 'agua', m: 'reto3', max: 12, par: 170000, com: 'Saltos altísimos, mar lleno de peces.',
    a: { tipo: 'agua', peces: 15, paso: 7, filas: [7, 3, 6, 4, 7, 3, 6, 4], extras: [[8, 16, 'G'], [8, 20, 'R']] } },
  95: { tipo: 'agua', m: 'reto3', max: 12, par: 172000, com: 'Móviles, caedizas y muchos peces.',
    a: { tipo: 'agua', peces: 15, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 61, 'F']] } },
  96: { tipo: 'agua', m: 'reto3', max: 12, par: 174000, com: 'El océano más difícil.',
    a: { tipo: 'agua', peces: 16, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 54, 'b'], [5, 75, 'F']] } },

  // ===== TORMENTA FINAL (97-107) =====
  97: { tipo: 'lava', m: 'reto3', max: 12, par: 172000, com: 'La tormenta: lava y plataformas locas.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 54, 'b'], [5, 75, 'F']] } },
  98: { tipo: 'agua', m: 'reto3', max: 12, par: 174000, com: 'Mar embravecido de peces.',
    a: { tipo: 'agua', peces: 16, paso: 7, extras: [[8, 16, 'G'], [6, 33, 'F'], [7, 61, 'm']] } },
  99: { tipo: 'lava', m: 'operacion', max: 9, par: 174000, com: 'Caedizas sobre la lava, sin descanso.',
    a: { tipo: 'lava', paso: 6, extras: [[8, 16, 'G'], [6, 33, 'F'], [5, 47, 'F'], [6, 61, 'F'], [5, 75, 'F']] } },
  100: { tipo: 'agua', m: 'reto3', max: 12, par: 176000, com: 'Cien fases: peces y parpadeantes.',
    a: { tipo: 'agua', peces: 15, paso: 7, extras: [[8, 16, 'G'], [6, 40, 'b'], [5, 61, 'b'], [6, 82, 'b']] } },
  101: { tipo: 'lava', m: 'reto3', max: 12, par: 178000, com: 'Lava y vuelo: arcoíris salvador.',
    a: { tipo: 'lava', paso: 7, filas: [7, 3, 6, 4, 7, 3, 6, 4], extras: [[8, 16, 'G'], [8, 20, 'R']] } },
  102: { tipo: 'agua', m: 'reto3', max: 12, par: 180000, com: 'Peces, móviles y caedizas a tope.',
    a: { tipo: 'agua', peces: 16, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 61, 'F'], [5, 82, 'b']] } },
  103: { tipo: 'lava', m: 'reto3', max: 12, par: 182000, com: 'Antesala del Remolino: lava feroz.',
    a: { tipo: 'lava', paso: 7, extras: [[8, 16, 'G'], [7, 26, 'm'], [6, 47, 'b'], [5, 68, 'F'], [6, 89, 'm']] } },
  104: { tipo: 'agua', m: 'reto3', max: 12, par: 184000, com: 'Antesala: mar imposible de peces.',
    a: { tipo: 'agua', peces: 17, paso: 7, extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 54, 'b'], [5, 75, 'F']] } },
  105: { tipo: 'lava', m: 'reto3', max: 12, par: 186000, com: 'Lava extrema con todo mezclado.',
    a: { tipo: 'lava', paso: 7, filas: [7, 4, 6, 3, 7, 4, 6, 3], extras: [[8, 16, 'G'], [7, 33, 'm'], [6, 61, 'b'], [5, 89, 'F']] } },
  106: { tipo: 'agua', m: 'reto3', max: 12, par: 188000, com: 'El último mar antes del jefe.',
    a: { tipo: 'agua', peces: 18, paso: 7, extras: [[8, 16, 'G'], [8, 20, 'R'], [7, 40, 'm'], [6, 75, 'b']] } },
  107: { tipo: 'lava', m: 'reto3', max: 12, par: 190000, com: '¡La última subida hacia el Remolino!',
    a: { tipo: 'lava', paso: 7, filas: [7, 3, 6, 4, 7, 3, 6, 4], extras: [[8, 16, 'G'], [8, 20, 'R'], [7, 33, 'm'], [6, 61, 'b'], [5, 89, 'F']] } },
}

// ----- FASE FINAL DEL MUNDO 3: el Remolino (Y) -----
// Hay una ISLA DE LUCHA sólida (no lava) donde peleas; el Remolino te lanza
// fuera y caes en plataformas más bajas por las que vuelves a SUBIR a la isla.
// Plataformas altas para caerle encima, punto de control y sombrero de rescate.
function bossMundo3() {
  const W = 170
  const z = rejilla(11, W)
  z.rellena(9, 0, W - 1, 'L')
  z.rellena(10, 0, W - 1, 'L')
  // repisa de salida LARGA con los ítems ENCIMA de ella (alcanzables)
  z.rellena(9, 0, 13, '#')
  z.rellena(10, 0, 13, '#')
  z.pon(8, 3, 'P')
  z.pon(8, 6, 'G')
  z.pon(8, 9, 'R')
  // escalera de aproximación a la isla (plataformas cada 6, alturas suaves)
  for (const [r, c] of [[8, 18], [7, 24], [8, 30], [7, 36], [8, 42], [7, 48], [8, 54]]) {
    z.pon(r, c, '###')
  }
  // ISLA DE LUCHA: plataforma sólida ancha (aquí se pelea, sin lava)
  z.rellena(8, 58, 112, '#')
  z.pon(7, 64, 'C') // punto de control: si mueres, reapareces en la isla
  z.pon(7, 106, 'H') // sombrero por si te lanzan a un mal sitio
  // plataformas para coger altura y caer sobre el Remolino (escalonadas)
  z.pon(6, 80, '###')
  z.pon(4, 86, '#####')
  z.pon(6, 92, '###')
  z.pon(3, 87, 'ooo')
  z.pon(5, 81, 'o')
  z.pon(5, 93, 'o')
  // el Remolino flota sobre la isla
  z.pon(7, 84, 'Y')
  // plataformas de salida hacia la meta (cada 6, alturas suaves)
  for (const [r, c] of [[7, 118], [8, 124], [7, 130], [8, 136], [7, 142], [8, 148]]) {
    z.pon(r, c, '###')
  }
  // repisa final con Xiana
  z.rellena(9, 154, W - 1, '#')
  z.rellena(10, 154, W - 1, '#')
  z.pon(8, 162, 'X')
  return z.filas()
}
{
  const mapa = bossMundo3()
  const contenido = `import type { LevelData } from './types'

// FASE FINAL DEL MUNDO 3: el REMOLINO. Flota en una arena aérea sobre lava.
// Su ataque te hace girar y te lanza fuera de la plataforma; hay que volver,
// subir por las plataformas para coger altura y caerle ENCIMA (pisotón) o
// darle con un cubo de Rubik. Rescata a Xiana al final.
// (generado con tools/gen-levels3.mjs; puede editarse a mano)
export const nivelFinal3: LevelData = {
  numero: 10,
  color: '#48cae4',
  tema: 'espacio',
  mapa: [
${mapa.map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: 'reto3', max: 12 },
  parMs: 200000,
  aviso: '🌀 ¡El REMOLINO te lanza por los aires! Sube alto y cáele encima',
}
`
  writeFileSync(join(dir, 'nivelfinal3.ts'), contenido, 'utf8')
  console.log('nivelfinal3.ts escrito')
}

for (const [n, def] of Object.entries(NIVELES)) {
  const seed = Number(n)
  const numero = Math.min(seed, 25)
  const colorUi = ((seed - 1) % 10) + 1
  // variedad: cada fase usa un patrón de alturas y un ancho distintos
  const a = { ...def.a }
  a.W = a.W ?? 110 + (seed % 6) * 5
  if (!a.filas) a.filas = PATRONES[seed % PATRONES.length]
  const esBarra = seed === 90
  const avisoTexto = esBarra
    ? '🟩 ¡Móntate en la barra verde! Salta a por las monedas y los ítems sin caer'
    : def.aviso
  const aviso = avisoTexto ? `\n  aviso: '${avisoTexto}',` : ''
  const com = esBarra ? 'monta en la barra verde y cruza saltando' : def.com
  const mapaFilas = esBarra ? barraLevel() : aereo(a)
  const contenido = `import type { LevelData } from './types'

// Nivel ${n} (Mundo 3, aéreo): ${com}
// (generado con tools/gen-levels3.mjs; puede editarse a mano)
export const nivel${n}: LevelData = {
  numero: ${numero},
  color: '${COLORES[colorUi]}',
  tema: 'espacio',
  mapa: [
${mapaFilas.map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: '${def.m}', max: ${def.max} },
  parMs: ${def.par},${aviso}
}
`
  writeFileSync(join(dir, `nivel${n}.ts`), contenido, 'utf8')
  console.log(`nivel${n}.ts escrito`)
}
