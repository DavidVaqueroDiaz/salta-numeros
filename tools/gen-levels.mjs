// Genera los niveles 11-25 colocando elementos por coordenadas exactas.
// Uso: node tools/gen-levels.mjs   (escribe src/levels/nivel11.ts ... nivel25.ts)
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')

const COLORES = {
  1: '#e63946', 2: '#f77f00', 3: '#ffd60a', 4: '#52b788', 5: '#4cc9f0',
  6: '#3f37c9', 7: '#3a86ff', 8: '#ff5d8f', 9: '#9aa5b1', 10: '#adb5bd',
}

/** rejilla de filas×ancho llena de '.', con utilidades de colocación */
function rejilla(filas, ancho) {
  const g = Array.from({ length: filas }, () => Array(ancho).fill('.'))
  return {
    g,
    pon(r, c, texto) {
      for (let i = 0; i < texto.length; i++) g[r][c + i] = texto[i]
    },
    rellena(r, c0, c1, ch) {
      for (let c = c0; c <= c1; c++) g[r][c] = ch
    },
    filas: () => g.map((f) => f.join('')),
  }
}

/**
 * Nivel estándar de 11 filas × 110 cols:
 * puertas en cols 35 y 80 (filas 6-9 + techo en 5), P en (9,2), M en (9,105),
 * suelo con huecos [20-22] y [55-58] salvo que se pase `suelo` propio.
 */
function nivelEstandar({
  extras = [],
  huecos = [[20, 22], [55, 58]],
  hielo = [],
  lava = [],
}) {
  const W = 110
  const z = rejilla(11, W)
  for (const col of [35, 80]) {
    z.pon(5, col, '#')
    for (let r = 6; r <= 9; r++) z.pon(r, col, 'D')
  }
  z.pon(9, 2, 'P')
  z.pon(9, 105, 'M')
  z.rellena(10, 0, W - 1, '#')
  for (const [a, b] of huecos) z.rellena(10, a, b, '.')
  for (const [a, b] of hielo) z.rellena(10, a, b, 'I')
  for (const [a, b] of lava) z.rellena(10, a, b, 'L')
  for (const [r, c, texto] of extras) z.pon(r, c, texto)
  return z.filas()
}

