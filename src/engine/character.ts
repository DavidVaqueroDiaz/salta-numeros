// Dibujo de los personajes-número, inspirados en los Numberblocks (versión
// original propia): bloques apilados con cara y un rasgo único por número.
//   1 un solo ojo · 2 normal · 3 bolitas en la cabeza · 4 ojos cuadrados
//   5 pestañas · 6 puntos de dado · 7 bloques arcoíris y mechón
//   8 cejas y sonrisa pícara · 9 gris con ojazos · 10 blanco con gafas rojas

/** rectángulo de bloques cols×rows */
const rect = (cols: number, rows: number): [number, number][] => {
  const f: [number, number][] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) f.push([c, r])
  return f
}

/** Forma de cada número: pares [columna, fila], fila 0 = abajo. */
export const FORMAS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[0, 0], [0, 1]],
  3: [[0, 0], [0, 1], [0, 2]],
  4: rect(2, 2),
  5: rect(1, 5),
  6: rect(2, 3),
  7: [...rect(2, 3), [0, 3]],
  8: rect(2, 4),
  9: rect(3, 3),
  10: rect(2, 5),
  // 11-20: blancos con borde rojo (estilo "teens"), cada uno con su acento
  11: [...rect(2, 5), [0, 5]],
  12: rect(2, 6),
  13: [...rect(2, 5), [1, 5]],
  14: rect(2, 7),
  15: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [4, 2], [3, 3], [4, 3], [4, 4]], // escalera
  16: rect(4, 4),
  17: rect(2, 7),
  18: rect(2, 7),
  19: [...rect(1, 7), [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]], // gemelas desiguales
  20: rect(2, 7),
  // 21-25: crema con borde naranja (estilo "veintes")
  21: rect(3, 7),
  22: rect(2, 7),
  23: [...rect(2, 7), [2, 0]],
  24: rect(2, 7),
  25: rect(2, 7),
}

type Deco =
  | 'gafasVerdes'
  | 'gafasMoradas'
  | 'gafasAzules'
  | 'sombreroCopa'
  | 'gorroVerde'
  | 'manchas'
  | 'ojosCuadrados'

interface Estilo {
  base: string
  borde: string
  /** color especial de algunos bloques, por clave "col,fila" */
  acentos?: Record<string, string>
  deco?: Deco[]
}

const BLANCO = '#f8f9fa'
const ROJO = '#e63946'
const CREMA = '#ffe3b3'
const NARANJA = '#f77f00'

/** Aspecto de los números 11-25 (los 1-10 conservan su lógica propia). */
const ESTILOS: Record<number, Estilo> = {
  11: { base: BLANCO, borde: ROJO, acentos: { '0,5': '#e63946' } },
  12: { base: BLANCO, borde: ROJO, acentos: { '0,5': '#f77f00', '1,5': '#f77f00' } },
  13: { base: BLANCO, borde: ROJO, acentos: { '1,5': '#ffd60a' } },
  14: {
    base: BLANCO,
    borde: ROJO,
    acentos: { '0,6': '#2d9c46', '1,6': '#2d9c46' },
    deco: ['gafasVerdes'],
  },
  15: { base: BLANCO, borde: ROJO, acentos: { '4,4': '#4cc9f0' } },
  16: {
    base: BLANCO,
    borde: ROJO,
    acentos: { '0,0': '#5a189a', '3,0': '#5a189a' },
    deco: ['ojosCuadrados'],
  },
  17: {
    base: BLANCO,
    borde: ROJO,
    acentos: { '0,6': '#9d4edd', '1,6': '#4cc9f0' },
    deco: ['manchas'],
  },
  18: {
    base: BLANCO,
    borde: ROJO,
    acentos: {
      '1,0': '#ff5d8f', '1,1': '#ff5d8f', '1,2': '#ff5d8f', '1,3': '#ff5d8f',
      '1,4': '#ff5d8f', '1,5': '#ff5d8f', '1,6': '#ff5d8f',
    },
  },
  19: {
    base: BLANCO,
    borde: ROJO,
    acentos: {
      '1,0': '#adb5bd', '1,1': '#adb5bd', '1,2': '#adb5bd',
      '1,3': '#adb5bd', '1,4': '#adb5bd', '1,5': '#adb5bd',
    },
  },
  20: { base: BLANCO, borde: ROJO, deco: ['sombreroCopa', 'gafasMoradas'] },
  21: { base: CREMA, borde: NARANJA, deco: ['gorroVerde'] },
  22: { base: CREMA, borde: NARANJA, acentos: { '0,6': '#f77f00', '1,6': '#f77f00' } },
  23: { base: CREMA, borde: NARANJA, acentos: { '2,0': '#ffd60a' } },
  24: { base: CREMA, borde: NARANJA, acentos: { '0,3': '#2d9c46', '0,4': '#2d9c46' } },
  25: { base: CREMA, borde: NARANJA, deco: ['gafasAzules'] },
}

