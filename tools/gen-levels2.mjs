// Genera las fases del MUNDO 2 (niveles 37-71) colocando elementos por
// coordenadas. Uso: node tools/gen-levels2.mjs
//   (escribe src/levels/nivel37.ts ... nivel71.ts)
//
// Reaprovecha todas las mecánicas del juego (agua/peces, lava/parpadeantes,
// hielo, gravedad lunar, plataformas móviles/caedizas, muros mágicos con
// sombrero, vuelo con arcoíris) con recorridos de obstáculos, laberintos y
// mates más altas. La dificultad (Fácil/Medio/Difícil) añade bichos y sube las
// mates en tiempo de ejecución; aquí van los bichos "base".
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')

// contador para variar el patrón de la ruta alta entre fases (no repetirse)
let _seedAlta = 0

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
    col(c, r0, r1, ch) {
      for (let r = r0; r <= r1; r++) g[r][c] = ch
    },
    filas: () => g.map((f) => f.join('')),
  }
}

/**
 * Nivel estándar de tierra (11 filas × W). Suelo abajo con huecos; puertas
 * sobre el suelo; P a la izquierda y M a la derecha. `extras` coloca cualquier
 * cosa por [fila, col, texto] (plataformas '#', enemigos, ítems, hielo, etc.).
 */
function estandar({
  W = 116,
  huecos = [[24, 28], [66, 70]],
  hielo = [],
  lava = [],
  puertas = [40, 86],
  extras = [],
  rutaAlta = true, // camino alternativo por arriba (plataformas escalonadas)
  altaExtras = [],
}) {
  const z = rejilla(11, W)
  z.pon(9, 2, 'P')
  z.pon(9, W - 5, 'M')
  z.rellena(10, 0, W - 1, '#')
  for (const [a, b] of huecos) z.rellena(10, a, b, '.')
  for (const [a, b] of hielo) z.rellena(10, a, b, 'I')
  for (const [a, b] of lava) z.rellena(10, a, b, 'L')
  // ruta alta: plataformas a distintas alturas para saltar de una a otra
  // (camino alternativo con monedas de premio y algún bicho de reto)
  if (rutaAlta) {
    // patrón de alturas distinto en cada fase para que no se parezcan
    const PATRONES = [
      [5, 3, 6, 4, 5, 3, 6, 4],
      [3, 6, 4, 7, 3, 5, 6, 4],
      [6, 4, 3, 5, 7, 4, 6, 3],
      [4, 7, 5, 3, 6, 4, 7, 5],
      [7, 4, 6, 3, 5, 7, 4, 6],
    ]
    const alturas = PATRONES[_seedAlta++ % PATRONES.length]
    let i = 0
    for (let col = 12; col <= W - 20; col += 10) {
      const r = alturas[i % alturas.length]
      z.pon(r, col, '####')
      // casi todas las plataformas dan monedas; algunas, un bicho de reto
      if (i % 4 === 2) z.pon(r - 1, col + 1, 'E')
      else z.pon(r - 1, col + 1, 'ooo')
      // moneda escondida más arriba (hay que saltar desde la plataforma)
      if (i % 3 === 0 && r - 3 >= 0) z.pon(r - 3, col + 1, 'o')
      i++
    }
  }
  // monedas flotando sobre los barrancos (hay que saltar a por ellas)
  for (const [a, b] of huecos) z.pon(7, Math.floor((a + b) / 2), 'o')
  for (const [r, c, texto] of altaExtras) z.pon(r, c, texto)
  for (const [r, c, texto] of extras) z.pon(r, c, texto)
  // puertas al final: columna despejada por encima y suelo firme debajo
  for (const col of puertas) {
    z.col(col, 0, 4, '.')
    z.pon(5, col, '#')
    for (let r = 6; r <= 9; r++) z.pon(r, col, 'D')
    z.pon(10, col, '#')
  }
  return z.filas()
}

/**
 * Nivel de AGUA con buceo (20 filas × 110). Arriba se camina; un tubo baja a
 * una zona submarina llena de peces de pinchos; otro tubo sube a la isla de la
 * meta. `peces` = lista [fila, col]; `pilares` = [fila0, fila1, col] de roca.
 */