const NIVELES = {
  11: {
    tema: 'cueva',
    tipo: 'multiplicacion', max: 9, par: 100000,
    comentario: 'Empieza la zona difícil: tablas hasta el 9 y un vigilante.',
    mapa: nivelEstandar({
      extras: [
        [6, 13, 'o'], [7, 12, '###'],
        [8, 16, 'G'], [8, 90, 'ooo'],
        [9, 28, 'E'], [9, 50, 'V'], [9, 62, 'C'], [9, 70, '^^'],
      ],
    }),
  },
  12: {
    tema: 'cueva',
    tipo: 'division', max: 9, par: 100000,
    comentario: 'Divisiones grandes y un vigilante tras las gafas.',
    mapa: nivelEstandar({
      extras: [
        [7, 45, 'ooo'], [8, 16, 'G'],
        [9, 30, 'E'], [9, 55, 'C'], [9, 70, 'V'], [9, 95, '^^'],
      ],
    }),
  },
  13: {
    tema: 'cueva',
    tipo: 'logica2', max: 12, par: 105000,
    comentario: 'Series lógicas avanzadas y dos vigilantes.',
    mapa: nivelEstandar({
      extras: [
        [6, 13, 'o'], [7, 12, '###'],
        [8, 16, 'G'], [8, 18, 'G'],
        [9, 25, '^^'], [9, 47, 'V'], [9, 62, 'C'], [9, 95, 'V'],
      ],
    }),
  },
  14: {
    tema: 'cueva',
    tipo: 'operacion', max: 9, par: 105000,
    comentario: 'Operaciones de dos pasos, plataforma móvil sobre el hueco.',
    mapa: nivelEstandar({
      extras: [
        [5, 56, 'ooo'],
        [8, 16, 'G'], [8, 57, 'm'],
        [9, 28, 'E'], [9, 50, 'E'], [9, 62, 'C'], [9, 88, 'V'],
      ],
    }),
  },
  15: {
    tema: 'cueva',
    tipo: 'reto2', max: 9, par: 110000,
    aviso: '🌈 ¡NUEVO! El arcoíris te deja VOLAR: mantén pulsado el salto',
    comentario: 'Aparece el arcoíris: hay que VOLAR sobre el barranco gigante.',
    mapa: nivelEstandar({
      huecos: [[20, 22], [55, 66]],
      extras: [
        [6, 56, 'o.o.o.o.o'],
        [8, 50, 'R'],
        [9, 30, 'E'], [9, 70, 'C'], [9, 90, 'E'],
      ],
    }),
  },
  16: {
    tema: 'volcan',
    tipo: 'multiplicacion', max: 9, par: 110000,
    comentario: 'Tablas hasta el 9 con dos vigilantes.',
    mapa: nivelEstandar({
      extras: [
        [6, 13, 'o'], [7, 12, '###'],
        [8, 16, 'G'], [8, 18, 'G'], [8, 90, 'ooo'],
        [9, 26, 'E'], [9, 46, 'V'], [9, 62, 'C'], [9, 70, '^^'], [9, 95, 'V'],
      ],
    }),
  },
  17: {
    tema: 'volcan',
    tipo: 'division', max: 9, par: 115000,
    comentario: 'Divisiones; el arcoíris permite alcanzar monedas altísimas.',
    mapa: nivelEstandar({
      extras: [
        [3, 45, 'ooo'],
        [8, 16, 'G'], [8, 20, 'R'],
        [9, 30, 'E'], [9, 62, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  18: {
    tema: 'volcan',
    tipo: 'logica2', max: 12, par: 115000,
    comentario: 'Series difíciles con vigilante de entrada y de salida.',
    mapa: nivelEstandar({
      extras: [
        [8, 16, 'G'], [8, 18, 'G'],
        [9, 28, 'V'], [9, 50, 'E'], [9, 62, 'C'], [9, 77, 'V'], [9, 95, '^^'],
      ],
    }),
  },
  19: {
    tema: 'volcan',
    tipo: 'operacion', max: 9, par: 120000,
    comentario: 'Dos pasos mentales, vuelo opcional y vigilante final.',
    mapa: nivelEstandar({
      extras: [
        [3, 33, 'ooo'], [5, 56, 'ooo'],
        [8, 16, 'G'], [8, 20, 'R'], [8, 57, 'm'],
        [9, 30, 'E'], [9, 62, 'C'], [9, 88, 'V'],
      ],
    }),
  },
  20: {
    tema: 'volcan',
    tipo: 'reto2', max: 9, par: 115000,
    aviso: '🎩 ¡NUEVO! El sombrero te teletransporta: toca a dónde quieres ir',
    comentario: 'Aparece el sombrero: un MURO infranqueable que solo se cruza con magia.',
    mapa: (() => {
      const filas = nivelEstandar({
        extras: [
          [8, 50, 'H'],
          [9, 30, 'E'], [9, 65, 'C'], [9, 90, 'V'],
        ],
      })
      // muro de columna completa en la col 60 (filas 0-9)
      return filas.map((f, r) =>
        r <= 9 ? f.slice(0, 60) + '#' + f.slice(61) : f,
      )
    })(),
  },
  21: {
    tema: 'nieve',
    tipo: 'reto2', max: 9, par: 120000,
    comentario: 'La cámara del tesoro: sellada, solo se entra (y sale) por teletransporte.',
    mapa: (() => {
      const W = 110
      const z = rejilla(11, W)
      for (const col of [35, 80]) {
        z.pon(5, col, '#')
        for (let r = 6; r <= 9; r++) z.pon(r, col, 'D')
      }
      z.pon(9, 2, 'P')
      z.pon(9, 105, 'M')
      z.rellena(10, 0, W - 1, '#')
      z.rellena(10, 20, 22, '.')
      z.rellena(10, 55, 58, '.')
      // cámara sellada (cols 26-32): techo, paredes, tesoro y pinchos de escape
      z.pon(5, 26, '#######')
      for (let r = 6; r <= 9; r++) {
        z.pon(r, 26, '#')
        z.pon(r, 32, '#')
      }
      z.pon(8, 28, 'oHo')
      z.pon(9, 31, '^')
      z.pon(8, 18, 'H')
      z.pon(8, 14, 'G')
      z.pon(9, 45, 'E')
      z.pon(9, 70, 'V')
      z.pon(9, 75, 'C')
      z.pon(9, 90, '^^')
      return z.filas()
    })(),
  },
  22: {
    tema: 'nieve',
    tipo: 'division', max: 9, par: 120000,
    comentario: 'Alfombra de pinchos enorme: se cruza volando.',
    mapa: nivelEstandar({
      huecos: [[20, 22]],
      extras: [
        [8, 16, 'G'], [8, 40, 'R'],
        [9, 30, 'E'], [9, 45, 'C'], [9, 55, '^^^^^^^^^^^^^^'], [9, 92, 'V'],
      ],
    }),
  },
  23: {
    tema: 'nieve',
    tipo: 'logica2', max: 12, par: 125000,
    comentario: 'Dos vigilantes, dos pares de gafas.',
    mapa: nivelEstandar({
      extras: [
        [6, 13, 'o'], [7, 12, '###'],
        [8, 16, 'G'], [8, 18, 'G'],
        [9, 26, 'E'], [9, 50, 'V'], [9, 62, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  24: {
    tema: 'nieve',
    tipo: 'operacion', max: 9, par: 125000,
    comentario: 'Otro muro mágico y un vigilante guardando la meta.',
    mapa: (() => {
      const filas = nivelEstandar({
        extras: [
          [8, 16, 'G'], [8, 20, 'H'], [8, 90, 'ooo'],
          [9, 40, 'E'], [9, 63, 'C'], [9, 75, 'V'],
        ],
      })
      return filas.map((f, r) =>
        r <= 9 ? f.slice(0, 58) + '#' + f.slice(59) : f,
      )
    })(),
  },
  25: {
    tema: 'nieve',
    tipo: 'reto2', max: 9, par: 150000,
    aviso: '🟢 ¡NUEVO! Toca el tubo para bucear. ¡Cuidado con los peces!',
    comentario: 'Los tubos llevan a una zona submarina con peces de pinchos.',
    mapa: (() => {
      const W = 110
      const z = rejilla(20, W)
      // puerta sobre el suelo superior
      z.pon(4, 30, '#')
      for (let r = 5; r <= 8; r++) z.pon(r, 30, 'D')
      z.pon(6, 10, 'ooo')
      z.pon(8, 2, 'P')
      z.pon(8, 40, 'T') // tubo de bajada
      z.pon(8, 105, 'M')
      // suelo superior: plataforma inicial, foso de pinchos y la isla de la meta
      z.rellena(9, 0, 49, '#')
      z.rellena(9, 55, 90, '^')
      z.rellena(9, 95, 109, '#')
      // pozo de agua que sube a la isla (cols 92-94)
      for (const r of [8, 9]) z.pon(r, 92, '~~~')
      // separador y zona submarina
      z.rellena(10, 0, 109, '#')
      z.pon(10, 92, '~~~')
      for (let r = 11; r <= 18; r++) {
        z.rellena(r, 1, 108, '~')
        z.pon(r, 0, '#')
        z.pon(r, 109, '#')
      }
      // estalactitas y pilares
      for (const r of [11, 12]) z.pon(r, 25, '#')
      for (const r of [11, 12, 13]) z.pon(r, 55, '#')
      for (const r of [15, 16, 17, 18]) {
        z.pon(r, 40, '#')
        z.pon(r, 75, '#')
      }
      // peces con pinchos
      z.pon(14, 30, 'f')
      z.pon(14, 65, 'f')
      z.pon(14, 90, 'f')
      // tubo de salida (vuelve arriba) y fondo
      z.pon(18, 3, 'T')
      z.rellena(19, 0, 109, '#')
      return z.filas()
    })(),
  },
  // ----- MUNDO HIELO (26-28): el suelo helado resbala -----
  26: {
    tema: 'nieve',
    tipo: 'mitadDoble', max: 12, par: 120000,
    aviso: '🧊 ¡El suelo de hielo RESBALA! Frena con tiempo',
    comentario: 'Primer nivel de hielo: derrapes, dobles y mitades.',
    mapa: nivelEstandar({
      hielo: [[24, 54], [59, 90]],
      extras: [
        [8, 16, 'G'], [8, 90, 'ooo'],
        [9, 30, 'E'], [9, 50, 'V'], [9, 62, 'C'],
      ],
    }),
  },
  27: {
    tema: 'nieve',
    tipo: 'reto2', max: 9, par: 125000,
    comentario: 'Hielo desde la salida y pinchos donde frenar mal.',
    mapa: nivelEstandar({
      hielo: [[0, 19], [23, 54]],
      extras: [
        [6, 13, 'o'], [7, 12, '###'],
        [8, 16, 'G'],
        [9, 28, 'E'], [9, 45, 'E'], [9, 62, 'C'], [9, 70, '^^'], [9, 90, 'V'],
      ],
    }),
  },
  28: {
    tema: 'nieve',
    tipo: 'reto3', max: 12, par: 130000,
    comentario: 'Hielo final con puente que se cae y vuelo opcional.',
    mapa: nivelEstandar({
      hielo: [[59, 109]],
      extras: [
        [3, 45, 'ooo'],
        [8, 16, 'G'], [8, 20, 'R'], [8, 55, 'F.F'],
        [9, 30, 'E'], [9, 62, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  // ----- MUNDO ESPACIO (29-31): gravedad lunar -----
  29: {
    tema: 'espacio', gravedadBaja: true,
    tipo: 'mitadDoble', max: 12, par: 125000,
    aviso: '🌌 ¡Gravedad lunar! Saltos gigantes y flotantes',
    comentario: 'Primer nivel lunar: barrancos enormes que se cruzan flotando.',
    mapa: nivelEstandar({
      huecos: [[20, 27], [55, 64]],
      extras: [
        [3, 45, 'ooo'], [6, 56, 'o.o.o'],
        [8, 16, 'G'],
        [9, 40, 'E'], [9, 70, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  30: {
    tema: 'espacio', gravedadBaja: true,
    tipo: 'reto3', max: 12, par: 130000,
    comentario: 'Tres barrancos lunares y plataformas altísimas.',
    mapa: nivelEstandar({
      huecos: [[18, 28], [50, 60], [83, 89]],
      extras: [
        [4, 33, '###'], [3, 34, 'o'],
        [2, 56, '###'], [1, 57, 'o'],
        [8, 90, 'ooo'],
        [9, 40, 'E'], [9, 70, 'C'], [9, 95, 'E'],
      ],
    }),
  },
  31: {
    tema: 'espacio', gravedadBaja: true,
    tipo: 'reto2', max: 9, par: 130000,
    comentario: 'Vigilantes lunares y pinchos cerca de la meta.',
    mapa: nivelEstandar({
      huecos: [[20, 30]],
      extras: [
        [5, 56, 'ooo'],
        [8, 16, 'G'],
        [9, 45, 'V'], [9, 65, 'E'], [9, 70, 'C'], [9, 90, '^^^'],
      ],
    }),
  },
  // ----- MUNDO CASTILLO (32-35): lava mortal y plataformas que parpadean -----
  32: {
    tema: 'castillo',
    tipo: 'reto3', max: 12, par: 135000,
    aviso: '🔥 ¡La lava QUEMA! Cruza por las plataformas mágicas',
    comentario: 'Primer foso de lava con puente de plataformas parpadeantes.',
    mapa: nivelEstandar({
      lava: [[40, 52]],
      extras: [
        [8, 41, 'b'], [8, 44, 'b'], [8, 47, 'b'], [8, 50, 'b'],
        [6, 90, 'ooo'],
        [8, 16, 'G'],
        [9, 28, 'E'], [9, 66, 'C'], [9, 73, 'V'], [9, 90, '^^'],
      ],
    }),
  },
  33: {
    tema: 'castillo',
    tipo: 'reto3', max: 12, par: 140000,
    comentario: 'Dos fosos de lava con puentes parpadeantes.',
    mapa: nivelEstandar({
      huecos: [[20, 22]],
      lava: [[24, 33], [58, 70]],
      extras: [
        [8, 25, 'b'], [8, 28, 'b'], [8, 31, 'b'],
        [8, 59, 'b'], [8, 62, 'b'], [8, 65, 'b'], [8, 68, 'b'],
        [7, 45, 'ooo'],
        [8, 16, 'G'],
        [9, 45, 'E'], [9, 50, 'C'], [9, 88, 'V'],
      ],
    }),
  },
  34: {
    tema: 'castillo',
    tipo: 'reto3', max: 12, par: 140000,
    comentario: 'Lava con puente mixto: tablones que caen y cristales que parpadean.',
    mapa: nivelEstandar({
      lava: [[40, 52]],
      extras: [
        [3, 75, 'ooo'],
        [8, 20, 'R'],
        [8, 41, 'F'], [8, 44, 'b'], [8, 47, 'F'], [8, 50, 'b'],
        [8, 16, 'G'],
        [9, 30, 'E'], [9, 62, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  35: {
    tema: 'castillo',
    tipo: 'reto3', max: 12, par: 150000,
    comentario: 'La antesala del jefe: dos fosos, dos vigilantes y un sombrero.',
    mapa: nivelEstandar({
      lava: [[24, 31], [55, 66]],
      extras: [
        [8, 18, 'H'],
        [8, 25, 'b'], [8, 28, 'b'],
        [8, 56, 'b'], [8, 59, 'b'], [8, 62, 'b'], [8, 65, 'b'],
        [6, 90, 'ooo'],
        [8, 14, 'G'], [9, 50, 'V'],
        [8, 16, 'G'], [9, 90, 'V'],
        [9, 45, 'E'], [9, 70, 'C'],
      ],
    }),
  },
}

for (const [n, def] of Object.entries(NIVELES)) {
  // el personaje ya no depende del nivel (se elige en la tienda); el campo
  // numero solo se usa como semilla visual, capado a los estilos existentes
  const numero = Math.min(Number(n), 25)
  const colorUi = ((n - 1) % 10) + 1 // color del botón/HUD: cicla la paleta base
  const aviso =
    (def.tema ? `\n  tema: '${def.tema}',` : '') +
    (def.gravedadBaja ? '\n  gravedadBaja: true,' : '') +
    (def.aviso ? `\n  aviso: '${def.aviso}',` : '')
  const contenido = `import type { LevelData } from './types'

// Nivel ${n}: ${def.comentario}
// (generado con tools/gen-levels.mjs; puede editarse a mano)
export const nivel${n}: LevelData = {
  numero: ${numero},
  color: '${COLORES[colorUi]}',
  mapa: [
${def.mapa.map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: '${def.tipo}', max: ${def.max} },
  parMs: ${def.par},${aviso}
}
`
  writeFileSync(join(dir, `nivel${n}.ts`), contenido, 'utf8')
  console.log(`nivel${n}.ts escrito`)
}