/** Color del cuerpo (el 7 usa el arcoíris por filas). */
export const COLOR_CUERPO: Record<number, string> = {
  1: '#e63946',
  2: '#f77f00',
  3: '#ffd60a',
  4: '#52b788',
  5: '#4cc9f0',
  6: '#3f37c9',
  7: '#3a86ff',
  8: '#ff5d8f',
  9: '#9aa5b1',
  10: '#f8f9fa',
}

const ARCOIRIS = ['#e63946', '#f77f00', '#ffd60a', '#52b788', '#4cc9f0', '#9d4edd', '#3a86ff']
const TINTA = '#1d3557'

export function oscurecer(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * factor)
  const g = Math.round(((n >> 8) & 255) * factor)
  const b = Math.round((n & 255) * factor)
  return `rgb(${r},${g},${b})`
}

/**
 * Dibuja el personaje del número con los pies en (cx, piesY).
 * Si no se pasa `bsFijo`, se escala para caber en una caja de 34×42.
 */
export function dibujarPersonaje(
  ctx: CanvasRenderingContext2D,
  numero: number,
  cx: number,
  piesY: number,
  mirando: 1 | -1 = 1,
  bsFijo?: number,
): void {
  const forma = FORMAS[numero] ?? FORMAS[1]
  const cols = Math.max(...forma.map(([c]) => c)) + 1
  const rows = Math.max(...forma.map(([, r]) => r)) + 1
  const bs = bsFijo ?? Math.min(34 / cols, 42 / rows)
  const totalW = cols * bs
  const baseX = cx - totalW / 2
  const estilo = ESTILOS[numero]
  const colorBase = estilo?.base ?? COLOR_CUERPO[numero] ?? COLOR_CUERPO[1]
  const esBlanco = numero === 10 || estilo?.base === BLANCO
  const borde = estilo?.borde ?? (esBlanco ? '#e63946' : oscurecer(colorBase, 0.7))
  const deco = estilo?.deco ?? []
  const u = bs / 16 // unidad para rasgos, relativa al tamaño de bloque

  // --- Piernas y brazos (finos, oscuros) ---
  ctx.strokeStyle = estilo
    ? oscurecer(estilo.borde, 0.85)
    : esBlanco
      ? '#c1121f'
      : oscurecer(colorBase, 0.55)
  ctx.lineWidth = Math.max(2, 2.4 * u)
  ctx.lineCap = 'round'
  const piernaAlt = Math.max(3, 3.5 * u)
  for (const lado of [-1, 1]) {
    const px = cx + lado * totalW * 0.28
    ctx.beginPath()
    ctx.moveTo(px, piesY - 2)
    ctx.lineTo(px, piesY)
    ctx.stroke()
    void piernaAlt
  }
  const brazoY = piesY - rows * bs * 0.45
  for (const lado of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + lado * totalW * 0.5, brazoY)
    ctx.lineTo(cx + lado * (totalW * 0.5 + 4.5 * u), brazoY + 4 * u)
    ctx.stroke()
  }

  // --- Bloques con juntas visibles ---
  for (const [c, r] of forma) {
    const bx = baseX + c * bs
    const by = piesY - (r + 1) * bs
    ctx.fillStyle =
      numero === 7
        ? ARCOIRIS[r % ARCOIRIS.length]
        : (estilo?.acentos?.[`${c},${r}`] ?? colorBase)
    ctx.beginPath()
    ctx.roundRect(bx + 0.5, by + 0.5, bs - 1, bs - 1, Math.max(1.5, 2 * u))
    ctx.fill()
    ctx.strokeStyle = borde
    ctx.lineWidth = Math.max(1, 1.3 * u)
    ctx.stroke()
    // puntos de dado del 6
    if (numero === 6) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(bx + bs / 2, by + bs / 2, Math.max(1.5, 2.4 * u), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // --- Cara en la fila superior ---
  const topRow = rows - 1
  const topBlocks = forma.filter(([, r]) => r === topRow)
  const cMin = Math.min(...topBlocks.map(([c]) => c))
  const cMax = Math.max(...topBlocks.map(([c]) => c))
  const caraCx = baseX + ((cMin + cMax + 1) * bs) / 2
  const caraTop = piesY - rows * bs
  const ojoY = caraTop + bs * 0.45
  const sep = Math.max(4, (cMax - cMin + 1) * bs * 0.22)
  const rOjo = Math.max(2.6, 3.2 * u)
  const rPupila = Math.max(1.3, 1.6 * u)
  const guino = mirando * 1.2 * u
  const colorGafas =
    numero === 10
      ? '#e63946'
      : deco.includes('gafasVerdes')
        ? '#2d9c46'
        : deco.includes('gafasMoradas')
          ? '#9d4edd'
          : deco.includes('gafasAzules')
            ? '#3a86ff'
            : null

  const dibujarOjoRedondo = (x: number): void => {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, ojoY, rOjo, 0, Math.PI * 2)
    ctx.fill()
    if (colorGafas) {
      ctx.strokeStyle = colorGafas
      ctx.lineWidth = Math.max(1.2, 1.6 * u)
      ctx.stroke()
    }
    ctx.fillStyle = TINTA
    ctx.beginPath()
    ctx.arc(x + guino, ojoY, rPupila, 0, Math.PI * 2)
    ctx.fill()
  }

  if (numero === 1) {
    // un único ojo grande
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(caraCx, ojoY, rOjo * 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = TINTA
    ctx.beginPath()
    ctx.arc(caraCx + guino, ojoY, rPupila * 1.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (numero === 4 || deco.includes('ojosCuadrados')) {
    // ojos cuadrados
    for (const lado of [-1, 1]) {
      const x = caraCx + lado * sep
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - rOjo, ojoY - rOjo, rOjo * 2, rOjo * 2)
      ctx.fillStyle = TINTA
      ctx.fillRect(x + guino - rPupila, ojoY - rPupila, rPupila * 2, rPupila * 2)
    }
  } else {
    dibujarOjoRedondo(caraCx - sep)
    dibujarOjoRedondo(caraCx + sep)
  }

  // pestañas del 5
  if (numero === 5) {
    ctx.strokeStyle = TINTA
    ctx.lineWidth = Math.max(1, 1.2 * u)
    for (const lado of [-1, 1]) {
      const x = caraCx + lado * sep
      for (const i of [-1, 0, 1]) {
        ctx.beginPath()
        ctx.moveTo(x + i * rOjo * 0.6, ojoY - rOjo)
        ctx.lineTo(x + i * rOjo * 0.8, ojoY - rOjo - 2.5 * u)
        ctx.stroke()
      }
    }
  }

  // puente de las gafas
  if (colorGafas) {
    ctx.strokeStyle = colorGafas
    ctx.lineWidth = Math.max(1.2, 1.6 * u)
    ctx.beginPath()
    ctx.moveTo(caraCx - sep + rOjo, ojoY)
    ctx.lineTo(caraCx + sep - rOjo, ojoY)
    ctx.stroke()
  }

  // cejas del 8
  if (numero === 8) {
    ctx.strokeStyle = TINTA
    ctx.lineWidth = Math.max(1.2, 1.6 * u)
    for (const lado of [-1, 1]) {
      const x = caraCx + lado * sep
      ctx.beginPath()
      ctx.moveTo(x - rOjo, ojoY - rOjo - 2 * u)
      ctx.lineTo(x + rOjo, ojoY - rOjo - 3.2 * u)
      ctx.stroke()
    }
  }

  // bolitas del 3 / mechón arcoíris del 7
  if (numero === 3) {
    ctx.fillStyle = '#f77f00'
    for (const i of [-1, 0, 1]) {
      ctx.beginPath()
      ctx.arc(caraCx + i * bs * 0.3, caraTop - 2 * u, Math.max(2, 2.6 * u), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (numero === 7) {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = ARCOIRIS[i + 1]
      ctx.lineWidth = Math.max(1.4, 1.8 * u)
      ctx.beginPath()
      ctx.moveTo(caraCx - 2 * u + i * 1.6 * u, caraTop)
      ctx.lineTo(caraCx - 4 * u + i * 2.6 * u, caraTop - 4.5 * u)
      ctx.stroke()
    }
  }

  // chistera morada del 20
  if (deco.includes('sombreroCopa')) {
    ctx.fillStyle = '#5a189a'
    ctx.fillRect(caraCx - 6 * u, caraTop - 9 * u, 12 * u, 9 * u)
    ctx.fillRect(caraCx - 8.5 * u, caraTop - 1.5 * u, 17 * u, 2 * u)
  }
  // gorro verde del 21
  if (deco.includes('gorroVerde')) {
    ctx.fillStyle = '#2d9c46'
    ctx.beginPath()
    ctx.arc(caraCx, caraTop + 0.5 * u, 7 * u, Math.PI, 2 * Math.PI)
    ctx.fill()
    ctx.fillRect(caraCx - 2 * u, caraTop - 1 * u, 10 * u, 2 * u) // visera
  }
  // manchas de pintura del 17
  if (deco.includes('manchas')) {
    const coloresMancha = ['#e63946', '#2d9c46', '#3a86ff', '#ffd60a']
    coloresMancha.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(
        baseX + totalW * (0.25 + 0.5 * ((i * 7) % 4) / 3),
        piesY - rows * bs * (0.25 + 0.18 * i),
        Math.max(1.5, 1.8 * u),
        0,
        Math.PI * 2,
      )
      ctx.fill()
    })
  }

  // --- Sonrisa ---
  ctx.strokeStyle = TINTA
  ctx.lineWidth = Math.max(1.2, 1.6 * u)
  ctx.beginPath()
  const bocaY = ojoY + bs * 0.22
  if (numero === 8) {
    ctx.arc(caraCx, bocaY, Math.max(2.5, 3.4 * u), 0.1 * Math.PI, 0.7 * Math.PI)
  } else {
    ctx.arc(caraCx, bocaY, Math.max(2.5, 3 * u), 0.15 * Math.PI, 0.85 * Math.PI)
  }
  ctx.stroke()
}