function agua({
  doorCols = [22],
  topExtras = [],
  pilares = [],
  peces = [],
  tuboBaja = 40,
  tuboSube = 4,
}) {
  const W = 110
  const z = rejilla(20, W)
  z.pon(8, 2, 'P')
  z.pon(8, tuboBaja, 'T') // tubo de bajada
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
  for (const [r0, r1, c] of pilares) z.col(c, r0, r1, '#')
  for (const [r, c] of peces) z.pon(r, c, 'f')
  // monedas escondidas en el fondo del agua (hay que bucear hondo a por ellas)
  for (const [r, c] of [[15, 20], [17, 48], [13, 64], [16, 82], [15, 100]]) z.pon(r, c, 'o')
  for (const [r, c, texto] of topExtras) z.pon(r, c, texto)
  // tubo de salida (vuelve arriba) y fondo
  z.pon(18, tuboSube, 'T')
  z.rellena(19, 0, 109, '#')
  // puerta(s) al final, sobre el suelo superior sólido (cols 0-49)
  for (const col of doorCols) {
    z.col(col, 0, 3, '.')
    z.pon(4, col, '#')
    for (let r = 5; r <= 8; r++) z.pon(r, col, 'D')
    z.pon(9, col, '#')
  }
  return z.filas()
}

/**
 * Nivel LABERINTO (11 filas × W): paredes interiores que obligan a trepar
 * saltando y, en algunas, a teletransportarse con el sombrero (hay H para ello).
 * `muros` = lista de columnas con pared completa (0-9). `cortos` = [c, altura]
 * paredes bajas que se saltan. `extras` para enemigos/ítems/plataformas.
 */
function laberinto({ W = 116, muros = [], cortos = [], huecos = [], puertas = [58], extras = [] }) {
  const z = rejilla(11, W)
  z.pon(9, 2, 'P')
  z.pon(9, W - 5, 'M')
  z.rellena(10, 0, W - 1, '#')
  for (const [a, b] of huecos) z.rellena(10, a, b, '.')
  for (const c of muros) z.col(c, 0, 9, '#') // pared completa: solo con sombrero
  for (const [c, alt] of cortos) z.col(c, 10 - alt, 9, '#') // pared baja: saltable
  for (const [r, c, texto] of extras) z.pon(r, c, texto)
  // puertas al final: columna despejada por encima y suelo firme debajo
  for (const col of puertas) {
    z.col(col, 0, 4, '.')
    z.pon(5, col, '#')
    for (let r = 6; r <= 9; r++) z.pon(r, col, 'D')
    z.pon(10, col, '#')
  }
  return z.filas()
}

