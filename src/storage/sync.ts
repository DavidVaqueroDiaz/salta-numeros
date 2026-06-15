// Sincroniza el progreso con el lanzador de PC (Salta Numeros.exe), que lo
// guarda en un fichero junto al exe vía /api/progreso. Si el juego corre sin
// lanzador (npm run dev, PWA…), simplemente no hace nada.

const CLAVES = [
  'salta-numeros-v1',
  'salta-numeros-medio-v1',
  'salta-numeros-dificil-v1',
  'salta-numeros-dificultad',
  'salta-numeros-ajustes',
  'salta-numeros-tutoriales',
  'salta-numeros-monedero',
  'salta-numeros-personajes',
] as const

type Volcado = Partial<Record<(typeof CLAVES)[number], string>>

function volcadoActual(): Volcado {
  const datos: Volcado = {}
  for (const clave of CLAVES) {
    const valor = localStorage.getItem(clave)
    if (valor !== null) datos[clave] = valor
  }
  return datos
}

/** Envía todo el progreso al lanzador. Devuelve si se guardó en fichero. */
export async function guardarEnFichero(): Promise<boolean> {
  try {
    const r = await fetch('/api/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(volcadoActual()),
    })
    return r.ok
  } catch {
    return false
  }
}

/** Igual que guardarEnFichero pero sin esperar (al cerrar la ventana). */
export function guardarEnFicheroAlCerrar(): void {
  try {
    navigator.sendBeacon(
      '/api/progreso',
      new Blob([JSON.stringify(volcadoActual())], { type: 'application/json' }),
    )
  } catch {
    // sin beacon: el guardado normal ya lo cubre
  }
}

interface NivelGuardado {
  stars: number
  bestMs: number
  completed: boolean
  coins?: number
}

/** Fusiona el progreso por niveles quedándose con lo mejor de cada uno. */
function fusionarNiveles(localRaw: string | null, ficheroRaw: string): string {
  const local: Record<string, NivelGuardado> = localRaw ? JSON.parse(localRaw) : {}
  const fichero: Record<string, NivelGuardado> = JSON.parse(ficheroRaw)
  const niveles = new Set([...Object.keys(local), ...Object.keys(fichero)])
  const resultado: Record<string, NivelGuardado> = {}
  for (const n of niveles) {
    const a = local[n]
    const b = fichero[n]
    if (!a) resultado[n] = b
    else if (!b) resultado[n] = a
    else {
      resultado[n] = {
        completed: a.completed || b.completed,
        stars: Math.max(a.stars, b.stars),
        bestMs: Math.min(a.bestMs, b.bestMs),
        coins: Math.max(a.coins ?? 0, b.coins ?? 0),
      }
    }
  }
  return JSON.stringify(resultado)
}

/**
 * Carga el fichero del lanzador y lo fusiona con lo que haya en el navegador
 * (nunca pierde nada: niveles a lo mejor de ambos, hucha al máximo, compras
 * unidas). Devuelve si había fichero.
 */
export async function cargarDesdeFichero(): Promise<boolean> {
  try {
    const r = await fetch('/api/progreso')
    if (!r.ok) return false
    const datos = (await r.json()) as Volcado
    // Progreso por niveles de cada modo: nos quedamos con lo mejor de ambos lados
    for (const clave of [
      'salta-numeros-v1',
      'salta-numeros-medio-v1',
      'salta-numeros-dificil-v1',
    ] as const) {
      if (datos[clave]) {
        localStorage.setItem(clave, fusionarNiveles(localStorage.getItem(clave), datos[clave]))
      }
    }
    const monederoFichero = Number(datos['salta-numeros-monedero'] ?? 0)
    const monederoLocal = Number(localStorage.getItem('salta-numeros-monedero') ?? 0)
    localStorage.setItem(
      'salta-numeros-monedero',
      String(Math.max(monederoFichero, monederoLocal)),
    )
    if (datos['salta-numeros-personajes']) {
      const f = JSON.parse(datos['salta-numeros-personajes'])
      const lRaw = localStorage.getItem('salta-numeros-personajes')
      const l = lRaw ? JSON.parse(lRaw) : { comprados: [1], equipado: 1 }
      const comprados = [...new Set([...(l.comprados ?? [1]), ...(f.comprados ?? [1])])]
      localStorage.setItem(
        'salta-numeros-personajes',
        JSON.stringify({ comprados, equipado: f.equipado ?? l.equipado ?? 1 }),
      )
    }
    // ajustes, tutoriales y modo elegido: el navegador manda si ya tiene algo
    for (const clave of [
      'salta-numeros-ajustes',
      'salta-numeros-tutoriales',
      'salta-numeros-dificultad',
    ] as const) {
      if (datos[clave] && localStorage.getItem(clave) === null) {
        localStorage.setItem(clave, datos[clave])
      }
    }
    return true
  } catch {
    return false
  }
}
