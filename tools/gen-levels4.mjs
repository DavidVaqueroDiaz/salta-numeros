// Genera las fases del MUNDO 4 (niveles 109-143 + jefe 144): fases VERTICALES.
//   · TORRES: la meta está ARRIBA; se sube saltando plataformas en zigzag
//     (con trampolines 'J' que te lanzan varios pisos de golpe).
//   · SIMAS: la meta está ABAJO; se baja buceando por un pozo de agua
//     esquivando pinchos, peces 'f' y medusas 'u'.
// Jefe: el KRAKEN ('K'), pulpo gigante del fondo del mar.
// Uso: node tools/gen-levels4.mjs
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

// columnas de las plataformas de cada variante de torre (ping-pong, saltos
// cortos: del borde de una a la siguiente hay ≤4 tiles con subida de 2)
const TORRE_COLS = [
  [3, 10, 17, 22, 17, 10],
  [22, 15, 8, 3, 8, 15],
  [3, 9, 16, 22, 16, 9],
  [20, 13, 6, 13],
  [4, 11, 18, 11],
]

/**
 * TORRE: suelo abajo con la salida; plataformas de 5 en zigzag subiendo de 2 en
 * 2 filas; la meta en la plataforma más alta. `v` varía el trazado; opciones
 * para enemigos ('E'), vigilantes ('V'), trampolines ('J') y pinchos ('^') por
 * índice de piso, y una puerta de mates a mitad de subida.
 */
function torre({ v = 0, H = 26, enemigos = [], vigilantes = [], trampolines = [], pinchos = [], puertaPiso = 4 }) {
  const W = 30
  const z = rejilla(H, W)
  z.rellena(H - 1, 0, W - 1, '#')
  z.pon(H - 2, 2, 'P')
  z.pon(H - 2, 6, 'G') // gafas al empezar, como en el resto de mundos
  const cols = TORRE_COLS[v % TORRE_COLS.length]
  const pisos = []
  let i = 0
  for (let fila = H - 4; fila >= 4; fila -= 2) {
    const col = cols[i % cols.length]
    z.pon(fila, col, '#####')
    pisos.push([fila, col])
    i++
  }
  pisos.forEach(([fila, col], idx) => {
    if (idx === pisos.length - 1) return // el último piso es el de la meta
    if (enemigos.includes(idx)) z.pon(fila - 1, col + 1, 'E')
    else if (vigilantes.includes(idx)) z.pon(fila - 1, col + 1, 'V')
    else if (trampolines.includes(idx)) z.pon(fila - 1, col + 3, 'J')
    else if (idx % 2 === 0) z.pon(fila - 2, col + 2, 'o')
    if (pinchos.includes(idx)) z.pon(fila - 1, col + 4, '^')
    // puerta de mates en su piso (4 de alto: no se salta sin responder)
    if (idx === puertaPiso) {
      for (let r = fila - 4; r <= fila - 1; r++) z.pon(r, col + 2, 'D')
    }
  })
  // meta en el piso más alto
  const [fTop, cTop] = pisos[pisos.length - 1]
  z.pon(fTop - 1, cTop + 2, 'M')
  return z.filas()
}

/**
 * SIMA: repisa arriba con la salida; pozo de agua hasta el fondo con salientes
 * de roca (algunos con pinchos), peces y medusas; la meta abajo tras una
 * puerta de mates junto al fondo. `v` alterna el lado de los salientes.
 */
function sima({ v = 0, H = 28, peces = [], medusas = [], conPinchos = true }) {
  const W = 26
  const z = rejilla(H, W)
  // agua en todo el pozo
  for (let r = 2; r < H - 1; r++) z.rellena(r, 0, W - 1, '~')
  // repisa de salida (por encima del agua)
  z.rellena(2, 0, 6, '#')
  z.pon(1, 2, 'P')
  z.pon(1, 5, 'G')
  // salientes de roca alternando lados cada 4 filas (dejan paso de ≥10 tiles)
  let lado = v % 2
  let idx = 0
  for (let r = 6; r <= H - 6; r += 4) {
    const c0 = lado === 0 ? 0 : W - 9
    z.rellena(r, c0, c0 + 8, '#')
    if (conPinchos && idx % 2 === 1) z.pon(r - 1, c0 + 3, '^^')
    if (idx === 1) z.pon(r - 1, c0 + 6, 'C') // punto de control a media bajada
    lado = 1 - lado
    idx++
  }
  // bichos marinos: SOLO en celdas de agua (nunca sobre un saliente de roca)
  for (const [r, c] of peces) if (z.g[r]?.[c] === '~') z.pon(r, c, 'f')
  for (const [r, c] of medusas) if (z.g[r]?.[c] === '~') z.pon(r, c, 'u')
  // fondo con puerta de mates y meta
  z.rellena(H - 1, 0, W - 1, '#')
  for (let r = H - 5; r <= H - 2; r++) z.pon(r, W - 7, 'D')
  z.pon(H - 2, W - 3, 'M')
  return z.filas()
}