// ----------------------------------------------------------------------------
// Definición de las 35 fases del Mundo 2, por zonas temáticas.
// ----------------------------------------------------------------------------
const NIVELES = {
  // ===== ZONA AGUA (37-41): mucho buceo y muchos peces =====
  37: {
    tema: 'cueva', tipo: 'reto2', max: 9, par: 140000,
    aviso: '🌊 ¡MUNDO 2! Bucea por los tubos… ¡el agua está llena de peces!',
    comentario: 'Primera fase acuática del Mundo 2: cuatro peces y buceo.',
    mapa: agua({
      doorCols: [22],
      topExtras: [[6, 10, 'ooo'], [8, 16, 'G']],
      pilares: [[14, 18, 30], [13, 18, 70]],
      peces: [[13, 22], [15, 45], [12, 60], [16, 85]],
    }),
  },
  38: {
    tema: 'cueva', tipo: 'division', max: 9, par: 145000,
    comentario: 'Más peces y pilares de roca para esquivar bajo el agua.',
    mapa: agua({
      doorCols: [18, 34],
      topExtras: [[6, 28, 'ooo'], [8, 14, 'G']],
      pilares: [[12, 18, 25], [11, 18, 50], [13, 18, 78]],
      peces: [[13, 20], [16, 35], [12, 48], [15, 62], [13, 80], [16, 95]],
    }),
  },
  39: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 150000,
    comentario: 'Banco de peces helado: seis peces y rocas estrechas.',
    mapa: agua({
      doorCols: [25],
      topExtras: [[6, 10, 'ooo'], [8, 16, 'G'], [3, 45, 'ooo']],
      pilares: [[11, 18, 35], [11, 18, 55], [11, 18, 75]],
      peces: [[13, 18], [16, 30], [12, 45], [15, 50], [13, 68], [16, 90]],
    }),
  },
  40: {
    tema: 'nieve', tipo: 'operacion', max: 9, par: 150000,
    comentario: 'Buceo largo con seis peces repartidos por todo el fondo.',
    mapa: agua({
      doorCols: [20, 42],
      topExtras: [[8, 14, 'G'], [6, 30, 'ooo']],
      pilares: [[13, 18, 28], [12, 18, 60], [14, 18, 88]],
      peces: [[12, 22], [15, 38], [13, 52], [16, 66], [12, 80], [15, 98]],
    }),
  },
  41: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 155000,
    comentario: 'La gran cueva submarina: siete peces y un laberinto de pilares.',
    mapa: agua({
      doorCols: [24],
      topExtras: [[8, 16, 'G'], [6, 10, 'ooo'], [3, 70, 'ooo']],
      pilares: [[11, 18, 22], [13, 18, 40], [11, 18, 58], [13, 18, 76], [11, 18, 94]],
      peces: [[16, 16], [12, 32], [15, 48], [12, 66], [16, 70], [13, 84], [15, 100]],
    }),
  },

  // ===== ZONA LAVA (42-46): fosos de lava con puentes que parpadean =====
  42: {
    tema: 'volcan', tipo: 'reto3', max: 12, par: 145000,
    aviso: '🔥 ¡Vuelven los volcanes! Cruza la lava por las plataformas mágicas',
    comentario: 'Foso de lava con puente de plataformas parpadeantes.',
    mapa: estandar({
      lava: [[40, 54]],
      extras: [
        [8, 41, 'b'], [8, 44, 'b'], [8, 47, 'b'], [8, 50, 'b'], [8, 53, 'b'],
        [6, 92, 'ooo'], [8, 16, 'G'],
        [9, 30, 'E'], [9, 64, 'C'], [9, 76, 'V'], [9, 92, '^^'],
      ],
    }),
  },
  43: {
    tema: 'volcan', tipo: 'reto3', max: 12, par: 150000,
    comentario: 'Dos ríos de lava con plataformas que caen y que parpadean.',
    mapa: estandar({
      huecos: [],
      lava: [[24, 33], [60, 72]],
      extras: [
        [8, 25, 'F'], [8, 28, 'b'], [8, 31, 'F'],
        [8, 61, 'b'], [8, 64, 'b'], [8, 67, 'b'], [8, 70, 'b'],
        [7, 47, 'ooo'], [8, 16, 'G'],
        [9, 45, 'E'], [9, 52, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  44: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 150000,
    comentario: 'Plataformas móviles cruzando un lago de lava enorme.',
    mapa: estandar({
      huecos: [],
      lava: [[34, 60]],
      extras: [
        [8, 38, 'm'], [8, 52, 'm'],
        [3, 47, 'ooo'], [8, 16, 'G'], [8, 20, 'R'],
        [9, 28, 'E'], [9, 66, 'C'], [9, 88, 'V'],
      ],
    }),
  },
  45: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 152000,
    comentario: 'Puente mixto de lava: parpadeantes, móviles y dos vigilantes.',
    mapa: estandar({
      huecos: [[24, 28]],
      lava: [[58, 74]],
      extras: [
        [8, 59, 'b'], [8, 62, 'b'], [8, 66, 'm'], [8, 71, 'b'],
        [6, 90, 'ooo'], [8, 16, 'G'],
        [9, 40, 'V'], [9, 50, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  46: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 152000,
    comentario: 'Mar de lava: hay que VOLAR con el arcoíris para cruzarlo.',
    mapa: estandar({
      huecos: [],
      lava: [[40, 64]],
      extras: [
        [3, 52, 'o.o.o.o'], [8, 20, 'R'], [8, 16, 'G'],
        [9, 30, 'E'], [9, 70, 'C'], [9, 92, 'V'],
      ],
    }),
  },

  // ===== ZONA OBSTÁCULOS (47-51): saltar de unas estructuras a otras =====
  47: {
    tema: 'bosque', tipo: 'operacion', max: 9, par: 150000,
    aviso: '🟩 ¡Recorrido de obstáculos! Salta de plataforma en plataforma',
    comentario: 'Plataformas flotantes y barrancos: puro plataformeo.',
    mapa: estandar({
      huecos: [[22, 28], [48, 54], [70, 76]],
      extras: [
        [6, 23, '#####'], [4, 49, '#####'], [6, 71, '#####'],
        [5, 24, 'ooo'], [3, 50, 'ooo'],
        [8, 16, 'G'],
        [9, 38, 'E'], [9, 62, 'C'], [9, 90, 'E'],
      ],
    }),
  },
  48: {
    tema: 'bosque', tipo: 'reto2', max: 9, par: 152000,
    comentario: 'Cadena de plataformas que se caen sobre los barrancos.',
    mapa: estandar({
      huecos: [[24, 30], [60, 66]],
      extras: [
        [8, 25, 'F'], [8, 27, 'F'], [8, 29, 'F'],
        [8, 61, 'F'], [8, 63, 'F'], [8, 65, 'F'],
        [5, 45, 'ooo'], [8, 16, 'G'],
        [9, 40, 'E'], [9, 52, 'C'], [9, 88, 'V'],
      ],
    }),
  },
  49: {
    tema: 'pradera', tipo: 'reto3', max: 12, par: 152000,
    comentario: 'Plataformas móviles y torres de bloques con monedas altas.',
    mapa: estandar({
      huecos: [[26, 32], [64, 70]],
      extras: [
        [8, 27, 'm'], [8, 65, 'w'],
        [5, 45, '###'], [4, 46, 'o'], [2, 80, '###'], [1, 81, 'o'],
        [8, 16, 'G'],
        [9, 40, 'E'], [9, 56, 'C'], [9, 90, 'E'],
      ],
    }),
  },
  50: {
    tema: 'bosque', tipo: 'reto3', max: 12, par: 154000,
    comentario: 'Estructuras altas: el arcoíris ayuda a alcanzar los tesoros.',
    mapa: estandar({
      huecos: [[24, 30], [58, 64]],
      extras: [
        [6, 25, '#####'], [4, 26, 'ooo'],
        [4, 59, '#####'], [2, 60, 'ooo'],
        [8, 20, 'R'], [8, 16, 'G'],
        [9, 44, 'E'], [9, 70, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  51: {
    tema: 'pradera', tipo: 'reto3', max: 12, par: 156000,
    comentario: 'Gran circuito de saltos: móviles, caedizas y plataformas.',
    mapa: estandar({
      huecos: [[22, 27], [44, 49], [70, 75]],
      extras: [
        [6, 23, '###'], [8, 45, 'm'], [6, 71, '###'],
        [8, 35, 'F'], [8, 37, 'F'],
        [5, 60, 'ooo'], [8, 16, 'G'],
        [9, 56, 'C'], [9, 88, 'E'], [9, 30, 'E'],
      ],
    }),
  },

  // ===== ZONA HIELO (52-56): el suelo resbala =====
  52: {
    tema: 'nieve', tipo: 'mitadDoble', max: 12, par: 150000,
    aviso: '🧊 ¡Hielo del Mundo 2! Resbala muchísimo, frena con tiempo',
    comentario: 'Hielo largo con saltos sobre los barrancos.',
    mapa: estandar({
      hielo: [[24, 64], [70, 110]],
      huecos: [],
      extras: [
        [8, 16, 'G'], [6, 90, 'ooo'],
        [9, 34, 'E'], [9, 52, 'V'], [9, 66, 'C'],
      ],
    }),
  },
  53: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 152000,
    comentario: 'Hielo con pinchos donde se frena tarde.',
    mapa: estandar({
      hielo: [[0, 22], [28, 64]],
      huecos: [],
      extras: [
        [6, 13, 'o'], [7, 12, '###'], [8, 16, 'G'],
        [9, 30, 'E'], [9, 45, '^^'], [9, 58, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  54: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 154000,
    comentario: 'Hielo con plataformas que se caen sobre el barranco.',
    mapa: estandar({
      hielo: [[28, 64]],
      huecos: [[24, 27]],
      extras: [
        [8, 70, 'F'], [8, 73, 'F'], [8, 76, 'F'],
        [3, 45, 'ooo'], [8, 16, 'G'], [8, 20, 'R'],
        [9, 34, 'E'], [9, 60, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  55: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 154000,
    comentario: 'Hielo y lava juntos: derrapa pero no caigas al fuego.',
    mapa: estandar({
      hielo: [[24, 44]],
      lava: [[60, 72]],
      huecos: [],
      extras: [
        [8, 61, 'b'], [8, 64, 'b'], [8, 67, 'b'], [8, 70, 'b'],
        [8, 16, 'G'], [6, 90, 'ooo'],
        [9, 34, 'E'], [9, 52, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  56: {
    tema: 'nieve', tipo: 'reto3', max: 12, par: 156000,
    comentario: 'Hielo total con vuelo de arcoíris para los atajos.',
    mapa: estandar({
      hielo: [[20, 110]],
      huecos: [],
      extras: [
        [3, 50, 'o.o.o'], [8, 20, 'R'], [8, 16, 'G'],
        [9, 34, 'E'], [9, 52, 'V'], [9, 66, 'C'], [9, 92, 'E'],
      ],
    }),
  },

  // ===== ZONA ESPACIO (57-61): gravedad lunar =====
  57: {
    tema: 'espacio', gravedadBaja: true, tipo: 'reto3', max: 12, par: 152000,
    aviso: '🌌 ¡Gravedad lunar! Saltos gigantes para cruzar el espacio',
    comentario: 'Barrancos lunares enormes que se cruzan flotando.',
    mapa: estandar({
      huecos: [[24, 33], [60, 70]],
      extras: [
        [3, 47, 'ooo'], [6, 64, 'o.o.o'],
        [8, 16, 'G'],
        [9, 44, 'E'], [9, 76, 'C'], [9, 92, 'V'],
      ],
    }),
  },
  58: {
    tema: 'espacio', gravedadBaja: true, tipo: 'reto3', max: 12, par: 154000,
    comentario: 'Plataformas altísimas que solo se alcanzan en la Luna.',
    mapa: estandar({
      huecos: [[26, 34]],
      extras: [
        [5, 40, '###'], [3, 41, 'o'], [2, 60, '###'], [1, 61, 'o'],
        [5, 80, '###'], [8, 16, 'G'],
        [9, 50, 'E'], [9, 70, 'C'], [9, 95, 'E'],
      ],
    }),
  },
  59: {
    tema: 'espacio', gravedadBaja: true, tipo: 'reto2', max: 9, par: 154000,
    comentario: 'Plataformas móviles flotando sobre el vacío lunar.',
    mapa: estandar({
      huecos: [[24, 34], [62, 70]],
      extras: [
        [7, 28, 'm'], [6, 64, 'w'],
        [5, 48, 'ooo'], [8, 16, 'G'],
        [9, 44, 'V'], [9, 78, 'C'], [9, 92, 'E'],
      ],
    }),
  },
  60: {
    tema: 'espacio', gravedadBaja: true, tipo: 'reto3', max: 12, par: 156000,
    comentario: 'Lava lunar: cráteres de fuego que se saltan flotando.',
    mapa: estandar({
      huecos: [],
      lava: [[26, 36], [60, 72]],
      extras: [
        [3, 47, 'ooo'], [8, 16, 'G'], [8, 20, 'R'],
        [9, 44, 'E'], [9, 52, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  61: {
    tema: 'espacio', gravedadBaja: true, tipo: 'reto3', max: 12, par: 158000,
    comentario: 'Estación espacial: barrancos, plataformas y dos vigilantes.',
    mapa: estandar({
      huecos: [[22, 31], [66, 74]],
      extras: [
        [5, 44, '###'], [3, 45, 'o'], [7, 56, 'm'],
        [8, 16, 'G'],
        [9, 38, 'V'], [9, 80, 'C'], [9, 92, 'V'],
      ],
    }),
  },

  // ===== ZONA LABERINTO (62-66): trepar y teletransportarse =====
  62: {
    tema: 'cueva', tipo: 'reto3', max: 12, par: 156000,
    aviso: '🧩 ¡Laberinto! Trepa saltando y usa el sombrero en los muros',
    comentario: 'Paredes bajas que se saltan y un muro mágico con sombrero.',
    mapa: laberinto({
      puertas: [30],
      cortos: [[20, 3], [44, 4], [70, 3], [96, 4]],
      muros: [56],
      extras: [
        [8, 16, 'G'], [8, 50, 'H'],
        [9, 38, 'E'], [9, 64, 'C'], [9, 84, 'E'],
        [6, 90, 'ooo'],
      ],
    }),
  },
  63: {
    tema: 'cueva', tipo: 'reto3', max: 12, par: 158000,
    comentario: 'Más muros y escalones: laberinto vertical.',
    mapa: laberinto({
      puertas: [38],
      cortos: [[16, 3], [26, 5], [50, 4], [62, 5], [88, 4]],
      muros: [74],
      extras: [
        [8, 16, 'G'], [8, 68, 'H'],
        [9, 44, 'E'], [9, 56, 'C'], [9, 92, 'V'],
        [4, 27, 'o'], [3, 63, 'o'],
      ],
    }),
  },
  64: {
    tema: 'cueva', tipo: 'reto3', max: 12, par: 158000,
    comentario: 'Laberinto con vigilantes escondidos tras los muros.',
    mapa: laberinto({
      puertas: [34],
      cortos: [[22, 4], [48, 5], [80, 4]],
      muros: [60, 92],
      extras: [
        [8, 16, 'G'], [8, 54, 'H'], [8, 86, 'H'],
        [9, 42, 'V'], [9, 68, 'C'], [9, 96, 'V'],
      ],
    }),
  },
  65: {
    tema: 'volcan', tipo: 'reto3', max: 12, par: 160000,
    comentario: 'Laberinto ardiente: muros, escalones y un río de lava.',
    mapa: laberinto({
      puertas: [30],
      cortos: [[18, 4], [44, 5], [88, 4]],
      muros: [62],
      huecos: [],
      extras: [
        [8, 16, 'G'], [8, 56, 'H'],
        [10, 70, 'LLLLLL'], [8, 71, 'b'], [8, 74, 'b'],
        [9, 38, 'E'], [9, 50, 'C'], [9, 96, 'V'],
      ],
    }),
  },
  66: {
    tema: 'volcan', tipo: 'reto3', max: 12, par: 162000,
    comentario: 'El laberinto más duro: muros, escalones y plataformas que caen.',
    mapa: laberinto({
      puertas: [40],
      cortos: [[14, 3], [24, 5], [52, 5], [78, 4], [98, 5]],
      muros: [64],
      extras: [
        [8, 16, 'G'], [8, 58, 'H'],
        [8, 30, 'F'], [8, 33, 'F'],
        [9, 46, 'E'], [9, 70, 'C'], [9, 92, 'V'],
        [3, 53, 'o'],
      ],
    }),
  },

  // ===== ZONA MEZCLA FINAL (67-71): todo junto, antes del Mago =====
  67: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 160000,
    aviso: '⚔️ ¡La recta final hacia el Mago Oscuro! Todo se complica',
    comentario: 'Hielo, lava y plataformas: el aperitivo del castillo final.',
    mapa: estandar({
      hielo: [[20, 36]],
      lava: [[58, 70]],
      huecos: [],
      extras: [
        [8, 59, 'b'], [8, 62, 'b'], [8, 65, 'm'], [8, 69, 'b'],
        [8, 16, 'G'], [8, 20, 'R'],
        [9, 30, 'E'], [9, 48, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  68: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 162000,
    comentario: 'Plataformas sobre lava y barrancos con caedizas.',
    mapa: estandar({
      huecos: [[24, 30]],
      lava: [[58, 70]],
      extras: [
        [8, 25, 'F'], [8, 27, 'F'],
        [8, 60, 'm'], [8, 66, 'b'],
        [5, 45, 'ooo'], [8, 16, 'G'], [8, 20, 'R'],
        [9, 40, 'E'], [9, 50, 'C'], [9, 90, 'V'],
      ],
    }),
  },
  69: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 164000,
    comentario: 'Muro mágico, lava y vigilantes: casi en la torre del Mago.',
    mapa: laberinto({
      puertas: [34],
      cortos: [[20, 4], [76, 4]],
      muros: [50],
      extras: [
        [8, 16, 'G'], [8, 44, 'H'],
        [10, 60, 'LLLLLLLL'], [8, 61, 'b'], [8, 64, 'b'], [8, 67, 'b'],
        [9, 28, 'V'], [9, 84, 'C'], [9, 96, 'V'],
      ],
    }),
  },
  70: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 166000,
    comentario: 'Circuito completo: hielo, móviles, caedizas y lava.',
    mapa: estandar({
      hielo: [[22, 36]],
      lava: [[78, 88]],
      huecos: [[50, 56]],
      extras: [
        [8, 51, 'm'],
        [8, 79, 'b'], [8, 82, 'b'], [8, 85, 'b'],
        [5, 65, 'ooo'], [8, 16, 'G'], [8, 20, 'R'],
        [9, 40, 'E'], [9, 60, 'C'], [9, 96, 'V'],
      ],
    }),
  },
  71: {
    tema: 'castillo', tipo: 'reto3', max: 12, par: 170000,
    comentario: 'La antesala del Mago Oscuro: todo lo aprendido a la vez.',
    mapa: estandar({
      hielo: [[20, 32]],
      lava: [[44, 52], [74, 84]],
      huecos: [],
      extras: [
        [8, 45, 'b'], [8, 48, 'b'], [8, 51, 'b'],
        [8, 75, 'm'], [8, 81, 'b'],
        [8, 16, 'G'], [8, 20, 'R'], [3, 62, 'ooo'],
        [9, 36, 'V'], [9, 60, 'C'], [9, 96, 'V'],
      ],
    }),
  },
}

// ----- FASE FINAL DEL MUNDO 2: recorrido con obstáculos y, al final, el
// Mago Oscuro (Z) y Xiana (X) enjaulada. -----
function bossMundo2() {
  const W = 190
  const z = rejilla(11, W)
  z.pon(9, 2, 'P')
  z.rellena(10, 0, W - 1, '#')
  // recorrido: dos barrancos con plataformas y un foso de lava con puente
  z.rellena(10, 40, 45, '.')
  z.rellena(10, 104, 109, '.')
  z.pon(7, 41, '####')
  z.pon(6, 105, '####')
  z.rellena(10, 72, 84, 'L')
  z.pon(8, 73, 'b')
  z.pon(8, 76, 'b')
  z.pon(8, 79, 'b')
  z.pon(8, 82, 'b')
  // ítems para usar los poderes aprendidos
  z.pon(8, 16, 'G')
  z.pon(8, 30, 'R')
  z.pon(8, 120, 'H')
  // monedas
  z.pon(6, 42, 'o')
  z.pon(7, 92, 'ooo')
  z.pon(4, 60, 'ooo')
  // enemigos y vigilantes por el camino
  z.pon(9, 50, 'E')
  z.pon(9, 95, 'V')
  z.pon(9, 130, 'E')
  z.pon(9, 150, 'V')
  // punto de control antes del jefe
  z.pon(9, 140, 'C')
  // puerta de mates a mitad de camino
  z.pon(5, 58, '#')
  for (let r = 6; r <= 9; r++) z.pon(r, 58, 'D')
  z.pon(10, 58, '#')
  // ¡el Mago Oscuro espera AL FINAL!
  z.pon(9, 165, 'Z')
  // Xiana enjaulada al fondo del todo
  z.pon(9, 182, 'X')
  return z.filas()
}
{
  const mapa = bossMundo2()
  const contenido = `import type { LevelData } from './types'

// FASE FINAL DEL MUNDO 2: el MAGO OSCURO ha vuelto a encerrar a Xiana.
// Se teletransporta sin parar, invoca bichos y lanza rayos mágicos. Pisotón
// (o cubo de Rubik) → pierde un corazón. En la arena hay gafas, arcoíris y
// sombrero, y aparecen cubos de Rubik para atacarle.
// (generado con tools/gen-levels2.mjs; puede editarse a mano)
export const nivelFinal2: LevelData = {
  numero: 10,
  color: '#7b2cbf',
  tema: 'castillo',
  mapa: [
${mapa.map((f) => `    '${f}',`).join('\n')}
  ],
  puertas: { tipo: 'reto2', max: 9 },
  parMs: 180000,
  aviso: '🧙 ¡El MAGO OSCURO se teletransporta y lanza rayos! Sálvala otra vez',
}
`
  writeFileSync(join(dir, 'nivelfinal2.ts'), contenido, 'utf8')
  console.log('nivelfinal2.ts escrito')
}

for (const [n, def] of Object.entries(NIVELES)) {
  const numero = Math.min(Number(n), 25) // semilla visual, capada a los estilos
  const colorUi = ((Number(n) - 1) % 10) + 1
  const aviso =
    (def.tema ? `\n  tema: '${def.tema}',` : '') +
    (def.gravedadBaja ? '\n  gravedadBaja: true,' : '') +
    (def.aviso ? `\n  aviso: '${def.aviso}',` : '')
  const contenido = `import type { LevelData } from './types'

// Nivel ${n} (Mundo 2): ${def.comentario}
// (generado con tools/gen-levels2.mjs; puede editarse a mano)
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
