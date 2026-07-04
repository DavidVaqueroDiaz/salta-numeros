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

/** Refleja el mapa en horizontal (dobla la variedad sin duplicar trazados). */
const espejo = (filas) => filas.map((f) => [...f].reverse().join(''))

/**
 * TORRE estilo Mario clásico: se SUBE y a la vez se AVANZA a la derecha.
 * Recorrido: pasillo bajo con techo (hay que sortear enemigos con hueco de
 * solo 3, cronometrando el salto) → sala con TRAMPOLÍN OBLIGATORIO (subida de
 * 10 filas, imposible con doble salto: bote + salto en el aire) → puente de
 * plataformas parpadeantes sobre pinchos (esperar el momento) → checkpoint y
 * puerta de mates → segundo TRAMPOLÍN OBLIGATORIO (subida 9) → cornisas con
 * vigilante hasta la meta, arriba a la derecha. Monedas por todo el camino.
 */
function torre({ v = 0, dura = false }) {
  const H = 30
  const W = 66
  const z = rejilla(H, W)
  const suelo = H - 2 // filas 28-29 sólidas (suelo grueso)
  z.rellena(H - 1, 0, W - 1, '#')
  z.rellena(suelo, 0, W - 1, '#')
  z.pon(suelo - 1, 2, 'P')
  z.pon(suelo - 1, 5, 'G')

  // --- Tramo 1: pasillo bajo (techo en fila 24, hueco de 3) con guardianes ---
  // el techo llega solo hasta la col 25: desde su azotea NO se alcanza la
  // cornisa (dc 8), así que el trampolín es de verdad el único camino
  z.rellena(suelo - 4, 6, 25, '#')
  z.pon(suelo - 1, 12, 'E')
  if (dura) z.pon(suelo - 1, 22, 'E')
  z.pon(suelo - 1, 17, '^^')
  z.pon(suelo - 2, 9, 'o')
  z.pon(suelo - 2, 15, 'o')
  z.pon(suelo - 2, 20, 'o')
  z.pon(suelo - 2, 25, 'o')

  // --- Sala del trampolín 1 (cols 26-39): subida de 10, SOLO con el bote ---
  // el trampolín tiene CIELO ABIERTO encima; la cornisa de llegada queda AL
  // LADO (cols 33-40, pasa sobre el muro): botas recto y derivas a la derecha
  z.pon(suelo - 1, 30, 'J')
  z.rellena(suelo - 10, 33, 40, '#')
  z.pon(suelo - 11, 35, 'ooo')
  z.col(40, suelo - 9, suelo - 1, '#') // muro: sella el paso por abajo

  // --- Tramo 2 (piso fila 22): puente parpadeante sobre foso de pinchos ---
  const piso2 = suelo - 6
  z.rellena(piso2, 41, 46, '#')
  z.rellena(piso2 + 1, 47, 53, '#') // foso más bajo…
  z.pon(piso2, 47, '^'.repeat(dura ? 7 : 5)) // …alfombrado de pinchos
  z.pon(piso2 - 2, 48, 'b')
  z.pon(piso2 - 2, 51, dura ? 'F' : 'b') // en difícil, una caediza traicionera
  z.pon(piso2 - 3, 49, 'o')
  z.pon(piso2 - 3, 52, 'o')
  z.rellena(piso2, 54, 58, '#')
  z.pon(piso2 - 1, 55, 'C')
  z.pon(piso2 - 5, 57, '#') // techo de la puerta: no se puede saltar por encima
  for (let r = piso2 - 4; r <= piso2 - 1; r++) z.pon(r, 57, 'D')

  // --- Sala del trampolín 2 (cols 59-65): subida de 9, SOLO con el bote ---
  // ídem: cielo abierto sobre el muelle, plataforma de llegada al lado
  z.rellena(piso2, 59, 65, '#')
  z.pon(piso2 - 1, 60, 'J')
  z.rellena(piso2 - 9, 63, 65, '#')
  z.pon(piso2 - 10, 64, 'o')

  // --- Tramo 3: cornisas en zigzag (con vigilante en difícil) hasta la meta ---
  z.rellena(piso2 - 12, 57, 61, '#')
  if (dura) z.pon(piso2 - 13, 59, 'V')
  else z.pon(piso2 - 13, 59, 'o')
  z.rellena(piso2 - 15, 50, 56, '#')
  z.pon(piso2 - 16, 53, 'M')
  z.pon(piso2 - 16, 50, 'o')
  z.pon(piso2 - 16, 56, 'o')

  return v % 2 ? espejo(z.filas()) : z.filas()
}

