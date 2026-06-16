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
  // repisas sólidas de salida y meta
  z.rellena(9, 0, 6, '#')
  z.rellena(10, 0, 6, '#')
  z.rellena(9, W - 7, W - 1, '#')
  z.rellena(10, W - 7, W - 1, '#')
  z.pon(8, 3, 'P')
  z.pon(8, W - 4, 'M')
  // peces en el agua (muchos: atacan al caer)
  if (tipo === 'agua') {
    const step = Math.max(5, Math.floor((W - 24) / peces))
    for (let k = 0; k < peces; k++) z.pon(9, 12 + k * step, 'f')
  }
  // camino de plataformas
  const cols = []
  for (let col = 12; col <= W - 12; col += paso) cols.push(col)
  cols.forEach((col, i) => {
    const r = filas[i % filas.length]
    if (doorsIdx.includes(i)) {
      // plataforma ancha con puerta de mates encima (altura 4 → no saltable)
      const rd = Math.max(4, r)
      z.pon(rd, col - 2, '#####')
      z.col(col, 0, rd - 5, '.')
      for (let dr = rd - 4; dr <= rd - 1; dr++) z.pon(dr, col, 'D')
    } else {
      z.pon(r, col, '###')
      if (i % 2 === 0) z.pon(r - 1, col + 1, 'o')
      if (i % 3 === 1 && r - 3 >= 0) z.pon(r - 3, col + 1, 'o') // moneda alta escondida
    }
  })
  for (const [r, c, t] of extras) z.pon(r, c, t)
  return z.filas()
}

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

// ----- FASE FINAL DEL MUNDO 3: el Remolino (Y) en una arena aérea -----
function bossMundo3() {
  const W = 150
  const z = rejilla(11, W)
  // fondo de lava
  z.rellena(9, 0, W - 1, 'L')
  z.rellena(10, 0, W - 1, 'L')
  // repisa de salida y plataforma de la meta/Xiana
  z.rellena(9, 0, 8, '#')
  z.rellena(10, 0, 8, '#')
  z.pon(8, 3, 'P')
  z.pon(8, 16, 'G')
  z.pon(8, 22, 'R')
  // campo de plataformas a distintas alturas para subir y caer sobre el jefe
  const plats = [
    [8, 24], [6, 34], [7, 46], [4, 40], [5, 58], [8, 64], [3, 70],
    [6, 78], [5, 92], [7, 100], [4, 96], [8, 110], [6, 120],
  ]
  for (const [r, c] of plats) z.pon(r, c, '###')
  z.pon(5, 35, 'o')
  z.pon(3, 71, 'ooo')
  z.pon(4, 97, 'o')
  // sombrero para escapar si te lanzan a un mal sitio
  z.pon(7, 47, 'H')
  // el Remolino flota en el centro de la arena
  z.pon(7, 86, 'Y')
  // plataforma final con Xiana
  z.rellena(9, 134, W - 1, '#')
  z.rellena(10, 134, W - 1, '#')
  z.pon(8, 144, 'X')
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
  const numero = Math.min(Number(n), 25)
  const colorUi = ((Number(n) - 1) % 10) + 1
  const aviso = (def.aviso ? `\n  aviso: '${def.aviso}',` : '')
  const contenido = `import type { LevelData } from './types'

// Nivel ${n} (Mundo 3, aéreo): ${def.com}
// (generado con tools/gen-levels3.mjs; puede editarse a mano)
export const nivel${n}: LevelData = {
  numero: ${numero},
  color: '${COLORES[colorUi]}',
  tema: 'espacio',
  mapa: [
${aereo(def.a).map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: '${def.m}', max: ${def.max} },
  parMs: ${def.par},${aviso}
}
`
  writeFileSync(join(dir, `nivel${n}.ts`), contenido, 'utf8')
  console.log(`nivel${n}.ts escrito`)
}