// ----- ARENA DEL KRAKEN (144): fondo del mar con Xiana enjaulada -----
function bossMundo4() {
  const W = 64
  const H = 22
  const z = rejilla(H, W)
  for (let r = 2; r < H - 1; r++) z.rellena(r, 0, W - 1, '~')
  // repisa de salida en superficie
  z.rellena(2, 0, 7, '#')
  z.pon(1, 2, 'P')
  z.pon(1, 5, 'G')
  // salientes de bajada con checkpoint y arcoíris
  z.rellena(7, 12, 19, '#')
  z.pon(6, 14, 'R')
  z.rellena(12, 2, 9, '#')
  z.pon(11, 5, 'C')
  z.rellena(15, 22, 29, '#')
  z.pon(14, 25, 'o')
  // bichos guardianes de la bajada
  z.pon(9, 30, 'f')
  z.pon(12, 40, 'u')
  z.pon(16, 12, 'f')
  // lecho marino: el KRAKEN patrulla y Xiana espera al fondo a la derecha
  z.rellena(H - 1, 0, W - 1, '#')
  z.pon(H - 2, 40, 'K')
  z.pon(H - 2, 59, 'X')
  return z.filas()
}
{
  const contenido = `import type { LevelData } from './types'

// FASE FINAL DEL MUNDO 4: el KRAKEN, el pulpo gigante del fondo del mar.
// Baja buceando hasta el lecho marino esquivando sus burbujas; pisotón
// (bucear hacia abajo sobre su cabeza) → reto de mates; el cubo también le
// quita corazones. Xiana espera enjaulada al fondo.
// (generado con tools/gen-levels4.mjs; puede editarse a mano)
export const nivelFinal4: LevelData = {
  numero: 10,
  color: '#0096c7',
  tema: 'cueva',
  mapa: [
${bossMundo4().map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: 'reto3', max: 12 },
  parMs: 210000,
  aviso: '🐙 ¡El KRAKEN lanza burbujas! Bucea hasta su cabeza y dale un pisotón',
}
`
  writeFileSync(join(dir, 'nivelfinal4.ts'), contenido, 'utf8')
  console.log('nivelfinal4.ts escrito')
}

// ----- Las 35 fases, por zonas -----
const MATES = ['multiplicacion', 'division', 'mitadDoble', 'operacion', 'reto2', 'reto3']

for (let n = 109; n <= 143; n++) {
  const i = n - 109 // 0..34
  const v = i % 5
  const zona = Math.floor(i / 7) // 0..4
  const esTorre = zona === 0 || zona === 2 || (zona === 4 && i % 2 === 0)
  let mapa
  let tema
  let aviso = ''
  let com
  if (esTorre) {
    const dura = zona >= 2
    mapa = torre({
      v,
      H: 24 + (v % 3) * 4,
      enemigos: dura ? [1, 4, 7] : [2, 6],
      vigilantes: dura ? [3, 8] : [],
      trampolines: dura ? [0, 5] : [0],
      pinchos: dura ? [2, 6] : [4],
      puertaPiso: 4,
    })
    tema = dura ? 'castillo' : 'bosque'
    com = dura
      ? 'torre difícil: vigilantes, pinchos y trampolines para subir pisos'
      : 'torre: sube saltando de plataforma en plataforma hasta la meta'
    if (i === 0) aviso = '🗼 ¡MUNDO 4! La meta está ARRIBA: sube por las plataformas (los muelles te lanzan)'
  } else {
    const dura = zona >= 3
    const H = 26 + (v % 3) * 4
    const peces = []
    const medusas = []
    for (let k = 0; k < (dura ? 5 : 3); k++) peces.push([8 + k * 4, 12 + ((k * 7) % 12)])
    for (let k = 0; k < (dura ? 4 : 1); k++) medusas.push([10 + k * 5, 4 + ((k * 9) % 18)])
    mapa = sima({ v, H, peces, medusas, conPinchos: true })
    tema = dura ? 'cueva' : 'nieve'
    com = dura
      ? 'abismo profundo: medusas, peces y pinchos hasta el fondo'
      : 'abismo marino: baja buceando esquivando las trampas'
    if (i === 7) aviso = '🌊 ¡Al ABISMO! La meta está en el FONDO: baja buceando con cuidado'
    if (i === 21) aviso = '🪼 ¡Cuidado con las MEDUSAS! Suben y bajan flotando'
  }
  const numero = Math.min(n, 25)
  const colorUi = ((n - 1) % 10) + 1
  const tipo = MATES[i % MATES.length]
  const contenido = `import type { LevelData } from './types'

// Nivel ${n} (Mundo 4, vertical): ${com}
// (generado con tools/gen-levels4.mjs; puede editarse a mano)
export const nivel${n}: LevelData = {
  numero: ${numero},
  color: '${COLORES[colorUi]}',
  tema: '${tema}',
  mapa: [
${mapa.map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: '${tipo}', max: 12 },
  parMs: ${152000 + i * 2000},${aviso ? `\n  aviso: '${aviso}',` : ''}
}
`
  writeFileSync(join(dir, `nivel${n}.ts`), contenido, 'utf8')
}
console.log('niveles 109-143 escritos')