/**
 * SIMA laberíntica: se BAJA buceando y a la vez se cruza de lado a lado.
 * Estanterías de roca en S (cada una deja UN hueco en un extremo, alternando
 * lados): nada hasta el hueco, espera a que el pez o la medusa que lo guarda
 * se aparte, esquiva los pinchos del borde y baja al siguiente piso. Puerta
 * de mates en el canal final y meta en el fondo. Monedas por el camino y
 * premios en los rincones.
 */
function sima({ v = 0, dura = false }) {
  const H = 32
  const W = 60
  const z = rejilla(H, W)
  for (let r = 2; r <= H - 2; r++) z.rellena(r, 0, W - 1, '~')
  z.rellena(H - 1, 0, W - 1, '#')
  // repisa de salida arriba a la izquierda
  z.rellena(2, 0, 6, '#')
  z.pon(1, 2, 'P')
  z.pon(1, 5, 'G')

  const gap = dura ? 5 : 7
  const estantes = [
    [7, true], // hueco a la derecha
    [12, false], // hueco a la izquierda
    [17, true],
    [22, false],
    [27, true],
  ]
  estantes.forEach(([fila, abiertaDer], i) => {
    if (abiertaDer) z.rellena(fila, 0, W - 1 - gap, '#')
    else z.rellena(fila, gap, W - 1, '#')
    const borde = abiertaDer ? W - 1 - gap : gap
    // pinchos junto al hueco: no rozar el borde al bajar
    if (i % 2 === (dura ? 0 : 1)) {
      z.pon(fila - 1, abiertaDer ? borde - 2 : borde + 1, '^^')
    }
    // guardián del hueco: pez patrullando o medusa flotando (hay que ESPERAR)
    if (i % 2 === 0) z.pon(fila + 2, abiertaDer ? borde - 5 : borde + 4, 'f')
    else z.pon(fila + 2, abiertaDer ? W - 3 : 2, 'u')
    // monedas: rastro hacia el hueco y premio en el rincón cerrado
    z.pon(fila - 1, abiertaDer ? 10 : W - 13, 'ooo')
    if (dura) z.pon(fila + 2, abiertaDer ? 3 : W - 5, 'o')
  })
  // checkpoint a media bajada
  z.pon(16, 10, 'C')
  // en difícil, más patrullas en las travesías largas
  if (dura) {
    z.pon(9, 25, 'f')
    z.pon(19, 30, 'f')
    z.pon(24, 20, 'u')
  }
  // cámara de la meta: tras bajar el último hueco (derecha) hay que volver
  // nadando a la IZQUIERDA, y la única entrada es la puerta de mates (muro
  // sellado por el estante de arriba y el fondo)
  for (let r = H - 4; r <= H - 2; r++) z.pon(r, 48, 'D')
  z.pon(H - 2, 44, 'M')
  z.pon(H - 3, 40, 'oo')
  z.pon(H - 2, 3, 'oo') // rincón del fondo, premio de exploración

  return v % 2 ? espejo(z.filas()) : z.filas()
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
    mapa = torre({ v, dura })
    tema = dura ? 'castillo' : 'bosque'
    com = dura
      ? 'torre difícil: pasillos vigilados, caedizas y vigilante en las cornisas'
      : 'torre: pasillo con guardianes, trampolines obligatorios y puente parpadeante'
    if (i === 0) aviso = '🗼 ¡MUNDO 4! Sube y avanza: los MUELLES son el único camino hacia arriba'
  } else {
    const dura = zona >= 3
    mapa = sima({ v, dura })
    tema = dura ? 'cueva' : 'nieve'
    com = dura
      ? 'abismo profundo: huecos estrechos, patrullas dobles y pinchos'
      : 'abismo en S: espera a que el guardián de cada hueco se aparte'
    if (i === 7) aviso = '🌊 ¡Al ABISMO! Busca el hueco de cada piso y ESPERA a que el guardián se aparte'
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
  parMs: ${175000 + i * 2000},${aviso ? `\n  aviso: '${aviso}',` : ''}
}
`
  writeFileSync(join(dir, `nivel${n}.ts`), contenido, 'utf8')
}
console.log('niveles 109-143 escritos')
